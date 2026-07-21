<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import DataPoint from './DataPoint.svelte';

  let {
    series,
    xScale,
    yScale,
    xAxis = null,
    yAxis = null
  } = $props();

  const points = $derived(series?.content_ ?? []);
  const accent = $derived(series?.accent ?? 'emerald');
</script>

<g class="scatter-series" aria-label={series?.label ?? 'Point series'}>
  {#each points as point, index (index)}
    <DataPoint
      {point}
      x={xScale(point.x)}
      y={yScale(point.y)}
      {accent}
      {xAxis}
      {yAxis}
    />
  {/each}
</g>
