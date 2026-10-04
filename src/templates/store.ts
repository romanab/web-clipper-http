import type { ClipperTemplate } from '../clipper/adapter.js';

const TEMPLATES_KEY = 'webClipperHttpTemplates';
const ACTIVE_TEMPLATE_KEY = 'webClipperHttpActiveTemplate';

export const DEFAULT_TEMPLATE: ClipperTemplate = {
  id: 'http-default',
  name: 'HTTP default',
  behavior: 'create',
  noteNameFormat: '{{title}}',
  path: '',
  noteContentFormat: '# {{title}}\n\n{{content}}\n',
  properties: [{ name: 'source', value: '{{url}}', type: 'text' }],
};

function isTemplate(value: unknown): value is ClipperTemplate {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string'
    && typeof candidate.name === 'string'
    && typeof candidate.behavior === 'string'
    && typeof candidate.noteNameFormat === 'string'
    && typeof candidate.path === 'string'
    && typeof candidate.noteContentFormat === 'string'
    && Array.isArray(candidate.properties);
}

export async function loadTemplates(): Promise<ClipperTemplate[]> {
  const stored = await chrome.storage.local.get(TEMPLATES_KEY);
  const value: unknown = stored[TEMPLATES_KEY];
  if (!Array.isArray(value)) return [DEFAULT_TEMPLATE];
  const templates = value.filter(isTemplate);
  return templates.length ? templates : [DEFAULT_TEMPLATE];
}

export async function saveTemplates(templates: ClipperTemplate[]): Promise<void> {
  if (!templates.length) throw new Error('At least one template is required');
  if (!templates.every(isTemplate)) throw new Error('Invalid template data');
  const ids = new Set(templates.map((template) => template.id));
  if (ids.size !== templates.length) throw new Error('Template IDs must be unique');
  await chrome.storage.local.set({ [TEMPLATES_KEY]: templates });
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
