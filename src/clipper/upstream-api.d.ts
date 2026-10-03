declare module '../../upstream/obsidian-clipper/dist/api.mjs' {
  export interface DocumentParser {
    parseFromString(html: string, mimeType: string): any;
  }

  export interface Property {
    name: string;
    value: string;
    type?: string;
  }

  export interface Template {
    id?: string;
    name?: string;
    behavior?: string;
    noteNameFormat: string;
    path?: string;
    noteContentFormat: string;
    properties: Property[];
    triggers?: string[];
    context?: string;
  }

  export interface ClipOptions {
    html: string;
    url: string;
    template: Template;
    documentParser: DocumentParser;
    propertyTypes?: Record<string, string>;
    parsedDocument?: any;
  }

  export interface ClipResult {
    noteName: string;
    frontmatter: string;
    content: string;
    fullContent: string;
    properties: Property[];
    variables: Record<string, string>;
  }

  export function clip(options: ClipOptions): Promise<ClipResult>;
}
