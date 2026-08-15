<!-- +++
this = "ET.SvelteComponent('🍃-c31f8c72a6e94bd095d1')"
tag_ = []
dispatched_on = "ET.TerminalAnimation"
created = "Time('2026-08-15 13:20:00 +0800')"
[ns]
"ET.TerminalAnimation" = "ET('5465726d696e616c416e696d6174696f6e')"
+++ -->

<script>
  import { onDestroy, tick } from 'svelte';

  /** A data-in, DOM-out renderer for an ET.TerminalAnimation value. */
  export let data;

  let completedLines = [];
  let activeCommand = null;
  let terminalBody;
  let runToken = 0;
  let isComplete = false;

  const defaultTyping = { charDelay: 42, variation: 0.15 };
  const defaultOutputDelay = 280;

  function number(value, fallback, minimum = 0) {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(minimum, value) : fallback;
  }

  function string(value, fallback = '') {
    return typeof value === 'string' ? value : fallback;
  }

  function lineFrom(entity) {
    return {
      kind: entity?.__type === 'ET.TerminalComment' ? 'comment' : 'output',
      content: string(entity?.content),
      tone: string(entity?.tone, entity?.__type === 'ET.TerminalComment' ? 'comment' : 'muted')
    };
  }

  function completedTranscript(animation) {
    return (animation?.content_ ?? []).flatMap(entry => {
      if (entry?.__type === 'ET.TerminalCommand') {
        return [
          { kind: 'command', prompt: string(entry.prompt, string(animation.prompt, '$')), content: string(entry.content) },
          ...(entry.content_ ?? []).filter(child => child?.__type === 'ET.TerminalOutput').map(lineFrom)
        ];
      }
      if (entry?.__type === 'ET.TerminalComment' || entry?.__type === 'ET.TerminalOutput') return [lineFrom(entry)];
      return [];
    });
  }

  function prefersReducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function delay(milliseconds) {
    return new Promise(resolve => window.setTimeout(resolve, milliseconds));
  }

  async function scrollToBottom() {
    await tick();
    terminalBody?.scrollTo({ top: terminalBody.scrollHeight, behavior: 'smooth' });
  }

  async function appendLine(line, token) {
    if (token !== runToken) return false;
    completedLines = [...completedLines, line];
    await scrollToBottom();
    return token === runToken;
  }

  async function typeCommand(command, animation, token) {
    const typing = { ...defaultTyping, ...(animation?.typing ?? {}), ...(command?.typing ?? {}) };
    const baseDelay = number(typing.charDelay, defaultTyping.charDelay, 1);
    const variation = number(typing.variation, defaultTyping.variation, 0);
    const prompt = string(command.prompt, string(animation?.prompt, '$'));
    const content = string(command.content);

    activeCommand = { prompt, content: '' };
    await scrollToBottom();
    for (const character of content) {
      const multiplier = variation === 0 ? 1 : 1 + ((Math.random() * 2 - 1) * variation);
      await delay(baseDelay * multiplier);
      if (token !== runToken) return false;
      activeCommand = { prompt, content: `${activeCommand.content}${character}` };
      await scrollToBottom();
    }

    if (token !== runToken) return false;
    activeCommand = null;
    return appendLine({ kind: 'command', prompt, content }, token);
  }

  async function play(animation, token) {
    if (prefersReducedMotion()) {
      completedLines = completedTranscript(animation);
      activeCommand = null;
      isComplete = true;
      await scrollToBottom();
      return;
    }

    const entries = animation?.content_ ?? [];
    for (const entry of entries) {
      if (token !== runToken) return;
      if (entry?.__type === 'ET.TerminalComment' || entry?.__type === 'ET.TerminalOutput') {
        if (!await appendLine(lineFrom(entry), token)) return;
        await delay(number(entry.hold, 500));
        continue;
      }
      if (entry?.__type !== 'ET.TerminalCommand') continue;

      if (!await typeCommand(entry, animation, token)) return;
      await delay(number(entry.holdBeforeOutput, 350));
      for (const output of entry.content_ ?? []) {
        if (output?.__type !== 'ET.TerminalOutput') continue;
        await delay(number(output.delay, defaultOutputDelay));
        if (!await appendLine(lineFrom(output), token)) return;
      }
      await delay(number(entry.holdAfter, 600));
    }

    if (token !== runToken) return;
    isComplete = true;
    const restartAfter = animation?.loop && number(animation.loop.restartAfter, 0);
    if (restartAfter > 0) {
      await delay(restartAfter);
      if (token === runToken) start(animation);
    }
  }

  function start(animation = data) {
    const token = runToken + 1;
    runToken = token;
    completedLines = [];
    activeCommand = null;
    isComplete = false;
    if (animation?.__type === 'ET.TerminalAnimation') void play(animation, token);
  }

  $: if (data?.__type === 'ET.TerminalAnimation') start(data);

  onDestroy(() => {
    runToken += 1;
  });
</script>

{#if data?.__type === 'ET.TerminalAnimation'}
  <figure class="terminal-animation" aria-labelledby="terminal-title">
    <div class="terminal-window">
      <header class="terminal-header">
        <span class="terminal-controls" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="terminal-title" id="terminal-title">{data.title ?? 'Terminal'}</span>
        {#if isComplete && !data.loop}
          <button class="replay" type="button" onclick={() => start(data)}>Replay</button>
        {/if}
      </header>
      <div class="terminal-body" bind:this={terminalBody} aria-live="polite" aria-atomic="false">
        {#each completedLines as line, index (index)}
          <div class:command={line.kind === 'command'} class:comment={line.kind === 'comment'} class={`terminal-line tone-${line.tone ?? 'muted'}`}>
            {#if line.kind === 'command'}<span class="prompt">{line.prompt}</span>{/if}
            <span class="content">{line.content}</span>
          </div>
        {/each}
        {#if activeCommand}
          <div class="terminal-line command active-command"><span class="prompt">{activeCommand.prompt}</span><span class="content">{activeCommand.content}</span><span class="cursor" aria-hidden="true"></span></div>
        {/if}
      </div>
    </div>
  </figure>
{:else}
  <p class="error">TerminalAnimation requires an <code>ET.TerminalAnimation</code> data value.</p>
{/if}

<style>
  .terminal-animation { margin: 0; max-width: 720px; }
  .terminal-window { background: #09090b; border: 1px solid rgb(255 255 255 / 0.09); border-radius: 11px; box-shadow: 0 16px 40px rgb(0 0 0 / 0.24); overflow: hidden; }
  .terminal-header { align-items: center; background: #111113; border-bottom: 1px solid rgb(255 255 255 / 0.07); display: flex; height: 36px; padding: 0 13px; }
  .terminal-controls { display: flex; gap: 6px; }
  .terminal-controls i { background: #3f3f46; border-radius: 999px; height: 8px; width: 8px; }
  .terminal-controls i:nth-child(1) { background: #fb7185; } .terminal-controls i:nth-child(2) { background: #fbbf24; } .terminal-controls i:nth-child(3) { background: #34d399; }
  .terminal-title { color: #a1a1aa; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; left: 50%; letter-spacing: 0.02em; position: absolute; transform: translateX(-50%); }
  .terminal-header { position: relative; }
  .replay { background: transparent; border: 0; color: #71717a; cursor: pointer; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; margin-left: auto; padding: 4px 0 4px 10px; }
  .replay:hover { color: #d4d4d8; }
  .terminal-body { box-sizing: border-box; color: #d4d4d8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; line-height: 1.65; max-height: 310px; min-height: 150px; overflow: auto; padding: 17px 19px; }
  .terminal-line { min-height: 1.65em; overflow-wrap: anywhere; white-space: pre-wrap; }
  .terminal-line.command { color: #e4e4e7; }
  .prompt { color: #60a5fa; font-weight: 600; margin-right: 9px; }
  .tone-comment, .terminal-line.comment { color: #71717a; font-style: italic; }
  .tone-muted { color: #a1a1aa; }
  .tone-info { color: #7dd3fc; }
  .tone-success { color: #6ee7b7; }
  .tone-warning { color: #fcd34d; }
  .tone-error { color: #fda4af; }
  .cursor { animation: blink 1s step-end infinite; background: #60a5fa; display: inline-block; height: 1.15em; margin-left: 3px; transform: translateY(0.18em); width: 7px; }
  .error { color: #fda4af; font-family: system-ui, sans-serif; }
  @keyframes blink { 50% { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .cursor { animation: none; } .terminal-body { scroll-behavior: auto; } }
</style>
