<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();

  function histogramSeries(plotNode) {
    return (plotNode.content_ ?? []).find((child) => child?.__type === 'ET.BinnedSeries') ?? null;
  }

  function histogramBins(plotNode) {
    return histogramSeries(plotNode)?.content_ ?? [];
  }

  function maxBinCount(plotNode) {
    return Math.max(1, ...histogramBins(plotNode).map((bin) => bin.count ?? 0));
  }

  function binHeight(bin, plotNode) {
    return `${Math.max(3, ((bin.count ?? 0) / maxBinCount(plotNode)) * 100)}%`;
  }

  function binLabel(bin, axis) {
    return `${bin.start}-${bin.end}${axis?.unit ? ` ${axis.unit}` : ''}`;
  }
</script>

<section class="histogram-panel reveal">
  <header class="histogram-header">
    <div>
      <p>{node.yAxis?.label ?? 'Count'} by {node.xAxis?.label ?? 'Value'}</p>
      <h3>{node.title}</h3>
      {#if node.subtitle}<span>{node.subtitle}</span>{/if}
    </div>
    <div class="histogram-source">
      <strong>{node.source?.sampleSize ?? histogramBins(node).reduce((total, bin) => total + (bin.count ?? 0), 0)}</strong>
      <span>{node.source?.label ?? 'samples'}</span>
    </div>
  </header>

  <div class="histogram-chart" aria-label={node.title}>
    <div class="histogram-y-axis">
      <span>{maxBinCount(node)}</span>
      <span>{Math.round(maxBinCount(node) / 2)}</span>
      <span>0</span>
    </div>
    <div class="histogram-plot-area">
      {#each histogramBins(node) as bin, index (index)}
        <div class="histogram-bin">
          <div
            class:peak={bin.emphasis === 'peak'}
            class="histogram-bar"
            style={`--bar-height: ${binHeight(bin, node)}`}
            title={`${binLabel(bin, node.xAxis)}: ${bin.count}`}
          >
            <span>{bin.count}</span>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="histogram-x-axis">
    <span>{histogramBins(node)[0]?.start ?? 0}</span>
    <span>{node.xAxis?.label ?? 'Value'}{node.xAxis?.unit ? ` (${node.xAxis.unit})` : ''}</span>
    <span>{histogramBins(node).at(-1)?.end ?? ''}</span>
  </div>

  <div class="histogram-footer">
    <span>{node.binning?.strategy ?? 'binned'} / width {node.binning?.width ?? '?'} {node.xAxis?.unit ?? ''}</span>
    <div>
      {#each node.annotations ?? [] as annotation, index (index)}
        <strong>{annotation.label}: {annotation.value}</strong>
      {/each}
    </div>
  </div>
</section>
