<div align="center">

# ohstatus

</div>

<br>

<a href="https://oddinpay.com">![](https://cdn.oddinpay.com/ohstatus-cover.png)</a>

Beautiful status page & uptime monitor. Ready for production out of the box. Easily deploy to Cloudflare in just one click.

## ✨ Key Features

- No configuration needed.
- Clean and simple UI – easy to navigate and user-friendly.
- Supports `HTTPS`, `HTTP`, `TCP`, and `DNS` checks.
- Incident management – from **detection to resolution**, all in one place.
- Create **Schedules**
- Alerts **Email**.
- Real-time API **(SSE).**
- Lightweight **(~140 KB memory per monitor)**.

## More about ohstatus

Built for serverless platforms like Cloudflare and Koyeb, ohstatus ensures high availability and real-time monitoring for production workloads and critical services.

The ohstatus dashboard runs locally, decoupled from the serverless environment. By communicating securely through Convex, your admin interface remains completely private and is never exposed to the public internet.

## Installation

> [!WARNING]
>
> ## 🚧 Work in Progress
>
> This project is currently under active development.

> [!NOTE]
> We have three components: `API`, `status page`, and the `dashboard`. The status page must run on Cloudflare (it doesn't work anywhere else), but the API and dashboard can run anywhere.

### API Deployment & Installation

#### Prerequisites

- Node.js installed
- NATS (Synadia Cloud account)
- Convex account
- Cloudflare account (workers)

<br>

[![DeploytoKoyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://app.koyeb.com/deploy?name=ohstatus&type=git&repository=oddinpay/ohstatus&branch=main&workdir=/api&privileged=true&instance_type=eco-nano&regions=fra&env[API_KEY]=&env[CONVEX_CLOUD_URL]=&env[NATS_JWT]=&env[NATS_SEED]&env[NATS_URL]=tls://connect.ngs.global&env[SECRET_KEY]=&env[SSE_API_HOST]=&env[WORKER_ENDPOINT_URL]=&env[X_API_KEY]=&ports=8976;http;/&hc_protocol[8976]=tcp&hc_grace_period[8976]=5&hc_interval[8976]=30&hc_restart_limit[8976]=3&hc_timeout[8976]=5&hc_path[8976]=/&hc_method[8976]=get)

<br>

> [!TIP]
> Generate a unique key for `API_KEY`, `SECRET_KEY`, and `X_API_KEY` using the command below. Run it three separate times to ensure each key is distinct:

```sh
 node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

<br>

> [!NOTE]
> While the deployment above is fully automated with a single click, you must configure the environment variables below to make the deployment live. `SSE_API_HOST` is your API domain or subdomain. using a subdomain is highly recommended. You will also need a `WORKER_ENDPOINT_URL`, which is included with your status page setup. we will walk through how to get this below.

```sh
API_KEY=
CONVEX_CLOUD_URL=
NATS_JWT=
NATS_SEED=
NATS_URL=tls://connect.ngs.global
SECRET_KEY=
SSE_API_HOST=
WORKER_ENDPOINT_URL=
X_API_KEY=
```

### Status Page Deployment

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/oddinpay/ohstatus&env=API_KEY,CONVEX_CLOUD_URL,PUBLIC_CONVEX_URL&CACHE_ENABLED=true)
