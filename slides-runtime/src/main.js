// @ts-nocheck
import { mount } from 'svelte';
import SlideApp from './SlideApp.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('Missing #app mount target');

function dispatchUpdate(update) {
  if (!update || typeof update !== 'object') return;
  if (update.type === 'requestFullscreen') {
    document.documentElement.requestFullscreen().catch((error) => {
      dispatchUpdate({ type: 'setError', error: `Could not enter fullscreen: ${error.message}` });
    });
    return;
  }
  if (update.type !== 'setDeck' && update.type !== 'setError') return;
  window.dispatchEvent(new CustomEvent('zef-slides-update', { detail: update }));
}

window.ZefSlides = Object.freeze({
  setDeck(deck) {
    dispatchUpdate({ type: 'setDeck', deck });
  },
  setError(error) {
    dispatchUpdate({ type: 'setError', error });
  }
});

window.addEventListener('message', (event) => dispatchUpdate(event.data));

const app = mount(SlideApp, { target });
window.dispatchEvent(new CustomEvent('zef-slides-ready'));

export default app;
