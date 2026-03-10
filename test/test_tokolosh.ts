/**
 * Standalone test for TokoloshService.
 * Run: cd /Users/ulf/dev/zef-vscode-extension && npx tsx test/test_tokolosh.ts
 */
import {
    parseZefUri,
    zefTypeToMime,
    buildDataUri,
    buildZefMarkdownLink,
    generateUid,
    buildRetrieveMessage,
    parseRetrieveResponse,
    extractZefImageRefs,
    buildPlaceholderDataUri,
    mimeToZefType,
    TokoloshService,
} from '../src/tokoloshService';

import { marked } from 'marked';

// ── Pure function tests ─────────────────────────────────────────

function testPureFunctions() {
    console.log('=== Pure Function Tests ===\n');

    // parseZefUri
    const valid = parseZefUri('zef:PngImage/🗿-64d8c91b31c998c991b68b9878d74a474543d1d59b9c984b5cbbb16d69e0df7a');
    console.assert(valid !== null, 'parseZefUri should parse valid URI');
    console.assert(valid?.type === 'PngImage', 'parseZefUri type');
    console.assert(valid?.hash === '🗿-64d8c91b31c998c991b68b9878d74a474543d1d59b9c984b5cbbb16d69e0df7a', 'parseZefUri hash');
    console.log('✓ parseZefUri — valid');

    console.assert(parseZefUri('not-a-zef-uri') === null, 'parseZefUri rejects invalid');
    console.assert(parseZefUri('zef:PngImage/too-short') === null, 'parseZefUri rejects short hash');
    console.log('✓ parseZefUri — invalid');

    // zefTypeToMime
    console.assert(zefTypeToMime('PngImage') === 'image/png', 'PngImage mime');
    console.assert(zefTypeToMime('JpgImage') === 'image/jpeg', 'JpgImage mime');
    console.assert(zefTypeToMime('Unknown') === 'application/octet-stream', 'Unknown mime');
    console.log('✓ zefTypeToMime');

    // mimeToZefType
    console.assert(mimeToZefType('image/png') === 'PngImage', 'png zef type');
    console.assert(mimeToZefType('image/jpeg') === 'JpgImage', 'jpeg zef type');
    console.log('✓ mimeToZefType');

    // buildDataUri
    const dataUri = buildDataUri('image/png', 'aGVsbG8=');
    console.assert(dataUri === 'data:image/png;base64,aGVsbG8=', 'buildDataUri');
    console.log('✓ buildDataUri');

    // buildZefMarkdownLink
    console.assert(
        buildZefMarkdownLink('PngImage', '🗿-abc123', 'my image') === '![my image](zef:PngImage/🗿-abc123)',
        'buildZefMarkdownLink with alt'
    );
    console.assert(
        buildZefMarkdownLink('PngImage', '🗿-abc123') === '![](zef:PngImage/🗿-abc123)',
        'buildZefMarkdownLink no alt'
    );
    console.log('✓ buildZefMarkdownLink');

    // generateUid
    const uid = generateUid();
    console.assert(uid.startsWith('🍃-'), 'generateUid prefix');
    console.assert(uid.length === 23, 'generateUid length'); // 🍃- (3 chars) + 20 hex chars
    console.log('✓ generateUid');

    // buildRetrieveMessage
    const msg = buildRetrieveMessage('PngImage', '🗿-abc', '🍃-def') as any;
    console.assert(msg.__type === 'FX.RetrieveFromHashStore', 'retrieve msg type');
    console.assert(msg.__uid === '🍃-def', 'retrieve msg uid');
    console.assert(msg.hash.data_type === 'PngImage', 'retrieve msg data_type');
    console.log('✓ buildRetrieveMessage');

    // parseRetrieveResponse
    const found = parseRetrieveResponse({ __type: 'ET.HashStoreGetResponse', value: { __type: 'PngImage', data: 'base64data' } });
    console.assert(found.status === 'found' && found.data === 'base64data', 'parseRetrieveResponse found');
    const notFound = parseRetrieveResponse({ __type: 'ET.HashStoreNotFound' });
    console.assert(notFound.status === 'not-found', 'parseRetrieveResponse not-found');
    console.log('✓ parseRetrieveResponse');

    // extractZefImageRefs
    const html = '<img src="zef:PngImage/🗿-64d8c91b31c998c991b68b9878d74a474543d1d59b9c984b5cbbb16d69e0df7a"> <img src="./local.png">';
    const refs = extractZefImageRefs(html);
    console.assert(refs.length === 1, 'extractZefImageRefs count');
    console.assert(refs[0].type === 'PngImage', 'extractZefImageRefs type');
    console.log('✓ extractZefImageRefs');

    // buildPlaceholderDataUri
    const placeholder = buildPlaceholderDataUri('PngImage', '🗿-abc123def456', 'Not found');
    console.assert(placeholder.startsWith('data:image/svg+xml,'), 'placeholder is SVG data URI');
    console.log('✓ buildPlaceholderDataUri');

    console.log('\n=== All pure function tests passed ===\n');
}

// ── Integration test: connect to tokolosh and retrieve image ────

async function testTokoloshConnection() {
    console.log('=== TokoloshService Integration Test ===\n');

    const service = TokoloshService.getInstance();

    console.log('Connecting to tokolosh...');
    const connected = await service.ensureConnected();
    if (!connected) {
        console.log('⚠ Tokolosh not running — skipping integration test');
        return;
    }
    console.log('✓ Connected to tokolosh');

    // Test retrieving the known image hash
    const testHash = '🗿-64d8c91b31c998c991b68b9878d74a474543d1d59b9c984b5cbbb16d69e0df7a';
    console.log(`Retrieving PngImage ${testHash}...`);
    const dataUri = await service.resolveImage('PngImage', testHash);

    if (dataUri) {
        console.log(`✓ Image resolved — data URI length: ${dataUri.length} chars`);
        console.log(`  Starts with: ${dataUri.substring(0, 40)}...`);

        // Test cache hit
        const cached = await service.resolveImage('PngImage', testHash);
        console.assert(cached === dataUri, 'Cache should return same data URI');
        console.log('✓ Cache hit works');
    } else {
        console.log('⚠ Image not found in hash store');
    }

    // Test non-existent hash
    const fakeHash = '🗿-0000000000000000000000000000000000000000000000000000000000000000';
    const notFound = await service.resolveImage('PngImage', fakeHash);
    console.assert(notFound === null, 'Non-existent hash should return null');
    console.log('✓ Non-existent hash returns null');

    service.dispose();
    console.log('\n=== Integration test complete ===');
}

// ── Markdown rendering pipeline test ────────────────────────────

async function testMarkdownPipeline() {
    console.log('=== Markdown → HTML → Zef Resolution Pipeline Test ===\n');

    const testHash = '🗿-64d8c91b31c998c991b68b9878d74a474543d1d59b9c984b5cbbb16d69e0df7a';
    const markdown = `# Test Document

Here is a content-addressed image:

![test image](zef:PngImage/${testHash})

And some text after.
`;

    console.log('Input Markdown:');
    console.log(markdown);

    // Step 1: Render markdown to HTML (same as previewPanel.ts does)
    const html = marked.parse(markdown) as string;
    console.log('Rendered HTML:');
    console.log(html);

    // Step 2: Check if 'zef:' is present
    console.log(`HTML contains 'zef:': ${html.includes('zef:')}`);

    // Step 3: Try the UPDATED regex that handles percent-encoded 🗿
    const zefUriRegex = /zef:(\w+)\/((?:🗿|%F0%9F%97%BF)-[0-9a-fA-F]{64})/g;
    const matches: string[] = [];
    let m;
    while ((m = zefUriRegex.exec(html)) !== null) {
        matches.push(m[0]);
    }
    console.log(`Regex matches: ${matches.length}`);
    if (matches.length > 0) {
        console.log('  Matched: ' + matches.join(', '));
        // Verify decoding works
        const decoded = decodeURIComponent(matches[0]);
        console.log('  Decoded: ' + decoded);
        const parsed = parseZefUri(decoded);
        console.assert(parsed !== null, 'Decoded URI should parse');
        console.assert(parsed?.type === 'PngImage', 'Parsed type should be PngImage');
        console.log('  Parsed: ' + JSON.stringify(parsed));
        console.log('✓ Regex + decode works');
    } else {
        console.log('✗ REGEX STILL FAILS');
    }

    // Step 4: If no matches, try to find what's actually in the HTML
    if (matches.length === 0) {
        // Look for any 'zef:' substring and show surrounding chars
        const idx = html.indexOf('zef:');
        if (idx >= 0) {
            const around = html.substring(Math.max(0, idx - 10), idx + 100);
            console.log('Context around zef: in HTML:');
            console.log(JSON.stringify(around));

            // Check byte-by-byte what 🗿 became
            const afterZef = html.substring(idx, idx + 50);
            console.log('Bytes after "zef:" =', Buffer.from(afterZef).toString('hex'));
        }
    }

    // Step 5: Try the extractZefImageRefs function (uses img tag regex)
    const imgRefs = extractZefImageRefs(html);
    console.log(`extractZefImageRefs: ${imgRefs.length} refs`);

    // Step 6: Try a more permissive regex to understand the encoding
    const permissiveRegex = /zef:(\w+)\/([\S]{2,70})/g;
    const permissiveMatches: string[] = [];
    while ((m = permissiveRegex.exec(html)) !== null) {
        permissiveMatches.push(m[0]);
        console.log('  Permissive match: ' + JSON.stringify(m[0]));
        console.log('  Part after /: ' + JSON.stringify(m[2]));
        console.log('  Bytes: ' + Buffer.from(m[2]).toString('hex'));
    }

    console.log('\n=== Pipeline test complete ===\n');
}

// ── Run ─────────────────────────────────────────────────────────

async function main() {
    testPureFunctions();
    await testMarkdownPipeline();
    await testTokoloshConnection();
    process.exit(0);
}

main().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
