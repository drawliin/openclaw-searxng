import {
  DEFAULT_ENGINES,
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
  };
}
