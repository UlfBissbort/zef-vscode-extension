<!-- +++
this = "ET.SvelteComponent('🍃-b9c7263c390c4b6fb6a6')"
tag_ = []
dispatched_on = "ET.Calendar"
created = "Time('2026-08-15 20:15:00 +0800')"
[ns]
"ET.Calendar" = "ET('43616c656e646172')"
+++ -->

<script>
  import { onMount, tick } from 'svelte';

  /** A data-in, DOM-out weekly calendar for ET.Calendar and ET.CalendarEvent values. */
  export let data;
  let calendar;
  let isFullWidth = false;
  let weekOffset = 0;
  const defaultEarliest = 8 * 60;
  const defaultLatest = 21 * 60;
  const themes = {
    meeting: { fill: '#18504d', rail: '#2dd4bf' },
    release: { fill: '#164b59', rail: '#22d3ee' },
    focus: { fill: '#174a40', rail: '#34d399' }
  };

  function unixTime(value) {
    if (value?.__type === 'Time') return Number(value.zef_unix_time) * 1000;
    if (typeof value === 'string' || typeof value === 'number') { const result = new Date(value).getTime(); return Number.isFinite(result) ? result : null; }
    return null;
  }
  function zone(value) { try { Intl.DateTimeFormat(undefined, { timeZone: value }).format(); return value; } catch (_) { return 'UTC'; } }
  function parts(milliseconds, timeZone) {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    return Object.fromEntries(formatter.formatToParts(new Date(milliseconds)).filter(entry => entry.type !== 'literal').map(entry => [entry.type, entry.value]));
  }
  function key(milliseconds, timeZone) { const value = parts(milliseconds, timeZone); return `${value.year}-${value.month}-${value.day}`; }
  function minutes(milliseconds, timeZone) { const value = parts(milliseconds, timeZone); return Number(value.hour) * 60 + Number(value.minute); }
  function addLocalDays(milliseconds, days, timeZone) { const value = parts(milliseconds, timeZone); return Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day) + days, 12); }
  function dayLabel(milliseconds, timeZone) { const values = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', day: 'numeric' }).formatToParts(new Date(milliseconds)); return { weekday: values.find(value => value.type === 'weekday')?.value.toUpperCase() ?? '', day: values.find(value => value.type === 'day')?.value ?? '' }; }
  function rangeLabel(start, end, timeZone) { const left = new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric' }).format(new Date(start)); const right = new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(end)); return `${left} — ${right}`; }
  function clock(milliseconds, timeZone) { return new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(milliseconds)); }
  function civilMinutes(value, fallback) {
    const fields = value?.__type === 'CivilTime' ? value.hour_minute_second : null;
    const [hour, minute, second = 0] = Array.isArray(fields) ? fields.map(Number) : [];
    return Number.isInteger(hour) && Number.isInteger(minute) && Number.isInteger(second) && hour >= 0 && hour < 24 && minute >= 0 && minute < 60 && second >= 0 && second < 60 ? hour * 60 + minute + second / 60 : fallback;
  }
  function hourLabel(value) { const hour = Math.floor(value / 60) % 24; const minute = Math.floor(value % 60); return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`; }
  function durationLabel(seconds) { const minutes = Math.round(seconds / 60); return minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}` : `${minutes}m`; }
  function category(event) { return ['cyan', 'blue'].includes(event.accent) ? 'release' : ['green', 'orange'].includes(event.accent) ? 'focus' : 'meeting'; }

  function modelFor(value, offset) {
    const timeZone = zone(value?.timeZone ?? 'UTC');
    const now = unixTime(value?.now);
    const base = unixTime(value?.weekOf) ?? now ?? 0;
    const weekStart = addLocalDays(base, offset * 7, timeZone);
    const earliest = civilMinutes(value?.earliest, defaultEarliest);
    const requestedLatest = civilMinutes(value?.latest, defaultLatest);
    const latest = requestedLatest > earliest ? requestedLatest : defaultLatest > earliest ? defaultLatest : earliest + 60;
    const days = Array.from({ length: 7 }, (_, index) => { const instant = addLocalDays(weekStart, index, timeZone); return { instant, key: key(instant, timeZone), index, ...dayLabel(instant, timeZone) }; });
    const dayKeys = new Set(days.map(day => day.key));
    const events = (value?.content_ ?? []).filter(event => event?.__type === 'ET.CalendarEvent' && !event.allDay).map((event, index) => ({ ...event, index, startMilliseconds: unixTime(event.start), durationSeconds: Math.max(60, Number(event.duration) || 3600), category: category(event) })).filter(event => event.startMilliseconds !== null && dayKeys.has(key(event.startMilliseconds, timeZone)));
    const placements = new Map();
    for (const day of days) {
      const entries = events.filter(event => key(event.startMilliseconds, timeZone) === day.key).sort((a, b) => a.startMilliseconds - b.startMilliseconds || a.index - b.index);
      const lanes = [];
      for (const event of entries) {
        const start = minutes(event.startMilliseconds, timeZone);
        const end = start + event.durationSeconds / 60;
        let lane = lanes.findIndex(laneEnd => laneEnd <= start);
        if (lane < 0) lane = lanes.length;
        lanes[lane] = end;
        placements.set(event, { start, end, lane, lanes: 1 });
      }
      for (const event of entries) placements.get(event).lanes = lanes.length;
    }
    return { timeZone, now, earliest, latest, rangeMinutes: latest - earliest, days, events, placements }; 
  }
  function eventStyle(event, model) {
    const placement = model.placements.get(event);
    if (!placement) return 'display:none';
    const row = isFullWidth ? 56 : 44;
    const start = Math.max(model.earliest, placement.start);
    const end = Math.min(model.latest, placement.end);
    if (end <= model.earliest || start >= model.latest) return 'display:none';
    const width = 100 / placement.lanes;
    return `top:${(start - model.earliest) / 60 * row}px;height:${Math.max(27, (end - start) / 60 * row - 3)}px;left:calc(${placement.lane * width}% + 5px);width:calc(${width}% - 10px)`;
  }
  function toggleFullWidth() { isFullWidth = !isFullWidth; window.parent.postMessage({ type: 'zefEntityToggleFullWidth', entityType: 'ET.Calendar' }, '*'); requestAnimationFrame(() => requestAnimationFrame(reportHeight)); }
  function shiftWeek(amount) { weekOffset += amount; reportHeightAfterLayout(); }
  function reportHeight() { if (calendar) window.parent.postMessage({ type: 'zefEntityResize', height: Math.ceil(calendar.getBoundingClientRect().height) }, '*'); }
  function reportHeightAfterLayout() { void tick().then(() => { requestAnimationFrame(() => requestAnimationFrame(reportHeight)); window.setTimeout(reportHeight, 100); }); }
  onMount(() => { const observer = new ResizeObserver(reportHeightAfterLayout); observer.observe(calendar); reportHeightAfterLayout(); return () => observer.disconnect(); });

  $: model = modelFor(data, weekOffset);
  $: hours = Array.from({ length: Math.ceil(model.rangeMinutes / 60) }, (_, index) => model.earliest + index * 60);
  $: todayKey = model.now === null ? null : key(model.now, model.timeZone);
  $: today = model.days.find(day => day.key === todayKey);
  $: legend = [...new Set(model.events.map(event => event.category))];
</script>

{#if data?.__type === 'ET.Calendar' && (data.weekOf || data.now)}
  <section bind:this={calendar} class:full-width={isFullWidth} class="calendar metal" style={`--hours:${model.rangeMinutes / 60}`} aria-label={data.title ?? 'Weekly calendar'}>
    <div class="toolbar"><div class="nav"><button type="button" onclick={() => shiftWeek(-1)} aria-label="Previous week"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg></button><button type="button" onclick={() => shiftWeek(1)} aria-label="Next week"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" /></svg></button></div><div class="range">{rangeLabel(model.days[0].instant, model.days[6].instant, model.timeZone)}</div><div class="seg" aria-label="Calendar scale"><span>Day</span><b>Week</b><span>Month</span></div><button class="expand" type="button" title="Toggle full width" aria-label="Toggle full width" onclick={toggleFullWidth}><svg viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></svg></button></div>
    <div class="cal"><div class="head"><div class="head-cell"></div>{#each model.days as day}<div class:today={day.key === todayKey} class:weekend={day.index >= 5} class="head-cell"><span class="dow">{day.weekday}<span class="num">{day.day}</span></span></div>{/each}</div><div class="body"><div class="gutter">{#each hours as hour}<span class="tick" style={`top:${(hour - model.earliest) / 60 * (isFullWidth ? 56 : 44)}px`}>{hourLabel(hour)}</span>{/each}</div>{#each model.days as day}<div class:today={day.key === todayKey} class:weekend={day.index >= 5} class="col">{#each model.events.filter(event => key(event.startMilliseconds, model.timeZone) === day.key) as event (event.__local_name ?? event.index)}<article class:compact={event.durationSeconds < 2400} class:tooltip-up={minutes(event.startMilliseconds, model.timeZone) > model.earliest + model.rangeMinutes * 0.55} class={`event ev-${event.category}`} style={eventStyle(event, model)}><div class="ev-time">{clock(event.startMilliseconds, model.timeZone)} – {clock(event.startMilliseconds + event.durationSeconds * 1000, model.timeZone)}</div><div class="ev-title">{event.title ?? 'Untitled event'}</div><div class="event-details" role="tooltip"><strong>{event.title ?? 'Untitled event'}</strong><span>{clock(event.startMilliseconds, model.timeZone)} – {clock(event.startMilliseconds + event.durationSeconds * 1000, model.timeZone)}</span><span>{durationLabel(event.durationSeconds)}</span>{#if event.location}<span>{event.location}</span>{/if}{#if event.description}<p>{event.description}</p>{/if}</div></article>{/each}</div>{/each}{#if today && weekOffset === 0 && minutes(model.now, model.timeZone) >= model.earliest && minutes(model.now, model.timeZone) < model.latest}<div class="now" style={`top:${(minutes(model.now, model.timeZone) - model.earliest) / 60 * (isFullWidth ? 56 : 44)}px;--col-i:${today.index}`}></div>{/if}</div></div>
    <footer class="legend">{#each legend as item}<span class:dot={item === 'focus'} class="key"><i class="swatch" style={`--c:${themes[item].rail}`}></i>{item[0].toUpperCase() + item.slice(1)}</span>{/each}<code>{model.timeZone}</code></footer>
  </section>
{:else}<p class="error">Calendar requires an <code>ET.Calendar</code> with <code>weekOf</code> or <code>now</code>.</p>{/if}

<style>
  :global(html), :global(body) { overflow: hidden; padding: 0 !important; } .calendar { --row: 44px; --gutter: 56px; --metal: #0a0a0b; --line: rgb(255 255 255 / 0.085); --line-half: rgb(255 255 255 / 0.038); --chrome: rgb(255 255 255 / 0.055); --ink: #f2f2f5; --ink-soft: #9a9aa6; --ink-faint: #62626e; --accent: #14b8a6; background-color: var(--metal); border-radius: 13px; color: var(--ink); font-family: -apple-system, BlinkMacSystemFont, Inter, 'Segoe UI', sans-serif; isolation: isolate; margin: 0; max-width: 820px; overflow: hidden; position: relative; } .calendar.full-width { --row: 56px; --gutter: 78px; margin-left: auto; margin-right: auto; max-width: 1180px; } .metal::after { background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.028 .9' numOctaves='3' seed='5'/></filter><rect width='600' height='120' filter='url(%23n)'/></svg>"); background-size: 600px 120px; content: ''; inset: 0; mix-blend-mode: overlay; opacity: .44; pointer-events: none; position: absolute; z-index: 0; } .metal::before { background: linear-gradient(160deg, rgb(255 255 255 / .20), rgb(255 255 255 / .08) 30%, rgb(255 255 255 / .05) 60%, rgb(255 255 255 / .12)); border-radius: inherit; content: ''; inset: 0; mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; padding: 1px; pointer-events: none; position: absolute; z-index: 4; } .toolbar, .cal, .legend { position: relative; z-index: 2; } .toolbar { align-items: center; display: flex; gap: 10px; padding: 11px 13px; } .nav { display: flex; gap: 6px; } button { background: rgb(255 255 255 / .05); border: 0; border-radius: 8px; box-shadow: 0 0 0 1px rgb(255 255 255 / .06), 0 1px 0 rgb(255 255 255 / .07) inset; color: var(--ink-soft); cursor: pointer; display: grid; height: 30px; place-items: center; transition: background .14s, color .14s; width: 30px; } button:hover { background: rgb(255 255 255 / .1); color: var(--ink); } button svg { fill: none; height: 15px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; width: 15px; } .range { font-size: 13px; font-weight: 600; letter-spacing: -.01em; min-width: 158px; } .seg { background: rgb(255 255 255 / .045); border-radius: 9px; box-shadow: 0 0 0 1px rgb(255 255 255 / .06) inset; display: flex; gap: 2px; padding: 3px; } .seg span, .seg b { border-radius: 6px; color: var(--ink-soft); font-size: 11px; font-weight: 500; padding: 6px 10px; } .seg b { background: var(--accent); box-shadow: 0 1px 0 rgb(255 255 255 / .22) inset, 0 2px 8px -2px rgb(124 77 255 / .7); color: white; } .expand { margin-left: auto; } .cal { border-bottom: 1px solid var(--line); border-top: 1px solid var(--line); } .head, .body { display: grid; grid-template-columns: var(--gutter) repeat(7, minmax(0, 1fr)); } .head { background: var(--chrome); border-bottom: 1px solid var(--line); } .head-cell { border-left: 1px solid var(--line); padding: 8px 3px 7px; position: relative; text-align: center; } .head-cell:first-child { border-left: 0; } .dow { color: var(--ink-soft); font-size: 9px; font-weight: 600; letter-spacing: .06em; } .dow .num { color: var(--ink); margin-left: 4px; } .weekend .dow, .weekend .num { color: var(--ink-faint); } .head-cell.today .dow, .head-cell.today .num { color: #d4d4d8; } .head-cell.today::before { background: #a1a1aa; box-shadow: 0 0 3px rgb(255 255 255 / .18); content: ''; height: 2px; inset: 0 0 auto; position: absolute; } .gutter, .col { height: calc(var(--row) * var(--hours)); position: relative; } .tick { color: var(--ink-faint); font-size: 9px; font-weight: 500; position: absolute; right: 8px; transform: translateY(-50%); white-space: nowrap; } .col { background-image: repeating-linear-gradient(180deg, var(--line) 0 1px, transparent 1px var(--row)), repeating-linear-gradient(180deg, transparent 0 calc(var(--row) / 2), var(--line-half) calc(var(--row) / 2) calc(var(--row) / 2 + 1px), transparent calc(var(--row) / 2 + 1px) var(--row)); border-left: 1px solid var(--line); } .col.weekend { background-color: rgb(255 255 255 / .004); } .col.today { background-color: rgb(255 255 255 / .035); } .event { border: 1px solid var(--edge); border-radius: 8px; box-shadow: 0 2px 10px -4px rgb(0 0 0 / .6); box-sizing: border-box; cursor: default; overflow: visible; padding: 6px 7px; position: absolute; transition: filter .13s, transform .13s; } .event:hover { filter: brightness(1.1); transform: translateY(-1px); z-index: 10; } .event-details { background: #111416; border: 1px solid rgb(255 255 255 / .14); border-radius: 7px; box-shadow: 0 10px 24px -8px rgb(0 0 0 / .9); color: #d4d4d8; display: none; left: 0; min-width: 180px; padding: 9px 10px; position: absolute; top: calc(100% + 8px); z-index: 12; } .event:hover .event-details { display: block; } .event.tooltip-up .event-details { bottom: calc(100% + 8px); top: auto; } .event-details strong, .event-details span { display: block; } .event-details strong { color: #f4f4f5; font-size: 12px; font-weight: 600; margin-bottom: 6px; } .event-details span { color: #a1a1aa; font-size: 10px; line-height: 16px; } .event-details p { color: #c4c4ca; font-size: 10px; line-height: 14px; margin: 6px 0 0; } .ev-time { color: rgb(255 255 255 / .66); font-size: 9px; margin-bottom: 3px; white-space: nowrap; } .ev-title { color: white; font-size: 11px; font-weight: 600; letter-spacing: -.008em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .event.compact { padding: 5px 7px; } .event.compact .ev-time { display: none; } .ev-meeting { --edge: rgb(45 212 191 / .52); background: #18504d; } .ev-release { --edge: rgb(34 211 238 / .52); background: #164b59; } .ev-focus { --edge: rgb(52 211 153 / .52); background: #174a40; } .now { border-top: 2px solid #99f6e4; box-shadow: 0 0 8px rgb(153 246 228 / .35); height: 0; left: calc(var(--gutter) + var(--col-i) * (100% - var(--gutter)) / 7); pointer-events: none; position: absolute; width: calc((100% - var(--gutter)) / 7); z-index: 3; } .legend { align-items: center; display: flex; gap: 15px; padding: 10px 14px; } .key { align-items: center; color: var(--ink-soft); display: flex; font-size: 10px; gap: 6px; } .swatch { background: var(--c); border-radius: 2px; box-shadow: 0 0 8px -1px var(--c); height: 3px; width: 13px; } .key.dot .swatch { border-radius: 50%; height: 7px; width: 7px; } .legend code { color: var(--ink-faint); font: 9px ui-monospace, SFMono-Regular, Menlo, monospace; margin-left: auto; } .error { color: #fda4af; } @media (max-width: 560px) { .calendar { --gutter: 43px; --row: 39px; } .range { font-size: 11px; min-width: 126px; } .seg span, .seg b { padding: 6px 7px; } .dow { font-size: 8px; letter-spacing: .02em; } .dow .num { margin-left: 2px; } .event { padding-left: 5px; padding-right: 5px; } .ev-title { font-size: 10px; } .legend { gap: 9px; padding: 9px; } }
</style>
