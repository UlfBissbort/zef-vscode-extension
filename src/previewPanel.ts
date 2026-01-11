import * as vscode from 'vscode';
import { marked } from 'marked';

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

function renderMarkdown(markdown: string): string {
    // Configure marked for syntax highlighting support
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
        :root {
            --bg-color: #1e1e1e;
            --text-color: #d4d4d4;
            --code-bg: #2d2d2d;
            --border-color: #404040;
            --heading-color: #569cd6;
            --link-color: #4ec9b0;
            --code-text: #ce9178;
        }

        @media (prefers-color-scheme: light) {
            :root {
                --bg-color: #ffffff;
                --text-color: #333333;
                --code-bg: #f5f5f5;
                --border-color: #e0e0e0;
                --heading-color: #0066cc;
                --link-color: #007acc;
                --code-text: #a31515;
            }
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--bg-color);
            padding: 20px 40px;
            max-width: 900px;
            margin: 0 auto;
        }

        h1, h2, h3, h4, h5, h6 {
            color: var(--heading-color);
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
        }

        h1 { font-size: 2em; border-bottom: 2px solid var(--border-color); padding-bottom: 0.3em; }
        h2 { font-size: 1.5em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
        h3 { font-size: 1.25em; }

        p {
            margin: 1em 0;
        }

        a {
            color: var(--link-color);
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }

        code {
            font-family: 'SF Mono', 'Fira Code', Consolas, 'Courier New', monospace;
            background-color: var(--code-bg);
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-size: 0.9em;
            color: var(--code-text);
        }

        pre {
            background-color: var(--code-bg);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 16px;
            padding-top: 28px;
            overflow-x: auto;
            position: relative;
        }

        pre code {
            background-color: transparent;
            padding: 0;
            font-size: 0.875em;
            line-height: 1.5;
            color: var(--text-color);
        }

        /* Basic syntax highlighting */
        .keyword { color: #569cd6; }
        .string { color: #ce9178; }
        .comment { color: #6a9955; }
        .function { color: #dcdcaa; }
        .number { color: #b5cea8; }
        .type { color: #4ec9b0; }
        .macro { color: #c586c0; }
        .lifetime { color: #d7ba7d; }
        .attribute { color: #9cdcfe; }

        blockquote {
            border-left: 4px solid var(--heading-color);
            margin: 1em 0;
            padding: 0.5em 1em;
            background-color: var(--code-bg);
            border-radius: 0 6px 6px 0;
        }

        blockquote p {
            margin: 0;
        }

        ul, ol {
            padding-left: 2em;
        }

        li {
            margin: 0.5em 0;
        }

        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }

        th, td {
            border: 1px solid var(--border-color);
            padding: 8px 12px;
            text-align: left;
        }

        th {
            background-color: var(--code-bg);
            font-weight: 600;
        }

        hr {
            border: none;
            border-top: 1px solid var(--border-color);
            margin: 2em 0;
        }

        img {
            max-width: 100%;
            height: auto;
        }

        /* Language badge for code blocks */
        pre[data-lang]::before {
            content: attr(data-lang);
            position: absolute;
            top: 0;
            right: 0;
            padding: 2px 8px;
            font-size: 0.75em;
            border-radius: 0 6px 0 6px;
            text-transform: capitalize;
        }

        /* Python badge */
        pre[data-lang="python"]::before {
            background: #3572A5;
            color: white;
        }

        /* Rust badge */
        pre[data-lang="rust"]::before {
            background: #dea584;
            color: #1e1e1e;
        }

        /* JavaScript badge */
        pre[data-lang="javascript"]::before,
        pre[data-lang="js"]::before {
            background: #f7df1e;
            color: #1e1e1e;
        }

        /* TypeScript badge */
        pre[data-lang="typescript"]::before,
        pre[data-lang="ts"]::before {
            background: #3178c6;
            color: white;
        }

        /* Generic badge for other languages */
        pre[data-lang]::before {
            background: #6b7280;
            color: white;
        }
    </style>
</head>
<body>
    ${renderedHtml}
    <script>
        // Add language data attributes to pre elements
        document.querySelectorAll('pre code').forEach(block => {
            const classes = block.className.split(' ');
            const langClass = classes.find(c => c.startsWith('language-'));
            if (langClass) {
                const lang = langClass.replace('language-', '');
                block.parentElement.setAttribute('data-lang', lang);
            }
        });

        // Syntax highlighting for different languages
        document.querySelectorAll('pre code').forEach(block => {
            let html = block.innerHTML;
            const lang = block.parentElement?.getAttribute('data-lang') || '';
            
            if (lang === 'python') {
                // Python keywords
                html = html.replace(/\\b(def|class|return|if|else|elif|for|while|import|from|as|try|except|finally|with|in|not|and|or|is|None|True|False|lambda|yield|raise|pass|break|continue|async|await|self)\\b/g, 
                    '<span class="keyword">$1</span>');
                
                // Comments
                html = html.replace(/(#.*)$/gm, '<span class="comment">$1</span>');
            } 
            else if (lang === 'rust') {
                // Rust keywords
                html = html.replace(/\\b(fn|let|mut|const|static|if|else|match|for|while|loop|break|continue|return|struct|enum|impl|trait|pub|mod|use|crate|self|super|as|where|unsafe|async|await|move|ref|type|dyn|extern|in)\\b/g, 
                    '<span class="keyword">$1</span>');
                
                // Rust types
                html = html.replace(/\\b(i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize|f32|f64|bool|char|str|String|Vec|Option|Result|Box|Rc|Arc|Self|Some|None|Ok|Err|true|false)\\b/g, 
                    '<span class="type">$1</span>');
                
                // Lifetimes
                html = html.replace(/'([a-zA-Z_][a-zA-Z0-9_]*)/g, 
                    '<span class="lifetime">\\'$1</span>');
                
                // Macros
                html = html.replace(/\\b([a-zA-Z_][a-zA-Z0-9_]*)!/g, 
                    '<span class="macro">$1!</span>');
                
                // Attributes
                html = html.replace(/#\\[([^\\]]+)\\]/g, 
                    '<span class="attribute">#[$1]</span>');
                
                // Comments
                html = html.replace(/(\\/\\/.*)$/gm, '<span class="comment">$1</span>');
            }
            else if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
                // JS/TS keywords
                html = html.replace(/\\b(const|let|var|function|return|if|else|for|while|class|extends|import|export|from|as|new|this|try|catch|finally|throw|async|await|typeof|instanceof|in|of|default|switch|case|break|continue|null|undefined|true|false)\\b/g, 
                    '<span class="keyword">$1</span>');
                
                // TS types
                if (lang === 'typescript' || lang === 'ts') {
                    html = html.replace(/\\b(string|number|boolean|any|void|never|unknown|interface|type|enum|namespace|declare|readonly|private|public|protected|abstract|implements)\\b/g, 
                        '<span class="type">$1</span>');
                }
                
                // Comments
                html = html.replace(/(\\/\\/.*)$/gm, '<span class="comment">$1</span>');
            }
            
            // Common patterns for all languages
            // Strings (double and single quoted)
            html = html.replace(/(["'])(?:(?=(\\\\?))\\2.)*?\\1/g, 
                '<span class="string">$&</span>');
            
            // Function calls (before opening paren)
            html = html.replace(/\\b([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\(/g, 
                '<span class="function">$1</span>(');
            
            // Numbers
            html = html.replace(/\\b(\\d+\\.?\\d*)\\b/g, 
                '<span class="number">$1</span>');
            
            block.innerHTML = html;
        });
    </script>
</body>
</html>`;
}
