import assert from 'node:assert/strict';
import { normalizeDeck, parseDeckValue } from './src/deckData.js';

const slide = { '__type': 'ET.Slide', content_: [] };
const deck = { '__type': 'ET.Deck', brand: 'Zef', content_: [slide] };

assert.deepEqual(normalizeDeck(deck), deck, 'ET.Deck is preserved');
assert.deepEqual(normalizeDeck(slide), {
  '__type': 'ET.Deck',
  title: 'Untitled deck',
  brand: 'Zef',
  content_: [slide]
}, 'ET.Slide normalizes to a one-slide Zef deck');
assert.equal(normalizeDeck({ '__type': 'ET.Title' }), null, 'other roots are rejected');
assert.equal(parseDeckValue(deck).error, '', 'deck with a slide is valid');
assert.equal(parseDeckValue(slide).slides.length, 1, 'single slide is renderable');
assert.match(parseDeckValue({ '__type': 'ET.Deck', content_: [] }).error, /at least one ET\.Slide/, 'empty deck fails loudly');
assert.match(parseDeckValue(null).error, /ET\.Deck.*ET\.Slide/, 'missing input fails loudly');

console.log('deckData tests passed');
