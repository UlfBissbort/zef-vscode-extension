<!-- +++
ET.SvelteFile('🍃-a834fdc971c369d4d58b',
  tag_=[],
  created=Time('2026-05-15 16:38:11 +0800')
)
+++ -->

<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();
</script>

<article class={`measurement-card trend-${node.trend ?? 'neutral'} reveal`}>
  <span>{node.label}</span>
  <strong>{node.value}</strong>
</article>
