import { describe, expect, it } from 'vitest';
import { normalizeConfig, validateConfig, type HttpPayloadMode } from '../src/config.js';

const httpConfig = (
  endpoint: string,
  bearerToken?: string,
  payloadMode: HttpPayloadMode = 'compact',
) => ({
  destination: 'http' as const,
  endpoint,
  bearerToken,
  payloadMode,
});

describe('HTTP destination configuration', () => {
  it('normalizes endpoint and bearer token whitespace', () => {
    expect(normalizeConfig(httpConfig('  https://example.com/clips  ', ' secret ')))
      .toEqual({
        destination: 'http',
        endpoint: 'https://example.com/clips',
        bearerToken: 'secret',
        payloadMode: 'compact',
      });
  });

  it('preserves full payload mode', () => {
    expect(normalizeConfig(httpConfig('https://example.com/clips', undefined, 'full')).payloadMode)
      .toBe('full');
  });

  it('accepts localhost HTTP endpoints for local receivers', () => {
    expect(validateConfig(httpConfig('http://localhost:8787/clips')).endpoint)
      .toBe('http://localhost:8787/clips');
  });

  it.each(['', 'not-a-url', 'file:///tmp/clips', 'ftp://example.com/clips'])('rejects invalid endpoint %j', (endpoint) => {
    expect(() => validateConfig(httpConfig(endpoint))).toThrow();
  });

  it('rejects credentials embedded in the URL', () => {
    expect(() => validateConfig(httpConfig('https://user:pass@example.com/clips')))
      .toThrow('bearer token');
  });
});
