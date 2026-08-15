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
  /** A data-in, DOM-out renderer for an ET.ScatterPlot value. */
  export let data;

  let hoveredAnnotation = null;

  const width = 720;
  const height = 440;
  const margin = { top: 34, right: 30, bottom: 62, left: 74 };
  const seriesColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];
  const accentColors = {
    emerald: '#10b981',
    blue: '#3b82f6',
    violet: '#8b5cf6',
    amber: '#f59e0b',
    rose: '#ec4899'
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

  function color(accent, seriesIndex) {
    return accentColors[accent] ?? accent ?? seriesColors[seriesIndex % seriesColors.length];
  }

  function format(value, axis) {
    const unit = axis?.unit ? ` ${axis.unit}` : '';
    return `${Number(value.toFixed(2))}${unit}`;
  }

  function showHover(event, annotation, fallbackTitle) {
    if (!annotation) return;
    const svg = event.currentTarget.ownerSVGElement;
    const rect = svg.getBoundingClientRect();
    const content = typeof annotation === 'string' ? annotation : annotation.content;
    if (typeof content !== 'string') return;
    hoveredAnnotation = {
      title: typeof annotation === 'object' && typeof annotation.title === 'string' ? annotation.title : fallbackTitle,
      content,
      x: Math.min(88, Math.max(12, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(82, Math.max(10, ((event.clientY - rect.top) / rect.height) * 100))
    };
  }

  function clearHover() {
    hoveredAnnotation = null;
  }
</script>

{#if data?.__type === 'ET.ScatterPlot'}
  <figure class="scatter-plot" aria-labelledby="plot-title">
    <figcaption class="chart-header">
      <div class="heading">
        <span class="chart-mark" aria-hidden="true">▦</span>
        <div>
          <p class="eyebrow">Scatter plot</p>
          <h2 id="plot-title">{data.title}</h2>
        </div>
      </div>
    </figcaption>

    {#if data.subtitle}<p class="subtitle">{data.subtitle}</p>{/if}

    <div class="plot-surface">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${data.title}: ${data.xAxis?.label} against ${data.yAxis?.label}`}
      >
        <g class="grid">
          {#each xTicks as tick}
            <line x1={x(tick)} x2={x(tick)} y1={margin.top} y2={margin.top + plotHeight} />
            <text x={x(tick)} y={margin.top + plotHeight + 23} text-anchor="middle">
              {format(tick, data.xAxis)}
            </text>
          {/each}
          {#each yTicks as tick}
            <line x1={margin.left} x2={margin.left + plotWidth} y1={y(tick)} y2={y(tick)} />
            <text x={margin.left - 13} y={y(tick) + 4} text-anchor="end">
              {format(tick, data.yAxis)}
            </text>
          {/each}
        </g>

        <line class="axis" x1={margin.left} x2={margin.left + plotWidth} y1={margin.top + plotHeight} y2={margin.top + plotHeight} />
        <line class="axis" x1={margin.left} x2={margin.left} y1={margin.top} y2={margin.top + plotHeight} />
        <text class="axis-label" x={margin.left + plotWidth / 2} y={height - 12} text-anchor="middle">
          {data.xAxis?.label}
        </text>
        <text class="axis-label" transform={`translate(19 ${margin.top + plotHeight / 2}) rotate(-90)`} text-anchor="middle">
          {data.yAxis?.label}
        </text>

        {#if data.trendLine}
          <line
            class="trend-line"
            x1={x(data.trendLine.from.x)} y1={y(data.trendLine.from.y)}
            x2={x(data.trendLine.to.x)} y2={y(data.trendLine.to.y)}
          />
        {/if}

        {#each series as pointSeries, seriesIndex (pointSeries.label)}
          {@const pointColor = color(pointSeries.accent, seriesIndex)}
          {#each pointSeries.content_ ?? [] as point}
            {@const annotation = point.hover ?? pointSeries.hover}
            <g class:highlight={point.emphasis === 'highlight'}>
              {#if !annotation}<title>{point.label ?? `${pointSeries.label}: ${point.x}, ${point.y}`}</title>{/if}
              <circle class="point-halo" cx={x(point.x)} cy={y(point.y)} r={point.emphasis === 'highlight' ? 10 : 0} fill={pointColor} />
              <circle
                class:hoverable={Boolean(annotation)}
                cx={x(point.x)} cy={y(point.y)}
                r={point.emphasis === 'highlight' ? 4 : 4.5}
                fill={pointColor}
                onmouseenter={(event) => showHover(event, annotation, point.label ?? pointSeries.label)}
                onmousemove={(event) => showHover(event, annotation, point.label ?? pointSeries.label)}
                onmouseleave={clearHover}
              />
              {#if point.label}
                <text class="point-label" x={x(point.x) + 11} y={y(point.y) - 11}>{point.label}</text>
              {/if}
            </g>
          {/each}
        {/each}
      </svg>
      {#if hoveredAnnotation}
        <aside class="hover-annotation" style={`left: ${hoveredAnnotation.x}%; top: ${hoveredAnnotation.y}%;`} role="status">
          <strong>{hoveredAnnotation.title}</strong>
          <span>{hoveredAnnotation.content}</span>
        </aside>
      {/if}
    </div>

    {#if data.encoding}<p class="encoding"><span aria-hidden="true">↙</span>{data.encoding}</p>{/if}

    <footer class="chart-footer">
      {#if data.source}<span class="source"><span class="source-dot"></span>{data.source.label} <b>n={data.source.sampleSize}</b></span>{/if}
      <div class="annotations">
        {#each annotations as annotation}
          <span class="annotation"><b>{annotation.label}</b> {annotation.value}</span>
        {/each}
      </div>
    </footer>
  </figure>
{:else}
  <p class="error">ScatterPlot requires an <code>ET.ScatterPlot</code> data value.</p>
{/if}

<style>
  .scatter-plot { color: #e4e4e7; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; max-width: 720px; }
  .chart-header { margin: 0 0 12px; }
  .heading { align-items: center; display: flex; gap: 10px; min-width: 0; }
  .chart-mark { color: #a1a1aa; font-size: 19px; line-height: 1; }
  .eyebrow { color: #71717a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; letter-spacing: 0.12em; margin: 0 0 3px; text-transform: uppercase; }
  h2 { color: #e4e4e7; font-size: 15px; font-weight: 560; letter-spacing: -0.01em; line-height: 1.2; margin: 0; }
  .subtitle { color: #a1a1aa; font-size: 13px; line-height: 1.5; margin: 0 0 16px; }
  .plot-surface { background: #09090b; border: 1px solid rgb(255 255 255 / 0.07); border-radius: 11px; overflow: hidden; position: relative; }
  svg { display: block; height: auto; width: 100%; }
  .grid line { stroke: #1a1b1f; stroke-width: 0.55; }
  .grid text { fill: #5c5c65; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; }
  .axis { stroke: #383840; stroke-width: 1; }
  .axis-label { fill: #a1a1aa; font-size: 13.5px; font-weight: 560; }
  .trend-line { stroke: #5f6069; stroke-linecap: round; stroke-width: 1.25; opacity: 0.9; }
  circle:not(.point-halo) { stroke: #09090b; stroke-width: 2; }
  .point-halo { opacity: 0; transition: opacity 150ms ease; }
  .hoverable { cursor: crosshair; }
  .highlight .point-halo { opacity: 0.15; }
  .highlight circle:not(.point-halo) { filter: drop-shadow(0 0 5px currentColor); stroke-width: 2.5; }
  .point-label { fill: #d4d4d8; font-size: 11.5px; font-weight: 550; paint-order: stroke; pointer-events: none; stroke: #09090b; stroke-linejoin: round; stroke-width: 4px; }
  .hover-annotation { background: #18181b; border: 1px solid #3f3f46; border-radius: 7px; box-shadow: 0 8px 24px rgb(0 0 0 / 0.45); color: #d4d4d8; display: grid; font-size: 12px; gap: 4px; max-width: 210px; padding: 10px 12px; pointer-events: none; position: absolute; transform: translate(12px, -50%); z-index: 2; }
  .hover-annotation strong { color: #fafafa; font-size: 12px; font-weight: 600; }
  .hover-annotation span { color: #a1a1aa; line-height: 1.4; }
  .encoding { align-items: center; color: #a1a1aa; display: flex; font-size: 12px; gap: 7px; line-height: 1.45; margin: 15px 0; }
  .encoding span { color: #a1a1aa; font-size: 15px; }
  .chart-footer { align-items: center; border-top: 1px solid rgb(255 255 255 / 0.07); color: #71717a; display: flex; flex-wrap: wrap; font-size: 12px; gap: 8px 17px; padding-top: 13px; }
  .source { align-items: center; display: inline-flex; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; gap: 6px; }
  .source-dot { background: #a1a1aa; border-radius: 999px; height: 6px; width: 6px; }
  .source b { color: #a1a1aa; font-weight: 600; }
  .annotations { display: flex; flex-wrap: wrap; gap: 12px; }
  .annotation { color: #8a8a94; }
  .annotation b { color: #c3c3ca; font-weight: 600; }
  .error { color: #fda4af; font-family: system-ui, sans-serif; }
  @media (max-width: 480px) { .chart-footer { align-items: flex-start; flex-direction: column; } }
</style>
