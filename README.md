# TripPilot

AI travel concierge built with **Angular 21 + Angular Material**, wired to any LLM through the
[**AG-UI protocol**](https://docs.ag-ui.com).

Book a flight, find a place to stay, and — soon — get a taxi waiting for you at arrivals.

## Features

| Area | Route | Status |
| --- | --- | --- |
| Flight search & booking | `/flights` | Live (demo data) |
| Accommodation search | `/stays` | Live (demo data) |
| Airport taxi pick-up | `/taxi` | Roadmap — waitlist only |
| AI assistant (AG-UI) | Side panel, all routes | Live |

## Architecture

```
src/app/
  core/
    booking.service.ts            demo booking backend (swap for a real supplier API)
    models/booking.models.ts
    ag-ui/
      ag-ui.config.ts             LlmProvider list + provideAgUi() DI token
      ag-ui.service.ts            HttpAgent per provider, signals, tool loop
      trip-tools.ts               tool schemas advertised to the LLM
      trip-tools.service.ts       browser-side execution of those tools
  features/                       home / flights / stays / taxi pages
  shared/assistant/               chat panel component
```

### AG-UI integration

`AgUiService` keeps one `HttpAgent` (from `@ag-ui/client`) per configured LLM provider and exposes
the conversation as Angular signals. Each user message triggers an AG-UI run:

1. The agent endpoint streams AG-UI events (SSE) back to the browser.
2. `onMessagesChanged` pushes the streaming transcript into the `messages` signal.
3. If the model requested a front-end tool (`search_flights`, `search_stays`, `book_taxi`),
   `TripToolsService` executes it locally, the result is appended as a `tool` message and the agent
   runs again (up to 5 round-trips).

Switching model in the assistant header carries the transcript over to the new provider.

### Configuring LLM providers

Providers are declared in `src/app/app.config.ts` via `provideAgUi({ ... })`. Each one points at an
AG-UI compatible agent endpoint:

```ts
{ id: 'openai', label: 'GPT', vendor: 'OpenAI', model: 'gpt-4.1', url: '/api/agui/openai' }
```

`/api/agui/*` is proxied in development to `http://localhost:8000` (see `proxy.conf.json`). Point it
at your own AG-UI agent server (Mastra, LangGraph, CrewAI, Pydantic AI, or a custom FastAPI/Express
endpoint emitting AG-UI events). **API keys belong on that server, never in this app.**

### Adding a new bookable service

1. Add the tool schema to `TRIP_TOOLS` in `core/ag-ui/trip-tools.ts`.
2. Add its handler to `TripToolsService.handlers`.
3. Implement the real call in `BookingService`.
4. Add a route + feature component under `features/`.

## Theme

Blue/yellow brand palette (Material 3, `azure` primary + `yellow` tertiary) with brand tokens in
`src/styles.scss`: `--tp-blue-900/800/700/600/500`, `--tp-yellow`, plus the `.tp-brand-surface`
(gradient + geometric pattern) and `.tp-accent-bar` helpers.

## Commands

```bash
npm start        # dev server on http://localhost:4200
npm run build    # production build
npm test         # unit tests (Vitest)
```

> `.npmrc` sets `legacy-peer-deps=true` to work around a peer-resolution crash in npm 11.4.2.
