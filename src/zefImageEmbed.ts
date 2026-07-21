import type { TokenizerAndRendererExtension, Tokens } from 'marked';

export interface ZefImageReference {
    type: string;
    hash: string;
}

const IMAGE_TYPES = new Set([
    'PngImage',
    'JpgImage',
    'GifImage',
    'WebpImage',
    'SvgImage',
]);

const ZEF_IMAGE_EMBED = /^!\[\[([A-Za-z]\w*)\('(🗿-[0-9a-fA-F]{64})'\)\]\]/;

/** Parse one complete, canonical Zef image embed. */
export function parseZefImageEmbed(embed: string): ZefImageReference | null {
    const match = embed.match(ZEF_IMAGE_EMBED);
    if (!match || match[0] !== embed || !IMAGE_TYPES.has(match[1])) {
        return null;
    }
    return { type: match[1], hash: match[2] };
}

/** Format a Zef image hash as the only supported Markdown embed syntax. */
export function buildZefImageEmbed(type: string, hash: string): string {
    if (!IMAGE_TYPES.has(type) || !/^🗿-[0-9a-fA-F]{64}$/.test(hash)) {
        throw new Error(`Cannot build Zef image embed for ${type}/${hash}`);
    }
    return `![[${type}('${hash}')]]`;
}

type ZefImageEmbedToken = Tokens.Generic & {
    image: ZefImageReference;
};

/**
 * A Marked inline extension for Zef image embeds.
 *
 * Parsing at the token level keeps embeds out of code spans/fences and prevents
 * them from being mistaken for ordinary [[wiki links]].
 */
export const zefImageEmbedExtension: TokenizerAndRendererExtension = {
    name: 'zefImageEmbed',
    level: 'inline',
    start(src) {
        return src.indexOf('![[');
    },
    tokenizer(src) {
        const match = src.match(ZEF_IMAGE_EMBED);
        if (!match) {
            return undefined;
        }
        const image = parseZefImageEmbed(match[0]);
        if (!image) {
            return undefined;
        }
        return {
            type: 'zefImageEmbed',
            raw: match[0],
            image,
        } as ZefImageEmbedToken;
    },
    renderer(token) {
        const { image } = token as ZefImageEmbedToken;
        return `<img data-zef-image-type="${image.type}" data-zef-image-hash="${image.hash}" alt="">`;
    },
};
