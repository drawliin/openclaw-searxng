import {
  DEFAULT_ENGINES,
  DEFAULT_PROVIDER,
  DEFAULT_SEARXNG_URL,
  DEFAULT_TIMEOUT,
} from './constants.js';
import type { SearxngPluginConfig, TavilyPluginConfig } from './types.js';

export type PluginConfig = SearxngPluginConfig & TavilyPluginConfig;

export interface NormalizedPluginConfig extends Required<SearxngPluginConfig> {
  provider: 'searxng' | 'tavily';
  tavilyApiKey?: string;
}

export function normalizePluginConfig(
  pluginConfig?: PluginConfig,
): NormalizedPluginConfig {
  return {
    searxngUrl: (pluginConfig?.searxngUrl ?? DEFAULT_SEARXNG_URL).replace(
      /\/+$/,
      '',
    ),
    engines: pluginConfig?.engines ?? DEFAULT_ENGINES,
    timeout: pluginConfig?.timeout ?? DEFAULT_TIMEOUT,
    provider: pluginConfig?.provider ?? DEFAULT_PROVIDER,
    tavilyApiKey: pluginConfig?.tavilyApiKey,
  };
}
