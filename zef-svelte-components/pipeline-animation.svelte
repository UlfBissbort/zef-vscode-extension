<!-- +++
this = "ET.SvelteComponent('🍃-a61b38d2f94e70c5e813')"
tag_ = []
dispatched_on = "ET.PipelineAnimation"
created = "Time('2026-08-15 16:45:00 +0800')"
[ns]
"ET.PipelineAnimation" = "ET('506970656c696e65416e696d6174696f6e')"
+++ -->

<script>
  import { onDestroy, onMount, tick } from 'svelte';

  /** A data-in, DOM-out renderer for an ET.PipelineAnimation value. */
  export let data;

  let activeIndex = 0;
  let timer;
  let playbackToken = 0;
  let configuredData;
  let pipeline;

  const materialPaths = {
    edit_note: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z',
    bolt: 'M11 21h-1l1-7H7.5a1 1 0 0 1-.76-1.65l5-6A1 1 0 0 1 13.5 7l-1 5h4a1 1 0 0 1 .75 1.66l-5.5 6A1 1 0 0 1 11 21Z',
    language: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-3.03a15.67 15.67 0 0 0-1.41-3.64A8.04 8.04 0 0 1 18.9 8ZM12 4c.83 1.2 1.48 2.55 1.9 4h-3.8c.42-1.45 1.07-2.8 1.9-4ZM4.26 14a7.73 7.73 0 0 1 0-4h3.39a16.5 16.5 0 0 0 0 4H4.26Zm.84 2h3.03a15.67 15.67 0 0 0 1.41 3.64A8.04 8.04 0 0 1 5.1 16Zm3.03-8H5.1a8.04 8.04 0 0 1 4.44-3.64A15.67 15.67 0 0 0 8.13 8ZM12 20c-.83-1.2-1.48-2.55-1.9-4h3.8c-.42 1.45-1.07 2.8-1.9 4Zm2.35-6h-4.7a14.5 14.5 0 0 1 0-4h4.7a14.5 14.5 0 0 1 0 4Zm.11 5.64A15.67 15.67 0 0 0 15.87 16h3.03a8.04 8.04 0 0 1-4.44 3.64ZM16.35 14a16.5 16.5 0 0 0 0-4h3.39a7.73 7.73 0 0 1 0 4h-3.39Z',
    account_tree: 'M22 13v-2h-6V7h-2v4H8V7h2V5H4v6h2v4H4v6h6v-2H8v-4h6v4h-2v2h6v-6h-2v-2h6Z',
    cloud_upload: 'M19.35 10.04A7.49 7.49 0 0 0 5.5 7.5a5.5 5.5 0 0 0 .5 11H19a4 4 0 0 0 .35-8.46ZM13 12v4h-2v-4H8l4-4 4 4h-3Z',
    check_circle: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9Z'
  };

  function stagesFor(animation) {
    return (animation?.content_ ?? []).filter(stage => stage?.__type === 'ET.PipelineStage');
  }

  function seconds(value, fallback, minimum = 0.2) {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(minimum, value) : fallback;
  }

  function schedule(animation, stages, playback, token) {
    if (token !== playbackToken || stages.length === 0) return;
    const final = activeIndex === stages.length - 1;
    const defaultDuration = seconds(playback.advanceEvery, 2);
    const duration = final
      ? seconds(playback.finalHold, defaultDuration)
      : seconds(stages[activeIndex].activeFor, defaultDuration);
    timer = window.setTimeout(() => {
      if (token !== playbackToken || (final && playback.loop !== true)) return;
      activeIndex = final ? 0 : activeIndex + 1;
      schedule(animation, stages, playback, token);
    }, duration * 1000);
  }

  function configure(animation) {
    playbackToken += 1;
    window.clearTimeout(timer);
    const stages = stagesFor(animation);
    const playback = animation?.playback?.__type === 'ET.PipelinePlayback' ? animation.playback : null;
    activeIndex = 0;
    if (playback && stages.length > 1) schedule(animation, stages, playback, playbackToken);
  }

  function iconPath(stage) {
    const icon = stage?.icon;
    return icon?.__type === 'ET.MaterialSymbol' ? materialPaths[icon.name] : null;
  }

  function reportHeight() {
    if (pipeline) window.parent.postMessage({ type: 'zefEntityResize', height: Math.ceil(pipeline.getBoundingClientRect().height) }, '*');
  }

  onMount(() => {
    const observer = new ResizeObserver(() => void tick().then(reportHeight));
    observer.observe(pipeline);
    reportHeight();
    window.setTimeout(reportHeight, 0);
    return () => observer.disconnect();
  });

  $: if (data !== configuredData) {
    configuredData = data;
    if (data?.__type === 'ET.PipelineAnimation') configure(data);
  }

  onDestroy(() => {
    playbackToken += 1;
    window.clearTimeout(timer);
  });
</script>

{#if data?.__type === 'ET.PipelineAnimation'}
  {@const stages = stagesFor(data)}
  <section bind:this={pipeline} class="pipeline-animation" aria-labelledby="pipeline-title">
    <header>
      <h2 id="pipeline-title">{data.title}</h2>
      {#if data.subtitle}<p>{data.subtitle}</p>{/if}
    </header>
    <ol class="pipeline" aria-live={data.playback ? 'polite' : 'off'}>
      {#each stages as stage, index (stage.title)}
        {@const active = index === activeIndex}
        <li class:active>
          <div class="stage-icon" aria-hidden="true">
            {#if iconPath(stage)}<svg viewBox="0 0 24 24"><path d={iconPath(stage)} /></svg>{/if}
          </div>
          <h3>{stage.title}</h3>
          {#if stage.description}<p>{stage.description}</p>{/if}
        </li>
        {#if index < stages.length - 1}<span class:active={index === activeIndex} class="connector" aria-hidden="true">→</span>{/if}
      {/each}
    </ol>
  </section>
{:else}
  <p class="error">PipelineAnimation requires an <code>ET.PipelineAnimation</code> data value.</p>
{/if}

<style>
  :global(body) { padding: 0 !important; }
  .pipeline-animation { color: #e4e4e7; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; max-width: 720px; }
  header { margin-bottom: 28px; } h2 { color: #e4e4e7; font-size: 18px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.25; margin: 0; } header p { color: #8a8a94; font-size: 13px; line-height: 1.5; margin: 7px 0 0; }
  .pipeline { align-items: flex-start; display: flex; justify-content: center; list-style: none; margin: 0; padding: 0; }
  li { align-items: center; display: flex; flex: 1 1 0; flex-direction: column; min-width: 0; opacity: 0.48; text-align: center; transition: opacity 260ms ease; }
  li.active { opacity: 1; } .stage-icon { align-items: center; background: rgb(255 255 255 / 0.025); border: 1px solid #303036; border-radius: 11px; color: #a1a1aa; display: flex; height: 66px; justify-content: center; transition: all 260ms ease; width: 66px; } li.active .stage-icon { background: rgb(45 212 191 / 0.07); border-color: #2dd4bf; box-shadow: 0 0 22px rgb(45 212 191 / 0.17); color: #5eead4; }
  svg { fill: currentColor; height: 28px; width: 28px; } h3 { color: #d4d4d8; font-size: 14px; font-weight: 600; line-height: 1.3; margin: 12px 0 0; } li p { color: #71717a; font-size: 12px; line-height: 1.5; margin: 7px 0 0; max-width: 132px; }
  .connector { align-self: flex-start; color: #3f3f46; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 24px; line-height: 66px; margin: 0 13px; transition: color 260ms ease; } .connector.active { color: #2dd4bf; }
  .error { color: #fda4af; font-family: system-ui, sans-serif; }
  @media (max-width: 480px) { .pipeline { align-items: stretch; flex-direction: column; gap: 12px; } li { align-items: flex-start; display: grid; grid-template-columns: 50px 1fr; text-align: left; } .stage-icon { grid-row: span 2; height: 44px; width: 44px; } .stage-icon svg { height: 21px; width: 21px; } h3 { margin: 1px 0 0; } li p { grid-column: 2; margin: 4px 0 0; max-width: none; } .connector { align-self: center; line-height: 1; margin: -4px 0 -4px 15px; transform: rotate(90deg); } }
  @media (prefers-reduced-motion: reduce) { li, .stage-icon, .connector { transition: none; } }
</style>
