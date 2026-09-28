# TripPilot

TripPilot is an AI-assisted travel-planning demo built with Angular 21 and Angular Material. It
combines flight and accommodation searches, an airport-transfer estimate flow, a saved trip plan,
and a conversational assistant connected to AG-UI-compatible LLM providers.

> **Demo limitations:** flight and accommodation results are generated locally and are not live
> supplier inventory. Taxi requests return non-binding estimates only. TripPilot does not make
> reservations, process payments, or contact travel suppliers.

## Features

| Area | Route | Details |
| --- | --- | --- |
| Home | `/` | Overview and shortcuts to flight and stay searches |
| Flights | `/flights` | Search and compare deterministic demo offers by route, dates, passengers, and cabin |
| Stays | `/stays` | Search demo hotels, apartments, hostels, and villas by city, dates, guests, and nightly budget |
| Airport taxi | `/taxi` | Create a non-binding demo estimate for a supported airport and drop-off address |
| Trip plan | Sidebar | Combine a selected flight, stay, and taxi estimate; see the estimated EUR total and save it on this device |
| AI assistant | Sidebar, all routes | Chat with a configured provider; tool calls can search demo offers or request a transfer estimate |
| Languages | App toolbar | English and German translations, date formats, and currency formats |

The selected language is stored in browser local storage. A saved trip plan is also stored locally
in the browser; it is not uploaded to a server or shared across devices.

## Quick start

### Requirements

- Node.js and npm versions compatible with Angular 21
- An internet connection for installing dependencies and downloading the Playwright browser
- API credentials only if you want to use the OpenAI or Anthropic assistant providers

The root package declares npm `11.4.2` as its package manager. Install dependencies from the
repository root; `agent-server` is an npm workspace and should not be installed separately.

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200). `npm start` runs Angular and the default proxy
configuration automatically starts the agent server on port `8000` if that port is available. The
default **Demo** assistant works offline and does not require an API key.

Alternatively, start both processes explicitly:

```bash
npm run dev
```

This runs the Angular development server and agent server as separate processes. Stop the command
with `Ctrl+C`.

## LLM providers

The assistant's default provider is **Demo** (`local`), which returns offline travel-planning
guidance. The agent server also implements **OpenAI** and **Anthropic** provider routes. **Gemini**
is listed in the UI but its server route is currently a placeholder and returns an
"isn't implemented" error.

To use OpenAI or Anthropic, copy the example environment file and set the key(s) for the providers
you want:

```powershell
Copy-Item agent-server\.env.example agent-server\.env
```

Then edit `agent-server/.env`:

```dotenv
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-5
ANTHROPIC_MAX_TOKENS=4096

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1
OPENAI_MAX_TOKENS=4096

PORT=8000
```

Restart the agent server after changing the environment file. Never put provider credentials in
Angular configuration, browser code, or source control. The `.env` file is for the server; the
committed `.env.example` contains blank keys.

Provider IDs, labels, model descriptions, and endpoint URLs are configured in
`src/app/core/ag-ui/ag-ui.config.ts`. The default endpoints are `/api/agui/openai`,
`/api/agui/anthropic`, `/api/agui/gemini`, and `/api/agui/local`. In development, the proxy strips
the `/api/agui` prefix and forwards these requests to `http://localhost:8000`.

To connect another AG-UI-compatible service, add its provider configuration and point the URL at
an endpoint that accepts AG-UI run input and streams AG-UI events. The backend must be reachable
from the browser; keep its credentials on that backend.

### How the assistant tools work

1. The browser sends the conversation, configured tools, and trip context to the selected AG-UI
   endpoint.
2. The server streams assistant text and/or tool-call events back to the browser.
3. The browser executes supported trip tools through `TripToolsService` and `BookingService`.
4. Tool results are sent back to the model for another run. A response can make up to five
   tool round-trips.

The browser currently advertises these tools:

| Tool | Purpose |
| --- | --- |
| `search_flights` | Search deterministic demo flight offers |
| `search_stays` | Search deterministic demo accommodation offers |
| `request_taxi_estimate` | Create a non-binding demo transfer estimate; this never books a taxi |

Switching providers keeps the conversation transcript. **Start a new conversation** clears it.

## Architecture

```text
src/app/
  core/
    ag-ui/                         AG-UI configuration, provider models, and conversation service
    i18n/                          English/German translations and formatting
  features/
    assistant/                     Assistant panel and advertised/executed trip tools
    flights/                       Flight search and offer selection
    home/                          Landing page
    stays/                          Accommodation search and selection
    taxi/                           Airport-transfer demo request and estimate
    trip-plan/                      Trip plan sidebar
  shared/
    data-access/
      booking/                      Deterministic demo search and estimate service
      trip-plan/                    Selected trip items and local persistence
    models/                          Shared app models

agent-server/
  src/
    index.ts                         Express routes and AG-UI request handling
    ag-ui-runtime.ts                 AG-UI event streaming
    providers/                       Local, OpenAI, Anthropic, and placeholder providers

e2e/
  tests/                             Playwright user journeys
  coverage-reporter.mjs              Browser coverage collection and threshold check
```

The Angular app uses standalone components, lazy-loaded routes, zoneless change detection, signals,
and Angular Material. `BookingService` currently provides deterministic demo data and can be
replaced by supplier integrations without changing the AG-UI conversation layer.

## Development commands

Run commands from the repository root:

| Command | Description |
| --- | --- |
| `npm start` | Start Angular with the default proxy; auto-start the agent server if needed |
| `npm run dev` | Start frontend and agent server as separate processes |
| `npm run start:frontend` | Start the Angular frontend with the static development proxy |
| `npm run start:agent` | Start the agent server in watch mode |
| `npm run build` | Build the frontend and agent server |
| `npm run build:frontend` | Build only the Angular application |
| `npm run build:agent` | Compile only the agent server |
| `npm test` | Run Angular unit tests once in Chromium |
| `npm run test:watch` | Run Angular unit tests in watch mode |
| `npm run test:e2e` | Run Playwright user journeys in Chromium |
| `npm run test:e2e:coverage` | Run browser journeys and enforce at least 85% frontend TypeScript line coverage |

Install Chromium once before running the Playwright commands:

```bash
npx playwright install chromium
```

Playwright starts the frontend on port `4200`, uses mocked assistant traffic, and does not require
the agent server or provider API keys. The coverage reporter writes raw and merged reports under
`coverage/e2e/`; it measures executable TypeScript under `src/app/`, excluding specs, dependencies,
generated code, templates, and the separate agent server.

## Agent server and proxy

The development agent server listens on port `8000` by default and exposes:

- `GET /health` - returns `{ "status": "ok" }`
- `POST /local` - offline assistant
- `POST /openai` - OpenAI assistant
- `POST /anthropic` - Anthropic assistant
- `POST /gemini` - placeholder error response

`PORT` in `agent-server/.env` changes the agent server port. The auto-start proxy uses `AGENT_PORT`
to select the port for the automatically started agent. Keep the proxy target in
`proxy.conf.json` aligned with the port used by the server.

To prevent the default `ng serve` proxy from auto-starting the backend, set `START_AGENT=false` in
the environment before starting Angular. This is used by the browser test configuration.

For endpoint issues, first check that the server is running and its health route responds:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

Then check the Angular proxy target, selected provider URL, server terminal output, and required
provider key. Missing OpenAI or Anthropic keys are reported by the agent server as AG-UI errors.

## Adding a bookable service

1. Add its tool name and JSON schema to `TRIP_TOOLS` in
   `src/app/features/assistant/tools/trip-tools.schema.ts`.
2. Add a matching handler in `TripToolsService` in
   `src/app/features/assistant/tools/trip-tools.service.ts`.
3. Implement the operation in `BookingService` or a dedicated data-access service.
4. Add or update the route and feature UI as needed.
5. Keep the demo-versus-live behavior and any booking or payment limitations explicit in the UI
   and documentation.

## Theme

The app uses an Angular Material 3 blue/yellow theme. Shared brand colors and helpers, including
`--tp-blue-*`, `--tp-yellow`, `.tp-brand-surface`, and `.tp-accent-bar`, are defined in
`src/styles.scss`.

## Additional documentation

- [`LLM-booking-capabilities.md`](LLM-booking-capabilities.md) describes the intended LLM-assisted
  travel flows and security considerations.
- [`ag-ui-endpoint-troubleshooting.md`](ag-ui-endpoint-troubleshooting.md) provides a short endpoint
  troubleshooting checklist.

> `.npmrc` enables `legacy-peer-deps=true` for the repository's npm dependency resolution.
