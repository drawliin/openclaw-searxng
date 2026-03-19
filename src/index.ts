/**
 * SearXNG / Tavily Search plugin entrypoint.
 */

import type { OpenClawPluginApi } from 'clawdbot/plugin-sdk';
import {
  DEFAULT_ENGINES,
  DEFAULT_PROVIDER,
  DEFAULT_SEARXNG_URL,
  DEFAULT_TIMEOUT,
} from './constants.js';
import { normalizePluginConfig } from './config.js';
import type { PluginConfig } from './config.js';
import { createSearxngSearchTool } from './search-tool.js';
import { createTavilySearchTool } from './tavily-search-tool.js';

export const id = 'searxng-search';

export const configSchema = {
  validate: () => ({ ok: true as const }),
  jsonSchema: {
    type: 'object',
    properties: {
      provider: {
        type: 'string',
        enum: ['searxng', 'tavily'],
        description: 'Search provider to use',
        default: DEFAULT_PROVIDER,
      },
      searxngUrl: {
        type: 'string',
        description: 'Base URL of the SearXNG instance',
        default: DEFAULT_SEARXNG_URL,
      },
      engines: {
        type: 'array',
        items: { type: 'string' },
        description: 'Search engines to use (SearXNG only)',
        default: DEFAULT_ENGINES,
      },
      timeout: {
        type: 'number',
        description: 'Request timeout in milliseconds (SearXNG only)',
        default: DEFAULT_TIMEOUT,
      },
      tavilyApiKey: {
        type: 'string',
        description: 'Tavily API key (falls back to TAVILY_API_KEY env var)',
      },
    },
    additionalProperties: false,
  },
};

export function register(api: OpenClawPluginApi) {
  api.logger.info('Search plugin initializing.');

  const pluginConfig = (api.pluginConfig ?? {}) as PluginConfig;
  const config = normalizePluginConfig(pluginConfig);

  if (config.provider === 'tavily') {
    const apiKey = config.tavilyApiKey || process.env.TAVILY_API_KEY;
    if (!apiKey) {
      api.logger.error?.(
        'Tavily provider selected but no API key found. Set tavilyApiKey in plugin config or TAVILY_API_KEY env var. Falling back to SearXNG.',
      );
      registerSearxng(api, config);
      return;
    }

    api.logger.info('Search: using Tavily provider.');
    api.registerTool(createTavilySearchTool(apiKey), { optional: true });
    api.logger.info(
      'Search: registered tool "web_search" with Tavily (optional; add to agent allowlist).',
    );
  } else {
    registerSearxng(api, config);
  }
}

function registerSearxng(
  api: OpenClawPluginApi,
  config: ReturnType<typeof normalizePluginConfig>,
) {
  api.logger.info(
    `SearXNG Search: connecting to ${config.searxngUrl} (engines: ${config.engines.join(', ')})`,
  );

  api.registerTool(createSearxngSearchTool(config), { optional: true });

  api.logger.info(
    'SearXNG Search: registered tool "web_search" (optional; add to agent allowlist).',
  );
}
