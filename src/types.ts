/**
 * SearXNG Search plugin type definitions.
 */

export interface SearxngPluginConfig {
  searxngUrl?: string;
  engines?: string[];
  timeout?: number;
}

export interface SearxngResult {
  title: string;
  url: string;
  content?: string;
  engine?: string;
  parsed_url?: string[];
  positions?: number[];
  score?: number;
  category?: string;
  publishedDate?: string;
}

export interface SearxngInfobox {
  infobox?: string;
  id?: string;
  content?: string;
  urls?: Array<{ title: string; url: string }>;
}

export interface SearxngApiResponse {
  query: string;
  number_of_results?: number;
  results: SearxngResult[];
  answers?: string[];
  corrections?: string[];
  infoboxes?: SearxngInfobox[];
  suggestions?: string[];
  unresponsive_engines?: Array<[string, string]>;
}

export interface SearchToolInput {
  query: string;
  count?: number;
  country?: string;
  language?: string;
  freshness?: string;
}

export interface SearchResultItem {
  title: string;
  url: string;
  description: string;
  published?: string;
  siteName?: string;
}

export interface SearchToolOutput {
  query: string;
  provider: 'searxng';
  count: number;
  tookMs: number;
  results: SearchResultItem[];
  cached?: boolean;
}

export interface SearchToolError {
  error: string;
  message: string;
}
