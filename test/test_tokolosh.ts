/* +++
ET.TypeScriptFile('🍃-aae1d9511d136d86d323',
  tag_=[],
  created=Time('2026-03-10 14:12:13 +0800')
)
+++ */

/**
 * Standalone tests for content-addressed Zef images.
 * Run: cd /Users/ulf/dev/zef-vscode-extension && npx tsx test/test_tokolosh.ts
 */
import {
    zefTypeToMime,
    buildDataUri,
    generateUid,
    buildRetrieveMessage,
    buildSaveMessage,
    parseRetrieveResponse,
    parseSaveResponse,
    buildPlaceholderDataUri,
    mimeToZefType,
    TokoloshService,
} from '../src/tokoloshService';
import { buildZefImageEmbed, imageDimensionAttributes, parseZefEmbed, parseZefImageEmbed, zefImageEmbedExtension } from '../src/zefImageEmbed';
import { Marked } from 'marked';

const SAMPLE_HASH = '🗿-64d8c91b31c998c991b68b9878d74a474543d1d59b9c984b5cbbb16d69e0df7a';

function check(condition: unknown, message: string): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}

function testPureFunctions() {
    console.log('=== Zef image embed tests ===\n');

    const valid = parseZefImageEmbed(`![[PngImage('${SAMPLE_HASH}')]]`);
    check(valid?.type === 'PngImage', 'canonical embed type should parse');
    check(valid.hash === SAMPLE_HASH, 'canonical embed hash should parse');
    const sized = parseZefImageEmbed(`![[PngImage('${SAMPLE_HASH}')|400x300]]`);
    check(sized?.dimensions === '400x300', 'image embed dimensions should parse');
    check(parseZefImageEmbed(`![[PngImage('${SAMPLE_HASH}')|0]]`)?.dimensions === '0', 'numeric dimensions remain parser-safe');
    check(parseZefImageEmbed(`![[PngImage('${SAMPLE_HASH}')|wide]]`) === null, 'non-numeric dimensions must not parse');
    check(imageDimensionAttributes('400x300') === ' width="400" height="300"', 'dimensions become safe image attributes');
    check(imageDimensionAttributes('400" onerror="alert(1)') === '', 'unsafe dimensions never become HTML attributes');
    check(parseZefEmbed(`![[ET.SvelteComponent('${SAMPLE_HASH}')|400]]`) === null, 'dimensions apply only to image embeds');
    check(parseZefImageEmbed(`![](zef:PngImage/${SAMPLE_HASH})`) === null, 'legacy URI must not parse');
    check(parseZefImageEmbed(`![[UnknownImage('${SAMPLE_HASH}')]]`) === null, 'unknown type must not parse');
    check(parseZefImageEmbed("![[PngImage('too-short')]]") === null, 'short hash must not parse');
    check(parseZefEmbed(`![[ET.SvelteComponent('${SAMPLE_HASH}')]]`)?.type === 'ET.SvelteComponent', 'Svelte component embed should parse');
    check(
        buildZefImageEmbed('PngImage', SAMPLE_HASH) === `![[PngImage('${SAMPLE_HASH}')]]`,
        'formatter must emit canonical syntax'
    );
    console.log('✓ strict parser and canonical formatter');

    const markdown = new Marked({ extensions: [zefImageEmbedExtension] });
    const renderedEmbed = markdown.parse(`![[PngImage('${SAMPLE_HASH}')]]`) as string;
    check(renderedEmbed.includes(`data-zef-image-type="PngImage"`), 'embed should render an image token');
    check(renderedEmbed.includes(`data-zef-image-hash="${SAMPLE_HASH}"`), 'rendered token should retain hash');
    const renderedSizedEmbed = markdown.parse(`![[PngImage('${SAMPLE_HASH}')|400]]`) as string;
    check(renderedSizedEmbed.includes('data-zef-image-dimensions="400"'), 'rendered image should retain safe dimensions for resolution');
    const renderedSvelte = markdown.parse(`![[ET.SvelteComponent('${SAMPLE_HASH}')]]`) as string;
    check(renderedSvelte.includes(`data-zef-svelte-hash="${SAMPLE_HASH}"`), 'Svelte embed should render a placeholder');
    const renderedInlineCode = markdown.parse(`\`![[PngImage('${SAMPLE_HASH}')]]\``) as string;
    check(renderedInlineCode.includes('<code>![[PngImage('), 'embed in inline code must remain literal');
    const renderedFence = markdown.parse(`\`\`\`\n![[PngImage('${SAMPLE_HASH}')]]\n\`\`\``) as string;
    check(renderedFence.includes('<code>![[PngImage('), 'embed in fenced code must remain literal');
    const renderedLegacy = markdown.parse(`![](zef:PngImage/${SAMPLE_HASH})`) as string;
    check(!renderedLegacy.includes('data-zef-image-hash'), 'legacy URI must not render a Zef image token');
    console.log('✓ Markdown tokenizer boundaries and hard switch');

    check(zefTypeToMime('PngImage') === 'image/png', 'PngImage MIME type');
    check(mimeToZefType('image/jpeg') === 'JpgImage', 'JPEG Zef type');
    check(buildDataUri('image/png', 'aGVsbG8=') === 'data:image/png;base64,aGVsbG8=', 'data URI');
    check(buildPlaceholderDataUri('PngImage', SAMPLE_HASH, 'Not found').startsWith('data:image/svg+xml,'), 'placeholder');
    check(generateUid().startsWith('🍃-'), 'request UID');
    const retrieve = buildRetrieveMessage('PngImage', SAMPLE_HASH, '🍃-test') as any;
    check(retrieve.operation === 'execute', 'retrieve uses the native-runtime bridge');
    check(retrieve.command.__type === 'FX.RetrieveFromHashStore', 'retrieve uses the current Store FX');
    check(retrieve.command.hash.__type === 'MerkleHash' && retrieve.command.hash.hash === SAMPLE_HASH, 'retrieve carries a typed Merkle hash');
    const save = buildSaveMessage('PngImage', 'aGVsbG8=', '🍃-test') as any;
    check(save.operation === 'execute', 'save uses the native-runtime bridge');
    check(save.command.__type === 'FX.SaveToHashStore', 'save uses the current Store FX');
    check(save.command.value.__type === 'PngImage', 'save carries a typed JSON-like value');
    check(parseRetrieveResponse({ __type: 'PngImage', data: 'aGVsbG8=' }).status === 'found', 'retrieve returns the value directly');
    check(parseSaveResponse({ hash: { __type: 'MerkleHash', data_type: 'PngImage', hash: SAMPLE_HASH }, receipt: { status: 'merged', guarantee: 'physical_records' } }).status === 'saved', 'save returns hash and receipt');
    console.log('✓ ZefNet Hash Store request shapes');
}

async function testTokoloshRoundTrip() {
    const service = TokoloshService.getInstance();
    if (!await service.ensureConnected()) {
        throw new Error(`Local Tokolosh unavailable: ${service.snapshot.error}`);
    }

    check(service.snapshot.phase === 'registered', 'successful handshake must publish a registered connection snapshot');
    check(service.snapshot.endpoint?.endsWith('.sock'), 'registered snapshot must identify the local socket');

    const samplePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL9YQAAAABJRU5ErkJggg==', 'base64');
    const hash = await service.uploadZefValue('PngImage', samplePng);
    if (!hash) {
        throw new Error('hash-store upload should return a hash');
    }
    service.clearCache();
    const dataUri = await service.resolveImage('PngImage', hash);
    check(dataUri === `data:image/png;base64,${samplePng.toString('base64')}`, 'PNG bytes must round-trip exactly');
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><text>λ</text></svg>');
    const svgHash = await service.uploadZefValue('SvgImage', svg);
    check(svgHash, 'SVG upload returns a hash');
    service.clearCache();
    check(await service.resolveImage('SvgImage', svgHash) === `data:image/svg+xml;base64,${svg.toString('base64')}`, 'SVG UTF-8 must round-trip exactly');
    check(buildZefImageEmbed('PngImage', hash).includes(hash), 'uploaded hash should format as an embed');
    service.dispose();
    check(service.snapshot.phase === 'closed', 'disposed client must publish a closed connection snapshot');
    console.log('✓ live hash-store upload/retrieve round trip');
}

async function main() {
    testPureFunctions();
    if (process.env.ZEF_STORE_LIVE_TEST === '1') { await testTokoloshRoundTrip(); }
    else { console.log('Live test disabled; set ZEF_STORE_LIVE_TEST=1 to require a real Store round trip.'); }
    console.log('\nAll tests passed.');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
