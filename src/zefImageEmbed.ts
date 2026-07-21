import type { TokenizerAndRendererExtension, Tokens } from 'marked';

export interface ZefEmbedReference {
    type: string;
    hash: string;
}

export type ZefImageReference = ZefEmbedReference;

const IMAGE_TYPES = new Set([
    'PngImage',
    'JpgImage',
    'GifImage',
    'WebpImage',
    'SvgImage',
]);

const SVELTE_COMPONENT_TYPE = 'ET.SvelteComponent';
const ZEF_EMBED = /^!\[\[([A-Za-z]\w*(?:\.[A-Za-z]\w*)*)\('(🗿-[0-9a-fA-F]{64})'\)\]\]/;

function isSupportedEmbedType(type: string): boolean {
    return IMAGE_TYPES.has(type) || type === SVELTE_COMPONENT_TYPE;
}

/** Parse one complete, supported Zef embed. */
export function parseZefEmbed(embed: string): ZefEmbedReference | null {
    const match = embed.match(ZEF_EMBED);
    if (!match || match[0] !== embed || !isSupportedEmbedType(match[1])) {
        return null;
    }
    return { type: match[1], hash: match[2] };
}

/** Parse one complete, canonical Zef image embed. */
export function parseZefImageEmbed(embed: string): ZefImageReference | null {
    const reference = parseZefEmbed(embed);
    return reference && IMAGE_TYPES.has(reference.type) ? reference : null;
}

/** Format a Zef image hash as the only supported Markdown image embed syntax. */
export function buildZefImageEmbed(type: string, hash: string): string {
    if (!IMAGE_TYPES.has(type) || !/^🗿-[0-9a-fA-F]{64}$/.test(hash)) {
        throw new Error(`Cannot build Zef image embed for ${type}/${hash}`);
    }
    return `![[${type}('${hash}')]]`;
}

type ZefEmbedToken = Tokens.Generic & {
    reference: ZefEmbedReference;
};

/**
 * A Marked inline extension for supported content-addressed Zef embeds.
 *
 * Parsing at the token level keeps embeds out of code spans/fences and prevents
 * them from being mistaken for ordinary [[wiki links]].
 */
export const zefImageEmbedExtension: TokenizerAndRendererExtension = {
    name: 'zefEmbed',
    level: 'inline',
    start(src) {
        return src.indexOf('![[');
    },
    tokenizer(src) {
        const match = src.match(ZEF_EMBED);
        if (!match) {
            return undefined;
        }
        const reference = parseZefEmbed(match[0]);
        if (!reference) {
            return undefined;
        }
        return {
            type: 'zefEmbed',
            raw: match[0],
            reference,
        } as ZefEmbedToken;
    },
    renderer(token) {
        const { reference } = token as ZefEmbedToken;
        if (reference.type === SVELTE_COMPONENT_TYPE) {
            return `<div class="zef-svelte-embed" data-zef-svelte-hash="${reference.hash}"></div>`;
        }
        return `<img data-zef-image-type="${reference.type}" data-zef-image-hash="${reference.hash}" alt="">`;
    },
};
