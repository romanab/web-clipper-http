import { loadConfig, saveConfig } from '../config.js';

const form = document.querySelector<HTMLFormElement>('#config-form');
const endpoint = document.querySelector<HTMLInputElement>('#endpoint');
const token = document.querySelector<HTMLInputElement>('#token');
const status = document.querySelector<HTMLElement>('#status');

if (!form || !endpoint || !token || !status) throw new Error('Options page is incomplete');

void loadConfig().then((config) => {
  endpoint.value = config.endpoint;
  token.value = config.bearerToken ?? '';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.textContent = '';
  try {
    await saveConfig({
      endpoint: endpoint.value,
      bearerToken: token.value || undefined,
    });
    status.textContent = 'Saved';
    setTimeout(() => { status.textContent = ''; }, 1500);
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : String(error);
  }
});
