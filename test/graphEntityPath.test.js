/* +++
ET.JavaScriptFile('🍃-060a2ecf41d476aad547',
  tag_=[],
  created=Time('2026-09-27 10:21:20 +0800')
)
+++ */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseEntityInput, resolveGraphPath, graphEntityState, containingFile, resolveTrackedPath, findAnnotationLine } = require('../out/graphEntityPath');

const entity = "ET.MarkdownDocument('🍃-c041c8aeec08768afec8')";
const show = (state, exists = true) => JSON.stringify({ ok: true, data: { result: { exists, state } } });
const state = { __type: 'ET.MarkdownDocument', __uid: '🍃-c041c8aeec08768afec8', root_uid: '🍃-root', path: 'notes/guide.md' };
const tracking = rules => JSON.stringify({ data: { rules } });
const rules = [{ root_uid: '🍃-root', root: '/tmp/project' }, { root_uid: '🍃-root', root: '/tmp/project' }];

test('accepts only typed entity IDs (never passes arbitrary input to CLI)', () => {
    assert.equal(parseEntityInput(` ${entity} `), entity);
    assert.equal(parseEntityInput('🍃-c041c8aeec08768afec8'), undefined);
    assert.equal(parseEntityInput(`${entity}; rm -rf /`), undefined);
});

test('maps committed path through root UID, not workspace or CLI cwd', () => {
    assert.equal(resolveGraphPath(show(state), tracking(rules), entity), '/tmp/project/notes/guide.md');
});

test('resolves a code definition via its unique containing file and exact anchor', () => {
    const definition = "ET.FunctionDefinition('🍃-5f268e87060724b801bf')";
    const codeState = graphEntityState(show({ __type: 'ET.FunctionDefinition', __uid: '🍃-5f268e87060724b801bf' }), definition);
    assert.equal(codeState.path, undefined);
    const query = JSON.stringify({ ok: true, data: { result: [state] } });
    assert.equal(resolveTrackedPath(containingFile(query), tracking(rules)), '/tmp/project/notes/guide.md');
    assert.equal(findAnnotationLine(`intro\nfn f() { // ⚓️ ${definition}\nbody`, definition), 1);
    assert.equal(findAnnotationLine('no annotation', definition), undefined);
    assert.throws(() => findAnnotationLine(`⚓️ ${definition}\n⚓️ ${definition}`, definition));
    assert.throws(() => containingFile(JSON.stringify({ ok: true, data: { result: [] } })));
    assert.throws(() => containingFile(JSON.stringify({ ok: true, data: { result: [state, state] } })));
});

test('rejects missing identities, unsafe paths and ambiguous roots', () => {
    assert.throws(() => resolveGraphPath(show(state, false), tracking(rules), entity));
    assert.throws(() => resolveGraphPath(show({ ...state, __uid: '🍃-other' }), tracking(rules), entity));
    assert.throws(() => resolveGraphPath(show({ ...state, path: '../outside.md' }), tracking(rules), entity));
    assert.throws(() => resolveGraphPath(show({ ...state, path: '/etc/passwd' }), tracking(rules), entity));
    assert.throws(() => resolveGraphPath(show(state), tracking([{ ...rules[0] }, { ...rules[0], root: '/tmp/other' }]), entity));
});
