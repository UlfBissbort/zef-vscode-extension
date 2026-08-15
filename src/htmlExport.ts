/**
 * htmlExport.ts — Pure functions for exporting the Zef preview to a self-contained HTML file.
 *
 * Architecture:
 *   detectFeatures(markdown)     → { usesLatex, usesMermaid }
 *   inlineKatexFonts(css, fonts) → css string with base64 data URIs
 *   getExportCss(maxWidth)       → theme CSS string
 *   generateStandaloneHtml(input)→ complete HTML string
 *
 * All functions are pure: data in, data out. No vscode imports, no file I/O.
 */

import { protectMath } from './mathProtection';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HtmlExportInput {
    /** HTML body produced by renderMarkdown() */
    renderedHtml: string;
    /** Document title (for <title> tag) */
    title: string;
    /** Max content width in pixels */
    maxWidth: number;
    /** Feature flags from detectFeatures() */
    usesLatex: boolean;
    usesMermaid: boolean;
    /** File contents (only needed when the corresponding feature flag is true) */
    katexCss?: string;
    katexJs?: string;
    katexAutoRenderJs?: string;
    mermaidJs?: string;
}

// ---------------------------------------------------------------------------
// Detection (pure)
// ---------------------------------------------------------------------------

/**
 * Scan markdown source for mermaid diagrams and LaTeX math.
 * Operates on the raw markdown *before* it's rendered to HTML.
 */
export function detectFeatures(markdown: string): { usesLatex: boolean; usesMermaid: boolean } {
    // Mermaid: ```mermaid code fence
    const usesMermaid = /^```mermaid\b/m.test(markdown);

    // Use the same Markdown-aware parser as preview rendering. In particular,
    // delimiter-looking text in inline or fenced code must not enable KaTeX.
    const usesLatex = protectMath(markdown).expressions.length > 0;

    return { usesLatex, usesMermaid };
}

// ---------------------------------------------------------------------------
// Font inlining (pure)
// ---------------------------------------------------------------------------

/**
 * Replace url(...) font references in KaTeX CSS with inline base64 data URIs.
 * `fonts` maps filename (e.g. "KaTeX_Main-Regular.woff2") to file contents as Buffer.
 */
export function inlineKatexFonts(katexCss: string, fonts: Map<string, Buffer>): string {
    return katexCss.replace(
        /url\(([^)]*?([^/)]+\.woff2))\)/g,
        (_match, _fullPath, filename) => {
            const data = fonts.get(filename);
            if (data) {
                const b64 = data.toString('base64');
                return `url(data:font/woff2;base64,${b64})`;
            }
            // Fallback: CDN
            return `url(https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/fonts/${filename})`;
        }
    );
}

// ---------------------------------------------------------------------------
// Rendered block parsing (pure)
// ---------------------------------------------------------------------------

/**
 * Parse ````rendered-html blocks from source text (.zef.md).
 * Returns a map of sequential executable-block ID → compiled HTML string.
 *
 * Block IDs match the webview's codeBlockId counter: one ID per executable
 * code fence (python, py, rust, rs, javascript, js, typescript, ts, svelte).
 */
export function parseRenderedBlocks(sourceText: string): Record<number, string> {
    const result: Record<number, string> = {};
    const regex = /```(?:python|py|rust|rs|javascript|js|typescript|ts|svelte)\s*\n[\s\S]*?```(?:\s*\n````(?:Result|Output)\s*\n[\s\S]*?````)?(?:\s*\n````Side Effects\s*\n[\s\S]*?````)?(?:\s*\n````rendered-html\s*\n([\s\S]*?)````)?/gi;
    let blockId = 0;
    let match;
    while ((match = regex.exec(sourceText)) !== null) {
        blockId++;
        if (match[1]) {
            result[blockId] = match[1].trim();
        }
    }
    return result;
}

// ---------------------------------------------------------------------------
// Rendered block embedding (pure)
// ---------------------------------------------------------------------------

export interface SvelteBlockExport {
    mode: 'source' | 'rendered' | 'both';
    renderedHtml?: string;
}

/**
 * Post-process rendered HTML: embed svelte rendered output and html inline iframes.
 *
 * - Svelte blocks: controlled by svelteExports map (source/rendered/both per block).
 * - HTML blocks: always replaced with iframe containing their source code directly.
 *
 * Block ID counting matches the webview's sequential numbering of executable blocks.
 * HTML blocks are NOT executable and don't affect the block ID counter.
 */
export function embedRenderedBlocks(
    html: string,
    svelteExports: Record<number, SvelteBlockExport>
): string {
    const executableLangs = new Set([
        'python', 'py', 'rust', 'rs', 'javascript', 'js', 'typescript', 'ts', 'svelte'
    ]);
    let blockId = 0;

    return html.replace(
        /<pre(?:\s[^>]*)?><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
        (match, lang, encodedContent) => {
            const langLower = lang.toLowerCase();

            if (executableLangs.has(langLower)) {
                blockId++;
            }

            // Svelte: use per-component selection
            if (langLower === 'svelte') {
                const sel = svelteExports[blockId];
                if (!sel || sel.mode === 'source') {
                    return match; // keep source code block
                }
                const srcdoc = (sel.renderedHtml || '')
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;');
                const iframeHtml = `<iframe class="rendered-frame" sandbox="allow-scripts" srcdoc="${srcdoc}"></iframe><div class="preview-resize-handle"></div>`;
                if (sel.mode === 'rendered') {
                    return `<div class="rendered-component width-resizable"><div class="preview-resize-handle-left"></div>${iframeHtml}<div class="preview-resize-handle-right"></div></div>`;
                }
                if (sel.mode === 'both') {
                    const tabId = 'svelte-export-' + blockId;
                    return `<div class="rendered-component width-resizable"><div class="preview-resize-handle-left"></div>`
                        + `<div class="export-tabs">`
                        + `<button class="export-tab active" data-tab-target="${tabId}-rendered">Rendered</button>`
                        + `<button class="export-tab" data-tab-target="${tabId}-source">Source Code</button>`
                        + `</div>`
                        + `<div id="${tabId}-rendered" class="export-tab-content active">${iframeHtml}</div>`
                        + `<div id="${tabId}-source" class="export-tab-content">${match}</div>`
                        + `<div class="preview-resize-handle-right"></div></div>`;
                }
            }

            // HTML: embed source directly as iframe
            if (langLower === 'html') {
                // Decode HTML entities to recover raw HTML source
                const decoded = encodedContent
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");
                // Re-encode for srcdoc attribute
                const srcdoc = decoded
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;');
                return `<div class="rendered-component width-resizable"><div class="preview-resize-handle-left"></div><iframe class="rendered-frame" sandbox="allow-scripts" srcdoc="${srcdoc}"></iframe><div class="preview-resize-handle"></div><div class="preview-resize-handle-right"></div></div>`;
            }

            return match;
        }
    );
}

// ---------------------------------------------------------------------------
// Theme CSS (pure)
// ---------------------------------------------------------------------------

/**
 * Returns the theme CSS for the exported HTML file.
 * This is a clean subset of the preview panel CSS — no interactive UI elements.
 */
export function getExportCss(maxWidth: number): string {
    return `
        :root {
            --bg-color: #0a0a0a;
            --text-color: #fafafa;
            --text-muted: #bbb;
            --text-dim: #999;
            --code-bg: #141414;
            --border-color: #222;
            --heading-color: #fafafa;
            --link-color: #888;
            --accent: #444;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            overflow-x: hidden;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.8;
            font-size: 0.9rem;
            color: var(--text-color);
            background-color: var(--bg-color);
            padding: 3rem 2rem;
            max-width: ${maxWidth}px;
            margin: 0 auto;
            letter-spacing: 0.02em;
        }

        h1, h2, h3, h4, h5, h6 {
            color: var(--heading-color);
            font-weight: 300;
            letter-spacing: 0.05em;
            margin-top: 2.5rem;
            margin-bottom: 1rem;
        }

        h1 {
            font-size: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
        }

        h2 { font-size: 1.5rem; color: var(--text-muted); }
        h3 { font-size: 1.2rem; color: var(--text-muted); }

        p {
            margin: 1.2em 0;
            color: var(--text-dim);
        }

        .blank-line { height: 1.5em; }

        a {
            color: var(--link-color);
            text-decoration: none;
            border-bottom: 1px solid var(--border-color);
            transition: color 0.2s, border-color 0.2s;
        }
        a:hover {
            color: var(--text-color);
            border-color: var(--text-muted);
        }

        code {
            font-family: 'SF Mono', 'Fira Code', Consolas, 'Courier New', monospace;
            background-color: var(--code-bg);
            padding: 0.2em 0.5em;
            border-radius: 6px;
            font-size: 0.84em;
            color: #e0e0e0;
            border: 1px solid #2a2a2a;
        }

        pre code {
            border: none;
            padding: 0;
            border-radius: 0;
            background: none;
        }

        pre {
            background-color: var(--code-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 1.5rem;
            overflow-x: auto;
            margin: 1.5rem 0;
        }

        pre code {
            background-color: transparent;
            padding: 0;
            font-size: 0.8rem;
            line-height: 1.6;
            color: #aaa;
        }

        /* Syntax highlighting */
        .hl-kw { color: #c9a0dc !important; }
        .hl-str { color: #98c379 !important; }
        .hl-cmt { color: #555 !important; font-style: italic; }
        .hl-fn { color: #61afef !important; }
        .hl-num { color: #d19a66 !important; }
        .hl-ty { color: #56b6c2 !important; }

        /* Mermaid diagrams */
        .mermaid {
            background: transparent;
            text-align: center;
            padding: 1.5rem 0;
            margin: 1.5rem 0;
        }
        .mermaid svg { max-width: 100%; height: auto; }

        /* KaTeX math */
        .katex-display {
            margin: 1.5em 0;
            overflow-x: auto;
            overflow-y: hidden;
            text-align: center;
            padding: 0 5px;
        }
        .katex { font-size: 1.1em; color: var(--text-color); }
        .katex-display .katex { font-size: 1.21em; }
        .katex-display > .katex { overflow-x: unset; padding: 0.5em 0; }
        .katex-display::-webkit-scrollbar { height: 4px; background: transparent; }
        .katex-display::-webkit-scrollbar-thumb { background-color: var(--border-color); border-radius: 2px; }

        /* Rendered components (Svelte / HTML iframes) */
        .rendered-component {
            margin: 1.2em 0;
            position: relative;
        }
        .rendered-frame {
            width: 100%;
            height: 700px;
            border: none;
            background: #1e1e1e;
            border-radius: 6px;
        }
        /* Draggable resize handle (bottom) */
        .preview-resize-handle {
            height: 6px;
            cursor: ns-resize;
            background: var(--border-color);
            position: relative;
            user-select: none;
            -webkit-user-select: none;
        }
        .preview-resize-handle:hover,
        .preview-resize-handle.dragging {
            background: #007acc;
        }
        .preview-resize-handle::after {
            content: '';
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 30px;
            height: 2px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 1px;
        }
        .preview-resize-handle:hover::after,
        .preview-resize-handle.dragging::after {
            background: rgba(255, 255, 255, 0.6);
        }
        /* Width resize handles (left/right) */
        .width-resizable {
            position: relative;
        }
        .preview-resize-handle-right,
        .preview-resize-handle-left {
            position: absolute;
            top: 0;
            width: 8px;
            height: 100%;
            cursor: ew-resize;
            user-select: none;
            -webkit-user-select: none;
            z-index: 10;
        }
        .preview-resize-handle-right { right: -4px; }
        .preview-resize-handle-left { left: -4px; }
        .preview-resize-handle-right:hover,
        .preview-resize-handle-right.dragging,
        .preview-resize-handle-left:hover,
        .preview-resize-handle-left.dragging {
            background: #007acc;
        }
        .preview-resize-handle-right::after,
        .preview-resize-handle-left::after {
            content: '';
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 2px;
            height: 30px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 1px;
        }
        .preview-resize-handle-right:hover::after,
        .preview-resize-handle-right.dragging::after,
        .preview-resize-handle-left:hover::after,
        .preview-resize-handle-left.dragging::after {
            background: rgba(255, 255, 255, 0.6);
        }
        /* Tabs for source/rendered toggle */
        .export-tabs {
            display: flex;
            background: var(--border-color);
            border-bottom: 1px solid var(--border-color);
        }
        .export-tab {
            padding: 8px 16px;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            color: var(--text-dim);
            background: transparent;
            border: none;
            cursor: pointer;
            transition: color 0.2s, background 0.2s;
            text-transform: uppercase;
        }
        .export-tab:hover {
            color: var(--text-muted);
            background: rgba(255, 255, 255, 0.05);
        }
        .export-tab.active {
            color: var(--text-color);
            background: var(--code-bg);
        }
        .export-tab-content {
            display: none;
        }
        .export-tab-content.active {
            display: block;
        }

        /* Document frontmatter — matches the live preview. */
        .document-identity {
            display: flex;
            align-items: center;
            gap: 0.65rem;
            margin: 0 0 1.5rem;
            color: var(--text-muted);
        }
        .document-identity-type {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            max-width: 100%;
            padding: 0.22rem 0.4rem 0.22rem 0.7rem;
            border: 1px solid #2b2b2b;
            border-radius: 999px;
            color: #d0d0d0;
            background: #0b0b0b;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.025);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 0.76rem;
            line-height: 1.4;
            white-space: nowrap;
        }
        .document-identity-text { overflow: hidden; text-overflow: ellipsis; }
        .document-identity-copy {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            width: 1.25rem;
            height: 1.25rem;
            padding: 0;
            border: 0;
            border-radius: 50%;
            color: currentColor;
            background: transparent;
            cursor: pointer;
            opacity: 0.3;
        }
        .document-identity-copy:hover,
        .document-identity-copy:focus-visible { background: rgba(255, 255, 255, 0.06); opacity: 0.8; outline: none; }
        .document-identity-copy.copied { opacity: 1; }
        .document-identity-copy svg { width: 0.75rem; height: 0.75rem; }
        .frontmatter-properties { margin: 0 0 2rem; }
        .frontmatter-property {
            display: grid;
            grid-template-columns: 1.25rem minmax(6rem, 8rem) minmax(0, 1fr);
            align-items: start;
            min-height: 1.9rem;
            color: var(--text-dim);
        }
        .frontmatter-property-icon { color: #666; font-size: 0.8rem; }
        .frontmatter-property-name {
            overflow: hidden;
            padding-right: 0.75rem;
            color: #858585;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .frontmatter-property-value { min-width: 0; overflow-wrap: anywhere; color: #ccc; }
        .frontmatter-chips { display: flex; flex-wrap: wrap; gap: 0.28rem; }
        .frontmatter-chip {
            padding: 0 0.45rem;
            border: 1px solid #3b518d;
            border-radius: 999px;
            color: #91b2ff;
            background: #141a2d;
            font-size: 0.74rem;
            line-height: 1.45;
        }
        .frontmatter-rating { display: inline-flex; gap: 0.12rem; font-size: 0.9rem; line-height: 1.55; letter-spacing: 0.02rem; }
        .frontmatter-star.filled { color: #f0b84b; }
        .frontmatter-star.empty { color: #51462f; }
        .frontmatter-time-group { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; }
        .frontmatter-time {
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0 0.45rem;
            border: 1px solid #3b518d;
            border-radius: 5px;
            color: #91b2ff;
            background: #141a2d;
            font-size: 0.74rem;
            font-variant-numeric: tabular-nums;
            line-height: 1.45;
        }
        .frontmatter-time-icon { color: #83a9ff; font-size: 0.72rem; }
        .frontmatter-time-zone { color: #687fae; font-size: 0.66rem; }
        .frontmatter-relative-time { color: #777; font-size: 0.72rem; white-space: nowrap; }
        .frontmatter-empty { color: #555; }
        .frontmatter-error {
            margin: 0 0 1.5rem;
            padding: 0.65rem 0.8rem;
            border: 1px solid #4b302b;
            border-radius: 6px;
            color: #d99a8f;
            background: #1b1211;
            font-size: 0.8rem;
        }

        /* Tables — matches the live preview. */
        .table-wrapper {
            margin: 1.5em 0;
            width: fit-content;
            min-width: 100%;
            max-width: 100vw;
            margin-left: auto;
            margin-right: auto;
            position: relative;
            left: 50%;
            transform: translateX(-50%);
        }
        .table-wrapper table {
            margin: 0 auto;
            width: auto;
            min-width: 50%;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1.5em 0;
        }
        th, td {
            border: 1px solid var(--border-color);
            padding: 10px 14px;
            text-align: left;
            color: var(--text-dim);
        }
        th {
            background-color: var(--code-bg);
            font-weight: 400;
            color: var(--text-muted);
            letter-spacing: 0.05em;
        }

        /* Lists */
        ul, ol {
            margin: 1em 0;
            padding-left: 2rem;
            color: var(--text-dim);
        }
        li { margin: 0.3em 0; }

        /* Blockquotes */
        blockquote {
            border-left: 3px solid var(--border-color);
            padding: 0.5rem 1.5rem;
            margin: 1.5rem 0;
            color: var(--text-dim);
            background: rgba(255, 255, 255, 0.02);
            border-radius: 0 8px 8px 0;
        }

        /* Obsidian-style callouts — matches the live preview. */
        .callout {
            border-radius: 8px;
            border-left: 3px solid;
            margin: 1.5em 0;
            padding: 1em 1.2em;
            background: transparent;
        }
        .callout-header {
            display: flex;
            align-items: center;
            gap: 0.5em;
            margin-bottom: 0.6em;
        }
        .callout-icon {
            flex-shrink: 0;
            opacity: 0.7;
            display: flex;
            align-items: center;
        }
        .callout-icon svg {
            display: block;
        }
        .callout-title {
            font-weight: 600;
            font-size: 0.95em;
        }
        .callout-body {
            color: var(--text-dim);
            font-size: 0.92em;
            line-height: 1.6;
        }
        .callout-body code {
            background: rgba(255,255,255,0.06);
            padding: 0.15em 0.4em;
            border-radius: 3px;
            font-size: 0.9em;
        }
        .callout-tip,
        .callout-info {
            border-color: #4a9eff;
            background: rgba(74, 158, 255, 0.06);
        }
        .callout-tip .callout-header,
        .callout-info .callout-header { color: #4a9eff; }
        .callout-warning {
            border-color: #e8a838;
            background: rgba(232, 168, 56, 0.06);
        }
        .callout-warning .callout-header { color: #e8a838; }
        .callout-danger {
            border-color: #e85454;
            background: rgba(232, 84, 84, 0.06);
        }
        .callout-danger .callout-header { color: #e85454; }
        .callout-success {
            border-color: #4eca8b;
            background: rgba(78, 202, 139, 0.06);
        }
        .callout-success .callout-header { color: #4eca8b; }

        /* Horizontal rule */
        hr {
            border: none;
            border-top: 1px solid var(--border-color);
            margin: 2rem 0;
        }

        /* Images */
        img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 1rem 0;
        }

        /* Checkboxes (static for export) */
        input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: #8ab4f8;
            margin-right: 0.5em;
            vertical-align: middle;
        }
    `;
}

// ---------------------------------------------------------------------------
// HTML generation (pure)
// ---------------------------------------------------------------------------

/**
 * Replace Marked's Mermaid code fences with the elements consumed by Mermaid.
 * The live preview does this in the webview DOM; exported HTML must do it before
 * Mermaid runs because it does not include the preview's code-block UI.
 */
export function prepareMermaidForExport(renderedHtml: string): string {
    return renderedHtml.replace(
        /<pre\b[^>]*>\s*<code\b(?=[^>]*\bclass="[^"]*\blanguage-mermaid\b[^"]*")[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
        '<div class="mermaid">$1</div>'
    );
}

/**
 * Generate a complete, self-contained HTML file from the rendered preview content.
 * Libraries (mermaid, KaTeX) are embedded inline based on feature flags.
 */
export function generateStandaloneHtml(input: HtmlExportInput): string {
    const {
        renderedHtml,
        title,
        maxWidth,
        usesLatex,
        usesMermaid,
        katexCss,
        katexJs,
        katexAutoRenderJs,
        mermaidJs,
    } = input;

    const css = getExportCss(maxWidth);
    const exportHtml = usesMermaid ? prepareMermaidForExport(renderedHtml) : renderedHtml;

    // Build <head> section
    const katexStyleBlock = usesLatex && katexCss
        ? `<style id="katex-css">${katexCss}</style>`
        : '';

    // Build script blocks
    const mermaidBlock = usesMermaid && mermaidJs
        ? `<script>${mermaidJs}</script>
<script>
if (typeof mermaid !== 'undefined') {
    mermaid.initialize({ theme: 'dark', startOnLoad: false, securityLevel: 'loose' });
    mermaid.run({ nodes: document.querySelectorAll('.mermaid') });
}
</script>`
        : '';

    const katexBlock = usesLatex && katexJs && katexAutoRenderJs
        ? `<script>${katexJs}</script>
<script>${katexAutoRenderJs}</script>
<script>
document.addEventListener("DOMContentLoaded", function() {
    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(document.body, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\\\[', right: '\\\\]', display: true},
                {left: '\\\\(', right: '\\\\)', display: false}
            ],
            throwOnError: false,
            ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
            ignoredClasses: ['mermaid']
        });
    }
});
</script>`
        : '';

    const frontmatterScript = exportHtml.includes('frontmatter-') || exportHtml.includes('document-identity')
        ? `<script>
function copyEntityDescriptor(button) {
    var value = button.dataset.identity || '';
    if (!value || !navigator.clipboard) return;
    navigator.clipboard.writeText(value).then(function() {
        button.classList.add('copied');
        window.setTimeout(function() { button.classList.remove('copied'); }, 900);
    });
}
function formatLocalTime(timestamp) {
    var date = new Date(timestamp);
    if (!Number.isFinite(date.getTime()) || !Intl || !Intl.DateTimeFormat) return null;
    try {
        var timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        var parts = new Intl.DateTimeFormat(undefined, {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone: timeZone
        }).formatToParts(date).reduce(function(result, part) { result[part.type] = part.value; return result; }, {});
        var zonePart = new Intl.DateTimeFormat(undefined, { timeZone: timeZone, timeZoneName: 'short' })
            .formatToParts(date).find(function(part) { return part.type === 'timeZoneName'; });
        return {
            label: parts.day + ' ' + parts.month + ' ' + parts.year + ' · ' + parts.hour + ':' + parts.minute + ':' + parts.second,
            zone: zonePart ? zonePart.value : timeZone,
            zoneTitle: timeZone
        };
    } catch (error) {
        return null;
    }
}
function updateLocalizedTimes() {
    document.querySelectorAll('.frontmatter-time').forEach(function(element) {
        var formatted = formatLocalTime(element.dateTime);
        if (!formatted) return;
        var label = element.querySelector('.frontmatter-time-label');
        var zone = element.querySelector('.frontmatter-time-zone');
        if (label) label.textContent = formatted.label;
        if (zone) { zone.textContent = formatted.zone; zone.title = formatted.zoneTitle; }
    });
}
function formatRelativeTime(timestamp) {
    var target = new Date(timestamp).getTime();
    if (!Number.isFinite(target)) return '';
    var seconds = Math.round((Date.now() - target) / 1000);
    var future = seconds < 0;
    var elapsed = Math.abs(seconds);
    if (elapsed < 45) return future ? 'in a moment' : 'just now';
    var value, unit;
    if (elapsed < 3600) { value = Math.max(1, Math.round(elapsed / 60)); unit = 'min'; }
    else if (elapsed < 86400) { value = Math.round(elapsed / 3600); unit = value === 1 ? 'hour' : 'hours'; }
    else if (elapsed < 2592000) { value = Math.round(elapsed / 86400); unit = value === 1 ? 'day' : 'days'; }
    else if (elapsed < 31536000) { value = Math.round(elapsed / 2629800); unit = value === 1 ? 'month' : 'months'; }
    else { value = Math.round(elapsed / 31557600); unit = value === 1 ? 'year' : 'years'; }
    return future ? 'in ' + value + ' ' + unit : value + ' ' + unit + ' ago';
}
function updateRelativeTimes() {
    document.querySelectorAll('.frontmatter-relative-time').forEach(function(element) {
        element.textContent = formatRelativeTime(element.dataset.timestamp || '');
    });
}
updateLocalizedTimes();
updateRelativeTimes();
setInterval(function() {
    updateLocalizedTimes();
    updateRelativeTimes();
}, 60000);
</script>`
        : '';

    // Resize handle JS (only if rendered components exist)
    const hasRenderedComponents = exportHtml.includes('preview-resize-handle');
    const resizeScript = hasRenderedComponents
        ? `<script>
// Height resize handles
document.querySelectorAll('.preview-resize-handle').forEach(function(handle) {
    var iframe = handle.previousElementSibling;
    if (!iframe || iframe.tagName !== 'IFRAME') return;
    var startY, startHeight;
    handle.addEventListener('mousedown', function(e) {
        e.preventDefault();
        startY = e.clientY;
        startHeight = iframe.offsetHeight;
        handle.classList.add('dragging');
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;cursor:ns-resize;';
        document.body.appendChild(overlay);
        function onMouseMove(e) {
            iframe.style.height = Math.max(100, startHeight + (e.clientY - startY)) + 'px';
        }
        function onMouseUp() {
            handle.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.removeChild(overlay);
        }
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
});

// Width resize handles (left/right)
document.querySelectorAll('.width-resizable').forEach(function(container) {
    ['left', 'right'].forEach(function(side) {
        var handle = container.querySelector('.preview-resize-handle-' + side);
        if (!handle) return;
        var sign = side === 'left' ? -1 : 1;
        var startX, startWidth;
        handle.addEventListener('mousedown', function(e) {
            e.preventDefault();
            startX = e.clientX;
            startWidth = container.getBoundingClientRect().width;
            handle.classList.add('dragging');
            var overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;cursor:ew-resize;';
            document.body.appendChild(overlay);
            function onMouseMove(e) {
                var delta = (e.clientX - startX) * sign;
                var newWidth = Math.max(200, startWidth + delta * 2);
                var maxW = window.innerWidth - 32;
                if (newWidth > maxW) newWidth = maxW;
                var widthStr = newWidth + 'px';
                container.style.width = widthStr;
                container.style.minWidth = widthStr;
                container.style.maxWidth = widthStr;
                container.style.position = 'relative';
                container.style.left = '50%';
                container.style.transform = 'translateX(-50%)';
            }
            function onMouseUp() {
                handle.classList.remove('dragging');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                document.body.removeChild(overlay);
            }
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    });
});

// Tab switching for "both" mode exports
document.querySelectorAll('.export-tabs').forEach(function(tabBar) {
    var container = tabBar.parentElement;
    var tabs = tabBar.querySelectorAll('.export-tab');
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            tabs.forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            var targetId = tab.getAttribute('data-tab-target');
            container.querySelectorAll('.export-tab-content').forEach(function(c) {
                c.classList.remove('active');
            });
            var target = document.getElementById(targetId);
            if (target) target.classList.add('active');
        });
    });
});
</script>`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    ${katexStyleBlock}
    <style>${css}</style>
</head>
<body>
    ${exportHtml}
    ${mermaidBlock}
    ${katexBlock}
    ${frontmatterScript}
    ${resizeScript}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Helpers (pure)
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
