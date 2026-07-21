import * as assert from 'assert';
import { findSlideFences, selectSlideFence } from './slidesParser';

const markdown = [
    '# Demo',
    '```zef',
    "ET.ZefSlides(content_=[ET.Slide(content_=[])] )",
    '```',
    '```zef',
    "ET.Deck(content_=[ET.Slide(content_=[])] )",
    '```'
].join('\n');

const fences = findSlideFences(markdown);
assert.strictEqual(fences.length, 1);
assert.strictEqual(fences[0].startLine, 1);
assert.ok(fences[0].source.startsWith('ET.ZefSlides'));
assert.strictEqual(selectSlideFence(markdown).ok, true);
const noSlides = selectSlideFence('```zef\nET.Deck(content_=[ET.Slide(content_=[])])\n```');
assert.strictEqual(noSlides.ok, false);
if (!noSlides.ok) assert.match(noSlides.message, /could not find/);
const multipleSlides = [markdown, '```zef', 'ET.ZefSlides(content_=[])', '```'].join('\n');
const multiple = selectSlideFence(multipleSlides);
assert.strictEqual(multiple.ok, false);
if (!multiple.ok) assert.match(multiple.message, /one ET\.ZefSlides/);

console.log('slidesParser tests passed');
