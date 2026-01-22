/**
 * Simple tests for frontmatter parser
 * Run with: npx ts-node src/frontmatterParser.test.ts
 */

import { 
    parseZefFrontmatter, 
    getDocumentSettings, 
    shouldPersistSvelteOutput,
    stripFrontmatter 
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
    assertEqual(settings.svelte?.persist_output, true);
});

test('getDocumentSettings: merges with defaults', () => {
    const text = `---zef
[svelte]
persist_output = false
---`;
    const settings = getDocumentSettings(text);
    assertEqual(settings.svelte?.persist_output, false);
});

test('shouldPersistSvelteOutput: returns true by default', () => {
    const text = '# Hello';
    assertEqual(shouldPersistSvelteOutput(text), true);
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

console.log('\n=== Tests Complete ===\n');
