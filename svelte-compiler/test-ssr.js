"use strict";
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
// Test script for Svelte SSR compilation
const compiler_1 = require("svelte/compiler");
const svelteServer = __importStar(require("svelte/internal/server"));
async function testCompile() {
    // Component with script and style
    const source = `<script>
  let count = 0;
</script>

<button on:click={() => count++}>
  Clicked {count} times
</button>

<style>
  button {
    background: #333;
    color: #fff;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
  }
</style>`;
    console.log('Source:');
    console.log(source);
    console.log('---');
    // Compile to SSR
    const compiled = (0, compiler_1.compile)(source, {
        generate: 'server',
        name: 'TestComponent',
        css: 'injected'
    });
    console.log('Compiled code:');
    console.log(compiled.js.code);
    console.log('---');
    // CSS output
    console.log('CSS code:');
    console.log(compiled.css?.code || 'no CSS');
    console.log('---');
    // Create a function from the compiled code
    let codeWithoutImport = compiled.js.code
        .replace(/import \* as \$ from ['"]svelte\/internal\/server['"];?\n?/, '')
        .replace(/export default function (\w+)/, 'const $1 = function');
    // Create the component function with $ bound to svelteServer
    const createComponent = new Function('$', `
    ${codeWithoutImport}
    return TestComponent;
  `);
    const Component = createComponent(svelteServer);
    // Call the component with a proper mock renderer
    // that handles CSS collection
    const htmlParts = [];
    const cssSet = new Set();
    const mockRenderer = {
        push: (s) => htmlParts.push(s),
        global: {
            css: {
                add: (css) => cssSet.add(css)
            }
        }
    };
    Component(mockRenderer);
    // Collect CSS
    const cssCode = Array.from(cssSet).map(c => c.code).join('\n');
    const html = htmlParts.join('');
    console.log('CSS:', cssCode);
    console.log('HTML:', html);
    console.log('---');
    console.log('Full output:');
    if (cssCode) {
        console.log(`<style>${cssCode}</style>`);
    }
    console.log(html);
}
testCompile();
testCompile();
//# sourceMappingURL=test-ssr.js.map