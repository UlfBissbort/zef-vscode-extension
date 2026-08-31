/* +++
ET.TypeScriptFile('🍃-2731a34d6d12ba3bd812',
  tag_=[],
  created=Time('2026-07-23 08:51:38 +0800')
)
+++ */

/**
 * Preserve math delimiters while markdown is parsed.
 *
 * Marked is intentionally allowed to parse everything except confirmed math
 * expressions. In particular, code fences, indented code, and inline code are
 * copied verbatim so delimiter-looking text in code can never be paired with a
 * later math delimiter.
 */
export interface ProtectedMath {
    markdown: string;
    expressions: string[];
    placeholderPattern: RegExp;
}

function isEscaped(text: string, index: number): boolean {
    let backslashes = 0;
    for (let i = index - 1; i >= 0 && text[i] === '\\'; i--) {
        backslashes++;
    }
    return backslashes % 2 === 1;
}

function lineEnd(text: string, index: number): number {
    const newline = text.indexOf('\n', index);
    return newline === -1 ? text.length : newline + 1;
}

function fenceAt(text: string, index: number): { marker: string; end: number } | undefined {
    const lineStart = index === 0 || text[index - 1] === '\n';
    if (!lineStart) { return undefined; }

    const match = text.slice(index).match(/^(?: {0,3})(`{3,}|~{3,})[^\n]*(?:\n|$)/);
    if (!match) { return undefined; }

    const marker = match[1];
    const closing = new RegExp(`^(?: {0,3})${marker[0]}{${marker.length},}[^\\n]*(?:\\n|$)`, 'm');
    const bodyStart = index + match[0].length;
    const closeMatch = closing.exec(text.slice(bodyStart));
    return { marker, end: closeMatch ? bodyStart + closeMatch.index! + closeMatch[0].length : text.length };
}

function indentedCodeEnd(text: string, index: number): number | undefined {
    const lineStart = index === 0 || text[index - 1] === '\n';
    if (!lineStart || !/^(?: {4}|\t)/.test(text.slice(index))) { return undefined; }

    let end = lineEnd(text, index);
    while (end < text.length) {
        const line = text.slice(end, lineEnd(text, end));
        if (line.trim() !== '' && !/^(?: {4}|\t)/.test(line)) { break; }
        end = lineEnd(text, end);
    }
    return end;
}

function inlineCodeEnd(text: string, index: number): number | undefined {
    if (text[index] !== '`') { return undefined; }
    let ticks = 1;
    while (text[index + ticks] === '`') { ticks++; }
    const delimiter = '`'.repeat(ticks);
    const close = text.indexOf(delimiter, index + ticks);
    return close === -1 ? text.length : close + ticks;
}

/** Find a matching unescaped delimiter without entering a Markdown code span. */
function closingDelimiter(text: string, start: number, delimiter: '$' | '$$'): number | undefined {
    for (let i = start; i < text.length; i++) {
        const fence = fenceAt(text, i);
        const indentedEnd = indentedCodeEnd(text, i);
        if (fence || indentedEnd !== undefined) { return undefined; }

        const codeEnd = inlineCodeEnd(text, i);
        if (codeEnd !== undefined) {
            i = codeEnd - 1;
            continue;
        }
        if (text[i] !== '$' || isEscaped(text, i)) { continue; }

        const runLength = text[i + 1] === '$' ? (text[i + 2] === '$' ? 3 : 2) : 1;
        if (delimiter === '$$' && runLength === 2) { return i; }
        if (delimiter === '$' && runLength === 1) { return i; }
    }
    return undefined;
}

/**
 * Replace only complete, non-code math expressions with collision-free
 * placeholders. The caller parses `markdown`, then calls restoreProtectedMath
 * on the HTML it produced.
 */
export function protectMath(markdown: string): ProtectedMath {
    const expressions: string[] = [];
    let prefix = '\uE000zef-math-';
    let prefixNumber = 0;
    while (markdown.includes(prefix)) {
        prefix = `\uE000zef-math-${++prefixNumber}-`;
    }
    const suffix = '\uE001';
    const placeholder = (id: number) => `${prefix}${id}${suffix}`;

    let output = '';
    for (let i = 0; i < markdown.length;) {
        const fence = fenceAt(markdown, i);
        const indentedEnd = indentedCodeEnd(markdown, i);
        const codeEnd = inlineCodeEnd(markdown, i);
        const protectedEnd = fence?.end ?? indentedEnd ?? codeEnd;
        if (protectedEnd !== undefined) {
            output += markdown.slice(i, protectedEnd);
            i = protectedEnd;
            continue;
        }

        if (markdown[i] !== '$' || isEscaped(markdown, i)) {
            output += markdown[i++];
            continue;
        }

        const runLength = markdown[i + 1] === '$' ? (markdown[i + 2] === '$' ? 3 : 2) : 1;
        const delimiter = runLength === 2 ? '$$' : runLength === 1 ? '$' : undefined;
        if (!delimiter) {
            output += markdown[i++];
            continue;
        }

        const closing = closingDelimiter(markdown, i + delimiter.length, delimiter);
        if (closing === undefined || (delimiter === '$' && markdown.slice(i + 1, closing).includes('\n\n'))) {
            // Keep an unmatched $$ together. Otherwise its second dollar can
            // incorrectly become the opening delimiter for later inline math.
            output += delimiter;
            i += delimiter.length;
            continue;
        }

        const expression = markdown.slice(i, closing + delimiter.length);
        expressions.push(expression);
        output += placeholder(expressions.length - 1);
        i = closing + delimiter.length;
    }

    return {
        markdown: output,
        expressions,
        placeholderPattern: new RegExp(`${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)${suffix}`, 'g')
    };
}

export function restoreProtectedMath(html: string, protectedMath: ProtectedMath): string {
    return html.replace(protectedMath.placeholderPattern, (_match, id: string) => protectedMath.expressions[Number(id)]);
}
