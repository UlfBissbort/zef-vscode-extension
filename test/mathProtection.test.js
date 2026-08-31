/* +++
ET.JavaScriptFile('🍃-1f612c9560c251ba8bbc',
  tag_=[],
  created=Time('2026-07-23 08:53:20 +0800')
)
+++ */

const assert = require('node:assert/strict');
const test = require('node:test');
const { marked } = require('marked');
const { detectFeatures } = require('../out/htmlExport');
const { protectMath, restoreProtectedMath } = require('../out/mathProtection');

function render(source) {
    const protectedMath = protectMath(source);
    return {
        expressions: protectedMath.expressions,
        html: restoreProtectedMath(marked.parse(protectedMath.markdown), protectedMath)
    };
}

test('literal delimiters in inline code cannot consume later math', () => {
    const source = [
        'Displayed equations appear between `$$` markers; inline expressions appear between single `$` markers.',
        '',
        '### $\\{\\ldots\\}$ means “a set containing these things”',
        '',
        '$$\\{\\text{"Alice"}, \\text{"Bob"}, \\text{"Charlie"}\\}$$'
    ].join('\n');
    const result = render(source);

    assert.deepEqual(result.expressions, [
        '$\\{\\ldots\\}$',
        '$$\\{\\text{"Alice"}, \\text{"Bob"}, \\text{"Charlie"}\\}$$'
    ]);
    assert.match(result.html, /<code>\$\$<\/code>/);
    assert.match(result.html, /<h3>\$\\\{\\ldots\\\}\$ means/);
});

test('does not recognize delimiters in Markdown code', () => {
    assert.equal(detectFeatures('Use `$$` and `$` as literal delimiters.').usesLatex, false);
    assert.equal(detectFeatures('```python\nvalue = "$$"\n```').usesLatex, false);
    assert.equal(detectFeatures('    literal $$ in indented code').usesLatex, false);
    assert.equal(detectFeatures('Use $x$ as math.').usesLatex, true);
});

test('does not let unclosed display delimiters consume later inline math', () => {
    assert.deepEqual(render('Unclosed $$ followed by $x$').expressions, ['$x$']);
});
