import { describe, expect, it } from 'vitest';
import { normalizeConfig, validateConfig } from '../src/config.js';

describe('HTTP destination configuration', () => {
  it('normalizes endpoint and bearer token whitespace', () => {
    expect(normalizeConfig({ endpoint: '  https://example.com/clips  ', bearerToken: ' secret ' }))
      .toEqual({ endpoint: 'https://example.com/clips', bearerToken: 'secret' });
  });

  it('accepts localhost HTTP endpoints for local receivers', () => {
    expect(validateConfig({ endpoint: 'http://localhost:8787/clips' }).endpoint)
      .toBe('http://localhost:8787/clips');
  });

  it.each(['', 'not-a-url', 'file:///tmp/clips', 'ftp://example.com/clips'])('rejects invalid endpoint %j', (endpoint) => {
    expect(() => validateConfig({ endpoint })).toThrow();
  });

  it('rejects credentials embedded in the URL', () => {
    expect(() => validateConfig({ endpoint: 'https://user:pass@example.com/clips' }))
      .toThrow('bearer token');
  });
});
