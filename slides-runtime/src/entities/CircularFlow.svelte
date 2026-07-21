<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();

  const geometry = $derived({
    size: node?.size ?? 420,
    center: (node?.size ?? 420) / 2,
    radius: (node?.radius ?? 150),
    thickness: node?.thickness ?? 44
  });
  const children = $derived((node?.content_ ?? []).filter((child) => child?.__type === 'ET.FlowSegment'));
  const palette = ['#a78bfa', '#7c5bf0', '#5b8def', '#38bdf8', '#34d399'];
  const gapDegrees = $derived(node?.gapDegrees ?? (children.length <= 4 ? 27 : 15));
  const startAngle = $derived(node?.startAngle ?? -90);

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

  function polarPoint(radius, angle) {
    const radians = (angle * Math.PI) / 180;
    return {
      x: geometry.center + radius * Math.cos(radians),
      y: geometry.center + radius * Math.sin(radians)
    };
  }

  function annularArrowPath(start, end) {
    const outer = geometry.radius + geometry.thickness / 2;
    const inner = geometry.radius - geometry.thickness / 2;
    const headDegrees = Math.min(10, Math.max(6, (end - start) * 0.14));
    const neck = end - headDegrees;
    const tip = polarPoint(geometry.radius + geometry.thickness * 0.02, end);
    const outerStart = polarPoint(outer, start);
    const outerNeck = polarPoint(outer, neck);
    const innerNeck = polarPoint(inner, neck);
    const innerStart = polarPoint(inner, start);
    const largeArc = neck - start > 180 ? 1 : 0;

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outer} ${outer} 0 ${largeArc} 1 ${outerNeck.x} ${outerNeck.y}`,
      `L ${tip.x} ${tip.y}`,
      `L ${innerNeck.x} ${innerNeck.y}`,
      `A ${inner} ${inner} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      'Z'
    ].join(' ');
  }

  function textLines(label) {
    const words = String(label ?? '').split(/\s+/).filter(Boolean);
    if (words.length <= 2) return [words.join(' ')];
    const midpoint = Math.ceil(words.length / 2);
    return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')];
  }

  const segments = $derived.by(() => {
    const count = Math.max(1, children.length);
    const step = 360 / count;
    return children.map((child, index) => {
      const start = startAngle + index * step + gapDegrees / 2;
      const end = startAngle + (index + 1) * step - gapDegrees / 2;
      const nextGap = startAngle + (index + 1) * step;
      const labelPoint = polarPoint(geometry.radius + geometry.thickness / 2 + 8, nextGap);
      const ratio = count === 1 ? 0 : index / (count - 1);
      const color = child.accentColor ?? interpolateColor(palette, ratio);
      const next = children[(index + 1) % count];
      const transitionLabel = child.transitionLabel ?? `${child.label ?? ''} -> ${next?.label ?? children[0]?.label ?? ''}`;
      return {
        ...child,
        key: child.id ?? child.label ?? index,
        path: annularArrowPath(start, end),
        labelX: labelPoint.x,
        labelY: labelPoint.y,
        lines: textLines(transitionLabel),
        color
      };
    });
  });
</script>

<section class="circular-flow-panel reveal">
  {#if node.title || node.subtitle}
    <header class="circular-flow-header">
      {#if node.title}<h3>{node.title}</h3>{/if}
      {#if node.subtitle}<p>{node.subtitle}</p>{/if}
    </header>
  {/if}

  <div class="circular-flow-body">
    <svg
      class="circular-flow"
      viewBox={`0 0 ${geometry.size} ${geometry.size}`}
      role="img"
      aria-label={node.title ?? 'Circular flow'}
    >
      <circle class="circular-flow__track" cx={geometry.center} cy={geometry.center} r={geometry.radius} />

      {#each segments as segment, index (segment.key)}
        <path
          class="circular-flow__segment"
          d={segment.path}
          fill={segment.color}
          style={`--segment-index: ${index}; --segment-color: ${segment.color}`}
        />
      {/each}

      {#each segments as segment, index (segment.key)}
        <text
          class="circular-flow__label"
          x={segment.labelX}
          y={segment.labelY - (segment.lines.length - 1) * 8}
          text-anchor="middle"
        >
          {#each segment.lines as line, lineIndex (lineIndex)}
            <tspan x={segment.labelX} dy={lineIndex === 0 ? 0 : 17}>{line}</tspan>
          {/each}
        </text>
      {/each}

      <circle class="circular-flow__core" cx={geometry.center} cy={geometry.center} r={geometry.radius - geometry.thickness - 16} />
      <text class="circular-flow__center" x={geometry.center} y={geometry.center - 4} text-anchor="middle">
        {node.centerLabel ?? 'Composable loop'}
      </text>
      {#if node.centerSubtitle}
        <text class="circular-flow__center-subtitle" x={geometry.center} y={geometry.center + 22} text-anchor="middle">
          {node.centerSubtitle}
        </text>
      {/if}
    </svg>

    {#if segments.some((segment) => segment.description)}
      <div class="circular-flow-rail">
        {#each segments as segment, index (segment.key)}
          <article style={`--segment-color: ${segment.color}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <strong>{segment.label}</strong>
              {#if segment.description}<p>{segment.description}</p>{/if}
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .circular-flow-panel {
    width: min(720px, 100%);
    color: var(--text-bright);
  }

  .circular-flow-header {
    margin-bottom: 1rem;
    text-align: left;
  }

  .circular-flow-header h3 {
    margin: 0;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 1.05rem;
  }

  .circular-flow-header p {
    margin: 0.35rem 0 0;
    color: var(--text-mid);
    font-size: 0.75rem;
    line-height: 1.5;
  }

  .circular-flow-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
    align-items: center;
  }

  .circular-flow {
    width: min(520px, 100%);
    margin: 0 auto;
    overflow: visible;
    filter: drop-shadow(0 24px 70px rgba(0, 0, 0, 0.28));
  }

  .circular-flow__track {
    fill: none;
    stroke: rgba(255, 255, 255, 0.055);
    stroke-width: 38;
  }

  .circular-flow__segment {
    filter: drop-shadow(0 0 14px color-mix(in srgb, var(--segment-color) 38%, transparent));
    animation: circular-flow-reveal 0.72s var(--ease-out-expo) both;
    animation-delay: calc(0.1s + var(--segment-index) * 0.08s);
  }

  .circular-flow__label {
    fill: var(--text-bright);
    font-family: var(--font-display);
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0;
    paint-order: stroke;
    stroke: rgba(6, 8, 14, 0.82);
    stroke-width: 4px;
    stroke-linejoin: round;
  }

  .circular-flow__core {
    fill: rgba(12, 16, 27, 0.92);
    stroke: rgba(255, 255, 255, 0.08);
    stroke-width: 1;
  }

  .circular-flow__center {
    fill: var(--text-bright);
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 800;
  }

  .circular-flow__center-subtitle {
    fill: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 0.58rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .circular-flow-rail {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
  }

  .circular-flow-rail article {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.65rem;
    align-items: start;
    padding: 0.7rem;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 8px;
    background: rgba(16, 19, 30, 0.76);
    box-shadow: inset 2px 0 0 var(--segment-color);
  }

  .circular-flow-rail span {
    color: var(--segment-color);
    font: 800 0.62rem/1 var(--font-mono);
  }

  .circular-flow-rail strong {
    display: block;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 0.76rem;
    line-height: 1.2;
  }

  .circular-flow-rail p {
    margin: 0.22rem 0 0;
    color: var(--text-dim);
    font-size: 0.64rem;
    line-height: 1.45;
  }

  @keyframes circular-flow-reveal {
    from { opacity: 0; transform: scale(0.96); transform-origin: center; }
    to { opacity: 1; transform: scale(1); transform-origin: center; }
  }

  @media (max-width: 820px) {
    .circular-flow {
      width: min(430px, 100%);
    }

    .circular-flow-rail {
      grid-template-columns: 1fr;
    }
  }
</style>
