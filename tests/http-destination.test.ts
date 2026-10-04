import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpDestination } from '../src/destinations/http.js';
import type { CompiledClip } from '../src/types.js';

const clip: CompiledClip = {
  noteName: 'Example', frontmatter: '---\nsource: x\n---\n', content: '# Example',
  fullContent: '---\nsource: x\n---\n# Example', properties: { source: 'x' },
  variables: { title: 'Example', fullHtml: '<html>large source</html>' }, sourceUrl: 'https://example.com',
};

afterEach(() => vi.restoreAllMocks());

describe('HttpDestination', () => {
  it('posts the lean compiled artifact by default', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    await new HttpDestination({ endpoint: 'https://receiver.example/clips', bearerToken: 'secret' })
      .send(clip, { sourceUrl: clip.sourceUrl });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://receiver.example/clips');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer secret', 'Content-Type': 'application/json' });
    const payload = JSON.parse(String(init?.body));
    expect(payload.context).toEqual({ sourceUrl: clip.sourceUrl });
    expect(payload.clip).toEqual({
      noteName: clip.noteName,
      frontmatter: clip.frontmatter,
      content: clip.content,
      properties: clip.properties,
      sourceUrl: clip.sourceUrl,
    });
    expect(payload.clip).not.toHaveProperty('variables');
    expect(payload.clip).not.toHaveProperty('fullContent');
  });

  it('includes the complete compiled clip in full mode', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    await new HttpDestination({ endpoint: 'https://receiver.example/clips', payloadMode: 'full' })
      .send(clip, { sourceUrl: clip.sourceUrl });

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({ clip, context: { sourceUrl: clip.sourceUrl } });
  });

  it('surfaces non-success responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 500 }));
    await expect(new HttpDestination({ endpoint: 'https://receiver.example/clips' })
      .send(clip, { sourceUrl: clip.sourceUrl })).rejects.toThrow('HTTP destination failed (500): nope');
  });
});
