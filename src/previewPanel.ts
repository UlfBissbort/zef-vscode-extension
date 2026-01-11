import * as vscode from 'vscode';
import { marked } from 'marked';
import { CellResult } from './kernelManager';

let currentPanel: vscode.WebviewPanel | undefined;
let onRunCodeCallback: ((code: string, blockId: number, language: string) => void) | undefined;
let currentDocumentUri: vscode.Uri | undefined;  // Track which document the preview is showing

export function setOnRunCode(callback: (code: string, blockId: number, language: string) => void) {
    onRunCodeCallback = callback;
}

export function getCurrentDocumentUri(): vscode.Uri | undefined {
    return currentDocumentUri;
}

export function createPreviewPanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
    const editor = vscode.window.activeTextEditor;
    
    if (currentPanel) {
        currentPanel.reveal(vscode.ViewColumn.Two);
    } else {
        currentPanel = vscode.window.createWebviewPanel(
            'zefPreview',
            'Zef Preview',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        currentPanel.onDidDispose(() => {
            currentPanel = undefined;
        });
        
        // Handle messages from the webview
        currentPanel.webview.onDidReceiveMessage(message => {
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
            }
        });
    }

    if (editor && editor.document.fileName.endsWith('.zef.md')) {
        updatePreview(editor.document);
    }

    return currentPanel;
}

export function updatePreview(document: vscode.TextDocument) {
    if (!currentPanel) {
        return;
    }

    // Track which document we're previewing
    currentDocumentUri = document.uri;

    const text = document.getText();
    
    // Extract existing Result and Side Effects blocks before removing them
    const existingResults: { [blockId: number]: string } = {};
    const existingSideEffects: { [blockId: number]: string } = {};
    let codeBlockIndex = 0;
    
    // Find all code blocks (Python and Rust) and their associated Result/Side Effects
    const codeBlockRegex = /```(?:python|rust)\s*\n[\s\S]*?```(\s*\n````(?:Result|Output)\s*\n([\s\S]*?)````)?(\s*\n````Side Effects\s*\n([\s\S]*?)````)?/g;
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
        codeBlockIndex++;
        if (match[2]) {  // Has Result block
            existingResults[codeBlockIndex] = match[2].trim();
        }
        if (match[4]) {  // Has Side Effects block
            existingSideEffects[codeBlockIndex] = match[4].trim();
        }
    }
    
    // Remove Result and Side Effects blocks for rendering
    const cleanText = text
        .replace(/\n````(?:Result|Output)\s*\n[\s\S]*?````/g, '')
        .replace(/\n````Side Effects\s*\n[\s\S]*?````/g, '');
    
    const html = renderMarkdown(cleanText);
    currentPanel.webview.html = getWebviewContent(html, existingResults, existingSideEffects);
}

export function getPanel(): vscode.WebviewPanel | undefined {
    return currentPanel;
}

export function scrollPreviewToLine(line: number) {
    if (currentPanel) {
        currentPanel.webview.postMessage({ type: 'scrollToLine', line: line });
    }
}

export function sendCellResult(blockId: number, result: CellResult) {
    if (currentPanel) {
        currentPanel.webview.postMessage({ 
            type: 'cellResult', 
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

    return marked.parse(markdown) as string;
}

function getWebviewContent(renderedHtml: string, existingOutputs: { [blockId: number]: string } = {}, existingSideEffects: { [blockId: number]: string } = {}): string {
    // Serialize existing outputs and side effects as JSON for the webview
    const outputsJson = JSON.stringify(existingOutputs);
    const sideEffectsJson = JSON.stringify(existingSideEffects);
    
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
            --text-muted: #888;
            --text-dim: #666;
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
        (function() {
            // Existing outputs and side effects loaded from file
            var existingOutputs = ${outputsJson};
            var existingSideEffects = ${sideEffectsJson};
            
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
                    lang === 'js' || lang === 'typescript' || lang === 'ts') {
                    var code = block.textContent || '';
                    block.innerHTML = highlightCode(code, lang);
                }
            });
            // Transform code blocks to have tabs
            var codeBlockId = 0; // Count Python and Rust blocks to match parser
            var codeBlocks = {}; // Store code content for each block
            var blockLanguages = {}; // Store language for each block
            var vscode = acquireVsCodeApi();
            
            document.querySelectorAll('pre').forEach(function(pre) {
                var lang = pre.getAttribute('data-lang') || 'code';
                var isPython = (lang === 'python' || lang === 'py');
                var isRust = (lang === 'rust' || lang === 'rs');
                var isExecutable = isPython || isRust;
                
                // Only assign blockId to executable blocks to match the parser
                var currentBlockId = null;
                if (isExecutable) {
                    codeBlockId++;
                    currentBlockId = codeBlockId;
                }
                
                var codeElement = pre.querySelector('code');
                var codeContent = codeElement ? codeElement.textContent || '' : '';
                
                // Store the code and language for this block (Python and Rust)
                if (currentBlockId !== null) {
                    codeBlocks[currentBlockId] = codeContent;
                    blockLanguages[currentBlockId] = lang;
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
                
                // Add Run button for Python and Rust blocks
                var isPython = (lang === 'python' || lang === 'py');
                var isRust = (lang === 'rust' || lang === 'rs');
                if (isPython || isRust) {
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
                    // Show existing output with proper escaping
                    outputHtml += '<span style="color: #98c379; white-space: pre-wrap;">' + escapeHtml(existingOutput) + '</span>';
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
                    // Parse the side effects list and display
                    sideEffectsHtml += '<pre style="color: #d19a66; white-space: pre-wrap; margin: 0; font-size: 0.8rem;">' + escapeHtml(existingSideEffect) + '</pre>';
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
                                html += '<div style="color: #98c379; white-space: pre-wrap; font-family: monospace;">' + 
                                        escapeHtml(String(result.result)) + '</div>';
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
                        var effectsHtml = '<pre style="color: #d19a66; white-space: pre-wrap; margin: 0; font-size: 0.8rem;">[\\n';
                        result.side_effects.forEach(function(effect, idx) {
                            var escapedContent = escapeHtml(effect.content).replace(/\\n/g, '\\\\n');
                            effectsHtml += '    ET.UnmanagedEffect(what=\\'' + effect.what + '\\', content=\\'' + escapedContent + '\\')';
                            if (idx < result.side_effects.length - 1) {
                                effectsHtml += ',';
                            }
                            effectsHtml += '\\n';
                        });
                        effectsHtml += ']</pre>';
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
</body>
</html>`;
}
