import type { CompiledClip, Destination, DestinationContext } from '../types.js';
import type { HttpPayloadMode } from '../config.js';

export interface HttpDestinationConfig {
  endpoint: string;
  bearerToken?: string;
  headers?: Record<string, string>;
  payloadMode?: HttpPayloadMode;
}

function compactClip(clip: CompiledClip): Omit<CompiledClip, 'variables'> {
  const { variables: _variables, ...compiled } = clip;
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
    if (this.config.bearerToken) {
      headers.Authorization = `Bearer ${this.config.bearerToken}`;
    }

    const payloadClip = this.config.payloadMode === 'full' ? clip : compactClip(clip);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ clip: payloadClip, context }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`HTTP destination failed (${response.status})${detail ? `: ${detail}` : ''}`);
    }
  }
}
