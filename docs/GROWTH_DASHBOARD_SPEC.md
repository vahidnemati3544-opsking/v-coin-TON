# V COIN – TON Growth Dashboard Specification

**Document status:** Approved product requirement; implementation and deployment pending  
**Project:** V COIN – TON  
**Scope:** TON project only. This dashboard must not depend on or modify the legacy BNB Smart Chain project.

## 1. Purpose

Provide a public, read-only dashboard that displays the project's internally defined VCOIN reference-growth index. It is a project visualization, not a market chart and not a representation of an exchange price.

## 2. Approved display parameters

- Initial reference index: **USD 0.004000 per VCOIN**.
- Target increase: **1% of the initial USD 0.004000 reference value per completed 72-hour period**.
- Fixed increment per period: **USD 0.000040**.
- Mathematical model: `P(n) = 0.004000 + (n × 0.000040)`, where `n` is the number of completed 72-hour periods since the administrator starts the index.
- This is a **linear fixed-step model**, not compound growth and not 1% of the changing current index.
- Example: period 0 = USD 0.004000; period 1 = USD 0.004040; period 2 = USD 0.004080; period 3 = USD 0.004120.
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
- Use exact integer arithmetic at 12 USD decimal places; each completed period adds exactly USD 0.000040. Avoid floating-point drift in persisted values.
- The dashboard must remain clearly labelled as an internal model even when publicly accessible.

## 6. Approved candlestick presentation and visitor experience

The owner has approved a professional Bitcoin/TradingView-inspired candlestick presentation, adapted strictly for the V COIN internal growth index. This is a growth-history chart, not a trading terminal.

### 6.1 Visual direction

- Dark/near-black chart background with restrained gold V COIN branding.
- Green candlesticks for completed upward index steps; use a restrained neutral treatment for an unfinished/current period if needed.
- Clean chart grid and a smooth, professional charting layout.
- Remove numerical labels from the chart canvas: no numeric price scale, no numeric tick labels, and no numeric values printed over candles. The underlying exact index values remain stored and calculated by the backend.
- Keep the chart uncluttered. Do not add buy/sell buttons, order-book panels, trading signals, or exchange-style volume bars.
- The chart must be responsive on mobile and desktop, with touch interaction on mobile and pointer interaction on desktop.

### 6.2 Candle interval and calculation

- The canonical candle interval is one completed 72-hour index period.
- Each completed 72-hour period produces one historical candle.
- For period n, the candle opens at the index value at the beginning of that period and closes at the index value after its fixed USD 0.000040 step is applied.
- Since the approved index is monotonic and has no intra-period market trades, the candle high equals its close and the candle low equals its open. Do not invent intraperiod price movement, red candles, wicks, volatility, or market volume.
- The currently active 72-hour period may be shown as a forming candle. It must not be shown as a completed growth step until the backend confirms the period boundary.
- The first candle must be anchored to the administrator-approved start time. Historical candles must be reproducible from persisted backend state.
- Do not offer 1-hour, 4-hour, or daily candlestick timeframes as if they represented independent price observations. A future visual zoom or date-range filter may change the visible history without changing the canonical 72-hour candle data.

### 6.3 How visitors see and interact with the chart

- Any visitor can open the public dashboard without signing in.
- The page initially shows the V COIN growth candlestick chart, newest data at the right and older history to the left.
- Visitors can zoom, pan, and move across historical candles; on phones, these actions use touch gestures.
- Selecting or hovering over a candle may show a compact information panel with its period status and date/time. Do not reveal numerical price labels in the chart or tooltip under the approved number-free presentation.
- The chart refreshes from the public read-only API. A browser refresh or reconnect must restore the same history and current period.
- A clear, persistent disclosure must explain that the chart represents the project's internal reference-growth model, not a market price or guaranteed return.
- Public visitors cannot start, pause, resume, or finish the index. Those actions remain restricted to authenticated, authorized administrators.

### 6.4 Data integrity

- Do not fabricate exchange volume, trades, volatility, technical-analysis signals, or red/down candles.
- If the owner later approves a different growth model, preserve the historical record and document the model change rather than silently rewriting old candles.
- The visual chart may omit numerical labels, but backend calculations, audit records, and administrator reports must retain exact numerical values for accountability.

## 7. Release and deployment gates

1. Review the existing repository and backend before adding implementation files; avoid duplicate files and preserve existing project architecture.
2. Implement backend persistence, public read-only API, and protected administrator controls.
3. Add tests for fixed-step calculation, time boundaries, pause/finish behavior, authorization, audit logging, and reload/reconnect consistency.
4. Review security and ensure public endpoints disclose no secrets or private treasury/founder information.
5. Deploy only after the owner supplies or confirms the production hosting provider and domain/subdomain, and deployment credentials/access are available.
6. Verify HTTPS, public reachability, monitoring, backups, and search-engine indexing configuration separately. GitHub registration alone does not publish a website or make it searchable.

## 8. Current status

- Product direction and display parameters: approved by project owner.
- Specification file: recorded in this repository.
- Chart visual direction: approved — TradingView/Bitcoin-inspired, dark background, gold branding, green growth candles, number-free chart canvas.
- Candle semantics: approved — one model-derived candle per completed 72-hour period; no fabricated market activity or intraperiod volatility.
- Frontend implementation: first public read-only chart page committed under `contracts/mining/backend/public/growth/`; served by the backend at `/growth` when the backend is running. Runtime/browser verification and deployment remain pending.
- Backend/API/database implementation: public read-only endpoints and database migration are prepared on the feature branch; administrator lifecycle controls, database migration execution, end-to-end verification, and production integration remain pending.
- Automated runtime tests and security review: pending.
- Hosting provider, domain/subdomain, and production deployment: not yet confirmed.
- Public launch and search-engine indexing: pending.

**No claim is made that the dashboard is currently operational, publicly hosted, or connected to an exchange.**
