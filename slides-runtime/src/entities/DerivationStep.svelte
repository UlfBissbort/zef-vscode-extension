<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();
</script>

<div class="derivation-step">
  <span class="derivation-step__index">{node.index}</span>
  <div>
    <p>{node.statement}</p>
    <code>{node.equation}</code>
  </div>
</div>
