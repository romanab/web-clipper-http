import { loadConfig, saveConfig } from '../config.js';
import { exportTemplateData, importTemplateData, loadTemplates, saveTemplates } from '../templates/store.js';

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Options page is missing ${selector}`);
  return element;
}

const form = requireElement<HTMLFormElement>('#config-form');
const endpoint = requireElement<HTMLInputElement>('#endpoint');
const token = requireElement<HTMLInputElement>('#token');
const status = requireElement<HTMLElement>('#status');
const templateFile = requireElement<HTMLInputElement>('#template-file');
const importButton = requireElement<HTMLButtonElement>('#import-templates');
const exportButton = requireElement<HTMLButtonElement>('#export-templates');
const templateList = requireElement<HTMLUListElement>('#template-list');
const templateStatus = requireElement<HTMLElement>('#template-status');

void loadConfig().then((config) => {
  endpoint.value = config.endpoint;
  token.value = config.bearerToken ?? '';
});

async function renderTemplates(): Promise<void> {
  const templates = await loadTemplates();
  templateList.replaceChildren(...templates.map((template) => {
    const item = document.createElement('li');
    item.textContent = `${template.name} (${template.id})`;
    return item;
  }));
}

void renderTemplates();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.textContent = '';
  try {
    await saveConfig({ destination: 'http', endpoint: endpoint.value, bearerToken: token.value || undefined });
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
    const existing = await loadTemplates();
    const existingIsDefaultOnly = existing.length === 1 && existing[0]?.id === 'http-default';
    await saveTemplates(existingIsDefaultOnly ? imported : [...existing, ...imported]);
    await renderTemplates();
    templateStatus.textContent = `Imported ${imported.length} template${imported.length === 1 ? '' : 's'}`;
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
