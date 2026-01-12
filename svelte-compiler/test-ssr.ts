// Test script for Svelte SSR compilation
import { compile } from 'svelte/compiler';
import * as svelteServer from 'svelte/internal/server';

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
  const compiled = compile(source, { 
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
  const htmlParts: string[] = [];
  const cssSet = new Set<{hash: string, code: string}>();
  
  const mockRenderer = {
    push: (s: string) => htmlParts.push(s),
    global: {
      css: {
        add: (css: {hash: string, code: string}) => cssSet.add(css)
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
