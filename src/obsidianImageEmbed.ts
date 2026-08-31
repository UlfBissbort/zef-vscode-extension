/* +++
ET.TypeScriptFile('🍃-ef9db4155e8757f127c4',
  tag_=[],
  created=Time('2026-08-06 10:30:23 +0800')
)
+++ */

import * as path from 'path';
import type { TokenizerAndRendererExtension, Tokens } from 'marked';

export interface ObsidianImageReference {
    /** The literal embed, retained for a useful missing-file fallback. */
    raw: string;
    /** A vault-relative path, resolved relative to the source note. */
    source: string;
    /** Optional Obsidian width or width-by-height hint, e.g. `400` or `400x300`. */
    dimensions?: string;
}

const SUPPORTED_IMAGE_EXTENSION = /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i;
const OBSIDIAN_IMAGE_EMBED = /^!\[\[([^\]|]+)(?:\|(\d+(?:x\d+)?))?\]\]/;

type ObsidianImageToken = Tokens.Generic & {
    reference: ObsidianImageReference;
};

/**
 * Parse one Obsidian image embed. This intentionally accepts only relative image
 * paths: page embeds, URLs, hash-store values, and paths escaping the note's
 * directory keep their existing literal behaviour instead of acquiring access.
 */
export function parseObsidianImageEmbed(embed: string): ObsidianImageReference | null {
    const match = embed.match(OBSIDIAN_IMAGE_EMBED);
    if (!match || match[0] !== embed) {
        return null;
    }

    const source = match[1];
    const segments = source.split('/');
    const isRelative = !source.startsWith('/') && !source.startsWith('\\') && !/^[a-z][a-z0-9+.-]*:/i.test(source);
    if (!isRelative || segments.some(segment => segment === '..') || !SUPPORTED_IMAGE_EXTENSION.test(source)) {
        return null;
    }

    return {
        raw: match[0],
        source,
        dimensions: match[2] || undefined,
    };
}

/** Resolve a validated vault-relative image path against its containing note. */
export function resolveObsidianImagePath(noteDirectory: string, source: string): string | null {
    const reference = parseObsidianImageEmbed(`![[${source}]]`);
    return reference?.source === source ? path.resolve(noteDirectory, source) : null;
}

/** Decode a URI-encoded data attribute without letting malformed markup throw during preview rendering. */
export function decodeObsidianImageData(value: string | undefined): string | null {
    if (value === undefined) {
        return null;
    }
    try {
        return decodeURIComponent(value);
    } catch {
        return null;
    }
}

/** Render a safe, small fallback which retains the author's original Obsidian syntax. */
export function renderMissingObsidianImageEmbed(raw: string): string {
    const escapeHtml = (value: string) => value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return `<span class="obsidian-image-missing" title="Image file not found"><code>${escapeHtml(raw)}</code><span class="obsidian-image-missing-indicator" aria-label="Image file not found">image unavailable</span></span>`;
}

/**
 * A Marked inline extension for Obsidian's local image embeds.
 *
 * The URI-encoded attributes preserve paths with spaces and the original raw
 * source for a lossless missing-file fallback. The extension is deliberately
 * disjoint from Zef's typed hash embeds.
 */
export const obsidianImageEmbedExtension: TokenizerAndRendererExtension = {
    name: 'obsidianImageEmbed',
    level: 'inline',
    start(src) {
        return src.indexOf('![[');
    },
    tokenizer(src) {
        const match = src.match(OBSIDIAN_IMAGE_EMBED);
        if (!match) {
            return undefined;
        }
        const reference = parseObsidianImageEmbed(match[0]);
        if (!reference) {
            return undefined;
        }
        return {
            type: 'obsidianImageEmbed',
            raw: reference.raw,
            reference,
        } as ObsidianImageToken;
    },
    renderer(token) {
        const { reference } = token as ObsidianImageToken;
        const dimensions = reference.dimensions ? ` data-obsidian-dimensions="${reference.dimensions}"` : '';
        return `<img data-obsidian-image-embed data-obsidian-source="${encodeURIComponent(reference.source)}" data-obsidian-raw="${encodeURIComponent(reference.raw)}"${dimensions} src="${encodeURIComponent(reference.source)}" alt="">`;
    },
};
