export interface CompiledClip {
  noteName: string;
  frontmatter: string;
  content: string;
  fullContent: string;
  properties: Record<string, unknown>;
  variables: Record<string, unknown>;
  sourceUrl: string;
}

export interface DestinationContext {
  sourceUrl: string;
  sourceTitle?: string;
}

export interface Destination {
  readonly id: string;
  send(clip: CompiledClip, context: DestinationContext): Promise<void>;
}
