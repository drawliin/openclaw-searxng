# SearXNG Search for OpenClaw

Self-hosted web search for OpenClaw agents using a local SearXNG instance.

This plugin exposes a `web_search` tool backed by SearXNG running on your own machine. It avoids third-party search API keys and keeps the search stack local.

## What This Repo Includes

- An OpenClaw plugin that registers a `web_search` tool
- A Docker setup for running SearXNG on `127.0.0.1:8080`
- A bundled SearXNG config tuned for this plugin

## Requirements

- Docker and Docker Compose
- Node.js 20+ and npm
- OpenClaw with plugin loading enabled

## Architecture

```text
Agent -> web_search -> OpenClaw plugin -> SearXNG (localhost:8080) -> search engines
```

## 1. Run SearXNG and Build The Plugin

Start the bundled SearXNG container with this script:

```bash
./start.sh
```

The script runs `npm run build` from the repo root to build the plugin, then `docker compose up -d` from [docker/docker-compose.yml](/d:/searxng-search/docker/docker-compose.yml).

Check that it is healthy:

```bash
curl http://localhost:8080/healthz
```

or open:

```bash
http://localhost:8080
```

### Docker Files

- [docker/docker-compose.yml](/d:/searxng-search/docker/docker-compose.yml)
  Runs the SearXNG container and binds it to `127.0.0.1:8080`
- [docker/settings.yml](/d:/searxng-search/docker/settings.yml)
  Defines the SearXNG instance settings and enabled engines

### Useful Docker Commands

Start:

```bash
cd docker
docker compose up -d
```

Stop:

```bash
cd docker
docker compose down
```

Restart after changing `settings.yml`:

```bash
cd docker
docker compose restart searxng
```

View logs:

```bash
cd docker
docker compose logs -f searxng
```

## 2. Disable OpenClaw Built-In Web Tools

If you want OpenClaw to use this plugin for search, disable the built-in web search and fetch tools in your `openclaw.json`:

```json
{
  "tools": {
    "profile": "coding",
    "web": {
      "search": {
        "enabled": false
      },
      "fetch": {
        "enabled": false
      }
    }
  }
}
```

This matters because otherwise OpenClaw may continue using its own built-in web tools instead of this plugin.

## 3. Load The Plugin In OpenClaw

Add this repo to your OpenClaw json `openclaw.json` and enable the plugin entry.

Example config:

```json
{
  "plugins": {
    "load": {
      "paths": ["/path/to/this-cloned-repo"]
    },
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
  }
}
```

If your OpenClaw config is on Windows, use the `local absolute path` to this repo.

## 5. Restart OpenClaw

After updating config and building the plugin:

```bash
openclaw gateway restart
```

At that point, the `web_search` tool should be available through this plugin.

## SearXNG Configuration

Edit [docker/settings.yml](/d:/searxng-search/docker/settings.yml) to change enabled engines or instance behavior.

Bundled defaults:

- Bind address: `0.0.0.0` inside the container
- Host port: `127.0.0.1:8080`
- Default language: `en-US`
- Request timeout: `5s`
- Enabled core engines: DuckDuckGo, Brave, Grokipedia, Wikipedia, GitHub

After changes:

```bash
cd docker
docker compose restart searxng
```

## Troubleshooting

### OpenClaw does not use this plugin

Check all of the following:

- Built-in OpenClaw web tools are disabled in `openclaw.json`
- The plugin is built with `npm run build`
- The plugin path is correct in OpenClaw config
- The plugin entry `searxng-search` is enabled

### The plugin cannot reach SearXNG

The plugin defaults to:

```text
http://localhost:8080
```

Make sure the container is running:

```bash
cd docker
docker compose ps
```

Then check:

```bash
curl http://localhost:8080/healthz
```

### Search requests fail or return poor results

- Review the enabled engines in [docker/settings.yml](/d:/searxng-search/docker/settings.yml)
- Check SearXNG logs with `docker compose logs -f searxng`
- Restart the container after config changes

## Development

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
```

Watch mode:

```bash
npm run dev
```
