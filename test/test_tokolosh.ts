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
import { buildZefImageEmbed, parseZefImageEmbed, zefImageEmbedExtension } from '../src/zefImageEmbed';
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
    check(parseZefImageEmbed(`![](zef:PngImage/${SAMPLE_HASH})`) === null, 'legacy URI must not parse');
    check(parseZefImageEmbed(`![[UnknownImage('${SAMPLE_HASH}')]]`) === null, 'unknown type must not parse');
    check(parseZefImageEmbed("![[PngImage('too-short')]]") === null, 'short hash must not parse');
    check(
        buildZefImageEmbed('PngImage', SAMPLE_HASH) === `![[PngImage('${SAMPLE_HASH}')]]`,
        'formatter must emit canonical syntax'
    );
    console.log('✓ strict parser and canonical formatter');

    const markdown = new Marked({ extensions: [zefImageEmbedExtension] });
    const renderedEmbed = markdown.parse(`![[PngImage('${SAMPLE_HASH}')]]`) as string;
    check(renderedEmbed.includes(`data-zef-image-type="PngImage"`), 'embed should render an image token');
    check(renderedEmbed.includes(`data-zef-image-hash="${SAMPLE_HASH}"`), 'rendered token should retain hash');
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
    check((buildRetrieveMessage('PngImage', SAMPLE_HASH, '🍃-test') as any).hash.data_type === 'PngImage', 'retrieve message');
    check((buildSaveMessage('PngImage', 'aGVsbG8=', '🍃-test') as any).value.__type === 'PngImage', 'save message');
    check(parseRetrieveResponse({ __type: 'ET.HashStoreNotFound' }).status === 'not-found', 'not-found response');
    check(parseSaveResponse({ __type: 'ET.HashStoreResponse', hash: SAMPLE_HASH }).status === 'saved', 'save response');
    console.log('✓ hash-store protocol remains unchanged');
}

async function testTokoloshRoundTrip() {
    const service = TokoloshService.getInstance();
    if (!await service.ensureConnected()) {
        console.log('⚠ Tokolosh not running — skipping live round trip');
        return;
    }

    const samplePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL9YQAAAABJRU5ErkJggg==', 'base64');
    const hash = await service.uploadZefValue('PngImage', samplePng);
    if (!hash) {
        throw new Error('hash-store upload should return a hash');
    }
    service.clearCache();
    const dataUri = await service.resolveImage('PngImage', hash);
    check(dataUri?.startsWith('data:image/png;base64,'), 'uploaded image should resolve as a PNG data URI');
    check(buildZefImageEmbed('PngImage', hash).includes(hash), 'uploaded hash should format as an embed');
    service.dispose();
    console.log('✓ live hash-store upload/retrieve round trip');
}

async function main() {
    testPureFunctions();
    await testTokoloshRoundTrip();
    console.log('\nAll tests passed.');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
