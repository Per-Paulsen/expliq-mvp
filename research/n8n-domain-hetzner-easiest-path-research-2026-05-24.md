---
tags:
  - type/reference
  - status/done
  - n8n
  - devops
  - epic/18
---

# Easiest Path to a Domain for n8n on a Hetzner Server — State of the Art (2026-05-24)

> Generated via /explore. 4 sub-questions investigated in parallel by Explore subagents:
> (1) n8n's official Hetzner setup, (2) HTTPS reverse-proxy layer, (3) free DNS options, (4) Hetzner DNS + cheap registrars.
> This file consolidates and dedupes three intermediate worker reports (now deleted).

## Executive Summary

The simplest, most robust path is the one the existing Epic-18 runbook already points at: **Docker Compose + Caddy as reverse proxy with automatic Let's Encrypt HTTPS**, fronted by **a real (cheap) domain** whose **A-record points at the Hetzner box IP**. n8n ships no official Hetzner 1-click image — the documented method *is* a standard Docker-Compose + Caddy template. Caddy is the clear winner for a single-service n8n (3-line Caddyfile, zero-config TLS, correct `X-Forwarded-*` headers); Traefik is more powerful but overkill, nginx needs manual cert handling. Free DNS names (DuckDNS, sslip.io, nip.io) work technically but every source recommends a purchased domain for a production/server-to-server webhook (no SLA gap, reliability, professional URL) — for a job-application portfolio, buy the domain (~€10/yr). The one non-obvious gotcha: **if DNS sits behind Cloudflare, the record must be "grey cloud" (DNS-only), not "orange cloud" (proxy)** — the proxy blocks n8n webhooks + WebSockets. Hetzner DNS Console (free, up to 25 zones) avoids that trap entirely since it is pure DNS, no proxy.

## Recommendation for Expliq (concrete)

1. **Domain:** buy a cheap one (~€10/yr) at **Porkbun**, **Cloudflare Registrar** (at-cost), or **INWX** (EU/German). Or reuse one you already own. A free DuckDNS subdomain is the fallback if you want zero cost — technically fine since the webhook is server-to-server.
2. **DNS:** host the zone at **Hetzner DNS Console** (free, everything in one place, no Cloudflare proxy trap) — or at the registrar.
3. **A-record:** `n8n.<domain>` → Hetzner box public IP.
4. **Proxy:** **Caddy** with `reverse_proxy n8n:5678 { flush_interval -1 }` — exactly the runbook's compose stack. Auto-HTTPS via Let's Encrypt, no certbot/cron.
5. **n8n env (non-negotiable behind a proxy):** `N8N_HOST`, `N8N_PROTOCOL=https`, `WEBHOOK_URL=https://n8n.<domain>/`, **`N8N_PROXY_HOPS=1`**, `N8N_EDITOR_BASE_URL`.

> **Runbook delta worth applying:** the current §0.2 compose block has `WEBHOOK_URL` + `N8N_EDITOR_BASE_URL` but is missing **`N8N_PROXY_HOPS=1`** and the Caddyfile's **`flush_interval -1`**. Both are the documented fixes for the most common self-hosted failure modes (webhook URLs showing `:5678`, and the editor's "Connection lost" WebSocket/SSE error).

## Sub-Topic 1: n8n's Official Hetzner Setup

- **No official 1-click app.** The documented method is a standard **Docker Compose + Caddy** template; pick a Hetzner server with the "Docker CE" image (CPX11/CX22 class is enough). ([n8n Docs: Hetzner](https://docs.n8n.io/hosting/installation/server-setups/hetzner/))
- **Domain/HTTPS:** set a DNS A-record for the subdomain → server IP, put the subdomain in the Caddyfile, Caddy auto-provisions the Let's Encrypt cert. Ports 80 + 443 must be open in the Hetzner firewall.
- **Critical env vars:** `N8N_HOST`, `N8N_PROTOCOL=https`, **`WEBHOOK_URL=https://...`** (the #1 mistake is setting only `N8N_HOST` → webhook URLs wrongly show port 5678), `N8N_PROXY_HOPS=1` behind a proxy, optional `N8N_EDITOR_BASE_URL` (OAuth/complex setups). ([Webhook URL config](https://docs.n8n.io/hosting/configuration/configuration-examples/webhook-url/), [Endpoints env vars](https://docs.n8n.io/hosting/configuration/environment-variables/endpoints/))

## Sub-Topic 2: HTTPS Reverse-Proxy Layer (Caddy vs Traefik vs nginx)

| Criterion | Caddy | Traefik | nginx |
|---|---|---|---|
| Simplicity (single n8n) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Automatic TLS | ✅ zero-config | ✅ via labels | ❌ external (certbot) |
| Learning curve | low (3 lines) | steep (concepts) | medium |
| Header handling | ✅ auto-correct | ✅ middleware | ⚠️ manual, error-prone |
| Recommended for | **single instance** | multi-service/dynamic | only with existing nginx skills |

- **Caddy minimal config** is literally `domain { reverse_proxy n8n:5678 { flush_interval -1 } }`. `flush_interval -1` disables response buffering — essential for n8n's SSE/long-running streams. ([wz-it Caddy guide](https://wz-it.com/en/blog/n8n-installation-ubuntu-caddy-automatic-ssl-certificates/), [Caddy reverse_proxy docs](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy))
- **"Connection lost" (WebSocket/SSE)** is the most common proxy complaint. Fix: `N8N_PROXY_HOPS=1`, `N8N_EDITOR_BASE_URL`, correct `X-Forwarded-*` + `Upgrade` headers. Caddy sets these automatically → far fewer reports than nginx/OpenLiteSpeed. ([n8n Issue #25912](https://github.com/n8n-io/n8n/issues/25912), [community thread](https://community.n8n.io/t/solved-connection-lost-in-workflow-editor/113110))
- **n8n can terminate TLS natively** (`N8N_SSL_KEY`/`N8N_SSL_CERT`) but has no auto-renewal → reverse proxy stays best practice. ([Set up SSL](https://docs.n8n.io/hosting/securing/set-up-ssl/))

## Sub-Topic 3: Free DNS Names (DuckDNS / sslip.io / nip.io)

- **DuckDNS + Caddy:** works, preferably via **DNS-01** challenge (`caddy-dns/duckdns` module, token-based); HTTP-01 also possible if port 80 is public. Proven in 2024–2025 community setups. No formal SLA. ([Caddy community](https://caddy.community/t/dns-challenge-with-duckdns/14994), [caddy-dns/duckdns](https://github.com/caddy-dns/duckdns))
- **sslip.io / nip.io:** IP-embedded hostnames (`n8n.91-99-12-34.sslip.io`) resolve to the IP; Let's Encrypt HTTP-01 works, but the shared root domain *can* hit rate limits. Let's Encrypt began rolling out **direct IP certificates in 2025**, which may make these partly obsolete in 2026. ([sslip.io](https://sslip.io/), [LE rate limits](https://letsencrypt.org/docs/rate-limits/), [LE scaling rate limits 2025-01-30](https://letsencrypt.org/2025/01/30/scaling-rate-limits))
- **Verdict:** free DNS = hobby/testing; purchased domain = production. For a server-to-server webhook that nobody sees in a browser, DuckDNS is *acceptable* but a €10 domain removes the SLA/reliability risk and looks credible in a portfolio.

## Sub-Topic 4: Hetzner DNS + Cheap Registrars

- **Hetzner DNS is free** (up to 25 zones; managed via Hetzner Console since the old DNS Console was folded in, Nov 2025). Create a zone, add an A-record `n8n` → server IP. **Hetzner does not sell domains** — registration needs an external registrar, then point nameservers at Hetzner (or delegate via NS). ([Hetzner DNS](https://www.hetzner.com/dns/), [Hetzner A-record docs](https://docs.hetzner.com/de/networking/dns/record-types/a-record/))
- **Cheapest registrars 2025/26:** Cloudflare Registrar (~€10.44/yr .com, at-cost, requires transfer), **Porkbun** (~€11/yr, flat-rate, simple UI), Namecheap (beginner-friendly, 24/7 support), INWX (EU/German, strong API). ([cheapest registrars](https://domaindetails.com/registrars/cheapest), [registrar comparison](https://emelia.io/hub/domain-registrars))
- **Cloudflare gotcha (critical for n8n):** if you use Cloudflare DNS, the `n8n` record **must be grey cloud (DNS-only)**, not orange cloud (proxy). Orange cloud's Bot Fight Mode returns 403 on webhooks and breaks WebSockets (code 1008), plus a 100s proxy timeout kills long workflows. Hetzner DNS has no such proxy layer. ([the fix](https://optimizesmart.com/blog/self-hosted-n8n-webhooks-not-working-here-is-the-fix/), [n8n Issue #14619](https://github.com/n8n-io/n8n/issues/14619))
- **TTL:** lower to 60–120s ~24–48h before a planned change, then 3600–14400s for steady state. ([DigiCert TTL](https://www.digicert.com/blog/long-short-ttls))

## Consolidated Sources

**Official docs**
- n8n Hetzner setup — https://docs.n8n.io/hosting/installation/server-setups/hetzner/
- n8n webhook URL behind reverse proxy — https://docs.n8n.io/hosting/configuration/configuration-examples/webhook-url/
- n8n endpoints env vars — https://docs.n8n.io/hosting/configuration/environment-variables/endpoints/
- n8n deployment env vars — https://docs.n8n.io/hosting/configuration/environment-variables/deployment/
- n8n set up SSL — https://docs.n8n.io/hosting/securing/set-up-ssl/
- n8n Docker Compose — https://docs.n8n.io/hosting/installation/server-setups/docker-compose/
- n8n with Traefik and SSL — https://deepwiki.com/n8n-io/n8n-hosting/3.3-n8n-with-traefik-and-ssl
- Caddy reverse_proxy directive — https://caddyserver.com/docs/caddyfile/directives/reverse_proxy
- Caddy automatic HTTPS — https://caddyserver.com/docs/automatic-https/
- caddy-dns/duckdns — https://github.com/caddy-dns/duckdns
- Hetzner DNS — https://www.hetzner.com/dns/
- Hetzner A-record docs — https://docs.hetzner.com/de/networking/dns/record-types/a-record/
- Hetzner DNS zone file example — https://docs.hetzner.com/dns-console/dns/general/zone-file-example/
- sslip.io — https://sslip.io/
- Let's Encrypt rate limits — https://letsencrypt.org/docs/rate-limits/
- Let's Encrypt scaling rate limits (2025-01-30) — https://letsencrypt.org/2025/01/30/scaling-rate-limits

**Community / issues**
- n8n "Connection lost" — https://community.n8n.io/t/n8n-connection-lost/107744
- n8n Issue #25912 (SSE connection lost) — https://github.com/n8n-io/n8n/issues/25912
- n8n Issue #21755 (Render connection lost / invalid origin) — https://github.com/n8n-io/n8n/issues/21755
- n8n Issue #14619 (WebSocket 1008 behind Cloudflare) — https://github.com/n8n-io/n8n/issues/14619
- Solved: connection lost in editor — https://community.n8n.io/t/solved-connection-lost-in-workflow-editor/113110
- Caddy DNS challenge with DuckDNS — https://caddy.community/t/dns-challenge-with-duckdns/14994

**Guides / blogs (2025/26)**
- n8n install on Ubuntu 24.04 with Caddy + auto SSL — https://wz-it.com/en/blog/n8n-installation-ubuntu-caddy-automatic-ssl-certificates/
- n8n self-hosting on Hetzner (2026) — https://dev.to/nevik_schmidt_3635afa2b85/n8n-self-hosting-on-hetzner-complete-docker-setup-guide-2026-2poa
- Host n8n on Hetzner for <$6/mo — https://dev.to/alexanderschneider/how-to-host-your-own-n8n-automation-server-on-hetzner-cloud-for-less-than-6month-149d
- LowCloud: n8n on Hetzner — https://lowcloud.io/en/blog/self-hosted-n8n-on-hetzner
- Fix n8n webhook URL behind proxy — https://lumadock.com/tutorials/n8n-reverse-proxy-webhook-urls
- Self-hosted n8n webhooks not working — the fix — https://optimizesmart.com/blog/self-hosted-n8n-webhooks-not-working-here-is-the-fix/
- Reverse proxy comparison 2026 — https://selfhostwise.com/posts/traefik-vs-caddy-vs-nginx-proxy-manager-which-reverse-proxy-should-you-choose-in-2026/
- Cheapest domain registrars 2026 — https://domaindetails.com/registrars/cheapest
- Domain registrars that won't screw you (2026) — https://emelia.io/hub/domain-registrars
- DigiCert TTL best practices — https://www.digicert.com/blog/long-short-ttls

## Open Questions / Gaps

1. No systematic compatibility matrix (Caddy/Traefik/nginx × n8n version × WebSocket/SSE) — debugging is still trial-and-error.
2. Caddy + Hetzner DNS wildcard certs (DNS-01 via `dns.hetzner` provider) not verified for this stack.
3. sslip.io/nip.io Let's Encrypt rate-limit frequency: no empirical numbers.
4. Impact of Let's Encrypt's 2025 IP-certificates on the free-DNS calculus in 2026 not yet settled.

## Revisit Triggers

- n8n major release with Push/WebSocket architecture changes.
- Let's Encrypt IP-certificate GA (re-evaluate free-DNS path).
- Caddy 3.x or major Traefik release.
- Annual (Jan/Feb) registrar price re-check.
