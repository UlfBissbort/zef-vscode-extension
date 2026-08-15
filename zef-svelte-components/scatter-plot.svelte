<!-- +++
this = "ET.SvelteComponent('🍃-03b38e22608c60bc15dc')"
tag_ = []
dispatched_on = "ET.ScatterPlot"
created = "Time('2026-08-15 09:22:40 +0800')"
[ns]
"ET.ScatterPlot" = "ET('13a9dc711f')"
"ET.LinePlot" = "ET('4576647567')"
+++ -->

<script>
  /**
   * A data-in, DOM-out scatter plot. Use it as:
   *
   * <ScatterPlot data={plot} />
   *
   * `data` is the ET.ScatterPlot-shaped value supplied by the caller.
   */
  export let data;

  const width = 720;
  const height = 440;
  const margin = { top: 34, right: 28, bottom: 62, left: 72 };
  const accentColors = {
    emerald: '#059669',
    blue: '#2563eb',
    violet: '#7c3aed',
    amber: '#d97706',
    rose: '#e11d48'
  };

  $: xDomain = data?.xAxis?.domain ?? [0, 1];
  $: yDomain = data?.yAxis?.domain ?? [0, 1];
  $: plotWidth = width - margin.left - margin.right;
  $: plotHeight = height - margin.top - margin.bottom;
  $: xSpan = xDomain[1] - xDomain[0] || 1;
  $: ySpan = yDomain[1] - yDomain[0] || 1;
  $: series = data?.content_ ?? [];
  $: annotations = data?.annotations ?? [];
  $: xTicks = ticks(xDomain);
  $: yTicks = ticks(yDomain);

  function ticks([min, max], count = 5) {
    const step = (max - min) / count;
    return Array.from({ length: count + 1 }, (_, index) => min + step * index);
  }

  function x(value) {
    return margin.left + ((value - xDomain[0]) / xSpan) * plotWidth;
  }

  function y(value) {
    return margin.top + plotHeight - ((value - yDomain[0]) / ySpan) * plotHeight;
  }

  function color(accent) {
    return accentColors[accent] ?? accent ?? '#2563eb';
  }

  function format(value, axis) {
    const unit = axis?.unit ? ` ${axis.unit}` : '';
    return `${Number(value.toFixed(2))}${unit}`;
  }
</script>

{#if data?.__type === 'ET.ScatterPlot'}
  <figure class="scatter-plot" aria-labelledby="plot-title">
    <figcaption>
      <h2 id="plot-title">{data.title}</h2>
      {#if data.subtitle}<p class="subtitle">{data.subtitle}</p>{/if}
      {#if data.encoding}<p class="encoding">{data.encoding}</p>{/if}
    </figcaption>

    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${data.title}: ${data.xAxis?.label} against ${data.yAxis?.label}`}
    >
      <g class="grid">
        {#each xTicks as tick}
          <line x1={x(tick)} x2={x(tick)} y1={margin.top} y2={margin.top + plotHeight} />
          <text x={x(tick)} y={margin.top + plotHeight + 24} text-anchor="middle">
            {format(tick, data.xAxis)}
          </text>
        {/each}
        {#each yTicks as tick}
          <line x1={margin.left} x2={margin.left + plotWidth} y1={y(tick)} y2={y(tick)} />
          <text x={margin.left - 12} y={y(tick) + 4} text-anchor="end">
            {format(tick, data.yAxis)}
          </text>
        {/each}
      </g>

      <line class="axis" x1={margin.left} x2={margin.left + plotWidth} y1={margin.top + plotHeight} y2={margin.top + plotHeight} />
      <line class="axis" x1={margin.left} x2={margin.left} y1={margin.top} y2={margin.top + plotHeight} />
      <text class="axis-label" x={margin.left + plotWidth / 2} y={height - 12} text-anchor="middle">
        {data.xAxis?.label}
      </text>
      <text class="axis-label" transform={`translate(18 ${margin.top + plotHeight / 2}) rotate(-90)`} text-anchor="middle">
        {data.yAxis?.label}
      </text>

      {#if data.trendLine}
        <line
          class="trend-line"
          x1={x(data.trendLine.from.x)} y1={y(data.trendLine.from.y)}
          x2={x(data.trendLine.to.x)} y2={y(data.trendLine.to.y)}
        />
      {/if}

      {#each series as pointSeries (pointSeries.label)}
        {@const pointColor = color(pointSeries.accent)}
        {#each pointSeries.content_ ?? [] as point}
          <g class:highlight={point.emphasis === 'highlight'}>
            <title>{point.label ?? `${pointSeries.label}: ${point.x}, ${point.y}`}</title>
            <circle cx={x(point.x)} cy={y(point.y)} r={point.emphasis === 'highlight' ? 7 : 5} fill={pointColor} />
            {#if point.label}
              <text class="point-label" x={x(point.x) + 10} y={y(point.y) - 10}>{point.label}</text>
            {/if}
          </g>
        {/each}
      {/each}
    </svg>

    <footer>
      {#if data.source}<span>{data.source.label} · n={data.source.sampleSize}</span>{/if}
      {#each annotations as annotation}
        <span><strong>{annotation.label}:</strong> {annotation.value}</span>
      {/each}
    </footer>
  </figure>
{:else}
  <p class="error">ScatterPlot requires an <code>ET.ScatterPlot</code> data value.</p>
{/if}

<style>
  .scatter-plot { color: #172033; font-family: system-ui, sans-serif; margin: 0; max-width: 720px; }
  h2 { font-size: 1.125rem; margin: 0; }
  p { margin: 0.25rem 0; }
  .subtitle { color: #526079; }
  .encoding { color: #6b7280; font-size: 0.875rem; }
  svg { display: block; height: auto; margin-top: 1rem; overflow: visible; width: 100%; }
  .grid line { stroke: #e4e9f2; stroke-width: 1; }
  .grid text { fill: #667085; font-size: 12px; }
  .axis { stroke: #94a3b8; stroke-width: 1.25; }
  .axis-label { fill: #475569; font-size: 13px; font-weight: 600; }
  .trend-line { stroke: #64748b; stroke-dasharray: 6 5; stroke-width: 2; }
  circle { stroke: white; stroke-width: 2; }
  .highlight circle { filter: drop-shadow(0 1px 2px rgb(15 23 42 / 0.3)); }
  .point-label { fill: #334155; font-size: 12px; }
  footer { color: #526079; display: flex; flex-wrap: wrap; font-size: 0.8125rem; gap: 0.5rem 1rem; margin-top: 0.5rem; }
  .error { color: #b91c1c; }
</style>
