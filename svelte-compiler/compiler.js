"use strict";
/**
 * Svelte Component Compiler
 *
 * A Bun script that compiles Svelte components to HTML using SSR.
 *
 * Usage:
 *   echo '<script>let x = 1</script><p>{x}</p>' | bun run compiler.ts
 *
 * Output:
 *   JSON object: { success: boolean, html?: string, error?: string, compileTime: string }
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const compiler_1 = require("svelte/compiler");
const svelteServer = __importStar(require("svelte/internal/server"));
/**
 * Create a mock renderer that collects HTML and CSS output
 */
function createRenderer() {
    const htmlParts = [];
    const cssSet = new Set();
    const renderer = {
        push: (s) => htmlParts.push(s),
        global: {
            css: {
                add: (css) => cssSet.add(css)
            }
        }
    };
    return {
        renderer,
        getHtml: () => htmlParts.join(''),
        getCss: () => Array.from(cssSet).map(c => c.code).join('\n')
    };
}
/**
 * Compile a Svelte component source to HTML
 */
function compileSvelteComponent(source) {
    const compileStart = performance.now();
    try {
        // Compile to SSR
        const compiled = (0, compiler_1.compile)(source, {
            generate: 'server',
            css: 'injected',
            name: 'Component'
        });
        const compileEnd = performance.now();
        const compileTime = (compileEnd - compileStart).toFixed(2);
        // Transform the compiled code for execution:
        // 1. Remove the import statement
        // 2. Change "export default function X" to "const X = function"
        let executableCode = compiled.js.code
            .replace(/import \* as \$ from ['"]svelte\/internal\/server['"];?\n?/, '')
            .replace(/export default function (\w+)/, 'const $1 = function');
        // Create a function that returns the component
        const createComponent = new Function('$', `
      ${executableCode}
      return Component;
    `);
        // Get the component function with svelte internals bound
        const Component = createComponent(svelteServer);
        // Create renderer and execute component
        const { renderer, getHtml, getCss } = createRenderer();
        Component(renderer);
        // Combine CSS and HTML
        const css = getCss();
        const html = getHtml();
        const fullHtml = css ? `<style>${css}</style>\n${html}` : html;
        return {
            success: true,
            html: fullHtml,
            compileTime
        };
    }
    catch (error) {
        const compileEnd = performance.now();
        return {
            success: false,
            error: error.message || String(error),
            compileTime: (compileEnd - compileStart).toFixed(2)
        };
    }
}
// Main: read from stdin, compile, output JSON
async function main() {
    const source = await Bun.stdin.text();
    if (!source.trim()) {
        console.log(JSON.stringify({
            success: false,
            error: 'Empty input',
            compileTime: '0'
        }));
        return;
    }
    const result = compileSvelteComponent(source);
    console.log(JSON.stringify(result));
}
main();
//# sourceMappingURL=compiler.js.map