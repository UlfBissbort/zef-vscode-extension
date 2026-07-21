<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import PointSeries from './PointSeries.svelte';

  let { node } = $props();

  const viewBox = { width: 640, height: 430, left: 72, right: 36, top: 34, bottom: 72 };
  const plotWidth = viewBox.width - viewBox.left - viewBox.right;
  const plotHeight = viewBox.height - viewBox.top - viewBox.bottom;

  function seriesList(plotNode) {
    return (plotNode.content_ ?? []).filter((child) => child?.__type === 'ET.PointSeries');
  }

  function allPoints(plotNode) {
    return seriesList(plotNode).flatMap((series) => series.content_ ?? []);
  }

  function axisDomain(axis, values, padding = 0) {
    if (axis?.domain) return axis.domain;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return [min - padding, max + padding];
  }

  const points = $derived(allPoints(node));
  const xDomain = $derived(axisDomain(node.xAxis, points.map((point) => point.x), 0.05));
  const yDomain = $derived(axisDomain(node.yAxis, points.map((point) => point.y), 1));
  const sampleSize = $derived(node.source?.sampleSize ?? points.length);

  function scale(value, domain, rangeStart, rangeEnd) {
    const [domainStart, domainEnd] = domain;
    if (domainEnd === domainStart) return (rangeStart + rangeEnd) / 2;
    const ratio = (value - domainStart) / (domainEnd - domainStart);
    return rangeStart + ratio * (rangeEnd - rangeStart);
  }

  function xScale(value) {
    return scale(value, xDomain, viewBox.left, viewBox.left + plotWidth);
  }

  function yScale(value) {
    return scale(value, yDomain, viewBox.top + plotHeight, viewBox.top);
  }

  function linePath(line) {
    if (!line) return '';
    return `M ${xScale(line.from.x)} ${yScale(line.from.y)} L ${xScale(line.to.x)} ${yScale(line.to.y)}`;
  }

  function ticks(domain, count = 4) {
    const [start, end] = domain;
    return Array.from({ length: count }, (_, index) => start + ((end - start) * index) / (count - 1));
  }

  function formatTick(value) {
    return Number.isInteger(value) ? value : value.toFixed(1);
  }

  function labelX(point) {
    const x = xScale(point.x);
    if (x > viewBox.width - 78) return x - 10;
    return x + 10;
  }

  function labelY(point) {
    const y = yScale(point.y);
    if (y < viewBox.top + 18) return y + 18;
    return y - 10;
  }

  function labelAnchor(point) {
    return xScale(point.x) > viewBox.width - 78 ? 'end' : 'start';
  }
</script>

<section class="scatter-panel reveal">
  <header class="scatter-header">
    <div>
      <p>{node.yAxis?.label ?? 'Y'} by {node.xAxis?.label ?? 'X'}</p>
      <h3>{node.title}</h3>
      {#if node.subtitle}<span>{node.subtitle}</span>{/if}
    </div>
    <div class="scatter-source">
      <strong>{sampleSize}</strong>
      <span>{node.source?.label ?? 'points'}</span>
    </div>
  </header>

  <svg class="scatter-chart" viewBox={`0 0 ${viewBox.width} ${viewBox.height}`} role="img" aria-label={node.title}>
    <defs>
      <filter id="scatter-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <rect class="scatter-plot-bg" x={viewBox.left} y={viewBox.top} width={plotWidth} height={plotHeight} rx="14" />

    {#each ticks(yDomain) as tick (tick)}
      <line class="scatter-grid-line" x1={viewBox.left} x2={viewBox.left + plotWidth} y1={yScale(tick)} y2={yScale(tick)} />
      <text class="scatter-y-tick" x={viewBox.left - 14} y={yScale(tick) + 5}>{formatTick(tick)}</text>
    {/each}

    {#each ticks(xDomain) as tick (tick)}
      <line class="scatter-grid-line vertical" x1={xScale(tick)} x2={xScale(tick)} y1={viewBox.top} y2={viewBox.top + plotHeight} />
      <text class="scatter-x-tick" x={xScale(tick)} y={viewBox.top + plotHeight + 28}>{formatTick(tick)}</text>
    {/each}

    <path class="scatter-axis" d={`M ${viewBox.left} ${viewBox.top} V ${viewBox.top + plotHeight} H ${viewBox.left + plotWidth}`} />

    <text class="scatter-axis-label scatter-axis-label--x" x={viewBox.left + plotWidth / 2} y={viewBox.height - 12}>
      {node.xAxis?.label ?? 'X'}{node.xAxis?.unit ? ` (${node.xAxis.unit})` : ''}
    </text>
    <text
      class="scatter-axis-label scatter-axis-label--y"
      x={-(viewBox.top + plotHeight / 2)}
      y="18"
      transform="rotate(-90)"
    >
      {node.yAxis?.label ?? 'Y'}{node.yAxis?.unit ? ` (${node.yAxis.unit})` : ''}
    </text>

    {#if node.trendLine}
      <path class="scatter-trend" d={linePath(node.trendLine)} />
    {/if}

    {#each seriesList(node) as series, index (series.label ?? index)}
      <PointSeries {series} {xScale} {yScale} xAxis={node.xAxis} yAxis={node.yAxis} />
    {/each}

    {#each points.filter((point) => point.label) as point, index (index)}
      <text class="scatter-point-label" x={labelX(point)} y={labelY(point)} text-anchor={labelAnchor(point)}>{point.label}</text>
    {/each}
  </svg>

  <div class="scatter-footer">
    <span>{node.encoding ?? 'point position encodes two continuous variables'}</span>
    <div>
      {#each node.annotations ?? [] as annotation, index (index)}
        <strong>{annotation.label}: {annotation.value}</strong>
      {/each}
    </div>
  </div>
</section>
