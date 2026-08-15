import { spawn } from 'child_process';

const evaluationCache = new Map<string, Promise<Record<string, unknown> | null>>();

/**
 * Convert a constructor-only Zen entity expression into the JSON-shaped value
 * consumed by the component dispatcher. Non-entity Zef source is never run.
 */
export function evaluateZenEntityToJson(source: string): Promise<Record<string, unknown> | null> {
    const expression = source.trim();
    if (!expression.startsWith('ET.')) return Promise.resolve(null);

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

        process.stdin.write(`${expression} | to_json_like | to_json | collect\n`);
        process.stdin.end();

        setTimeout(() => {
            process.kill();
            resolve(null);
        }, 10_000);
    });

    evaluationCache.set(expression, evaluation);
    return evaluation;
}
