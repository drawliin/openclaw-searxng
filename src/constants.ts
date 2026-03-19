export const DEFAULT_SEARXNG_URL = 'http://localhost:8080';
export const DEFAULT_ENGINES = [
  'duckduckgo',
  'brave',
  'grokipedia',
  'wikipedia',
  'github',
];
export const DEFAULT_LANGUAGE = 'en-US';
export const DEFAULT_TIMEOUT = 10_000;
export const DEFAULT_COUNT = 5;
export const MAX_COUNT = 10;

export const DEFAULT_PROVIDER: 'searxng' | 'tavily' = 'searxng';
export const TAVILY_DEFAULT_MAX_RESULTS = 5;

export const FRESHNESS_MAP: Record<string, string> = {
  pd: 'day',
  pw: 'week',
  pm: 'month',
  py: 'year',
};
