/* +++
ET.TypeScriptFile('🍃-2ffc73a571458766ae31',
  tag_=[],
  created=Time('2026-09-27 10:20:23 +0800')
)
+++ */

import { execFile } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { containingFile, findAnnotationLine, graphEntityState, parseEntityInput, resolveTrackedPath } from './graphEntityPath';

const execFileAsync = promisify(execFile);

export async function openGraphEntity(): Promise<void> {
    const input = await vscode.window.showInputBox({
        title: 'Zef: Open Graph Entity by UID',
        prompt: "Enter a typed entity UID, e.g. ET.MarkdownDocument('🍃-c041c8aeec08768afec8')",
        value: vscode.window.activeTextEditor?.document.getText(vscode.window.activeTextEditor.selection).trim() ?? '',
        validateInput: value => parseEntityInput(value) ? undefined : 'Enter an ET.Type(\'🍃-...\') identity.'
    });
    if (input === undefined) { return; }
    const entity = parseEntityInput(input);
    if (!entity) { return; }

    try {
        const cli = vscode.workspace.getConfiguration('zef').get<string>('cliPath') || 'zef';
        const options = { timeout: 15000, maxBuffer: 4 * 1024 * 1024 };
        const { stdout: show } = await execFileAsync(cli, ['graph', 'show', entity, '--format', 'json'], options);
        const state = graphEntityState(show, entity);
        let source = state;
        const isCodeEntity = !state.path;
        if (isCodeEntity) {
            const [type, uid] = entity.match(/^(.+)\('(.+)'\)$/)!.slice(1);
            const query = `[.[] | select(any(.defines[]?; .__type == "${type}" and .__uid == "${uid}")) | {root_uid, path}]`;
            const { stdout } = await execFileAsync(cli, ['graph', query, '--format', 'json'], options);
            source = containingFile(stdout);
        }
        const { stdout: tracking } = await execFileAsync(cli, ['graph', 'tracking', '--format', 'json'], options);
        const file = resolveTrackedPath(source, tracking);
        const uri = vscode.Uri.file(file);
        const stat = await vscode.workspace.fs.stat(uri);
        if (!(stat.type & vscode.FileType.File)) { throw new Error('The tracked path is not a file.'); }
        const document = await vscode.workspace.openTextDocument(uri);
        const line = isCodeEntity ? findAnnotationLine(document.getText(), entity) : undefined;
        if (isCodeEntity && line === undefined) {
            throw new Error('The code annotation was not found in the tracked file. The graph may need syncing.');
        }
        const editor = await vscode.window.showTextDocument(document, line === undefined ? {} : {
            selection: new vscode.Range(line, 0, line, 0)
        });
        if (line !== undefined) {
            const top = Math.max(0, line - 5);
            editor.revealRange(new vscode.Range(top, 0, top, 0), vscode.TextEditorRevealType.AtTop);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Zef: Could not open entity: ${error instanceof Error ? error.message : String(error)}. The graph may need syncing, or the CLI path may need configuring.`);
    }
}
