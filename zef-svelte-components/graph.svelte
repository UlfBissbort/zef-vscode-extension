<!-- +++
this = "ET.SvelteComponent('🍃-9f3d4e8a7c6210b5d943')"
tag_ = []
dispatched_on = "Graph"
created = "Time('2026-08-15 17:10:00 +0800')"
[ns]
"Graph" = "ET('4772617068')"
+++ -->

<script>
  import { onMount, tick } from 'svelte';

  /** Render the normalized entity-fact snapshot emitted by Graph | to_json_like. */
  export let data;
  let focused = null;
  let isFullWidth = false;
  let figure;

  const width = 820;
  const height = 450;
  const palette = ['#ad6cff', '#3ec189', '#ff9f43', '#60a5fa', '#e879a9', '#22d3ee'];

  function isRecord(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function isEntity(value) { return isRecord(value) && typeof value.__type === 'string' && value.__type.startsWith('ET.'); }
  function entityKey(entity) {
    const identity = entity.__uid ?? entity.__local_name;
    return `${entity.__type}:${identity === undefined ? JSON.stringify(entity) : String(identity)}`;
  }
  function valueKey(value) { return `value:${JSON.stringify(value)}`; }
  function typeColor(type) {
    let hash = 0;
    for (const character of type) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    return palette[hash % palette.length];
  }
  function literal(value) {
    const text = typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value);
    return text && text.length > 26 ? `${text.slice(0, 25)}…` : text ?? String(value);
  }
  function caption(entity) {
    return entity.__uid ? entity.__uid.slice(0, 10) : `#${entity.__local_name}`;
  }
  function addValue(value, field, source, nodes, edges) {
    if (isEntity(value)) {
      const key = entityKey(value);
      if (!nodes.has(key)) nodes.set(key, { id: key, kind: 'entity', entity: value, type: value.__type, color: typeColor(value.__type) });
      edges.push({ from: source, to: key, label: field });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => addValue(item, `${field}[${index}]`, source, nodes, edges));
    } else if (isRecord(value) && value.__type === 'Set' && Array.isArray(value.__items)) {
      value.__items.forEach(item => addValue(item, field, source, nodes, edges));
    } else {
      const key = valueKey(value);
      if (!nodes.has(key)) nodes.set(key, { id: key, kind: 'value', text: literal(value) });
      edges.push({ from: source, to: key, label: field });
    }
  }
  function graphModel(graph) {
    const nodes = new Map();
    const edges = [];
    const facts = Array.isArray(graph?.data) ? graph.data.filter(isEntity) : [];
    for (const fact of facts) {
      const key = entityKey(fact);
      nodes.set(key, { id: key, kind: 'entity', entity: fact, type: fact.__type, color: typeColor(fact.__type) });
    }
    for (const fact of facts) {
      const source = entityKey(fact);
      for (const [field, value] of Object.entries(fact)) {
        if (!field.startsWith('__')) addValue(value, field, source, nodes, edges);
      }
    }
    return { nodes: [...nodes.values()], edges };
  }
  function layout(model) {
    const nodes = model.nodes.map((node, index) => {
      const angle = (index / Math.max(model.nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const radius = node.kind === 'entity' ? 100 : 175;
      return { ...node, x: width / 2 + Math.cos(angle) * radius, y: height / 2 + Math.sin(angle) * radius, vx: 0, vy: 0 };
    });
    const byId = Object.fromEntries(nodes.map(node => [node.id, node]));
    for (let step = 0; step < 260; step += 1) {
      const alpha = 1 - step / 260;
      for (let i = 0; i < nodes.length; i += 1) for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i], b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        const distance = Math.max(12, Math.hypot(dx, dy));
        dx /= distance; dy /= distance;
        const force = (a.kind === 'entity' && b.kind === 'entity' ? 3900 : 1750) / (distance * distance) * alpha;
        a.vx -= dx * force; a.vy -= dy * force; b.vx += dx * force; b.vy += dy * force;
      }
      for (const edge of model.edges) {
        const a = byId[edge.from], b = byId[edge.to];
        if (!a || !b) continue;
        const dx = b.x - a.x, dy = b.y - a.y, distance = Math.max(1, Math.hypot(dx, dy));
        const force = (distance - (b.kind === 'entity' ? 155 : 92)) * 0.045 * alpha;
        a.vx += dx / distance * force; a.vy += dy / distance * force; b.vx -= dx / distance * force; b.vy -= dy / distance * force;
      }
      for (const node of nodes) {
        node.vx += (width / 2 - node.x) * 0.0015 * alpha; node.vy += (height / 2 - node.y) * 0.002 * alpha;
        node.x = Math.max(35, Math.min(width - 35, node.x + node.vx * 0.82)); node.y = Math.max(32, Math.min(height - 32, node.y + node.vy * 0.82)); node.vx *= 0.65; node.vy *= 0.65;
      }
    }
    return { nodes, edges: model.edges, byId };
  }
  function edgePath(edge, model) {
    const a = model.byId[edge.from], b = model.byId[edge.to];
    if (!a || !b) return '';
    const dx = b.x - a.x, dy = b.y - a.y, distance = Math.max(1, Math.hypot(dx, dy)), pad = b.kind === 'entity' ? 13 : 17;
    return `M ${a.x + dx / distance * 12} ${a.y + dy / distance * 12} L ${b.x - dx / distance * pad} ${b.y - dy / distance * pad}`;
  }
  function edgeLabel(edge, model) { const a = model.byId[edge.from], b = model.byId[edge.to]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 5 }; }
  function isDim(nodeId, edges) { return focused && focused !== nodeId && !edges.some(edge => (edge.from === focused && edge.to === nodeId) || (edge.to === focused && edge.from === nodeId)); }
  function isEdgeDim(edge) { return focused && edge.from !== focused && edge.to !== focused; }
  function toggleFullWidth() { isFullWidth = !isFullWidth; window.parent.postMessage({ type: 'zefEntityToggleFullWidth', entityType: 'Graph' }, '*'); reportHeightAfterLayout(); }
  function reportHeight() { if (figure) window.parent.postMessage({ type: 'zefEntityResize', height: Math.ceil(figure.getBoundingClientRect().height) }, '*'); }
  function reportHeightAfterLayout() { void tick().then(() => { requestAnimationFrame(() => requestAnimationFrame(reportHeight)); window.setTimeout(reportHeight, 50); window.setTimeout(reportHeight, 200); }); }
  onMount(() => { const observer = new ResizeObserver(reportHeightAfterLayout); observer.observe(figure); reportHeightAfterLayout(); return () => observer.disconnect(); });

  $: model = layout(graphModel(data));
  $: entityTypes = [...new Map(model.nodes.filter(node => node.kind === 'entity').map(node => [node.type, node.color])).entries()];
</script>

{#if data?.__type === 'Graph'}
  <figure bind:this={figure} class:full-width={isFullWidth} class="graph" aria-label="Zef entity graph">
    <header><div class="legend">{#each entityTypes as [type, color]}<span><i style={`color: ${color}`}></i>{type.slice(3)}</span>{/each}<span><b></b>Value</span></div><button type="button" title="Toggle full width" aria-label="Toggle full width" onclick={toggleFullWidth}><svg viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></svg></button></header>
    {#if model.nodes.length}
      <div class="stage"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Entity graph">
        <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 1 L9 5 L0 9Z" /></marker></defs>
        {#each model.edges as edge (edge.from + edge.to + edge.label)}{@const label = edgeLabel(edge, model)}<g class:dim={isEdgeDim(edge)}><path class="edge" d={edgePath(edge, model)} marker-end="url(#arrow)" /><text class="relation" x={label.x} y={label.y}>{edge.label}</text></g>{/each}
        {#each model.nodes as node (node.id)}<g class:dim={isDim(node.id, model.edges)} class="node" transform={`translate(${node.x} ${node.y})`} onmouseenter={() => focused = node.id} onmouseleave={() => focused = null}>{#if node.kind === 'entity'}<text class="type" y="-16" fill={node.color}>{node.type}</text><rect class="entity" x="-7" y="-7" width="14" height="14" rx="2.5" fill={node.color} /><text class="uid" y="20">{caption(node.entity)}</text>{:else}<rect class="value" x={-Math.max(36, node.text.length * 7 + 16) / 2} y="-11" width={Math.max(36, node.text.length * 7 + 16)} height="22" rx="11" /><text class="literal" y="4">{node.text}</text>{/if}</g>{/each}
      </svg></div>
    {:else}<div class="empty">This graph contains no entity facts.</div>{/if}
    <footer><code>Graph | to_json_like</code><span>hover to isolate connected facts</span></footer>
  </figure>
{:else}<p class="error">Graph requires a native graph value.</p>{/if}

<style>
  :global(html), :global(body) { overflow: hidden; padding: 0 !important; } .graph { color: #e4e4e7; font-family: Inter, ui-sans-serif, system-ui, sans-serif; margin: 0; max-width: 820px; } .graph.full-width { margin-left: auto; margin-right: auto; } header { align-items: center; border-bottom: 1px solid #1b1b1e; display: flex; justify-content: space-between; padding: 10px 2px; } .legend { display: flex; flex-wrap: wrap; gap: 13px; } .legend span { align-items: center; color: #71717a; display: inline-flex; font-size: 11px; gap: 5px; } .legend i, .legend b { background: currentColor; border-radius: 2px; display: block; height: 8px; width: 8px; } .legend b { background: #27272a; border: 1px solid #52525b; border-radius: 99px; width: 12px; } button { background: transparent; border: 1px solid #27272a; border-radius: 6px; color: #71717a; cursor: pointer; display: grid; height: 30px; padding: 6px; place-items: center; width: 30px; } button:hover { color: #a1a1aa; } button svg { fill: none; height: 16px; stroke: currentColor; stroke-linecap: round; stroke-width: 1.5; width: 16px; } .stage { background-image: radial-gradient(circle at 1px 1px, #17171a 1px, transparent 0); background-size: 22px 22px; } svg { display: block; height: auto; width: 100%; } .edge { fill: none; stroke: #3f3f46; stroke-width: 1.1; } marker path { fill: #3f3f46; } .relation { fill: #71717a; font-size: 9px; paint-order: stroke; stroke: #0a0a0a; stroke-linejoin: round; stroke-width: 3px; text-anchor: middle; } .node { cursor: crosshair; transition: opacity 180ms ease; } .dim { opacity: 0.14; } .entity { stroke: #0a0a0a; stroke-width: 1.25; } .type { font-size: 10px; font-weight: 600; paint-order: stroke; stroke: #0a0a0a; stroke-linejoin: round; stroke-width: 3px; text-anchor: middle; } .uid { fill: #5c5c65; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 8px; paint-order: stroke; stroke: #0a0a0a; stroke-linejoin: round; stroke-width: 3px; text-anchor: middle; } .value { fill: #18181b; stroke: #3f3f46; } .literal { fill: #a1a1aa; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; text-anchor: middle; } .empty { color: #71717a; font-size: 13px; padding: 48px 0; text-align: center; } footer { border-top: 1px solid #1b1b1e; color: #5c5c65; display: flex; font-size: 11px; justify-content: space-between; padding: 9px 2px; } code { color: #71717a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; } .error { color: #fda4af; }
</style>
