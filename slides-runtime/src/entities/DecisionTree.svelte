<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();

  const palette = ['#a78bfa', '#7c5bf0', '#5b8def', '#38bdf8', '#34d399'];
  const geometry = {
    width: 920,
    top: 44,
    rowGap: 118,
    rootGap: 82,
    paddingX: 76,
    decisionWidth: 176,
    leafWidth: 178,
    nodeHeight: 66
  };

  function hexToRgb(hex) {
    const value = hex.replace('#', '');
    return {
      r: Number.parseInt(value.slice(0, 2), 16),
      g: Number.parseInt(value.slice(2, 4), 16),
      b: Number.parseInt(value.slice(4, 6), 16)
    };
  }

  function rgbToHex({ r, g, b }) {
    return `#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}`;
  }

  function interpolateColor(stops, ratio) {
    if (stops.length === 1) return stops[0];
    const clamped = Math.max(0, Math.min(1, ratio));
    const scaled = clamped * (stops.length - 1);
    const leftIndex = Math.floor(scaled);
    const rightIndex = Math.min(stops.length - 1, leftIndex + 1);
    const local = scaled - leftIndex;
    const left = hexToRgb(stops[leftIndex]);
    const right = hexToRgb(stops[rightIndex]);
    return rgbToHex({
      r: left.r + (right.r - left.r) * local,
      g: left.g + (right.g - left.g) * local,
      b: left.b + (right.b - left.b) * local
    });
  }

  function isBranch(value) {
    return value && typeof value === 'object' && value.__type === 'ET.DecisionBranch';
  }

  function branchLabel(branch, fallback) {
    return branch?.question ?? branch?.label ?? fallback;
  }

  function firstBranch() {
    const branches = (node?.content_ ?? []).filter((child) => child?.__type === 'ET.DecisionBranch');
    if (branches.length === 1) return branches[0];
    if (branches.length > 1) {
      return branches.reduceRight((next, branch, index) => {
        if (index === branches.length - 1) return branch;
        return { ...branch, yes: next, yesLabel: branch.yesLabel ?? 'yes' };
      }, branches[branches.length - 1]);
    }
    return null;
  }

  function maxDepth(value) {
    if (!isBranch(value)) return 0;
    return 1 + Math.max(maxDepth(value.no), maxDepth(value.yes));
  }

  function countLeaves(value) {
    if (!isBranch(value)) return 1;
    return countLeaves(value.no) + countLeaves(value.yes);
  }

  function addTree(value, depth, minX, maxX, parentId, branchLabelText, side, state) {
    const x = (minX + maxX) / 2;
    const y = geometry.top + geometry.rootGap + depth * geometry.rowGap;
    const color = interpolateColor(palette, Math.min(1, depth / Math.max(1, state.maxDepth - 1)));

    if (!isBranch(value)) {
      const id = `leaf-${state.nodes.length}`;
      state.nodes.push({
        id,
        type: 'leaf',
        x,
        y,
        label: String(value ?? 'Outcome'),
        branchLabel: branchLabelText,
        color,
        side
      });
      if (parentId) state.edges.push({ from: parentId, to: id, label: branchLabelText, color, side });
      return;
    }

    const id = `decision-${state.nodes.length}`;
    state.nodes.push({
      id,
      type: 'decision',
      x,
      y,
      label: branchLabel(value, `Decision ${state.decisions + 1}`),
      index: ++state.decisions,
      color,
      side
    });
    if (parentId) state.edges.push({ from: parentId, to: id, label: branchLabelText, color, side });

    const noLeaves = countLeaves(value.no);
    const yesLeaves = countLeaves(value.yes);
    const totalLeaves = noLeaves + yesLeaves;
    const splitX = minX + ((maxX - minX) * noLeaves) / totalLeaves;

    addTree(value.no ?? value.noLabel ?? 'No outcome', depth + 1, minX, splitX, id, value.noLabel ?? 'no', 'no', state);
    addTree(value.yes ?? value.yesLabel ?? 'Yes outcome', depth + 1, splitX, maxX, id, value.yesLabel ?? 'yes', 'yes', state);
  }

  const layout = $derived.by(() => {
    const rootBranch = firstBranch();
    if (!rootBranch) return { nodes: [], edges: [], height: 280 };

    const state = {
      nodes: [],
      edges: [],
      decisions: 0,
      maxDepth: maxDepth(rootBranch)
    };
    addTree(rootBranch, 0, geometry.paddingX, geometry.width - geometry.paddingX, null, '', 'root', state);

    const root = {
      id: 'root',
      type: 'root',
      x: geometry.width / 2,
      y: geometry.top,
      label: node.rootLabel ?? 'Start',
      color: palette[0]
    };
    state.nodes.unshift(root);
    state.edges.unshift({ from: 'root', to: 'decision-0', label: 'start', color: palette[0], side: 'root' });

    const height = geometry.top + geometry.rootGap + (state.maxDepth + 1) * geometry.rowGap + 38;
    return { nodes: state.nodes, edges: state.edges, height };
  });

  function byId(id) {
    return layout.nodes.find((item) => item.id === id);
  }

  function edgePath(edge) {
    const from = byId(edge.from);
    const to = byId(edge.to);
    if (!from || !to) return '';
    const startY = from.y + geometry.nodeHeight / 2;
    const endY = to.y - geometry.nodeHeight / 2;
    const midY = startY + (endY - startY) * 0.52;
    return `M ${from.x} ${startY} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${endY}`;
  }

  function edgeLabelPoint(edge) {
    const from = byId(edge.from);
    const to = byId(edge.to);
    if (!from || !to) return { x: 0, y: 0 };
    return {
      x: from.x + (to.x - from.x) * 0.48,
      y: from.y + (to.y - from.y) * 0.48 - 8
    };
  }

  function xPercent(x) {
    return (x / geometry.width) * 100;
  }

  function yPercent(y) {
    return (y / layout.height) * 100;
  }
</script>

<section class="decision-tree reveal">
  {#if node.title || node.subtitle}
    <header class="decision-tree__header">
      {#if node.title}<h3>{node.title}</h3>{/if}
      {#if node.subtitle}<p>{node.subtitle}</p>{/if}
    </header>
  {/if}

  <div class="decision-tree__stage" style={`--tree-width: ${geometry.width}px;`}>
    <svg class="decision-tree__svg" viewBox={`0 0 ${geometry.width} ${layout.height}`} aria-hidden="true">
      <defs>
        <filter id="decision-tree-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {#each layout.edges as edge, index (edge.from + edge.to + index)}
        <g style={`--edge-color: ${edge.color}; --edge-index: ${index};`}>
          <path class="tree-edge" d={edgePath(edge)} />
          {#if edge.label && edge.label !== 'start'}
            {@const labelPoint = edgeLabelPoint(edge)}
            <text class="tree-edge-label" x={labelPoint.x} y={labelPoint.y} text-anchor="middle">
              {edge.label}
            </text>
          {/if}
        </g>
      {/each}
    </svg>

    {#each layout.nodes as item (item.id)}
      <article
        class={`decision-node decision-node--${item.type}`}
        style={`--node-color: ${item.color}; left: ${xPercent(item.x)}%; top: ${yPercent(item.y)}%;`}
      >
        {#if item.type === 'decision'}
          <span>{String(item.index).padStart(2, '0')}</span>
        {/if}
        <strong>{item.label}</strong>
      </article>
    {/each}
  </div>
</section>

<style>
  .decision-tree {
    width: min(1040px, 100%);
    color: var(--text-bright);
  }

  .decision-tree__header {
    margin-bottom: 0.5rem;
    text-align: center;
  }

  .decision-tree__header h3 {
    margin: 0;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 1.42rem;
    font-weight: 800;
  }

  .decision-tree__header p {
    max-width: 710px;
    margin: 0.38rem auto 0;
    color: var(--text-mid);
    font-size: 0.88rem;
    line-height: 1.45;
  }

  .decision-tree__stage {
    position: relative;
    width: min(var(--tree-width), calc(100vw - 7rem));
    margin: 0 auto;
    isolation: isolate;
  }

  .decision-tree__stage::before {
    position: absolute;
    inset: 6% 10% 10%;
    z-index: -1;
    border-radius: 999px;
    background:
      radial-gradient(circle at 50% 28%, rgba(167, 139, 250, 0.16), transparent 28%),
      radial-gradient(circle at 30% 70%, rgba(56, 189, 248, 0.13), transparent 40%),
      radial-gradient(circle at 72% 72%, rgba(52, 211, 153, 0.11), transparent 38%);
    content: '';
    filter: blur(8px);
  }

  .decision-tree__svg {
    display: block;
    width: 100%;
    overflow: visible;
  }

  .tree-edge {
    fill: none;
    stroke: var(--edge-color);
    stroke-linecap: round;
    stroke-width: 2.1;
    opacity: 0.42;
    filter: drop-shadow(0 0 10px color-mix(in srgb, var(--edge-color) 34%, transparent));
    animation: tree-edge-reveal 0.78s var(--ease-out-expo) both;
    animation-delay: calc(0.08s + var(--edge-index) * 0.045s);
  }

  .tree-edge-label {
    fill: color-mix(in srgb, var(--edge-color) 76%, white 24%);
    font: 900 0.56rem/1 var(--font-mono);
    letter-spacing: 0.13em;
    text-transform: uppercase;
    paint-order: stroke;
    stroke: rgba(6, 8, 14, 0.9);
    stroke-linejoin: round;
    stroke-width: 4px;
  }

  .decision-node {
    position: absolute;
    box-sizing: border-box;
    display: grid;
    min-height: 66px;
    place-items: center;
    align-content: center;
    gap: 0.26rem;
    transform: translate(-50%, -50%);
    border: 1px solid color-mix(in srgb, var(--node-color) 46%, rgba(255, 255, 255, 0.08));
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--node-color) 13%, transparent), transparent 58%),
      rgba(16, 19, 30, 0.95);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      0 18px 48px rgba(0, 0, 0, 0.24),
      0 0 24px color-mix(in srgb, var(--node-color) 12%, transparent);
    text-align: center;
    animation: decision-node-reveal 0.62s var(--ease-out-expo) both;
  }

  .decision-node--root {
    width: 196px;
    min-height: 42px;
    border-radius: 999px;
  }

  .decision-node--decision {
    width: 176px;
    padding: 0.72rem 0.9rem;
    border-radius: 18px;
  }

  .decision-node--leaf {
    width: 178px;
    padding: 0.7rem 0.85rem;
    border-radius: 16px;
  }

  .decision-node span {
    color: color-mix(in srgb, var(--node-color) 78%, white 22%);
    font: 900 0.53rem/1 var(--font-mono);
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  .decision-node strong {
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 0.9rem;
    font-weight: 800;
    line-height: 1.15;
  }

  .decision-node--root strong {
    color: var(--purple-light);
    font: 900 0.62rem/1 var(--font-mono);
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  .decision-node--leaf strong {
    font-size: 0.9rem;
  }

  @keyframes tree-edge-reveal {
    from { opacity: 0; stroke-dasharray: 1 520; }
    to { stroke-dasharray: 520 0; }
  }

  @keyframes decision-node-reveal {
    from { opacity: 0; transform: translate(-50%, -45%) scale(0.96); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
</style>
