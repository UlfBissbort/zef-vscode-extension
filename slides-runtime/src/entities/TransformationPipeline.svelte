<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();

  const steps = $derived((node?.content_ ?? []).filter((child) => child?.__type === 'ET.TransformStep'));
  const palette = ['#a78bfa', '#7c5bf0', '#5b8def', '#38bdf8', '#34d399'];
  const columnStyle = $derived(`grid-template-columns: repeat(${Math.max(1, steps.length)}, minmax(0, 1fr));`);

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

  const stepModels = $derived.by(() => {
    const count = Math.max(1, steps.length);
    return steps.map((step, index) => ({
      ...step,
      key: step.id ?? step.label ?? index,
      index,
      color: step.accentColor ?? interpolateColor(palette, count === 1 ? 0.5 : index / (count - 1))
    }));
  });
</script>

<section class="transform-strip reveal">
  {#if node.title || node.subtitle}
    <header class="transform-strip__header">
      {#if node.title}<h3>{node.title}</h3>{/if}
      {#if node.subtitle}<p>{node.subtitle}</p>{/if}
    </header>
  {/if}

  <div class="transform-strip__io">
    <article class="io-card io-card--in">
      <span>Data in</span>
      <strong>{node.fromLabel ?? 'Input value'}</strong>
      <p>{node.fromDetail ?? 'plain data'}</p>
    </article>
    <div class="io-thread" aria-hidden="true"></div>
    <article class="io-card io-card--out">
      <span>Data out</span>
      <strong>{node.toLabel ?? 'Output value'}</strong>
      <p>{node.toDetail ?? 'transformed data'}</p>
    </article>
  </div>

  <div class="transform-strip__rail" style={columnStyle}>
    {#each stepModels as step, index (step.key)}
      <div
        class:first={index === 0}
        class:last={index === stepModels.length - 1}
        class="rail-segment"
        style={`--step-color: ${step.color}; --step-index: ${index}`}
      >
        <span>{String(index + 1).padStart(2, '0')}</span>
      </div>
    {/each}
  </div>

  <div class="transform-strip__steps" style={columnStyle}>
    {#each stepModels as step (step.key)}
      <article class="step-card" style={`--step-color: ${step.color}; --step-index: ${step.index}`}>
        <span>{String(step.index + 1).padStart(2, '0')}</span>
        <strong>{step.label}</strong>
        {#if step.description}<p>{step.description}</p>{/if}
      </article>
    {/each}
  </div>

  {#if stepModels.some((step) => step.effect)}
    <div class="effect-zone">
      <div class="effect-zone__label">{node.effectLabel ?? 'managed side effects'}</div>
      <div class="effect-zone__grid" style={columnStyle}>
        {#each stepModels as step (step.key)}
          <div class="effect-slot" style={`--step-color: ${step.color}`}>
            {#if step.effect}
              <span>{step.effect}</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</section>

<style>
  .transform-strip {
    width: min(720px, 100%);
    padding: 1.05rem;
    border: 1px solid rgba(255, 255, 255, 0.075);
    border-radius: 8px;
    background:
      radial-gradient(ellipse 80% 50% at 50% 10%, rgba(124, 91, 240, 0.09), transparent 68%),
      rgba(8, 11, 19, 0.74);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.045);
    color: var(--text-bright);
  }

  .transform-strip__header {
    margin-bottom: 0.9rem;
  }

  .transform-strip__header h3 {
    margin: 0;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 800;
  }

  .transform-strip__header p {
    max-width: 600px;
    margin: 0.3rem 0 0;
    color: var(--text-mid);
    font-size: 0.72rem;
    line-height: 1.5;
  }

  .transform-strip__io {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 42px minmax(0, 1fr);
    gap: 0.65rem;
    align-items: center;
    margin-bottom: 1rem;
  }

  .io-card {
    min-width: 0;
    padding: 0.72rem 0.82rem;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 8px;
    background: rgba(16, 19, 30, 0.82);
  }

  .io-card span {
    display: block;
    margin-bottom: 0.34rem;
    color: var(--purple-light);
    font: 800 0.55rem/1 var(--font-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .io-card--out span {
    color: var(--emerald);
  }

  .io-card strong {
    display: block;
    overflow: hidden;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 0.84rem;
    font-weight: 800;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .io-card p {
    margin: 0.28rem 0 0;
    overflow: hidden;
    color: var(--text-dim);
    font-size: 0.64rem;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .io-thread {
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--purple-light), var(--cyan), var(--emerald));
    box-shadow: 0 0 18px rgba(56, 189, 248, 0.28);
  }

  .transform-strip__rail {
    display: grid;
    gap: 0.34rem;
    margin-bottom: 0.9rem;
  }

  .rail-segment {
    position: relative;
    display: grid;
    min-height: 3rem;
    place-items: center;
    background: var(--step-color);
    clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%, 14px 50%);
    color: #fff;
    filter: drop-shadow(0 0 14px color-mix(in srgb, var(--step-color) 36%, transparent));
    animation: transform-strip-reveal 0.64s var(--ease-out-expo) both;
    animation-delay: calc(0.1s + var(--step-index) * 0.07s);
  }

  .rail-segment.first {
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
    clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%);
  }

  .rail-segment.last {
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
  }

  .rail-segment span {
    padding-right: 0.4rem;
    font: 800 0.66rem/1 var(--font-mono);
    opacity: 0.9;
  }

  .transform-strip__steps {
    display: grid;
    gap: 0.55rem;
  }

  .step-card {
    min-width: 0;
    padding: 0.7rem;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 8px;
    background: rgba(16, 19, 30, 0.72);
    box-shadow: inset 2px 0 0 var(--step-color);
    animation: transform-strip-reveal 0.64s var(--ease-out-expo) both;
    animation-delay: calc(0.18s + var(--step-index) * 0.07s);
  }

  .step-card span {
    display: block;
    margin-bottom: 0.42rem;
    color: var(--step-color);
    font: 800 0.58rem/1 var(--font-mono);
  }

  .step-card strong {
    display: block;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 0.73rem;
    font-weight: 800;
    line-height: 1.22;
  }

  .step-card p {
    margin: 0.26rem 0 0;
    color: var(--text-dim);
    font-size: 0.61rem;
    line-height: 1.35;
  }

  .effect-zone {
    margin-top: 0.95rem;
    padding-top: 0.78rem;
    border-top: 1px solid rgba(255, 255, 255, 0.065);
  }

  .effect-zone__label {
    margin-bottom: 0.5rem;
    color: var(--text-dim);
    font: 800 0.54rem/1 var(--font-mono);
    letter-spacing: 0.1em;
    text-align: center;
    text-transform: uppercase;
  }

  .effect-zone__grid {
    display: grid;
    gap: 0.55rem;
  }

  .effect-slot {
    min-height: 1.7rem;
    text-align: center;
  }

  .effect-slot span {
    display: inline-flex;
    max-width: 100%;
    min-height: 1.7rem;
    align-items: center;
    justify-content: center;
    padding: 0 0.72rem;
    border: 1px solid var(--step-color);
    border-radius: 999px;
    background: rgba(16, 19, 30, 0.86);
    color: var(--text-bright);
    font: 800 0.56rem/1 var(--font-mono);
    box-shadow: 0 0 14px color-mix(in srgb, var(--step-color) 18%, transparent);
  }

  @keyframes transform-strip-reveal {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
