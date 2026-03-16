import {
  DEFAULT_COUNT,
  DEFAULT_LANGUAGE,
  FRESHNESS_MAP,
  MAX_COUNT,
} from './constants.js';
import type { SearchToolError, SearchToolInput } from './types.js';

export const TOOL_SCHEMA = {
  type: 'object' as const,
  properties: {
    query: {
      type: 'string' as const,
      description: 'Search query string.',
    },
    count: {
      type: 'number' as const,
      description: `Number of results to return (1-${MAX_COUNT}).`,
      minimum: 1,
      maximum: MAX_COUNT,
    },
    country: {
      type: 'string' as const,
      description:
        "2-letter country code for region-specific results (for example: 'US', 'DE', 'ALL').",
    },
    language: {
      type: 'string' as const,
      description: `ISO language code for search results. Defaults to '${DEFAULT_LANGUAGE}'.`,
    },
    freshness: {
      type: 'string' as const,
      description:
        "Filter results by time. Values: 'pd' (day), 'pw' (week), 'pm' (month), 'py' (year).",
    },
  },
  required: ['query'] as const,
};

const VALID_FRESHNESS = new Set(Object.keys(FRESHNESS_MAP));

type ParseResult =
  | { ok: true; value: SearchToolInput }
  | { ok: false; error: SearchToolError };

export function parseSearchToolInput(args: unknown): ParseResult {
  const params = (args ?? {}) as Record<string, unknown>;
  const query = typeof params.query === 'string' ? params.query.trim() : '';

  if (!query) {
    return {
      ok: false,
      error: {
        error: 'missing_query',
        message: 'The "query" parameter is required.',
      },
    };
  }

  const freshness =
    typeof params.freshness === 'string'
      ? params.freshness.trim().toLowerCase()
      : undefined;
  if (freshness && !VALID_FRESHNESS.has(freshness)) {
    return {
      ok: false,
      error: {
        error: 'invalid_freshness',
        message: `freshness must be one of: ${[...VALID_FRESHNESS].join(', ')}`,
      },
    };
  }

  const count =
    typeof params.count === 'number' && Number.isFinite(params.count)
      ? Math.max(1, Math.min(MAX_COUNT, Math.floor(params.count)))
      : DEFAULT_COUNT;

  return {
    ok: true,
    value: {
      query,
      count,
      country:
        typeof params.country === 'string' ? params.country.trim() : undefined,
      language:
        typeof params.language === 'string'
          ? params.language.trim()
          : undefined,
      freshness,
    },
  };
}

export function jsonResult(
  data: unknown,
): { content: Array<{ type: 'text'; text: string }>; details: unknown } {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    details: data,
  };
}
