import { loadConfig, saveConfig, type HttpPayloadMode } from '../config.js';
import {
  deleteTemplate, exportTemplateData, importTemplateData, loadActiveTemplate, loadTemplates,
  mergeImportedTemplates, renameTemplate, saveTemplates, setActiveTemplate,
} from '../templates/store.js';

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Options page is missing ${selector}`);
  return element;
}

const form = requireElement<HTMLFormElement>('#config-form');
const endpoint = requireElement<HTMLInputElement>('#endpoint');
const token = requireElement<HTMLInputElement>('#token');
const payloadMode = requireElement<HTMLSelectElement>('#payload-mode');
const status = requireElement<HTMLElement>('#status');
const templateFile = requireElement<HTMLInputElement>('#template-file');
const importButton = requireElement<HTMLButtonElement>('#import-templates');
const exportButton = requireElement<HTMLButtonElement>('#export-templates');
const templateList = requireElement<HTMLUListElement>('#template-list');
const templateStatus = requireElement<HTMLElement>('#template-status');

void loadConfig().then((config) => {
  endpoint.value = config.endpoint;
  token.value = config.bearerToken ?? '';
  payloadMode.value = config.payloadMode;
});

async function renderTemplates(): Promise<void> {
  const [templates, active] = await Promise.all([loadTemplates(), loadActiveTemplate()]);
  templateList.replaceChildren(...templates.map((template) => {
    const item = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = `${template.name}${template.id === active.id ? ' — active' : ''} `;
    item.append(label);

    if (template.id !== active.id) {
      const activate = document.createElement('button');
      activate.type = 'button';
      activate.textContent = 'Use';
      activate.addEventListener('click', async () => {
        await setActiveTemplate(template.id);
        await renderTemplates();
      });
      item.append(activate, document.createTextNode(' '));
    }

    const rename = document.createElement('button');
    rename.type = 'button';
    rename.textContent = 'Rename';
    rename.addEventListener('click', async () => {
      const name = window.prompt('Template name', template.name);
      if (name === null || name.trim() === template.name) return;
      try {
        await renameTemplate(template.id, name);
        await renderTemplates();
        templateStatus.textContent = 'Template renamed';
      } catch (error) {
        templateStatus.textContent = error instanceof Error ? error.message : String(error);
      }
    });
    item.append(rename, document.createTextNode(' '));

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Delete';
    remove.disabled = templates.length <= 1;
    remove.addEventListener('click', async () => {
      if (!window.confirm(`Delete template “${template.name}”?`)) return;
      try {
        await deleteTemplate(template.id);
        await renderTemplates();
        templateStatus.textContent = 'Template deleted';
      } catch (error) {
        templateStatus.textContent = error instanceof Error ? error.message : String(error);
      }
    });
    item.append(remove);
    return item;
  }));
}

void renderTemplates();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.textContent = '';
  try {
    await saveConfig({ destination: 'http', endpoint: endpoint.value, bearerToken: token.value || undefined, payloadMode: payloadMode.value as HttpPayloadMode });
    status.textContent = 'Saved';
    setTimeout(() => { status.textContent = ''; }, 1500);
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : String(error);
  }
});

importButton.addEventListener('click', async () => {
  templateStatus.textContent = '';
  try {
    const file = templateFile.files?.[0];
    if (!file) throw new Error('Choose a JSON file first');
    const imported = importTemplateData(JSON.parse(await file.text()));
    const merged = mergeImportedTemplates(await loadTemplates(), imported);
    await saveTemplates(merged.templates);
    await renderTemplates();
    templateStatus.textContent = `Imported ${merged.added}; skipped ${merged.skipped} exact duplicate${merged.skipped === 1 ? '' : 's'}`;
  } catch (error) {
    templateStatus.textContent = error instanceof Error ? error.message : String(error);
  }
});

exportButton.addEventListener('click', async () => {
  templateStatus.textContent = '';
  try {
    const templates = await loadTemplates();
    const exported = templates.map(exportTemplateData);
    const payload = exported.length === 1 ? exported[0] : exported;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = templates.length === 1 ? `${templates[0].name.replace(/\s+/g, '-').toLowerCase()}-clipper.json` : 'web-clipper-templates.json';
    anchor.click();
    URL.revokeObjectURL(url);
    templateStatus.textContent = `Exported ${templates.length} template${templates.length === 1 ? '' : 's'}`;
  } catch (error) {
    templateStatus.textContent = error instanceof Error ? error.message : String(error);
  }
});
