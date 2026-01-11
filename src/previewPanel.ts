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
            color: var(--text-muted);
        }

        /* Syntax highlighting - subtle and elegant */
        .kw { color: #b4b4b4; }
        .str { color: #7a9f7a; }
        .cmt { color: #555; font-style: italic; }
        .fn { color: #c9c9c9; }
        .num { color: #a0a0c0; }
        .ty { color: #909090; }

        /* Language badge */
        pre[data-lang]::before {
            content: attr(data-lang);
            position: absolute;
            top: 0;
            right: 0;
            padding: 3px 10px;
            font-size: 0.65rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--text-dim);
            background: var(--border-color);
            border-radius: 0 8px 0 8px;
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
            color: var(--text-color);
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
        // Add language data attributes to pre elements
        document.querySelectorAll('pre code').forEach(block => {
            const classes = block.className.split(' ');
            const langClass = classes.find(c => c.startsWith('language-'));
            if (langClass) {
                const lang = langClass.replace('language-', '');
                block.parentElement.setAttribute('data-lang', lang);
            }
        });

        // Syntax highlighting - careful to use proper HTML escaping
        document.querySelectorAll('pre code').forEach(block => {
            let html = block.innerHTML;
            const lang = block.parentElement?.getAttribute('data-lang') || '';
            
            // Process comments first (before other replacements can break them)
            if (lang === 'python') {
                html = html.replace(/(#[^<]*)$/gm, '<span class="cmt">$1</span>');
            } else if (lang === 'rust' || lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
                html = html.replace(/(\\/\\/[^<]*)$/gm, '<span class="cmt">$1</span>');
            }
            
            // Strings - be careful with already-escaped quotes
            html = html.replace(/(&quot;[^&]*&quot;|"[^"<]*")/g, '<span class="str">$1</span>');
            html = html.replace(/('[^'<]*')/g, '<span class="str">$1</span>');
            
            // Keywords based on language
            const pythonKeywords = 'def|class|return|if|else|elif|for|while|import|from|as|try|except|finally|with|in|not|and|or|is|None|True|False|lambda|yield|raise|pass|break|continue|async|await|self';
            const rustKeywords = 'fn|let|mut|const|static|if|else|match|for|while|loop|break|continue|return|struct|enum|impl|trait|pub|mod|use|crate|self|super|as|where|unsafe|async|await|move|ref|type|dyn|extern|in';
            const jsKeywords = 'const|let|var|function|return|if|else|for|while|class|extends|import|export|from|as|new|this|try|catch|finally|throw|async|await|typeof|instanceof|in|of|default|switch|case|break|continue|null|undefined|true|false';
            
            let keywords = '';
            if (lang === 'python') keywords = pythonKeywords;
            else if (lang === 'rust') keywords = rustKeywords;
            else if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') keywords = jsKeywords;
            
            if (keywords) {
                const kwRegex = new RegExp('\\\\b(' + keywords + ')\\\\b', 'g');
                html = html.replace(kwRegex, '<span class="kw">$1</span>');
            }
            
            // Rust types
            if (lang === 'rust') {
                html = html.replace(/\\b(i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize|f32|f64|bool|char|str|String|Vec|Option|Result|Box|Rc|Arc|Self|Some|None|Ok|Err)\\b/g, 
                    '<span class="ty">$1</span>');
            }
            
            // Function-like calls
            html = html.replace(/\\b([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\(/g, '<span class="fn">$1</span>(');
            
            // Numbers
            html = html.replace(/\\b(\\d+\\.?\\d*)\\b/g, '<span class="num">$1</span>');
            
            block.innerHTML = html;
        });
    </script>
</body>
</html>`;
}
