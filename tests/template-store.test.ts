import { describe, expect, it } from 'vitest';
import { DEFAULT_TEMPLATE, importTemplateData, mergeImportedTemplates } from '../src/templates/store.js';

describe('template import management', () => {
  const exported = {
    schemaVersion: '0.1.0',
    name: 'Default',
    behavior: 'create',
    noteNameFormat: '{{title}}',
    path: '',
    noteContentFormat: '{{content}}',
    properties: [{ name: 'source', value: '{{url}}', type: 'text' }],
    triggers: [],
  };

  it('replaces the built-in placeholder on first real import', () => {
    const imported = importTemplateData(exported);
    const result = mergeImportedTemplates([DEFAULT_TEMPLATE], imported);
    expect(result.added).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.templates).toHaveLength(1);
    expect(result.templates[0].name).toBe('Default');
  });

  it('skips exact duplicate Obsidian template imports', () => {
    const first = importTemplateData(exported)[0];
    const second = importTemplateData(exported)[0];
    expect(first.id).not.toBe(second.id);
    const result = mergeImportedTemplates([first], [second]);
    expect(result.added).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.templates).toEqual([first]);
  });
});
