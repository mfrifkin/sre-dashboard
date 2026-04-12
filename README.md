# Production Incident Monitor

A real-time observability dashboard that aggregates live incident data from public status pages across major tech companies — built to demonstrate SRE and observability concepts relevant to Dynatrace.

**Live demo:** [your-site.netlify.app](https://your-site.netlify.app)

---

## What it does

- Pulls **live incident data** from 10 production status pages (GitHub, Cloudflare, Stripe, Datadog, PagerDuty, and more) via the Statuspage.io public API
- Displays real **P1/P2/P3-style severity triage** with filtering
- Shows **service health overview** across all tracked vendors
- Auto-refreshes every 60 seconds
- A Netlify serverless function acts as a proxy layer to handle CORS and cache responses

## Architecture

```
Browser → Netlify Function (proxy) → Statuspage.io APIs (10 vendors)
```

The serverless function (`netlify/functions/status.js`) fetches all status pages in parallel using `Promise.allSettled`, normalizes the response shape, and returns a single JSON payload. This avoids CORS issues and keeps API calls server-side.

## Observability concepts demonstrated

| Dashboard concept | SRE / Dynatrace equivalent |
|---|---|
| Incident severity (P1/P2/P3) | Problem severity in Dynatrace Davis AI |
| Service health overview | Service-level indicators (SLIs) |
| Active incident count | Open problem count |
| Degraded vs operational | Apdex / availability SLOs |
| 60s auto-refresh | Real-time metric ingestion |

## Running locally

```bash
npm install -g netlify-cli
netlify dev
```

Then open `http://localhost:8888`.

## Deploy to Netlify

1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com) → "Add new site" → "Import from Git"
3. Select your repo — Netlify auto-detects `netlify.toml`
4. Click **Deploy** — done

No environment variables or API keys required.

## Tech stack

- Vanilla HTML/CSS/JS (zero dependencies, zero build step)
- Netlify Functions (Node.js serverless proxy)
- Statuspage.io public API
