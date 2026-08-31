<!-- +++
ET.SvelteFile('🍃-82158f3d48601ad977b9',
  tag_=[],
  created=Time('2026-05-15 16:38:11 +0800')
)
+++ -->

<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let {
    point,
    x = 0,
    y = 0,
    accent = 'emerald',
    xAxis = null,
    yAxis = null
  } = $props();

  const title = $derived(`${point.label ?? 'Point'}: ${point.x}${xAxis?.unit ? ` ${xAxis.unit}` : ''}, ${point.y}${yAxis?.unit ? ` ${yAxis.unit}` : ''}`);
</script>

<g class={`scatter-point-group accent-${point.emphasis ?? accent}`}>
  <circle class="scatter-point-halo" cx={x} cy={y} r={point.emphasis === 'highlight' ? 9 : 7} />
  <circle class="scatter-point" cx={x} cy={y} r={point.emphasis === 'highlight' ? 5.8 : 4.6}>
    <title>{title}</title>
  </circle>
</g>
