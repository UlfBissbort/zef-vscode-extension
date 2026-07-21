<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import RenderNode from './RenderNode.svelte';

  let {
    deck = null,
    slide,
    error = '',
    currentSlideIndex = 0,
    slideCount = 0,
    currentStage = 0,
    preview = false,
    showChrome = true,
    onGoToSlide = () => {},
    onNextSlide = () => {},
    onPreviousSlide = () => {}
  } = $props();

  const progressWidth = $derived(slideCount > 0 ? ((currentSlideIndex + 1) / slideCount) * 100 : 0);
  const backgroundImage = $derived(slide?.backgroundImage);

  function frameToClass(frame) {
    if (frame === 'orbital-hero') return 's1';
    if (frame === 'metrics-scale') return 's2';
    if (frame === 'data-histogram' || frame === 'data-scatter') return 's10';
    if (frame === 'composition-map') return 's4';
    if (frame === 'physics-equation') return 's5';
    if (frame === 'physics-lab') return 's6';
    if (frame === 'section-divider') return 's7';
    if (frame === 'plain-readable') return 's8';
    if (frame === 'progressive-readable') return 's9';
    return 's3';
  }

  const frameClass = $derived(frameToClass(slide?.frame));
  const brandName = $derived(deck?.brand ?? 'Linear');

  function pct(value, fallback = 0) {
    return `${Math.max(0, Math.min(1, value ?? fallback)) * 100}%`;
  }

  function px(value, fallback = 0) {
    return `${value ?? fallback}px`;
  }

  function backgroundImageStyle(image) {
    if (!image?.src) return '';
    return [
      `background-image: url("${image.src}")`,
      `background-size: ${image.fit ?? 'cover'}`,
      `background-position: ${image.position ?? 'center'}`,
      `opacity: ${image.opacity ?? 0.42}`,
      `filter: blur(${px(image.blur, 0)})`,
      `transform: scale(${image.scale ?? 1})`
    ].join('; ');
  }

  function backgroundFadeStyle(image, edge) {
    const fade = image?.fade ?? {};
    return `--fade-size: ${pct(fade[edge], 0)}`;
  }

  function backgroundOverlayStyle(overlay) {
    return `background: ${overlay?.color ?? '#06080e'}; opacity: ${overlay?.opacity ?? 0}`;
  }

  function backgroundTintStyle(tint) {
    return `background: ${tint?.color ?? '#38bdf8'}; opacity: ${tint?.opacity ?? 0}`;
  }

  function handleDeckPointerUp(event) {
    if (preview) return;
    if (event.target.closest('.btn, .nav, a, button')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    if (x > 0.5) {
      onNextSlide();
    } else {
      onPreviousSlide();
    }
  }
</script>

{#if showChrome}
  <div class="progress"><div class="progress__bar" style={`width: ${progressWidth}%`}></div></div>
{/if}
{#if !preview}
  <div class="grain"></div>
{/if}

{#if showChrome}
  <div class="brand" aria-hidden="true">
    <svg class="brand__mark" viewBox="0 0 100 100" fill="none">
      <path d="M5 59 55 3l5 1L6 59l-1 0Z" fill="#fff" opacity="0.85" />
      <path d="M3 48a48 48 0 0 1 1-7L41 1a48 48 0 0 1 7-1L3 48Z" fill="#fff" opacity="0.85" />
      <path d="M9 67a48 48 0 0 1-2-5L63 5l5 2L9 67Z" fill="#fff" opacity="0.85" />
      <path d="M14 76a48 48 0 0 1-3-4L71 11l4 3L14 76Z" fill="#fff" opacity="0.85" />
      <path d="M23 83a48 48 0 0 1-5-4L82 16l4 5L23 83Z" fill="#fff" opacity="0.85" />
      <path d="M35 89a48 48 0 0 1-6-3L85 29l3 6L35 89Z" fill="#fff" opacity="0.85" />
      <path d="M97 52 52 97a49 49 0 0 1-9-2L93 45a48 48 0 0 1 2 9l2-2Z" fill="#fff" opacity="0.85" />
      <path d="M91 64 64 91a48 48 0 0 1-7-3l38-38a48 48 0 0 1 3 7l-7 7Z" fill="#fff" opacity="0.85" />
    </svg>
    <span class="brand__name">{brandName}</span>
  </div>

  <div class="key-hint">
    <kbd>←</kbd> <kbd>→</kbd> or click
  </div>
{/if}

<div class:preview class="deck" onpointerup={handleDeckPointerUp}>
  {#key slide?.id ?? currentSlideIndex}
    <section class={`slide ${frameClass} active`} aria-label={slide?.ariaLabel ?? 'Slide'}>
      {#if backgroundImage?.src}
        <div class="slide-bg" aria-hidden="true">
          <div class="slide-bg__image" style={backgroundImageStyle(backgroundImage)}></div>
          <div class="slide-bg__tint" style={backgroundTintStyle(backgroundImage.tint)}></div>
          <div class="slide-bg__overlay" style={backgroundOverlayStyle(backgroundImage.overlay)}></div>
          <div class="slide-bg__fade slide-bg__fade--top" style={backgroundFadeStyle(backgroundImage, 'top')}></div>
          <div class="slide-bg__fade slide-bg__fade--bottom" style={backgroundFadeStyle(backgroundImage, 'bottom')}></div>
          <div class="slide-bg__fade slide-bg__fade--left" style={backgroundFadeStyle(backgroundImage, 'left')}></div>
          <div class="slide-bg__fade slide-bg__fade--right" style={backgroundFadeStyle(backgroundImage, 'right')}></div>
        </div>
      {/if}

      <div class="ambient">
        {#if slide?.frame === 'orbital-hero'}
          <div class="orbital orbital--1"></div>
          <div class="orbital orbital--2"></div>
          <div class="orbital orbital--3"></div>
        {:else if slide?.frame === 'composition-map'}
          <div class="constellation">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        {:else if slide?.frame === 'physics-equation' || slide?.frame === 'physics-lab'}
          <div class="field-lines">
            <span></span><span></span><span></span><span></span>
          </div>
        {:else if slide?.frame === 'section-divider'}
          <div class="section-rays"><span></span><span></span><span></span></div>
        {:else}
          <div class="float-grid">
            <span class="float-dot"></span>
            <span class="float-dot"></span>
            <span class="float-dot"></span>
            <span class="float-dot"></span>
            <span class="float-dot"></span>
          </div>
        {/if}
      </div>

      <div class="slide-content-safe">
        {#if slide}
          {#each slide.content_ ?? [] as child, index (index)}
            <RenderNode node={child} currentStage={currentStage} steps={slide.steps_ ?? []} />
          {/each}
        {:else}
          <div class="slide-error">{error || 'Paste an ET.Deck or ET.Slide JSON object.'}</div>
        {/if}
      </div>
    </section>
  {/key}
</div>

{#if showChrome && slideCount > 1}
  <nav class="nav" aria-label="Slide navigation">
    {#each Array(slideCount) as _, index (index)}
      <button
        class:active={index === currentSlideIndex}
        class="nav__dot"
        type="button"
        aria-label={`Slide ${index + 1}`}
        onclick={() => onGoToSlide(index)}
      ></button>
    {/each}
  </nav>

  <div class="slide-counter">
    <span class="slide-counter__current">{String(currentSlideIndex + 1).padStart(2, '0')}</span> / {String(slideCount).padStart(2, '0')}
  </div>
{/if}

<style>
  :global(:root) {
    --bg-void: #06080e;
    --text-bright: #eef0f4;
    --text-mid: #9299ab;
    --text-dim: #545b6e;
    --text-ghost: #2e3344;
    --purple: #7c5bf0;
    --purple-light: #a78bfa;
    --blue: #5b8def;
    --cyan: #38bdf8;
    --emerald: #34d399;
    --font-display: Manrope, system-ui, sans-serif;
    --font-body: 'DM Sans', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', ui-monospace, monospace;
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  }

  :global(html) {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
  }

  :global(body) {
    font-family: var(--font-body);
    color: var(--text-mid);
    cursor: default;
    user-select: none;
  }

  .deck {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .deck.preview,
  .deck.preview * {
    pointer-events: none;
  }

  .deck.preview :global(*) {
    animation: none !important;
    transition: none !important;
  }

  .slide {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .slide-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .slide-bg__image,
  .slide-bg__overlay,
  .slide-bg__tint,
  .slide-bg__fade {
    position: absolute;
    inset: 0;
  }

  .slide-bg__image {
    background-repeat: no-repeat;
    will-change: transform;
  }

  .slide-bg__tint {
    mix-blend-mode: screen;
  }

  .slide-bg__fade {
    opacity: 1;
  }

  .slide-bg__fade--top {
    bottom: auto;
    height: var(--fade-size);
    background: linear-gradient(180deg, var(--bg-void), transparent);
  }

  .slide-bg__fade--bottom {
    top: auto;
    height: var(--fade-size);
    background: linear-gradient(0deg, var(--bg-void), transparent);
  }

  .slide-bg__fade--left {
    right: auto;
    width: var(--fade-size);
    background: linear-gradient(90deg, var(--bg-void), transparent);
  }

  .slide-bg__fade--right {
    left: auto;
    width: var(--fade-size);
    background: linear-gradient(270deg, var(--bg-void), transparent);
  }

  .slide-content-safe {
    position: absolute;
    z-index: 2;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(3rem, 5vw, 4.75rem);
  }

  .deck.preview .slide-content-safe {
    padding: clamp(3rem, 5vw, 4.75rem);
  }

  .s1,
  .s2,
  .s4,
  .s5,
  .s6,
  .s7,
  .s8,
  .s9,
  .s10,
  .s3 {
    background: var(--bg-void);
  }

  .ambient {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .s1 .ambient {
    background:
      radial-gradient(ellipse 55% 55% at 50% 45%, rgba(124, 91, 240, 0.07), transparent 70%),
      radial-gradient(ellipse 40% 30% at 75% 65%, rgba(91, 141, 239, 0.04), transparent 60%);
  }

  .s3 .ambient {
    background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(124, 91, 240, 0.06), transparent 65%);
  }

  .s2 .ambient {
    background:
      radial-gradient(ellipse 40% 50% at 20% 50%, rgba(52, 211, 153, 0.04), transparent 60%),
      radial-gradient(ellipse 40% 50% at 80% 50%, rgba(124, 91, 240, 0.04), transparent 60%);
  }

  .s4 .ambient {
    background:
      radial-gradient(ellipse 45% 55% at 28% 45%, rgba(56, 189, 248, 0.05), transparent 65%),
      radial-gradient(ellipse 45% 55% at 72% 55%, rgba(124, 91, 240, 0.06), transparent 65%);
  }

  .s5 .ambient {
    background:
      radial-gradient(ellipse 42% 52% at 68% 42%, rgba(56, 189, 248, 0.055), transparent 68%),
      radial-gradient(ellipse 34% 46% at 22% 64%, rgba(124, 91, 240, 0.05), transparent 65%);
  }

  .s6 .ambient {
    background:
      radial-gradient(ellipse 52% 40% at 68% 58%, rgba(52, 211, 153, 0.045), transparent 68%),
      radial-gradient(ellipse 40% 44% at 22% 35%, rgba(91, 141, 239, 0.05), transparent 64%);
  }

  .s7 .ambient {
    background:
      radial-gradient(ellipse 55% 45% at 50% 52%, rgba(124, 91, 240, 0.08), transparent 68%),
      radial-gradient(ellipse 38% 30% at 58% 44%, rgba(56, 189, 248, 0.04), transparent 60%);
  }

  .s8 .ambient {
    background:
      radial-gradient(ellipse 42% 50% at 26% 54%, rgba(56, 189, 248, 0.045), transparent 62%),
      radial-gradient(ellipse 34% 42% at 78% 42%, rgba(124, 91, 240, 0.045), transparent 64%);
  }

  .s9 .ambient {
    background:
      radial-gradient(ellipse 42% 48% at 72% 52%, rgba(52, 211, 153, 0.045), transparent 64%),
      radial-gradient(ellipse 35% 38% at 26% 36%, rgba(124, 91, 240, 0.05), transparent 62%);
  }

  .s10 .ambient {
    background:
      linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px),
      linear-gradient(180deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px),
      radial-gradient(ellipse 44% 48% at 72% 52%, rgba(52, 211, 153, 0.05), transparent 66%),
      radial-gradient(ellipse 35% 42% at 24% 42%, rgba(56, 189, 248, 0.045), transparent 62%);
    background-size: 72px 72px, 72px 72px, auto, auto;
  }

  .section-rays {
    position: absolute;
    inset: 0;
    opacity: 0.4;
  }

  .section-rays span {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 1px;
    height: 78vh;
    background: linear-gradient(180deg, transparent, rgba(167, 139, 250, 0.18), transparent);
    transform-origin: 50% 50%;
  }

  .section-rays span:nth-child(1) { transform: translate(-50%, -50%) rotate(42deg); }
  .section-rays span:nth-child(2) { transform: translate(-50%, -50%) rotate(90deg); background: linear-gradient(180deg, transparent, rgba(56, 189, 248, 0.14), transparent); }
  .section-rays span:nth-child(3) { transform: translate(-50%, -50%) rotate(138deg); }

  .field-lines {
    position: absolute;
    inset: 0;
    opacity: 0.28;
  }

  .field-lines span {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 64vw;
    height: 64vw;
    max-width: 780px;
    max-height: 780px;
    border: 1px solid rgba(167, 139, 250, 0.08);
    border-radius: 38% 62% 54% 46%;
    transform: translate(-50%, -50%) rotate(0deg);
    animation: field-spin 90s linear infinite;
  }

  .field-lines span:nth-child(2) { width: 48vw; height: 48vw; animation-duration: 75s; animation-direction: reverse; border-color: rgba(56, 189, 248, 0.08); }
  .field-lines span:nth-child(3) { width: 32vw; height: 32vw; animation-duration: 60s; border-color: rgba(52, 211, 153, 0.07); }
  .field-lines span:nth-child(4) { width: 20vw; height: 20vw; animation-duration: 45s; animation-direction: reverse; }

  @keyframes field-spin {
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }

  .constellation {
    position: absolute;
    inset: 0;
  }

  .constellation span {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(167, 139, 250, 0.35);
    box-shadow: 0 0 18px rgba(124, 91, 240, 0.4);
    animation: float 8s ease-in-out infinite;
  }

  .constellation span:nth-child(1) { top: 18%; left: 18%; }
  .constellation span:nth-child(2) { top: 32%; left: 82%; animation-delay: 1s; background: rgba(56, 189, 248, 0.3); }
  .constellation span:nth-child(3) { top: 72%; left: 68%; animation-delay: 2s; }
  .constellation span:nth-child(4) { top: 62%; left: 12%; animation-delay: 3s; background: rgba(52, 211, 153, 0.25); }
  .constellation span:nth-child(5) { top: 22%; left: 52%; animation-delay: 1.5s; }
  .constellation span:nth-child(6) { top: 80%; left: 42%; animation-delay: 2.5s; background: rgba(91, 141, 239, 0.3); }

  .orbital {
    position: absolute;
    top: 50%;
    left: 50%;
    border: 1px solid;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: orbit-spin linear infinite;
  }

  .orbital--1 {
    width: 520px;
    height: 520px;
    border-color: rgba(124, 91, 240, 0.06);
    animation-duration: 90s;
  }

  .orbital--2 {
    width: 380px;
    height: 380px;
    border-color: rgba(124, 91, 240, 0.08);
    animation-duration: 70s;
    animation-direction: reverse;
  }

  .orbital--3 {
    width: 220px;
    height: 220px;
    border-color: rgba(124, 91, 240, 0.12);
    animation-duration: 50s;
  }

  .orbital::after {
    content: '';
    position: absolute;
    top: -3px;
    left: 50%;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--purple);
    box-shadow: 0 0 14px rgba(124, 91, 240, 0.6);
    transform: translateX(-50%);
  }

  .orbital--2::after {
    background: var(--blue);
    box-shadow: 0 0 14px rgba(91, 141, 239, 0.6);
  }

  .orbital--3::after {
    top: -2.5px;
    width: 5px;
    height: 5px;
    background: var(--cyan);
    box-shadow: 0 0 14px rgba(56, 189, 248, 0.6);
  }

  @keyframes orbit-spin {
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }

  .grain {
    position: fixed;
    inset: 0;
    z-index: 99;
    pointer-events: none;
    opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 180px;
  }

  .float-grid {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }

  .float-dot {
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: rgba(124, 91, 240, 0.2);
  }

  .float-dot:nth-child(1) { top: 15%; left: 8%; animation: float 8s ease-in-out infinite; }
  .float-dot:nth-child(2) { top: 30%; right: 12%; animation: float 6s ease-in-out infinite 1s; background: rgba(91, 141, 239, 0.2); }
  .float-dot:nth-child(3) { bottom: 25%; left: 20%; animation: float 7s ease-in-out infinite 2s; background: rgba(56, 189, 248, 0.15); }
  .float-dot:nth-child(4) { bottom: 15%; right: 25%; animation: float 9s ease-in-out infinite 0.5s; }
  .float-dot:nth-child(5) { top: 45%; left: 5%; animation: float 10s ease-in-out infinite 3s; background: rgba(52, 211, 153, 0.15); }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
  }

  .brand {
    position: fixed;
    top: 2.25rem;
    left: 3rem;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 0.625rem;
  }

  .brand__mark {
    width: 24px;
    height: 24px;
    opacity: 0.8;
  }

  .brand__name {
    font-family: var(--font-display);
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--text-bright);
    opacity: 0.7;
    letter-spacing: 0;
  }

  .progress {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 200;
    height: 2px;
    background: rgba(255, 255, 255, 0.02);
  }

  .progress__bar {
    height: 100%;
    border-radius: 0 2px 2px 0;
    background: linear-gradient(90deg, var(--purple), var(--blue));
    transition: width 0.5s var(--ease-out-expo);
    box-shadow: 0 0 12px rgba(124, 91, 240, 0.4);
  }

  .key-hint {
    position: fixed;
    top: 2.25rem;
    right: 3rem;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: var(--text-ghost);
    font-family: var(--font-mono);
    font-size: 0.625rem;
    letter-spacing: 0.03em;
    animation: hint-fade 5s ease forwards;
  }

  .key-hint kbd {
    padding: 0.15rem 0.4rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-dim);
    font: inherit;
  }

  @keyframes hint-fade {
    0%, 70% { opacity: 1; }
    100% { opacity: 0; }
  }

  .nav {
    position: fixed;
    bottom: 2.5rem;
    left: 50%;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 999px;
    background: rgba(15, 18, 28, 0.85);
    backdrop-filter: blur(20px);
    transform: translateX(-50%);
  }

  .nav__dot {
    width: 8px;
    height: 8px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: var(--text-ghost);
    cursor: pointer;
    transition: all 0.35s var(--ease-out-expo);
  }

  .nav__dot.active {
    width: 24px;
    border-radius: 999px;
    background: var(--purple);
    box-shadow: 0 0 12px rgba(124, 91, 240, 0.5);
  }

  .nav__dot:hover:not(.active) {
    background: var(--text-dim);
  }

  .slide-counter {
    position: fixed;
    right: 3rem;
    bottom: 2.5rem;
    z-index: 100;
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.05em;
  }

  .slide-counter__current {
    color: var(--text-bright);
  }

  .slide-error {
    position: relative;
    z-index: 2;
    max-width: 34rem;
    padding: 1rem 1.25rem;
    border: 1px solid rgba(251, 113, 133, 0.3);
    border-radius: 8px;
    background: rgba(251, 113, 133, 0.08);
    color: #fb7185;
    font: 0.875rem/1.5 var(--font-body);
  }

  @media (max-width: 760px) {
    .brand {
      top: 1.25rem;
      left: 1.25rem;
    }

    .key-hint,
    .slide-counter {
      display: none;
    }

    .nav {
      bottom: 1rem;
    }
  }
</style>
