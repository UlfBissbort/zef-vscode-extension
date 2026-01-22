/**
 * Zef Frontmatter Parser
 * 
 * Parses ---zef blocks at the top of .zef.md files.
 * Uses TOML syntax for configuration.
 */

import * as TOML from '@iarna/toml';

/**
 * Svelte-specific settings
 */
export interface SvelteSettings {
    /** Whether to save rendered HTML output in the document. Default: true */
    persist_output?: boolean;
}

/**
 * Python-specific settings (future)
 */
export interface PythonSettings {
    /** Custom venv path for this document */
    venv?: string;
}

/**
 * HTML-specific settings (future)
 */
export interface HtmlSettings {
    /** Whether to save rendered HTML output. Default: true */
    persist_output?: boolean;
}

/**
 * Root settings object parsed from ---zef frontmatter
 */
export interface ZefSettings {
    svelte?: SvelteSettings;
    python?: PythonSettings;
    html?: HtmlSettings;
}

/**
 * Default settings when no frontmatter is present
 */
export const DEFAULT_SETTINGS: ZefSettings = {
    svelte: {
        persist_output: true
    }
};

/**
 * Parse a ---zef frontmatter block from document text.
 * 
 * @param text - The full document text
 * @returns Parsed settings, or null if no valid frontmatter found
 * 
 * @example
 * ```
 * ---zef
 * [svelte]
 * persist_output = false
 * ---
 * 
 * # My Document
 * ```
 */
export function parseZefFrontmatter(text: string): ZefSettings | null {
    // Must start with ---zef
    if (!text.startsWith('---zef')) {
        return null;
    }
    
    // Find the closing ---
    // Match: ---zef followed by optional newline, optional content, then --- on its own line
    const match = text.match(/^---zef\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)|^---zef\r?\n---(?:\r?\n|$)/);
    
    if (!match) {
        return null;
    }
    
    // Handle empty frontmatter (second pattern matched)
    const tomlContent = match[1] || '';
    
    // Handle empty frontmatter
    if (!tomlContent.trim()) {
        return {};
    }
    
    try {
        const parsed = TOML.parse(tomlContent);
        return parsed as ZefSettings;
    } catch (error) {
        // Log warning but don't crash
        console.warn('Zef: Failed to parse frontmatter TOML:', error);
        return null;
    }
}

/**
 * Get settings for a document, merging frontmatter with defaults.
 * 
 * @param text - The full document text
 * @returns Merged settings (frontmatter overrides defaults)
 */
export function getDocumentSettings(text: string): ZefSettings {
    const parsed = parseZefFrontmatter(text);
    
    if (!parsed) {
        return DEFAULT_SETTINGS;
    }
    
    // Deep merge parsed settings with defaults
    return {
        svelte: {
            ...DEFAULT_SETTINGS.svelte,
            ...parsed.svelte
        },
        python: parsed.python,
        html: parsed.html
    };
}

/**
 * Check if Svelte output should be persisted for this document.
 * 
 * @param text - The full document text
 * @returns true if Svelte rendered HTML should be saved
 */
export function shouldPersistSvelteOutput(text: string): boolean {
    const settings = getDocumentSettings(text);
    return settings.svelte?.persist_output ?? true;
}

/**
 * Get the content after the frontmatter block (for rendering).
 * 
 * @param text - The full document text
 * @returns Text without the frontmatter block
 */
export function stripFrontmatter(text: string): string {
    if (!text.startsWith('---zef')) {
        return text;
    }
    
    const match = text.match(/^---zef\r?\n[\s\S]*?\r?\n---\r?\n?/);
    
    if (!match) {
        return text;
    }
    
    return text.slice(match[0].length);
}
