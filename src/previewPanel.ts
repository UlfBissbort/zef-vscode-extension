import * as vscode from 'vscode';
import { marked } from 'marked';
import { CellResult } from './kernelManager';

let currentPanel: vscode.WebviewPanel | undefined;

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

    const html = renderMarkdown(document.getText());
    currentPanel.webview.html = getWebviewContent(html);
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

function getWebviewContent(renderedHtml: string): string {
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
            margin-left: auto;
            padding: 8px 16px;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            color: var(--text-dim);
            display: flex;
            align-items: center;
            gap: 6px;
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
            var blockId = 0;
            document.querySelectorAll('pre').forEach(function(pre) {
                blockId++;
                var currentBlockId = blockId; // Capture the current blockId
                var lang = pre.getAttribute('data-lang') || 'code';
                
                // Create container
                var container = document.createElement('div');
                container.className = 'code-block-container';
                container.setAttribute('data-block-id', currentBlockId);
                
                // Create tabs bar
                var tabsBar = document.createElement('div');
                tabsBar.className = 'code-block-tabs';
                
                var tabs = ['Code', 'Output', 'Side Effects'];
                tabs.forEach(function(tabName, index) {
                    var tab = document.createElement('button');
                    tab.className = 'code-block-tab' + (index === 0 ? ' active' : '');
                    tab.textContent = tabName;
                    tab.setAttribute('data-tab', tabName.toLowerCase().replace(' ', '-'));
                    tab.setAttribute('data-block', currentBlockId);
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
                
                var outputContent = document.createElement('div');
                outputContent.className = 'code-block-content';
                outputContent.id = 'content-' + currentBlockId + '-output';
                outputContent.innerHTML = '<div class="tab-content-output">' +
                    '<div class="output-label">Output</div>' +
                    '<div class="output-value">42\\nHello, World!\\n[1, 2, 3, 4, 5]</div>' +
                    '</div>';
                
                var sideEffectsContent = document.createElement('div');
                sideEffectsContent.className = 'code-block-content';
                sideEffectsContent.id = 'content-' + currentBlockId + '-side-effects';
                sideEffectsContent.innerHTML = '<div class="tab-content-side-effects">' +
                    '<div class="effects-label">Side Effects</div>' +
                    '<div class="effect-item">→ Wrote to file: output.txt</div>' +
                    '<div class="effect-item">→ HTTP GET: https://api.example.com/data</div>' +
                    '<div class="effect-item">→ Modified: global_counter</div>' +
                    '</div>';
                
                // Insert container before pre
                pre.parentNode.insertBefore(container, pre);
                
                // Move pre into code content
                codeContent.appendChild(pre);
                
                // Assemble container
                container.appendChild(tabsBar);
                container.appendChild(codeContent);
                container.appendChild(outputContent);
                container.appendChild(sideEffectsContent);
            });        })();
    </script>
</body>
</html>`;
}
