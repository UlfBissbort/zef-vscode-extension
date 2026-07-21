import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { selectSlideFence } from './slidesParser';
import { convertZenSlides } from './slidesConverter';

const panels = new Map<string, vscode.WebviewPanel>();
const generations = new Map<string, number>();
const diagnostics = vscode.languages.createDiagnosticCollection('zef-slides');

function messageForResult(result: Awaited<ReturnType<typeof convertZenSlides>>): string | undefined {
    return result.ok ? undefined : result.message;
}

async function compiledHtml(context: vscode.ExtensionContext, webview: vscode.Webview): Promise<string> {
    const html = await fs.readFile(path.join(context.extensionPath, 'slides-runtime', 'compiled.html'), 'utf8');
    const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'unsafe-inline'; img-src ${webview.cspSource} https: data: blob:;">`;
    const bridge = `<script>const vscode=acquireVsCodeApi();window.addEventListener('zef-slides-ready',()=>vscode.postMessage({type:'slidesReady'}));</script>`;
    return html.replace('<head>', `<head>${csp}`).replace('</body>', `${bridge}</body>`);
}

async function updatePanel(context: vscode.ExtensionContext, document: vscode.TextDocument): Promise<void> {
    const key = document.uri.toString();
    const panel = panels.get(key);
    if (!panel) return;
    const generation = (generations.get(key) ?? 0) + 1;
    generations.set(key, generation);
    const selected = selectSlideFence(document.getText());
    if (!selected.ok) {
        diagnostics.set(document.uri, [new vscode.Diagnostic(new vscode.Range(0, 0, 0, 1), selected.message, vscode.DiagnosticSeverity.Error)]);
        await panel.webview.postMessage({ type: 'setError', error: selected.message });
        return;
    }
    const result = await convertZenSlides(selected.fence.source);
    if (generations.get(key) !== generation) return;
    if (!result.ok) {
        const range = new vscode.Range(selected.fence.startLine, 0, selected.fence.endLine, 3);
        diagnostics.set(document.uri, [new vscode.Diagnostic(range, result.message, vscode.DiagnosticSeverity.Error)]);
        await panel.webview.postMessage({ type: 'setError', error: result.message });
        return;
    }
    diagnostics.delete(document.uri);
    await panel.webview.postMessage({ type: 'setDeck', deck: result.deck });
}

export async function openSlidesPanel(context: vscode.ExtensionContext, document: vscode.TextDocument): Promise<void> {
    const key = document.uri.toString();
    const existing = panels.get(key);
    if (existing) {
        existing.reveal(vscode.ViewColumn.Beside);
        await updatePanel(context, document);
        return;
    }
    const panel = vscode.window.createWebviewPanel('zefSlides', `${path.basename(document.fileName)} — Zef Slides`, vscode.ViewColumn.Beside, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'slides-runtime')]
    });
    panels.set(key, panel);
    panel.webview.html = await compiledHtml(context, panel.webview);
    panel.webview.onDidReceiveMessage((message) => {
        if (message?.type === 'slidesReady') void updatePanel(context, document);
    });
    panel.onDidDispose(() => { panels.delete(key); generations.delete(key); diagnostics.delete(document.uri); });
}

export function updateSlidesForDocument(context: vscode.ExtensionContext, document: vscode.TextDocument): void {
    if (panels.has(document.uri.toString())) void updatePanel(context, document);
}

export function disposeSlidesPanels(): void {
    diagnostics.dispose();
    for (const panel of panels.values()) panel.dispose();
    panels.clear();
}
