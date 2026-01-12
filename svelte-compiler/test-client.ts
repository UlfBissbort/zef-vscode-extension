import { compile } from 'svelte/compiler';

const source = `<script>
  let count = 0;
</script>
<button on:click={() => count++}>
  Count: {count}
</button>
<style>
  button { background: #ff3e00; color: white; padding: 12px; }
</style>`;

const result = compile(source, {
  generate: 'client',
  css: 'injected',
  name: 'Component'
});

console.log("=== JS CODE ===");
console.log(result.js.code);
console.log("\n=== CSS ===");
console.log(result.css?.code || '(css injected in JS)');
