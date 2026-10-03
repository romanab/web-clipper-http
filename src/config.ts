export interface ExtensionConfig {
  endpoint: string;
  bearerToken?: string;
}

const STORAGE_KEY = 'webClipperHttpConfig';

export async function loadConfig(): Promise<ExtensionConfig> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const value: unknown = stored[STORAGE_KEY];

  if (!value || typeof value !== 'object') return { endpoint: '' };

  const candidate = value as Record<string, unknown>;
  return {
    endpoint: typeof candidate.endpoint === 'string' ? candidate.endpoint : '',
    bearerToken: typeof candidate.bearerToken === 'string' ? candidate.bearerToken : undefined,
  };
}

export async function saveConfig(config: ExtensionConfig): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: config });
}
