const assert = require('node:assert/strict');
const test = require('node:test');
const { StoreBridge } = require('../out/storeBridge');
const { buildSaveMessage, buildRetrieveMessage, parseSaveResponse, parseRetrieveResponse } = require('../out/tokoloshService');
const hash = '🗿-' + 'ab'.repeat(32);

test('current Store request shapes carry real image values and typed Merkle hashes', () => {
    assert.deepEqual(buildSaveMessage('PngImage', 'YWJj'), {
        operation: 'execute', command: { __type: 'FX.SaveToHashStore', value: { __type: 'PngImage', data: 'YWJj' } },
    });
    assert.deepEqual(buildRetrieveMessage('PngImage', hash), {
        operation: 'execute', command: { __type: 'FX.RetrieveFromHashStore', hash: { __type: 'MerkleHash', data_type: 'PngImage', hash } },
    });
    assert.throws(() => buildRetrieveMessage('PngImage', 'invalid'), /Merkle/);
    assert.throws(() => buildSaveMessage('Unrecognized', ''), /Unsupported/);
});
test('SVG is UTF-8 text at the Zef JSON-like boundary, not base64', () => {
    const text = '<svg>λ 🐈</svg>';
    const encoded = Buffer.from(text).toString('base64');
    assert.equal(buildSaveMessage('SvgImage', encoded).command.value.data, text);
    assert.deepEqual(parseRetrieveResponse({ __type: 'SvgImage', data: text }), { status: 'found', type: 'SvgImage', data: encoded });
});
test('save requires a valid Merkle hash and physical-merge receipt', () => {
    const saved = { hash: { __type: 'MerkleHash', data_type: 'PngImage', hash }, receipt: { status: 'merged', guarantee: 'physical_records' } };
    assert.deepEqual(parseSaveResponse(saved), { status: 'saved', hash });
    assert.equal(parseSaveResponse({ ...saved, receipt: null }).status, 'error');
    assert.equal(parseSaveResponse({ ...saved, hash: { __type: 'MerkleHash', hash: '🗿-bad' } }).status, 'error');
    assert.equal(parseSaveResponse({ __type: 'ET.HashStoreResponse', hash }).status, 'error');
});
test('retrieve uses direct values and never converts an error into a missing image', () => {
    assert.equal(parseRetrieveResponse({ __type: 'PngImage', data: '' }).status, 'found');
    assert.equal(parseRetrieveResponse({ __type: 'Error.ZefStoreError', reason: 'missing_key' }).status, 'error');
    assert.equal(parseRetrieveResponse({ __type: 'ET.HashStoreGetResponse', value: { __type: 'PngImage', data: 'YWJj' } }).status, 'error');
});
test('runtime startup failures reject requests, including queued requests', async () => {
    const previous = process.env.ZEF_STORE_PYTHON;
    process.env.ZEF_STORE_PYTHON = '/nonexistent/zef-test-python';
    const bridge = new StoreBridge();
    try {
        const results = await Promise.allSettled(Array.from({ length: 9 }, () => bridge.request({ operation: 'probe' })));
        assert.ok(results.every(result => result.status === 'rejected'));
        assert.match(results[0].reason.message, /runtime failed/);
    } finally {
        bridge.dispose();
        if (previous === undefined) { delete process.env.ZEF_STORE_PYTHON; }
        else { process.env.ZEF_STORE_PYTHON = previous; }
    }
});
test('disposed bridge rejects new requests', async () => {
    const bridge = new StoreBridge();
    bridge.dispose();
    await assert.rejects(bridge.request({ operation: 'probe' }), /disposed/);
});
