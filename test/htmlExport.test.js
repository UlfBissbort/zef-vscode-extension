const test = require('node:test');
const assert = require('node:assert/strict');
const { generateStandaloneHtml, prepareMermaidForExport } = require('../out/htmlExport.js');

test('prepareMermaidForExport replaces a Mermaid code fence with a Mermaid element', () => {
    const html = '<pre><code class="language-mermaid">flowchart TB\nA--&gt;B</code></pre>';
    assert.equal(
        prepareMermaidForExport(html),
        '<div class="mermaid">flowchart TB\nA--&gt;B</div>'
    );
});

test('prepareMermaidForExport leaves non-Mermaid code fences unchanged', () => {
    const html = '<pre><code class="language-javascript">const diagram = false;</code></pre>';
    assert.equal(prepareMermaidForExport(html), html);
});

test('generateStandaloneHtml prepares Mermaid elements before its renderer runs', () => {
    const html = generateStandaloneHtml({
        renderedHtml: '<pre><code class="language-mermaid">flowchart TB\nA--&gt;B</code></pre>',
        title: 'Diagram',
        maxWidth: 680,
        usesLatex: false,
        usesMermaid: true,
        mermaidJs: 'window.mermaid = { initialize: function () {}, run: function () {} };',
    });
    assert.match(html, /<div class="mermaid">flowchart TB\nA--&gt;B<\/div>/);
    assert.doesNotMatch(html, /<pre><code class="language-mermaid">/);
    assert.match(html, /mermaid\.run\(\{ nodes: document\.querySelectorAll\('\.mermaid'\) \}\)/);
});
