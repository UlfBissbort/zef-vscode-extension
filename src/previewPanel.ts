import * as vscode from 'vscode';
import * as path from 'path';
import { marked } from 'marked';
import { CellResult } from './kernelManager';
import { isZefDocument, isZefPythonFile, isZefRustFile } from './zefUtils';
import { stripFrontmatter, getDocumentSettings, updateDocumentSetting, ZefSettings } from './frontmatterParser';
import { ExcalidrawEditorPanel, generateExcalidrawUid } from './excalidrawEditorPanel';

// Map of document URI string to its panel
const panels: Map<string, vscode.WebviewPanel> = new Map();
let onRunCodeCallback: ((code: string, blockId: number, language: string, documentUri: vscode.Uri) => void) | undefined;
let extensionPath: string | undefined;

export function setOnRunCode(callback: (code: string, blockId: number, language: string, documentUri: vscode.Uri) => void) {
    onRunCodeCallback = callback;
}

/**
 * Converts Python source code to markdown for preview rendering.
 * 
 * Segments marked with """md ... """ are extracted as markdown.
 * All other code is wrapped in ```python fenced blocks.
 * 
 * @param pythonSource The Python file content
 * @returns Markdown string suitable for renderMarkdown()
 */
function convertPythonToMarkdown(pythonSource: string): string {
    const lines = pythonSource.split('\n');
    const segments: Array<{type: 'code' | 'markdown', content: string[]}> = [];
    
    let currentType: 'code' | 'markdown' = 'code';
    let currentContent: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (currentType === 'code') {
            // Check for """md or '''md at start of line (allowing leading whitespace)
            const trimmed = line.trimStart();
            if (trimmed.startsWith('"""md') || trimmed.startsWith("'''md")) {
                // Save current code segment if non-empty
                if (currentContent.some(l => l.trim())) {
                    segments.push({ type: 'code', content: currentContent });
                }
                currentContent = [];
                currentType = 'markdown';
                
                // If there's content after """md on same line, include it
                const quoteType = trimmed.startsWith('"""md') ? '"""md' : "'''md";
                const afterMarker = trimmed.substring(quoteType.length);
                if (afterMarker.trim()) {
                    currentContent.push(afterMarker);
                }
            } else {
                currentContent.push(line);
            }
        } else {
            // In markdown mode - look for closing """ or '''
            const closingIndex = line.indexOf('"""') !== -1 ? line.indexOf('"""') : line.indexOf("'''");
            if (closingIndex !== -1) {
                // Include content before the closing quotes
                const beforeClosing = line.substring(0, closingIndex);
                if (beforeClosing.trim()) {
                    currentContent.push(beforeClosing);
                }
                
                // Save markdown segment
                if (currentContent.length > 0) {
                    segments.push({ type: 'markdown', content: currentContent });
                }
                currentContent = [];
                currentType = 'code';
                
                // If there's code after """ on same line, include it
                const quoteType = line.indexOf('"""') !== -1 ? '"""' : "'''";
                const afterClosing = line.substring(closingIndex + 3);
                if (afterClosing.trim()) {
                    currentContent.push(afterClosing);
                }
            } else {
                currentContent.push(line);
            }
        }
    }
    
    // Don't forget the last segment
    if (currentContent.some(l => l.trim())) {
        segments.push({ type: currentType, content: currentContent });
    }
    
    // Convert segments to markdown
    let result = '';
    for (const segment of segments) {
        if (segment.type === 'markdown') {
            // Dedent to remove common leading whitespace (handles indented """md blocks)
            result += dedentText(segment.content.join('\n')) + '\n\n';
        } else {
            result += '```python\n' + segment.content.join('\n') + '\n```\n\n';
        }
    }
    
    return result;
}

/**
 * Converts Rust source code to markdown for preview rendering.
 * 
 * Segments marked with /*md ... * / are extracted as markdown.
 * All other code is wrapped in ```rust fenced blocks.
 * 
 * @param rustSource The Rust file content
 * @returns Markdown string suitable for renderMarkdown()
 */
function convertRustToMarkdown(rustSource: string): string {
    const segments: Array<{type: 'code' | 'markdown', content: string}> = [];
    
    let remaining = rustSource;
    let lastIndex = 0;
    
    // Match /*md ... */ blocks - don't consume whitespace after /*md so dedent works correctly
    const mdBlockRegex = /\/\*md([\s\S]*?)\*\//g;
    let match;
    
    while ((match = mdBlockRegex.exec(rustSource)) !== null) {
        // Add code before this match
        const codeBefore = rustSource.substring(lastIndex, match.index);
        if (codeBefore.trim()) {
            segments.push({ type: 'code', content: codeBefore });
        }
        
        // Add the markdown content (captured group 1)
        // Dedent to remove common leading whitespace (handles indented /*md blocks)
        const mdContent = dedentText(match[1]);
        if (mdContent.trim()) {
            segments.push({ type: 'markdown', content: mdContent.trim() });
        }
        
        lastIndex = match.index + match[0].length;
    }
    
    // Add remaining code after last match
    const codeAfter = rustSource.substring(lastIndex);
    if (codeAfter.trim()) {
        segments.push({ type: 'code', content: codeAfter });
    }
    
    // Convert segments to markdown
    let result = '';
    for (const segment of segments) {
        if (segment.type === 'markdown') {
            result += segment.content + '\n\n';
        } else {
            result += '```rust\n' + segment.content.trim() + '\n```\n\n';
        }
    }
    
    return result;
}

/**
 * Removes common leading whitespace from all lines of text.
 * Useful for dedenting markdown inside indented code blocks.
 */
function dedentText(text: string): string {
    const lines = text.split('\n');
    
    // Find minimum indentation from ALL non-empty lines
    let minIndent = Infinity;
    
    for (const line of lines) {
        if (line.trim().length > 0) {
            const indent = line.match(/^(\s*)/)?.[1].length || 0;
            minIndent = Math.min(minIndent, indent);
        }
    }
    
    if (minIndent === Infinity || minIndent === 0) {
        return text;
    }
    
    // Remove the common indentation from all lines
    return lines.map(line => {
        if (line.length >= minIndent) {
            return line.substring(minIndent);
        }
        return line;
    }).join('\n');
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

/**
 * Update an Excalidraw code block in the document by its UID.
 * @param document The document to update
 * @param uid The unique ID of the excalidraw block (stored in the JSON data)
 * @param newContent The new JSON content
 * @returns true if the block was found and updated
 */
async function updateExcalidrawBlockByUid(document: vscode.TextDocument, uid: string, newContent: string): Promise<boolean> {
    const text = document.getText();
    
    // Find all excalidraw code blocks
    const excalidrawBlockRegex = /```excalidraw[^\n]*\n([\s\S]*?)```/gi;
    let match;
    
    while ((match = excalidrawBlockRegex.exec(text)) !== null) {
        const blockContent = match[1];
        
        // Try to parse the JSON to check for matching UID
        try {
            const data = JSON.parse(blockContent);
            if (data.uid === uid) {
                // Found the block with matching UID
                const blockStart = match.index;
                const blockEnd = match.index + match[0].length;
                
                // Extract the attributes from the original code fence (like width=wide)
                const firstLine = match[0].split('\n')[0];
                const attributes = firstLine.substring(3); // Remove the leading ```
                const newBlock = `\`\`\`${attributes}\n${newContent}\n\`\`\``;
                
                const edit = new vscode.WorkspaceEdit();
                const startPos = document.positionAt(blockStart);
                const endPos = document.positionAt(blockEnd);
                edit.replace(document.uri, new vscode.Range(startPos, endPos), newBlock);
                await vscode.workspace.applyEdit(edit);
                return true;
            }
        } catch (e) {
            // Invalid JSON, skip this block
            continue;
        }
    }
    
    return false;
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
    
    if (!editor || !isZefDocument(editor.document)) {
        const config = vscode.workspace.getConfiguration('zef');
        const treatAllMd = config.get<boolean>('treatAllMarkdownAsZef', false);
        if (!treatAllMd && editor?.document.fileName.endsWith('.md')) {
            vscode.window.showWarningMessage('Zef: Enable "Treat All Markdown as Zef" in settings to preview .md files');
        } else {
            vscode.window.showWarningMessage('Zef: Open a .zef.md file first');
        }
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
            // Pass the document URI so the callback knows which document initiated the run
            onRunCodeCallback(message.code, message.blockId, message.language || 'python', docUri);
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
        } else if (message.type === 'updateSetting') {
            // Update a setting in the document's frontmatter
            const document = vscode.workspace.textDocuments.find(d => d.uri.toString() === docKey);
            if (document) {
                const currentText = document.getText();
                const newText = updateDocumentSetting(currentText, message.setting, message.value);
                
                if (newText !== currentText) {
                    const edit = new vscode.WorkspaceEdit();
                    const fullRange = new vscode.Range(
                        document.positionAt(0),
                        document.positionAt(currentText.length)
                    );
                    edit.replace(document.uri, fullRange, newText);
                    await vscode.workspace.applyEdit(edit);
                }
            }
        } else if (message.type === 'exportMermaidSvg') {
            // Export mermaid diagram as SVG file
            const svgContent = message.svgContent;
            if (svgContent) {
                // Get the document folder for default save location
                const docFolder = path.dirname(docUri.fsPath);
                const defaultUri = vscode.Uri.file(path.join(docFolder, 'mermaid-diagram.svg'));
                
                const saveUri = await vscode.window.showSaveDialog({
                    defaultUri: defaultUri,
                    filters: { 'SVG Image': ['svg'] },
                    title: 'Export Mermaid Diagram as SVG'
                });
                
                if (saveUri) {
                    await vscode.workspace.fs.writeFile(saveUri, Buffer.from(svgContent, 'utf8'));
                    vscode.window.showInformationMessage(`Saved diagram to ${path.basename(saveUri.fsPath)}`);
                }
            }
        } else if (message.type === 'openSveltePanel') {
            // Cache HTML from the webview if provided (for persisted rendered output)
            if (message.html) {
                svelteHtmlCache.set(svelteBlockKey(docUri, message.blockId), message.html);
            }
            openSvelteFullPanel(docUri, message.blockId);
        } else if (message.type === 'openExcalidrawEditor') {
            // Open the Excalidraw editor panel
            if (extensionPath) {
                const extensionUri = vscode.Uri.file(extensionPath);
                let excalidrawData = message.data as { uid?: string; [key: string]: unknown };
                
                // Ensure the data has a unique ID
                let uid = excalidrawData.uid;
                if (!uid) {
                    // Generate a new UID
                    uid = generateExcalidrawUid();
                    excalidrawData = { ...excalidrawData, uid };
                    
                    // Update the document with the new UID before opening editor
                    const document = vscode.workspace.textDocuments.find(d => d.uri.toString() === docKey);
                    if (document && message.blockId) {
                        // We need to update by index first since it doesn't have a UID yet
                        const idMatch = message.blockId.match(/^excalidraw-(\d+)$/);
                        if (idMatch) {
                            const targetIndex = parseInt(idMatch[1], 10);
                            const text = document.getText();
                            const excalidrawBlockRegex = /```excalidraw[^\n]*\n([\s\S]*?)```/gi;
                            let match;
                            let blockIndex = 0;
                            
                            while ((match = excalidrawBlockRegex.exec(text)) !== null) {
                                if (blockIndex === targetIndex) {
                                    const blockStart = match.index;
                                    const blockEnd = match.index + match[0].length;
                                    const firstLine = match[0].split('\n')[0];
                                    const attributes = firstLine.substring(3);
                                    const newJson = JSON.stringify(excalidrawData, null, 2);
                                    const newBlock = `\`\`\`${attributes}\n${newJson}\n\`\`\``;
                                    
                                    const edit = new vscode.WorkspaceEdit();
                                    const startPos = document.positionAt(blockStart);
                                    const endPos = document.positionAt(blockEnd);
                                    edit.replace(document.uri, new vscode.Range(startPos, endPos), newBlock);
                                    await vscode.workspace.applyEdit(edit);
                                    break;
                                }
                                blockIndex++;
                            }
                        }
                    }
                }
                
                // Open the editor panel with the UID
                ExcalidrawEditorPanel.open(
                    extensionUri,
                    excalidrawData,
                    uid,
                    docUri,
                    async (savedUid: string, updatedData: object) => {
                        // Update the excalidraw code block in the document by UID
                        const document = vscode.workspace.textDocuments.find(d => d.uri.toString() === docKey);
                        if (document) {
                            const newJson = JSON.stringify(updatedData, null, 2);
                            const updated = await updateExcalidrawBlockByUid(document, savedUid, newJson);
                            if (updated) {
                                // Manually refresh the preview
                                const updatedDoc = vscode.workspace.textDocuments.find(d => d.uri.toString() === docKey);
                                if (updatedDoc) {
                                    updatePreview(updatedDoc);
                                }
                            }
                        }
                    }
                );
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

    let text = document.getText();
    
    // For Python files, convert to markdown representation first
    const isPythonFile = isZefPythonFile(document);
    const isRustFile = isZefRustFile(document);
    if (isPythonFile) {
        text = convertPythonToMarkdown(text);
    } else if (isRustFile) {
        text = convertRustToMarkdown(text);
    }
    
    // Extract existing Result, Side Effects, and rendered-html blocks before removing them
    const existingResults: { [blockId: number]: string } = {};
    const existingSideEffects: { [blockId: number]: string } = {};
    const existingRenderedHtml: { [blockId: number]: string } = {};
    let codeBlockIndex = 0;
    
    // Find all executable code blocks and their associated output blocks
    // This includes Python, Rust, JS/TS (with Result/Side Effects) and Svelte (with rendered-html)
    // Case-insensitive to support Python, PYTHON, Svelte, SVELTE, etc.
    const codeBlockRegex = /```(?:python|rust|javascript|js|typescript|ts|svelte)\s*\n[\s\S]*?```(\s*\n````(?:Result|Output)\s*\n([\s\S]*?)````)?(\s*\n````Side Effects\s*\n([\s\S]*?)````)?(\s*\n````rendered-html\s*\n([\s\S]*?)````)?/gi;
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
    // Also strip frontmatter block if present (not needed for Python/Rust files already converted)
    const cleanText = (isPythonFile || isRustFile) ? text : stripFrontmatter(text)
        .replace(/\n````(?:Result|Output)\s*\n[\s\S]*?````/g, '')
        .replace(/\n````Side Effects\s*\n[\s\S]*?````/g, '')
        .replace(/\n````rendered-html\s*\n[\s\S]*?````/g, '');
    
    let html = renderMarkdown(cleanText);
    
    // Convert relative image paths to webview URIs
    const docDir = path.dirname(document.uri.fsPath);
    html = convertImagePaths(html, docDir, panel.webview);
    
    // Get mermaid script URI if extension path is available
    let mermaidUri = '';
    let katexCssUri = '';
    let katexJsUri = '';
    let katexAutoRenderUri = '';
    let katexFontsUri = '';
    if (extensionPath) {
        const mermaidPath = vscode.Uri.file(path.join(extensionPath, 'assets', 'mermaid.min.js'));
        mermaidUri = panel.webview.asWebviewUri(mermaidPath).toString();
        
        // KaTeX assets for LaTeX math rendering
        const katexCssPath = vscode.Uri.file(path.join(extensionPath, 'assets', 'katex.min.css'));
        katexCssUri = panel.webview.asWebviewUri(katexCssPath).toString();
        const katexJsPath = vscode.Uri.file(path.join(extensionPath, 'assets', 'katex.min.js'));
        katexJsUri = panel.webview.asWebviewUri(katexJsPath).toString();
        const katexAutoRenderPath = vscode.Uri.file(path.join(extensionPath, 'assets', 'katex-auto-render.min.js'));
        katexAutoRenderUri = panel.webview.asWebviewUri(katexAutoRenderPath).toString();
        // Fonts directory URI for CSS font-face resolution
        const katexFontsPath = vscode.Uri.file(path.join(extensionPath, 'assets', 'fonts'));
        katexFontsUri = panel.webview.asWebviewUri(katexFontsPath).toString();
    }
    
    // Get document settings from frontmatter
    const documentSettings = getDocumentSettings(text);
    
    panel.webview.html = getWebviewContent(html, existingResults, existingSideEffects, mermaidUri, existingRenderedHtml, documentSettings, katexCssUri, katexJsUri, katexAutoRenderUri, katexFontsUri);
}

/**
 * Refresh all open preview panels (e.g., when settings change)
 */
export function refreshAllPanels(): void {
    for (const [docUri, _panel] of panels) {
        const document = vscode.workspace.textDocuments.find(d => d.uri.toString() === docUri);
        if (document) {
            updatePreview(document);
        }
    }
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

export interface SvelteErrorDetails {
    line?: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
    frame?: string;
    code?: string;
}

export interface SvelteResult {
    success: boolean;
    html?: string;
    error?: string;
    errorDetails?: SvelteErrorDetails;
    compileTime: string;
}

// Cache last compiled HTML per document+block for opening in full panel
const svelteHtmlCache: Map<string, string> = new Map();

function svelteBlockKey(documentUri: vscode.Uri | undefined, blockId: number): string {
    return `${documentUri?.toString() || 'default'}:${blockId}`;
}

export function sendSvelteResult(blockId: number, result: SvelteResult, documentUri?: vscode.Uri) {
    // Cache successful HTML for full panel viewing
    if (result.success && result.html) {
        svelteHtmlCache.set(svelteBlockKey(documentUri, blockId), result.html);
        // Also update any open full panel for this block
        updateSvelteFullPanel(documentUri, blockId, result.html);
    }

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

// Svelte full panels
const svelteFullPanels: Map<string, vscode.WebviewPanel> = new Map();

function openSvelteFullPanel(documentUri: vscode.Uri | undefined, blockId: number) {
    const key = svelteBlockKey(documentUri, blockId);

    // If panel already open, reveal it
    const existing = svelteFullPanels.get(key);
    if (existing) {
        existing.reveal(vscode.ViewColumn.Two);
        return;
    }

    const cachedHtml = svelteHtmlCache.get(key);
    if (!cachedHtml) {
        vscode.window.showWarningMessage('Compile the Svelte component first before opening in a full panel.');
        return;
    }

    const panel = vscode.window.createWebviewPanel(
        'svelteFullPanel',
        `Svelte Component #${blockId}`,
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );

    panel.webview.html = cachedHtml;
    svelteFullPanels.set(key, panel);

    panel.onDidDispose(() => {
        svelteFullPanels.delete(key);
    });
}

function updateSvelteFullPanel(documentUri: vscode.Uri | undefined, blockId: number, html: string) {
    const key = svelteBlockKey(documentUri, blockId);
    const panel = svelteFullPanels.get(key);
    if (panel) {
        panel.webview.html = html;
    }
}

/**
 * Preserve multiple blank lines in markdown for Obsidian-style rendering.
 * Standard markdown collapses 2+ blank lines into a single paragraph break.
 * This function converts extra blank lines to <div class="blank-line"> elements
 * that can be styled to show visual spacing.
 * 
 * Code blocks (fenced with 3+ backticks) are preserved unchanged.
 */
function preserveBlankLines(markdown: string): string {
    const lines = markdown.split('\n');
    const result: string[] = [];
    let inCodeBlock = false;
    let codeBlockFence = '';
    let blankLineCount = 0;
    let justExitedCodeBlock = false;  // Track if we just closed a code block
    
    for (const line of lines) {
        // Check for code block fence (3+ backticks)
        const fenceMatch = line.match(/^(`{3,})/);
        
        if (fenceMatch) {
            if (!inCodeBlock) {
                // Before entering code block, output any accumulated blank lines
                if (blankLineCount > 0) {
                    result.push('');
                    // If we just exited a code block, add visible spacing for EACH blank line
                    // Otherwise, only add extra spacing for 2+ blank lines
                    const startFrom = justExitedCodeBlock ? 0 : 1;
                    for (let i = startFrom; i < blankLineCount; i++) {
                        result.push('<div class="blank-line"></div>');
                        result.push('');
                    }
                    blankLineCount = 0;
                }
                // Entering code block - push the opening fence and continue
                inCodeBlock = true;
                codeBlockFence = fenceMatch[1];
                justExitedCodeBlock = false;
                result.push(line);
                continue;  // Skip rest of processing for this line
            } else if (line.startsWith(codeBlockFence) && line.slice(codeBlockFence.length).trim() === '') {
                // Exiting code block - push the closing fence and continue
                inCodeBlock = false;
                codeBlockFence = '';
                justExitedCodeBlock = true;  // Mark that we just exited
                result.push(line);
                continue;  // Skip rest of processing for this line
            }
        }
        
        if (inCodeBlock) {
            // Inside code block, preserve line as-is
            result.push(line);
        } else if (line.trim() === '') {
            // Blank line outside code block
            blankLineCount++;
        } else {
            // Non-blank line outside code block (and not a fence)
            if (blankLineCount > 0) {
                // First blank line = standard paragraph break
                result.push('');
                // If we just exited a code block, add visible spacing for EACH blank line
                // Otherwise, only add extra spacing for 2+ blank lines
                const startFrom = justExitedCodeBlock ? 0 : 1;
                for (let i = startFrom; i < blankLineCount; i++) {
                    result.push('<div class="blank-line"></div>');
                    result.push('');
                }
            }
            result.push(line);
            blankLineCount = 0;
            justExitedCodeBlock = false;  // Reset since we processed content
        }
    }
    
    // Handle trailing blank lines at end of document
    if (blankLineCount > 0) {
        result.push('');
        for (let i = 1; i < blankLineCount; i++) {
            result.push('<div class="blank-line"></div>');
            result.push('');
        }
    }
    
    return result.join('\n');
}

function renderMarkdown(markdown: string): string {
    const escapeHtml = (value: string) => value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const renderer = new marked.Renderer();
    renderer.code = (code, infostring) => {
        const info = (infostring || '').trim();
        const infoParts = info.split(/\s+/);
        const lang = infoParts[0] || '';
        const meta = infoParts.slice(1).join(' ');
        const widthMatch = meta.match(/\bwidth\s*=\s*([^\s]+)/i);
        const widthValue = widthMatch?.[1];
        const widthAttr = widthValue ? ` data-zef-width="${escapeHtml(widthValue)}"` : '';
        const langClass = lang ? ` class="language-${escapeHtml(lang)}"` : '';
        return `<pre${widthAttr}><code${langClass}>${escapeHtml(code)}</code></pre>\n`;
    };

    marked.setOptions({
        gfm: true,
        breaks: true,
        renderer
    });

    // Protect math blocks from marked's transformations:
    // 1. `breaks: true` converts newlines to <br>
    // 2. Marked converts \\ to \ (escaping backslashes)
    // Both break LaTeX rendering, especially for aligned environments
    const mathNewlinePlaceholder = '\u0000MATH_NEWLINE\u0000';
    const mathDoubleBackslashPlaceholder = '\u0000MATH_DBLBACKSLASH\u0000';
    let protectedMarkdown = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
        // Replace \\ with placeholder first (before it gets converted to \)
        let protected_ = content.replace(/\\\\/g, mathDoubleBackslashPlaceholder);
        // Replace newlines with placeholder
        protected_ = protected_.replace(/\n/g, mathNewlinePlaceholder);
        return '$$' + protected_ + '$$';
    });

    // Preserve extra blank lines before parsing
    const processedMarkdown = preserveBlankLines(protectedMarkdown);
    
    let html = marked.parse(processedMarkdown) as string;
    
    // Restore double backslashes and newlines in math blocks
    html = html.replace(new RegExp(mathDoubleBackslashPlaceholder, 'g'), '\\\\');
    html = html.replace(new RegExp(mathNewlinePlaceholder, 'g'), '\n');
    
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

function getWebviewContent(renderedHtml: string, existingOutputs: { [blockId: number]: string } = {}, existingSideEffects: { [blockId: number]: string } = {}, mermaidUri: string = '', existingRenderedHtml: { [blockId: number]: string } = {}, documentSettings: ZefSettings = {}, katexCssUri: string = '', katexJsUri: string = '', katexAutoRenderUri: string = '', katexFontsUri: string = ''): string {
    // Get the view width setting
    const widthPercent = vscode.workspace.getConfiguration('zef').get('viewWidthPercent', 100) as number;
    const maxWidth = Math.round(680 * widthPercent / 100);
    
    // Serialize existing outputs, side effects, and rendered HTML as JSON for the webview
    // Escape </script> to prevent premature script tag termination in HTML
    const escapeForScript = (json: string) => json.replace(/<\/script>/gi, '<\\/script>');
    const outputsJson = escapeForScript(JSON.stringify(existingOutputs));
    const sideEffectsJson = escapeForScript(JSON.stringify(existingSideEffects));
    const renderedHtmlJson = escapeForScript(JSON.stringify(existingRenderedHtml));
    const documentSettingsJson = escapeForScript(JSON.stringify(documentSettings));
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zef Preview</title>
    ${katexCssUri ? `
    <!-- KaTeX CSS for LaTeX math rendering -->
    <link rel="stylesheet" href="${katexCssUri}">
    <style>
        /* Override KaTeX font paths to use webview URIs */
        @font-face { font-family: KaTeX_AMS; src: url('${katexFontsUri}/KaTeX_AMS-Regular.woff2') format('woff2'); font-weight: normal; font-style: normal; }
        @font-face { font-family: KaTeX_Caligraphic; src: url('${katexFontsUri}/KaTeX_Caligraphic-Bold.woff2') format('woff2'); font-weight: bold; font-style: normal; }
        @font-face { font-family: KaTeX_Caligraphic; src: url('${katexFontsUri}/KaTeX_Caligraphic-Regular.woff2') format('woff2'); font-weight: normal; font-style: normal; }
        @font-face { font-family: KaTeX_Fraktur; src: url('${katexFontsUri}/KaTeX_Fraktur-Bold.woff2') format('woff2'); font-weight: bold; font-style: normal; }
        @font-face { font-family: KaTeX_Fraktur; src: url('${katexFontsUri}/KaTeX_Fraktur-Regular.woff2') format('woff2'); font-weight: normal; font-style: normal; }
        @font-face { font-family: KaTeX_Main; src: url('${katexFontsUri}/KaTeX_Main-Bold.woff2') format('woff2'); font-weight: bold; font-style: normal; }
        @font-face { font-family: KaTeX_Main; src: url('${katexFontsUri}/KaTeX_Main-Italic.woff2') format('woff2'); font-weight: normal; font-style: italic; }
        @font-face { font-family: KaTeX_Main; src: url('${katexFontsUri}/KaTeX_Main-Regular.woff2') format('woff2'); font-weight: normal; font-style: normal; }
        @font-face { font-family: KaTeX_Math; src: url('${katexFontsUri}/KaTeX_Math-BoldItalic.woff2') format('woff2'); font-weight: bold; font-style: italic; }
        @font-face { font-family: KaTeX_Math; src: url('${katexFontsUri}/KaTeX_Math-Italic.woff2') format('woff2'); font-weight: normal; font-style: italic; }
        @font-face { font-family: KaTeX_SansSerif; src: url('${katexFontsUri}/KaTeX_SansSerif-Bold.woff2') format('woff2'); font-weight: bold; font-style: normal; }
        @font-face { font-family: KaTeX_SansSerif; src: url('${katexFontsUri}/KaTeX_SansSerif-Italic.woff2') format('woff2'); font-weight: normal; font-style: italic; }
        @font-face { font-family: KaTeX_SansSerif; src: url('${katexFontsUri}/KaTeX_SansSerif-Regular.woff2') format('woff2'); font-weight: normal; font-style: normal; }
        @font-face { font-family: KaTeX_Script; src: url('${katexFontsUri}/KaTeX_Script-Regular.woff2') format('woff2'); font-weight: normal; font-style: normal; }
        @font-face { font-family: KaTeX_Size1; src: url('${katexFontsUri}/KaTeX_Size1-Regular.woff2') format('woff2'); font-weight: normal; font-style: normal; }
        @font-face { font-family: KaTeX_Size2; src: url('${katexFontsUri}/KaTeX_Size2-Regular.woff2') format('woff2'); font-weight: normal; font-style: normal; }
        @font-face { font-family: KaTeX_Size3; src: url('${katexFontsUri}/KaTeX_Size3-Regular.woff2') format('woff2'); font-weight: normal; font-style: normal; }
        @font-face { font-family: KaTeX_Size4; src: url('${katexFontsUri}/KaTeX_Size4-Regular.woff2') format('woff2'); font-weight: normal; font-style: normal; }
        @font-face { font-family: KaTeX_Typewriter; src: url('${katexFontsUri}/KaTeX_Typewriter-Regular.woff2') format('woff2'); font-weight: normal; font-style: normal; }
    </style>
    ` : ''}
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

        /* Preserve extra blank lines (Obsidian-style) */
        .blank-line {
            height: 1.5em;
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

        /* Excalidraw diagrams */
        .excalidraw-container {
            margin: 1.5rem 0;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            overflow: hidden;
        }

        .excalidraw-rendered {
            padding: 1rem;
            background: #0b0b0b;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .excalidraw-rendered svg {
            max-width: 100%;
            height: auto;
        }

        .excalidraw-wide {
            width: min(100vw - 4rem, 1100px);
            margin-left: calc(50% - 50vw);
        }

        .excalidraw-full {
            width: calc(100vw - 4rem);
            margin-left: calc(50% - 50vw);
        }

        /* KaTeX math equations */
        .katex-display {
            margin: 1.5em 0;
            overflow-x: auto;
            overflow-y: hidden;
            text-align: center;
            padding: 0 5px;
        }
        
        .katex {
            font-size: 1.1em;
            color: var(--text-color);
        }
        
        .katex-display .katex {
            font-size: 1.21em;
        }
        
        .katex-display > .katex {
            overflow-x: unset;
            padding: 0.5em 0;
        }
        
        /* Scrollbar for long equations */
        .katex-display::-webkit-scrollbar {
            height: 4px;
            background: transparent;
        }
        
        .katex-display::-webkit-scrollbar-thumb {
            background-color: var(--border-color);
            border-radius: 2px;
        }

        /* Svelte preview */
        .svelte-container .code-block-lang {
            /* Don't push to the right for svelte, there's a compile button */
        }
        .svelte-preview-frame {
            width: 100%;
            height: 700px;
            border: none;
            background: #1e1e1e;
        }

        /* HTML preview */
        .html-preview-frame {
            width: 100%;
            height: 700px;
            border: none;
            background: #fff;
        }

        /* Draggable resize handle for preview iframes */
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
        
        /* For blocks without a Run button (like mermaid, json, zen, html), push lang indicator to right */
        .mermaid-container .code-block-lang {
            /* margin-left handled by spacer for mermaid */
        }
        
        /* Mermaid export button - elegant minimal style */
        .mermaid-export-btn {
            padding: 4px 10px;
            font-size: 0.7rem;
            letter-spacing: 0.05em;
            color: var(--text-dim);
            background: transparent;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            margin-left: auto;
            margin-right: 8px;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .mermaid-export-btn:hover {
            color: var(--text-muted);
            background: rgba(255, 255, 255, 0.05);
            border-color: var(--text-dim);
        }
        
        .mermaid-export-btn svg {
            width: 12px;
            height: 12px;
            stroke: currentColor;
            fill: none;
            stroke-width: 2;
        }
        
        .json-container .code-block-lang {
            margin-left: auto;
        }
        
        .zen-container .code-block-lang {
            margin-left: auto;
        }
        
        .html-container .code-block-lang {
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
            height: 1.5px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
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
        
        /* Modal styles for expanded HTML view */
        .html-modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .html-modal-overlay.active {
            display: flex;
        }
        
        .html-modal-content {
            width: 95%;
            height: 95%;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
        }
        
        .html-modal-close {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 36px;
            height: 36px;
            background: rgba(0, 0, 0, 0.7);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            transition: background 0.2s;
        }
        
        .html-modal-close:hover {
            background: rgba(0, 0, 0, 0.9);
        }
        
        .html-modal-close svg {
            width: 20px;
            height: 20px;
            stroke: #fff;
            stroke-width: 2;
        }
        
        .html-modal-iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        
        /* Expand button for HTML blocks */
        .html-expand-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 28px;
            height: 28px;
            background: rgba(0, 0, 0, 0.5);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.6;
            transition: opacity 0.2s, background 0.2s;
            z-index: 10;
        }
        
        .html-expand-btn:hover {
            opacity: 1;
            background: rgba(0, 0, 0, 0.7);
        }
        
        .html-expand-btn svg {
            width: 16px;
            height: 16px;
            stroke: #fff;
            stroke-width: 2;
            fill: none;
        }
        
        .html-rendered {
            position: relative;
        }
        
        /* Excalidraw expand button in tabs bar */
        .excalidraw-expand-btn {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            margin-left: auto;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .excalidraw-expand-btn:hover {
            color: rgba(255, 255, 255, 0.9);
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.2);
        }
        
        .excalidraw-expand-btn svg {
            width: 12px;
            height: 12px;
            stroke: currentColor;
            stroke-width: 2;
            fill: none;
        }
        
        /* Svelte expand button in tabs bar */
        .svelte-expand-btn {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .svelte-expand-btn:hover {
            color: rgba(255, 255, 255, 0.9);
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .svelte-expand-btn svg {
            width: 12px;
            height: 12px;
            stroke: currentColor;
            stroke-width: 2;
            fill: none;
        }

        /* Settings Drawer Styles */
        .drawer-trigger {
            position: fixed;
            top: 16px;
            right: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 8px;
            color: rgba(255, 255, 255, 0.4);
            cursor: pointer;
            transition: all 0.2s ease;
            z-index: 100;
        }
        
        .drawer-trigger:hover {
            background: rgba(255, 255, 255, 0.06);
            color: rgba(255, 255, 255, 0.7);
            border-color: rgba(255, 255, 255, 0.1);
        }
        
        .drawer-trigger svg {
            width: 18px;
            height: 18px;
        }
        
        .drawer-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
        }
        
        .drawer-overlay.active {
            display: block;
            animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .drawer-panel {
            position: fixed;
            top: 0;
            right: 0;
            width: 320px;
            height: 100%;
            background: linear-gradient(180deg, #0d0d12 0%, #08080c 100%);
            border-left: 1px solid rgba(255, 255, 255, 0.06);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            transform: translateX(100%);
            transition: transform 0.25s ease;
        }
        
        .drawer-panel.active {
            transform: translateX(0);
            animation: slideIn 0.25s ease;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        
        .drawer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .drawer-header h3 {
            margin: 0;
            font-size: 15px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.9);
        }
        
        .close-btn {
            width: 28px;
            height: 28px;
            background: rgba(255, 255, 255, 0.03);
            border: none;
            border-radius: 6px;
            color: rgba(255, 255, 255, 0.5);
            font-size: 18px;
            cursor: pointer;
        }
        
        .close-btn:hover {
            background: rgba(255, 255, 255, 0.08);
            color: rgba(255, 255, 255, 0.8);
        }
        
        .drawer-body {
            flex: 1;
            overflow-y: auto;
            padding: 16px 0;
        }
        
        .accordion-section {
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }
        
        .accordion-header {
            display: flex;
            justify-content: space-between;
            padding: 16px 24px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s ease;
        }
        
        .accordion-header:hover {
            background: rgba(255, 255, 255, 0.02);
        }
        
        .accordion-header.expanded {
            color: #8ab4f8;
        }
        
        .accordion-icon {
            color: rgba(255, 255, 255, 0.3);
        }
        
        .accordion-content {
            padding: 0 24px 20px;
            animation: slideDown 0.2s ease;
        }
        
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .subsection {
            margin-bottom: 16px;
        }
        
        .subsection-label {
            display: block;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.4);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        
        .field {
            margin-bottom: 12px;
        }
        
        .field label {
            display: block;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.4);
            margin-bottom: 6px;
        }
        
        .field input, .field select {
            width: 100%;
            padding: 10px 12px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            color: rgba(255, 255, 255, 0.9);
            font-size: 13px;
            box-sizing: border-box;
        }
        
        .field input:focus, .field select:focus {
            outline: none;
            border-color: rgba(138, 180, 248, 0.4);
        }
        
        .field input::placeholder {
            color: rgba(255, 255, 255, 0.3);
        }
        
        .checkbox-row {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 0;
            color: rgba(255, 255, 255, 0.6);
            font-size: 13px;
            cursor: pointer;
        }
        
        .checkbox-row input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: #8ab4f8;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <!-- Modal for expanded HTML view -->
    <div id="html-modal" class="html-modal-overlay">
        <div class="html-modal-content">
            <button class="html-modal-close" onclick="closeHtmlModal()">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <iframe id="html-modal-frame" class="html-modal-iframe" sandbox="allow-scripts"></iframe>
        </div>
    </div>
    
    <!-- Settings Trigger Button -->
    <button class="drawer-trigger" onclick="openSettingsDrawer()" title="Document Settings">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <circle cx="8" cy="6" r="2" fill="currentColor"/>
            <line x1="4" y1="12" x2="20" y2="12"/>
            <circle cx="16" cy="12" r="2" fill="currentColor"/>
            <line x1="4" y1="18" x2="20" y2="18"/>
            <circle cx="10" cy="18" r="2" fill="currentColor"/>
        </svg>
    </button>
    
    <!-- Settings Drawer Overlay -->
    <div id="drawer-overlay" class="drawer-overlay" onclick="closeSettingsDrawer()"></div>
    
    <!-- Settings Drawer Panel -->
    <div id="drawer-panel" class="drawer-panel">
        <div class="drawer-header">
            <h3>Document Settings</h3>
            <button class="close-btn" onclick="closeSettingsDrawer()">×</button>
        </div>
        
        <div class="drawer-body">
            <!-- General Section -->
            <div class="accordion-section">
                <div class="accordion-header expanded" id="general-header" onclick="toggleSection('general')">
                    <span>General</span>
                    <span class="accordion-icon" id="general-icon">−</span>
                </div>
                <div class="accordion-content" id="general-content">
                    <span class="subsection-label" style="opacity: 0.5; font-style: italic;">No settings yet</span>
                </div>
            </div>
            
            <!-- Languages Section -->
            <div class="accordion-section">
                <div class="accordion-header expanded" id="languages-header" onclick="toggleSection('languages')">
                    <span>Languages</span>
                    <span class="accordion-icon" id="languages-icon">−</span>
                </div>
                <div class="accordion-content" id="languages-content">
                    <!-- Svelte Subsection -->
                    <div class="subsection">
                        <span class="subsection-label">Svelte</span>
                        <label class="checkbox-row">
                            <input type="checkbox" id="svelte-persist" ${documentSettings.svelte?.persist_output ? 'checked' : ''} />
                            <span>Persist rendered output</span>
                        </label>
                    </div>
                    
                    <!-- Python Subsection -->
                    <div class="subsection">
                        <span class="subsection-label">Python</span>
                        <label class="checkbox-row">
                            <input type="checkbox" id="python-persist-output" ${documentSettings.python?.persist_output ? 'checked' : ''} />
                            <span>Persist Output</span>
                        </label>
                        <label class="checkbox-row">
                            <input type="checkbox" id="python-persist-side-effects" ${documentSettings.python?.persist_side_effects ? 'checked' : ''} />
                            <span>Persist logged Side Effects</span>
                        </label>
                    </div>
                    
                    <!-- Rust Subsection -->
                    <div class="subsection">
                        <span class="subsection-label">Rust</span>
                        <label class="checkbox-row">
                            <input type="checkbox" id="rust-persist-output" ${documentSettings.rust?.persist_output ? 'checked' : ''} />
                            <span>Persist Output</span>
                        </label>
                        <label class="checkbox-row">
                            <input type="checkbox" id="rust-persist-side-effects" ${documentSettings.rust?.persist_side_effects ? 'checked' : ''} />
                            <span>Persist logged Side Effects</span>
                        </label>
                    </div>
                    
                    <!-- TypeScript Subsection -->
                    <div class="subsection">
                        <span class="subsection-label">TypeScript</span>
                        <span style="font-size: 12px; color: rgba(255,255,255,0.3); font-style: italic;">No settings yet</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    ${renderedHtml}
    <script>
        // Acquire VS Code API for messaging
        const vscode = acquireVsCodeApi();
        
        // Document settings from frontmatter
        const documentSettings = ${documentSettingsJson};
        
        // Modal functions for HTML preview
        function openHtmlModal(htmlContent) {
            var modal = document.getElementById('html-modal');
            var iframe = document.getElementById('html-modal-frame');
            iframe.srcdoc = htmlContent;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        function closeHtmlModal() {
            var modal = document.getElementById('html-modal');
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Close modal on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeHtmlModal();
                closeSettingsDrawer();
            }
        });
        
        // Settings drawer functions
        function openSettingsDrawer() {
            document.getElementById('drawer-overlay').classList.add('active');
            document.getElementById('drawer-panel').classList.add('active');
        }
        
        function closeSettingsDrawer() {
            document.getElementById('drawer-overlay').classList.remove('active');
            document.getElementById('drawer-panel').classList.remove('active');
        }
        
        function toggleSection(section) {
            var content = document.getElementById(section + '-content');
            var icon = document.getElementById(section + '-icon');
            var header = document.getElementById(section + '-header');
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.textContent = '−';
                header.classList.add('expanded');
            } else {
                content.style.display = 'none';
                icon.textContent = '+';
                header.classList.remove('expanded');
            }
        }
        
        // Settings change handler with debounce
        var settingDebounceTimer = null;
        function updateSetting(settingPath, value) {
            clearTimeout(settingDebounceTimer);
            settingDebounceTimer = setTimeout(function() {
                vscode.postMessage({
                    type: 'updateSetting',
                    setting: settingPath,
                    value: value
                });
            }, 300);
        }
        
        // Initialize settings checkbox handlers
        document.getElementById('svelte-persist').addEventListener('change', function(e) {
            updateSetting('svelte.persist_output', e.target.checked);
        });
        
        document.getElementById('python-persist-output').addEventListener('change', function(e) {
            updateSetting('python.persist_output', e.target.checked);
        });
        
        document.getElementById('python-persist-side-effects').addEventListener('change', function(e) {
            updateSetting('python.persist_side_effects', e.target.checked);
        });
        
        document.getElementById('rust-persist-output').addEventListener('change', function(e) {
            updateSetting('rust.persist_output', e.target.checked);
        });
        
        document.getElementById('rust-persist-side-effects').addEventListener('change', function(e) {
            updateSetting('rust.persist_side_effects', e.target.checked);
        });
        
        // Close modal when clicking overlay background
        document.getElementById('html-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeHtmlModal();
            }
        });
        
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

        // Export mermaid diagram as SVG file
        function exportMermaidAsSvg(container) {
            try {
                // Find the SVG element inside the mermaid container
                var svgElement = container.querySelector('.mermaid svg');
                if (!svgElement) {
                    console.error('No SVG found in mermaid diagram');
                    return;
                }
                
                // Clone the SVG to avoid modifying the original
                var svgClone = svgElement.cloneNode(true);
                
                // Add XML namespace if not present
                if (!svgClone.getAttribute('xmlns')) {
                    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                }
                
                // Add Mermaid's internal styles for proper standalone rendering
                var styleElement = document.createElement('style');
                styleElement.textContent = \`
                    .node rect, .node circle, .node ellipse, .node polygon, .node path { fill: #1f2937; stroke: #4b5563; stroke-width: 1px; }
                    .node .label { color: #e5e7eb; }
                    .node text { fill: #e5e7eb; }
                    .edgeLabel { background-color: #1f2937; }
                    .edgeLabel text { fill: #e5e7eb; }
                    .edgePath .path { stroke: #6b7280; }
                    .arrowheadPath { fill: #6b7280; }
                    .cluster rect { fill: #111827; stroke: #374151; }
                    .cluster text { fill: #9ca3af; }
                    .label { color: #e5e7eb; }
                    text { fill: #e5e7eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                \`;
                svgClone.insertBefore(styleElement, svgClone.firstChild);
                
                // Serialize to string
                var serializer = new XMLSerializer();
                var svgString = serializer.serializeToString(svgClone);
                
                // Add XML declaration
                svgString = '<?xml version="1.0" encoding="UTF-8"?>\\n' + svgString;
                
                // Send to VS Code extension to save via file dialog
                vscode.postMessage({
                    type: 'exportMermaidSvg',
                    svgContent: svgString
                });
            } catch (err) {
                console.error('Failed to export SVG:', err);
            }
        }

        // Excalidraw rendering helpers
        function parseExcalidrawData(raw) {
            try {
                var data = JSON.parse(raw);
                if (!data) return null;
                // Standard Excalidraw file format
                if (data.type === 'excalidraw' && data.elements) {
                    return data;
                }
                // Allow raw scenes with elements/appState/files
                if (data.elements) {
                    return {
                        type: 'excalidraw',
                        version: data.version || 2,
                        source: data.source || 'zef',
                        elements: data.elements,
                        appState: data.appState || {},
                        files: data.files || {}
                    };
                }
                return null;
            } catch (err) {
                return null;
            }
        }

        function renderExcalidrawSvg(elements, bgColor) {
            // Calculate bounds of all elements
            var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            var visibleElements = elements.filter(function(el) { return !el.isDeleted; });
            
            if (visibleElements.length === 0) {
                // Empty scene placeholder
                return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="auto">' +
                    '<rect width="400" height="200" fill="' + (bgColor || '#121212') + '"/>' +
                    '<text x="200" y="90" text-anchor="middle" fill="#6c6c8a" font-family="system-ui, sans-serif" font-size="16">Empty Excalidraw Canvas</text>' +
                    '<text x="200" y="115" text-anchor="middle" fill="#4a4a5a" font-family="system-ui, sans-serif" font-size="12">Add elements to your drawing</text>' +
                    '</svg>';
            }

            visibleElements.forEach(function(el) {
                var x = el.x || 0;
                var y = el.y || 0;
                var w = el.width || 0;
                var h = el.height || 0;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x + w);
                maxY = Math.max(maxY, y + h);
                // Handle points for line/arrow/freedraw
                if (el.points && el.points.length) {
                    el.points.forEach(function(pt) {
                        minX = Math.min(minX, x + pt[0]);
                        minY = Math.min(minY, y + pt[1]);
                        maxX = Math.max(maxX, x + pt[0]);
                        maxY = Math.max(maxY, y + pt[1]);
                    });
                }
            });

            var padding = 20;
            var width = Math.max(100, maxX - minX + padding * 2);
            var height = Math.max(60, maxY - minY + padding * 2);
            var offsetX = -minX + padding;
            var offsetY = -minY + padding;

            var svgParts = [];
            svgParts.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '" width="100%" height="auto">');
            svgParts.push('<rect width="' + width + '" height="' + height + '" fill="' + (bgColor || '#121212') + '"/>');

            visibleElements.forEach(function(el) {
                var x = (el.x || 0) + offsetX;
                var y = (el.y || 0) + offsetY;
                var w = el.width || 0;
                var h = el.height || 0;
                var stroke = el.strokeColor || '#ffffff';
                var fill = el.backgroundColor || 'transparent';
                var sw = el.strokeWidth || 1;
                var opacity = (el.opacity != null ? el.opacity / 100 : 1);

                if (el.type === 'rectangle') {
                    var rx = el.roundness ? Math.min(w, h) * 0.1 : 0;
                    svgParts.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" stroke="' + stroke + '" stroke-width="' + sw + '" fill="' + fill + '" opacity="' + opacity + '"/>');
                } else if (el.type === 'ellipse') {
                    var cx = x + w / 2;
                    var cy = y + h / 2;
                    svgParts.push('<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (w / 2) + '" ry="' + (h / 2) + '" stroke="' + stroke + '" stroke-width="' + sw + '" fill="' + fill + '" opacity="' + opacity + '"/>');
                } else if (el.type === 'diamond') {
                    var pts = [
                        (x + w / 2) + ',' + y,
                        (x + w) + ',' + (y + h / 2),
                        (x + w / 2) + ',' + (y + h),
                        x + ',' + (y + h / 2)
                    ].join(' ');
                    svgParts.push('<polygon points="' + pts + '" stroke="' + stroke + '" stroke-width="' + sw + '" fill="' + fill + '" opacity="' + opacity + '"/>');
                } else if (el.type === 'line' || el.type === 'arrow' || el.type === 'freedraw') {
                    if (el.points && el.points.length > 1) {
                        var pathD = 'M ' + (x + el.points[0][0]) + ' ' + (y + el.points[0][1]);
                        for (var i = 1; i < el.points.length; i++) {
                            pathD += ' L ' + (x + el.points[i][0]) + ' ' + (y + el.points[i][1]);
                        }
                        var markerEnd = el.type === 'arrow' ? ' marker-end="url(#arrowhead)"' : '';
                        svgParts.push('<path d="' + pathD + '" stroke="' + stroke + '" stroke-width="' + sw + '" fill="none" opacity="' + opacity + '"' + markerEnd + '/>');
                    }
                } else if (el.type === 'text') {
                    var fontSize = el.fontSize || 16;
                    var textContent = (el.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    svgParts.push('<text x="' + x + '" y="' + (y + fontSize) + '" fill="' + stroke + '" font-size="' + fontSize + '" font-family="system-ui, sans-serif" opacity="' + opacity + '">' + textContent + '</text>');
                }
            });

            // Add arrowhead marker definition if needed
            var hasArrows = visibleElements.some(function(el) { return el.type === 'arrow'; });
            if (hasArrows) {
                svgParts.splice(1, 0, '<defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#ffffff"/></marker></defs>');
            }

            svgParts.push('</svg>');
            return svgParts.join('');
        }

        function renderExcalidraw(target, raw, widthMode) {
            console.log('[Excalidraw] renderExcalidraw called with target:', target, 'raw length:', (raw || '').length, 'widthMode:', widthMode);
            try {
                var trimmedRaw = (raw || '').trim();
                var data;
                
                if (!trimmedRaw) {
                    // Empty scene - show nice placeholder
                    console.log('[Excalidraw] Empty scene, rendering placeholder');
                    target.innerHTML = renderExcalidrawSvg([], '#121212');
                    return;
                }

                data = parseExcalidrawData(trimmedRaw);
                console.log('[Excalidraw] Parsed data:', data);
                if (!data) {
                    target.innerHTML = '<div style="color: var(--text-dim); font-style: italic; padding: 20px;">Invalid Excalidraw JSON</div>';
                    return;
                }

                var bgColor = (data.appState && data.appState.viewBackgroundColor) || '#121212';
                var svgHtml = renderExcalidrawSvg(data.elements || [], bgColor);
                target.innerHTML = svgHtml;
            } catch (err) {
                console.error('Failed to render Excalidraw:', err);
                target.innerHTML = '<div style="color: var(--text-dim); font-style: italic; padding: 20px;">Failed to render Excalidraw: ' + err.message + '</div>';
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

            // JSON keywords
            var jsonKw = ['true', 'false', 'null'];

            function escapeHtml(text) {
                return text.replace(/&/g, '&amp;')
                           .replace(/</g, '&lt;')
                           .replace(/>/g, '&gt;');
            }

            function createResizeHandle(iframe) {
                var handle = document.createElement('div');
                handle.className = 'preview-resize-handle';
                var startY, startHeight;
                handle.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    startY = e.clientY;
                    startHeight = iframe.offsetHeight;
                    handle.classList.add('dragging');
                    // Overlay to prevent iframe from stealing mouse events
                    var overlay = document.createElement('div');
                    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;cursor:ns-resize;';
                    document.body.appendChild(overlay);
                    function onMouseMove(e) {
                        var newHeight = Math.max(100, startHeight + (e.clientY - startY));
                        iframe.style.height = newHeight + 'px';
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
                return handle;
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
                            else if (lang === 'json') keywords = jsonKw;
                            
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
            
            // HTML-specific highlighter for proper tag/attribute highlighting
            function highlightHtml(code) {
                var result = escapeHtml(code);
                
                // Highlight HTML comments
                result = result.replace(/(&lt;!--[\\s\\S]*?--&gt;)/g, '<span class="hl-cmt">$1</span>');
                
                // Highlight DOCTYPE
                result = result.replace(/(&lt;!DOCTYPE[^&]*&gt;)/gi, '<span class="hl-kw">$1</span>');
                
                // Highlight opening tags with attributes
                result = result.replace(/(&lt;)(\\/?)(\\w+)([^&]*?)(&gt;)/g, function(match, lt, slash, tagName, attrs, gt) {
                    // Highlight attribute names and values within attrs
                    var highlightedAttrs = attrs.replace(/(\\s+)(\\w+)(=)(&quot;[^&]*?&quot;|'[^']*')/g, function(m, space, attrName, eq, attrValue) {
                        return space + '<span class="hl-fn">' + attrName + '</span>' + eq + '<span class="hl-str">' + attrValue + '</span>';
                    });
                    // Also handle attributes without quotes
                    highlightedAttrs = highlightedAttrs.replace(/(\\s+)(\\w+)(=)(\\w+)/g, function(m, space, attrName, eq, attrValue) {
                        return space + '<span class="hl-fn">' + attrName + '</span>' + eq + '<span class="hl-str">' + attrValue + '</span>';
                    });
                    // Handle boolean attributes (no value)
                    highlightedAttrs = highlightedAttrs.replace(/(\\s+)(\\w+)(?!=)/g, function(m, space, attrName) {
                        if (attrName && !attrName.includes('span')) {
                            return space + '<span class="hl-fn">' + attrName + '</span>';
                        }
                        return m;
                    });
                    return '<span class="hl-ty">' + lt + slash + tagName + '</span>' + highlightedAttrs + '<span class="hl-ty">' + gt + '</span>';
                });
                
                // Highlight self-closing tags
                result = result.replace(/(&lt;)(\\w+)([^&]*?)(\\/&gt;)/g, function(match, lt, tagName, attrs, close) {
                    var highlightedAttrs = attrs.replace(/(\\s+)(\\w+)(=)(&quot;[^&]*?&quot;|'[^']*')/g, function(m, space, attrName, eq, attrValue) {
                        return space + '<span class="hl-fn">' + attrName + '</span>' + eq + '<span class="hl-str">' + attrValue + '</span>';
                    });
                    return '<span class="hl-ty">' + lt + tagName + '</span>' + highlightedAttrs + '<span class="hl-ty">' + close + '</span>';
                });
                
                return result;
            }

            // Apply syntax highlighting
            // NOTE: HTML blocks are NOT highlighted here - they get their own handling later
            // to avoid corrupting the code content before it's used in the iframe srcdoc
            document.querySelectorAll('pre code').forEach(function(block) {
                var lang = block.parentElement.getAttribute('data-lang') || '';
                var langLower = lang.toLowerCase();
                if (langLower === 'python' || langLower === 'rust' || langLower === 'javascript' || 
                    langLower === 'js' || langLower === 'typescript' || langLower === 'ts' || langLower === 'svelte' ||
                    langLower === 'json' || langLower === 'zen' || langLower === 'excalidraw') {
                    var code = block.textContent || '';
                    // Svelte uses JavaScript highlighting, Zen uses Python highlighting
                    var hlLang = (langLower === 'svelte') ? 'javascript' : 
                                 (langLower === 'zen') ? 'python' : 
                                 (langLower === 'excalidraw') ? 'json' : langLower;
                    block.innerHTML = highlightCode(code, hlLang);
                }
            });
            // Transform code blocks to have tabs
            var codeBlockId = 0; // Count Python and Rust blocks to match parser
            var excalidrawBlockId = 0; // Count excalidraw blocks for identification
            var codeBlocks = {}; // Store code content for each block
            var blockLanguages = {}; // Store language for each block
            // Note: vscode is already acquired at the top of this script

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
                var langLower = lang.toLowerCase();
                var isPython = (langLower === 'python' || langLower === 'py');
                var isRust = (langLower === 'rust' || langLower === 'rs');
                var isJs = (langLower === 'javascript' || langLower === 'js');
                var isTs = (langLower === 'typescript' || langLower === 'ts');
                var isMermaid = (langLower === 'mermaid');
                var isExcalidraw = (langLower === 'excalidraw' || langLower === 'exaclidraw');
                var isSvelte = (langLower === 'svelte');
                var isJson = (langLower === 'json');
                var isZen = (langLower === 'zen');
                var isHtml = (langLower === 'html');
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
                
                // Handle Excalidraw blocks specially
                if (isExcalidraw) {
                    console.log('[Excalidraw] Detected excalidraw block, lang:', lang, 'codeContent length:', codeContent.length);
                    var excalidrawContainer = document.createElement('div');
                    excalidrawContainer.className = 'code-block-container excalidraw-container';
                    // Assign a stable block ID for live updates
                    var currentExcalidrawBlockId = 'excalidraw-' + excalidrawBlockId;
                    excalidrawContainer.setAttribute('data-excalidraw-id', currentExcalidrawBlockId);
                    excalidrawBlockId++;

                    var widthMode = pre.getAttribute('data-zef-width') || '';
                    if (widthMode === 'wide') {
                        excalidrawContainer.classList.add('excalidraw-wide');
                    } else if (widthMode === 'full') {
                        excalidrawContainer.classList.add('excalidraw-full');
                    }

                    var excalidrawTabsBar = document.createElement('div');
                    excalidrawTabsBar.className = 'code-block-tabs';

                    var excalidrawTabs = ['Rendered', 'Source Code'];
                    excalidrawTabs.forEach(function(tabName, index) {
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
                                thisContainer.querySelector('.excalidraw-' + tabId).classList.add('active');
                            };
                        })(excalidrawContainer, tab);
                        excalidrawTabsBar.appendChild(tab);
                    });

                    // Add expand button to tabs bar
                    var excalidrawExpandBtn = document.createElement('button');
                    excalidrawExpandBtn.className = 'excalidraw-expand-btn';
                    excalidrawExpandBtn.title = 'Open editor';
                    excalidrawExpandBtn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>Edit';
                    excalidrawExpandBtn.onclick = (function(rawJson, container) {
                        return function() {
                            // Parse the JSON and send to extension to open editor panel
                            try {
                                var data = JSON.parse(rawJson || '{}');
                                // Ensure it has the right structure
                                if (!data.elements) {
                                    data = { type: 'excalidraw', version: 2, elements: [], appState: { viewBackgroundColor: '#121212' }, files: {} };
                                }
                                // Use the stable block ID assigned during rendering
                                var blockId = container.getAttribute('data-excalidraw-id');
                                // Send message to extension to open Excalidraw editor panel
                                vscode.postMessage({
                                    type: 'openExcalidrawEditor',
                                    data: data,
                                    blockId: blockId
                                });
                            } catch (e) {
                                console.error('Failed to parse Excalidraw JSON:', e);
                                vscode.postMessage({
                                    type: 'openExcalidrawEditor',
                                    data: { type: 'excalidraw', version: 2, elements: [], appState: { viewBackgroundColor: '#121212' }, files: {} },
                                    blockId: container.getAttribute('data-excalidraw-id') || 'excalidraw-0'
                                });
                            }
                        };
                    })(codeContent, excalidrawContainer);
                    excalidrawTabsBar.appendChild(excalidrawExpandBtn);

                    var excalidrawLangIndicator = document.createElement('div');
                    excalidrawLangIndicator.className = 'code-block-lang';
                    excalidrawLangIndicator.textContent = 'Excalidraw';
                    excalidrawTabsBar.appendChild(excalidrawLangIndicator);

                    var excalidrawRenderedContent = document.createElement('div');
                    excalidrawRenderedContent.className = 'code-block-content excalidraw-rendered active';

                    var excalidrawSourceContent = document.createElement('div');
                    excalidrawSourceContent.className = 'code-block-content excalidraw-source-code';

                    // Insert container before pre (while pre is still in original DOM)
                    pre.parentNode.insertBefore(excalidrawContainer, pre);
                    excalidrawContainer.appendChild(excalidrawTabsBar);
                    excalidrawContainer.appendChild(excalidrawRenderedContent);
                    excalidrawContainer.appendChild(excalidrawSourceContent);
                    // Now move pre into the source content container
                    excalidrawSourceContent.appendChild(pre);

                    renderExcalidraw(excalidrawRenderedContent, codeContent, widthMode);
                    return;
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
                    
                    // Add SVG export button
                    var mermaidExportBtn = document.createElement('button');
                    mermaidExportBtn.className = 'mermaid-export-btn';
                    mermaidExportBtn.title = 'Export as SVG';
                    mermaidExportBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>SVG';
                    mermaidExportBtn.onclick = (function(container) {
                        return function() {
                            exportMermaidAsSvg(container);
                        };
                    })(mermaidContainer);
                    mermaidTabsBar.appendChild(mermaidExportBtn);
                    
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
                
                // Handle HTML blocks with Rendered/Code tabs (no execution button)
                if (isHtml) {
                    // Create container for HTML with tabs
                    var htmlContainer = document.createElement('div');
                    htmlContainer.className = 'code-block-container html-container';
                    
                    // Create tabs bar
                    var htmlTabsBar = document.createElement('div');
                    htmlTabsBar.className = 'code-block-tabs';
                    
                    var htmlTabs = ['Rendered', 'Code'];
                    htmlTabs.forEach(function(tabName, index) {
                        var tab = document.createElement('button');
                        tab.className = 'code-block-tab' + (index === 0 ? ' active' : '');
                        tab.textContent = tabName;
                        tab.setAttribute('data-tab', tabName.toLowerCase());
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
                                thisContainer.querySelector('.html-' + tabId).classList.add('active');
                            };
                        })(htmlContainer, tab);
                        htmlTabsBar.appendChild(tab);
                    });
                    
                    // Add language indicator
                    var htmlLangIndicator = document.createElement('div');
                    htmlLangIndicator.className = 'code-block-lang';
                    htmlLangIndicator.innerHTML = '<span>HTML</span><span>&lt;/&gt;</span>';
                    htmlTabsBar.appendChild(htmlLangIndicator);
                    
                    // Create "Rendered" content (the HTML preview in iframe)
                    var htmlRenderedContent = document.createElement('div');
                    htmlRenderedContent.className = 'code-block-content html-rendered active';
                    
                    // Add expand button
                    var htmlExpandBtn = document.createElement('button');
                    htmlExpandBtn.className = 'html-expand-btn';
                    htmlExpandBtn.title = 'Expand to fullscreen';
                    htmlExpandBtn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';
                    htmlExpandBtn.onclick = (function(content) {
                        return function() {
                            openHtmlModal(content);
                        };
                    })(codeContent);
                    htmlRenderedContent.appendChild(htmlExpandBtn);
                    
                    var htmlIframe = document.createElement('iframe');
                    htmlIframe.className = 'html-preview-frame';
                    htmlIframe.setAttribute('sandbox', 'allow-scripts');
                    htmlIframe.srcdoc = codeContent;
                    htmlRenderedContent.appendChild(htmlIframe);
                    htmlRenderedContent.appendChild(createResizeHandle(htmlIframe));
                    
                    // Create "Code" content
                    var htmlCodeContent = document.createElement('div');
                    htmlCodeContent.className = 'code-block-content html-code';
                    var htmlSourcePre = document.createElement('pre');
                    htmlSourcePre.setAttribute('data-lang', 'html');
                    var htmlSourceCode = document.createElement('code');
                    htmlSourceCode.innerHTML = highlightHtml(codeContent);
                    htmlSourcePre.appendChild(htmlSourceCode);
                    htmlCodeContent.appendChild(htmlSourcePre);
                    
                    // Insert container
                    pre.parentNode.insertBefore(htmlContainer, pre);
                    htmlContainer.appendChild(htmlTabsBar);
                    htmlContainer.appendChild(htmlRenderedContent);
                    htmlContainer.appendChild(htmlCodeContent);
                    
                    // Remove original pre
                    pre.parentNode.removeChild(pre);
                    return; // Skip the rest of the loop for html
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

                    // Add expand button to open in full panel
                    var svelteExpandBtn = document.createElement('button');
                    svelteExpandBtn.className = 'svelte-expand-btn';
                    svelteExpandBtn.id = 'svelte-expand-' + currentBlockId;
                    svelteExpandBtn.title = 'Open in full panel';
                    svelteExpandBtn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>Open';
                    svelteExpandBtn.onclick = (function(blockId, container) {
                        return function() {
                            // Get the current iframe HTML to send along
                            var iframe = container.querySelector('.svelte-preview-frame');
                            var html = iframe ? iframe.srcdoc : null;
                            vscode.postMessage({
                                type: 'openSveltePanel',
                                blockId: blockId,
                                html: html
                            });
                        };
                    })(currentBlockId, svelteContainer);
                    svelteTabsBar.appendChild(svelteExpandBtn);

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
                        svelteRenderedContent.appendChild(createResizeHandle(svelteIframe));
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
                
                // Handle JSON blocks - display only, no execution
                if (isJson) {
                    // Create simple container with just language indicator and code
                    var jsonContainer = document.createElement('div');
                    jsonContainer.className = 'code-block-container json-container';
                    
                    // Create header bar with just language indicator
                    var jsonHeaderBar = document.createElement('div');
                    jsonHeaderBar.className = 'code-block-tabs';
                    
                    // Add language indicator
                    var jsonLangIndicator = document.createElement('div');
                    jsonLangIndicator.className = 'code-block-lang';
                    jsonLangIndicator.innerHTML = '<span>JSON</span><span>{ }</span>';
                    jsonHeaderBar.appendChild(jsonLangIndicator);
                    
                    // Create code content
                    var jsonCodeContent = document.createElement('div');
                    jsonCodeContent.className = 'code-block-content active';
                    
                    // Insert container BEFORE moving the pre element
                    pre.parentNode.insertBefore(jsonContainer, pre);
                    jsonContainer.appendChild(jsonHeaderBar);
                    jsonContainer.appendChild(jsonCodeContent);
                    
                    // Now move pre into the code content
                    jsonCodeContent.appendChild(pre);
                    
                    return; // Skip the rest of the loop for json
                }
                
                // Handle Zen blocks - display only with Python highlighting, no execution
                if (isZen) {
                    // Create simple container with just language indicator and code
                    var zenContainer = document.createElement('div');
                    zenContainer.className = 'code-block-container zen-container';
                    
                    // Create header bar with just language indicator
                    var zenHeaderBar = document.createElement('div');
                    zenHeaderBar.className = 'code-block-tabs';
                    
                    // Add language indicator
                    var zenLangIndicator = document.createElement('div');
                    zenLangIndicator.className = 'code-block-lang';
                    zenLangIndicator.innerHTML = '<span>Zen</span><span>🌿</span>';
                    zenHeaderBar.appendChild(zenLangIndicator);
                    
                    // Create code content
                    var zenCodeContent = document.createElement('div');
                    zenCodeContent.className = 'code-block-content active';
                    
                    // Insert container BEFORE moving the pre element
                    pre.parentNode.insertBefore(zenContainer, pre);
                    zenContainer.appendChild(zenHeaderBar);
                    zenContainer.appendChild(zenCodeContent);
                    
                    // Now move pre into the code content
                    zenCodeContent.appendChild(pre);
                    
                    return; // Skip the rest of the loop for zen
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
                // (reuse the isPython, isRust, isJs, isTs already computed above)
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
                    })(currentBlockId, langLower);
                    tabsBar.appendChild(runBtn);
                }
                
                // Add language indicator with emoji on the right
                var langIndicator = document.createElement('div');
                langIndicator.className = 'code-block-lang';
                var emoji = '';
                var langName = langLower;
                if (isPython) {
                    emoji = '🐍';
                    langName = 'Python';
                } else if (isRust) {
                    emoji = '🦀';
                    langName = 'Rust';
                } else if (isJs) {
                    emoji = '📜';
                    langName = 'JavaScript';
                } else if (isTs) {
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
                    
                    // Update the rendered content
                    var renderedContent = document.querySelector('.svelte-container[data-block-id="' + blockId + '"] .svelte-rendered');
                    if (renderedContent) {
                        // Clear existing content
                        renderedContent.innerHTML = '';

                        if (result.success && result.html) {
                            // Success: show iframe with rendered component
                            var iframe = document.createElement('iframe');
                            iframe.className = 'svelte-preview-frame';
                            iframe.setAttribute('sandbox', 'allow-scripts');
                            iframe.setAttribute('data-block-id', blockId);
                            iframe.srcdoc = result.html;
                            renderedContent.appendChild(iframe);
                            renderedContent.appendChild(createResizeHandle(iframe));
                        } else {
                            // Error: show error report directly (not in iframe) so it's copyable
                            var errorContainer = document.createElement('div');
                            errorContainer.className = 'svelte-error-report';
                            errorContainer.style.cssText = 'padding: 16px; font-family: monospace; font-size: 0.6rem; background: #1e1e1e; color: #e06c75; position: relative;';

                            // Copy button
                            var copyBtn = document.createElement('button');
                            copyBtn.textContent = 'Copy';
                            copyBtn.style.cssText = 'position: absolute; top: 8px; right: 8px; background: #333; color: #ccc; border: 1px solid #555; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 0.75rem;';
                            copyBtn.onmouseenter = function() { copyBtn.style.background = '#444'; };
                            copyBtn.onmouseleave = function() { copyBtn.style.background = '#333'; };

                            // Build error text
                            var errorText = result.error || 'Unknown error';
                            var details = result.errorDetails;
                            if (details) {
                                if (details.code) {
                                    errorText = '[' + details.code + '] ' + errorText;
                                }
                                if (details.line !== undefined) {
                                    errorText += '\\n\\nLocation: line ' + details.line + (details.column !== undefined ? ', column ' + details.column : '');
                                    if (details.endLine !== undefined) {
                                        errorText += ' to line ' + details.endLine + (details.endColumn !== undefined ? ', column ' + details.endColumn : '');
                                    }
                                }
                                if (details.frame) {
                                    errorText += '\\n\\n' + details.frame;
                                }
                            }

                            copyBtn.onclick = function() {
                                navigator.clipboard.writeText(errorText).then(function() {
                                    copyBtn.textContent = 'Copied!';
                                    setTimeout(function() { copyBtn.textContent = 'Copy'; }, 2000);
                                });
                            };

                            var errorPre = document.createElement('pre');
                            errorPre.style.cssText = 'margin: 0; white-space: pre-wrap; word-wrap: break-word; padding-right: 60px; user-select: text; -webkit-user-select: text;';
                            errorPre.textContent = errorText;

                            errorContainer.appendChild(copyBtn);
                            errorContainer.appendChild(errorPre);
                            renderedContent.appendChild(errorContainer);
                        }
                    }

                    // Switch to rendered tab and rename it based on result
                    var container = document.querySelector('.svelte-container[data-block-id="' + blockId + '"]');
                    if (container) {
                        container.querySelectorAll('.code-block-tab').forEach(function(t) {
                            t.classList.remove('active');
                            if (t.getAttribute('data-tab') === 'rendered') {
                                t.classList.add('active');
                                t.textContent = result.success ? 'Rendered' : 'Error Report';
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
    ${katexJsUri ? `<script src="${katexJsUri}"></script>
    <script src="${katexAutoRenderUri}"></script>
    <script>
        // Initialize KaTeX auto-render for LaTeX math equations
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
    </script>` : ''}
</body>
</html>`;
}
