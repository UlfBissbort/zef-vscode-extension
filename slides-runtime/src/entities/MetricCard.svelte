<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();
</script>

<article class={`metric-card accent-${node.accent ?? 'purple'} reveal`}>
  <div class="metric-card__glow"></div>
  <div class="metric-card__value">{node.value}</div>
  <div class="metric-card__label">{node.label}</div>
  <p class="metric-card__description">{node.description}</p>
  {#if node.sparkline}
    <svg class="sparkline" viewBox="0 0 200 40" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <path d={node.sparkline} stroke="currentColor" stroke-width="1.5" fill="none" />
      <path d={`${node.sparkline} V40 H0 Z`} fill="currentColor" opacity="0.08" />
    </svg>
  {/if}
</article>
