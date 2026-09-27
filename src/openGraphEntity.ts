import { execFile } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { parseEntityInput, resolveGraphPath } from './graphEntityPath';

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
        const { stdout: tracking } = await execFileAsync(cli, ['graph', 'tracking', '--format', 'json'], options);
        const file = resolveGraphPath(show, tracking, entity);
        const uri = vscode.Uri.file(file);
        const stat = await vscode.workspace.fs.stat(uri);
        if (!(stat.type & vscode.FileType.File)) { throw new Error('The tracked path is not a file.'); }
        await vscode.window.showTextDocument(uri);
    } catch (error) {
        vscode.window.showErrorMessage(`Zef: Could not open entity: ${error instanceof Error ? error.message : String(error)}. The graph may need syncing, or the CLI path may need configuring.`);
    }
}
