// @ts-nocheck
// Plain deck-data transformations. No browser, Svelte, or VS Code dependencies.

export function normalizeDeck(value) {
  if (value?.__type === 'ET.Deck') return value;

  if (value?.__type === 'ET.Slide') {
    return {
      '__type': 'ET.Deck',
      title: value.title ?? 'Untitled deck',
      brand: value.brand ?? 'Zef',
      content_: [value]
    };
  }

  return null;
}

export function parseDeckValue(value) {
  const deck = normalizeDeck(value);
  if (!deck) {
    return {
      deck: null,
      slides: [],
      error: 'Slide data must have root type "ET.Deck" or "ET.Slide".'
    };
  }

  const slides = (deck.content_ ?? []).filter((node) => node?.__type === 'ET.Slide');
  if (slides.length === 0) {
    return {
      deck: null,
      slides: [],
      error: 'ET.Deck must contain at least one ET.Slide in content_.'
    };
  }

  return { deck, slides, error: '' };
}
