import { afterEach, describe, expect, it, vi } from 'vitest';
import { DOMParser } from 'linkedom';
import { compileClip, type ClipperTemplate } from '../src/clipper/adapter.js';
import { HttpDestination } from '../src/destinations/http.js';

const template: ClipperTemplate = {
  id: 'integration-test',
  name: 'Integration test',
  behavior: 'create',
  noteNameFormat: '{{title}}',
  path: '',
  noteContentFormat: '# {{title}}\n\n{{content}}\n',
  properties: [{ name: 'source', value: '{{url}}', type: 'text' }],
};

const html = `<!doctype html>
<html>
<head><title>Fixture Article</title></head>
<body>
  <main>
    <article>
      <h1>Fixture Article</h1>
      <p>This paragraph is deliberately long enough to look like meaningful article content to the extractor. It verifies that the pinned Obsidian clipping engine, our adapter, and the HTTP destination continue to compose correctly.</p>
      <p>A second paragraph gives the extraction pipeline additional document structure and stable text to preserve.</p>
    </article>
  </main>
</body>
</html>`;

afterEach(() => vi.restoreAllMocks());

describe('clip -> adapter -> HTTP destination', () => {
  it('compiles fixture HTML and posts the local contract', async () => {
    const clip = await compileClip({
      html,
      url: 'https://fixture.example/article',
      template,
      documentParser: new DOMParser(),
    });

    expect(clip.noteName).toContain('Fixture Article');
    expect(clip.content).toContain('Fixture Article');
    expect(clip.sourceUrl).toBe('https://fixture.example/article');
    expect(clip.properties.source).toBe('https://fixture.example/article');

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    await new HttpDestination({ endpoint: 'https://receiver.example/clips' })
      .send(clip, { sourceUrl: clip.sourceUrl, sourceTitle: 'Fixture Article' });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0];
    const payload = JSON.parse(String(init?.body));
    expect(payload.clip.noteName).toBe(clip.noteName);
    expect(payload.clip.content).toBe(clip.content);
    expect(payload.context).toEqual({
      sourceUrl: 'https://fixture.example/article',
      sourceTitle: 'Fixture Article',
    });
  });
});
