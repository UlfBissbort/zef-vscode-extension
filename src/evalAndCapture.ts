/**
 * Pure function: evaluate a JS/TS code string and capture all declared variables.
 * Separates JSON-serializable variables from non-serializable ones.
 *
 * Uses regex for variable extraction (no runtime dependency on the typescript package).
 * False positives (e.g. variables inside function bodies) are handled gracefully
 * by the try/catch in the capture code — out-of-scope variables silently fail.
 */

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface NonSerializableInfo {
    name: string;
    type: string;
    constructorName?: string;
}

export interface CaptureResult {
    variables: Record<string, JsonValue>;
    nonSerializable: NonSerializableInfo[];
    error: { name: string; message: string } | null;
}

/**
 * Extract declared variable names from JS/TS code via regex.
 * Handles: const/let/var, function, class, basic destructuring.
 *
 * Known limitations (all handled safely by try/catch at capture time):
 * - May pick up declarations inside function bodies / nested blocks
 * - Does not handle complex nested destructuring
 * - May pick up declarations inside comments
 */
export function extractDeclaredVariables(code: string): string[] {
    const names: string[] = [];

    // const/let/var name (with optional TS type annotation)
    for (const m of code.matchAll(/(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+(\w+)/g)) {
        names.push(m[1]);
    }

    // Object destructuring: const { a, b: renamed } = ...
    for (const m of code.matchAll(/(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+\{([^}]+)\}/g)) {
        for (const part of m[1].split(',')) {
            const t = part.trim();
            if (t.includes(':')) {
                const renamed = t.split(':').pop()!.trim();
                if (/^\w+$/.test(renamed)) names.push(renamed);
            } else if (/^\w+$/.test(t)) {
                names.push(t);
            }
        }
    }

    // Array destructuring: const [a, b] = ...
    for (const m of code.matchAll(/(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+\[([^\]]+)\]/g)) {
        for (const part of m[1].split(',')) {
            const t = part.trim();
            if (/^\w+$/.test(t)) names.push(t);
        }
    }

    // function declarations
    for (const m of code.matchAll(/(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/g)) {
        names.push(m[1]);
    }

    // class declarations
    for (const m of code.matchAll(/(?:^|\n)\s*(?:export\s+)?class\s+(\w+)/g)) {
        names.push(m[1]);
    }

    return [...new Set(names)].filter(n => !n.startsWith('__zef'));
}

const MAX_JSON_SIZE = 1_000_000; // 1MB per variable

/**
 * Evaluate a JS code string, capture all declared variables, and classify them.
 * Returns JSON-serializable variables in `variables`, everything else in `nonSerializable`.
 * If the code throws, the error is returned but no variables are captured.
 *
 * Note: This uses `new AsyncFunction()` which expects JavaScript, not TypeScript.
 * For TS code, strip type annotations first (e.g. via Bun.Transpiler).
 */
export async function evalAndCapture(code: string): Promise<CaptureResult> {
    const varNames = extractDeclaredVariables(code);

    // Build collection code: one try/catch per variable so each is independent
    const collectionLines = varNames.map(n =>
        `  try { __zef_all["${n}"] = ${n}; } catch {}`
    ).join('\n');

    // Wrap user code in try/catch. Collection code is INSIDE the try block
    // so it has access to const/let declarations in the same block scope.
    const wrappedCode = `
  const __zef_all = Object.create(null);
  let __zef_error = null;
  try {
${code}
${collectionLines}
  } catch(__zef_e) {
    __zef_error = __zef_e;
  }
  return { __zef_all, __zef_error };`;

    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

    let allVars: Record<string, any>;
    let evalError: any;

    try {
        const result = await new AsyncFunction(wrappedCode)();
        allVars = result.__zef_all;
        evalError = result.__zef_error;
    } catch (e: any) {
        // Shouldn't happen (our try/catch wrapper should catch everything),
        // but handle it just in case (e.g. syntax error in user code)
        return {
            variables: {},
            nonSerializable: [],
            error: { name: e.name || 'Error', message: e.message || String(e) }
        };
    }

    // Classify each captured variable
    const variables: Record<string, JsonValue> = {};
    const nonSerializable: NonSerializableInfo[] = [];

    for (const name of Object.keys(allVars)) {
        const value = allVars[name];

        if (value === undefined) {
            nonSerializable.push({ name, type: 'undefined' });
            continue;
        }

        try {
            const json = JSON.stringify(value);
            if (json === undefined) {
                // JSON.stringify returns undefined for functions, symbols, undefined
                nonSerializable.push({
                    name,
                    type: typeof value,
                    constructorName: value?.constructor?.name
                });
            } else if (json.length > MAX_JSON_SIZE) {
                nonSerializable.push({ name, type: typeof value, constructorName: '__TooLarge__' });
            } else {
                // Round-trip through JSON to ensure clean JSON types
                variables[name] = JSON.parse(json);
            }
        } catch {
            // JSON.stringify throws on circular references, BigInt, etc.
            nonSerializable.push({
                name,
                type: typeof value,
                constructorName: (value as any)?.constructor?.name
            });
        }
    }

    return {
        variables,
        nonSerializable,
        error: evalError
            ? { name: evalError.name || 'Error', message: evalError.message || String(evalError) }
            : null
    };
}
