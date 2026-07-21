import assert from 'node:assert/strict';
import { normalizeDeck, parseDeckValue } from './src/deckData.js';

const slide = { '__type': 'ET.Slide', content_: [] };
const deck = { '__type': 'ET.ZefSlides', brand: 'Zef', content_: [slide] };

assert.deepEqual(normalizeDeck(deck), deck, 'ET.ZefSlides is preserved');
assert.equal(normalizeDeck(slide), null, 'ET.Slide is not a presentation root');
assert.equal(normalizeDeck({ '__type': 'ET.Deck', content_: [slide] }), null, 'ET.Deck is not a presentation root');
assert.equal(parseDeckValue(deck).slides.length, 1, 'ZefSlides yields its child slides');
assert.match(parseDeckValue({ '__type': 'ET.ZefSlides', content_: [] }).error, /at least one ET\.Slide/, 'empty ZefSlides fails loudly');

console.log('deckData tests passed');
