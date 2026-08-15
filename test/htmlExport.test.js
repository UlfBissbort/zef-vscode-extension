const test = require('node:test');
const assert = require('node:assert/strict');
const { embedRenderedMermaid, generateStandaloneHtml, getExportCss, prepareMermaidForExport } = require('../out/htmlExport.js');
const { parseDocumentFrontmatter, renderDocumentFrontmatter } = require('../out/frontmatterParser.js');

test('export includes styled TOML frontmatter and its interactive metadata helpers', () => {
    const frontmatter = parseDocumentFrontmatter(`+++\nthis = "ET.MarkdownDocument('🍃-123')"\nimportance = 2\ntag_ = ["aging"]\ncreated = "Time('2026-08-15 08:00:16 +0800')"\n+++`);
    const html = generateStandaloneHtml({
        renderedHtml: renderDocumentFrontmatter(frontmatter) + '<h1>Document</h1>',
        title: 'Document',
        maxWidth: 680,
        usesLatex: false,
        usesMermaid: false,
    });
    assert.match(html, /document-identity/);
    assert.match(html, /frontmatter-chip/);
    assert.match(html, /frontmatter-relative-time/);
    assert.match(html, /function copyEntityDescriptor/);
    assert.match(html, /function updateLocalizedTimes/);
    assert.match(html, /Intl\.DateTimeFormat\(\)\.resolvedOptions\(\)\.timeZone/);
    assert.match(html, /function updateRelativeTimes/);
});

test('export table CSS matches the preview without zebra striping', () => {
    const css = getExportCss(680);
    assert.match(css, /\.table-wrapper\s*\{[\s\S]*?width: fit-content/);
    assert.match(css, /\.table-wrapper table\s*\{[\s\S]*?width: auto/);
    assert.match(css, /th, td\s*\{[\s\S]*?padding: 10px 14px/);
    assert.doesNotMatch(css, /tr:nth-child\(even\)/);
});

test('embedRenderedMermaid uses preview SVGs and reports a complete capture', () => {
    const source = '<pre><code class="language-mermaid">flowchart TB\nA--&gt;B</code></pre>';
    const result = embedRenderedMermaid(source, ['<svg viewBox="0 0 10 10"><path /></svg>']);
    assert.equal(result.totalCount, 1);
    assert.equal(result.renderedCount, 1);
    assert.match(result.html, /<div class="mermaid mermaid-static"><svg/);
    const exported = generateStandaloneHtml({
        renderedHtml: result.html,
        title: 'Diagram',
        maxWidth: 680,
        usesLatex: false,
        usesMermaid: false,
    });
    assert.doesNotMatch(exported, /mermaid\.run/);
});

test('embedRenderedMermaid leaves a missing preview SVG for the runtime fallback', () => {
    const source = '<pre><code class="language-mermaid">flowchart TB\nA--&gt;B</code></pre>';
    const result = embedRenderedMermaid(source, []);
    assert.equal(result.totalCount, 1);
    assert.equal(result.renderedCount, 0);
    assert.match(result.html, /language-mermaid/);
});

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
