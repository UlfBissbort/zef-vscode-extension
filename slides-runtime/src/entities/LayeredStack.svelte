<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();

  const layers = $derived((node?.content_ ?? []).filter((child) => child?.__type === 'ET.StackLayer'));
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

  const models = $derived.by(() => {
    const count = Math.max(1, layers.length);
    return layers.map((layer, index) => ({
      ...layer,
      key: layer.id ?? layer.label ?? index,
      index,
      displayIndex: count - index,
      color: layer.accentColor ?? interpolateColor(palette, count === 1 ? 0.5 : index / (count - 1)),
      depth: count - index
    }));
  });
</script>

<section class="layered-stack reveal">
  {#if node.title || node.subtitle}
    <header class="layered-stack__header">
      {#if node.title}<h3>{node.title}</h3>{/if}
      {#if node.subtitle}<p>{node.subtitle}</p>{/if}
    </header>
  {/if}

  <div class="layered-stack__body">
    <div class="layered-stack__spine" aria-hidden="true"></div>
    {#each models as layer (layer.key)}
      <article
        class="stack-layer"
        style={`--layer-color: ${layer.color}; --layer-index: ${layer.index}; --layer-depth: ${layer.depth};`}
      >
        <div class="stack-layer__index">{String(layer.displayIndex).padStart(2, '0')}</div>
        <div class="stack-layer__copy">
          <div class="stack-layer__title-row">
            <strong>{layer.label}</strong>
            {#if layer.tag}<span>{layer.tag}</span>{/if}
          </div>
          {#if layer.description}<p>{layer.description}</p>{/if}
        </div>
        {#if layer.metric}
          <div class="stack-layer__metric">{layer.metric}</div>
        {/if}
      </article>
    {/each}
  </div>
</section>

<style>
  .layered-stack {
    width: min(820px, 100%);
    color: var(--text-bright);
  }

  .layered-stack__header {
    margin-bottom: 1rem;
    text-align: center;
  }

  .layered-stack__header h3 {
    margin: 0;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 1.08rem;
    font-weight: 800;
  }

  .layered-stack__header p {
    max-width: 620px;
    margin: 0.35rem auto 0;
    color: var(--text-mid);
    font-size: 0.74rem;
    line-height: 1.5;
  }

  .layered-stack__body {
    position: relative;
    display: grid;
    gap: 0.78rem;
    padding: 0.5rem 0 0.75rem;
  }

  .layered-stack__body::before {
    position: absolute;
    inset: 0 9%;
    background:
      radial-gradient(ellipse 55% 42% at 50% 25%, rgba(124, 91, 240, 0.12), transparent 70%),
      radial-gradient(ellipse 48% 36% at 50% 72%, rgba(56, 189, 248, 0.08), transparent 70%);
    content: '';
    pointer-events: none;
  }

  .layered-stack__spine {
    position: absolute;
    top: 2.2rem;
    bottom: 2.2rem;
    left: 3.1rem;
    width: 1px;
    background: linear-gradient(180deg, var(--purple-light), var(--blue), var(--cyan), var(--emerald));
    opacity: 0.2;
    box-shadow: 0 0 18px rgba(56, 189, 248, 0.22);
  }

  .stack-layer {
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 1rem;
    align-items: center;
    min-height: 4.6rem;
    margin-inline: calc(var(--layer-index) * 0.72rem);
    padding: 0.92rem 1.1rem;
    border: 1px solid color-mix(in srgb, var(--layer-color) 28%, rgba(255, 255, 255, 0.075));
    border-radius: 8px;
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--layer-color) 12%, transparent), transparent 42%),
      rgba(12, 16, 27, 0.92);
    box-shadow:
      0 calc(12px + var(--layer-depth) * 2px) 42px rgba(0, 0, 0, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.045);
    animation: stack-layer-reveal 0.68s var(--ease-out-expo) both;
    animation-delay: calc(0.12s + var(--layer-index) * 0.08s);
  }

  .stack-layer::after {
    position: absolute;
    inset: auto 1.2rem -0.35rem;
    height: 0.35rem;
    border-radius: 0 0 8px 8px;
    background: linear-gradient(90deg, var(--layer-color), color-mix(in srgb, var(--layer-color) 30%, transparent));
    opacity: 0.42;
    content: '';
    filter: blur(0.15px);
  }

  .stack-layer__index {
    display: grid;
    width: 2rem;
    height: 2rem;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--layer-color) 48%, transparent);
    border-radius: 50%;
    background: color-mix(in srgb, var(--layer-color) 13%, transparent);
    color: var(--layer-color);
    font: 800 0.62rem/1 var(--font-mono);
  }

  .stack-layer__copy {
    min-width: 0;
  }

  .stack-layer__title-row {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
  }

  .stack-layer strong {
    overflow: hidden;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 0.92rem;
    font-weight: 800;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stack-layer span,
  .stack-layer__metric {
    flex: 0 0 auto;
    color: var(--layer-color);
    font: 800 0.56rem/1 var(--font-mono);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .stack-layer p {
    margin: 0.28rem 0 0;
    color: var(--text-mid);
    font-size: 0.68rem;
    line-height: 1.45;
  }

  .stack-layer__metric {
    padding: 0.35rem 0.55rem;
    border: 1px solid color-mix(in srgb, var(--layer-color) 38%, transparent);
    border-radius: 999px;
    background: rgba(7, 10, 18, 0.44);
  }

  @keyframes stack-layer-reveal {
    from { opacity: 0; transform: translateY(18px) scale(0.98); }
    to { opacity: 1; transform: none; }
  }
</style>
