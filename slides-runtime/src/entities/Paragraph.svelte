<!-- +++
ET.SvelteFile('🍃-478350b8920108179bf9',
  tag_=[],
  created=Time('2026-05-15 16:38:11 +0800')
)
+++ -->

<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();
</script>

<p class={`s3__body ${node.role === 'hero-subtitle' ? 'hero-subtitle' : ''} reveal`}>{node.value}</p>
