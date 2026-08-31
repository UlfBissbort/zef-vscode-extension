<!-- +++
ET.SvelteFile('🍃-4ebec5dae64c021fbc0d',
  tag_=[],
  created=Time('2026-05-15 16:38:11 +0800')
)
+++ -->

<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { slice, unit = '%' } = $props();

  const title = $derived(`${slice.label}: ${slice.value}${unit} (${slice.percent.toFixed(1)}%)`);
</script>

<path
  class={`pie-segment accent-${slice.accent ?? 'emerald'}`}
  class:emphasis={slice.emphasis === 'primary'}
  d={slice.path}
>
  <title>{title}</title>
</path>
