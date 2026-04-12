/**
 * Tavily search client.
 */

import { tavily } from '@tavily/core';
import { DEFAULT_COUNT, FRESHNESS_MAP, MAX_COUNT } from './constants.js';
import type { SearchResultItem } from './types.js';

export class TavilyClient {
  private readonly client: ReturnType<typeof tavily>;

  constructor(apiKey: string) {
    this.client = tavily({ apiKey });
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
    const maxResults = Math.max(
      1,
      Math.min(MAX_COUNT, opts?.count ?? DEFAULT_COUNT),
    );

    const timeRange = opts?.freshness
      ? FRESHNESS_MAP[opts.freshness.toLowerCase()]
      : undefined;

    const start = Date.now();

    const response = await this.client.search(query, {
      maxResults,
      searchDepth: 'basic',
      topic: 'general',
      ...(timeRange ? { timeRange: timeRange as 'day' | 'week' | 'month' | 'year' } : {}),
    });

    const tookMs = Date.now() - start;

    const results: SearchResultItem[] = (response.results ?? []).map(
      (result) => ({
        title: result.title ?? '',
        url: result.url ?? '',
        description: result.content ?? '',
        siteName: extractHostname(result.url),
      }),
    );

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
