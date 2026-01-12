/**
 * Svelte Client Compiler - Bundles component with runtime for browser
 * 
 * Uses Bun's bundler to create a self-contained script that can run in any browser.
 */

import { compile } from 'svelte/compiler';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface CompileResult {
  success: boolean;
  html?: string;  // Full HTML document with bundled script
  error?: string;
  compileTime: string;
}

async function compileSvelteClient(source: string): Promise<CompileResult> {
  const compileStart = performance.now();
  
  try {
    // Step 1: Compile to client-side JS
    const compiled = compile(source, {
      generate: 'client',
      css: 'injected',
      name: 'Component'
    });
    
    // Step 2: Write compiled code to temp file IN the project directory
    // This is important so Bun can find node_modules/svelte
    const projectDir = path.dirname(__dirname);  // /Users/.../zef-vscode-extension
    const tempDir = path.join(projectDir, '.svelte-temp');
    
    // Ensure temp dir exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempId = `svelte-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const componentFile = path.join(tempDir, `${tempId}.js`);
    const entryFile = path.join(tempDir, `${tempId}-entry.js`);
    const outFile = path.join(tempDir, `${tempId}-bundle.js`);
    
    // Write the compiled component
    fs.writeFileSync(componentFile, compiled.js.code);
    
    // Write entry point that imports and mounts the component
    const entryCode = `
      import { mount } from 'svelte';
      import Component from './${tempId}.js';
      
      // Wait for DOM
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
    
    // Step 3: Bundle with Bun
    console.log('Entry file:', entryFile);
    console.log('Component file:', componentFile);
    
    // Get the extension's node_modules path for svelte resolution
    const extensionRoot = path.dirname(__dirname);
    
    let buildResult: Awaited<ReturnType<typeof Bun.build>>;
    try {
      buildResult = await Bun.build({
        entrypoints: [entryFile],
        outdir: tempDir,
        naming: `${tempId}-bundle.js`,
        target: 'browser',
        format: 'iife',
        minify: false,  // Disable minify for debugging
        // Tell Bun where to find node_modules
        packages: 'bundle',
        external: [],
      });
    } catch (buildError: any) {
      console.error('Build threw error:', buildError);
      throw buildError;
    }
    
    console.log('Build success:', buildResult.success);
    if (buildResult.logs && buildResult.logs.length > 0) {
      for (const log of buildResult.logs) {
        console.log('Log:', log);
      }
    }
    if (buildResult.outputs && buildResult.outputs.length > 0) {
      for (const out of buildResult.outputs) {
        console.log('Output:', out.path);
      }
    }
    
    if (!buildResult.success) {
      const errors = buildResult.logs.map(l => `${l.message}`).join('\n');
      throw new Error(`Bundle failed:\n${errors}`);
    }
    
    // Step 4: Read the bundled output
    const bundledCode = fs.readFileSync(outFile, 'utf-8');
    
    // Cleanup temp files
    try {
      fs.unlinkSync(componentFile);
      fs.unlinkSync(entryFile);
      fs.unlinkSync(outFile);
    } catch {}
    
    const compileEnd = performance.now();
    const compileTime = (compileEnd - compileStart).toFixed(2);
    
    // Step 5: Create the full HTML document
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
      font-family: system-ui, -apple-system, sans-serif;
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
    return {
      success: false,
      error: error.message || String(error),
      compileTime: (compileEnd - compileStart).toFixed(2)
    };
  }
}

// Test
async function main() {
  const source = `<script>
  let count = 0;
</script>

<button on:click={() => count++}>
  Count: {count}
</button>

<style>
  button {
    background: #ff3e00;
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
  }
  button:hover {
    background: #ff5722;
  }
</style>`;

  console.log('Compiling...');
  const result = await compileSvelteClient(source);
  
  if (result.success) {
    console.log(`Compiled in ${result.compileTime}ms`);
    console.log(`Output size: ${result.html!.length} bytes`);
    
    // Write to test file
    fs.writeFileSync('/Users/ulf/dev/zef-vscode-extension/test-bundled.html', result.html!);
    console.log('Wrote to test-bundled.html');
  } else {
    console.error('Error:', result.error);
  }
}

main();
