import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

export type SlideConversionResult =
    | { ok: true; deck: unknown }
    | { ok: false; kind: 'cli-not-found' | 'cli-failed' | 'timeout' | 'invalid-output'; message: string; detail?: string };

const CONVERSION_CODE = [
    'import os',
    "parse_zen(open(os.environ['ZEF_SLIDES_SOURCE_PATH']).read()) | to_json_like | to_json | collect"
].join('; ');

function conciseDetail(value: string): string {
    return value.trim().slice(0, 1200);
}

export async function resolveZefCli(env: NodeJS.ProcessEnv = process.env, homeDir = os.homedir()): Promise<string | null> {
    const executableName = process.platform === 'win32' ? 'zef.exe' : 'zef';
    const pathCandidates = (env.PATH ?? '').split(path.delimiter).filter(Boolean).map(directory => path.join(directory, executableName));
    const candidates = [
        ...pathCandidates,
        path.join(homeDir, '.local', 'bin', executableName),
        path.join(homeDir, '.cargo', 'bin', executableName)
    ];

    for (const candidate of [...new Set(candidates)]) {
        try {
            await fs.access(candidate, process.platform === 'win32' ? undefined : 1);
            return candidate;
        } catch {
            // Continue to the next explicit candidate.
        }
    }
    return null;
}

function runZef(executable: string, args: string[], env: NodeJS.ProcessEnv, timeoutMs: number): Promise<{ stdout: string; stderr: string; exitCode: number | null; timedOut: boolean }> {
    return new Promise((resolve, reject) => {
        const child = spawn(executable, args, { env, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
        let stdout = '';
        let stderr = '';
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            child.kill();
        }, timeoutMs);

        child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
        child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
        child.on('error', (error) => {
            clearTimeout(timer);
            reject(error);
        });
        child.on('close', (exitCode) => {
            clearTimeout(timer);
            resolve({ stdout, stderr, exitCode, timedOut });
        });
    });
}

export async function convertZenSlides(source: string, timeoutMs = 10_000): Promise<SlideConversionResult> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zef-slides-'));
    const sourcePath = path.join(tempDir, 'deck.zen');

    try {
        await fs.writeFile(sourcePath, source, 'utf8');
        const executable = await resolveZefCli();
        if (!executable) {
            return {
                ok: false,
                kind: 'cli-not-found',
                message: "Zef Slides requires the zef CLI, but it was not found on VS Code's PATH or in ~/.local/bin or ~/.cargo/bin. Install or repair Zef, then reload VS Code."
            };
        }

        let processResult;
        try {
            processResult = await runZef(executable, ['eval', '--quiet', CONVERSION_CODE], {
                ...process.env,
                ZEF_SLIDES_SOURCE_PATH: sourcePath
            }, timeoutMs);
        } catch (error: any) {
            if (error?.code === 'ENOENT') {
                return {
                    ok: false,
                    kind: 'cli-not-found',
                    message: "Zef Slides requires the zef CLI, but it was not found on VS Code's PATH. Install or repair Zef, then restart VS Code."
                };
            }
            return { ok: false, kind: 'cli-failed', message: 'Zef Slides could not start the zef CLI.', detail: String(error?.message ?? error) };
        }

        if (processResult.timedOut) {
            return { ok: false, kind: 'timeout', message: 'Zef Slides timed out while parsing the zef block.', detail: conciseDetail(processResult.stderr) };
        }
        if (processResult.exitCode !== 0) {
            return {
                ok: false,
                kind: 'cli-failed',
                message: 'Zef Slides could not parse this zef block. Check that it is valid Zen entity notation.',
                detail: conciseDetail(processResult.stderr || processResult.stdout)
            };
        }

        try {
            const deck = JSON.parse(processResult.stdout.trim());
            return { ok: true, deck };
        } catch (error: any) {
            return {
                ok: false,
                kind: 'invalid-output',
                message: 'Zef Slides received invalid JSON from the zef CLI.',
                detail: conciseDetail(`${error.message}\n${processResult.stdout}`)
            };
        }
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
}
