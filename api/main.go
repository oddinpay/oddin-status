package main

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"log/slog"
	"maps"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	convex "github.com/inselfcontroll/convex-go"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
	"go.jetify.com/sse"
	"go.jetify.com/typeid/v2"
)

const (
	Host = "0.0.0.0"
	Port = "8976"

	// HTTP methods
	MethodGet     = "GET"
	MethodPost    = "POST"
	MethodPut     = "PUT"
	MethodDelete  = "DELETE"
	MethodPatch   = "PATCH"
	MethodOptions = "OPTIONS"

	// Content types
	ContentTypeJSON        = "application/json"
	ContentTypeEventStream = "text/event-stream"

	// HTTP State codes
	StatusOK                  = 200
	StatusCreated             = 201
	StatusNoContent           = 204
	StatusBadRequest          = 400
	StatusUnauthorized        = 401
	StatusNotFound            = 404
	StatusInternalServerError = 500
	StatusMethodNotAllowed    = 405
	StatusMultipleChoices     = 300

	// Common headers
	HeaderContentType  = "Content-Type"
	HeaderCacheControl = "Cache-Control"
	HeaderConnection   = "Connection"
	HeaderAllowOrigin  = "Access-Control-Allow-Origin"
	HeaderAllowMethods = "Access-Control-Allow-Methods"
	HeaderAllowHeaders = "Access-Control-Allow-Headers"

	defaultTimeout = 12 * time.Second
	days90         = 90
)

// ----------- DB / CACHE CONNECTIONS -----------

var (
	jwt              = os.Getenv("NATS_JWT")
	seed             = os.Getenv("NATS_SEED")
	serverURL        = os.Getenv("NATS_URL")
	userAgent        = os.Getenv("USER_AGENT")
	convexClient     = convex.NewClient(os.Getenv("CONVEX_DB_URL"), nil)
	monitorStartTime = time.Now().UTC().Truncate(24 * time.Hour)
	probeManagerOnce sync.Once
	hr               = HealthResponse{Down: "down", Up: "up", Warn: "warn"}
	nc               *nats.Conn
	wg               sync.WaitGroup
	js               jetstream.JetStream
	kv               jetstream.KeyValue
	httpClient       = &http.Client{
		Timeout: defaultTimeout,
		Transport: &http.Transport{
			DialContext: (&net.Dialer{
				Timeout:   defaultTimeout,
				KeepAlive: 30 * time.Second,
			}).DialContext,
			TLSHandshakeTimeout:   defaultTimeout,
			ResponseHeaderTimeout: defaultTimeout,
			IdleConnTimeout:       90 * time.Second,
			MaxIdleConns:          200,
			MaxIdleConnsPerHost:   20,
		},
	}
)

// -------------------- GLOBAL SLA MAP --------------------

var targetCache = struct {
	sync.RWMutex
	targets []HttpRequest
	lookup  map[string]int
}{
	lookup: make(map[string]int),
}

var slaTrackers = struct {
	sync.Mutex
	m map[string]*SlidingSLA
}{m: make(map[string]*SlidingSLA)}

func fetchTargets(ctx context.Context) []HttpRequest {

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	type Status struct {
		ID       string `json:"_id"`
		Name     string `json:"name"`
		Protocol string `json:"protocol"`
		Host     string `json:"host"`
		Interval int64  `json:"interval"`
	}

	args := map[string]any{
		"apiKey": os.Getenv("API_KEY"),
	}

	statuses, err := convex.Query[[]Status](ctx, convexClient, "status:get", args)

	if err != nil {
		if convexErr, ok := convex.IsConvexError(err); ok {
			slog.Error("Convex error", "message", convexErr.Message)
		} else {
			slog.Error("Request failed", "error", err)
		}
	}

	raw := []HttpRequest{}
	for _, u := range statuses {
		raw = append(raw, HttpRequest{
			ID:       u.ID,
			Name:     u.Name,
			Protocol: u.Protocol,
			Host:     u.Host,
			Interval: time.Duration(u.Interval) * time.Second,
		})
	}

	out := make([]HttpRequest, 0, len(raw))
	counts := make(map[string]int)

	for _, r := range raw {
		name := r.Name
		counts[name]++
		if counts[name] > 1 {
			r.Name = fmt.Sprintf("%s-%d", name, counts[name])

		}
		out = append(out, r)
	}
	return out
}

func refreshCache(ctx context.Context) {
	targets := fetchTargets(ctx)

	targetCache.Lock()
	targetCache.targets = targets
	targetCache.lookup = make(map[string]int)
	for i, t := range targets {
		targetCache.lookup[t.Name] = i
	}
	targetCache.Unlock()
	slog.Debug("Target cache refreshed", "count", len(targets))
}

// -------------------- MODELS --------------------

type HttpRequest struct {
	ID       string        `json:"id,omitempty"`
	Host     string        `json:"host,omitempty"`
	Protocol string        `json:"protocol,omitempty"`
	Interval time.Duration `json:"interval,omitempty"`
	Name     string        `json:"name,omitempty"`
	Username string        `json:"username,omitempty"`
	Password string        `json:"password,omitempty"`
}

type HealthResponse struct {
	Down string `json:"down"`
	Up   string `json:"up"`
	Warn string `json:"warn"`
}

type ProbeResult struct {
	Id          string   `json:"id,omitempty"`
	Name        string   `json:"name,omitempty"`
	Protocol    string   `json:"protocol,omitempty"`
	State       []string `json:"state,omitempty"`
	Description string   `json:"description,omitempty"`
	Date        []string `json:"date,omitempty"`
	Timestamp   string   `json:"timestamp,omitempty"`
}

type ProbeResponse struct {
	Index   int           `json:"index"`
	Payload StatusPayload `json:"payload"`
}

type StatusPayload struct {
	Probe ProbeResult    `json:"probe"`
	SLA   map[string]any `json:"sla"`
}

type ErrorResponse struct {
	State   []string `json:"state"`
	Message string   `json:"message"`
}

type bucket struct{ totalSec, downSec int64 }

type SlidingSLA struct {
	Target        float64
	buckets       []bucket
	idx           int
	currentMinute time.Time
	lastUpdate    time.Time
	mu            sync.Mutex
}

// -------------------- RECOVERY --------------------

func recoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("Recovered from panic: %v\n", rec)
				if w.Header().Get(HeaderContentType) == "" {
					w.Header().Set(HeaderContentType, ContentTypeJSON)
				}
				w.WriteHeader(StatusInternalServerError)
				_ = json.NewEncoder(w).Encode(ErrorResponse{
					State:   []string{"error"},
					Message: "internal server error",
				})
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func parseDurationToSecs(s string) int64 {
	var total int64
	parts := strings.FieldsSeq(s)
	for part := range parts {
		var val int64
		if strings.HasSuffix(part, "d") {
			fmt.Sscanf(part, "%dd", &val)
			total += val * 86400
		} else if strings.HasSuffix(part, "h") {
			fmt.Sscanf(part, "%dh", &val)
			total += val * 3600
		} else if strings.HasSuffix(part, "m") {
			fmt.Sscanf(part, "%dm", &val)
			total += val * 60
		} else if strings.HasSuffix(part, "s") {
			fmt.Sscanf(part, "%ds", &val)
			total += val
		}
	}
	return total
}

func formatDurationFull(seconds int64) string {
	days := seconds / 86400
	seconds %= 86400
	hours := seconds / 3600
	seconds %= 3600
	minutes := seconds / 60
	seconds %= 60

	parts := []string{}
	if days > 0 {
		parts = append(parts, fmt.Sprintf("%dd", days))
	}
	if hours > 0 {
		parts = append(parts, fmt.Sprintf("%dh", hours))
	}
	if minutes > 0 {
		parts = append(parts, fmt.Sprintf("%dm", minutes))
	}
	if seconds > 0 || len(parts) == 0 {
		parts = append(parts, fmt.Sprintf("%ds", seconds))
	}

	return strings.Join(parts, " ")
}

func getRecentDates() []string {
	return []string{time.Now().UTC().Format("02/01/2006")}
}

// -------------------- BROADCAST HUB --------------------

type Hub struct {
	sync.RWMutex
	clients map[chan map[string]StatusPayload]struct{}
	cache   map[string]StatusPayload
}

var globalHub = &Hub{
	clients: make(map[chan map[string]StatusPayload]struct{}),
	cache:   make(map[string]StatusPayload),
}

func (h *Hub) Broadcast(update map[string]StatusPayload) {
	h.Lock()
	defer h.Unlock()

	for id, payload := range update {
		if len(payload.Probe.State) > 0 && payload.Probe.State[0] == "deleted" {
			delete(h.cache, id)
		} else {
			h.cache[id] = payload
		}
	}

	for clientChan := range h.clients {
		select {
		case clientChan <- update:
		default:
		}
	}
}

func slaId() string {
	slaId := typeid.MustGenerate("sla")
	return slaId.String()
}

// -------------------- PROBES --------------------

func probeHTTP(re HttpRequest) ProbeResult {

	url := fmt.Sprintf("%s://%s", re.Protocol, re.Host)

	maxRetries := 3

	if userAgent == "" {
		userAgent = "OddinStatus/1.0"
	}

	for attempt := 1; attempt <= maxRetries; attempt++ {

		ctx, cancel := context.WithTimeout(context.Background(), defaultTimeout)

		req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			cancel()
			slog.Error("Failed to create HTTP request", "error", err)
			continue
		}

		req.Header.Set("User-Agent", userAgent)

		resp, err := httpClient.Do(req)

		if err != nil {
			cancel()

			if attempt < maxRetries {
				time.Sleep(200 * time.Millisecond)
				continue
			}

			return ProbeResult{
				Name:        re.Name,
				Protocol:    strings.ToUpper(re.Protocol),
				Description: fmt.Sprintf("%s - %s", re.Host, err.Error()),
				Timestamp:   time.Now().Format("15:04:05.000"),
				Date:        getRecentDates(),
				State:       []string{hr.Down},
			}
		}

		resp.Body.Close()
		cancel()

		if resp.StatusCode >= StatusOK && resp.StatusCode < StatusBadRequest {
			return ProbeResult{
				Name:        re.Name,
				Protocol:    strings.ToUpper(re.Protocol),
				Description: fmt.Sprintf("%s - %d", re.Host, resp.StatusCode),
				Timestamp:   time.Now().Format("15:04:05.000"),
				Date:        getRecentDates(),
				State:       []string{hr.Up},
			}
		}

		if attempt < maxRetries {
			time.Sleep(200 * time.Millisecond)
			continue
		}

		return ProbeResult{
			Name:        re.Name,
			Protocol:    strings.ToUpper(re.Protocol),
			Description: fmt.Sprintf("%s - %d", re.Host, resp.StatusCode),
			Timestamp:   time.Now().Format("15:04:05.000"),
			Date:        getRecentDates(),
			State:       []string{hr.Down},
		}
	}

	return ProbeResult{}
}

func probeTCP(req HttpRequest) ProbeResult {
	maxRetries := 3

	for attempt := 1; attempt <= maxRetries; attempt++ {
		conn, err := net.DialTimeout("tcp", req.Host, defaultTimeout)
		if err != nil {
			if attempt < maxRetries {
				time.Sleep(200 * time.Millisecond)
				continue
			}
			return ProbeResult{
				Name:        req.Name,
				Protocol:    strings.ToUpper(req.Protocol),
				Description: err.Error(),
				Timestamp:   time.Now().Format("15:04:05.000"),
				Date:        getRecentDates(),
				State:       []string{hr.Down},
			}
		}

		_, err = conn.Write([]byte("ping\n"))
		if err != nil {
			conn.Close()
			if attempt < maxRetries {
				time.Sleep(200 * time.Millisecond)
				continue
			}
			return ProbeResult{
				Name:        req.Name,
				Protocol:    strings.ToUpper(req.Protocol),
				Description: "write failed: " + err.Error(),
				Timestamp:   time.Now().Format("15:04:05.000"),
				Date:        getRecentDates(),
				State:       []string{hr.Down},
			}
		}

		buf := make([]byte, 64)
		_ = conn.SetReadDeadline(time.Now().Add(1 * time.Second))
		n, err := conn.Read(buf)
		conn.Close()

		if err != nil || n == 0 {
			if attempt < maxRetries {
				time.Sleep(200 * time.Millisecond)
				continue
			}
			return ProbeResult{
				Name:        req.Name,
				Protocol:    strings.ToUpper(req.Protocol),
				Description: "no response after connect",
				Timestamp:   time.Now().Format("15:04:05.000"),
				Date:        getRecentDates(),
				State:       []string{hr.Down},
			}
		}

		return ProbeResult{
			Name:        req.Name,
			Protocol:    strings.ToUpper(req.Protocol),
			Description: fmt.Sprintf("response received %s", strings.TrimSpace(string(buf[:n]))),
			Timestamp:   time.Now().Format("15:04:05.000"),
			Date:        getRecentDates(),
			State:       []string{hr.Up},
		}
	}

	return ProbeResult{}
}

func probeDNS(req HttpRequest) ProbeResult {
	maxRetries := 3

	if net.ParseIP(req.Host) != nil {
		return ProbeResult{
			Name:        req.Name,
			Protocol:    strings.ToUpper(req.Protocol),
			Description: "Input is already an IP, DNS lookup skipped",
			Timestamp:   time.Now().Format("15:04:05.000"),
			Date:        getRecentDates(),
			State:       []string{hr.Warn},
		}
	}

	for attempt := 1; attempt <= maxRetries; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), defaultTimeout)
		addrs, err := net.DefaultResolver.LookupHost(ctx, req.Host)
		cancel()

		if err != nil {
			if attempt < maxRetries {
				time.Sleep(200 * time.Millisecond)
				continue
			}
			return ProbeResult{
				Name:        req.Name,
				Protocol:    strings.ToUpper(req.Protocol),
				Description: fmt.Sprintf("DNS error: %s", err.Error()),
				Timestamp:   time.Now().Format("15:04:05.000"),
				Date:        getRecentDates(),
				State:       []string{hr.Down},
			}
		}

		return ProbeResult{
			Name:        req.Name,
			Protocol:    strings.ToUpper(req.Protocol),
			Description: fmt.Sprintf("resolved %v", addrs),
			Timestamp:   time.Now().Format("15:04:05.000"),
			Date:        getRecentDates(),
			State:       []string{hr.Up},
		}
	}

	return ProbeResult{}
}

// -------------------- 90-DAY SLA --------------------

func NewSlidingSLA(target float64) *SlidingSLA {
	now := time.Now()
	return &SlidingSLA{
		Target:        target,
		buckets:       make([]bucket, days90),
		currentMinute: now.Truncate(24 * time.Hour),
		lastUpdate:    now,
	}
}

func (s *SlidingSLA) SetState(totalSec, downSec int64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.buckets[s.idx].totalSec = totalSec
	s.buckets[s.idx].downSec = downSec
}

func (s *SlidingSLA) rotateTo(now time.Time) {
	minNow := now.Truncate(24 * time.Hour)
	if !minNow.After(s.currentMinute) {
		return
	}
	steps := int(minNow.Sub(s.currentMinute) / (24 * time.Hour))
	if steps > days90 {
		for i := range s.buckets {
			s.buckets[i] = bucket{}
		}
		s.idx = 0
		s.currentMinute = minNow
		return
	}
	for range steps {
		s.idx++
		if s.idx >= len(s.buckets) {
			s.idx = 0
		}
		s.buckets[s.idx] = bucket{}
	}
	s.currentMinute = minNow
}

func (s *SlidingSLA) Tick(isDown bool, interval time.Duration) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	s.rotateTo(now)

	inc := int64(interval.Round(time.Second).Seconds())

	s.buckets[s.idx].totalSec += inc
	if isDown {
		s.buckets[s.idx].downSec += inc
	}
	s.lastUpdate = now
}

func (s *SlidingSLA) Snapshot() map[string]any {
	s.mu.Lock()
	defer s.mu.Unlock()

	var total, down int64
	for _, b := range s.buckets {
		total += b.totalSec
		down += b.downSec
	}

	if total <= 0 {
		return map[string]any{
			"id":                 "",
			"sla_target":         "99.999%",
			"uptime90":           "99.999%",
			"up_time_seconds":    formatDurationFull(0),
			"down_time_seconds":  formatDurationFull(0),
			"total_time_seconds": formatDurationFull(0),
			"sla_breached":       false,
		}
	}

	availability := 1.0 - (float64(down) / float64(total))
	percent := availability * 100

	uptimeStr := fmt.Sprintf("%.3f%%", percent)
	if down > 0 && uptimeStr == "99.999%" {
		uptimeStr = "99.999%"
	}

	breached := (s.Target >= 1.0 && down > 0) || (availability < s.Target)
	up := total - down

	return map[string]any{
		"id":                 "",
		"sla_target":         "99.999%",
		"uptime90":           uptimeStr,
		"up_time_seconds":    formatDurationFull(up),
		"down_time_seconds":  formatDurationFull(down),
		"total_time_seconds": formatDurationFull(total),
		"sla_breached":       breached,
	}
}

func (s *SlidingSLA) Reset() {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.buckets {
		s.buckets[i] = bucket{}
	}
	s.idx = 0
	s.currentMinute = time.Now().Truncate(time.Minute)
	s.lastUpdate = time.Now()
}

func startProbeWorker(ctx context.Context, wg *sync.WaitGroup, t HttpRequest) {
	defer wg.Done()

	var probeFn func(HttpRequest) ProbeResult
	switch strings.ToLower(strings.TrimSpace(t.Protocol)) {
	case "tcp":
		probeFn = probeTCP
	case "dns":
		probeFn = probeDNS
	default:
		probeFn = probeHTTP
	}

	slaTrackers.Lock()
	tracker := NewSlidingSLA(0.99999)
	slaTrackers.m[t.Name] = tracker

	existingData := readFromNATS(t.Name)
	if existingData != nil {
		var wrapped map[string]any
		if err := json.Unmarshal(existingData, &wrapped); err == nil {
			if p, ok := wrapped["payload"].(map[string]any); ok {
				if sla, ok := p["sla"].(map[string]any); ok {
					if history, ok := sla["history"].([]any); ok && len(history) > 0 {
						first := history[0].(map[string]any)
						tSec := parseDurationToSecs(first["total_time_seconds"].(string))
						dSec := parseDurationToSecs(first["down_time_seconds"].(string))
						tracker.SetState(tSec, dSec)
						slog.Info("Hydrated existing state", "name", t.Name, "uptime", first["uptime90"])
					}
				}
			}
		}
	}
	slaTrackers.Unlock()

	ticker := time.NewTicker(t.Interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			slog.Info("Stopping probe worker", "name", t.Name)
			return
		case <-ticker.C:
			res := probeFn(t)

			slaTrackers.Lock()
			isDown := len(res.State) > 0 && strings.ToLower(res.State[0]) == hr.Down
			tracker.Tick(isDown, t.Interval)
			payload := StatusPayload{Probe: res, SLA: tracker.Snapshot()}
			slaTrackers.Unlock()

			publishToNATS(ctx, t.Name, &payload, tracker)
			globalHub.Broadcast(map[string]StatusPayload{t.Name: payload})
		}
	}
}

func startProbeManager(ctx context.Context, wg *sync.WaitGroup) {
	slog.Info("Starting dynamic probe manager...")

	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		runningTargets := make(map[string]HttpRequest)
		probeCancels := make(map[string]context.CancelFunc)

		for {
			refreshCache(ctx)
			targetCache.RLock()
			targets := targetCache.targets
			targetCache.RUnlock()

			slaTrackers.Lock()
			for id, running := range runningTargets {
				var updated HttpRequest
				var found bool
				for _, t := range targets {
					if t.ID == id {
						found = true
						updated = t
						break
					}
				}

				if !found {
					slog.Info("Target deleted from Convex, stopping worker", "name", id)
					if cancel, ok := probeCancels[id]; ok {
						cancel()
						delete(probeCancels, id)
					}

					globalHub.Broadcast(map[string]StatusPayload{
						id: {Probe: ProbeResult{Name: id, State: []string{"deleted"}}},
					})

					delete(slaTrackers.m, id)
					delete(runningTargets, id)
					kv.Delete(ctx, id)

					targetCache.Lock()
					delete(targetCache.lookup, id)
					targetCache.Unlock()

				} else if running.Host != updated.Host || running.Protocol != updated.Protocol || running.Name != updated.Name {

					slog.Info("Target updated, restarting worker", "name", id)

					if cancel, ok := probeCancels[id]; ok {
						cancel()
					}

					probeCtx, cancel := context.WithCancel(ctx)
					probeCancels[id] = cancel
					wg.Add(1)
					go startProbeWorker(probeCtx, wg, updated)

					runningTargets[id] = updated

					globalHub.Broadcast(map[string]StatusPayload{
						id: {Probe: ProbeResult{Name: id, State: []string{"updated"}}},
					})

				}
			}
			slaTrackers.Unlock()

			for _, t := range targets {
				if _, ok := runningTargets[t.ID]; !ok {
					probeCtx, cancel := context.WithCancel(ctx)
					probeCancels[t.ID] = cancel

					wg.Add(1)
					go startProbeWorker(probeCtx, wg, t)

					runningTargets[t.ID] = t
				}
			}

			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
			}
		}
	}()
}

// -------------------- SSE HANDLER --------------------

func Sse(w http.ResponseWriter, r *http.Request) {

	ctx := r.Context()

	// SSE headers
	w.Header().Set(HeaderAllowOrigin, "*")
	w.Header().Set(HeaderCacheControl, "no-cache")
	w.Header().Set(HeaderConnection, "keep-alive")
	w.Header().Set(HeaderContentType, ContentTypeEventStream)

	conn, err := sse.Upgrade(ctx, w)
	if err != nil {
		http.Error(w, err.Error(), StatusInternalServerError)
		return
	}
	defer conn.Close()

	clientChan := make(chan map[string]StatusPayload, 200)

	globalHub.Lock()
	globalHub.clients[clientChan] = struct{}{}

	initialData := make(map[string]StatusPayload)
	maps.Copy(initialData, globalHub.cache)

	globalHub.Unlock()

	if len(initialData) > 0 {
		sendUpdateToConn(ctx, conn, initialData)
	}

	defer func() {
		globalHub.Lock()
		delete(globalHub.clients, clientChan)
		globalHub.Unlock()
	}()

	for {
		select {
		case <-ctx.Done():
			return
		case update := <-clientChan:

			targetCache.RLock()
			lookup := targetCache.lookup
			targetCache.RUnlock()

			for id, payload := range update {

				idx, found := lookup[id]

				out := map[string]any{
					"index": idx,
					"payload": map[string]any{
						"probe": payload.Probe,
						"sla":   payload.SLA,
					},
				}

				if found && len(payload.Probe.State) > 0 && payload.Probe.State[0] == "deleted" {
					out["deleted"] = true
				} else if !found {
					out["updated"] = true
				}

				if err := conn.SendData(ctx, out); err != nil {
					return
				}
			}
		}
	}
}

func sendUpdateToConn(ctx context.Context, conn *sse.Conn, update map[string]StatusPayload) error {

	targetCache.RLock()
	lookup := targetCache.lookup
	targetCache.RUnlock()

	for id, payload := range update {

		idx, found := lookup[id]

		out := map[string]any{
			"index": idx,
			"payload": map[string]any{
				"probe": payload.Probe,
				"sla":   payload.SLA,
			},
		}

		if found && len(payload.Probe.State) > 0 && payload.Probe.State[0] == "deleted" {
			out["deleted"] = true
		} else if !found {
			out["updated"] = true
		}

		if err := conn.SendData(ctx, out); err != nil {
			return err
		}
	}
	return nil
}

// -------------------- SLA RESET HANDLER --------------------

func ResetHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != MethodGet {
		http.Error(w, "Method not allowed", StatusMethodNotAllowed)
		return
	}

	w.Header().Set(HeaderContentType, ContentTypeJSON)

	name := r.URL.Query().Get("name")
	empty := r.URL.Query().Get("empty") == "true"

	slaTrackers.Lock()
	if name != "" {
		if tracker, ok := slaTrackers.m[name]; ok {
			tracker.Reset()
		}
	} else {
		for _, tracker := range slaTrackers.m {
			tracker.Reset()
		}
	}
	slaTrackers.Unlock()

	if empty {
		w.WriteHeader(StatusNoContent)
	}

	w.WriteHeader(StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"sla_reset": true,
		"probe":     name,
	})
}

func CreatePage(w http.ResponseWriter, r *http.Request) {
	if r.Method != MethodPost {
		http.Error(w, "Method not allowed", StatusMethodNotAllowed)
		return
	}
}

func publishToNATS(ctx context.Context, name string, payload *StatusPayload, s *SlidingSLA) {
	if nc.Status() != nats.CONNECTED {
		slog.Error("NATS not connected")
		return
	}

	now := time.Now().UTC()

	// 2-minute block
	// intervalBlock := (now.Minute() / 1) * 1
	// todayUTC := fmt.Sprintf("%s %02d:%02d", now.Format("02/01/2006"), now.Hour(), intervalBlock)

	// Daily block
	todayUTC := now.Format("02/01/2006")

	currentStatus := hr.Warn
	if len(payload.Probe.State) > 0 {
		currentStatus = payload.Probe.State[0]
	}

	for range 3 {
		entry, getErr := kv.Get(ctx, name)
		var revision uint64 = 0
		var oldPayload StatusPayload

		if getErr == nil {
			revision = entry.Revision()
			gr, err := gzip.NewReader(bytes.NewReader(entry.Value()))
			if err == nil {
				decomp, _ := io.ReadAll(gr)
				gr.Close()

				var wrapped map[string]any
				json.Unmarshal(decomp, &wrapped)
				if p, ok := wrapped["payload"].(map[string]any); ok {

					existingProbeID, _ := p["probe"].(map[string]any)["id"].(string)
					existingSlaID, _ := p["sla"].(map[string]any)["id"].(string)

					if existingProbeID != "" {
						payload.Probe.Id = existingProbeID
					}
					if existingSlaID != "" {
						payload.SLA["id"] = existingSlaID
					}

					pBytes, _ := json.Marshal(p)
					json.Unmarshal(pBytes, &oldPayload)
				}
				gr.Close()
			}
		}

		if payload.Probe.Id == "" {
			targetCache.RLock()
			for _, t := range targetCache.targets {
				if t.Name == name {
					payload.Probe.Id = t.ID
					break
				}
			}
			targetCache.RUnlock()
		}
		if payload.SLA["id"] == nil || payload.SLA["id"] == "" {
			payload.SLA["id"] = slaId()
		}

		if getErr == nil && len(oldPayload.Probe.Date) > 0 {
			if oldPayload.Probe.Date[0] == todayUTC {
				payload.SLA["history"] = oldPayload.SLA["history"]
				payload.Probe.Date = oldPayload.Probe.Date
				payload.Probe.State = oldPayload.Probe.State

				if len(payload.Probe.State) > 0 {
					payload.Probe.State[0] = currentStatus
				} else {
					payload.Probe.State = []string{currentStatus}
				}

				if h, ok := payload.SLA["history"].([]any); ok && len(h) > 0 {
					h[0] = map[string]any{
						"sla_breached":       payload.SLA["sla_breached"],
						"sla_target":         fmt.Sprintf("%.3f%%", s.Target*100),
						"total_time_seconds": payload.SLA["total_time_seconds"],
						"up_time_seconds":    payload.SLA["up_time_seconds"],
						"down_time_seconds":  payload.SLA["down_time_seconds"],
						"uptime90":           payload.SLA["uptime90"],
					}
				}
			} else {
				s.Reset()
				freshSLA := s.Snapshot()
				newSnapshot := map[string]any{
					"sla_breached":       freshSLA["sla_breached"],
					"sla_target":         fmt.Sprintf("%.3f%%", s.Target*100),
					"total_time_seconds": freshSLA["total_time_seconds"],
					"up_time_seconds":    freshSLA["up_time_seconds"],
					"down_time_seconds":  freshSLA["down_time_seconds"],
					"uptime90":           freshSLA["uptime90"],
				}
				if oldHist, ok := oldPayload.SLA["history"].([]any); ok {
					payload.SLA["history"] = append([]any{newSnapshot}, oldHist...)
				}
				payload.Probe.Date = append([]string{todayUTC}, oldPayload.Probe.Date...)
				payload.Probe.State = append([]string{currentStatus}, oldPayload.Probe.State...)
			}
		} else {
			payload.SLA["history"] = []any{map[string]any{
				"sla_breached":       payload.SLA["sla_breached"],
				"sla_target":         fmt.Sprintf("%.3f%%", s.Target*100),
				"total_time_seconds": payload.SLA["total_time_seconds"],
				"up_time_seconds":    payload.SLA["up_time_seconds"],
				"down_time_seconds":  payload.SLA["down_time_seconds"],
				"uptime90":           payload.SLA["uptime90"],
			}}
			payload.Probe.Date = []string{todayUTC}
		}

		payload.Probe.State = capSlice(payload.Probe.State, 90)
		payload.Probe.Date = capSlice(payload.Probe.Date, 90)
		if h, ok := payload.SLA["history"].([]any); ok {
			payload.SLA["history"] = capSlice(h, 90)
		}

		var rootTotal, rootDown int64
		if h, ok := payload.SLA["history"].([]any); ok {
			for _, hEntry := range h {
				if m, ok := hEntry.(map[string]any); ok {
					rootTotal += parseDurationToSecs(m["total_time_seconds"].(string))
					rootDown += parseDurationToSecs(m["down_time_seconds"].(string))
				}
			}
		}

		rootUp := rootTotal - rootDown
		rootAvail := 1.0
		if rootTotal > 0 {
			rootAvail = 1.0 - (float64(rootDown) / float64(rootTotal))
		}
		payload.SLA["total_time_seconds"] = formatDurationFull(rootTotal)
		payload.SLA["down_time_seconds"] = formatDurationFull(rootDown)
		payload.SLA["up_time_seconds"] = formatDurationFull(rootUp)
		payload.SLA["uptime90"] = fmt.Sprintf("%.3f%%", rootAvail*100)
		payload.SLA["sla_breached"] = (s.Target >= 1.0 && rootDown > 0) || (rootAvail < s.Target)

		idx := -1

		targetCache.RLock()
		i, ok := targetCache.lookup[name]
		targetCache.RUnlock()

		if ok {
			idx = i
		}

		wrappedPayload := map[string]any{
			"index": idx,
			"payload": map[string]any{
				"probe": payload.Probe,
				"sla":   payload.SLA,
			},
		}

		jsonData, _ := json.Marshal(wrappedPayload)
		var buf bytes.Buffer
		gz := gzip.NewWriter(&buf)
		gz.Write(jsonData)
		gz.Close()

		var updateErr error
		if revision > 0 {
			_, updateErr = kv.Update(ctx, name, buf.Bytes(), revision)
		} else {
			_, updateErr = kv.Create(ctx, name, buf.Bytes())
		}

		if updateErr == nil {
			return
		}
		time.Sleep(50 * time.Millisecond)
	}
}

func capSlice[T any](s []T, max int) []T {
	if len(s) > max {
		return s[:max]
	}
	return s
}

func readFromNATS(name string) []byte {

	if nc.Status() != nats.CONNECTED {
		slog.Error("NATS not connected")
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	kv, err := js.KeyValue(ctx, "BEEP_STATUS")
	if err != nil {
		slog.Error("Failed to access KV bucket", "error", err)
		return nil
	}

	entry, err := kv.Get(ctx, name)
	if err != nil {
		slog.Error("Failed to get entry", "key", name, "error", err)
		return nil
	}

	reader, err := gzip.NewReader(bytes.NewReader(entry.Value()))
	if err != nil {
		slog.Error("Gzip reader error", "error", err)
		return nil
	}
	defer reader.Close()

	decompressed, err := io.ReadAll(reader)
	if err != nil {
		slog.Error("Decompression failed", "error", err)
		return nil
	}

	var wrapped map[string]any
	if err := json.Unmarshal(decompressed, &wrapped); err != nil {
		slog.Error("Unmarshal failed", "error", err)
		return nil
	}

	wrappedData, err := json.Marshal(wrapped)
	if err != nil {
		slog.Error("Marshal failed", "error", err)
		return nil
	}

	return wrappedData

}

func HistoryHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set(HeaderContentType, ContentTypeJSON)

	name := r.URL.Query().Get("name")
	history := readFromNATS(name)

	if history == nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(history))

}

// -------------------- MAIN --------------------
func main() {

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	var err error

	nc, err = nats.Connect(
		serverURL,
		nats.UserJWTAndSeed(jwt, seed),
		nats.MaxReconnects(-1),
		nats.ReconnectWait(5*time.Second),
		nats.Timeout(10*time.Second),
		nats.PingInterval(20*time.Second),
		nats.MaxPingsOutstanding(5),
		nats.DisconnectErrHandler(func(nc *nats.Conn, err error) {
			slog.Warn("Disconnected from NATS", "error", err)
		}),
		nats.ReconnectHandler(func(nc *nats.Conn) {
			slog.Info("Reconnected to NATS", "url", nc.ConnectedUrl())
		}),
		nats.ClosedHandler(func(nc *nats.Conn) {
			slog.Error("NATS connection permanently closed")
		}),
	)

	if err != nil {
		slog.Error("Failed to connect to NATS", "error", err)
		os.Exit(1)
	}

	slog.Info("Connected to NATS", "url", serverURL)

	js, err = jetstream.New(nc)

	if err != nil {
		slog.Error("JetStream context error", "error", err)
		os.Exit(1)
	}

	kv, err = js.KeyValue(context.Background(), "BEEP_STATUS")
	if err != nil {
		kv, err = js.CreateKeyValue(context.Background(), jetstream.KeyValueConfig{
			Bucket:   "BEEP_STATUS",
			MaxBytes: 1024 * 1024 * 50,
		})

		if err != nil {
			slog.Error("Failed to create KV bucket", "error", err)
			os.Exit(1)
		}
	}

	startProbeManager(ctx, &wg)

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/sse", Sse)
	// mux.HandleFunc("GET /v1/status/history", HistoryHandler)
	// mux.HandleFunc("GET /ping", func(w http.ResponseWriter, r *http.Request) {
	// 	w.WriteHeader(http.StatusOK)
	// 	w.Write([]byte("pong"))
	// })

	originPolicy := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		host := strings.Split(r.Host, ":")[0]
		if host != os.Getenv("HOST") {
			w.WriteHeader(http.StatusForbidden)
			w.Write([]byte("403 prohibited"))
			return
		}
		recoveryMiddleware(mux).ServeHTTP(w, r)
	})

	server := &http.Server{
		Addr:    fmt.Sprintf("%s:%s", Host, Port),
		Handler: originPolicy,
	}

	go func() {
		slog.Info("Oddin status API server running", "url", fmt.Sprintf("http://%s:%s", Host, Port))
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			slog.Error("Server failed to start", "error", err)
			stop()
		}
	}()

	slog.Info("Oddin status is now active and monitoring services.")

	<-ctx.Done()

	slog.Info("Shutdown signal received. Cleaning up...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 40*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		slog.Error("Server shutdown error", "error", err)
	}

	wg.Wait()

	if nc != nil {
		slog.Info("Flushing NATS buffers...")
		if err := nc.Flush(); err != nil {
			slog.Error("NATS flush error", "error", err)
		}
		nc.Close()
		slog.Info("NATS connection closed")
	}

	slog.Info("Shutdown complete. Exiting.")
	os.Exit(0)
}
