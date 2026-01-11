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

        /* Python code block styling */
        pre code.language-python {
            color: #d4d4d4;
        }

        /* Basic syntax highlighting */
        .keyword { color: #569cd6; }
        .string { color: #ce9178; }
        .comment { color: #6a9955; }
        .function { color: #dcdcaa; }
        .number { color: #b5cea8; }

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

        /* Python code block badge */
        pre:has(code.language-python)::before {
            content: 'Python';
            position: absolute;
            top: 0;
            right: 0;
            background: #3572A5;
            color: white;
            padding: 2px 8px;
            font-size: 0.75em;
            border-radius: 0 6px 0 6px;
        }
    </style>
</head>
<body>
    ${renderedHtml}
    <script>
        // Basic syntax highlighting for Python code blocks
        document.querySelectorAll('pre code').forEach(block => {
            let html = block.innerHTML;
            
            // Keywords
            html = html.replace(/\\b(def|class|return|if|else|elif|for|while|import|from|as|try|except|finally|with|in|not|and|or|is|None|True|False|lambda|yield|raise|pass|break|continue|async|await)\\b/g, 
                '<span class="keyword">$1</span>');
            
            // Strings (simple patterns)
            html = html.replace(/(["'])(?:(?=(\\\\?))\\2.)*?\\1/g, 
                '<span class="string">$&</span>');
            
            // Comments
            html = html.replace(/(#.*)$/gm, 
                '<span class="comment">$1</span>');
            
            // Function calls
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
