<!-- +++
this = "ET.SvelteComponent('🍃-d59e4f8b1a206c73d941')"
tag_ = []
dispatched_on = "ET.WorkflowTimeline"
created = "Time('2026-08-15 13:45:00 +0800')"
[ns]
"ET.WorkflowTimeline" = "ET('576f726b666c6f7754696d656c696e65')"
+++ -->

<script>
  import { onDestroy } from 'svelte';

  /** A data-in, DOM-out renderer for an ET.WorkflowTimeline value. */
  export let data;

  let activeIndex = 0;
  let timer;
  let playbackToken = 0;
  let configuredData;

  // All authored durations are SI seconds; timers convert them at the DOM boundary.
  function number(value, fallback, minimum = 0) {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(minimum, value) : fallback;
  }

  function stepsFor(timeline) {
    return (timeline?.content_ ?? []).filter(step => step?.__type === 'ET.WorkflowStep');
  }

  function indexFor(timeline, steps) {
    const requested = timeline?.activeStep;
    if (typeof requested === 'string') {
      const found = steps.findIndex(step => step.id === requested);
      if (found >= 0) return found;
    }
    return Math.min(Math.max(0, Math.floor(number(requested, 0))), Math.max(steps.length - 1, 0));
  }

  function schedulePlayback(timeline, steps, playback, token) {
    if (token !== playbackToken || steps.length === 0) return;
    const currentStep = steps[activeIndex];
    const defaultDuration = number(playback.advanceEvery, 1.5, 0.2);
    const isFinalStep = activeIndex === steps.length - 1;
    const duration = isFinalStep
      ? number(playback.finalHold, defaultDuration, 0.2)
      : number(currentStep.activeFor, defaultDuration, 0.2);

    timer = window.setTimeout(() => {
      if (token !== playbackToken) return;
      if (isFinalStep && playback.loop !== true) return;
      activeIndex = isFinalStep ? 0 : activeIndex + 1;
      schedulePlayback(timeline, steps, playback, token);
    }, duration * 1000);
  }

  function configure(timeline) {
    playbackToken += 1;
    window.clearTimeout(timer);
    const steps = stepsFor(timeline);
    const playback = timeline?.playback?.__type === 'ET.WorkflowPlayback' ? timeline.playback : null;
    activeIndex = indexFor(playback?.startAt === undefined ? timeline : { ...timeline, activeStep: playback.startAt }, steps);
    if (playback && steps.length > 1) schedulePlayback(timeline, steps, playback, playbackToken);
  }

  $: if (data !== configuredData) {
    configuredData = data;
    if (data?.__type === 'ET.WorkflowTimeline') configure(data);
  }

  onDestroy(() => {
    playbackToken += 1;
    window.clearTimeout(timer);
  });
</script>

{#if data?.__type === 'ET.WorkflowTimeline'}
  {@const steps = stepsFor(data)}
  <section class="workflow-timeline" aria-labelledby="workflow-title">
    <header class="workflow-header">
      <h2 id="workflow-title">{data.title}</h2>
      {#if data.subtitle}<p>{data.subtitle}</p>{/if}
    </header>

    <ol class="steps" aria-live={data.playback ? 'polite' : 'off'}>
      {#each steps as step, index (step.id ?? step.title)}
        {@const isHighlighted = index <= activeIndex}
        <li class:active={isHighlighted}>
          <span class="step-marker" aria-hidden="true">{index + 1}</span>
          <div class="step-copy">
            <h3>{step.title}</h3>
            {#if step.description}<p>{step.description}</p>{/if}
          </div>
          {#if step.duration}<span class="duration">{step.duration}</span>{/if}
        </li>
      {/each}
    </ol>

    {#if data.summary}<footer class="summary"><span aria-hidden="true">↗</span>{data.summary}</footer>{/if}
  </section>
{:else}
  <p class="error">WorkflowTimeline requires an <code>ET.WorkflowTimeline</code> data value.</p>
{/if}

<style>
  .workflow-timeline { color: #e4e4e7; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; max-width: 720px; }
  .workflow-header { margin: 0 0 24px; }
  h2 { color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: 0; line-height: 1.2; margin: 0; }
  .workflow-header p { color: #9a9a9a; font-size: 14px; line-height: 1.6; margin: 8px 0 0; }
  .steps { display: grid; gap: 24px; list-style: none; margin: 0; padding: 0; }
  li { align-items: center; background: rgb(255 255 255 / 0.02); border: 1px solid #252525; border-radius: 12px; display: grid; gap: 16px; grid-template-columns: 32px minmax(0, 1fr) auto; min-height: 88px; opacity: 0.5; padding: 16px; transition: all 250ms ease; }
  .step-marker { align-items: center; background: #323232; border-radius: 999px; color: #080809; display: inline-flex; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 14px; height: 32px; justify-content: center; width: 32px; }
  .step-copy { min-width: 0; }
  h3 { color: #ffffff; font-size: 16px; font-weight: 600; line-height: 1.3; margin: 0; }
  .step-copy p { color: #7a7a7a; font-size: 14px; line-height: 1.6; margin: 4px 0 0; }
  .duration { color: #22d3ee; font-family: 'Fira Code', ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; white-space: nowrap; }
  li.active { background: rgb(62 207 142 / 0.05); border-color: #3ecf8e; opacity: 1; }
  li.active .step-marker { background: #3ecf8e; color: #ffffff; }
  .summary { align-items: center; color: #a1a1aa; display: flex; font-size: 12px; gap: 7px; line-height: 1.5; margin-top: 15px; } .summary span { color: #6ee7b7; font-size: 15px; }
  .error { color: #fda4af; font-family: system-ui, sans-serif; }
  @media (max-width: 480px) { li { gap: 12px; grid-template-columns: 30px minmax(0, 1fr); } .duration { grid-column: 2; } }
  @media (prefers-reduced-motion: reduce) { li { transition: none; } }
</style>
