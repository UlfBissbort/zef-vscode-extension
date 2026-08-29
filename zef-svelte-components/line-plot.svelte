<!-- +++
this = "ET.SvelteComponent('🍃-4c18401133a57639bd89')"
tag_ = []
dispatched_on = "ET.LinePlot"
created = "Time('2026-08-15 11:18:00 +0800')"
[ns]
"ET.LinePlot" = "ET('4576647567')"
+++ -->

<script>
  import { tick } from 'svelte';

  /** A data-in, DOM-out renderer for an ET.LinePlot value. */
  export let data;

  let hoveredAnnotation = null;
  let hoverAnnotationElement;
  let plotSurface;
  let placementToken = 0;

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

  function linePoints(pointSeries) {
    return [...(pointSeries.content_ ?? [])]
      .sort((left, right) => left.x - right.x)
      .map(point => `${x(point.x)},${y(point.y)}`)
      .join(' ');
  }

  function format(value, axis) {
    const unit = axis?.unit ? ` ${axis.unit}` : '';
    return `${Number(value.toFixed(2))}${unit}`;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function placeTooltip(anchorX, anchorY, tooltipWidth, tooltipHeight, surfaceWidth, surfaceHeight) {
    const gap = 12;
    const inset = 8;
    const right = anchorX + gap;
    const preferredLeft = right + tooltipWidth <= surfaceWidth - inset
      ? right
      : anchorX - gap - tooltipWidth;
    return {
      left: clamp(preferredLeft, inset, Math.max(inset, surfaceWidth - tooltipWidth - inset)),
      top: clamp(anchorY - tooltipHeight / 2, inset, Math.max(inset, surfaceHeight - tooltipHeight - inset))
    };
  }

  async function showHover(event, annotation, fallbackTitle) {
    if (!annotation || !plotSurface) return;
    const content = typeof annotation === 'string' ? annotation : annotation.content;
    if (typeof content !== 'string') return;
    const title = typeof annotation === 'object' && typeof annotation.title === 'string' ? annotation.title : fallbackTitle;
    const surfaceRect = plotSurface.getBoundingClientRect();
    const anchorX = event.clientX - surfaceRect.left;
    const anchorY = event.clientY - surfaceRect.top;
    const previous = hoveredAnnotation;
    const sameAnnotation = previous?.title === title && previous?.content === content;
    const token = ++placementToken;
    hoveredAnnotation = {
      title,
      content,
      left: sameAnnotation ? previous.left : anchorX + 12,
      top: sameAnnotation ? previous.top : anchorY,
      positioned: sameAnnotation && previous.positioned === true
    };
    await tick();
    if (token !== placementToken || !hoveredAnnotation || !hoverAnnotationElement) return;
    const tooltipRect = hoverAnnotationElement.getBoundingClientRect();
    const placement = placeTooltip(anchorX, anchorY, tooltipRect.width, tooltipRect.height, surfaceRect.width, surfaceRect.height);
    hoveredAnnotation = { ...hoveredAnnotation, ...placement, positioned: true };
  }

  function clearHover() {
    placementToken += 1;
    hoveredAnnotation = null;
  }
</script>

{#if data?.__type === 'ET.LinePlot'}
  <figure class="line-plot" aria-labelledby="plot-title">
    <figcaption class="chart-header">
      <div class="heading">
        <span class="chart-mark" aria-hidden="true">╱</span>
        <div>
          <p class="eyebrow">Line plot</p>
          <h2 id="plot-title">{data.title}</h2>
        </div>
      </div>
    </figcaption>

    {#if data.subtitle}<p class="subtitle">{data.subtitle}</p>{/if}

    <div class="plot-surface" bind:this={plotSurface}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${data.title}: ${data.xAxis?.label} against ${data.yAxis?.label}`}
      >
        <g class="grid">
          {#each xTicks as tick}
            <line x1={x(tick)} x2={x(tick)} y1={margin.top} y2={margin.top + plotHeight} />
            <text x={x(tick)} y={margin.top + plotHeight + 23} text-anchor="middle">{format(tick, data.xAxis)}</text>
          {/each}
          {#each yTicks as tick}
            <line x1={margin.left} x2={margin.left + plotWidth} y1={y(tick)} y2={y(tick)} />
            <text x={margin.left - 13} y={y(tick) + 4} text-anchor="end">{format(tick, data.yAxis)}</text>
          {/each}
        </g>

        <line class="axis" x1={margin.left} x2={margin.left + plotWidth} y1={margin.top + plotHeight} y2={margin.top + plotHeight} />
        <line class="axis" x1={margin.left} x2={margin.left} y1={margin.top} y2={margin.top + plotHeight} />
        <text class="axis-label" x={margin.left + plotWidth / 2} y={height - 12} text-anchor="middle">{data.xAxis?.label}</text>
        <text class="axis-label" transform={`translate(19 ${margin.top + plotHeight / 2}) rotate(-90)`} text-anchor="middle">{data.yAxis?.label}</text>

        {#each series as lineSeries, seriesIndex (lineSeries.label)}
          {@const seriesColor = color(lineSeries.accent, seriesIndex)}
          <polyline class="series-line" points={linePoints(lineSeries)} stroke={seriesColor} />
          {#if lineSeries.hover}
            <polyline
              class="line-hover-target hoverable"
              points={linePoints(lineSeries)}
              onmouseenter={(event) => showHover(event, lineSeries.hover, lineSeries.label)}
              onmousemove={(event) => showHover(event, lineSeries.hover, lineSeries.label)}
              onmouseleave={clearHover}
            />
          {/if}
          {#if lineSeries.showPoints !== false}
            {#each lineSeries.content_ ?? [] as point}
              <g class:highlight={point.emphasis === 'highlight'}>
                {#if !point.hover}<title>{point.label ?? `${lineSeries.label}: ${point.x}, ${point.y}`}</title>{/if}
                <circle class="point-halo" cx={x(point.x)} cy={y(point.y)} r={point.emphasis === 'highlight' ? 10 : 0} fill={seriesColor} />
                <circle
                  class:hoverable={Boolean(point.hover)}
                  cx={x(point.x)} cy={y(point.y)}
                  r={point.emphasis === 'highlight' ? 4 : 3.75}
                  fill={seriesColor}
                  onmouseenter={(event) => showHover(event, point.hover, point.label ?? lineSeries.label)}
                  onmousemove={(event) => showHover(event, point.hover, point.label ?? lineSeries.label)}
                  onmouseleave={clearHover}
                />
                {#if point.label && point.emphasis === 'highlight'}
                  <line class="point-leader" x1={x(point.x) + 4} y1={y(point.y) - 4} x2={x(point.x) + 8} y2={y(point.y) - 8} />
                  <text class="point-label" x={x(point.x) + 11} y={y(point.y) - 11}>{point.label}</text>
                {/if}
              </g>
            {/each}
          {/if}
        {/each}
      </svg>
      {#if hoveredAnnotation}
        <aside bind:this={hoverAnnotationElement} class:positioned={hoveredAnnotation.positioned} class="hover-annotation" style={`left: ${hoveredAnnotation.left}px; top: ${hoveredAnnotation.top}px;`} role="status">
          <strong>{hoveredAnnotation.title}</strong>
          <span>{hoveredAnnotation.content}</span>
        </aside>
      {/if}
    </div>

    {#if data.encoding}<p class="encoding"><span aria-hidden="true">╱</span>{data.encoding}</p>{/if}

    <footer class="chart-footer">
      {#if data.source}<span class="source"><span class="source-dot"></span>{data.source.label} <b>n={data.source.sampleSize}</b></span>{/if}
      <div class="legend">
        {#each series as lineSeries, seriesIndex (lineSeries.label)}
          <span class="legend-item"><i style={`background: ${color(lineSeries.accent, seriesIndex)}`}></i>{lineSeries.label}</span>
        {/each}
      </div>
      <div class="annotations">
        {#each annotations as annotation}
          <span class="annotation"><b>{annotation.label}</b> {annotation.value}</span>
        {/each}
      </div>
    </footer>
  </figure>
{:else}
  <p class="error">LinePlot requires an <code>ET.LinePlot</code> data value.</p>
{/if}

<style>
  .line-plot { color: #e4e4e7; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; max-width: 720px; }
  .chart-header { margin: 0 0 12px; }
  .heading { align-items: center; display: flex; gap: 10px; min-width: 0; }
  .chart-mark { color: #a1a1aa; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 20px; font-weight: 700; line-height: 1; }
  .eyebrow { color: #71717a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; letter-spacing: 0.12em; margin: 0 0 3px; text-transform: uppercase; }
  h2 { color: #e4e4e7; font-size: 15px; font-weight: 560; letter-spacing: -0.01em; line-height: 1.2; margin: 0; }
  .subtitle { color: #a1a1aa; font-size: 13px; line-height: 1.5; margin: 0 0 16px; }
  .plot-surface { background: #09090b; border: 1px solid rgb(255 255 255 / 0.07); border-radius: 11px; overflow: hidden; position: relative; }
  svg { display: block; height: auto; width: 100%; }
  .grid line { stroke: #1a1b1f; stroke-width: 0.55; }
  .grid text { fill: #5c5c65; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; }
  .axis { stroke: #383840; stroke-width: 1; }
  .axis-label { fill: #a1a1aa; font-size: 13.5px; font-weight: 560; }
  .series-line { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2.1; }
  .line-hover-target { fill: none; pointer-events: stroke; stroke: transparent; stroke-linecap: round; stroke-linejoin: round; stroke-width: 14; }
  .hoverable { cursor: crosshair; }
  circle:not(.point-halo) { stroke: #09090b; stroke-width: 2; }
  .point-halo { opacity: 0; transition: opacity 150ms ease; }
  .highlight .point-halo { opacity: 0.15; }
  .highlight circle:not(.point-halo) { filter: drop-shadow(0 0 5px currentColor); stroke-width: 2.5; }
  .point-leader { stroke: #3f3f46; stroke-width: 0.8; }
  .point-label { fill: #a1a1aa; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 10.5px; font-weight: 500; paint-order: stroke; pointer-events: none; stroke: #09090b; stroke-linejoin: round; stroke-width: 3px; }
  .hover-annotation { background: #18181b; border: 1px solid #3f3f46; border-radius: 7px; box-shadow: 0 8px 24px rgb(0 0 0 / 0.45); color: #d4d4d8; display: grid; font-size: 12px; gap: 4px; opacity: 0; padding: 10px 12px; pointer-events: none; position: absolute; visibility: hidden; width: min(210px, calc(100% - 24px)); z-index: 2; }
  .hover-annotation.positioned { opacity: 1; visibility: visible; }
  .hover-annotation strong { color: #fafafa; font-size: 12px; font-weight: 600; }
  .hover-annotation span { color: #a1a1aa; line-height: 1.4; }
  .encoding { align-items: center; color: #a1a1aa; display: flex; font-size: 12px; gap: 7px; line-height: 1.45; margin: 15px 0; }
  .encoding span { color: #a1a1aa; font-size: 15px; }
  .chart-footer { align-items: center; border-top: 1px solid rgb(255 255 255 / 0.07); color: #71717a; display: flex; flex-wrap: wrap; font-size: 12px; gap: 8px 17px; padding-top: 13px; }
  .source { align-items: center; display: inline-flex; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; gap: 6px; }
  .source-dot { background: #a1a1aa; border-radius: 999px; height: 6px; width: 6px; }
  .source b { color: #a1a1aa; font-weight: 600; }
  .legend { display: flex; flex-wrap: wrap; gap: 11px; }
  .legend-item { align-items: center; display: inline-flex; gap: 5px; }
  .legend-item i { border-radius: 99px; display: inline-block; height: 2px; width: 15px; }
  .annotations { display: flex; flex-wrap: wrap; gap: 12px; }
  .annotation { color: #8a8a94; }
  .annotation b { color: #c3c3ca; font-weight: 600; }
  .error { color: #fda4af; font-family: system-ui, sans-serif; }
  @media (max-width: 480px) { .chart-footer { align-items: flex-start; flex-direction: column; } }
</style>
