import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePluginConfig } from '../dist/config.js';
import { DEFAULT_COUNT, MAX_COUNT } from '../dist/constants.js';
import { createSearxngSearchTool } from '../dist/search-tool.js';
import { SearxngClient } from '../dist/searxng-client.js';
import { parseSearchToolInput } from '../dist/tool-schema.js';
import { register } from '../dist/index.js';

test('plugin settings normalize trailing slashes and keep default values', () => {
  const defaults = normalizePluginConfig();
  assert.equal(defaults.searxngUrl, 'http://localhost:8080');
  assert.ok(defaults.engines.length > 0);
  assert.equal(defaults.timeout, 10_000);
  assert.equal(normalizePluginConfig({ searxngUrl: 'http://localhost:8081///' }).searxngUrl, 'http://localhost:8081');
});

test('tool input trims queries, clamps count, and rejects invalid freshness', () => {
  const missing = parseSearchToolInput({ query: '  ' });
  assert.equal(missing.ok, false);
  assert.equal(missing.error.error, 'missing_query');

  const badFreshness = parseSearchToolInput({ query: 'test', freshness: 'this-week' });
  assert.equal(badFreshness.ok, false);
  assert.equal(badFreshness.error.error, 'invalid_freshness');

  const parsed = parseSearchToolInput({ query: '   openclaw ', count: MAX_COUNT + 50, freshness: 'PW' });
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.value, { query: 'openclaw', count: MAX_COUNT, country: undefined, language: undefined, freshness: 'pw' });

  const standard = parseSearchToolInput({ query: 'test' });
  assert.equal(standard.ok, true);
  assert.equal(standard.value.count, DEFAULT_COUNT);
});

test('SearXNG client constructs the JSON request and limits results', async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl;
  let requestAccept;
  globalThis.fetch = async (url, init) => {
    requestUrl = new URL(String(url));
    requestAccept = init.headers.Accept;
    return new Response(JSON.stringify({
      results: [
        { title: 'One', url: 'https://example.org/a', content: 'A description', publishedDate: '2026-01-01' },
        { title: 'Two', url: 'https://example.net/b', content: 'Another description' },
        { title: 'Three', url: 'https://example.com/c' },
      ],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const client = new SearxngClient({ searxngUrl: 'http://127.0.0.1:8080/', engines: ['duckduckgo'], timeout: 2000 });
    const response = await client.search('typescript', { count: 2, country: 'MA', freshness: 'pw' });
    assert.equal(requestUrl.pathname, '/search');
    assert.equal(requestUrl.searchParams.get('q'), 'typescript');
    assert.equal(requestUrl.searchParams.get('format'), 'json');
    assert.equal(requestUrl.searchParams.get('engines'), 'duckduckgo');
    assert.equal(requestUrl.searchParams.get('language'), 'en-MA');
    assert.equal(requestUrl.searchParams.get('time_range'), 'week');
    assert.equal(requestAccept, 'application/json');
    assert.equal(response.results.length, 2);
    assert.equal(response.results[0].siteName, 'example.org');
    assert.equal(response.results[0].published, '2026-01-01');
    assert.ok(response.tookMs >= 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('SearXNG client surfaces non-success HTTP responses', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('server unavailable', { status: 503 });
  try {
    await assert.rejects(
      new SearxngClient().search('query'),
      /SearXNG returned HTTP 503: server unavailable/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('optional plugin registration and missing-query tool error', async () => {
  const calls = [];
  register({
    logger: { info() {} },
    pluginConfig: { searxngUrl: 'http://localhost:8080' },
    registerTool(tool, options) {
      calls.push({ tool, options });
    },
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].tool.name, 'web_search');
  assert.deepEqual(calls[0].options, { optional: true });

  const result = await createSearxngSearchTool().execute('test-id', { query: '  ' });
  assert.equal(result.details.error, 'missing_query');
});
