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
    /** Whether to save rendered HTML output in the document. Default: false */
    persist_output?: boolean;
}

/**
 * Python-specific settings
 */
export interface PythonSettings {
    /** Custom venv path for this document */
    venv?: string;
    /** Whether to persist code output. Default: false */
    persist_output?: boolean;
    /** Whether to persist side effects (logging). Default: false */
    persist_side_effects?: boolean;
}

/**
 * Rust-specific settings
 */
export interface RustSettings {
    /** Whether to persist code output. Default: false */
    persist_output?: boolean;
    /** Whether to persist side effects (logging). Default: false */
    persist_side_effects?: boolean;
}

/**
 * HTML-specific settings (future)
 */
export interface HtmlSettings {
    /** Whether to save rendered HTML output. Default: false */
    persist_output?: boolean;
}

/**
 * Root settings object parsed from ---zef frontmatter
 */
export interface ZefSettings {
    svelte?: SvelteSettings;
    python?: PythonSettings;
    rust?: RustSettings;
    html?: HtmlSettings;
}

/**
 * Default settings when no frontmatter is present
 */
export const DEFAULT_SETTINGS: ZefSettings = {
    svelte: {
        persist_output: false
    },
    python: {
        persist_output: true,
        persist_side_effects: true
    },
    rust: {
        persist_output: true,
        persist_side_effects: true
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
        python: {
            ...DEFAULT_SETTINGS.python,
            ...parsed.python
        },
        rust: {
            ...DEFAULT_SETTINGS.rust,
            ...parsed.rust
        },
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
    return settings.svelte?.persist_output ?? false;
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

/**
 * Defaults for all settings. Used to determine what to include in frontmatter.
 */
const SETTING_DEFAULTS: Record<string, unknown> = {
    'svelte.persist_output': false,
    'python.persist_output': true,
    'python.persist_side_effects': true,
    'rust.persist_output': true,
    'rust.persist_side_effects': true
};

/**
 * Update a setting in the document's frontmatter.
 * Only writes non-default values to keep frontmatter clean.
 * 
 * @param text - The full document text
 * @param settingPath - Dot-separated path like 'svelte.persist_output'
 * @param value - The new value
 * @returns Updated document text
 */
export function updateDocumentSetting(text: string, settingPath: string, value: unknown): string {
    const defaultValue = SETTING_DEFAULTS[settingPath];
    const isDefault = value === defaultValue;
    
    // Parse existing settings
    const existingSettings = parseZefFrontmatter(text) || {};
    
    // Parse the setting path (e.g., 'svelte.persist_output' -> ['svelte', 'persist_output'])
    const [section, key] = settingPath.split('.');
    
    // Update the settings object
    if (isDefault) {
        // Remove the setting if it equals default
        if (existingSettings[section as keyof ZefSettings]) {
            delete (existingSettings[section as keyof ZefSettings] as Record<string, unknown>)[key];
            // Remove empty section
            if (Object.keys(existingSettings[section as keyof ZefSettings] as object).length === 0) {
                delete existingSettings[section as keyof ZefSettings];
            }
        }
    } else {
        // Set the value
        if (!existingSettings[section as keyof ZefSettings]) {
            (existingSettings as Record<string, Record<string, unknown>>)[section] = {};
        }
        (existingSettings[section as keyof ZefSettings] as Record<string, unknown>)[key] = value;
    }
    
    // Get content without frontmatter
    const contentWithoutFrontmatter = stripFrontmatter(text);
    
    // Check if we have any settings left
    const hasSettings = Object.keys(existingSettings).length > 0;
    
    if (!hasSettings) {
        // No settings, return content without frontmatter
        return contentWithoutFrontmatter;
    }
    
    // Serialize settings to TOML
    const tomlContent = TOML.stringify(existingSettings as TOML.JsonMap);
    
    // Build new frontmatter block
    const newFrontmatter = `---zef\n${tomlContent}---\n`;
    
    return newFrontmatter + contentWithoutFrontmatter;
}
