/**
 * SearXNG Search plugin entrypoint.
 */

import type { OpenClawPluginApi } from 'clawdbot/plugin-sdk';
import {
  DEFAULT_ENGINES,
  DEFAULT_SEARXNG_URL,
  DEFAULT_TIMEOUT,
} from './constants.js';
import { normalizePluginConfig } from './config.js';
import { createSearxngSearchTool, createTavilySearchTool } from './search-tool.js';
import type { SearxngPluginConfig } from './types.js';

export const id = 'searxng-search';

export const configSchema = {
  validate: () => ({ ok: true as const }),
  jsonSchema: {
    type: 'object',
    properties: {
      searxngUrl: {
        type: 'string',
        description: 'Base URL of the SearXNG instance',
        default: DEFAULT_SEARXNG_URL,
      },
      engines: {
        type: 'array',
        items: { type: 'string' },
        description: 'Search engines to use',
        default: DEFAULT_ENGINES,
      },
      timeout: {
        type: 'number',
        description: 'Request timeout in milliseconds',
        default: DEFAULT_TIMEOUT,
      },
      tavilyApiKey: {
        type: 'string',
        description:
          'Tavily API key. Falls back to TAVILY_API_KEY env var if not set.',
      },
      searchProvider: {
        type: 'string',
        enum: ['searxng', 'tavily', 'both'],
        description:
          "Which search provider(s) to register. Defaults to 'searxng'.",
        default: 'searxng',
      },
    },
    additionalProperties: false,
  },
};

export function register(api: OpenClawPluginApi) {
  api.logger.info('SearXNG Search plugin initializing.');

  const pluginConfig = (api.pluginConfig ?? {}) as SearxngPluginConfig;
  const config = normalizePluginConfig(pluginConfig);

  const provider = config.searchProvider;
  const hasTavilyKey = !!config.tavilyApiKey;

  // Register SearXNG tool when provider is 'searxng' or 'both'
  if (provider === 'searxng' || provider === 'both') {
    api.logger.info(
      `SearXNG Search: connecting to ${config.searxngUrl} (engines: ${config.engines.join(', ')})`,
    );

    api.registerTool(createSearxngSearchTool(config), { optional: true });

    api.logger.info(
      'SearXNG Search: registered tool "web_search" (optional; add to agent allowlist).',
    );
  }

  // Register Tavily tool when provider is 'tavily' or 'both' and an API key is available
  if ((provider === 'tavily' || provider === 'both') && hasTavilyKey) {
    const tavilyTool = createTavilySearchTool(config.tavilyApiKey);

    // When provider is 'tavily' (exclusive), register as the primary 'web_search' tool
    if (provider === 'tavily') {
      const tool = { ...tavilyTool, name: 'web_search' };
      api.registerTool(tool, { optional: true });
      api.logger.info(
        'Tavily Search: registered tool "web_search" (optional; add to agent allowlist).',
      );
    } else {
      // 'both' mode — register alongside SearXNG as 'web_search_tavily'
      api.registerTool(tavilyTool, { optional: true });
      api.logger.info(
        'Tavily Search: registered tool "web_search_tavily" (optional; add to agent allowlist).',
      );
    }
  } else if ((provider === 'tavily' || provider === 'both') && !hasTavilyKey) {
    const warn = api.logger.warn?.bind(api.logger) ?? api.logger.info;
    warn(
      'Tavily Search: tavilyApiKey not configured and TAVILY_API_KEY env var not set. Skipping Tavily registration.',
    );
  }
}
