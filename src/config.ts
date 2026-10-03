export interface ExtensionConfig {
  endpoint: string;
  bearerToken?: string;
}

const STORAGE_KEY = 'webClipperHttpConfig';

export async function loadConfig(): Promise<ExtensionConfig> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return stored[STORAGE_KEY] ?? { endpoint: '' };
}

export async function saveConfig(config: ExtensionConfig): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: config });
}
