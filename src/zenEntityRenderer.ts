/* +++
ET.TypeScriptFile('🍃-e191320a149ba6cf7b84',
  tag_=[],
  created=Time('2026-08-15 11:09:48 +0800')
)
+++ */

import { spawn } from 'child_process';

const evaluationCache = new Map<string, Promise<Record<string, unknown> | null>>();

/** Convert JSON-style literals to their Python/Zef spelling without touching quoted text. */
function normaliseJsonLiteralsForZen(source: string): string {
    let result = '';
    let quote = '';
    let escaped = false;

    for (let index = 0; index < source.length; index += 1) {
        const character = source[index];
        if (quote) {
            result += character;
            if (escaped) escaped = false;
            else if (character === '\\') escaped = true;
            else if (character === quote) quote = '';
            continue;
        }
        if (character === "'" || character === '"') {
            quote = character;
            result += character;
            continue;
        }
        const remaining = source.slice(index);
        if (/^true\b/.test(remaining)) {
            result += 'True';
            index += 3;
        } else if (/^false\b/.test(remaining)) {
            result += 'False';
            index += 4;
        } else if (/^null\b/.test(remaining)) {
            result += 'None';
            index += 3;
        } else {
            result += character;
        }
    }
    return result;
}

/**
 * Convert a constructor-only Zen entity or Graph expression into the
 * JSON-shaped value consumed by the component dispatcher. Other Zef source is never run.
 */
export function evaluateZenEntityToJson(source: string): Promise<Record<string, unknown> | null> {
    const expression = source.trim();
    if (!expression.startsWith('ET.') && !/^Graph\s*\(/.test(expression)) return Promise.resolve(null);

    const cached = evaluationCache.get(expression);
    if (cached) return cached;

    const evaluation = new Promise<Record<string, unknown> | null>(resolve => {
        const process = spawn('zef', ['eval', '-'], { stdio: ['pipe', 'pipe', 'pipe'] });
        let stdout = '';

        process.stdout.on('data', chunk => { stdout += chunk.toString(); });
        process.on('error', () => resolve(null));
        process.on('close', code => {
            if (code !== 0) return resolve(null);
            try {
                const value = JSON.parse(stdout) as unknown;
                resolve(value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null);
            } catch {
                resolve(null);
            }
        });

        process.stdin.write(`${normaliseJsonLiteralsForZen(expression)} | to_json_like | to_json | collect\n`);
        process.stdin.end();

        setTimeout(() => {
            process.kill();
            resolve(null);
        }, 10_000);
    });

    evaluationCache.set(expression, evaluation);
    return evaluation;
}
