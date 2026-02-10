/**
 * Svelte Component Compiler (Client-Side Bundled)
 * 
 * Compiles Svelte components to fully interactive client-side HTML.
 * Uses Bun's bundler to create a self-contained IIFE with Svelte runtime.
 * 
 * Usage:
 *   echo '<script>let x = 1</script><p>{x}</p>' | bun run compiler.ts
 * 
 * Output:
 *   JSON object: { success: boolean, html?: string, error?: string, compileTime: string }
 */

import { compile } from 'svelte/compiler';
import * as fs from 'fs';
import * as path from 'path';

interface ErrorDetails {
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  frame?: string;
  code?: string;
}

interface CompileResult {
  success: boolean;
  html?: string;
  error?: string;
  errorDetails?: ErrorDetails;
  compileTime: string;
}

/**
 * Compile a Svelte component to a self-contained HTML document with bundled runtime
 */
async function compileSvelteClient(source: string): Promise<CompileResult> {
  const compileStart = performance.now();
  
  // Get the extension's root directory (parent of svelte-compiler/)
  const extensionRoot = path.dirname(__dirname);
  const tempDir = path.join(extensionRoot, '.svelte-temp');
  
  // Ensure temp dir exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const tempId = `svelte-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const componentFile = path.join(tempDir, `${tempId}.js`);
  const entryFile = path.join(tempDir, `${tempId}-entry.js`);
  const outFile = path.join(tempDir, `${tempId}-bundle.js`);
  
  try {
    // Step 1: Compile Svelte source to client-side JS
    const compiled = compile(source, {
      generate: 'client',
      css: 'injected',
      name: 'Component'
    });
    
    // Step 2: Write compiled component to temp file
    fs.writeFileSync(componentFile, compiled.js.code);
    
    // Step 3: Write entry point that mounts the component
    const entryCode = `
import { mount } from 'svelte';
import Component from './${tempId}.js';

// Mount on DOMContentLoaded or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  const target = document.getElementById('app') || document.body;
  mount(Component, { target });
}
`;
    fs.writeFileSync(entryFile, entryCode);
    
    // Step 4: Bundle with Bun (includes Svelte runtime)
    const buildResult = await Bun.build({
      entrypoints: [entryFile],
      outdir: tempDir,
      naming: `${tempId}-bundle.js`,
      target: 'browser',
      format: 'iife',
      minify: true,
    });
    
    if (!buildResult.success) {
      const errors = buildResult.logs.map(l => l.message).join('\n');
      throw new Error(`Bundle failed: ${errors}`);
    }
    
    // Step 5: Read the bundled output
    const bundledCode = fs.readFileSync(outFile, 'utf-8');
    
    const compileEnd = performance.now();
    const compileTime = (compileEnd - compileStart).toFixed(2);
    
    // Step 6: Create the full HTML document
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body { 
      margin: 0; 
      padding: 16px; 
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      background: #1e1e1e;
      color: #d4d4d4;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
${bundledCode}
  </script>
</body>
</html>`;
    
    return {
      success: true,
      html,
      compileTime
    };
    
  } catch (error: any) {
    const compileEnd = performance.now();
    const result: CompileResult = {
      success: false,
      error: error.message || String(error),
      compileTime: (compileEnd - compileStart).toFixed(2)
    };

    // Extract detailed location info from Svelte compiler errors
    if (error.start || error.position !== undefined || error.frame || error.code) {
      result.errorDetails = {};
      if (error.start) {
        result.errorDetails.line = error.start.line;
        result.errorDetails.column = error.start.column;
      }
      if (error.end) {
        result.errorDetails.endLine = error.end.line;
        result.errorDetails.endColumn = error.end.column;
      }
      if (error.frame) {
        result.errorDetails.frame = error.frame;
      }
      if (error.code) {
        result.errorDetails.code = error.code;
      }
    }

    return result;
  } finally {
    // Cleanup temp files
    try {
      if (fs.existsSync(componentFile)) fs.unlinkSync(componentFile);
      if (fs.existsSync(entryFile)) fs.unlinkSync(entryFile);
      if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
    } catch {
      // Ignore cleanup errors
    }
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
  
  const result = await compileSvelteClient(source);
  console.log(JSON.stringify(result));
}

main();
