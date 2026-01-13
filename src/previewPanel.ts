import * as vscode from 'vscode';
import * as path from 'path';
import { marked } from 'marked';
import { CellResult } from './kernelManager';

// Map of document URI string to its panel
const panels: Map<string, vscode.WebviewPanel> = new Map();
let onRunCodeCallback: ((code: string, blockId: number, language: string) => void) | undefined;
let extensionPath: string | undefined;

export function setOnRunCode(callback: (code: string, blockId: number, language: string) => void) {
    onRunCodeCallback = callback;
}

/**
 * Toggle a checkbox in the document by its index
 */
async function toggleCheckboxInDocument(document: vscode.TextDocument, checkboxIndex: number, checked: boolean): Promise<void> {
    const text = document.getText();
    const lines = text.split('\n');
    
    let currentIndex = 0;
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        // Match task list items: - [ ] or - [x] or * [ ] or * [x]
        const match = line.match(/^(\s*[-*]\s+)\[([ xX])\](.*)$/);
        if (match) {
            if (currentIndex === checkboxIndex) {
                // Found the checkbox to toggle
                const prefix = match[1];
                const suffix = match[3];
                const newMark = checked ? 'x' : ' ';
                const newLine = `${prefix}[${newMark}]${suffix}`;
                
                const edit = new vscode.WorkspaceEdit();
                const range = new vscode.Range(lineNum, 0, lineNum, line.length);
                edit.replace(document.uri, range, newLine);
                await vscode.workspace.applyEdit(edit);
                return;
            }
            currentIndex++;
        }
    }
}

export function getCurrentDocumentUri(): vscode.Uri | undefined {
    // Return the URI of the first panel's document (for backwards compatibility)
    const firstKey = panels.keys().next().value;
    return firstKey ? vscode.Uri.parse(firstKey) : undefined;
}

/**
 * Get the panel for a specific document, if it exists
 */
function getPanelForDocument(uri: vscode.Uri): vscode.WebviewPanel | undefined {
    return panels.get(uri.toString());
}

/**
 * Get or create a panel for the current document
 */
export function createPreviewPanel(context: vscode.ExtensionContext): vscode.WebviewPanel | undefined {
    const editor = vscode.window.activeTextEditor;
    
    if (!editor || !editor.document.fileName.endsWith('.zef.md')) {
        vscode.window.showWarningMessage('Zef: Open a .zef.md file first');
        return undefined;
    }
    
    const docUri = editor.document.uri;
    const docKey = docUri.toString();
    
    // Check if panel already exists for this document
    const existingPanel = panels.get(docKey);
    if (existingPanel) {
        existingPanel.reveal(vscode.ViewColumn.Two);
        updatePreview(editor.document);
        return existingPanel;
    }
    
    // Create new panel for this document
    const fileName = path.basename(editor.document.fileName, '.zef.md');
    const panelTitle = `${fileName} - Zef View`;
    
    // Store extension path for use in webview
    extensionPath = context.extensionPath;
    
    // Get local resource roots (workspace folders)
    const localResourceRoots: vscode.Uri[] = [];
    if (vscode.workspace.workspaceFolders) {
        for (const folder of vscode.workspace.workspaceFolders) {
            localResourceRoots.push(folder.uri);
        }
    }
    // Also add the current document's folder if available
    const docDir = vscode.Uri.joinPath(docUri, '..');
    localResourceRoots.push(docDir);
    
    // Add extension assets folder for mermaid.js
    const extensionAssetsUri = vscode.Uri.file(path.join(context.extensionPath, 'assets'));
    localResourceRoots.push(extensionAssetsUri);

    const panel = vscode.window.createWebviewPanel(
        'zefView',
        panelTitle,
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: localResourceRoots,
        }
    );
    
    // Store the document URI in the panel for later reference
    (panel as any)._zefDocumentUri = docUri;
    
    // Add to map
    panels.set(docKey, panel);

    panel.onDidDispose(() => {
        panels.delete(docKey);
    });
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(async message => {
        if (message.type === 'runCode' && onRunCodeCallback) {
            onRunCodeCallback(message.code, message.blockId, message.language || 'python');
        } else if (message.type === 'scrollToSource') {
            // Navigate editor to this line
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const line = message.line;
                const range = new vscode.Range(line, 0, line, 0);
                editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                editor.selection = new vscode.Selection(line, 0, line, 0);
            }
        } else if (message.type === 'toggleCheckbox') {
            // Toggle a checkbox in the source document
            const docUri = docKey;
            const document = vscode.workspace.textDocuments.find(d => d.uri.toString() === docUri);
            if (document) {
                await toggleCheckboxInDocument(document, message.index, message.checked);
            }
        }
    });

    updatePreview(editor.document);

    return panel;
}

export function updatePreview(document: vscode.TextDocument) {
    const docKey = document.uri.toString();
    const panel = panels.get(docKey);
    
    if (!panel) {
        return;
    }

    const text = document.getText();
    
    // Extract existing Result, Side Effects, and rendered-html blocks before removing them
    const existingResults: { [blockId: number]: string } = {};
    const existingSideEffects: { [blockId: number]: string } = {};
    const existingRenderedHtml: { [blockId: number]: string } = {};
    let codeBlockIndex = 0;
    
    // Find all executable code blocks and their associated output blocks
    // This includes Python, Rust, JS/TS (with Result/Side Effects) and Svelte (with rendered-html)
    const codeBlockRegex = /```(?:python|rust|javascript|js|typescript|ts|svelte)\s*\n[\s\S]*?```(\s*\n````(?:Result|Output)\s*\n([\s\S]*?)````)?(\s*\n````Side Effects\s*\n([\s\S]*?)````)?(\s*\n````rendered-html\s*\n([\s\S]*?)````)?/g;
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
        codeBlockIndex++;
        if (match[2]) {  // Has Result block
            existingResults[codeBlockIndex] = match[2].trim();
        }
        if (match[4]) {  // Has Side Effects block
            existingSideEffects[codeBlockIndex] = match[4].trim();
        }
        if (match[6]) {  // Has rendered-html block
            existingRenderedHtml[codeBlockIndex] = match[6].trim();
        }
    }
    
    // Remove Result, Side Effects, and rendered-html blocks for rendering
    const cleanText = text
        .replace(/\n````(?:Result|Output)\s*\n[\s\S]*?````/g, '')
        .replace(/\n````Side Effects\s*\n[\s\S]*?````/g, '')
        .replace(/\n````rendered-html\s*\n[\s\S]*?````/g, '');
    
    let html = renderMarkdown(cleanText);
    
    // Convert relative image paths to webview URIs
    const docDir = path.dirname(document.uri.fsPath);
    html = convertImagePaths(html, docDir, panel.webview);
    
    // Get mermaid script URI if extension path is available
    let mermaidUri = '';
    if (extensionPath) {
        const mermaidPath = vscode.Uri.file(path.join(extensionPath, 'assets', 'mermaid.min.js'));
        mermaidUri = panel.webview.asWebviewUri(mermaidPath).toString();
    }
    
    panel.webview.html = getWebviewContent(html, existingResults, existingSideEffects, mermaidUri, existingRenderedHtml);
}

/**
 * Get the panel for the active editor's document (if exists)
 */
export function getPanel(): vscode.WebviewPanel | undefined {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        return panels.get(editor.document.uri.toString());
    }
    // Return first panel as fallback
    return panels.values().next().value;
}

/**
 * Get panel for a specific document URI
 */
export function getPanelForUri(uri: vscode.Uri): vscode.WebviewPanel | undefined {
    return panels.get(uri.toString());
}

export function scrollPreviewToLine(line: number) {
    const panel = getPanel();
    if (panel) {
        panel.webview.postMessage({ type: 'scrollToLine', line: line });
    }
}

export function sendCellResult(blockId: number, result: CellResult, documentUri?: vscode.Uri) {
    // Send to specific panel if URI provided, otherwise send to active panel
    let panel: vscode.WebviewPanel | undefined;
    if (documentUri) {
        panel = panels.get(documentUri.toString());
    } else {
        panel = getPanel();
    }
    
    if (panel) {
        panel.webview.postMessage({ 
            type: 'cellResult', 
            blockId: blockId,
            result: result
        });
    }
}

export interface SvelteResult {
    success: boolean;
    html?: string;
    error?: string;
    compileTime: string;
}

export function sendSvelteResult(blockId: number, result: SvelteResult, documentUri?: vscode.Uri) {
    // Send to specific panel if URI provided, otherwise send to active panel
    let panel: vscode.WebviewPanel | undefined;
    if (documentUri) {
        panel = panels.get(documentUri.toString());
    } else {
        panel = getPanel();
    }
    
    if (panel) {
        panel.webview.postMessage({ 
            type: 'svelteResult', 
            blockId: blockId,
            result: result
        });
    }
}

function renderMarkdown(markdown: string): string {
    marked.setOptions({
        gfm: true,
        breaks: true,
    });

    let html = marked.parse(markdown) as string;
    
    // Remove disabled attribute from checkboxes to make them interactive
    // Marked generates: <input disabled="" type="checkbox"> for unchecked
    // and: <input checked="" disabled="" type="checkbox"> for checked
    html = html.replace(/<input disabled="" type="checkbox">/g, '<input type="checkbox">');
    html = html.replace(/<input checked="" disabled="" type="checkbox">/g, '<input type="checkbox" checked>');
    
    return html;
}

/**
 * Convert relative image paths in HTML to webview URIs and wrap with copy button
 * This is necessary because webviews can't directly access local file:// URLs
 */
function convertImagePaths(html: string, docDir: string, webview: vscode.Webview): string {
    // Match img tags with src attribute
    const imgRegex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
    
    // Copy button SVG icon - two overlapping document pages, taller aspect ratio
    const copyButtonSvg = `<svg viewBox="0 0 24 24"><rect x="8" y="6" width="12" height="15" rx="1.5" ry="1.5"></rect><path d="M4 18V5a1.5 1.5 0 0 1 1.5-1.5h9"></path></svg>`;
    
    return html.replace(imgRegex, (match, before, src, after) => {
        let imgSrc = src;
        
        // Convert relative paths to webview URIs
        if (!src.startsWith('http://') && !src.startsWith('https://') && 
            !src.startsWith('data:') && !src.startsWith('vscode-')) {
            // Convert relative path to absolute path
            const absolutePath = path.isAbsolute(src) ? src : path.join(docDir, src);
            
            // Convert to webview URI
            const fileUri = vscode.Uri.file(absolutePath);
            imgSrc = webview.asWebviewUri(fileUri).toString();
        }
        
        // Wrap image in container with copy button
        return `<span class="image-container">
            <img ${before}src="${imgSrc}"${after}>
            <button class="image-copy-btn" onclick="copyImage(this, '${imgSrc}')" title="Copy image to clipboard">
                ${copyButtonSvg}
            </button>
        </span>`;
    });
}

function getWebviewContent(renderedHtml: string, existingOutputs: { [blockId: number]: string } = {}, existingSideEffects: { [blockId: number]: string } = {}, mermaidUri: string = '', existingRenderedHtml: { [blockId: number]: string } = {}): string {
    // Serialize existing outputs, side effects, and rendered HTML as JSON for the webview
    // Escape </script> to prevent premature script tag termination in HTML
    const escapeForScript = (json: string) => json.replace(/<\/script>/gi, '<\\/script>');
    const outputsJson = escapeForScript(JSON.stringify(existingOutputs));
    const sideEffectsJson = escapeForScript(JSON.stringify(existingSideEffects));
    const renderedHtmlJson = escapeForScript(JSON.stringify(existingRenderedHtml));
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zef Preview</title>
    <style>
        /* Elegant dark theme inspired by AKB landing page */
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

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.8;
            font-size: 0.9rem;
            color: var(--text-color);
            background-color: var(--bg-color);
            padding: 3rem 2rem;
            max-width: 680px;
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

        h2 {
            font-size: 1.5rem;
            color: var(--text-muted);
        }

        h3 {
            font-size: 1.2rem;
            color: var(--text-muted);
        }

        p {
            margin: 1.2em 0;
            color: var(--text-dim);
        }

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
            padding: 0.15em 0.4em;
            border-radius: 3px;
            font-size: 0.85em;
            color: var(--text-muted);
        }

        pre {
            background-color: var(--code-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 1.5rem;
            padding-top: 2.5rem;
            overflow-x: auto;
            position: relative;
            margin: 1.5rem 0;
        }

        pre code {
            background-color: transparent;
            padding: 0;
            font-size: 0.8rem;
            line-height: 1.6;
            color: #aaa;
        }

        /* Syntax highlighting - subtle and elegant */
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
        .mermaid svg {
            max-width: 100%;
            height: auto;
        }

        /* Svelte preview */
        .svelte-container .code-block-lang {
            /* Don't push to the right for svelte, there's a compile button */
        }
        .svelte-preview-frame {
            width: 100%;
            min-height: 700px;
            border: none;
            background: #1e1e1e;
        }
        .svelte-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 150px;
            text-align: center;
            padding: 24px;
        }
        .svelte-placeholder .placeholder-text {
            font-size: 1.25rem;
            color: var(--text-dim);
            opacity: 0.4;
            font-weight: 400;
        }
        .compile-time {
            font-size: 0.65rem;
            margin-left: 4px;
            font-weight: normal;
        }

        /* Code block container with tabs */
        .code-block-container {
            margin: 1.5rem 0;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            overflow: hidden;
        }

        .code-block-tabs {
            display: flex;
            background: var(--border-color);
            border-bottom: 1px solid var(--border-color);
        }

        .code-block-tab {
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

        .code-block-tab:hover {
            color: var(--text-muted);
            background: rgba(255, 255, 255, 0.05);
        }

        .code-block-tab.active {
            color: var(--text-color);
            background: var(--code-bg);
        }

        .code-block-lang {
            padding: 8px 16px;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            color: var(--text-dim);
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        /* For blocks without a Run button (like mermaid), push lang indicator to right */
        .mermaid-container .code-block-lang {
            margin-left: auto;
        }
        
        .code-block-run {
            padding: 4px 12px;
            font-size: 0.7rem;
            letter-spacing: 0.05em;
            color: #98c379;
            background: rgba(152, 195, 121, 0.1);
            border: 1px solid rgba(152, 195, 121, 0.3);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            margin-left: auto;
            margin-right: 8px;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .code-block-run:hover {
            background: rgba(152, 195, 121, 0.2);
            border-color: rgba(152, 195, 121, 0.5);
        }
        
        .code-block-run.running {
            color: #d19a66;
            background: rgba(209, 154, 102, 0.1);
            border-color: rgba(209, 154, 102, 0.3);
            cursor: wait;
        }
        
        .code-block-run.running::before {
            content: '';
            width: 10px;
            height: 10px;
            border: 2px solid transparent;
            border-top-color: #d19a66;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .code-block-content {
            display: none;
        }

        .code-block-content.active {
            display: block;
        }

        .code-block-content pre {
            margin: 0;
            border: none;
            border-radius: 0;
        }

        .tab-content-output,
        .tab-content-side-effects {
            padding: 1.5rem;
            background: var(--code-bg);
            color: var(--text-muted);
            font-family: 'SF Mono', 'Fira Code', Consolas, 'Courier New', monospace;
            font-size: 0.8rem;
            line-height: 1.6;
        }

        .tab-content-output .output-label,
        .tab-content-side-effects .effects-label {
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--text-dim);
            margin-bottom: 0.5rem;
        }

        .tab-content-output .output-value {
            color: #98c379;
        }

        .tab-content-side-effects .effect-item {
            padding: 4px 0;
            color: #d19a66;
        }

        blockquote {
            border-left: 2px solid var(--border-color);
            margin: 1.5em 0;
            padding: 0.5em 1.5em;
            color: var(--text-dim);
        }

        blockquote p {
            margin: 0;
        }

        ul, ol {
            padding-left: 1.5em;
            color: var(--text-dim);
        }

        li {
            margin: 0.5em 0;
        }

        /* Task list checkbox styling */
        input[type="checkbox"] {
            appearance: none;
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            border: 2px solid var(--text-dim);
            border-radius: 3px;
            margin-right: 8px;
            vertical-align: middle;
            position: relative;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        input[type="checkbox"]:hover {
            border-color: var(--text-muted);
        }

        input[type="checkbox"]:checked {
            background-color: #3d8b40;
            border-color: #357a38;
        }

        input[type="checkbox"]:checked::after {
            content: '✓';
            position: absolute;
            top: -2px;
            left: 2px;
            font-size: 12px;
            font-weight: bold;
            color: #fff;
        }

        li:has(input[type="checkbox"]:checked) {
            color: var(--text-muted);
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

        hr {
            border: none;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--border-color), transparent);
            margin: 3rem 0;
        }

        img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
        }

        /* Image container with copy button overlay */
        .image-container {
            position: relative;
            display: inline-block;
        }

        .image-copy-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 28px;
            height: 28px;
            background: transparent;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.55;
            transition: opacity 0.2s;
            padding: 4px;
        }

        .image-container:hover .image-copy-btn {
            opacity: 0.75;
        }

        .image-copy-btn:hover {
            opacity: 1 !important;
        }

        .image-copy-btn svg {
            width: 18px;
            height: 18px;
            fill: none;
            stroke: #888;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
        }

        .image-copy-btn:hover svg {
            stroke: #ccc;
        }

        .image-copy-btn.copied {
            background: rgba(60, 120, 80, 0.85);
            border-radius: 6px;
        }

        .image-copy-btn.copied svg {
            stroke: #fff;
        }

        strong {
            font-weight: 500;
            color: #aaa;
        }

        em {
            font-style: italic;
            color: var(--text-muted);
        }
    </style>
</head>
<body>
    ${renderedHtml}
    <script>
        // Copy image to clipboard function
        async function copyImage(button, src) {
            try {
                // Fetch the image
                const response = await fetch(src);
                const blob = await response.blob();
                
                // Try to copy as PNG
                if (blob.type.startsWith('image/')) {
                    // Convert to PNG if needed
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = src;
                    });
                    
                    // Draw to canvas and get PNG blob
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    const pngBlob = await new Promise(resolve => 
                        canvas.toBlob(resolve, 'image/png')
                    );
                    
                    // Write to clipboard
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': pngBlob })
                    ]);
                    
                    // Show success state (checkmark icon)
                    button.classList.add('copied');
                    button.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                    
                    setTimeout(() => {
                        button.classList.remove('copied');
                        // Restore to document copy icon
                        button.innerHTML = '<svg viewBox="0 0 24 24"><rect x="8" y="6" width="12" height="15" rx="1.5" ry="1.5"></rect><path d="M4 18V5a1.5 1.5 0 0 1 1.5-1.5h9"></path></svg>';
                    }, 1500);
                }
            } catch (err) {
                console.error('Failed to copy image:', err);
                // Fallback: show error briefly
                button.style.background = 'rgba(239, 68, 68, 0.8)';
                setTimeout(() => {
                    button.style.background = '';
                }, 1000);
            }
        }

        (function() {
            // Existing outputs, side effects, and rendered HTML loaded from file
            var existingOutputs = ${outputsJson};
            var existingSideEffects = ${sideEffectsJson};
            var existingRenderedHtml = ${renderedHtmlJson};
            
            // Add language data attributes to pre elements
            document.querySelectorAll('pre code').forEach(function(block) {
                var classes = block.className.split(' ');
                for (var i = 0; i < classes.length; i++) {
                    if (classes[i].indexOf('language-') === 0) {
                        var lang = classes[i].replace('language-', '');
                        block.parentElement.setAttribute('data-lang', lang);
                        break;
                    }
                }
            });

            // Python keywords
            var pyKw = ['def', 'class', 'return', 'if', 'else', 'elif', 'for', 'while', 
                        'import', 'from', 'as', 'try', 'except', 'finally', 'with', 
                        'in', 'not', 'and', 'or', 'is', 'None', 'True', 'False', 
                        'lambda', 'yield', 'raise', 'pass', 'break', 'continue', 
                        'async', 'await', 'self'];
            
            // Rust keywords
            var rsKw = ['fn', 'let', 'mut', 'const', 'static', 'if', 'else', 'match',
                        'for', 'while', 'loop', 'break', 'continue', 'return',
                        'struct', 'enum', 'impl', 'trait', 'pub', 'mod', 'use',
                        'crate', 'self', 'super', 'as', 'where', 'unsafe',
                        'async', 'await', 'move', 'ref', 'type', 'dyn', 'extern', 'in'];
            
            // Rust types
            var rsTypes = ['i8', 'i16', 'i32', 'i64', 'i128', 'isize',
                           'u8', 'u16', 'u32', 'u64', 'u128', 'usize',
                           'f32', 'f64', 'bool', 'char', 'str', 'String',
                           'Vec', 'Option', 'Result', 'Box', 'Rc', 'Arc',
                           'Self', 'Some', 'None', 'Ok', 'Err'];
            
            // JS keywords
            var jsKw = ['const', 'let', 'var', 'function', 'return', 'if', 'else',
                        'for', 'while', 'class', 'extends', 'import', 'export',
                        'from', 'as', 'new', 'this', 'try', 'catch', 'finally',
                        'throw', 'async', 'await', 'typeof', 'instanceof', 'in',
                        'of', 'default', 'switch', 'case', 'break', 'continue',
                        'null', 'undefined', 'true', 'false'];

            function escapeHtml(text) {
                return text.replace(/&/g, '&amp;')
                           .replace(/</g, '&lt;')
                           .replace(/>/g, '&gt;');
            }

            function highlightCode(code, lang) {
                var lines = code.split('\\n');
                var result = [];
                
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i];
                    var highlighted = '';
                    var j = 0;
                    
                    while (j < line.length) {
                        // Check for comments
                        if (lang === 'python' && line[j] === '#') {
                            highlighted += '<span class="hl-cmt">' + escapeHtml(line.slice(j)) + '</span>';
                            break;
                        }
                        if ((lang === 'rust' || lang === 'javascript' || lang === 'typescript') && 
                            line[j] === '/' && line[j+1] === '/') {
                            highlighted += '<span class="hl-cmt">' + escapeHtml(line.slice(j)) + '</span>';
                            break;
                        }
                        
                        // Check for strings
                        if (line[j] === '"' || line[j] === "'") {
                            var quote = line[j];
                            var str = quote;
                            j++;
                            while (j < line.length && line[j] !== quote) {
                                if (line[j] === '\\\\' && j + 1 < line.length) {
                                    str += line[j] + line[j+1];
                                    j += 2;
                                } else {
                                    str += line[j];
                                    j++;
                                }
                            }
                            if (j < line.length) {
                                str += line[j];
                                j++;
                            }
                            highlighted += '<span class="hl-str">' + escapeHtml(str) + '</span>';
                            continue;
                        }
                        
                        // Check for numbers
                        if (/[0-9]/.test(line[j])) {
                            var num = '';
                            while (j < line.length && /[0-9.]/.test(line[j])) {
                                num += line[j];
                                j++;
                            }
                            highlighted += '<span class="hl-num">' + num + '</span>';
                            continue;
                        }
                        
                        // Check for identifiers/keywords
                        if (/[a-zA-Z_]/.test(line[j])) {
                            var ident = '';
                            while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) {
                                ident += line[j];
                                j++;
                            }
                            
                            var keywords = [];
                            var types = [];
                            if (lang === 'python') keywords = pyKw;
                            else if (lang === 'rust') { keywords = rsKw; types = rsTypes; }
                            else if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') keywords = jsKw;
                            
                            // Check if followed by ( for function (lookahead without consuming)
                            var lookAhead = j;
                            while (lookAhead < line.length && line[lookAhead] === ' ') {
                                lookAhead++;
                            }
                            var isFunction = lookAhead < line.length && line[lookAhead] === '(';
                            
                            if (keywords.indexOf(ident) >= 0) {
                                highlighted += '<span class="hl-kw">' + ident + '</span>';
                            } else if (types.indexOf(ident) >= 0) {
                                highlighted += '<span class="hl-ty">' + ident + '</span>';
                            } else if (isFunction) {
                                highlighted += '<span class="hl-fn">' + ident + '</span>';
                            } else {
                                highlighted += ident;
                            }
                            continue;
                        }
                        
                        // Default: just add the character
                        highlighted += escapeHtml(line[j]);
                        j++;
                    }
                    
                    result.push(highlighted);
                }
                
                return result.join('\\n');
            }

            // Apply syntax highlighting
            document.querySelectorAll('pre code').forEach(function(block) {
                var lang = block.parentElement.getAttribute('data-lang') || '';
                if (lang === 'python' || lang === 'rust' || lang === 'javascript' || 
                    lang === 'js' || lang === 'typescript' || lang === 'ts' || lang === 'svelte') {
                    var code = block.textContent || '';
                    // Svelte uses JavaScript/HTML highlighting
                    var hlLang = (lang === 'svelte') ? 'javascript' : lang;
                    block.innerHTML = highlightCode(code, hlLang);
                }
            });
            // Transform code blocks to have tabs
            var codeBlockId = 0; // Count Python and Rust blocks to match parser
            var codeBlocks = {}; // Store code content for each block
            var blockLanguages = {}; // Store language for each block
            var vscode = acquireVsCodeApi();

            // Handle checkbox clicks to toggle task list items
            document.addEventListener('change', function(event) {
                var target = event.target;
                if (target.tagName === 'INPUT' && target.type === 'checkbox') {
                    // Only count checkboxes that are in list items (task list checkboxes)
                    // Exclude checkboxes in code blocks, output areas, etc.
                    if (!target.closest('li')) {
                        return; // Not a task list checkbox
                    }
                    
                    // Find the checkbox index by counting only task list checkboxes
                    var taskCheckboxes = document.querySelectorAll('li > input[type="checkbox"]');
                    var index = -1;
                    for (var i = 0; i < taskCheckboxes.length; i++) {
                        if (taskCheckboxes[i] === target) {
                            index = i;
                            break;
                        }
                    }
                    if (index >= 0) {
                        vscode.postMessage({
                            type: 'toggleCheckbox',
                            index: index,
                            checked: target.checked
                        });
                    }
                }
            });
            
            document.querySelectorAll('pre').forEach(function(pre) {
                var lang = pre.getAttribute('data-lang') || 'code';
                var isPython = (lang === 'python' || lang === 'py');
                var isRust = (lang === 'rust' || lang === 'rs');
                var isJs = (lang === 'javascript' || lang === 'js');
                var isTs = (lang === 'typescript' || lang === 'ts');
                var isMermaid = (lang === 'mermaid');
                var isSvelte = (lang === 'svelte');
                var isExecutable = isPython || isRust || isJs || isTs || isSvelte;
                
                // Only assign blockId to executable blocks to match the parser
                var currentBlockId = null;
                if (isExecutable) {
                    codeBlockId++;
                    currentBlockId = codeBlockId;
                }
                
                var codeElement = pre.querySelector('code');
                var codeContent = codeElement ? codeElement.textContent || '' : '';
                
                // Store the code and language for this block (Python, Rust, JavaScript, TypeScript)
                if (currentBlockId !== null) {
                    codeBlocks[currentBlockId] = codeContent;
                    blockLanguages[currentBlockId] = lang;
                }
                
                // Handle mermaid blocks specially
                if (isMermaid) {
                    // Create container for mermaid with tabs
                    var mermaidContainer = document.createElement('div');
                    mermaidContainer.className = 'code-block-container mermaid-container';
                    
                    // Create tabs bar
                    var mermaidTabsBar = document.createElement('div');
                    mermaidTabsBar.className = 'code-block-tabs';
                    
                    var mermaidTabs = ['Rendered', 'Source Code'];
                    mermaidTabs.forEach(function(tabName, index) {
                        var tab = document.createElement('button');
                        tab.className = 'code-block-tab' + (index === 0 ? ' active' : '');
                        tab.textContent = tabName;
                        tab.setAttribute('data-tab', tabName.toLowerCase().replace(' ', '-'));
                        tab.onclick = (function(thisContainer, thisTab) {
                            return function() {
                                thisContainer.querySelectorAll('.code-block-tab').forEach(function(t) {
                                    t.classList.remove('active');
                                });
                                thisTab.classList.add('active');
                                thisContainer.querySelectorAll('.code-block-content').forEach(function(c) {
                                    c.classList.remove('active');
                                });
                                var tabId = thisTab.getAttribute('data-tab');
                                thisContainer.querySelector('.mermaid-' + tabId).classList.add('active');
                            };
                        })(mermaidContainer, tab);
                        mermaidTabsBar.appendChild(tab);
                    });
                    
                    // Add language indicator
                    var mermaidLangIndicator = document.createElement('div');
                    mermaidLangIndicator.className = 'code-block-lang';
                    mermaidLangIndicator.textContent = 'Mermaid';
                    mermaidTabsBar.appendChild(mermaidLangIndicator);
                    
                    // Create "Rendered" content (the diagram)
                    var renderedContent = document.createElement('div');
                    renderedContent.className = 'code-block-content mermaid-rendered active';
                    var mermaidDiv = document.createElement('div');
                    mermaidDiv.className = 'mermaid';
                    mermaidDiv.textContent = codeContent;
                    renderedContent.appendChild(mermaidDiv);
                    
                    // Create "Source Code" content
                    var sourceContent = document.createElement('div');
                    sourceContent.className = 'code-block-content mermaid-source-code';
                    var sourceCode = document.createElement('pre');
                    sourceCode.setAttribute('data-lang', 'mermaid');
                    var sourceCodeInner = document.createElement('code');
                    sourceCodeInner.textContent = codeContent;
                    sourceCode.appendChild(sourceCodeInner);
                    sourceContent.appendChild(sourceCode);
                    
                    // Insert container
                    pre.parentNode.insertBefore(mermaidContainer, pre);
                    mermaidContainer.appendChild(mermaidTabsBar);
                    mermaidContainer.appendChild(renderedContent);
                    mermaidContainer.appendChild(sourceContent);
                    
                    // Remove original pre
                    pre.parentNode.removeChild(pre);
                    return; // Skip the rest of the loop for mermaid
                }
                
                // Handle Svelte blocks with Compile button and Rendered/Source tabs
                if (isSvelte) {
                    // Store the code and language for this block
                    codeBlocks[currentBlockId] = codeContent;
                    blockLanguages[currentBlockId] = 'svelte';
                    
                    // Create container for svelte with tabs
                    var svelteContainer = document.createElement('div');
                    svelteContainer.className = 'code-block-container svelte-container';
                    svelteContainer.setAttribute('data-block-id', currentBlockId);
                    
                    // Create tabs bar
                    var svelteTabsBar = document.createElement('div');
                    svelteTabsBar.className = 'code-block-tabs';
                    
                    // Check if we have existing rendered HTML for this block
                    var hasRenderedOutput = existingRenderedHtml && existingRenderedHtml[currentBlockId];
                    
                    // Add tabs - Rendered first, then Source Code
                    var svelteTabs = ['Rendered', 'Source Code'];
                    svelteTabs.forEach(function(tabName, index) {
                        var tab = document.createElement('button');
                        // If we have rendered output, Rendered is active; otherwise Source Code is active
                        var isActive = hasRenderedOutput ? (index === 0) : (index === 1);
                        tab.className = 'code-block-tab' + (isActive ? ' active' : '');
                        tab.textContent = tabName;
                        tab.setAttribute('data-tab', tabName.toLowerCase().replace(' ', '-'));
                        tab.onclick = (function(thisContainer, thisTab) {
                            return function() {
                                thisContainer.querySelectorAll('.code-block-tab').forEach(function(t) {
                                    t.classList.remove('active');
                                });
                                thisTab.classList.add('active');
                                thisContainer.querySelectorAll('.code-block-content').forEach(function(c) {
                                    c.classList.remove('active');
                                });
                                var tabId = thisTab.getAttribute('data-tab');
                                thisContainer.querySelector('.svelte-' + tabId).classList.add('active');
                            };
                        })(svelteContainer, tab);
                        svelteTabsBar.appendChild(tab);
                    });
                    
                    // Add Compile button (same style as Run button, aligned right)
                    var compileBtn = document.createElement('button');
                    compileBtn.className = 'code-block-run';
                    compileBtn.id = 'compile-btn-' + currentBlockId;
                    compileBtn.innerHTML = '▶ Compile';
                    compileBtn.setAttribute('data-block-id', currentBlockId);
                    compileBtn.onclick = (function(blockId) {
                        return function() {
                            var btn = document.getElementById('compile-btn-' + blockId);
                            if (btn.classList.contains('running')) return;
                            btn.classList.add('running');
                            btn.innerHTML = 'Compiling...';
                            
                            var code = codeBlocks[blockId];
                            var language = blockLanguages[blockId];
                            if (code) {
                                vscode.postMessage({
                                    type: 'runCode',
                                    code: code,
                                    blockId: blockId,
                                    language: language
                                });
                            }
                        };
                    })(currentBlockId);
                    svelteTabsBar.appendChild(compileBtn);
                    
                    // Add language indicator with compile time placeholder
                    var svelteLangIndicator = document.createElement('div');
                    svelteLangIndicator.className = 'code-block-lang';
                    svelteLangIndicator.innerHTML = 'Svelte <span class="compile-time" data-block-id="' + currentBlockId + '"></span>';
                    svelteTabsBar.appendChild(svelteLangIndicator);
                    
                    // Create "Source Code" content (active if no rendered output)
                    var svelteSourceContent = document.createElement('div');
                    svelteSourceContent.className = 'code-block-content svelte-source-code' + (hasRenderedOutput ? '' : ' active');
                    var svelteSourcePre = document.createElement('pre');
                    svelteSourcePre.setAttribute('data-lang', 'svelte');
                    var svelteSourceCode = document.createElement('code');
                    svelteSourceCode.innerHTML = highlightCode(codeContent, 'svelte');
                    svelteSourcePre.appendChild(svelteSourceCode);
                    svelteSourceContent.appendChild(svelteSourcePre);
                    
                    // Create "Rendered" content (active if we have rendered output)
                    var svelteRenderedContent = document.createElement('div');
                    svelteRenderedContent.className = 'code-block-content svelte-rendered' + (hasRenderedOutput ? ' active' : '');
                    
                    // Check for existing rendered HTML for this block
                    if (hasRenderedOutput) {
                        // Show iframe with rendered content
                        var svelteIframe = document.createElement('iframe');
                        svelteIframe.className = 'svelte-preview-frame';
                        svelteIframe.setAttribute('sandbox', 'allow-scripts');
                        svelteIframe.setAttribute('data-block-id', currentBlockId);
                        svelteIframe.srcdoc = existingRenderedHtml[currentBlockId];
                        svelteRenderedContent.appendChild(svelteIframe);
                    } else {
                        // Show placeholder message
                        var placeholder = document.createElement('div');
                        placeholder.className = 'svelte-placeholder';
                        placeholder.setAttribute('data-block-id', currentBlockId);
                        placeholder.innerHTML = '<div class="placeholder-text">Not yet compiled</div>';
                        svelteRenderedContent.appendChild(placeholder);
                    }
                    
                    // Insert container
                    pre.parentNode.insertBefore(svelteContainer, pre);
                    svelteContainer.appendChild(svelteTabsBar);
                    svelteContainer.appendChild(svelteSourceContent);
                    svelteContainer.appendChild(svelteRenderedContent);
                    
                    // Remove original pre
                    pre.parentNode.removeChild(pre);
                    return; // Skip the rest of the loop for svelte
                }
                
                // Create container
                var container = document.createElement('div');
                container.className = 'code-block-container';
                if (currentBlockId !== null) {
                    container.setAttribute('data-block-id', currentBlockId);
                }
                
                // Create tabs bar
                var tabsBar = document.createElement('div');
                tabsBar.className = 'code-block-tabs';
                
                var tabs = ['Code', 'Result', 'Side Effects'];
                tabs.forEach(function(tabName, index) {
                    var tab = document.createElement('button');
                    tab.className = 'code-block-tab' + (index === 0 ? ' active' : '');
                    tab.textContent = tabName;
                    tab.setAttribute('data-tab', tabName.toLowerCase().replace(' ', '-'));
                    if (currentBlockId !== null) {
                        tab.setAttribute('data-block', currentBlockId);
                    }
                    tab.onclick = (function(thisContainer, thisBlockId, thisTab) {
                        return function() {
                            // Deactivate all tabs in this container
                            thisContainer.querySelectorAll('.code-block-tab').forEach(function(t) {
                                t.classList.remove('active');
                            });
                            // Activate this tab
                            thisTab.classList.add('active');
                            // Show corresponding content
                            thisContainer.querySelectorAll('.code-block-content').forEach(function(c) {
                                c.classList.remove('active');
                            });
                            var targetId = 'content-' + thisBlockId + '-' + thisTab.getAttribute('data-tab');
                            var targetContent = document.getElementById(targetId);
                            if (targetContent) {
                                targetContent.classList.add('active');
                            }
                        };
                    })(container, currentBlockId, tab);
                    tabsBar.appendChild(tab);
                });
                
                // Add Run button for Python, Rust, JavaScript, and TypeScript blocks
                var isPython = (lang === 'python' || lang === 'py');
                var isRust = (lang === 'rust' || lang === 'rs');
                var isJs = (lang === 'javascript' || lang === 'js');
                var isTs = (lang === 'typescript' || lang === 'ts');
                if (isPython || isRust || isJs || isTs) {
                    var runBtn = document.createElement('button');
                    runBtn.className = 'code-block-run';
                    runBtn.id = 'run-btn-' + currentBlockId;
                    runBtn.innerHTML = '▶ Run';
                    runBtn.onclick = (function(thisBlockId, thisLang) {
                        return function() {
                            var btn = document.getElementById('run-btn-' + thisBlockId);
                            if (btn.classList.contains('running')) return;
                            btn.classList.add('running');
                            btn.innerHTML = 'Running...';
                            
                            var code = codeBlocks[thisBlockId];
                            vscode.postMessage({
                                type: 'runCode',
                                code: code,
                                blockId: thisBlockId,
                                language: thisLang
                            });
                        };
                    })(currentBlockId, lang);
                    tabsBar.appendChild(runBtn);
                }
                
                // Add language indicator with emoji on the right
                var langIndicator = document.createElement('div');
                langIndicator.className = 'code-block-lang';
                var emoji = '';
                var langName = lang;
                if (lang === 'python' || lang === 'py') {
                    emoji = '🐍';
                    langName = 'Python';
                } else if (lang === 'rust' || lang === 'rs') {
                    emoji = '🦀';
                    langName = 'Rust';
                } else if (lang === 'javascript' || lang === 'js') {
                    emoji = '📜';
                    langName = 'JavaScript';
                } else if (lang === 'typescript' || lang === 'ts') {
                    emoji = '📘';
                    langName = 'TypeScript';
                }
                langIndicator.innerHTML = '<span>' + langName + '</span><span>' + emoji + '</span>';
                tabsBar.appendChild(langIndicator);
                
                // Create content containers
                var codeContent = document.createElement('div');
                codeContent.className = 'code-block-content active';
                codeContent.id = 'content-' + currentBlockId + '-code';
                
                // Check for existing output from file
                var existingOutput = (currentBlockId !== null && existingOutputs[currentBlockId]) 
                    ? existingOutputs[currentBlockId] 
                    : null;
                
                var outputContent = document.createElement('div');
                outputContent.className = 'code-block-content';
                outputContent.id = 'content-' + currentBlockId + '-result';
                
                var outputHtml = '<div class="tab-content-output">' +
                    '<div class="output-label">Result</div>' +
                    '<div class="output-value" id="result-value-' + currentBlockId + '">';
                    
                if (existingOutput) {
                    // Show existing output with Python syntax highlighting (results are always Python/zef expressions)
                    outputHtml += '<pre style="margin: 0; background: transparent;"><code>' + highlightCode(existingOutput, 'python') + '</code></pre>';
                } else {
                    outputHtml += '<span style="color: var(--text-dim); font-style: italic;">No result yet. Click Run to execute.</span>';
                }
                outputHtml += '</div></div>';
                outputContent.innerHTML = outputHtml;
                
                var sideEffectsContent = document.createElement('div');
                sideEffectsContent.className = 'code-block-content';
                sideEffectsContent.id = 'content-' + currentBlockId + '-side-effects';
                
                // Check for existing side effects from file
                var existingSideEffect = (currentBlockId !== null && existingSideEffects[currentBlockId]) 
                    ? existingSideEffects[currentBlockId] 
                    : null;
                
                var sideEffectsHtml = '<div class="tab-content-side-effects">' +
                    '<div class="effects-label">Side Effects</div>' +
                    '<div id="side-effects-value-' + currentBlockId + '">';
                
                if (existingSideEffect) {
                    // Parse the side effects list and display with Python syntax highlighting
                    sideEffectsHtml += '<pre style="margin: 0; background: transparent;"><code>' + highlightCode(existingSideEffect, 'python') + '</code></pre>';
                } else {
                    sideEffectsHtml += '<span style="color: var(--text-dim); font-style: italic;">No side effects recorded.</span>';
                }
                
                sideEffectsHtml += '</div></div>';
                sideEffectsContent.innerHTML = sideEffectsHtml;
                
                // Insert container before pre
                pre.parentNode.insertBefore(container, pre);
                
                // Move pre into code content
                codeContent.appendChild(pre);
                
                // Assemble container
                container.appendChild(tabsBar);
                container.appendChild(codeContent);
                container.appendChild(outputContent);
                container.appendChild(sideEffectsContent);
            });
            
            // Handle messages from the extension
            window.addEventListener('message', function(event) {
                var message = event.data;
                
                if (message.type === 'cellResult') {
                    var blockId = message.blockId;
                    var result = message.result;
                    
                    // Reset run button
                    var runBtn = document.getElementById('run-btn-' + blockId);
                    if (runBtn) {
                        runBtn.classList.remove('running');
                        runBtn.innerHTML = '▶ Run';
                    }
                    
                    // Update result tab
                    var resultValue = document.getElementById('result-value-' + blockId);
                    if (resultValue) {
                        var html = '';
                        
                        if (result.status === 'error') {
                            html = '<span style="color: #e06c75;">' + 
                                   (result.error ? result.error.type + ': ' + result.error.message : 'Error') +
                                   '</span>';
                            if (result.error && result.error.traceback) {
                                html += '<pre style="color: #e06c75; margin-top: 8px; font-size: 0.75rem; opacity: 0.8;">' + 
                                        result.error.traceback + '</pre>';
                            }
                        } else {
                            // Show return value (the evaluated expression) - this is the primary result
                            if (result.result !== undefined && result.result !== null && result.result !== 'None') {
                                // Always use Python highlighting for results (zef expressions are Python-like)
                                html += '<pre style="margin: 0; background: transparent;"><code>' + 
                                        highlightCode(String(result.result), 'python') + '</code></pre>';
                            }
                            // Show stdout if any (as secondary, dimmer output)
                            if (result.stdout && result.stdout.trim()) {
                                if (html) {
                                    html += '<div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--border-color);">';
                                    html += '<div style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-dim); margin-bottom: 4px;">stdout</div>';
                                }
                                html += '<div style="color: var(--text-dim); white-space: pre-wrap; font-family: monospace; opacity: 0.8;">' + 
                                        escapeHtml(result.stdout) + '</div>';
                                if (result.result) {
                                    html += '</div>';
                                }
                            }
                            // If nothing to show
                            if (!html) {
                                html = '<span style="color: var(--text-dim); font-style: italic;">Executed successfully (no result)</span>';
                            }
                        }
                        
                        resultValue.innerHTML = html;
                    }
                    
                    // Update side effects tab if we have side effects
                    var sideEffectsValue = document.getElementById('side-effects-value-' + blockId);
                    if (sideEffectsValue && result.side_effects && result.side_effects.length > 0) {
                        var effectsText = '[\\n';
                        result.side_effects.forEach(function(effect, idx) {
                            var escapedContent = effect.content.replace(/\\n/g, '\\\\n');
                            effectsText += '    ET.UnmanagedEffect(what=\\'' + effect.what + '\\', content=\\'' + escapedContent + '\\')';
                            if (idx < result.side_effects.length - 1) {
                                effectsText += ',';
                            }
                            effectsText += '\\n';
                        });
                        effectsText += ']';
                        var effectsHtml = '<pre style="margin: 0; background: transparent;"><code>' + highlightCode(effectsText, 'python') + '</code></pre>';
                        sideEffectsValue.innerHTML = effectsHtml;
                    } else if (sideEffectsValue) {
                        sideEffectsValue.innerHTML = '<span style="color: var(--text-dim); font-style: italic;">No side effects recorded.</span>';
                    }
                    
                    // Switch to result tab
                    var container = document.querySelector('[data-block-id="' + blockId + '"]');
                    if (container) {
                        container.querySelectorAll('.code-block-tab').forEach(function(t) {
                            t.classList.remove('active');
                            if (t.getAttribute('data-tab') === 'result') {
                                t.classList.add('active');
                            }
                        });
                        container.querySelectorAll('.code-block-content').forEach(function(c) {
                            c.classList.remove('active');
                        });
                        var resultTab = document.getElementById('content-' + blockId + '-result');
                        if (resultTab) {
                            resultTab.classList.add('active');
                        }
                    }
                }
                
                // Handle Svelte compilation results
                if (message.type === 'svelteResult') {
                    var blockId = message.blockId;
                    var result = message.result;
                    
                    // Reset compile button
                    var compileBtn = document.getElementById('compile-btn-' + blockId);
                    if (compileBtn) {
                        compileBtn.classList.remove('running');
                        compileBtn.innerHTML = '▶ Compile';
                    }
                    
                    // Update compile time display
                    var compileTimeSpan = document.querySelector('.compile-time[data-block-id="' + blockId + '"]');
                    if (compileTimeSpan) {
                        if (result.success) {
                            compileTimeSpan.textContent = result.compileTime + 'ms';
                            compileTimeSpan.style.color = '#98c379'; // Green
                        } else {
                            compileTimeSpan.textContent = 'error';
                            compileTimeSpan.style.color = '#e06c75'; // Red
                        }
                    }
                    
                    // Update the rendered content - replace placeholder with iframe if needed
                    var renderedContent = document.querySelector('.svelte-container[data-block-id="' + blockId + '"] .svelte-rendered');
                    if (renderedContent) {
                        // Check if there's a placeholder to replace
                        var placeholder = renderedContent.querySelector('.svelte-placeholder');
                        var iframe = renderedContent.querySelector('.svelte-preview-frame');
                        
                        if (placeholder && !iframe) {
                            // Create iframe to replace placeholder
                            iframe = document.createElement('iframe');
                            iframe.className = 'svelte-preview-frame';
                            iframe.setAttribute('sandbox', 'allow-scripts');
                            iframe.setAttribute('data-block-id', blockId);
                            renderedContent.removeChild(placeholder);
                            renderedContent.appendChild(iframe);
                        }
                        
                        if (iframe) {
                            if (result.success && result.html) {
                                iframe.srcdoc = result.html;
                            } else {
                                var errorHtml = '<!DOCTYPE html><html><head><style>body { margin: 0; padding: 16px; font-family: monospace; background: #1e1e1e; color: #e06c75; }</style></head><body><pre>' + escapeHtml(result.error || 'Unknown error') + '</pre></body></html>';
                                iframe.srcdoc = errorHtml;
                            }
                        }
                    }
                    
                    // Switch to rendered tab
                    var container = document.querySelector('.svelte-container[data-block-id="' + blockId + '"]');
                    if (container) {
                        container.querySelectorAll('.code-block-tab').forEach(function(t) {
                            t.classList.remove('active');
                            if (t.getAttribute('data-tab') === 'rendered') {
                                t.classList.add('active');
                            }
                        });
                        container.querySelectorAll('.code-block-content').forEach(function(c) {
                            c.classList.remove('active');
                        });
                        var renderedTab = container.querySelector('.svelte-rendered');
                        if (renderedTab) {
                            renderedTab.classList.add('active');
                        }
                    }
                }
                
                if (message.type === 'scrollToLine') {
                    // Find element with closest data-line attribute
                    var targetLine = message.line;
                    var elements = document.querySelectorAll('[data-line]');
                    var closest = null;
                    var closestDiff = Infinity;
                    elements.forEach(function(el) {
                        var line = parseInt(el.getAttribute('data-line'));
                        var diff = Math.abs(line - targetLine);
                        if (diff < closestDiff) {
                            closestDiff = diff;
                            closest = el;
                        }
                    });
                    if (closest) {
                        closest.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            });
        })();
    </script>
    ${mermaidUri ? `<script src="${mermaidUri}"></script>
    <script>
        // Initialize and render mermaid diagrams
        if (typeof mermaid !== 'undefined') {
            mermaid.initialize({ 
                theme: 'dark',
                startOnLoad: false,
                securityLevel: 'loose'
            });
            // Render all mermaid diagrams (already created by the tab handling code)
            mermaid.run({ nodes: document.querySelectorAll('.mermaid') });
        }
    </script>` : ''}
</body>
</html>`;
}
