<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();
</script>

<article class={`measurement-card trend-${node.trend ?? 'neutral'} reveal`}>
  <span>{node.label}</span>
  <strong>{node.value}</strong>
</article>
