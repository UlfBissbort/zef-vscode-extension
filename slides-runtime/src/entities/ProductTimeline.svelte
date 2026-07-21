<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();

  const palette = ['#a78bfa', '#7c5bf0', '#5b8def', '#38bdf8', '#34d399'];

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

  const milestones = $derived((node?.content_ ?? []).filter((child) => child?.__type === 'ET.TimelineMilestone'));
  const progress = $derived(Math.max(0, Math.min(1, node.progress ?? 0.55)));
  const defaultFade = $derived(node.upcomingFade ?? 0.18);
  const activeScale = $derived(node.activeScale ?? 1.1);
  const connectorOpacity = $derived(node.connectorOpacity ?? 0.62);
  const endpointPlacement = $derived(node.endpointPlacement ?? 'below');
  const progressLabelPlacement = $derived(node.progressLabelPlacement ?? 'above');
  const showProgressMarker = $derived(node.showProgressMarker ?? true);
  const pinRingOpacity = $derived(node.pinRingOpacity ?? 0.42);
  const models = $derived.by(() => {
    const count = Math.max(1, milestones.length);
    return milestones.map((milestone, index) => {
      const ratio = count === 1 ? 0.5 : index / (count - 1);
      const color = milestone.accentColor ?? interpolateColor(palette, ratio);
      const status = milestone.status ?? (ratio <= progress ? 'complete' : 'upcoming');
      return {
        ...milestone,
        key: milestone.id ?? milestone.label ?? index,
        index,
        ratio,
        color,
        status,
        fade: milestone.fade ?? (status === 'upcoming' ? defaultFade : 0),
        connectorOpacity: milestone.connectorOpacity ?? connectorOpacity,
        pinScale: milestone.pinScale ?? (status === 'active' ? activeScale : 1),
        emphasis: milestone.emphasis ?? (status === 'active' ? 'active' : 'normal'),
        side: milestone.side ?? (index % 2 === 0 ? 'top' : 'bottom')
      };
    });
  });

  function railPosition(ratio) {
    return `${5.2 + ratio * 89.6}%`;
  }

  function progressMarkerPosition() {
    return `${progress * 100}%`;
  }

  const progressColor = $derived(interpolateColor(palette, progress));
</script>

<section class="product-timeline reveal">
  {#if node.title || node.subtitle}
    <header class="product-timeline__header">
      {#if node.title}<h3>{node.title}</h3>{/if}
      {#if node.subtitle}<p>{node.subtitle}</p>{/if}
    </header>
  {/if}

  <div
    class={`product-timeline__stage product-timeline__stage--endpoints-${endpointPlacement}`}
    style={`--progress-width: ${progress * 100}%; --progress-left: ${progressMarkerPosition()}; --progress-color: ${progressColor}; --pin-ring-opacity: ${pinRingOpacity}; --count: ${Math.max(1, models.length - 1)};`}
  >
    <div class="timeline-rail" aria-hidden="true">
      <div class="timeline-rail__track"></div>
      <div class="timeline-rail__fill"></div>
      {#if showProgressMarker}
        <div class={`timeline-rail__marker timeline-rail__marker--label-${progressLabelPlacement}`} title={node.progressLabel ?? 'current'}>
          <span>{node.progressLabel ?? 'now'}</span>
        </div>
      {/if}
      {#if node.startLabel}<span class="timeline-rail__label timeline-rail__label--start">{node.startLabel}</span>{/if}
      {#if node.endLabel}<span class="timeline-rail__label timeline-rail__label--end">{node.endLabel}</span>{/if}
    </div>

    {#each models as item (item.key)}
      <article
        class={`timeline-milestone timeline-milestone--${item.side} timeline-milestone--${item.status} timeline-milestone--${item.emphasis}`}
        style={`--item-color: ${item.color}; --item-index: ${item.index}; --item-left: ${railPosition(item.ratio)}; --item-opacity: ${1 - item.fade}; --connector-opacity: ${item.connectorOpacity}; --pin-scale: ${item.pinScale};`}
      >
        <div class="timeline-pin" aria-hidden="true">
          <span></span>
        </div>
        <div class="timeline-card">
          {#if item.date || item.tag}
            <div class="timeline-card__meta">
              {#if item.date}<span>{item.date}</span>{/if}
              {#if item.tag}<span>{item.tag}</span>{/if}
            </div>
          {/if}
          <strong>{item.label}</strong>
          {#if item.description}<p>{item.description}</p>{/if}
        </div>
      </article>
    {/each}
  </div>
</section>

<style>
  .product-timeline {
    width: min(1040px, 100%);
    color: var(--text-bright);
  }

  .product-timeline__header {
    margin-bottom: 1.35rem;
    text-align: center;
  }

  .product-timeline__header h3 {
    margin: 0;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 1.44rem;
    font-weight: 800;
  }

  .product-timeline__header p {
    max-width: 760px;
    margin: 0.38rem auto 0;
    color: var(--text-mid);
    font-size: 0.88rem;
    line-height: 1.45;
  }

  .product-timeline__stage {
    position: relative;
    min-height: 410px;
    isolation: isolate;
  }

  .product-timeline__stage::before {
    position: absolute;
    inset: 24% 8%;
    z-index: -1;
    border-radius: 999px;
    background:
      radial-gradient(circle at 20% 50%, rgba(167, 139, 250, 0.045), transparent 32%),
      radial-gradient(circle at 52% 50%, rgba(56, 189, 248, 0.04), transparent 36%),
      radial-gradient(circle at 82% 50%, rgba(52, 211, 153, 0.04), transparent 30%);
    content: '';
    filter: blur(6px);
  }

  .timeline-rail {
    position: absolute;
    left: 5.2%;
    right: 5.2%;
    top: 50%;
    height: 34px;
    transform: translateY(-50%);
  }

  .timeline-rail__track,
  .timeline-rail__fill {
    position: absolute;
    left: 0;
    top: 50%;
    height: 18px;
    transform: translateY(-50%);
    border-radius: 999px;
  }

  .timeline-rail__track {
    right: 0;
    background: rgba(255, 255, 255, 0.05);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.045),
      0 18px 54px rgba(0, 0, 0, 0.2);
  }

  .timeline-rail__fill {
    width: var(--progress-width);
    border-radius: 999px 0 0 999px;
    background: linear-gradient(90deg, #a78bfa, #7c5bf0 28%, #38bdf8 68%, #34d399);
    filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.18));
    animation: timeline-fill-reveal 0.9s var(--ease-out-expo) both;
    transform-origin: left center;
  }

  .timeline-rail__marker {
    position: absolute;
    left: var(--progress-left);
    top: 50%;
    width: 1px;
    height: 76px;
    transform: translate(-50%, -50%);
    background: linear-gradient(180deg, transparent, var(--progress-color) 22%, var(--progress-color) 78%, transparent);
    box-shadow: 0 0 16px color-mix(in srgb, var(--progress-color) 32%, transparent);
  }

  .timeline-rail__marker span {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    color: var(--progress-color);
    font: 900 0.52rem/1 var(--font-mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .timeline-rail__marker--label-above span {
    top: -0.35rem;
  }

  .timeline-rail__marker--label-below span {
    bottom: -0.35rem;
  }

  .timeline-rail__marker--label-hidden span {
    display: none;
  }

  .timeline-rail__label {
    position: absolute;
    color: var(--text-dim);
    font: 800 0.55rem/1 var(--font-mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .product-timeline__stage--endpoints-above .timeline-rail__label {
    bottom: 2.25rem;
  }

  .product-timeline__stage--endpoints-below .timeline-rail__label {
    top: 2.25rem;
  }

  .product-timeline__stage--endpoints-inside .timeline-rail__label {
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.52);
  }

  .timeline-rail__label--start {
    left: -0.2rem;
  }

  .timeline-rail__label--end {
    right: -0.2rem;
  }

  .timeline-milestone {
    position: absolute;
    left: var(--item-left);
    top: 50%;
    width: 190px;
    transform: translate(-50%, -50%);
    animation: timeline-card-reveal 0.66s var(--ease-out-expo) both;
    animation-delay: calc(0.16s + var(--item-index) * 0.07s);
  }

  .timeline-milestone--top {
    padding-bottom: 82px;
  }

  .timeline-milestone--bottom {
    padding-top: 82px;
  }

  .timeline-pin {
    position: absolute;
    left: 50%;
    top: 50%;
    display: grid;
    width: 46px;
    height: 46px;
    place-items: center;
    transform: translate(-50%, -50%) scale(var(--pin-scale));
    border-radius: 50%;
    background: color-mix(in srgb, var(--item-color) 12%, rgba(14, 18, 30, 0.94));
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--item-color) 34%, transparent),
      0 0 24px color-mix(in srgb, var(--item-color) 28%, transparent);
  }

  .timeline-pin::before {
    position: absolute;
    width: 68px;
    height: 68px;
    border: 1px solid color-mix(in srgb, var(--item-color) 17%, transparent);
    border-radius: 50%;
    content: '';
    opacity: var(--pin-ring-opacity);
  }

  .timeline-pin span {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--item-color);
    box-shadow: 0 0 16px color-mix(in srgb, var(--item-color) 48%, transparent);
  }

  .timeline-milestone--upcoming .timeline-pin,
  .timeline-milestone--upcoming .timeline-card {
    opacity: var(--item-opacity);
  }

  .timeline-milestone--active .timeline-card {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.07),
      0 20px 52px rgba(0, 0, 0, 0.28),
      0 0 30px color-mix(in srgb, var(--item-color) 18%, transparent);
  }

  .timeline-milestone--active .timeline-pin::before {
    width: 76px;
    height: 76px;
    border-color: color-mix(in srgb, var(--item-color) 28%, transparent);
  }

  .timeline-card {
    position: absolute;
    left: 50%;
    display: grid;
    gap: 0.32rem;
    width: 100%;
    padding: 0.78rem 0.86rem;
    transform: translateX(-50%);
    border: 1px solid color-mix(in srgb, var(--item-color) 38%, rgba(255, 255, 255, 0.08));
    border-radius: 16px;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--item-color) 12%, transparent), transparent 58%),
      rgba(16, 19, 30, 0.94);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      0 14px 34px rgba(0, 0, 0, 0.2);
    text-align: center;
  }

  .timeline-milestone--top .timeline-card {
    bottom: 128px;
  }

  .timeline-milestone--bottom .timeline-card {
    top: 128px;
  }

  .timeline-card::after {
    position: absolute;
    left: 50%;
    width: 1px;
    height: 48px;
    transform: translateX(-50%);
    background: linear-gradient(180deg, transparent, var(--item-color), transparent);
    content: '';
    opacity: var(--connector-opacity);
  }

  .timeline-milestone--top .timeline-card::after {
    top: 100%;
  }

  .timeline-milestone--bottom .timeline-card::after {
    bottom: 100%;
  }

  .timeline-card__meta {
    display: flex;
    justify-content: center;
    gap: 0.42rem;
    color: color-mix(in srgb, var(--item-color) 78%, white 22%);
    font: 900 0.52rem/1 var(--font-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .timeline-card strong {
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 0.88rem;
    font-weight: 800;
    line-height: 1.15;
  }

  .timeline-card p {
    margin: 0;
    color: var(--text-dim);
    font-size: 0.68rem;
    line-height: 1.42;
  }

  @keyframes timeline-fill-reveal {
    from { transform: translateY(-50%) scaleX(0); }
    to { transform: translateY(-50%) scaleX(1); }
  }

  @keyframes timeline-card-reveal {
    from { opacity: 0; transform: translate(-50%, -44%) scale(0.97); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
</style>
