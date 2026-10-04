import { loadConfig, saveConfig } from '../config.js';
import { loadTemplates, saveTemplates } from '../templates/store.js';

const form = document.querySelector<HTMLFormElement>('#config-form');
const endpoint = document.querySelector<HTMLInputElement>('#endpoint');
const token = document.querySelector<HTMLInputElement>('#token');
const status = document.querySelector<HTMLElement>('#status');
const templateFile = document.querySelector<HTMLInputElement>('#template-file');
const importButton = document.querySelector<HTMLButtonElement>('#import-templates');
const exportButton = document.querySelector<HTMLButtonElement>('#export-templates');
const templateList = document.querySelector<HTMLUListElement>('#template-list');
const templateStatus = document.querySelector<HTMLElement>('#template-status');

if (!form || !endpoint || !token || !status || !templateFile || !importButton || !exportButton || !templateList || !templateStatus) {
  throw new Error('Options page is incomplete');
}

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
    const parsed: unknown = JSON.parse(await file.text());
    const templates = Array.isArray(parsed) ? parsed : [parsed];
    await saveTemplates(templates);
    await renderTemplates();
    templateStatus.textContent = `Imported ${templates.length} template${templates.length === 1 ? '' : 's'}`;
  } catch (error) {
    templateStatus.textContent = error instanceof Error ? error.message : String(error);
  }
});

exportButton.addEventListener('click', async () => {
  templateStatus.textContent = '';
  try {
    const templates = await loadTemplates();
    const blob = new Blob([JSON.stringify(templates, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'web-clipper-templates.json';
    anchor.click();
    URL.revokeObjectURL(url);
    templateStatus.textContent = `Exported ${templates.length} template${templates.length === 1 ? '' : 's'}`;
  } catch (error) {
    templateStatus.textContent = error instanceof Error ? error.message : String(error);
  }
});
