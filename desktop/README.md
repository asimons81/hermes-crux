# Crux Desktop frontend

The native plugin is `plugin.js`. Source lives under `src/`; the bundle imports only the released Hermes SDK and React runtime. It is already built for plugin installation.

To rebuild:

```sh
npm ci
npm run build
```

## Real-backend browser preview

The preview uses the actual plugin REST router, engine and store. It requires Python with `fastapi` and `uvicorn`, Node.js and npm. Its state directory must be a fresh isolated directory, never a configured Hermes profile.

From `desktop/`:

```sh
npm ci
npm run preview:build
python3 preview/serve.py --data-dir /absolute/path/to/crux-preview-data --port 9141
```

Open [the local preview](http://127.0.0.1:9141). The service binds to loopback. `HERMES_HOME` is set to the explicit preview data directory before the actual router is loaded. The script refuses a directory containing Hermes configuration or authentication files.

With that preview running and Google Chrome installed:

```sh
npm run test:browser
```

The smoke creates a fresh project-delivery example and exercises the actual backend. Override `CRUX_PREVIEW_URL` for another isolated preview origin and `CRUX_BROWSER_CHANNEL` for another Playwright-supported installed browser channel. The default is `chrome`; no browser binaries are installed by `npm ci`.

The checks cover exact ties, transitions, infeasibility, requirement relaxation, scenario restoration including an empty requirement mask, keyboard and pointer controls, repeated model creation, responsive embedded panes and scoped appearance in a light host. No live Hermes instance or user account is required.
