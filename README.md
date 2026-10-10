# SearXNG Search for OpenClaw

[![CI](https://github.com/drawliin/openclaw-searxng/actions/workflows/ci.yml/badge.svg)](https://github.com/drawliin/openclaw-searxng/actions/workflows/ci.yml)

An OpenClaw plugin that connects an **optional `web_search` tool** to a self-hosted [SearXNG](https://docs.searxng.org/) instance. Search requests go to SearXNG on your machine; SearXNG then queries external search engines. A paid search API key is not required for the bundled engines, although external engines still need network access.

This project provides the plugin source, a Docker Compose configuration bound to localhost, and a small HTTP client. It is not an offline search engine or a privacy guarantee for queries sent to upstream search providers.

## Requirements

- A working OpenClaw installation with local plugin loading enabled. Follow the [current OpenClaw Node.js requirements](https://docs.openclaw.ai/install/node) (currently Node.js **24.16+** or **26.1+**).
- npm and Docker with the Docker Compose plugin (`docker compose`).
- Network access for the SearXNG search engines.

## 1. Clone, install, and start

```sh
git clone https://github.com/drawliin/openclaw-searxng.git
cd openclaw-searxng
npm ci
./start.sh
```

`start.sh` builds the TypeScript plugin and runs `docker compose up -d` from the `docker/` directory. Alternatively, run `npm run build` and then `docker compose -f docker/docker-compose.yml up -d`. The startup script **does not install npm dependencies**, so run `npm ci` first.

SearXNG is exposed only on `127.0.0.1:8080` by the included [Compose file](docker/docker-compose.yml). Check that it is running:

```sh
curl -f http://localhost:8080/
curl -f "http://localhost:8080/search?q=openclaw&format=json"
```

The JSON search endpoint must be enabled for the plugin to work. The included [settings.yml](docker/settings.yml) enables it.

## 2. Register the plugin and enable its optional tool

Add the following **fields** to your existing `openclaw.json` (merge rather than overwrite existing configuration). Replace the plugin path with the **absolute** path where you cloned this repository:

```json
{
  "plugins": {
    "load": { "paths": ["/absolute/path/to/openclaw-searxng"] },
    "entries": {
      "searxng-search": {
        "enabled": true,
        "config": {
          "searxngUrl": "http://localhost:8080",
          "engines": ["duckduckgo", "brave", "grokipedia", "wikipedia", "github"],
          "timeout": 10000
        }
      }
    }
  },
  "tools": {
    "profile": "coding",
    "alsoAllow": ["searxng-search"],
    "web": { "search": { "enabled": false } }
  }
}
```

The plugin calls `registerTool(..., { optional: true })`, so merely loading it is **not enough**; it must also be allowlisted. If your existing config already has a restrictive `tools.allow`, add the plugin there **instead of** using `alsoAllow` (OpenClaw does not allow both in the same scope). If `plugins.allow` is set, include `searxng-search` there too.

The sample disables OpenClaw’s built-in web-search provider because this plugin attempts to register the same `web_search` tool name. Leave `tools.web.fetch` alone unless you separately want to disable fetching. Tool-name collisions and compatibility depend on the installed OpenClaw release; check the diagnostics below instead of assuming this plugin replaced the built-in tool.

## 3. Reload and verify

```sh
openclaw gateway restart
openclaw plugins list --enabled
openclaw plugins inspect searxng-search --runtime --json
```

Verify that the plugin loads **and** the optional search tool is registered and exposed to your agent. Then try a normal search and inspect the SearXNG container logs if the tool returns an error. A successful TypeScript build alone does not establish OpenClaw runtime compatibility.

## Docker configuration

- [docker/docker-compose.yml](docker/docker-compose.yml) — runs the container and restricts the host port to `127.0.0.1:8080`.
- [docker/settings.yml](docker/settings.yml) — default engines, JSON output, language, and timeouts.

```sh
docker compose -f docker/docker-compose.yml ps
docker compose -f docker/docker-compose.yml logs -f searxng
docker compose -f docker/docker-compose.yml restart searxng
docker compose -f docker/docker-compose.yml down
```

**Security:** The provided SearXNG config has a placeholder `server.secret_key` and relaxed settings intended for local development. Do not expose this container to the public Internet without reviewing SearXNG security guidance, changing the secret, and configuring access controls. Binding to localhost protects the default host port only.

## Configuration

The plugin entry accepts `searxngUrl` (default `http://localhost:8080`), `engines` (the configured search-engine names), and `timeout` (HTTP timeout in milliseconds, default `10000`). The tool accepts a required `query` plus optional `count` (1–10), `language`, `country`, and `freshness` (`pd`, `pw`, `pm`, `py`).

The SearXNG HTTP client returns the requested number of matches, capped at 10, with title, URL, description, source hostname, and optional published date. Exact engine availability and search quality vary by provider.

## Troubleshooting

- **`./start.sh: Permission denied`:** check the file is executable after cloning, or run `sh ./start.sh`.
- **`npm run build` fails:** run `npm ci` and confirm Node.js meets your OpenClaw release requirements.
- **Plugin missing:** verify the absolute path, `plugins.entries.searxng-search.enabled`, and any existing `plugins.allow` rules. Inspect the plugin with the CLI above.
- **Tool missing:** this tool is optional; add it to the agent tool allowlist. Check the runtime logs for a duplicate `web_search` name or a plugin SDK compatibility error.
- **Search fails:** check `docker compose -f docker/docker-compose.yml ps`, test `/search?format=json` directly, and review engine errors in the container logs.

## Development

```sh
npm ci
npm test      # builds TypeScript, then runs the offline unit tests
npm run dev   # TypeScript watch mode
```

CI runs the build and offline tests on pushes and pull requests. Tests mock the SearXNG HTTP responses; they do **not** verify a live OpenClaw Gateway or external search engines.

Pull requests should include tests for changes to query validation, URL construction, error handling, or plugin registration.
