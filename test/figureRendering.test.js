const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Exercise the actual embedded webview renderer, including template-literal escaping.
const source = fs.readFileSync(path.join(__dirname, '../src/previewPanel.ts'), 'utf8');
const start = source.indexOf("var sideEffectsValue = document.getElementById('side-effects-value-' + blockId);");
const end = source.indexOf('// Show inline output area', start);
assert.ok(start >= 0 && end > start);
const renderer = vm.runInNewContext('`' + source.slice(start, end) + '`');
function render(figures, side_effects = []) {
    const element = { innerHTML: '' };
    vm.runInNewContext(renderer, {
        result: { figures, side_effects }, blockId: 'test',
        document: { getElementById: () => element }, highlightCode: text => text,
    });
    return element.innerHTML;
}
const figures = ['first', 'second'].map(data => ({ mime: 'image/png', data }));
const uploaded = (index) => ({ what: 'matplotlib_figure', content: `PNG('hash-${index}')`, figure_index: index });
function assertImages(html, expected) {
    assert.deepEqual([...html.matchAll(/<img src="data:image\/png;base64,([^"]+)"/g)].map(m => m[1]).sort(), expected.sort());
}

test('local figures render alongside stderr when storage is unavailable', () => {
    const html = render(figures, [{ what: 'stderr', content: 'FigureCanvasAgg is non-interactive' }]);
    assertImages(html, ['first', 'second']);
    assert.match(html, /FigureCanvasAgg/);
});
test('stdout does not hide local figures', () => {
    assertImages(render(figures, [{ what: 'stdout', content: 'hello' }]), ['first', 'second']);
});
test('legacy figures without effects render', () => assertImages(render(figures), ['first', 'second']));
test('successful uploads do not duplicate images', () => assertImages(render(figures, [uploaded(0), uploaded(1)]), ['first', 'second']));
test('partial upload failure preserves images and correct reference association', () => {
    const html = render(figures, [uploaded(1)]);
    assertImages(html, ['first', 'second']);
    const referencedPanel = html.split('class="figure-tabbed"')[1];
    assert.match(referencedPanel, /base64,second/);
    assert.match(referencedPanel, /hash-1/);
});
test('legacy unindexed figure effects still render once', () => {
    assertImages(render(figures, [{ what: 'matplotlib_figure', content: "PNG('legacy')" }]), ['first', 'second']);
});
test('text-only and empty results remain supported', () => {
    assert.match(render([], [{ what: 'stdout', content: 'hello' }]), /hello/);
    assert.equal(render([]), '');
});
