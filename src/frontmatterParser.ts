/**
 * Zef Frontmatter Parser
 * 
 * Parses ---zef blocks at the top of .zef.md files.
 * Uses TOML syntax for configuration.
 */

import * as TOML from '@iarna/toml';
import { load as parseYaml } from 'js-yaml';

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

export interface DocumentFrontmatter {
    format: 'yaml' | 'toml';
    fields: Record<string, unknown>;
    error?: string;
}

interface ExtractedFrontmatter {
    delimiter: '---' | '+++';
    source: string;
    length: number;
}

/** Extract standard YAML or TOML frontmatter without interpreting its fields. */
function extractDocumentFrontmatter(text: string): ExtractedFrontmatter | null {
    // ---zef is the extension's private settings block, not document metadata.
    if (text.startsWith('---zef')) {
        return null;
    }

    const match = text.match(/^(---|\+\+\+)[ \t]*\r?\n([\s\S]*?)^\1[ \t]*(?:\r?\n|$)/m);
    if (!match) {
        return null;
    }

    return {
        delimiter: match[1] as '---' | '+++',
        source: match[2],
        length: match[0].length
    };
}

/** Parse standard YAML (`---`) or TOML (`+++`) document metadata. */
export function parseDocumentFrontmatter(text: string): DocumentFrontmatter | null {
    const extracted = extractDocumentFrontmatter(text);
    if (!extracted) {
        return null;
    }

    const format = extracted.delimiter === '---' ? 'yaml' : 'toml';

    try {
        const parsed = format === 'yaml'
            ? parseYaml(extracted.source)
            : TOML.parse(extracted.source);

        if (parsed === undefined || parsed === null || extracted.source.trim() === '') {
            return { format, fields: {} };
        }
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
            return { format, fields: {}, error: 'Frontmatter must contain named fields.' };
        }

        return { format, fields: parsed as Record<string, unknown> };
    } catch (error) {
        const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
        return { format, fields: {}, error: message };
    }
}

/** Render document metadata as a small, read-only Obsidian-style property block. */
export function renderDocumentFrontmatter(frontmatter: DocumentFrontmatter | null): string {
    if (!frontmatter) {
        return '';
    }

    const escapeHtml = (value: string): string => value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    if (frontmatter.error) {
        return `<section class="frontmatter-error">Could not parse ${frontmatter.format.toUpperCase()} frontmatter: ${escapeHtml(frontmatter.error)}</section>`;
    }

    const entries = Object.entries(frontmatter.fields);
    const identityValue = frontmatter.fields.this;
    const identityMatch = typeof identityValue === 'string'
        ? identityValue.match(/^ET\.([A-Za-z_]\w*)\((.*)\)$/s)
        : null;

    const formatSpecialValue = (value: unknown): string | null => {
        if (typeof value !== 'string') {
            return null;
        }

        // Typed value renderers live here so support for more Zef value forms can
        // be added without changing generic property rendering.
        const timeMatch = value.match(/^Time\(['"](\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) ([+-])(\d{2})(\d{2})['"]\)$/);
        if (timeMatch) {
            const [, year, month, day, hour, minute, second, sign, zoneHour, zoneMinute] = timeMatch;
            const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(month) - 1];
            const label = `${Number(day)} ${monthName} ${year} · ${hour}:${minute}:${second}`;
            const zone = `UTC${sign}${zoneHour}:${zoneMinute}`;
            const datetime = `${year}-${month}-${day}T${hour}:${minute}:${second}${sign}${zoneHour}:${zoneMinute}`;
            return `<span class="frontmatter-time-group"><time class="frontmatter-time" datetime="${escapeHtml(datetime)}"><span class="frontmatter-time-icon">◷</span><span>${escapeHtml(label)}</span><span class="frontmatter-time-zone">${escapeHtml(zone)}</span></time><span class="frontmatter-relative-time" data-timestamp="${escapeHtml(datetime)}"></span></span>`;
        }

        return null;
    };

    const formatScalar = (value: unknown): string => {
        const specialValue = formatSpecialValue(value);
        if (specialValue) {
            return specialValue;
        }

        if (value instanceof Date) {
            return escapeHtml(value.toISOString());
        }
        if (value === null || value === undefined || value === '') {
            return '<span class="frontmatter-empty">—</span>';
        }
        if (typeof value === 'object') {
            return escapeHtml(JSON.stringify(value));
        }
        return escapeHtml(String(value));
    };

    const formatValue = (name: string, value: unknown): string => {
        if (
            (name === 'quality' || name === 'importance') &&
            typeof value === 'number' &&
            Number.isInteger(value) &&
            value >= 0 &&
            value <= 5
        ) {
            const stars = Array.from({ length: 5 }, (_, index) =>
                `<span class="frontmatter-star ${index < value ? 'filled' : 'empty'}">${index < value ? '★' : '☆'}</span>`
            ).join('');
            return `<span class="frontmatter-rating" role="img" aria-label="${value} out of 5 stars">${stars}</span>`;
        }

        // A trailing underscore denotes a multiary field. Parsed frontmatter gives
        // us its array directly; arrays on other fields are rendered the same way.
        if (name.endsWith('_') || Array.isArray(value)) {
            const values = Array.isArray(value) ? value : [];
            if (values.length === 0) {
                return '<span class="frontmatter-empty">—</span>';
            }
            return `<span class="frontmatter-chips">${values.map(item => `<span class="frontmatter-chip">${formatScalar(item)}</span>`).join('')}</span>`;
        }
        return formatScalar(value);
    };

    const identityHtml = identityMatch
        ? `<div class="document-identity"><span class="document-identity-type"><span class="document-identity-text">${escapeHtml(identityValue as string)}</span><button type="button" class="document-identity-copy" data-identity="${escapeHtml(identityValue as string)}" onclick="copyEntityDescriptor(this)" title="Copy entity descriptor" aria-label="Copy entity descriptor"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="6" width="12" height="15" rx="1.5"></rect><path d="M4 18V5a2 2 0 0 1 2-2h9"></path></svg></button></span></div>`
        : '';
    const propertyEntries = identityMatch ? entries.filter(([name]) => name !== 'this') : entries;
    const propertiesHtml = propertyEntries.length > 0
        ? `<section class="frontmatter-properties">${propertyEntries.map(([name, value]) => {
            const label = name.endsWith('_') ? name.slice(0, -1) : name;
            return `<div class="frontmatter-property"><span class="frontmatter-property-icon">${name.endsWith('_') || Array.isArray(value) ? '◇' : '≡'}</span><span class="frontmatter-property-name">${escapeHtml(label)}</span><span class="frontmatter-property-value">${formatValue(name, value)}</span></div>`;
        }).join('')}</section>`
        : '';

    return identityHtml + propertiesHtml;
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
 * Check if code output (Result block) should be persisted for this document.
 * 
 * @param text - The full document text
 * @param language - The code block language ('python', 'rust', etc.)
 * @returns true if the Result block should be saved
 */
export function shouldPersistOutput(text: string, language: string): boolean {
    const settings = getDocumentSettings(text);
    
    if (language === 'python') {
        return settings.python?.persist_output ?? true;
    } else if (language === 'rust') {
        return settings.rust?.persist_output ?? true;
    }
    
    // Default to true for other languages (js, ts, etc.)
    return true;
}

/**
 * Check if side effects (Side Effects block) should be persisted for this document.
 * 
 * @param text - The full document text
 * @param language - The code block language ('python', 'rust', etc.)
 * @returns true if the Side Effects block should be saved
 */
export function shouldPersistSideEffects(text: string, language: string): boolean {
    const settings = getDocumentSettings(text);
    
    if (language === 'python') {
        return settings.python?.persist_side_effects ?? true;
    } else if (language === 'rust') {
        return settings.rust?.persist_side_effects ?? true;
    }
    
    // Default to true for other languages
    return true;
}

/**
 * Get the content after the frontmatter block (for rendering).
 * 
 * @param text - The full document text
 * @returns Text without the frontmatter block
 */
export function stripFrontmatter(text: string): string {
    if (text.startsWith('---zef')) {
        const match = text.match(/^---zef\r?\n[\s\S]*?\r?\n---\r?\n?/);
        return match ? text.slice(match[0].length) : text;
    }

    const extracted = extractDocumentFrontmatter(text);
    return extracted ? text.slice(extracted.length) : text;
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
    // Do not overwrite a document's standard metadata block. Keeping settings and
    // metadata in one block can be added later without making this renderer editable.
    if (parseDocumentFrontmatter(text)) {
        return text;
    }

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
