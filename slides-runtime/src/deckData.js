/* +++
ET.JavaScriptFile('🍃-0619f410dc916a2011cb',
  tag_=[],
  created=Time('2026-07-21 12:30:45 +0800')
)
+++ */

// @ts-nocheck
// Plain deck-data transformations. No browser, Svelte, or VS Code dependencies.

export function normalizeDeck(value) {
  return value?.__type === 'ET.ZefSlides' ? value : null;
}

export function parseDeckValue(value) {
  const deck = normalizeDeck(value);
  if (!deck) {
    return {
      deck: null,
      slides: [],
      error: 'Slide data must have root type "ET.ZefSlides".'
    };
  }

  const slides = (deck.content_ ?? []).filter((node) => node?.__type === 'ET.Slide');
  if (slides.length === 0) {
    return {
      deck: null,
      slides: [],
      error: 'ET.ZefSlides must contain at least one ET.Slide in content_.'
    };
  }

  return { deck, slides, error: '' };
}
