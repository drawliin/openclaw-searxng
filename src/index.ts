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
import { createSearxngSearchTool } from './search-tool.js';
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
    },
    additionalProperties: false,
  },
};

export function register(api: OpenClawPluginApi) {
  api.logger.info('SearXNG Search plugin initializing.');

  const pluginConfig = (api.pluginConfig ?? {}) as SearxngPluginConfig;
  const config = normalizePluginConfig(pluginConfig);

  api.logger.info(
    `SearXNG Search: connecting to ${config.searxngUrl} (engines: ${config.engines.join(', ')})`,
  );

  api.registerTool(createSearxngSearchTool(config), { optional: true });

  api.logger.info(
    'SearXNG Search: registered tool "web_search" (optional; add to agent allowlist).',
  );
}
