<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();
</script>

<figure class="quote-panel reveal">
  <blockquote>{node.quote}</blockquote>
  {#if node.attribution}<figcaption>{node.attribution}</figcaption>{/if}
</figure>
