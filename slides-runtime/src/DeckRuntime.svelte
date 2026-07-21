<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import SlideRenderer from './SlideRenderer.svelte';

  const STAGE_WIDTH = 1280;
  const STAGE_HEIGHT = 720;

  let {
    deck = null,
    slides = [],
    slide = null,
    error = '',
    currentSlideIndex = 0,
    currentStage = 0,
    onGoToSlide = () => {},
    onNextSlide = () => {},
    onPreviousSlide = () => {},
    onUpdateData = () => ({ ok: false, error: 'No data update handler is available.' }),
    allowDataEditing = false
  } = $props();

  let viewportWidth = $state(1280);
  let viewportHeight = $state(720);
  let isFullscreen = $state(false);
  let overviewOpen = $state(false);
  let dataView = $state(null);
  let dataCopied = $state(false);
  let dataEditorText = $state('');
  let dataEditorError = $state('');
  let dataEditorKey = $state('');

  const slideCount = $derived(slides.length);
  const progressWidth = $derived(slideCount > 0 ? ((currentSlideIndex + 1) / slideCount) * 100 : 0);
  const slideJson = $derived(JSON.stringify(slide ?? {}, null, 2));
  const deckJson = $derived(JSON.stringify(deck ?? {}, null, 2));
  const dataTitle = $derived('Zef data view');
  const dataSubtitle = $derived(
    dataView === 'deck'
      ? `Deck / ${slideCount} slides / ${deck?.__type ?? 'ET.ZefSlides'}`
      : `Slide ${String(currentSlideIndex + 1).padStart(2, '0')} / ${slideTitle(slide, currentSlideIndex)}`
  );
  const dataJson = $derived(dataView === 'deck' ? deckJson : slideJson);
  const dataContextKey = $derived(dataView ? `${dataView}:${currentSlideIndex}` : 'closed');
  const stageScale = $derived.by(() => {
    const horizontalPadding = isFullscreen ? 0 : 64;
    const verticalPadding = isFullscreen ? 0 : 120;
    const availableWidth = Math.max(320, viewportWidth - horizontalPadding);
    const availableHeight = Math.max(240, viewportHeight - verticalPadding);
    return Math.min(availableWidth / STAGE_WIDTH, availableHeight / STAGE_HEIGHT);
  });
  const brandName = $derived(deck?.brand ?? 'Linear');

  function updateViewport() {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
  }

  function updateFullscreenState() {
    isFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function toggleOverview(show = !overviewOpen) {
    overviewOpen = show;
  }

  function openDataView(scope = 'slide') {
    dataView = scope;
    dataCopied = false;
    dataEditorError = '';
    dataEditorKey = '';
    if (scope === 'deck') {
      overviewOpen = false;
    }
  }

  function closeDataView() {
    dataView = null;
    dataCopied = false;
    dataEditorError = '';
    dataEditorKey = '';
  }

  async function copyDataView() {
    const source = dataEditorText || dataJson;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(source);
    } else {
      const helper = document.createElement('textarea');
      helper.value = source;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      helper.remove();
    }
    dataCopied = true;
  }

  function updateDataEditor(event) {
    if (!allowDataEditing) return;
    const nextText = event.currentTarget.value;
    dataEditorText = nextText;
    dataCopied = false;

    try {
      JSON.parse(nextText);
      const result = onUpdateData(dataView, nextText, currentSlideIndex);
      if (result?.ok === false) {
        dataEditorError = result.error ?? 'The edited data is not valid for this view.';
      } else {
        dataEditorError = '';
      }
    } catch (error) {
      dataEditorError = error.message;
    }
  }

  function toggleFullscreen() {
    if (!isFullscreen) {
      const target = document.documentElement;
      if (target.requestFullscreen) target.requestFullscreen();
      else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }

  function goToSlideFromOverview(index) {
    onGoToSlide(index);
    overviewOpen = false;
  }

  function slideTitle(targetSlide, index) {
    const titleNode = (targetSlide?.content_ ?? [])
      .flatMap((node) => node?.content_ ?? [])
      .find((node) => node?.__type === 'ET.Title');
    return titleNode?.value ?? targetSlide?.ariaLabel ?? `Slide ${index + 1}`;
  }

  function handleRuntimeKeydown(event) {
    if (event.target?.tagName === 'TEXTAREA' || event.target?.tagName === 'INPUT') return;
    if (event.key === 'Escape' && dataView) {
      event.preventDefault();
      closeDataView();
      return;
    }
    if (event.key === 'o' || event.key === 'O') {
      event.preventDefault();
      toggleOverview(true);
    }
    if (event.key === 'f' || event.key === 'F') {
      event.preventDefault();
      toggleFullscreen();
    }
    if (event.key === 'Escape' && overviewOpen) {
      event.preventDefault();
      toggleOverview(false);
    }
  }

  $effect(() => {
    updateViewport();
    updateFullscreenState();
    window.addEventListener('resize', updateViewport);
    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    return () => {
      window.removeEventListener('resize', updateViewport);
      document.removeEventListener('fullscreenchange', updateFullscreenState);
      document.removeEventListener('webkitfullscreenchange', updateFullscreenState);
    };
  });

  $effect(() => {
    document.body.classList.toggle('runtime-overview-open', overviewOpen);
    document.body.classList.toggle('runtime-data-open', Boolean(dataView));
    return () => {
      document.body.classList.remove('runtime-overview-open');
      document.body.classList.remove('runtime-data-open');
    };
  });

  $effect(() => {
    if (!dataView || dataEditorKey === dataContextKey) return;
    dataEditorKey = dataContextKey;
    dataEditorText = dataJson;
    dataEditorError = '';
    dataCopied = false;
  });
</script>

<svelte:window onkeydown={handleRuntimeKeydown} />

<div class:fullscreen={isFullscreen} class:overview-active={overviewOpen} class="runtime-shell">
  <div class="runtime-backdrop"></div>

  <div class="stage-wrap">
    <div
      class="stage-frame"
      style={`width: ${STAGE_WIDTH}px; height: ${STAGE_HEIGHT}px; transform: scale(${stageScale});`}
    >
      <SlideRenderer
        {deck}
        {slide}
        {error}
        {currentSlideIndex}
        {currentStage}
        {slideCount}
        showChrome={false}
        onGoToSlide={onGoToSlide}
        onNextSlide={onNextSlide}
        onPreviousSlide={onPreviousSlide}
      />
    </div>
  </div>

  <div class="top-controls" aria-label="Presentation controls">
    <button class="control-btn data-control" type="button" title="Show Zef data view" aria-label="Show slide Zef data view" onclick={() => openDataView('slide')}>
      <span aria-hidden="true">&#123; &#125;</span>
    </button>
    <button class="control-btn overview-control" type="button" title="Show slide overview (O)" aria-label="Show slide overview" onclick={() => toggleOverview(true)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zM13 3h8v8h-8V3zm0 10h8v8h-8v-8z" /></svg>
    </button>
    <button class="control-btn" type="button" title="Toggle fullscreen (F)" aria-label="Toggle fullscreen" onclick={toggleFullscreen}>
      {#if isFullscreen}
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></svg>
      {:else}
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
      {/if}
    </button>
  </div>

  {#if slideCount > 1}
    <div class="bottom-controls">
      <button class="nav-btn" type="button" aria-label="Previous slide" disabled={currentSlideIndex === 0} onclick={onPreviousSlide}>←</button>
      <div class="runtime-progress" aria-label="Slide progress">
        <div class="runtime-progress__bar"><div class="runtime-progress__fill" style={`width: ${progressWidth}%`}></div></div>
        <span>{String(currentSlideIndex + 1).padStart(2, '0')} / {String(slideCount).padStart(2, '0')}</span>
      </div>
      <button class="nav-btn" type="button" aria-label="Next slide" disabled={currentSlideIndex === slideCount - 1} onclick={onNextSlide}>→</button>
    </div>
  {/if}

  {#if overviewOpen}
    <div
      class="overview-modal"
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-label="Slide overview"
      onclick={(event) => event.currentTarget === event.target && toggleOverview(false)}
      onkeydown={(event) => event.key === 'Escape' && toggleOverview(false)}
    >
      <button class="overview-close" type="button" aria-label="Close slide overview" onclick={() => toggleOverview(false)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
      </button>
      <button class="overview-data" type="button" aria-label="Show full deck Zef data view" onclick={() => openDataView('deck')}>
        <span aria-hidden="true">&#123; &#125;</span>
        Zef data view
      </button>
      <div class="overview-grid">
        {#each slides as previewSlide, index (previewSlide.id ?? index)}
          <button
            class:active-preview={index === currentSlideIndex}
            class="slide-preview"
            type="button"
            aria-label={`Go to slide ${index + 1}: ${slideTitle(previewSlide, index)}`}
            onclick={() => goToSlideFromOverview(index)}
          >
            <div class="slide-preview__stage">
              <SlideRenderer
                {deck}
                slide={previewSlide}
                currentSlideIndex={index}
                currentStage={previewSlide.steps_?.length ?? 0}
                slideCount={slideCount}
                preview={true}
                showChrome={false}
              />
            </div>
            <div class="slide-preview__overlay">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{slideTitle(previewSlide, index)}</strong>
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  {#if dataView}
    <div
      class="data-modal"
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-label={dataTitle}
      onclick={(event) => event.currentTarget === event.target && closeDataView()}
      onkeydown={(event) => event.key === 'Escape' && closeDataView()}
    >
      <section class="data-viewer">
        <header class="data-viewer__header">
          <div>
            <h2>{dataTitle}</h2>
            <p>{dataSubtitle}</p>
          </div>
          <div class="data-viewer__actions">
            <button class:copied={dataCopied} class="data-copy" type="button" aria-label={dataCopied ? 'Copied Zef data' : 'Copy Zef data'} onclick={copyDataView} title={dataCopied ? 'Copied' : 'Copy Zef data'}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                <path d="M5 15V7a2 2 0 0 1 2-2h8"></path>
              </svg>
            </button>
            <button class="overview-close data-close" type="button" aria-label="Close Zef data view" onclick={closeDataView}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
            </button>
          </div>
        </header>
        <div class="data-viewer__editor">
          <textarea
            class:error={dataEditorError}
            class="data-viewer__code"
            aria-label={allowDataEditing ? 'Editable Zef JSON data' : 'Zef JSON data'}
            aria-readonly={!allowDataEditing}
            readonly={!allowDataEditing}
            spellcheck="false"
            value={dataEditorText}
            oninput={updateDataEditor}
          ></textarea>
          {#if dataEditorError}
            <p class="data-viewer__error">{dataEditorError}</p>
          {/if}
        </div>
      </section>
    </div>
  {/if}
</div>

<style>
  .runtime-shell {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: #06080e;
  }

  .runtime-backdrop {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 52% 48% at 68% 35%, rgba(124, 91, 240, 0.06), transparent 68%),
      radial-gradient(ellipse 42% 38% at 26% 72%, rgba(56, 189, 248, 0.035), transparent 62%),
      linear-gradient(90deg, rgba(255, 255, 255, 0.012) 1px, transparent 1px),
      linear-gradient(180deg, rgba(255, 255, 255, 0.012) 1px, transparent 1px);
    background-size: auto, auto, 64px 64px, 64px 64px;
    pointer-events: none;
  }

  .stage-wrap {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem 5.5rem;
  }

  .stage-frame {
    position: relative;
    flex: 0 0 auto;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 12px;
    background: #06080e;
    box-shadow: 0 32px 110px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.04);
    transform-origin: center center;
    transition: border-radius 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  }

  .fullscreen .stage-wrap {
    padding: 0;
  }

  .fullscreen .stage-frame {
    border-color: transparent;
    border-radius: 0;
    box-shadow: none;
  }

  .top-controls,
  .bottom-controls {
    position: fixed;
    z-index: 90;
    transition: opacity 0.24s ease;
  }

  .top-controls {
    top: 2rem;
    right: 2rem;
    display: flex;
    gap: 0.5rem;
  }

  .bottom-controls {
    left: 50%;
    bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transform: translateX(-50%);
  }

  .fullscreen .top-controls,
  .fullscreen .bottom-controls {
    opacity: 0.16;
  }

  .fullscreen .top-controls:hover,
  .fullscreen .bottom-controls:hover,
  .overview-active .top-controls,
  .overview-active .bottom-controls {
    opacity: 1;
  }

  .control-btn,
  .nav-btn,
  .overview-close {
    display: inline-grid;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.09);
    background: rgba(16, 19, 30, 0.82);
    color: var(--text-bright, #eef0f4);
    cursor: pointer;
    backdrop-filter: blur(18px);
    box-shadow: 0 12px 34px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.04);
    transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  }

  .control-btn:hover,
  .nav-btn:hover,
  .overview-close:hover {
    border-color: rgba(167, 139, 250, 0.32);
    background: rgba(22, 26, 40, 0.9);
    transform: translateY(-1px);
  }

  .control-btn {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 8px;
  }

  .control-btn svg,
  .overview-close svg {
    width: 1.1rem;
    height: 1.1rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .control-btn:first-child svg,
  .overview-control svg,
  .overview-close svg {
    fill: currentColor;
    stroke: none;
  }

  .data-control span {
    font: 700 0.8rem/1 var(--font-mono, ui-monospace, monospace);
    letter-spacing: -0.08em;
  }

  .nav-btn {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 999px;
    font: 700 1rem var(--font-body, system-ui, sans-serif);
  }

  .nav-btn:disabled {
    cursor: not-allowed;
    opacity: 0.35;
    transform: none;
  }

  .runtime-progress {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 12rem;
    color: var(--text-dim, #545b6e);
    font: 0.6875rem/1 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.04em;
  }

  .runtime-progress__bar {
    position: relative;
    width: 8rem;
    height: 2px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
  }

  .runtime-progress__fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: linear-gradient(90deg, var(--purple, #7c5bf0), var(--cyan, #38bdf8));
    transition: width 0.24s ease;
  }

  .overview-modal {
    position: fixed;
    z-index: 200;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5rem 3rem 3rem;
    background: rgba(3, 3, 4, 0.86);
    backdrop-filter: blur(10px);
  }

  .overview-close {
    position: fixed;
    top: 2rem;
    right: 2rem;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 8px;
  }

  .overview-data {
    position: fixed;
    top: 2rem;
    right: 5rem;
    display: inline-flex;
    height: 2.5rem;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 8px;
    background: rgba(16, 19, 30, 0.82);
    color: var(--text-bright, #eef0f4);
    cursor: pointer;
    font: 700 0.75rem var(--font-body, system-ui, sans-serif);
    backdrop-filter: blur(18px);
    box-shadow: 0 12px 34px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.04);
    transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  }

  .overview-data:hover {
    border-color: rgba(167, 139, 250, 0.32);
    background: rgba(22, 26, 40, 0.9);
    transform: translateY(-1px);
  }

  .overview-data span {
    color: var(--purple-light, #a78bfa);
    font: 700 0.75rem/1 var(--font-mono, ui-monospace, monospace);
    letter-spacing: -0.08em;
  }

  .overview-grid {
    display: grid;
    width: min(1180px, 100%);
    max-height: min(760px, calc(100vh - 8rem));
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    justify-content: center;
    gap: 1rem;
    overflow-y: auto;
    padding: 0.35rem 0.8rem 0.35rem 0.35rem;
    scrollbar-width: thin;
    scrollbar-color: rgba(124, 91, 240, 0.44) rgba(255, 255, 255, 0.035);
  }

  .overview-grid::-webkit-scrollbar {
    width: 10px;
  }

  .overview-grid::-webkit-scrollbar-track {
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.035);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.025);
  }

  .overview-grid::-webkit-scrollbar-thumb {
    border: 2px solid rgba(6, 8, 14, 0.9);
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(167, 139, 250, 0.76), rgba(56, 189, 248, 0.48));
    box-shadow: 0 0 14px rgba(124, 91, 240, 0.26);
  }

  .overview-grid::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, rgba(196, 181, 253, 0.88), rgba(56, 189, 248, 0.62));
  }

  .slide-preview {
    position: relative;
    display: block;
    overflow: hidden;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    aspect-ratio: 16 / 9;
    background: #06080e;
    cursor: pointer;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.24);
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .slide-preview:hover {
    border-color: rgba(167, 139, 250, 0.42);
    box-shadow: 0 16px 42px rgba(0, 0, 0, 0.34);
    transform: translateY(-3px) scale(1.015);
  }

  .slide-preview.active-preview {
    border-color: rgba(167, 139, 250, 0.9);
    box-shadow: 0 0 0 2px rgba(124, 91, 240, 0.55), 0 16px 42px rgba(0, 0, 0, 0.34);
  }

  .slide-preview__stage {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .slide-preview__stage :global(.grain) {
    display: none;
  }

  .slide-preview__stage :global(.deck) {
    width: 1280px;
    height: 720px;
    transform: scale(0.1875);
    transform-origin: top left;
  }

  .slide-preview__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0.5rem;
    background: linear-gradient(180deg, rgba(3, 3, 4, 0.54), rgba(3, 3, 4, 0.04) 36%, transparent 64%, rgba(3, 3, 4, 0.72));
    color: var(--text-bright, #eef0f4);
    pointer-events: none;
  }

  .slide-preview__overlay span,
  .slide-preview__overlay strong {
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
  }

  .slide-preview__overlay span {
    align-self: flex-start;
    font: 600 0.6875rem var(--font-mono, ui-monospace, monospace);
    color: rgba(238, 240, 244, 0.86);
  }

  .slide-preview__overlay strong {
    align-self: flex-end;
    max-width: 90%;
    overflow: hidden;
    font: 600 0.75rem var(--font-body, system-ui, sans-serif);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .data-modal {
    position: fixed;
    z-index: 220;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    background: rgba(3, 3, 4, 0.88);
    backdrop-filter: blur(12px);
  }

  .data-viewer {
    display: grid;
    width: min(1176px, calc(100vw - 3rem));
    height: min(95vh, calc(100vh - 3rem));
    grid-template-rows: auto minmax(0, 1fr);
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 10px;
    background: rgba(10, 13, 22, 0.96);
    box-shadow: 0 28px 90px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .data-viewer__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.1rem 1rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }

  .data-viewer__header p {
    margin: 0.65rem 0 0;
    color: var(--text-mid, #9299ab);
    font: 500 0.875rem/1.35 var(--font-body, system-ui, sans-serif);
    letter-spacing: 0;
  }

  .data-viewer__header h2 {
    margin: 0;
    color: var(--text-bright, #eef0f4);
    font: 700 1.35rem/1.15 var(--font-display, system-ui, sans-serif);
  }

  .data-viewer__actions {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 0.5rem;
  }

  .data-copy {
    display: inline-grid;
    width: 2.5rem;
    height: 2.5rem;
    place-items: center;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-bright, #eef0f4);
    cursor: pointer;
    font: 700 0.75rem var(--font-body, system-ui, sans-serif);
    transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  }

  .data-copy:hover {
    border-color: rgba(52, 211, 153, 0.26);
    background: rgba(52, 211, 153, 0.075);
    transform: translateY(-1px);
  }

  .data-copy.copied {
    border-color: rgba(52, 211, 153, 0.4);
    background: rgba(52, 211, 153, 0.12);
    color: #a7f3d0;
  }

  .data-copy svg {
    width: 1rem;
    height: 1rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .data-close {
    position: static;
    flex: 0 0 auto;
  }

  .data-viewer__editor {
    position: relative;
    display: grid;
    min-height: 0;
  }

  .data-viewer__code {
    scrollbar-color: rgba(167, 139, 250, 0.42) rgba(255, 255, 255, 0.045);
    scrollbar-width: thin;
    width: 100%;
    min-height: 0;
    margin: 0;
    border: 0;
    outline: 0;
    overflow: auto;
    padding: 1rem;
    background:
      linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
      rgba(6, 8, 14, 0.96);
    background-size: 100% 1.5rem;
    color: #d7dbea;
    font: 0.75rem/1.5 var(--font-mono, ui-monospace, monospace);
    resize: none;
    white-space: pre;
  }

  .data-viewer__code:focus {
    box-shadow: inset 0 0 0 1px rgba(167, 139, 250, 0.22);
  }

  .data-viewer__code.error {
    box-shadow: inset 0 0 0 1px rgba(251, 113, 133, 0.26);
  }

  .data-viewer__error {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
    max-width: min(34rem, calc(100% - 2rem));
    margin: 0;
    padding: 0.55rem 0.7rem;
    border: 1px solid rgba(251, 113, 133, 0.26);
    border-radius: 8px;
    background: rgba(31, 10, 18, 0.92);
    color: #fecdd3;
    font: 600 0.75rem/1.35 var(--font-body, system-ui, sans-serif);
    box-shadow: 0 12px 34px rgba(0, 0, 0, 0.28);
  }

  .data-viewer__code::-webkit-scrollbar {
    width: 0.7rem;
    height: 0.7rem;
  }

  .data-viewer__code::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.035);
    border-radius: 999px;
  }

  .data-viewer__code::-webkit-scrollbar-thumb {
    border: 2px solid rgba(6, 8, 14, 0.96);
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(167, 139, 250, 0.52), rgba(56, 189, 248, 0.34));
  }

  .data-viewer__code::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, rgba(167, 139, 250, 0.72), rgba(56, 189, 248, 0.48));
  }

  @media (max-width: 720px) {
    .stage-wrap {
      padding: 3.5rem 1rem 5rem;
    }

    .top-controls {
      top: 1rem;
      right: 1rem;
    }

    .bottom-controls {
      bottom: 1rem;
      gap: 0.65rem;
    }

    .runtime-progress {
      min-width: 9rem;
    }

    .runtime-progress__bar {
      width: 5.5rem;
    }

    .overview-modal {
      padding: 4.5rem 1rem 1rem;
    }

    .overview-close {
      top: 1rem;
      right: 1rem;
    }

    .overview-data {
      top: 1rem;
      right: 4.25rem;
    }

    .overview-grid {
      grid-template-columns: repeat(auto-fill, 160px);
    }

    .slide-preview__stage :global(.deck) {
      transform: scale(0.125);
    }

    .data-modal {
      padding: 1rem;
    }

    .data-viewer {
      width: calc(100vw - 2rem);
      height: calc(100vh - 2rem);
    }
  }
</style>
