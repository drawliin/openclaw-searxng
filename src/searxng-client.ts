/**
 * SearXNG HTTP client.
 */

import {
  DEFAULT_COUNT,
  DEFAULT_ENGINES,
  DEFAULT_LANGUAGE,
  DEFAULT_SEARXNG_URL,
  DEFAULT_TIMEOUT,
  FRESHNESS_MAP,
  MAX_COUNT,
} from './constants.js';
import type {
  SearxngApiResponse,
  SearxngPluginConfig,
  SearchResultItem,
} from './types.js';

export class SearxngClient {
  private readonly baseUrl: string;
  private readonly engines: string[];
  private readonly timeout: number;

  constructor(config?: SearxngPluginConfig) {
    this.baseUrl = (config?.searxngUrl ?? DEFAULT_SEARXNG_URL).replace(/\/+$/, '');
    this.engines = config?.engines ?? DEFAULT_ENGINES;
    this.timeout = config?.timeout ?? DEFAULT_TIMEOUT;
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
    const count = Math.max(1, Math.min(MAX_COUNT, opts?.count ?? DEFAULT_COUNT));

    const url = new URL('/search', this.baseUrl);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('categories', 'general');

    if (this.engines.length > 0) {
      url.searchParams.set('engines', this.engines.join(','));
    }

    const language = opts?.language?.trim() || DEFAULT_LANGUAGE;
    if (language) {
      url.searchParams.set('language', language);
    }

    if (opts?.freshness) {
      const mapped = FRESHNESS_MAP[opts.freshness.toLowerCase()];
      if (mapped) {
        url.searchParams.set('time_range', mapped);
      }
    }

    if (opts?.country && opts.country.toUpperCase() !== 'ALL' && !opts.language) {
      url.searchParams.set('language', `en-${opts.country.toUpperCase()}`);
    }

    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(
          `SearXNG returned HTTP ${res.status}: ${detail || res.statusText}`,
        );
      }

      const data = (await res.json()) as SearxngApiResponse;
      const tookMs = Date.now() - start;
      const results: SearchResultItem[] = (data.results ?? [])
        .slice(0, count)
        .map((result) => ({
          title: result.title ?? '',
          url: result.url ?? '',
          description: result.content ?? '',
          published: result.publishedDate ?? undefined,
          siteName: extractHostname(result.url),
        }));

      return { results, tookMs };
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(`SearXNG request timed out after ${this.timeout}ms`);
      }
      if (err instanceof TypeError && (err as { cause?: { code?: string } }).cause?.code === 'ECONNREFUSED') {
        throw new Error(
          `Cannot connect to SearXNG at ${this.baseUrl}. Is it running? Start it with: cd docker && docker compose up -d`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      try {
        const res = await fetch(`${this.baseUrl}/healthz`, {
          signal: controller.signal,
        });
        return res.ok;
      } catch {
        const res = await fetch(this.baseUrl, {
          signal: controller.signal,
        });
        return res.ok;
      } finally {
        clearTimeout(timer);
      }
    } catch {
      return false;
    }
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
