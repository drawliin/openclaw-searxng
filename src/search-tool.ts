/**
 * SearXNG web_search tool adapter.
 */

import { normalizePluginConfig } from './config.js';
import { SearxngClient } from './searxng-client.js';
import { TavilyClient } from './tavily-client.js';
import { TOOL_SCHEMA, jsonResult, parseSearchToolInput } from './tool-schema.js';
import type { SearxngPluginConfig, SearchToolOutput } from './types.js';

export function createSearxngSearchTool(config?: SearxngPluginConfig) {
  const client = new SearxngClient(normalizePluginConfig(config));

  return {
    label: 'SearXNG Web Search',
    name: 'web_search',
    description:
      'Search the web using a self-hosted SearXNG instance. Returns titles, URLs, and descriptions. Supports freshness filtering and language/country targeting.',
    parameters: TOOL_SCHEMA,

    async execute(
      _toolCallId: string,
      args: unknown,
    ): Promise<{ content: Array<{ type: 'text'; text: string }>; details: unknown }> {
      try {
        const parsed = parseSearchToolInput(args);
        if (!parsed.ok) {
          return jsonResult(parsed.error);
        }

        const { query, count, country, language, freshness } = parsed.value;
        const { results, tookMs } = await client.search(query, {
          count,
          country,
          language,
          freshness,
        });

        const output: SearchToolOutput = {
          query,
          provider: 'searxng',
          count: results.length,
          tookMs,
          results,
        };

        return jsonResult(output);
      } catch (err: unknown) {
        return jsonResult({
          error: 'searxng_error',
          message:
            err instanceof Error ? err.message : 'Unknown error during search',
        });
      }
    },
  };
}

export function createTavilySearchTool(tavilyApiKey: string) {
  const client = new TavilyClient(tavilyApiKey);

  return {
    label: 'Tavily Web Search',
    name: 'web_search_tavily',
    description:
      'Search the web using the Tavily API. Returns titles, URLs, and descriptions. Supports freshness filtering.',
    parameters: TOOL_SCHEMA,

    async execute(
      _toolCallId: string,
      args: unknown,
    ): Promise<{ content: Array<{ type: 'text'; text: string }>; details: unknown }> {
      try {
        const parsed = parseSearchToolInput(args);
        if (!parsed.ok) {
          return jsonResult(parsed.error);
        }

        const { query, count, freshness } = parsed.value;
        const { results, tookMs } = await client.search(query, {
          count,
          freshness,
        });

        const output: SearchToolOutput = {
          query,
          provider: 'tavily',
          count: results.length,
          tookMs,
          results,
        };

        return jsonResult(output);
      } catch (err: unknown) {
        return jsonResult({
          error: 'tavily_error',
          message:
            err instanceof Error ? err.message : 'Unknown error during search',
        });
      }
    },
  };
}
