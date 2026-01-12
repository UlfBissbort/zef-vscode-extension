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

import { compile } from 'svelte/compiler';
import * as svelteServer from 'svelte/internal/server';

interface CompileResult {
  success: boolean;
  html?: string;
  error?: string;
  compileTime: string;
}

interface CssItem {
  hash: string;
  code: string;
}

/**
 * Create a mock renderer that collects HTML and CSS output
 */
function createRenderer() {
  const htmlParts: string[] = [];
  const cssSet = new Set<CssItem>();
  
  const renderer = {
    push: (s: string) => htmlParts.push(s),
    global: {
      css: {
        add: (css: CssItem) => cssSet.add(css)
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
function compileSvelteComponent(source: string): CompileResult {
  const compileStart = performance.now();
  
  try {
    // Compile to SSR
    const compiled = compile(source, {
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
    
  } catch (error: any) {
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
