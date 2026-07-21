<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import Icon from '../icons/Icon.svelte';

  let { node } = $props();

  const capabilities = $derived((node?.content_ ?? []).filter((child) => child?.__type === 'ET.Capability'));
  const palette = ['#a78bfa', '#7c5bf0', '#5b8def', '#38bdf8', '#34d399'];
  const geometry = { width: 760, height: 500, cx: 380, cy: 250, radiusX: 270, radiusY: 160 };
  const card = { width: 160, height: 78 };
  const core = { radiusX: 126, radiusY: 86 };

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

  function pointOnOrbit(index, count) {
    const startAngle = -90;
    const angle = ((startAngle + (360 / count) * index) * Math.PI) / 180;
    return {
      x: geometry.cx + geometry.radiusX * Math.cos(angle),
      y: geometry.cy + geometry.radiusY * Math.sin(angle)
    };
  }

  function linkPath(target) {
    const dx = target.x - geometry.cx;
    const dy = target.y - geometry.cy;
    const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const ux = dx / distance;
    const uy = dy / distance;
    const coreDistance = 1 / Math.sqrt((ux * ux) / (core.radiusX * core.radiusX) + (uy * uy) / (core.radiusY * core.radiusY));
    const source = {
      x: geometry.cx + ux * coreDistance,
      y: geometry.cy + uy * coreDistance
    };
    const halfW = card.width / 2;
    const halfH = card.height / 2;
    const borderDistance = Math.min(
      Math.abs(ux) > 0.001 ? halfW / Math.abs(ux) : Number.POSITIVE_INFINITY,
      Math.abs(uy) > 0.001 ? halfH / Math.abs(uy) : Number.POSITIVE_INFINITY
    );
    const end = {
      x: target.x - ux * borderDistance,
      y: target.y - uy * borderDistance
    };
    return `M ${source.x} ${source.y} L ${end.x} ${end.y}`;
  }

  const models = $derived.by(() => {
    const count = Math.max(1, capabilities.length);
    return capabilities.map((capability, index) => {
      const point = pointOnOrbit(index, count);
      const color = capability.accentColor ?? interpolateColor(palette, count === 1 ? 0.5 : index / (count - 1));
      return {
        ...capability,
        key: capability.id ?? capability.label ?? index,
        index,
        color,
        x: point.x,
        y: point.y,
        link: linkPath(point)
      };
    });
  });
</script>

<section class="capability-map reveal">
  {#if node.title || node.subtitle}
    <header class="capability-map__header">
      {#if node.title}<h3>{node.title}</h3>{/if}
      {#if node.subtitle}<p>{node.subtitle}</p>{/if}
    </header>
  {/if}

  <div class="capability-map__stage" style={`--map-width: ${geometry.width}; --map-height: ${geometry.height};`}>
    <svg class="capability-map__svg" viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true">
      <defs>
        <radialGradient id="capability-core-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#7c5bf0" stop-opacity="0.3" />
          <stop offset="55%" stop-color="#38bdf8" stop-opacity="0.08" />
          <stop offset="100%" stop-color="#06080e" stop-opacity="0" />
        </radialGradient>
      </defs>

      <ellipse class="orbit orbit--outer" cx={geometry.cx} cy={geometry.cy} rx={geometry.radiusX} ry={geometry.radiusY} />
      <ellipse class="orbit orbit--inner" cx={geometry.cx} cy={geometry.cy} rx="190" ry="108" />
      <circle class="core-glow" cx={geometry.cx} cy={geometry.cy} r="170" />

      {#each models as capability (capability.key)}
        <path
          class="capability-link"
          d={capability.link}
          style={`--capability-color: ${capability.color}; --capability-index: ${capability.index}`}
        />
      {/each}
    </svg>

    <div class="capability-core">
      <div class="version-rings" aria-hidden="true"><span></span><span></span><span></span></div>
      <svg class="capability-core__graph" viewBox="0 0 92 52" aria-hidden="true">
        <path d="M18 28 42 14 70 26 48 40 18 28Z" />
        <path d="M42 14 48 40" />
        <circle cx="18" cy="28" r="4" />
        <circle cx="42" cy="14" r="4" />
        <circle cx="70" cy="26" r="4" />
        <circle cx="48" cy="40" r="4" />
      </svg>
      <span class="capability-core__eyebrow">{node.historyLabel ?? 'versioned state'}</span>
      <strong>{node.centerLabel ?? 'Ontology graph'}</strong>
      <p>{node.centerSubtitle ?? 'entities, relations, atomic changes'}</p>
    </div>

    {#each models as capability (capability.key)}
      <article
        class="capability-card"
        style={`--capability-color: ${capability.color}; --capability-index: ${capability.index}; left: ${(capability.x / geometry.width) * 100}%; top: ${(capability.y / geometry.height) * 100}%;`}
      >
        <div class="capability-card__glow"></div>
        <div class="capability-card__icon"><Icon name={capability.icon ?? 'component'} /></div>
        <div>
          <strong>{capability.label}</strong>
          {#if capability.description}<p>{capability.description}</p>{/if}
          {#if capability.scope}<span>{capability.scope}</span>{/if}
        </div>
      </article>
    {/each}
  </div>
</section>

<style>
  .capability-map {
    width: min(980px, 100%);
    color: var(--text-bright);
  }

  .capability-map__header {
    margin-bottom: 0.25rem;
    text-align: center;
  }

  .capability-map__header h3 {
    margin: 0;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 1.05rem;
    font-weight: 800;
  }

  .capability-map__header p {
    max-width: 680px;
    margin: 0.35rem auto 0;
    color: var(--text-mid);
    font-size: 0.74rem;
    line-height: 1.5;
  }

  .capability-map__stage {
    position: relative;
    width: min(100%, 940px);
    aspect-ratio: 1.52;
    min-height: 500px;
    margin: 0 auto;
  }

  .capability-map__svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .orbit {
    fill: none;
    stroke: rgba(255, 255, 255, 0.055);
    stroke-width: 1;
    stroke-dasharray: 3 12;
  }

  .orbit--inner {
    stroke: rgba(167, 139, 250, 0.09);
    stroke-dasharray: 2 8;
  }

  .core-glow {
    fill: url(#capability-core-glow);
  }

  .capability-link {
    fill: none;
    stroke: var(--capability-color);
    stroke-width: 1.1;
    stroke-linecap: round;
    opacity: 0.28;
    filter: drop-shadow(0 0 7px color-mix(in srgb, var(--capability-color) 28%, transparent));
    animation: capability-link-reveal 0.72s var(--ease-out-expo) both;
    animation-delay: calc(0.12s + var(--capability-index) * 0.06s);
  }

  .capability-core {
    position: absolute;
    top: 50%;
    left: 50%;
    display: grid;
    width: 210px;
    min-height: 150px;
    place-items: center;
    padding: 1.25rem;
    border: 1px solid rgba(255, 255, 255, 0.085);
    border-radius: 999px;
    background:
      radial-gradient(ellipse 70% 58% at 50% 32%, rgba(124, 91, 240, 0.16), transparent 72%),
      rgba(10, 14, 24, 0.88);
    box-shadow: 0 28px 80px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.055);
    text-align: center;
    transform: translate(-50%, -50%);
  }

  .capability-core__graph {
    width: 92px;
    height: 52px;
    margin-bottom: 0.15rem;
    overflow: visible;
  }

  .capability-core__graph path {
    fill: none;
    stroke: rgba(255, 255, 255, 0.18);
    stroke-width: 1.2;
  }

  .capability-core__graph circle {
    fill: var(--cyan);
    filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.44));
  }

  .version-rings {
    position: absolute;
    inset: -18px;
    border-radius: inherit;
    pointer-events: none;
  }

  .version-rings span {
    position: absolute;
    inset: calc(var(--ring-index, 0) * -10px);
    border: 1px solid rgba(167, 139, 250, 0.075);
    border-radius: inherit;
  }

  .version-rings span:nth-child(1) { --ring-index: 0; }
  .version-rings span:nth-child(2) { --ring-index: 1; }
  .version-rings span:nth-child(3) { --ring-index: 2; }

  .capability-core__eyebrow {
    color: var(--purple-light);
    font: 800 0.56rem/1 var(--font-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .capability-core strong {
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 1.08rem;
    font-weight: 800;
  }

  .capability-core p {
    max-width: 150px;
    margin: 0;
    color: var(--text-mid);
    font-size: 0.64rem;
    line-height: 1.35;
  }

  .capability-card {
    position: absolute;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    width: 160px;
    min-height: 78px;
    gap: 0.58rem;
    align-items: start;
    padding: 0.68rem;
    border: 1px solid color-mix(in srgb, var(--capability-color) 34%, rgba(255, 255, 255, 0.075));
    border-radius: 8px;
    background:
      radial-gradient(ellipse 90% 80% at 8% 8%, color-mix(in srgb, var(--capability-color) 10%, transparent), transparent 58%),
      rgba(16, 19, 30, 0.94);
    box-shadow: 0 14px 42px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.045);
    transform: translate(-50%, -50%);
    animation: capability-card-reveal 0.68s var(--ease-out-expo) both;
    animation-delay: calc(0.16s + var(--capability-index) * 0.06s);
  }

  .capability-card__glow {
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    background: linear-gradient(135deg, color-mix(in srgb, var(--capability-color) 28%, transparent), transparent 42%);
    opacity: 0.5;
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask-composite: exclude;
    padding: 1px;
    pointer-events: none;
  }

  .capability-card__icon {
    display: grid;
    width: 1.55rem;
    height: 1.55rem;
    place-items: center;
    border-radius: 50%;
    background: color-mix(in srgb, var(--capability-color) 14%, transparent);
    color: var(--capability-color);
  }

  .capability-card strong {
    display: block;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 0.74rem;
    font-weight: 800;
    line-height: 1.15;
  }

  .capability-card p {
    margin: 0.26rem 0 0;
    color: var(--text-mid);
    font-size: 0.59rem;
    line-height: 1.35;
  }

  .capability-card span {
    display: inline-flex;
    margin-top: 0.42rem;
    padding: 0.18rem 0.45rem;
    border: 1px solid color-mix(in srgb, var(--capability-color) 42%, transparent);
    border-radius: 999px;
    color: var(--capability-color);
    font: 800 0.48rem/1 var(--font-mono);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  @keyframes capability-card-reveal {
    from { opacity: 0; transform: translate(-50%, calc(-50% + 14px)); }
    to { opacity: 1; transform: translate(-50%, -50%); }
  }

  @keyframes capability-link-reveal {
    from { opacity: 0; stroke-dasharray: 0 800; }
    to { opacity: 0.28; stroke-dasharray: 800 0; }
  }
</style>
