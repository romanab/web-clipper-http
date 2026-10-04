import type { CompiledClip, Destination, DestinationContext } from '../types.js';
import type { HttpPayloadMode } from '../config.js';

const DEFAULT_TIMEOUT_MS = 15_000;

export interface HttpDestinationConfig {
  endpoint: string;
  bearerToken?: string;
  headers?: Record<string, string>;
  payloadMode?: HttpPayloadMode;
  timeoutMs?: number;
}

type CompactClip = Omit<CompiledClip, 'variables' | 'fullContent'>;

function compactClip(clip: CompiledClip): CompactClip {
  const { variables: _variables, fullContent: _fullContent, ...compiled } = clip;
  return compiled;
}

export class HttpDestination implements Destination {
  readonly id = 'http';

  constructor(private readonly config: HttpDestinationConfig) {}

  async send(clip: CompiledClip, context: DestinationContext): Promise<void> {
    const endpoint = this.config.endpoint.trim();
    if (!endpoint) throw new Error('HTTP endpoint is not configured');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };
    if (this.config.bearerToken) headers.Authorization = `Bearer ${this.config.bearerToken}`;

    const payloadClip = this.config.payloadMode === 'full' ? clip : compactClip(clip);
    const controller = new AbortController();
    const timeoutMs = this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ clip: payloadClip, context }),
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) throw new Error(`HTTP destination timed out after ${timeoutMs}ms`);
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`HTTP destination network error${detail ? `: ${detail}` : ''}`);
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`HTTP destination failed (${response.status})${detail ? `: ${detail}` : ''}`);
    }
  }
}
