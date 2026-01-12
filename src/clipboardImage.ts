/**
 * Clipboard Image Handler
 * 
 * Provides functionality to paste images from clipboard into .zef.md files.
 * Similar to Obsidian's image paste behavior.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';

/**
 * Generate a filename for a pasted image.
 * This function can be customized to change the naming convention.
 * 
 * @returns The filename (without path) for the pasted image
 */
export function generateImageFilename(): string {
    const timestamp = Date.now();
    return `pasted_${timestamp}.png`;
}

/**
 * Check if clipboard contains an image on macOS and save it to the specified path.
 * Uses AppleScript to access the system clipboard.
 * 
 * @param outputPath The full path where the image should be saved
 * @returns Promise resolving to true if image was saved, false if no image in clipboard
 */
export async function getClipboardImageMac(outputPath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        // AppleScript to extract PNG image from clipboard
        const script = `
            try
                set theImage to the clipboard as «class PNGf»
                set theFile to open for access POSIX file "${outputPath}" with write permission
                write theImage to theFile
                close access theFile
                return "success"
            on error errMsg
                return "no_image"
            end try
        `;

        const proc = spawn('osascript', ['-e', script]);
        
        let stdout = '';
        let stderr = '';
        
        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        proc.on('close', (code) => {
            const result = stdout.trim();
            if (result === 'success') {
                resolve(true);
            } else {
                resolve(false);
            }
        });
        
        proc.on('error', (err) => {
            console.error('[Zef ClipboardImage] Error running osascript:', err);
            reject(err);
        });
    });
}

/**
 * Handle paste image command.
 * Extracts image from clipboard, saves it, and inserts markdown link.
 * 
 * @param editor The active text editor
 * @returns Promise resolving to true if image was pasted, false otherwise
 */
export async function handlePasteImage(editor: vscode.TextEditor): Promise<boolean> {
    // Verify we're in a .zef.md file
    if (!editor.document.fileName.endsWith('.zef.md')) {
        vscode.window.showWarningMessage('Zef: Image paste only works in .zef.md files');
        return false;
    }

    // Get the directory of the current document
    const documentPath = editor.document.uri.fsPath;
    const documentDir = path.dirname(documentPath);
    
    // Generate filename and full path
    const filename = generateImageFilename();
    const imagePath = path.join(documentDir, filename);
    
    try {
        // Check if we're on macOS
        if (process.platform !== 'darwin') {
            vscode.window.showWarningMessage('Zef: Image paste currently only supported on macOS');
            return false;
        }
        
        // Try to extract image from clipboard
        const hasImage = await getClipboardImageMac(imagePath);
        
        if (!hasImage) {
            // No image in clipboard, fall back to normal paste
            return false;
        }
        
        // Verify file was created
        if (!fs.existsSync(imagePath)) {
            vscode.window.showErrorMessage('Zef: Failed to save image from clipboard');
            return false;
        }
        
        // Insert markdown image link at cursor position
        const imageMarkdown = `![](${filename})`;
        
        await editor.edit(editBuilder => {
            // Insert at cursor position
            editBuilder.insert(editor.selection.active, imageMarkdown);
        });
        
        vscode.window.showInformationMessage(`Zef: Image saved as ${filename}`);
        return true;
        
    } catch (error) {
        console.error('[Zef ClipboardImage] Error:', error);
        vscode.window.showErrorMessage(`Zef: Failed to paste image - ${error}`);
        return false;
    }
}

/**
 * Register the paste image command.
 * Should be called from extension.ts activate function.
 */
export function registerPasteImageCommand(context: vscode.ExtensionContext): void {
    const command = vscode.commands.registerCommand('zef.pasteImage', async () => {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            return;
        }
        
        const success = await handlePasteImage(editor);
        
        if (!success) {
            // Fall back to normal paste behavior
            await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
        }
    });
    
    context.subscriptions.push(command);
}
