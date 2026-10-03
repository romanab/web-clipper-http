import type { CompiledClip } from '../types.js';

// This is intentionally the only module that imports upstream internals.
// The submodule is pinned; see UPSTREAM.md.
import {
  clip as upstreamClip,
  type DocumentParser,
  type Template,
} from '../../upstream/obsidian-clipper/src/api.js';

export type ClipperTemplate = Template;

export interface CompileClipInput {
  html: string;
  url: string;
  template: ClipperTemplate;
  documentParser: DocumentParser;
  propertyTypes?: Record<string, string>;
}

export async function compileClip(input: CompileClipInput): Promise<CompiledClip> {
  const result = await upstreamClip(input);

  return {
    noteName: result.noteName,
    frontmatter: result.frontmatter,
    content: result.content,
    fullContent: result.fullContent,
    properties: Object.fromEntries(result.properties.map((property) => [property.name, property.value])),
    variables: result.variables,
    sourceUrl: input.url,
  };
}
