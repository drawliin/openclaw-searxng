import {
  DEFAULT_ENGINES,
  DEFAULT_SEARCH_PROVIDER,
  DEFAULT_SEARXNG_URL,
  DEFAULT_TIMEOUT,
} from './constants.js';
import type { SearxngPluginConfig } from './types.js';

export function normalizePluginConfig(
  pluginConfig?: SearxngPluginConfig,
): Required<SearxngPluginConfig> {
  return {
    searxngUrl: (pluginConfig?.searxngUrl ?? DEFAULT_SEARXNG_URL).replace(
      /\/+$/,
      '',
    ),
    engines: pluginConfig?.engines ?? DEFAULT_ENGINES,
    timeout: pluginConfig?.timeout ?? DEFAULT_TIMEOUT,
    tavilyApiKey:
      pluginConfig?.tavilyApiKey || process.env.TAVILY_API_KEY || '',
    searchProvider: pluginConfig?.searchProvider ?? DEFAULT_SEARCH_PROVIDER,
  };
}
