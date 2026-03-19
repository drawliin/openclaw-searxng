/**
 * Tavily web_search tool adapter.
 */

import { TavilyClient } from './tavily-client.js';
import { TOOL_SCHEMA, jsonResult, parseSearchToolInput } from './tool-schema.js';
import type { SearchToolOutput } from './types.js';

export function createTavilySearchTool(apiKey: string) {
  const client = new TavilyClient(apiKey);

  return {
    label: 'Tavily Web Search',
    name: 'web_search',
    description:
      'Search the web using Tavily. Returns titles, URLs, and descriptions. Supports freshness filtering.',
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
