import type { ClipperTemplate } from '../clipper/adapter.js';

const TEMPLATES_KEY = 'webClipperHttpTemplates';
const ACTIVE_TEMPLATE_KEY = 'webClipperHttpActiveTemplate';
export const OBSIDIAN_TEMPLATE_SCHEMA_VERSION = '0.1.0';

export const DEFAULT_TEMPLATE: ClipperTemplate = {
  id: 'http-default',
  name: 'HTTP default',
  behavior: 'create',
  noteNameFormat: '{{title}}',
  path: '',
  noteContentFormat: '# {{title}}\n\n{{content}}\n',
  properties: [{ name: 'source', value: '{{url}}', type: 'text' }],
  triggers: [],
};

function generateTemplateId(): string {
  return `imported-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isProperty(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return typeof value.name === 'string' && typeof value.value === 'string';
}

function normalizeTemplate(value: unknown): ClipperTemplate {
  if (!isRecord(value)) throw new Error('Template must be a JSON object');

  const behavior = value.behavior;
  const isDaily = behavior === 'append-daily' || behavior === 'prepend-daily';
  if (typeof value.name !== 'string' || !value.name.trim()) throw new Error('Template name is required');
  if (typeof behavior !== 'string' || !behavior) throw new Error('Template behavior is required');
  if (typeof value.noteContentFormat !== 'string') throw new Error('Template noteContentFormat is required');
  if (!Array.isArray(value.properties) || !value.properties.every(isProperty)) throw new Error('Template properties are invalid');
  if (!isDaily && typeof value.noteNameFormat !== 'string') throw new Error('Template noteNameFormat is required');
  if (!isDaily && typeof value.path !== 'string') throw new Error('Template path is required');
  if (value.context !== undefined && typeof value.context !== 'string') throw new Error('Template context must be a string');
  if (value.schemaVersion !== undefined && value.schemaVersion !== OBSIDIAN_TEMPLATE_SCHEMA_VERSION) {
    throw new Error(`Unsupported Obsidian template schemaVersion: ${String(value.schemaVersion)}`);
  }

  return {
    id: typeof value.id === 'string' && value.id ? value.id : generateTemplateId(),
    name: value.name,
    behavior: behavior as ClipperTemplate['behavior'],
    noteNameFormat: typeof value.noteNameFormat === 'string' ? value.noteNameFormat : '',
    path: typeof value.path === 'string' ? value.path : '',
    noteContentFormat: value.noteContentFormat,
    properties: value.properties as ClipperTemplate['properties'],
    triggers: Array.isArray(value.triggers) ? value.triggers.filter((trigger): trigger is string => typeof trigger === 'string') : [],
    context: typeof value.context === 'string' ? value.context : undefined,
  };
}

export function importTemplateData(value: unknown): ClipperTemplate[] {
  const values = Array.isArray(value) ? value : [value];
  if (!values.length) throw new Error('At least one template is required');
  return values.map(normalizeTemplate);
}

export function exportTemplateData(template: ClipperTemplate): Record<string, unknown> {
  const isDaily = template.behavior === 'append-daily' || template.behavior === 'prepend-daily';
  const exported: Record<string, unknown> = {
    schemaVersion: OBSIDIAN_TEMPLATE_SCHEMA_VERSION,
    name: template.name,
    behavior: template.behavior,
    noteContentFormat: template.noteContentFormat,
    properties: template.properties.map(({ name, value, type }) => ({ name, value, type: type || 'text' })),
    triggers: template.triggers ?? [],
  };
  if (!isDaily) {
    exported.noteNameFormat = template.noteNameFormat;
    exported.path = template.path;
  }
  if (template.context) exported.context = template.context;
  return exported;
}

export async function loadTemplates(): Promise<ClipperTemplate[]> {
  const stored = await chrome.storage.local.get(TEMPLATES_KEY);
  const value: unknown = stored[TEMPLATES_KEY];
  if (!Array.isArray(value)) return [DEFAULT_TEMPLATE];
  try {
    const templates = value.map(normalizeTemplate);
    return templates.length ? templates : [DEFAULT_TEMPLATE];
  } catch {
    return [DEFAULT_TEMPLATE];
  }
}

export async function saveTemplates(templates: ClipperTemplate[]): Promise<void> {
  if (!templates.length) throw new Error('At least one template is required');
  const normalized = templates.map(normalizeTemplate);
  const ids = new Set(normalized.map((template) => template.id));
  if (ids.size !== normalized.length) throw new Error('Template IDs must be unique');
  await chrome.storage.local.set({ [TEMPLATES_KEY]: normalized });
}

export async function loadActiveTemplate(): Promise<ClipperTemplate> {
  const [templates, stored] = await Promise.all([
    loadTemplates(),
    chrome.storage.local.get(ACTIVE_TEMPLATE_KEY),
  ]);
  const activeId = stored[ACTIVE_TEMPLATE_KEY];
  return templates.find((template) => template.id === activeId) ?? templates[0] ?? DEFAULT_TEMPLATE;
}

export async function setActiveTemplate(id: string): Promise<void> {
  const templates = await loadTemplates();
  if (!templates.some((template) => template.id === id)) throw new Error(`Unknown template: ${id}`);
  await chrome.storage.local.set({ [ACTIVE_TEMPLATE_KEY]: id });
}
