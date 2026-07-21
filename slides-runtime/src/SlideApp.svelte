<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import DeckRuntime from './DeckRuntime.svelte';
  import { parseDeckValue } from './deckData.js';

  let { initialDeck = null, initialError = '' } = $props();

  let deckValue = $state(initialDeck);
  let externalError = $state(initialError);
  let currentSlideIndex = $state(0);
  let currentStage = $state(0);

  const parsed = $derived(parseDeckValue(deckValue));
  const displayError = $derived(
    externalError || parsed.error || 'No slide deck loaded. Add an ET.Deck(...) or ET.Slide(...) zef block, then open Zef Slides.'
  );
  const activeSlide = $derived(parsed.slides[currentSlideIndex] ?? parsed.slides[0] ?? null);
  const activeStageCount = $derived(activeSlide?.steps_?.length ?? 0);

  function replaceDeck(deck) {
    deckValue = deck;
    externalError = '';
    currentSlideIndex = 0;
    currentStage = 0;
  }

  function showExternalError(error) {
    deckValue = null;
    externalError = typeof error === 'string' && error.trim()
      ? error
      : 'Zef Slides received an unspecified source error.';
    currentSlideIndex = 0;
    currentStage = 0;
  }

  function handleExternalUpdate(event) {
    const update = event.detail;
    if (!update || typeof update !== 'object') return;

    if (update.type === 'setDeck') {
      replaceDeck(update.deck);
    } else if (update.type === 'setError') {
      showExternalError(update.error);
    }
  }

  function slideIndexFromHash(slideCount) {
    const match = window.location.hash.match(/^#slide(\d+)$/);
    if (!match) return null;
    const index = Number.parseInt(match[1], 10) - 1;
    return index >= 0 && index < slideCount ? index : null;
  }

  function writeSlideHash(index) {
    const nextHash = `#slide${index + 1}`;
    if (window.location.hash !== nextHash) window.location.hash = nextHash;
  }

  function syncSlideFromHash() {
    const index = slideIndexFromHash(parsed.slides.length);
    if (index !== null) goToSlide(index, { fromHash: true });
  }

  function goToSlide(index, options = {}) {
    if (index < 0 || index >= parsed.slides.length) return;
    currentSlideIndex = index;
    currentStage = 0;
    if (!options.fromHash) writeSlideHash(index);
  }

  function nextSlide() {
    goToSlide(currentSlideIndex + 1);
  }

  function previousSlide() {
    goToSlide(currentSlideIndex - 1);
  }

  function handleKeydown(event) {
    if (event.target?.tagName === 'TEXTAREA') return;
    if (document.body.classList.contains('runtime-overview-open') || document.body.classList.contains('runtime-data-open')) return;

    if (event.key === ' ') {
      event.preventDefault();
      if (currentStage < activeStageCount) currentStage += 1;
      else nextSlide();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      nextSlide();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      previousSlide();
    }
  }

  $effect(() => {
    if (parsed.slides.length > 0 && currentSlideIndex >= parsed.slides.length) {
      currentSlideIndex = parsed.slides.length - 1;
    }
    if (currentStage > activeStageCount) currentStage = activeStageCount;
  });

  $effect(() => {
    if (parsed.slides.length === 0) return;
    syncSlideFromHash();
    window.addEventListener('hashchange', syncSlideFromHash);
    return () => window.removeEventListener('hashchange', syncSlideFromHash);
  });

  $effect(() => {
    window.addEventListener('zef-slides-update', handleExternalUpdate);
    return () => window.removeEventListener('zef-slides-update', handleExternalUpdate);
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<main class="app">
  <DeckRuntime
    deck={parsed.deck}
    slides={parsed.slides}
    slide={activeSlide}
    error={displayError}
    {currentSlideIndex}
    {currentStage}
    onGoToSlide={goToSlide}
    onNextSlide={nextSlide}
    onPreviousSlide={previousSlide}
    allowDataEditing={false}
  />
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    overflow: hidden;
    background: #06080e;
  }

  .app {
    min-height: 100vh;
    background: #06080e;
  }
</style>
