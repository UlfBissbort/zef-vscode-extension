<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();

  const children = $derived(node?.content_ ?? []);
  const nodes = $derived(children.filter((child) => child?.__type === 'ET.FlowNode'));
  const edges = $derived(children.filter((child) => child?.__type === 'ET.FlowEdge'));
  const nodeById = $derived(Object.fromEntries(nodes.map((flowNode) => [flowNode.id, flowNode])));
  const accent = $derived(node?.accent ?? 'cyan');
  const markerId = $derived(`flow-arrow-${String(node?.id ?? node?.title ?? 'diagram').replace(/[^a-z0-9_-]/gi, '-')}`);

  function nodeWidth(flowNode) {
    return flowNode.width ?? (flowNode.compact ? 40 : 46);
  }

  function nodeHeight(flowNode) {
    return flowNode.height ?? 16;
  }

  function box(flowNode) {
    const width = nodeWidth(flowNode);
    const height = nodeHeight(flowNode);
    return {
      cx: flowNode.x,
      cy: flowNode.y,
      width,
      height,
      left: flowNode.x - width / 2,
      right: flowNode.x + width / 2,
      top: flowNode.y - height / 2,
      bottom: flowNode.y + height / 2
    };
  }

  function accentClass(value) {
    if (value === 'purple') return 'accent-purple';
    if (value === 'emerald') return 'accent-emerald';
    if (value === 'blue') return 'accent-blue';
    return 'accent-cyan';
  }

  function iconGlyph(name) {
    if (name === 'spark') return '✦';
    if (name === 'braces') return '{}';
    if (name === 'component') return '▦';
    if (name === 'presentation') return '▱';
    if (name === 'tree') return '⌘';
    if (name === 'document') return '□';
    return '•';
  }

  function iconSize(name) {
    if (name === 'braces') return 5.6;
    if (name === 'component') return 6.2;
    return 6.8;
  }

  function autoSides(fromBox, toBox) {
    const dx = toBox.cx - fromBox.cx;
    const dy = toBox.cy - fromBox.cy;
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? ['right', 'left'] : ['left', 'right'];
    return dy >= 0 ? ['bottom', 'top'] : ['top', 'bottom'];
  }

  function anchor(targetBox, side, pad = 1.1) {
    if (side === 'left') return { x: targetBox.left - pad, y: targetBox.cy, side };
    if (side === 'right') return { x: targetBox.right + pad, y: targetBox.cy, side };
    if (side === 'top') return { x: targetBox.cx, y: targetBox.top - pad, side };
    return { x: targetBox.cx, y: targetBox.bottom + pad, side: 'bottom' };
  }

  function autoWaypoints(start, end, route) {
    if (route === 'straight') return [];
    if (route === 'vertical') {
      const midY = (start.y + end.y) / 2;
      return [{ x: start.x, y: midY }, { x: end.x, y: midY }];
    }
    if (route === 'horizontal') {
      const midX = (start.x + end.x) / 2;
      return [{ x: midX, y: start.y }, { x: midX, y: end.y }];
    }
    const leavesHorizontally = start.side === 'left' || start.side === 'right';
    if (leavesHorizontally) {
      const midX = (start.x + end.x) / 2;
      return [{ x: midX, y: start.y }, { x: midX, y: end.y }];
    }
    const midY = (start.y + end.y) / 2;
    return [{ x: start.x, y: midY }, { x: end.x, y: midY }];
  }

  function edgePath(edge) {
    const from = nodeById[edge.from];
    const to = nodeById[edge.to];
    if (!from || !to) return '';
    const fromBox = box(from);
    const toBox = box(to);
    const [autoFromSide, autoToSide] = autoSides(fromBox, toBox);
    const start = anchor(fromBox, edge.fromSide ?? autoFromSide, edge.pad ?? 1.1);
    const end = anchor(toBox, edge.toSide ?? autoToSide, edge.pad ?? 1.1);
    const waypoints = edge.waypoints ?? edge.points ?? autoWaypoints(start, end, edge.route ?? 'auto');
    return roundedPolyline([start, ...waypoints, end], edge.radius ?? 4.2);
  }

  function roundedPolyline(points, radius) {
    if (points.length < 2) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];
      if (!next) {
        path += ` L ${current.x} ${current.y}`;
        continue;
      }
      const inDx = current.x - prev.x;
      const inDy = current.y - prev.y;
      const outDx = next.x - current.x;
      const outDy = next.y - current.y;
      const inLen = Math.max(0.001, Math.hypot(inDx, inDy));
      const outLen = Math.max(0.001, Math.hypot(outDx, outDy));
      const turn = Math.abs(inDx * outDy - inDy * outDx) > 0.001;
      if (!turn) {
        path += ` L ${current.x} ${current.y}`;
        continue;
      }
      const r = Math.min(radius, inLen / 2, outLen / 2);
      const before = { x: current.x - (inDx / inLen) * r, y: current.y - (inDy / inLen) * r };
      const after = { x: current.x + (outDx / outLen) * r, y: current.y + (outDy / outLen) * r };
      path += ` L ${before.x} ${before.y} Q ${current.x} ${current.y} ${after.x} ${after.y}`;
    }
    return path;
  }
</script>

<figure class={`flow-diagram flow-diagram--${accent}`} aria-label={node.title ?? 'Flow diagram'}>
  {#if node.title || node.subtitle}
    <figcaption class="flow-diagram__header">
      {#if node.title}<strong>{node.title}</strong>{/if}
      {#if node.subtitle}<span>{node.subtitle}</span>{/if}
    </figcaption>
  {/if}

  <div class="flow-diagram__canvas">
    <svg class="flow-diagram__scene" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>

      <g class="flow-diagram__edges">
        {#each edges as edge, index (edge.id ?? `${edge.from}-${edge.to}-${index}`)}
          <path class="flow-diagram__edge-glow" d={edgePath(edge)} />
          <path class="flow-diagram__edge" class:flow-diagram__edge--muted={edge.muted} d={edgePath(edge)} marker-end={`url(#${markerId})`} />
        {/each}
      </g>

      <g class="flow-diagram__nodes">
        {#each nodes as flowNode (flowNode.id)}
          {@const b = box(flowNode)}
          <g class={`flow-node-svg ${accentClass(flowNode.accent ?? accent)}`} transform={`translate(${flowNode.x} ${flowNode.y})`}>
            <rect class="flow-node__glow" x={-b.width / 2 + 0.6} y={-b.height / 2 + 0.6} width={b.width - 1.2} height={b.height - 1.2} rx="3.2" />
            <rect class="flow-node__card" x={-b.width / 2 + 0.6} y={-b.height / 2 + 0.6} width={b.width - 1.2} height={b.height - 1.2} rx="3.2" />
            <rect class="flow-node__wash" x={-b.width / 2 + 0.6} y={-b.height / 2 + 0.6} width={b.width - 1.2} height={b.height - 1.2} rx="3.2" />
            <rect class="flow-node__icon-box" x={-b.width / 2 + 3.7} y="-5.05" width="10.1" height="10.1" rx="2.3" />
            <text class="flow-node__icon" x={-b.width / 2 + 8.75} y="0.15" text-anchor="middle" style={`font-size: ${iconSize(flowNode.icon)}px`}>{iconGlyph(flowNode.icon)}</text>
            <text class="flow-node__title" x={-b.width / 2 + 16.8} y="-1.65">{flowNode.label}</text>
            {#if flowNode.subtitle}<text class="flow-node__subtitle" x={-b.width / 2 + 16.8} y="4.1">{flowNode.subtitle}</text>{/if}
          </g>
        {/each}
      </g>
    </svg>
  </div>
</figure>

<style>
  .flow-diagram { width: min(var(--flow-width, 560px), 100%); margin: 0; color: var(--text-mid); }
  .flow-diagram__header { display: grid; justify-items: center; gap: 0.4rem; margin-bottom: 1.05rem; text-align: center; }
  .flow-diagram__header strong { color: var(--text-bright); font: 760 1.08rem/1.1 var(--font-display); letter-spacing: -0.035em; }
  .flow-diagram__header span { max-width: 32rem; color: var(--text-dim); font-size: 0.78rem; line-height: 1.45; }

  .flow-diagram__canvas {
    position: relative; height: var(--flow-height, 390px); border: 1px solid rgba(255,255,255,0.07); border-radius: 22px;
    background: radial-gradient(ellipse 56% 44% at 24% 18%, rgba(56,189,248,0.055), transparent 68%), radial-gradient(ellipse 52% 46% at 80% 76%, rgba(124,91,240,0.065), transparent 68%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.014)), rgba(8,11,20,0.82);
    box-shadow: 0 28px 78px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06); overflow: hidden;
  }
  .flow-diagram__canvas::before { content: ''; position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(circle at 50% 50%, black, transparent 78%); pointer-events: none; }
  .flow-diagram__canvas::after { content: ''; position: absolute; inset: 1.1rem; border-radius: 18px; border: 1px solid rgba(255,255,255,0.025); pointer-events: none; }
  .flow-diagram__scene { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }

  .flow-diagram__edge-glow, .flow-diagram__edge { fill: none; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
  .flow-diagram__edge-glow { stroke: rgba(56,189,248,0.13); stroke-width: 2.15; opacity: 0.48; filter: blur(5px); }
  .flow-diagram__edge { stroke: rgba(203,213,225,0.62); stroke-width: 1.35; filter: drop-shadow(0 0 7px rgba(56,189,248,0.1)); }
  .flow-diagram__edge--muted { stroke: rgba(148,163,184,0.3); }
  marker path { fill: rgba(203,213,225,0.82); }

  .flow-node__glow { fill: var(--accent-fill); opacity: 0.18; filter: blur(4px); }
  .flow-node__card { fill: rgba(13,16,28,0.95); stroke: var(--accent-border); stroke-width: 0.42; }
  .flow-node__wash { fill: var(--accent-fill); opacity: 0.16; }
  .flow-node__icon-box { fill: rgba(10,14,24,0.72); stroke: var(--accent); stroke-width: 0.34; }
  .flow-node__icon { fill: var(--accent); font-family: var(--font-mono); font-weight: 760; dominant-baseline: middle; }
  .flow-node__title { fill: rgba(238,240,244,0.94); font: 700 4.3px/1 var(--font-display); letter-spacing: -0.035em; dominant-baseline: middle; }
  .flow-node__subtitle { fill: rgba(146,153,171,0.68); font: 3px/1 var(--font-body); letter-spacing: 0.005em; dominant-baseline: middle; }

  .accent-cyan { --accent: #38bdf8; --accent-border: rgba(56,189,248,0.38); --accent-fill: rgba(56,189,248,0.16); }
  .accent-purple { --accent: #a78bfa; --accent-border: rgba(124,91,240,0.42); --accent-fill: rgba(124,91,240,0.18); }
  .accent-blue { --accent: #5b8def; --accent-border: rgba(91,141,239,0.42); --accent-fill: rgba(91,141,239,0.17); }
  .accent-emerald { --accent: #34d399; --accent-border: rgba(52,211,153,0.4); --accent-fill: rgba(52,211,153,0.16); }
</style>
