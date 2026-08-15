<!-- +++
this = "ET.SvelteComponent('🍃-9f3d4e8a7c6210b5d943')"
tag_ = []
dispatched_on = "ET.Graph"
created = "Time('2026-08-15 17:10:00 +0800')"
[ns]
"ET.Graph" = "ET('4772617068')"
+++ -->

<script>
  import { onMount, tick } from 'svelte';

  /** A deliberately fixed first graph view for Graph([]). */
  export let data;
  let focused = null;
  let isFullWidth = false;
  let figure;

  const entities = [
    { id: 'alice', type: 'ET.Person', uid: 'a1f3…', x: 240, y: 175, color: '#ad6cff' },
    { id: 'bob', type: 'ET.Person', uid: '77c4…', x: 340, y: 310, color: '#ad6cff' },
    { id: 'berlin', type: 'ET.City', uid: 'c0de…', x: 510, y: 170, color: '#3ec189' },
    { id: 'acme', type: 'ET.Company', uid: '9b21…', x: 610, y: 300, color: '#ff9f43' }
  ];
  const values = [
    { id: 'alice_name', text: '"Alice"', x: 95, y: 100 }, { id: 'bob_name', text: '"Bob"', x: 120, y: 365 },
    { id: 'engineer', text: '"engineer"', x: 285, y: 70 }, { id: 'berlin_name', text: '"Berlin"', x: 555, y: 80 },
    { id: 'germany', text: '"Germany"', x: 695, y: 135 }, { id: 'acme_name', text: '"Acme"', x: 735, y: 360 },
    { id: 'age_30', text: '30', x: 120, y: 200 }, { id: 'age_25', text: '25', x: 235, y: 400 }
  ];
  const nodes = [...entities, ...values];
  const byId = Object.fromEntries(nodes.map(node => [node.id, node]));
  const edges = [
    ['alice', 'alice_name', 'name'], ['alice', 'age_30', 'age'], ['alice', 'engineer', 'role'],
    ['bob', 'bob_name', 'name'], ['bob', 'age_25', 'age'], ['bob', 'engineer', 'role'],
    ['berlin', 'berlin_name', 'name'], ['berlin', 'germany', 'country'], ['acme', 'acme_name', 'name'],
    ['alice', 'bob', 'knows'], ['alice', 'berlin', 'lives_in'], ['bob', 'berlin', 'lives_in'], ['alice', 'acme', 'works_at'], ['bob', 'acme', 'works_at'], ['acme', 'berlin', 'hq']
  ].map(([from, to, label]) => ({ from, to, label }));

  function edgePath(edge) {
    const a = byId[edge.from], b = byId[edge.to];
    const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy) || 1;
    const pad = 13;
    return `M ${a.x + dx / distance * pad} ${a.y + dy / distance * pad} L ${b.x - dx / distance * pad} ${b.y - dy / distance * pad}`;
  }

  function edgeLabel(edge) {
    const a = byId[edge.from], b = byId[edge.to];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 5 };
  }

  function dim(nodeId) {
    return focused && focused !== nodeId && !edges.some(edge => (edge.from === focused && edge.to === nodeId) || (edge.to === focused && edge.from === nodeId));
  }

  function edgeDim(edge) {
    return focused && edge.from !== focused && edge.to !== focused;
  }

  function toggleFullWidth() {
    isFullWidth = !isFullWidth;
    window.parent.postMessage({ type: 'zefEntityToggleFullWidth', entityType: 'ET.Graph' }, '*');
  }

  function reportHeight() {
    if (figure) window.parent.postMessage({ type: 'zefEntityResize', height: Math.ceil(figure.getBoundingClientRect().height) }, '*');
  }

  onMount(() => {
    const observer = new ResizeObserver(() => void tick().then(reportHeight));
    observer.observe(figure);
    reportHeight();
    return () => observer.disconnect();
  });
</script>

{#if data?.__type === 'ET.Graph'}
  <figure bind:this={figure} class:full-width={isFullWidth} class="graph" aria-label="Hard-coded entity graph">
    <header>
      <div class="legend"><span><i class="person"></i>Person</span><span><i class="city"></i>City</span><span><i class="company"></i>Company</span><span><b></b>Value</span></div>
      <button type="button" title="Toggle full width" aria-label="Toggle full width" onclick={toggleFullWidth}><svg viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></svg></button>
    </header>
    <div class="stage">
      <svg viewBox="0 0 820 450" role="img" aria-label="People, city, company, and shared value nodes">
        <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 1 L9 5 L0 9Z" /></marker></defs>
        {#each edges as edge (edge.from + edge.to + edge.label)}
          {@const label = edgeLabel(edge)}
          <g class:dim={edgeDim(edge)}><path class="edge" d={edgePath(edge)} marker-end="url(#arrow)" /><text class="relation" x={label.x} y={label.y}>{edge.label}</text></g>
        {/each}
        {#each entities as node (node.id)}
          <g class:dim={dim(node.id)} class="node" transform={`translate(${node.x} ${node.y})`} onmouseenter={() => focused = node.id} onmouseleave={() => focused = null}>
            <text class="type" y="-16" fill={node.color}>{node.type}</text><rect class="entity" x="-7" y="-7" width="14" height="14" rx="2.5" fill={node.color} /><text class="uid" y="20">🍃-{node.uid}</text>
          </g>
        {/each}
        {#each values as node (node.id)}
          {@const width = Math.max(36, node.text.length * 7 + 16)}
          <g class:dim={dim(node.id)} class="node" transform={`translate(${node.x} ${node.y})`} onmouseenter={() => focused = node.id} onmouseleave={() => focused = null}><rect class="value" x={-width / 2} y="-11" width={width} height="22" rx="11" /><text class="literal" y="4">{node.text}</text></g>
        {/each}
      </svg>
    </div>
    <footer><code>Graph([])</code><span>hover to isolate connected facts</span></footer>
  </figure>
{:else}<p class="error">Graph requires a graph value.</p>{/if}

<style>
  :global(body) { padding: 0 !important; }
  .graph { color: #e4e4e7; font-family: Inter, ui-sans-serif, system-ui, sans-serif; margin: 0; max-width: 820px; } .graph.full-width { margin-left: auto; margin-right: auto; }
  header { align-items: center; border-bottom: 1px solid #1b1b1e; display: flex; justify-content: space-between; padding: 10px 2px; } .legend { display: flex; flex-wrap: wrap; gap: 13px; } .legend span { align-items: center; color: #71717a; display: inline-flex; font-size: 11px; gap: 5px; } .legend i, .legend b { background: currentColor; border-radius: 2px; display: block; height: 8px; width: 8px; } .legend .person { color: #ad6cff; } .legend .city { color: #3ec189; } .legend .company { color: #ff9f43; } .legend b { background: #27272a; border: 1px solid #52525b; border-radius: 99px; width: 12px; }
  button { background: transparent; border: 1px solid #27272a; border-radius: 6px; color: #71717a; cursor: pointer; display: grid; height: 30px; padding: 6px; place-items: center; width: 30px; } button:hover { color: #a1a1aa; } button svg { fill: none; height: 16px; stroke: currentColor; stroke-linecap: round; stroke-width: 1.5; width: 16px; }
  .stage { background-image: radial-gradient(circle at 1px 1px, #17171a 1px, transparent 0); background-size: 22px 22px; } svg { display: block; height: auto; width: 100%; } .edge { fill: none; marker-end: url(#arrow); stroke: #3f3f46; stroke-width: 1.1; } marker path { fill: #3f3f46; } .relation { fill: #71717a; font-size: 9px; paint-order: stroke; stroke: #0a0a0a; stroke-linejoin: round; stroke-width: 3px; text-anchor: middle; } .node { cursor: crosshair; transition: opacity 180ms ease; } .dim { opacity: 0.14; } .entity { stroke: #0a0a0a; stroke-width: 1.25; } .type { font-size: 10px; font-weight: 600; paint-order: stroke; stroke: #0a0a0a; stroke-linejoin: round; stroke-width: 3px; text-anchor: middle; } .uid { fill: #5c5c65; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 8px; paint-order: stroke; stroke: #0a0a0a; stroke-linejoin: round; stroke-width: 3px; text-anchor: middle; } .value { fill: #18181b; stroke: #3f3f46; } .literal { fill: #a1a1aa; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; text-anchor: middle; }
  footer { border-top: 1px solid #1b1b1e; color: #5c5c65; display: flex; font-size: 11px; justify-content: space-between; padding: 9px 2px; } code { color: #71717a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; } .error { color: #fda4af; }
</style>
