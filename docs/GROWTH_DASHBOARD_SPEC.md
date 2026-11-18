# V COIN – TON Growth Dashboard Specification

**Document status:** Approved product requirement; implementation and deployment pending  
**Project:** V COIN – TON  
**Scope:** TON project only. This dashboard must not depend on or modify the legacy BNB Smart Chain project.

## 1. Purpose

Provide a public, read-only dashboard that displays the project's internally defined VCOIN reference-growth index. It is a project visualization, not a market chart and not a representation of an exchange price.

## 2. Approved display parameters

- Initial reference index: **USD 0.004000 per VCOIN**.
- Target growth rate: **1% compounded per 72 hours**.
- Mathematical model: `P(t) = 0.004 × 1.01^(elapsed_seconds / 259200)`.
- The dashboard is intended to update its display every second.
- Candlesticks should use a green visual treatment.
- The index clock begins only when an authorized project administrator starts the extraction period and stops only when an authorized administrator declares that period finished.
- The start timestamp, finish timestamp, pause/resume rules (if enabled), and index calculation must be controlled by the backend, not a visitor's browser clock.

## 3. Mandatory public disclosure

Display a clear, persistent notice:

> This is an internal V COIN project reference index, calculated from a project-defined target model. It is independent of market prices, exchanges, order books, and external price feeds. It is not a market quotation, a promise of value, or a guarantee of profit or returns. Actual market value, if any, may differ or may not exist.

Do not describe the index as a live market price, guaranteed appreciation, investment return, or proof of liquidity/listing.

## 4. Access and permissions

- Public visitors: read-only access; no account required to view the dashboard.
- Administrators: authenticated and role-authorized access to start, pause/resume (if approved), and finish the index period.
- Never expose administrative controls or secrets in public frontend code.
- Record every administrative action with actor, timestamp, action, and prior/new state in an audit log.
- Protect administrative endpoints against unauthorized access, CSRF where applicable, replay, and brute-force attempts.

## 5. Technical architecture

- Public frontend: responsive dashboard with green candlesticks, current reference index, elapsed time, and clear disclosure.
- Backend: authoritative calculation and lifecycle state; clients consume read-only API responses.
- PostgreSQL: persist the configured base index, growth interval/rate, start/finish timestamps, lifecycle state, and administrative audit events.
- Use UTC timestamps internally and render local time only as a presentation choice.
- Reconnect/reload must reproduce the same index from server state; browser local storage must not be the source of truth.
- Validate numeric precision and rounding policy before implementation; avoid floating-point drift in persisted financial-style values.
- The dashboard must remain clearly labelled as an internal model even when publicly accessible.

## 6. Candlestick definition

Candles are a visualization of the internal index only. The implementation team must define and document the candle interval, open/high/low/close derivation, and historical sampling method. Do not fabricate exchange volume or market trades. If no meaningful intra-interval observations exist, use explicitly model-derived candles and label them as simulated/modelled.

## 7. Release and deployment gates

1. Review the existing repository and backend before adding implementation files; avoid duplicate files and preserve existing project architecture.
2. Implement backend persistence, public read-only API, and protected administrator controls.
3. Add tests for compounding, time boundaries, pause/finish behavior, authorization, audit logging, and reload/reconnect consistency.
4. Review security and ensure public endpoints disclose no secrets or private treasury/founder information.
5. Deploy only after the owner supplies or confirms the production hosting provider and domain/subdomain, and deployment credentials/access are available.
6. Verify HTTPS, public reachability, monitoring, backups, and search-engine indexing configuration separately. GitHub registration alone does not publish a website or make it searchable.

## 8. Current status

- Product direction and display parameters: approved by project owner.
- Specification file: recorded in this repository.
- Frontend implementation: pending.
- Backend/API/database implementation: pending.
- Automated tests and security review: pending.
- Hosting provider, domain/subdomain, and production deployment: not yet confirmed.
- Public launch and search-engine indexing: pending.

**No claim is made that the dashboard is currently operational, publicly hosted, or connected to an exchange.**
