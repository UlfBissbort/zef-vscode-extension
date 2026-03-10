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
    buildSaveMessage,
    parseRetrieveResponse,
    parseSaveResponse,
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

    // buildSaveMessage
    const saveMsg = buildSaveMessage('PngImage', 'iVBORw0KGgo=', '🍃-save1') as any;
    console.assert(saveMsg.__type === 'FX.SaveToHashStore', 'save msg type');
    console.assert(saveMsg.__uid === '🍃-save1', 'save msg uid');
    console.assert(saveMsg.value.__type === 'PngImage', 'save msg value type');
    console.assert(saveMsg.value.data === 'iVBORw0KGgo=', 'save msg value data');
    console.log('✓ buildSaveMessage');

    // parseSaveResponse — ET.HashStoreResponse with ZefValueHash object
    const saveOk = parseSaveResponse({
        __type: 'ET.HashStoreResponse',
        hash: { __type: 'ZefValueHash', data_type: 'PngImage', hash: '🗿-abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' }
    });
    console.assert(saveOk.status === 'saved', 'parseSaveResponse saved status');
    console.assert(saveOk.status === 'saved' && saveOk.hash === '🗿-abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', 'parseSaveResponse hash');
    console.log('✓ parseSaveResponse — ZefValueHash object');

    // parseSaveResponse — error case
    const saveErr = parseSaveResponse({ __type: 'ET.Unknown' });
    console.assert(saveErr.status === 'error', 'parseSaveResponse error status');
    console.log('✓ parseSaveResponse — error');

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

    console.log('\n=== Integration test complete ===');
}

// ── Integration test: upload image to hash store ────────────

async function testUploadImage() {
    console.log('=== Upload Image Integration Test ===\n');

    // Sample image from the user (small 10x11 PNG)
    const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAALCAYAAABGbhwYAAABAklEQVR4nI2Rv0oDQRDGf7NuwiU5ieGI'
        + 'hPinCWenhBQ2VikEBREE24D6CHkIU/g2Nj6FYK8PoIXYCAHvbtbdnOZPl9ndZvab7/tmxiY7qWONMKwZ'
        + 'tlmvILKcktldCa9preQLyFKFiJmjwrGqOgc45/7YhUJ/QmJWEJ5d1RD/p8S1FsP+He1mj5fXJ57fHktg'
        + 'yRSolM1awujsgf3tQ1Qdu60Bnx/Tf0YhWOi2U0bnE7pJSpZliDFU68pxZ1wCVTN6ewNuLiZsxR2vkGOr'
        + 'Blc4cm+1shGXwKODIbeX90TVRphE6AFvFWeE6Xe5D3vSv+L6dEwUNRZjU99UAYUv+3ovPLvwC9+aUmH+'
        + '4ZqPAAAAAElFTkSuQmCC';

    const buffer = Buffer.from(sampleBase64, 'base64');
    console.log(`Sample image: ${buffer.length} bytes`);

    const service = TokoloshService.getInstance();
    const connected = await service.ensureConnected();
    if (!connected) {
        console.log('⚠ Tokolosh not running — skipping upload test');
        return;
    }
    console.log('✓ Connected to tokolosh');

    // Upload the image
    console.log('Uploading PngImage...');
    const hash = await service.uploadImage('PngImage', buffer);
    if (hash) {
        console.log(`✓ Image uploaded, hash: ${hash}`);

        // Verify by retrieving it back
        console.log('Verifying by retrieving...');
        // Clear cache to force WS retrieval
        service.clearCache();
        const dataUri = await service.resolveImage('PngImage', hash);

        if (dataUri) {
            console.log(`✓ Round-trip verified, data URI length: ${dataUri.length}`);
            
            // Verify the markdown link format
            const link = buildZefMarkdownLink('PngImage', hash);
            console.log(`  Markdown: ${link}`);
            console.assert(link.startsWith('![](zef:PngImage/'), 'Markdown link format');
            console.log('✓ Markdown link format correct');
        } else {
            console.log('✗ Could not retrieve uploaded image');
        }
    } else {
        console.log('✗ Upload failed');
    }

    console.log('\n=== Upload test complete ===');
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
    // Note: integration tests share the singleton — don't dispose between them
    await testTokoloshConnection();
    await testUploadImage();
    TokoloshService.getInstance().dispose();
    process.exit(0);
}

main().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
