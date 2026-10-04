import type { DestinationId } from './destinations/registry.js';

export type HttpPayloadMode = 'compact' | 'full';

export interface ExtensionConfig {
  destination: DestinationId;
  endpoint: string;
  bearerToken?: string;
  payloadMode: HttpPayloadMode;
}

const STORAGE_KEY = 'webClipperHttpConfig';

export function normalizeConfig(config: ExtensionConfig): ExtensionConfig {
  return {
    destination: config.destination,
    endpoint: config.endpoint.trim(),
    bearerToken: config.bearerToken?.trim() || undefined,
    payloadMode: config.payloadMode === 'full' ? 'full' : 'compact',
  };
}

export function validateConfig(config: ExtensionConfig): ExtensionConfig {
  const normalized = normalizeConfig(config);
  if (normalized.destination !== 'http') throw new Error(`Unsupported destination: ${normalized.destination}`);
  if (!normalized.endpoint) throw new Error('Endpoint URL is required');

  let url: URL;
  try {
    url = new URL(normalized.endpoint);
  } catch {
    throw new Error('Endpoint must be a valid URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Endpoint must use http:// or https://');
  }
  if (url.username || url.password) {
    throw new Error('Put credentials in the bearer token field, not in the endpoint URL');
  }

  return normalized;
}

export async function loadConfig(): Promise<ExtensionConfig> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const value: unknown = stored[STORAGE_KEY];

  if (!value || typeof value !== 'object') return { destination: 'http', endpoint: '', payloadMode: 'compact' };

  const candidate = value as Record<string, unknown>;
  return normalizeConfig({
    destination: candidate.destination === 'http' ? 'http' : 'http',
    endpoint: typeof candidate.endpoint === 'string' ? candidate.endpoint : '',
    bearerToken: typeof candidate.bearerToken === 'string' ? candidate.bearerToken : undefined,
    payloadMode: candidate.payloadMode === 'full' ? 'full' : 'compact',
  });
}

export async function saveConfig(config: ExtensionConfig): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: validateConfig(config) });
}
