<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();

  const ACCENTS = {
    purple: '#a78bfa',
    blue: '#5b8def',
    cyan: '#38bdf8',
    emerald: '#34d399',
    amber: '#fbbf24',
    rose: '#fb7185'
  };
  const LANE_PALETTE = ['#a78bfa', '#5b8def', '#38bdf8', '#34d399'];

  const lanes = $derived(node?.lanes ?? []);
  const children = $derived(node?.content_ ?? []);
  const flowNodes = $derived(children.filter((c) => c?.__type === 'ET.FlowNode'));
  const edges = $derived(children.filter((c) => c?.__type === 'ET.FlowEdge'));
  const groups = $derived(children.filter((c) => c?.__type === 'ET.FlowGroup'));

  const width = $derived(node?.width ?? 1100);
  const outsideLeftW = $derived(node?.outsideLeftWidth ?? 110);
  const laneAreaX = $derived(outsideLeftW);
  const laneAreaW = $derived(width - outsideLeftW);
  const laneW = $derived(laneAreaW / Math.max(1, lanes.length || 4));
  const rowH = $derived(node?.rowHeight ?? 128);
  const nodeW = $derived(node?.nodeWidth ?? 172);
  const nodeH = $derived(node?.nodeHeight ?? 58);
  const headerH = 58;
  const padY = 30;

  const rowCount = $derived(Math.max(1, ...flowNodes.map((n) => (n.row ?? 0) + 1)));
  const totalHeight = $derived(headerH + padY * 2 + rowCount * rowH);

  function laneIndex(id) {
    return Math.max(0, lanes.findIndex((l) => l.id === id));
  }

  function laneAccent(id) {
    return LANE_PALETTE[laneIndex(id) % LANE_PALETTE.length];
  }

  function isOutsideLeft(n) {
    return n.outside === 'left' || n.lane === 'outside-left' || !n.lane;
  }

  function nodeBox(n) {
    const cx = isOutsideLeft(n)
      ? outsideLeftW / 2 + (n.offset ?? 0) * outsideLeftW
      : laneAreaX + laneIndex(n.lane) * laneW + laneW / 2 + (n.offset ?? 0) * laneW;
    const cy = headerH + padY + (n.row ?? 0) * rowH + rowH / 2;
    const w = n.width ?? nodeW;
    const h = n.height ?? nodeH;
    return { cx, cy, w, h, x: cx - w / 2, y: cy - h / 2, accent: ACCENTS[n.accent] ?? (isOutsideLeft(n) ? ACCENTS.purple : laneAccent(n.lane)) };
  }

  function nodeMeta(n) {
    return n.meta ?? [n.date, n.tag].filter(Boolean).join('  ');
  }

  function wrapText(value, maxChars = 24) {
    const words = String(value ?? '').split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > maxChars && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
    return lines.slice(0, 3);
  }

  const nodeMap = $derived(Object.fromEntries(flowNodes.map((n) => [n.id, nodeBox(n)])));

  function clipToRect(box, towardX, towardY) {
    const dx = towardX - box.cx;
    const dy = towardY - box.cy;
    if (dx === 0 && dy === 0) return { x: box.cx, y: box.cy, side: 'center' };
    const sx = dx === 0 ? Infinity : (box.w / 2) / Math.abs(dx);
    const sy = dy === 0 ? Infinity : (box.h / 2) / Math.abs(dy);
    const s = Math.min(sx, sy);
    const side = sx <= sy ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'bottom' : 'top');
    return { x: box.cx + dx * s, y: box.cy + dy * s, side };
  }

  // unit vector pointing OUT of source box from a given clipped side
  function dirOut(side) {
    if (side === 'right') return { x: 1, y: 0 };
    if (side === 'left') return { x: -1, y: 0 };
    if (side === 'bottom') return { x: 0, y: 1 };
    if (side === 'top') return { x: 0, y: -1 };
    return { x: 1, y: 0 };
  }

  // unit vector representing the curve's direction of travel as it ARRIVES
  // at a destination box clipped on the given side
  function dirIn(side) {
    if (side === 'right') return { x: -1, y: 0 };
    if (side === 'left') return { x: 1, y: 0 };
    if (side === 'bottom') return { x: 0, y: -1 };
    if (side === 'top') return { x: 0, y: 1 };
    return { x: -1, y: 0 };
  }

  function arrowTip(end, dir, size = 8) {
    const ax = dir.x;
    const ay = dir.y;
    const px = -ay;
    const py = ax;
    const baseX = end.x - ax * size;
    const baseY = end.y - ay * size;
    const w = size * 0.42;
    return `M ${end.x} ${end.y} L ${baseX + px * w} ${baseY + py * w} L ${baseX - px * w} ${baseY - py * w} Z`;
  }

  const computedEdges = $derived(
    edges
      .map((e, i) => {
        const a = nodeMap[e.from];
        const b = nodeMap[e.to];
        if (!a || !b) return null;

        // Force horizontal entry/exit when the two nodes are in different
        // columns; fall back to vertical when they're stacked in the same column.
        const horizontal = Math.abs(b.cx - a.cx) > Math.max(a.w, b.w) * 0.25;
        let sStart, eEnd, outT, inT;
        if (horizontal) {
          const targetRight = b.cx > a.cx;
          sStart = { x: targetRight ? a.x + a.w : a.x, y: a.cy };
          eEnd = { x: targetRight ? b.x : b.x + b.w, y: b.cy };
          outT = { x: targetRight ? 1 : -1, y: 0 };
          inT = { x: targetRight ? 1 : -1, y: 0 };
        } else {
          const targetBelow = b.cy > a.cy;
          sStart = { x: a.cx, y: targetBelow ? a.y + a.h : a.y };
          eEnd = { x: b.cx, y: targetBelow ? b.y : b.y + b.h };
          outT = { x: 0, y: targetBelow ? 1 : -1 };
          inT = { x: 0, y: targetBelow ? 1 : -1 };
        }

        const inset = 7;
        const ePulled = { x: eEnd.x - inT.x * inset, y: eEnd.y - inT.y * inset };
        const dist = Math.hypot(ePulled.x - sStart.x, ePulled.y - sStart.y) || 1;
        const handle = Math.max(36, Math.min(dist * 0.5, 110));
        const p1 = { x: sStart.x + outT.x * handle, y: sStart.y + outT.y * handle };
        const p2 = { x: ePulled.x - inT.x * handle, y: ePulled.y - inT.y * handle };
        return {
          key: i,
          path: `M ${sStart.x} ${sStart.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${ePulled.x} ${ePulled.y}`,
          tip: arrowTip(ePulled, inT),
          fromAccent: a.accent,
          toAccent: b.accent,
          gradId: `swimlane-edge-${i}`
        };
      })
      .filter(Boolean)
  );

  const computedGroups = $derived(
    groups
      .map((g, i) => {
        const boxes = (g.members ?? []).map((id) => nodeMap[id]).filter(Boolean);
        if (!boxes.length) return null;
        const pad = 24;
        const x1 = Math.min(...boxes.map((b) => b.x)) - pad;
        const y1 = Math.min(...boxes.map((b) => b.y)) - pad;
        const x2 = Math.max(...boxes.map((b) => b.x + b.w)) + pad;
        const y2 = Math.max(...boxes.map((b) => b.y + b.h)) + pad;
        return { key: i, x: x1, y: y1, w: x2 - x1, h: y2 - y1, style: g.style ?? 'shaded', label: g.label };
      })
      .filter(Boolean)
  );
</script>

<section class="swimlane-panel reveal">
  {#if node?.title || node?.subtitle}
    <header class="swimlane-header">
      {#if node.title}<h3>{node.title}</h3>{/if}
      {#if node.subtitle}<p>{node.subtitle}</p>{/if}
    </header>
  {/if}

  <svg
    class="swimlane"
    viewBox={`0 0 ${width} ${totalHeight}`}
    role="img"
    aria-label={node?.title ?? 'Architecture diagram'}
  >
    <defs>
      {#each lanes as lane, i (lane.id)}
        <linearGradient id={`swimlane-lane-${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color={LANE_PALETTE[i % LANE_PALETTE.length]} stop-opacity="0.22" />
          <stop offset="32%" stop-color={LANE_PALETTE[i % LANE_PALETTE.length]} stop-opacity="0.07" />
          <stop offset="100%" stop-color={LANE_PALETTE[i % LANE_PALETTE.length]} stop-opacity="0.01" />
        </linearGradient>
      {/each}
      <linearGradient id="swimlane-divider" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.28)" stop-opacity="0" />
        <stop offset="14%" stop-color="rgba(255,255,255,0.28)" stop-opacity="1" />
        <stop offset="86%" stop-color="rgba(255,255,255,0.28)" stop-opacity="1" />
        <stop offset="100%" stop-color="rgba(255,255,255,0.28)" stop-opacity="0" />
      </linearGradient>
      <radialGradient id="swimlane-group-glow" cx="50%" cy="50%" r="65%">
        <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.10" />
        <stop offset="100%" stop-color="#a78bfa" stop-opacity="0" />
      </radialGradient>
      {#each computedEdges as e (e.key)}
        <linearGradient id={e.gradId} gradientUnits="userSpaceOnUse"
          x1={0} y1={0} x2={width} y2={0}
        >
          <stop offset="0%" stop-color={e.fromAccent} stop-opacity="0.85" />
          <stop offset="100%" stop-color={e.toAccent} stop-opacity="0.95" />
        </linearGradient>
      {/each}
    </defs>

    <!-- Lane gradient washes -->
    {#each lanes as lane, i (lane.id)}
      <rect
        x={laneAreaX + i * laneW}
        y={0}
        width={laneW}
        height={totalHeight}
        fill={`url(#swimlane-lane-${i})`}
      />
    {/each}

    <!-- Lane dividers (soft hairlines that fade at top/bottom) -->
    {#each lanes as lane, i (lane.id)}
      {#if i > 0}
        <line
          x1={laneAreaX + i * laneW}
          x2={laneAreaX + i * laneW}
          y1={0}
          y2={totalHeight}
          stroke="url(#swimlane-divider)"
          stroke-width="1"
          opacity="0.45"
        />
      {/if}
    {/each}

    <!-- Lane labels -->
    {#each lanes as lane, i (lane.id)}
      <text
        class="swimlane-lane-label"
        x={laneAreaX + i * laneW + laneW / 2}
        y={headerH - 22}
        text-anchor="middle"
        style={`fill: ${LANE_PALETTE[i % LANE_PALETTE.length]}`}
      >{lane.label}</text>
    {/each}

    <!-- Groups -->
    {#each computedGroups as g (g.key)}
      {#if g.style === 'shaded'}
        <rect class="swimlane-group-shaded" x={g.x} y={g.y} width={g.w} height={g.h} rx="16" />
        <rect x={g.x} y={g.y} width={g.w} height={g.h} rx="16" fill="url(#swimlane-group-glow)" />
      {:else}
        <rect class="swimlane-group-dashed" x={g.x} y={g.y} width={g.w} height={g.h} rx="16" />
      {/if}
      {#if g.label}
        <text class="swimlane-group-label" x={g.x + 14} y={g.y + 18}>{g.label}</text>
      {/if}
    {/each}

    <!-- Edges (drawn behind nodes) -->
    {#each computedEdges as e (e.key)}
      <g class="swimlane-edge">
        <path
          class="swimlane-edge-stroke"
          d={e.path}
          stroke={`url(#${e.gradId})`}
        />
        <path
          class="swimlane-edge-tip"
          d={e.tip}
          fill={e.toAccent}
        />
      </g>
    {/each}

    <!-- Nodes -->
    {#each flowNodes as n, i (n.id ?? i)}
      {@const box = nodeMap[n.id] ?? nodeBox(n)}
      <g class="swimlane-node" style={`--node-accent: ${box.accent}; --node-index: ${i};`}>
        {#if n.shape === 'actor'}
          {@const ringR = Math.min(box.w, box.h) * 0.5}
          {@const coreR = Math.min(box.w, box.h) * 0.26}
          <circle
            class="swimlane-actor-ring"
            cx={box.cx}
            cy={box.cy}
            r={ringR}
          />
          <circle
            class="swimlane-actor-core"
            cx={box.cx}
            cy={box.cy}
            r={coreR}
          />
          {#if n.label}
            <text class="swimlane-node-caption" x={box.cx} y={box.cy + ringR + 18} text-anchor="middle">{n.label}</text>
          {/if}
        {:else if n.shape === 'cylinder'}
          {@const ry = box.h * 0.18}
          <path
            class="swimlane-card swimlane-cylinder-body"
            d={`M ${box.x} ${box.y + ry}
                a ${box.w / 2} ${ry} 0 0 0 ${box.w} 0
                v ${box.h - ry * 2}
                a ${box.w / 2} ${ry} 0 0 1 ${-box.w} 0
                Z`}
          />
          <ellipse class="swimlane-cylinder-top" cx={box.cx} cy={box.y + ry} rx={box.w / 2} ry={ry} />
          <text class="swimlane-node-label" x={box.cx} y={box.cy + 4} text-anchor="middle">{n.label}</text>
        {:else}
          {@const titleLines = Array.isArray(n.label) ? n.label : String(n.label ?? '').split('\n')}
          {@const meta = nodeMeta(n)}
          {@const descriptionLines = wrapText(n.description, Math.max(18, Math.floor(box.w / 7)))}
          {@const hasDescription = Boolean(n.description)}
          <rect class="swimlane-card" x={box.x} y={box.y} width={box.w} height={box.h} rx="18" />
          {#if meta}
            <text class="swimlane-node-meta" x={box.x + 18} y={box.y + 16}>{meta}</text>
          {/if}
          {#each titleLines as line, li (li)}
            <text
              class="swimlane-node-label"
              x={box.cx}
              y={box.cy + (hasDescription ? 1 : 7) + (li - (titleLines.length - 1) / 2) * 15}
              text-anchor="middle"
            >{line}</text>
          {/each}
          {#if hasDescription}
            {#each descriptionLines as line, li (li)}
              <text
                class="swimlane-node-description"
                x={box.cx}
                y={box.cy + 20 + li * 13}
                text-anchor="middle"
              >{line}</text>
            {/each}
          {/if}
        {/if}
      </g>
    {/each}
  </svg>
</section>

<style>
  .swimlane-panel {
    width: min(1100px, 100%);
    color: var(--text-bright);
  }

  .swimlane-header {
    margin-bottom: 0.85rem;
    text-align: center;
  }

  .swimlane-header h3 {
    margin: 0;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 1.05rem;
  }

  .swimlane-header p {
    margin: 0.3rem auto 0;
    max-width: 720px;
    color: var(--text-mid);
    font-size: 0.75rem;
    line-height: 1.55;
  }

  .swimlane {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
    filter: drop-shadow(0 30px 80px rgba(0, 0, 0, 0.42));
  }

  .swimlane-lane-label {
    font-family: var(--font-mono);
    font-size: 13.5px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    opacity: 0.78;
  }

  .swimlane-group-shaded {
    fill: rgba(167, 139, 250, 0.045);
    stroke: rgba(167, 139, 250, 0.16);
    stroke-width: 1;
  }

  .swimlane-group-dashed {
    fill: none;
    stroke: rgba(238, 240, 244, 0.18);
    stroke-width: 1.2;
    stroke-dasharray: 5 7;
  }

  .swimlane-group-label {
    fill: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 9.5px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .swimlane-edge {
    animation: swimlane-edge-in 0.7s var(--ease-out-expo) both;
    animation-delay: calc(0.2s + var(--node-index, 0) * 0.04s);
  }

  .swimlane-edge-stroke {
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    filter: drop-shadow(0 0 6px rgba(167, 139, 250, 0.22));
    opacity: 0.92;
  }

  .swimlane-edge-tip {
    filter: drop-shadow(0 0 8px rgba(167, 139, 250, 0.35));
  }

  .swimlane-card {
    fill: rgba(16, 19, 30, 0.94);
    stroke: color-mix(in srgb, var(--node-accent) 38%, rgba(255, 255, 255, 0.08));
    stroke-width: 1.1;
    filter:
      drop-shadow(0 18px 38px rgba(0, 0, 0, 0.2))
      drop-shadow(0 0 22px color-mix(in srgb, var(--node-accent) 22%, transparent));
  }

  .swimlane-cylinder-body {
    fill: rgba(16, 19, 30, 0.92);
  }

  .swimlane-cylinder-top {
    fill: rgba(28, 32, 46, 0.94);
    stroke: color-mix(in srgb, var(--node-accent) 55%, rgba(255, 255, 255, 0.05));
    stroke-width: 1.1;
  }

  .swimlane-actor-ring {
    fill: none;
    stroke: color-mix(in srgb, var(--node-accent) 55%, rgba(255, 255, 255, 0.08));
    stroke-width: 1.2;
    stroke-dasharray: 2 4;
    opacity: 0.85;
  }

  .swimlane-actor-core {
    fill: var(--node-accent);
    filter: drop-shadow(0 0 14px color-mix(in srgb, var(--node-accent) 65%, transparent));
  }

  .swimlane-node {
    animation: swimlane-fade 0.55s var(--ease-out-expo) both;
    animation-delay: calc(0.1s + var(--node-index) * 0.05s);
  }

  .swimlane-node-label {
    fill: var(--text-bright);
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0;
  }

  .swimlane-node-meta {
    fill: color-mix(in srgb, var(--node-accent) 78%, white 22%);
    font-family: var(--font-mono);
    font-size: 8.5px;
    font-weight: 900;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  .swimlane-node-description {
    fill: var(--text-dim);
    font-family: var(--font-body);
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0;
  }

  .swimlane-node-caption {
    fill: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  @keyframes swimlane-fade {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes swimlane-edge-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (max-width: 820px) {
    .swimlane-panel { width: 100%; }
  }
</style>
