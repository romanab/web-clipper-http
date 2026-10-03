import type { CompiledClip } from '../types.js';
import type {
  DocumentParser,
  ClipResult,
} from '../../upstream/obsidian-clipper/src/api.js';
import type { Template } from '../../upstream/obsidian-clipper/src/types/types.js';

// Runtime code comes from the pinned upstream public API artifact.
// Types come from the same pinned upstream source because build:api emits JS only.
import * as upstreamApi from '../../upstream/obsidian-clipper/dist/api.mjs';

const upstreamClip = upstreamApi.clip as (input: {
  html: string;
  url: string;
  template: Template;
  documentParser: DocumentParser;
  propertyTypes?: Record<string, string>;
}) => Promise<ClipResult>;

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
