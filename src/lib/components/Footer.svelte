<script>
  const year = new Date().getFullYear();
  const brand = "OHSTATUS";
  const company = "ODDINPAY";
  const entity = "LLC";
  export let privacy;
  export let site;
</script>

<footer>
  <div class="footer-content">
    <div class="footer-left">
      <div class="logo gap-2">
        <a
          href="https://github.com/oddinpay/ohstatus"
          target="_blank"
          rel="noopener noreferrer">{brand}</a
        >
      </div>
      <div class="copyright">© {year} {company}, {entity}.</div>
    </div>

    <div class="footer-right">
      <a href={site} target="_blank" rel="noopener noreferrer"
        >Visit our full website</a
      >
      <a href={privacy} target="_blank" rel="noopener noreferrer"
        >Privacy &amp; terms</a
      >
    </div>
  </div>
</footer>

<style>
  .logo {
    margin-bottom: 5px;
  }

  footer {
    position: relative;
    background: white;
    color: #1a1f36;
    padding: 60px 40px 30px;
    overflow: hidden;
    border-top: 1px solid #e0e0e0;
  }

  footer::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 120px;
    background: #0c2c4b;
    z-index: -1;
    border-top: 1px solid #e0e0e0;
  }

  .footer-content {
    max-width: 1200px;
    margin: auto;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 20px;
  }

  .footer-left {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .footer-left .logo {
    font-family:
      "Inter Variable",
      Inter,
      sans-serif,
      -apple-system,
      BlinkMacSystemFont;
    font-weight: 700;
    font-size: 15px;
    line-height: 15px;
    color: #2a741b;
  }

  .footer-left .copyright {
    font-size: 13px;
    color: #555;
  }

  .footer-right {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .footer-right a {
    color: #1a1f36;
    text-decoration: none;
    font-size: 14px;
    transition: opacity 0.3s ease;
  }

  .footer-right a:hover {
    opacity: 0.7;
  }

  /* --- Responsive Styles --- */
  @media (max-width: 768px) {
    .footer-content {
      flex-direction: column;
      align-items: right;
      text-align: flex-end;
    }

    .footer-left,
    .footer-right {
      align-items: right;
    }

    .footer-right {
      margin-top: 15px;
    }
  }
</style>
