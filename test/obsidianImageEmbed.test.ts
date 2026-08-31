/* +++
ET.TypeScriptFile('🍃-359bf26f66ff7630c99d',
  tag_=[],
  created=Time('2026-08-06 10:30:45 +0800')
)
+++ */

import { Marked } from 'marked';
import { strict as assert } from 'node:assert';
import test from 'node:test';
import {
    decodeObsidianImageData,
    obsidianImageEmbedExtension,
    parseObsidianImageEmbed,
    renderMissingObsidianImageEmbed,
    resolveObsidianImagePath,
} from '../src/obsidianImageEmbed';
import { zefImageEmbedExtension } from '../src/zefImageEmbed';

const SAMPLE_HASH = '🗿-64d8c91b31c998c991b68b9878d74a474543d1d59b9c984b5cbbb16d69e0df7a';

function render(source: string): string {
    return new Marked({ extensions: [zefImageEmbedExtension, obsidianImageEmbedExtension] }).parse(source) as string;
}

test('parses sibling and nested Obsidian image embeds', () => {
    assert.deepEqual(parseObsidianImageEmbed('![[akb-buddy-home-ui-reference.png]]'), {
        raw: '![[akb-buddy-home-ui-reference.png]]',
        source: 'akb-buddy-home-ui-reference.png',
        dimensions: undefined,
    });
    assert.equal(parseObsidianImageEmbed('![[assets/Pasted image 1.PNG|400x300]]')?.source, 'assets/Pasted image 1.PNG');
    assert.equal(parseObsidianImageEmbed('![[assets/Pasted image 1.PNG|400x300]]')?.dimensions, '400x300');
});

test('renders local images with lossless metadata for later file resolution', () => {
    const html = render('![[Pasted image 20260205160558.png|400]]');
    assert.match(html, /data-obsidian-image-embed/);
    assert.match(html, /data-obsidian-source="Pasted%20image%2020260205160558.png"/);
    assert.match(html, /data-obsidian-dimensions="400"/);
    assert.match(html, /src="Pasted%20image%2020260205160558.png"/);
    assert.equal(decodeObsidianImageData('Pasted%20image%2020260205160558.png'), 'Pasted image 20260205160558.png');
    assert.equal(decodeObsidianImageData('%E0%A4'), null, 'malformed attribute data must not crash preview rendering');
});

test('resolves only validated paths relative to the containing note', () => {
    assert.equal(resolveObsidianImagePath('/vault/notes', 'assets/image.png'), '/vault/notes/assets/image.png');
    assert.equal(resolveObsidianImagePath('/vault/notes', '../private.png'), null);
    assert.equal(resolveObsidianImagePath('/vault/notes', '/private.png'), null);
    assert.equal(resolveObsidianImagePath('/vault/notes', 'https://example.com/image.png'), null);
});

test('does not claim Zef embeds, notes, remote paths, traversal, or non-images', () => {
    assert.equal(parseObsidianImageEmbed(`![[PngImage('${SAMPLE_HASH}')]]`), null);
    assert.equal(parseObsidianImageEmbed('![[Overview]]'), null);
    assert.equal(parseObsidianImageEmbed('![[https://example.com/image.png]]'), null);
    assert.equal(parseObsidianImageEmbed('![[../private.png]]'), null);
    assert.equal(parseObsidianImageEmbed('![[report.pdf]]'), null);

    const zefHtml = render(`![[PngImage('${SAMPLE_HASH}')]]`);
    assert.match(zefHtml, /data-zef-image-type="PngImage"/, 'Zef hash images retain their existing renderer');
    assert.doesNotMatch(zefHtml, /data-obsidian-image-embed/);
});

test('does not render embeds inside inline or fenced code', () => {
    assert.match(render('`![[image.png]]`'), /<code>!\[\[image.png\]\]<\/code>/);
    assert.match(render('```\n![[image.png]]\n```'), /<code>!\[\[image.png\]\]/);
});

test('missing fallback retains literal embed and safely escapes hostile names', () => {
    const html = renderMissingObsidianImageEmbed('![[<missing>.png]]');
    assert.match(html, /!\[\[&lt;missing&gt;.png\]\]/);
    assert.match(html, /image unavailable/);
});
