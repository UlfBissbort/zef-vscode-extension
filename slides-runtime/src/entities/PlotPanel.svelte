<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();
</script>

<section class="plot-panel reveal">
  <header>{node.title}</header>
  <svg viewBox="0 0 240 170" fill="none" preserveAspectRatio="none" aria-label={node.title}>
    <path class="plot-grid" d="M20 20V145H225M20 112H225M20 79H225M20 46H225M71 20V145M122 20V145M173 20V145" />
    {#each node.bands ?? [] as band, index (index)}
      <rect class={`plot-band band-${index}`} x={band.center - band.width / 2} y="20" width={band.width} height="125" rx="3" />
      <text x={band.center} y={index === 0 ? 38 : 56}>{band.label}</text>
    {/each}
    <path class="plot-curve" d={node.curve} />
    <path class="plot-axis" d="M20 20V145H225" />
  </svg>
  <div class="plot-labels">
    <span>{node.yLabel}</span>
    <span>{node.xLabel}</span>
  </div>
  <p>{node.annotation}</p>
</section>
