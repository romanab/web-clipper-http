import { compileClip } from '../clipper/adapter.js';
import { loadConfig } from '../config.js';
import { getDestination } from '../destinations/registry.js';
import { loadActiveTemplate } from '../templates/store.js';

const button = document.querySelector<HTMLButtonElement>('#clip');
const status = document.querySelector<HTMLElement>('#status');
if (!button || !status) throw new Error('Popup is incomplete');

button.addEventListener('click', async () => {
  button.disabled = true;
  status.textContent = 'Clipping...';
  try {
    const [config, template] = await Promise.all([loadConfig(), loadActiveTemplate()]);
    const destination = getDestination(config.destination, config);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id || !tab.url) throw new Error('No active web page');

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({ html: document.documentElement.outerHTML, title: document.title }),
    });
    const page = results[0]?.result;
    if (!page) throw new Error('Could not read the page');

    const compiled = await compileClip({
      html: page.html, url: tab.url, template, documentParser: new DOMParser(),
    });
    await destination.send(compiled, { sourceUrl: tab.url, sourceTitle: page.title });
    status.textContent = `Sent: ${compiled.noteName}`;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : String(error);
  } finally {
    button.disabled = false;
  }
});
