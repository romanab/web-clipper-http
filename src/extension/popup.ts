import { compileClip, type ClipperTemplate } from '../clipper/adapter.js';
import { loadConfig } from '../config.js';
import { HttpDestination } from '../destinations/http.js';

const button = document.querySelector<HTMLButtonElement>('#clip');
const status = document.querySelector<HTMLElement>('#status');
if (!button || !status) throw new Error('Popup is incomplete');

const defaultTemplate: ClipperTemplate = {
  id: 'http-default', name: 'HTTP default', behavior: 'create',
  noteNameFormat: '{{title}}', path: '',
  noteContentFormat: '# {{title}}\n\n{{content}}\n',
  properties: [{ name: 'source', value: '{{url}}', type: 'text' }],
};

button.addEventListener('click', async () => {
  button.disabled = true;
  status.textContent = 'Clipping...';
  try {
    const config = await loadConfig();
    if (!config.endpoint) throw new Error('Configure an HTTP endpoint first');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id || !tab.url) throw new Error('No active web page');

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({ html: document.documentElement.outerHTML, title: document.title }),
    });
    const page = results[0]?.result;
    if (!page) throw new Error('Could not read the page');

    const compiled = await compileClip({
      html: page.html, url: tab.url, template: defaultTemplate, documentParser: new DOMParser(),
    });
    await new HttpDestination(config).send(compiled, { sourceUrl: tab.url, sourceTitle: page.title });
    status.textContent = `Sent: ${compiled.noteName}`;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : String(error);
  } finally {
    button.disabled = false;
  }
});
