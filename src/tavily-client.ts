/**
 * Tavily HTTP client.
 */

import { tavily } from '@tavily/core';
import {
  DEFAULT_COUNT,
  FRESHNESS_MAP,
  MAX_COUNT,
  TAVILY_DEFAULT_MAX_RESULTS,
} from './constants.js';
import type { SearchResultItem } from './types.js';

export class TavilyClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(
    query: string,
    opts?: {
      count?: number;
      country?: string;
      language?: string;
      freshness?: string;
    },
  ): Promise<{ results: SearchResultItem[]; tookMs: number }> {
    const count = Math.max(
      1,
      Math.min(MAX_COUNT, opts?.count ?? DEFAULT_COUNT),
    );

    const searchOpts: Record<string, unknown> = {
      maxResults: count,
      searchDepth: 'basic' as const,
      topic: 'general' as const,
    };

    if (opts?.freshness) {
      const mapped = FRESHNESS_MAP[opts.freshness.toLowerCase()];
      if (mapped) {
        searchOpts.timeRange = mapped;
      }
    }

    const start = Date.now();
    const client = tavily({ apiKey: this.apiKey });
    const response = await client.search(query, searchOpts);
    const tookMs = Date.now() - start;

    const results: SearchResultItem[] = (response.results ?? [])
      .slice(0, count)
      .map((result) => ({
        title: result.title ?? '',
        url: result.url ?? '',
        description: result.content ?? '',
        siteName: extractHostname(result.url),
      }));

    return { results, tookMs };
  }
}

function extractHostname(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}
