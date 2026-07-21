import * as assert from 'assert';
import { findSlideFences, selectSlideFence } from './slidesParser';

const markdown = [
    '# Demo',
    '```zef',
    "ET.Deck(content_=[ET.Slide(content_=[])] )",
    '```',
    '```zef',
    "ET.Title(value='ordinary zef example')",
    '```'
].join('\n');

const fences = findSlideFences(markdown);
assert.strictEqual(fences.length, 1);
assert.strictEqual(fences[0].startLine, 1);
assert.ok(fences[0].source.startsWith('ET.Deck'));
assert.strictEqual(selectSlideFence(markdown).ok, true);
const noDeck = selectSlideFence('```zef\nET.Title(value=\'no deck\')\n```');
assert.strictEqual(noDeck.ok, false);
if (!noDeck.ok) assert.match(noDeck.message, /could not find/);
const multipleDecks = [markdown, '```zef', 'ET.Slide(content_=[])', '```'].join('\n');
const multiple = selectSlideFence(multipleDecks);
assert.strictEqual(multiple.ok, false);
if (!multiple.ok) assert.match(multiple.message, /one ET\.Deck/);

console.log('slidesParser tests passed');
