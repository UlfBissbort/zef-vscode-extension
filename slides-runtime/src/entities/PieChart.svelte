<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import PieSegment from './PieSegment.svelte';

  let { node } = $props();

  const geometry = { size: 300, center: 150, outerRadius: 116, innerRadius: 68 };

  function segments(chartNode) {
    return (chartNode.content_ ?? []).filter((child) => child?.__type === 'ET.PieSegment');
  }

  function totalValue(chartNode) {
    return segments(chartNode).reduce((total, segment) => total + (segment.value ?? 0), 0);
  }

  function polarPoint(radius, angle) {
    const radians = ((angle - 90) * Math.PI) / 180;
    return {
      x: geometry.center + radius * Math.cos(radians),
      y: geometry.center + radius * Math.sin(radians)
    };
  }

  function donutPath(startAngle, endAngle) {
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    const outerStart = polarPoint(geometry.outerRadius, startAngle);
    const outerEnd = polarPoint(geometry.outerRadius, endAngle);
    const innerEnd = polarPoint(geometry.innerRadius, endAngle);
    const innerStart = polarPoint(geometry.innerRadius, startAngle);

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${geometry.outerRadius} ${geometry.outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${geometry.innerRadius} ${geometry.innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      'Z'
    ].join(' ');
  }

  const total = $derived(totalValue(node));
  const slices = $derived.by(() => {
    let angle = 0;
    return segments(node).map((segment) => {
      const value = segment.value ?? 0;
      const percent = total === 0 ? 0 : (value / total) * 100;
      const sweep = total === 0 ? 0 : (value / total) * 360;
      const startAngle = angle;
      const endAngle = angle + sweep;
      angle = endAngle;
      return {
        ...segment,
        percent,
        path: donutPath(startAngle, endAngle)
      };
    });
  });

  const primary = $derived(slices.find((slice) => slice.emphasis === 'primary') ?? slices[0]);
</script>

<section class="pie-panel reveal">
  <header class="pie-header">
    <div>
      <p>{node.measure ?? 'Share'} by {node.dimension ?? 'category'}</p>
      <h3>{node.title}</h3>
      {#if node.subtitle}<span>{node.subtitle}</span>{/if}
    </div>
    <div class="pie-source">
      <strong>{node.source?.sampleSize ?? total}</strong>
      <span>{node.source?.label ?? 'total'}</span>
    </div>
  </header>

  <div class="pie-body">
    <svg class="pie-chart" viewBox={`0 0 ${geometry.size} ${geometry.size}`} role="img" aria-label={node.title}>
      <circle class="pie-track" cx={geometry.center} cy={geometry.center} r={geometry.outerRadius} />
      {#each slices as slice, index (slice.label ?? index)}
        <PieSegment {slice} unit={node.unit ?? ''} />
      {/each}
      <circle class="pie-core" cx={geometry.center} cy={geometry.center} r={geometry.innerRadius - 2} />
      <text class="pie-core-value" x={geometry.center} y={geometry.center - 4}>{primary?.percent.toFixed(0) ?? 0}%</text>
      <text class="pie-core-label" x={geometry.center} y={geometry.center + 20}>{primary?.label ?? 'primary'}</text>
    </svg>

    <div class="pie-label-rail">
      {#each slices as slice, index (slice.label ?? index)}
        <div class="pie-label-row" class:primary={slice.emphasis === 'primary'}>
          <span class={`pie-swatch accent-${slice.accent ?? 'emerald'}`}></span>
          <span class="pie-label-name">{slice.label}</span>
          <span class="pie-label-percent">{slice.percent.toFixed(1)}%</span>
          <span class="pie-label-value">{slice.value}{node.unit ?? ''}</span>
        </div>
      {/each}
    </div>
  </div>

  <div class="pie-footer">
    <span>{node.encoding ?? 'area encodes part-to-whole share'}</span>
    <div>
      {#each node.annotations ?? [] as annotation, index (index)}
        <strong>{annotation.label}: {annotation.value}</strong>
      {/each}
    </div>
  </div>
</section>
