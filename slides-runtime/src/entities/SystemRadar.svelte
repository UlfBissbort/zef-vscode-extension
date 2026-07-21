<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();

  const axes = $derived((node?.content_ ?? []).filter((child) => child?.__type === 'ET.RadarAxis'));
  const palette = ['#a78bfa', '#7c5bf0', '#5b8def', '#38bdf8', '#34d399'];
  const geometry = { size: 520, center: 260, radius: 168 };
  const rings = [0.25, 0.5, 0.75, 1];

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

  function polarPoint(index, count, radius) {
    const angle = (-90 + (360 / count) * index) * (Math.PI / 180);
    return {
      x: geometry.center + radius * Math.cos(angle),
      y: geometry.center + radius * Math.sin(angle)
    };
  }

  function pathFromPoints(points) {
    if (!points.length) return '';
    return `${points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')} Z`;
  }

  function labelLines(label) {
    const words = String(label ?? '').split(/\s+/).filter(Boolean);
    if (words.length <= 2) return [words.join(' ')];
    const midpoint = Math.ceil(words.length / 2);
    return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')];
  }

  const models = $derived.by(() => {
    const count = Math.max(1, axes.length);
    return axes.map((axis, index) => {
      const value = Math.max(0, Math.min(1, axis.value ?? 0));
      const color = axis.accentColor ?? interpolateColor(palette, count === 1 ? 0.5 : index / (count - 1));
      return {
        ...axis,
        key: axis.id ?? axis.label ?? index,
        index,
        value,
        color,
        axisEnd: polarPoint(index, count, geometry.radius),
        valuePoint: polarPoint(index, count, geometry.radius * value),
        labelPoint: polarPoint(index, count, geometry.radius + 52),
        labelLines: labelLines(axis.label)
      };
    });
  });

  const gridPaths = $derived.by(() => {
    const count = Math.max(1, axes.length);
    return rings.map((ring) => pathFromPoints(Array.from({ length: count }, (_, index) => polarPoint(index, count, geometry.radius * ring))));
  });
  const valuePath = $derived(pathFromPoints(models.map((axis) => axis.valuePoint)));
  const averageValue = $derived.by(() => {
    if (!models.length) return 0;
    return models.reduce((total, axis) => total + axis.value, 0) / models.length;
  });
</script>

<section class="system-radar reveal">
  {#if node.title || node.subtitle}
    <header class="system-radar__header">
      {#if node.title}<h3>{node.title}</h3>{/if}
      {#if node.subtitle}<p>{node.subtitle}</p>{/if}
    </header>
  {/if}

  <div class="system-radar__stage">
    <svg class="system-radar__svg" viewBox={`0 0 ${geometry.size} ${geometry.size}`} role="img" aria-label={node.title ?? 'System radar'}>
      <defs>
        <linearGradient id="system-radar-stroke" x1="80" y1="80" x2="440" y2="440" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#a78bfa" />
          <stop offset="35%" stop-color="#5b8def" />
          <stop offset="68%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#34d399" />
        </linearGradient>
        <radialGradient id="system-radar-fill" cx="50%" cy="46%" r="56%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.26" />
          <stop offset="58%" stop-color="#7c5bf0" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#34d399" stop-opacity="0.08" />
        </radialGradient>
      </defs>

      <circle class="radar-ambient" cx={geometry.center} cy={geometry.center} r="210" />

      {#each gridPaths as gridPath, index (index)}
        <path class="radar-grid-ring" class:outer={index === gridPaths.length - 1} d={gridPath} />
      {/each}

      {#each models as axis (axis.key)}
        <line class="radar-axis-line" x1={geometry.center} y1={geometry.center} x2={axis.axisEnd.x} y2={axis.axisEnd.y} />
      {/each}

      <path class="radar-value-fill" d={valuePath} />
      <path class="radar-value-stroke" d={valuePath} />

      {#each models as axis (axis.key)}
        <g class="radar-point" style={`--axis-color: ${axis.color}; --axis-index: ${axis.index}`}>
          <circle class="radar-point__halo" cx={axis.valuePoint.x} cy={axis.valuePoint.y} r="8" />
          <circle class="radar-point__dot" cx={axis.valuePoint.x} cy={axis.valuePoint.y} r="4" />
        </g>
        <text class="radar-label" x={axis.labelPoint.x} y={axis.labelPoint.y - (axis.labelLines.length - 1) * 7} text-anchor="middle">
          {#each axis.labelLines as line, lineIndex (lineIndex)}
            <tspan x={axis.labelPoint.x} dy={lineIndex === 0 ? 0 : 15}>{line}</tspan>
          {/each}
        </text>
        <text class="radar-value-label" x={axis.labelPoint.x} y={axis.labelPoint.y + 30} text-anchor="middle">
          {Math.round(axis.value * 100)}%
        </text>
      {/each}

      <circle class="radar-core" cx={geometry.center} cy={geometry.center} r="56" />
      <text class="radar-core-kicker" x={geometry.center} y={geometry.center - 16} text-anchor="middle">
        {node.centerLabel ?? 'readiness'}
      </text>
      <text class="radar-core-value" x={geometry.center} y={geometry.center + 12} text-anchor="middle">
        {node.centerValue ?? `${Math.round(averageValue * 100)}%`}
      </text>
      {#if node.scaleLabel}
        <text class="radar-core-subtitle" x={geometry.center} y={geometry.center + 32} text-anchor="middle">{node.scaleLabel}</text>
      {/if}
    </svg>
  </div>
</section>

<style>
  .system-radar {
    width: min(760px, 100%);
    color: var(--text-bright);
  }

  .system-radar__header {
    margin-bottom: 0.35rem;
    text-align: center;
  }

  .system-radar__header h3 {
    margin: 0;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 1.28rem;
    font-weight: 800;
  }

  .system-radar__header p {
    max-width: 620px;
    margin: 0.35rem auto 0;
    color: var(--text-mid);
    font-size: 0.86rem;
    line-height: 1.5;
  }

  .system-radar__stage {
    display: grid;
    place-items: center;
  }

  .system-radar__svg {
    width: min(560px, 100%);
    overflow: visible;
    filter: drop-shadow(0 24px 70px rgba(0, 0, 0, 0.3));
  }

  .radar-ambient {
    fill: url(#system-radar-fill);
    opacity: 0.45;
  }

  .radar-grid-ring {
    fill: none;
    stroke: rgba(255, 255, 255, 0.075);
    stroke-width: 1;
  }

  .radar-grid-ring.outer {
    stroke: rgba(167, 139, 250, 0.18);
  }

  .radar-axis-line {
    stroke: rgba(255, 255, 255, 0.07);
    stroke-width: 1;
  }

  .radar-value-fill {
    fill: url(#system-radar-fill);
    stroke: none;
  }

  .radar-value-stroke {
    fill: none;
    stroke: url(#system-radar-stroke);
    stroke-width: 2.2;
    filter: drop-shadow(0 0 14px rgba(56, 189, 248, 0.28));
  }

  .radar-point {
    animation: radar-point-reveal 0.68s var(--ease-out-expo) both;
    animation-delay: calc(0.15s + var(--axis-index) * 0.06s);
  }

  .radar-point__halo {
    fill: color-mix(in srgb, var(--axis-color) 20%, transparent);
  }

  .radar-point__dot {
    fill: var(--axis-color);
    filter: drop-shadow(0 0 9px color-mix(in srgb, var(--axis-color) 42%, transparent));
  }

  .radar-label {
    fill: var(--text-bright);
    font-family: var(--font-display);
    font-size: 0.86rem;
    font-weight: 800;
    paint-order: stroke;
    stroke: rgba(6, 8, 14, 0.84);
    stroke-width: 4px;
    stroke-linejoin: round;
  }

  .radar-value-label {
    fill: var(--text-mid);
    font: 800 0.68rem/1 var(--font-mono);
  }

  .radar-core {
    fill: rgba(10, 14, 24, 0.9);
    stroke: rgba(255, 255, 255, 0.085);
    stroke-width: 1;
  }

  .radar-core-kicker {
    fill: var(--purple-light);
    font: 800 0.62rem/1 var(--font-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .radar-core-value {
    fill: var(--text-bright);
    font-family: var(--font-display);
    font-size: 1.68rem;
    font-weight: 800;
  }

  .radar-core-subtitle {
    fill: var(--text-dim);
    font: 800 0.56rem/1 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  @keyframes radar-point-reveal {
    from { opacity: 0; transform: scale(0.7); transform-origin: center; }
    to { opacity: 1; transform: scale(1); transform-origin: center; }
  }
</style>
