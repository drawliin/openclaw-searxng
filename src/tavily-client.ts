/**
 * Tavily HTTP client.
 */

import { tavily } from '@tavily/core';
import {
  DEFAULT_COUNT,
  FRESHNESS_MAP,
  MAX_COUNT,
} from './constants.js';
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
  ): Promise<{ results: SearchResultItem[]; tookMs: number; warnings?: string[] }> {
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

    if (opts?.country) {
      searchOpts.country = opts.country;
    }

    const warnings: string[] = [];
    if (opts?.language) {
      warnings.push(
        `The 'language' parameter is not supported by the Tavily provider and was ignored.`,
      );
    }

    const start = Date.now();
    const response = await this.client.search(query, searchOpts);
    const tookMs = Date.now() - start;

    const results: SearchResultItem[] = (response.results ?? [])
      .slice(0, count)
      .map((result) => ({
        title: result.title ?? '',
        url: result.url ?? '',
        description: result.content ?? '',
        siteName: extractHostname(result.url),
      }));

    return { results, tookMs, ...(warnings.length > 0 ? { warnings } : {}) };
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
