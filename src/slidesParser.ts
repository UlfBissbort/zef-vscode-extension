export interface SlideFence {
    source: string;
    startLine: number;
    endLine: number;
}

export type SlideFenceSelection =
    | { ok: true; fence: SlideFence }
    | { ok: false; message: string; line?: number };

const deckRoot = /^\s*ET\.ZefSlides\s*\(/;

export function findSlideFences(markdown: string): SlideFence[] {
    const lines = markdown.split(/\r?\n/);
    const fences: SlideFence[] = [];

    for (let index = 0; index < lines.length; index += 1) {
        if (!/^```zef(?:\s+[^\s]+)*\s*$/i.test(lines[index])) continue;

        const startLine = index;
        const body: string[] = [];
        index += 1;
        while (index < lines.length && !/^```\s*$/.test(lines[index])) {
            body.push(lines[index]);
            index += 1;
        }

        if (index === lines.length) continue;
        const source = body.join('\n');
        if (deckRoot.test(source)) fences.push({ source, startLine, endLine: index });
    }

    return fences;
}

export function selectSlideFence(markdown: string): SlideFenceSelection {
    const fences = findSlideFences(markdown);
    if (fences.length === 0) {
        return {
            ok: false,
            message: 'Zef Slides could not find a zef block beginning with ET.ZefSlides(...).'
        };
    }
    if (fences.length > 1) {
        return {
            ok: false,
            line: fences[1].startLine,
            message: 'Zef Slides supports one ET.ZefSlides(...) zef block per document.'
        };
    }
    return { ok: true, fence: fences[0] };
}
