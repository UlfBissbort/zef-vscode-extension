/**
 * Simple tests for frontmatter parser
 * Run with: npx ts-node src/frontmatterParser.test.ts
 */

import { 
    parseZefFrontmatter, 
    getDocumentSettings, 
    shouldPersistSvelteOutput,
    stripFrontmatter,
    parseDocumentFrontmatter,
    renderDocumentFrontmatter
} from './frontmatterParser';

// Test helper
function test(name: string, fn: () => void) {
    try {
        fn();
        console.log(`✅ ${name}`);
    } catch (e) {
        console.log(`❌ ${name}`);
        console.error(e);
    }
}

function assertEqual<T>(actual: T, expected: T, msg?: string) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${msg || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

// Tests
console.log('\n=== Frontmatter Parser Tests ===\n');

test('parseZefFrontmatter: returns null for no frontmatter', () => {
    const text = '# Hello World\n\nSome content';
    assertEqual(parseZefFrontmatter(text), null);
});

test('parseZefFrontmatter: parses empty frontmatter', () => {
    const text = '---zef\n---\n\n# Hello';
    assertEqual(parseZefFrontmatter(text), {});
});

test('parseZefFrontmatter: parses svelte.persist_output = false', () => {
    const text = `---zef
[svelte]
persist_output = false
---

# Hello`;
    const result = parseZefFrontmatter(text);
    assertEqual(result?.svelte?.persist_output, false);
});

test('parseZefFrontmatter: parses svelte.persist_output = true', () => {
    const text = `---zef
[svelte]
persist_output = true
---

# Hello`;
    const result = parseZefFrontmatter(text);
    assertEqual(result?.svelte?.persist_output, true);
});

test('parseZefFrontmatter: returns null for invalid TOML', () => {
    const text = `---zef
this is not valid toml [[[
---

# Hello`;
    assertEqual(parseZefFrontmatter(text), null);
});

test('parseZefFrontmatter: ignores if not at start', () => {
    const text = `# Hello

---zef
[svelte]
persist_output = false
---`;
    assertEqual(parseZefFrontmatter(text), null);
});

test('getDocumentSettings: returns defaults when no frontmatter', () => {
    const text = '# Hello';
    const settings = getDocumentSettings(text);
    assertEqual(settings.svelte?.persist_output, false);
});

test('getDocumentSettings: merges with defaults', () => {
    const text = `---zef
[svelte]
persist_output = false
---`;
    const settings = getDocumentSettings(text);
    assertEqual(settings.svelte?.persist_output, false);
});

test('shouldPersistSvelteOutput: returns false by default', () => {
    const text = '# Hello';
    assertEqual(shouldPersistSvelteOutput(text), false);
});

test('shouldPersistSvelteOutput: returns false when set', () => {
    const text = `---zef
[svelte]
persist_output = false
---`;
    assertEqual(shouldPersistSvelteOutput(text), false);
});

test('stripFrontmatter: removes frontmatter block', () => {
    const text = `---zef
[svelte]
persist_output = false
---

# Hello`;
    const result = stripFrontmatter(text);
    assertEqual(result, '\n# Hello');
});

test('stripFrontmatter: returns text unchanged when no frontmatter', () => {
    const text = '# Hello\n\nWorld';
    assertEqual(stripFrontmatter(text), text);
});

test('parseDocumentFrontmatter: parses YAML fields', () => {
    const result = parseDocumentFrontmatter(`---
author: Ulf Bissbort
tags:
  - yaml
  - obsidian
---
# Hello`);
    assertEqual(result?.format, 'yaml');
    assertEqual(result?.fields.tags, ['yaml', 'obsidian']);
});

test('parseDocumentFrontmatter: parses TOML identity and multiary field', () => {
    const result = parseDocumentFrontmatter(`+++
this = "ET.MarkdownDocument('🍃-example')"
importance = 1
tag_ = ["bug", "markdown"]
+++
# Hello`);
    assertEqual(result?.format, 'toml');
    assertEqual(result?.fields.tag_, ['bug', 'markdown']);
});

test('stripFrontmatter: removes YAML and TOML blocks', () => {
    assertEqual(stripFrontmatter('---\na: 1\n---\n# YAML'), '# YAML');
    assertEqual(stripFrontmatter('+++\na = 1\n+++\n# TOML'), '# TOML');
});

test('renderDocumentFrontmatter: renders quality and importance values from 0 to 5 as ratings', () => {
    const frontmatter = parseDocumentFrontmatter(`+++
quality = 3
importance = 5
+++
`);
    const html = renderDocumentFrontmatter(frontmatter);
    if (!html.includes('aria-label="3 out of 5 stars"') || !html.includes('aria-label="5 out of 5 stars"')) {
        throw new Error('valid rating fields were not rendered as stars');
    }
});

test('renderDocumentFrontmatter: leaves invalid rating values as text', () => {
    const frontmatter = parseDocumentFrontmatter(`+++
quality = 6
importance = 2.5
+++
`);
    const html = renderDocumentFrontmatter(frontmatter);
    if (html.includes('frontmatter-rating') || !html.includes('>6</span>') || !html.includes('>2.5</span>')) {
        throw new Error('invalid rating fields were not rendered as plain values');
    }
});

test('renderDocumentFrontmatter: renders full identity before untitled properties', () => {
    const frontmatter = parseDocumentFrontmatter(`+++
this = "ET.MarkdownDocument('🍃-example')"
tag_ = ["bug"]
created = "Time('2026-07-21 01:18:16 +0800')"
+++
`);
    const html = renderDocumentFrontmatter(frontmatter);
    const identityIndex = html.indexOf('document-identity');
    const propertiesIndex = html.indexOf('frontmatter-properties');
    if (identityIndex < 0 || propertiesIndex < 0 || identityIndex >= propertiesIndex) {
        throw new Error('identity was not rendered before properties');
    }
    if (!html.includes('ET.MarkdownDocument(&#39;🍃-example&#39;)')) {
        throw new Error('full identity was not rendered');
    }
    if (!html.includes('document-identity-copy') || !html.includes('data-identity="ET.MarkdownDocument(&#39;🍃-example&#39;)"')) {
        throw new Error('identity copy control was not rendered');
    }
    if (html.includes('<h2>Properties</h2>')) {
        throw new Error('properties title should not be rendered');
    }
    if (!html.includes('>tag</span>') || html.includes('>tag_</span>')) {
        throw new Error('multiary field label was not normalized');
    }
    if (!html.includes('frontmatter-time') || !html.includes('21 Jul 2026 · 01:18:16') || !html.includes('UTC+08:00')) {
        throw new Error('typed Time value was not rendered');
    }
});

console.log('\n=== Tests Complete ===\n');
