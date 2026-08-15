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

  const hourHeight = 48;
  const firstHour = 8;
  const lastHour = 20;
  const accents = { violet: '#9b5cff', cyan: '#4f8cff', orange: '#d69a48', green: '#52c3aa', pink: '#d461c9', blue: '#4f8cff' };
  const kindLabels = { violet: 'Meeting', cyan: 'Release', orange: 'Milestone', green: 'Focus', pink: 'Review', blue: 'Focus' };

  function unixTime(value) {
    if (value?.__type === 'Time') return Number(value.zef_unix_time) * 1000;
    if (typeof value === 'string' || typeof value === 'number') { const parsed = new Date(value).getTime(); return Number.isFinite(parsed) ? parsed : null; }
    return null;
  }
  function zone(value) { try { Intl.DateTimeFormat(undefined, { timeZone: value }).format(); return value; } catch (_) { return 'UTC'; } }
  function parts(milliseconds, timeZone) {
    const values = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(milliseconds));
    return Object.fromEntries(values.filter(value => value.type !== 'literal').map(value => [value.type, value.value]));
  }
  function dayKey(milliseconds, timeZone) { const value = parts(milliseconds, timeZone); return `${value.year}-${value.month}-${value.day}`; }
  function localMinutes(milliseconds, timeZone) { const value = parts(milliseconds, timeZone); return Number(value.hour) * 60 + Number(value.minute); }
  function addLocalDays(milliseconds, days, timeZone) { const value = parts(milliseconds, timeZone); return Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day) + days, 12); }
  function dayLabel(milliseconds, timeZone) {
    const values = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', day: 'numeric' }).formatToParts(new Date(milliseconds));
    return { weekday: values.find(value => value.type === 'weekday')?.value ?? '', day: values.find(value => value.type === 'day')?.value ?? '' };
  }
  function formatRange(start, end, timeZone) { const formatter = new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric', year: 'numeric' }); return `${formatter.format(new Date(start))} — ${formatter.format(new Date(end))}`; }
  function formatTime(milliseconds, timeZone) { return new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(milliseconds)); }
  function hourLabel(hour) { return hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`; }

  function calendarModel(value) {
    const timeZone = zone(value?.timeZone ?? 'UTC');
    const weekStart = unixTime(value?.weekOf) ?? Date.now();
    const reference = unixTime(value?.referenceTime) ?? Date.now();
    const days = Array.from({ length: 7 }, (_, index) => {
      const instant = addLocalDays(weekStart, index, timeZone);
      return { key: dayKey(instant, timeZone), instant, ...dayLabel(instant, timeZone) };
    });
    const dayKeys = new Set(days.map(day => day.key));
    const events = (value?.content_ ?? []).filter(event => event?.__type === 'ET.CalendarEvent').map((event, index) => ({ ...event, index, startMilliseconds: unixTime(event.start), durationSeconds: Math.max(60, Number(event.duration) || 3600), accent: accents[event.accent] ? event.accent : 'violet' })).filter(event => event.startMilliseconds !== null && dayKeys.has(dayKey(event.startMilliseconds, timeZone)));
    const positioned = new Map();
    for (const day of days) {
      const entries = events.filter(event => !event.allDay && dayKey(event.startMilliseconds, timeZone) === day.key).sort((left, right) => left.startMilliseconds - right.startMilliseconds || left.index - right.index);
      const lanes = [];
      for (const event of entries) {
        const start = localMinutes(event.startMilliseconds, timeZone);
        const end = start + event.durationSeconds / 60;
        let lane = lanes.findIndex(laneEnd => laneEnd <= start);
        if (lane < 0) lane = lanes.length;
        lanes[lane] = end;
        positioned.set(event, { lane, lanes: 1, start, end });
      }
      for (const event of entries) positioned.get(event).lanes = lanes.length;
    }
    return { timeZone, reference, days, events, positioned };
  }
  function eventStyle(event, model) {
    const placement = model.positioned.get(event);
    if (!placement) return 'display:none';
    const visibleStart = Math.max(firstHour * 60, placement.start);
    const visibleEnd = Math.min(lastHour * 60, placement.end);
    if (visibleEnd <= firstHour * 60 || visibleStart >= lastHour * 60) return 'display:none';
    const width = 100 / placement.lanes;
    return `top:${(visibleStart - firstHour * 60) / 60 * hourHeight}px;height:${Math.max(34, (visibleEnd - visibleStart) / 60 * hourHeight)}px;left:calc(${placement.lane * width}% + 4px);width:calc(${width}% - 8px);--accent:${accents[event.accent]}`;
  }
  function toggleFullWidth() { isFullWidth = !isFullWidth; window.parent.postMessage({ type: 'zefEntityToggleFullWidth', entityType: 'ET.Calendar' }, '*'); requestAnimationFrame(() => requestAnimationFrame(reportHeight)); }
  function reportHeight() { if (calendar) window.parent.postMessage({ type: 'zefEntityResize', height: Math.ceil(calendar.getBoundingClientRect().height) }, '*'); }
  function reportHeightAfterLayout() { void tick().then(() => { requestAnimationFrame(() => requestAnimationFrame(reportHeight)); window.setTimeout(reportHeight, 100); }); }
  onMount(() => { const observer = new ResizeObserver(reportHeightAfterLayout); observer.observe(calendar); reportHeightAfterLayout(); return () => observer.disconnect(); });

  $: model = calendarModel(data);
  $: hours = Array.from({ length: lastHour - firstHour + 1 }, (_, index) => firstHour + index);
  $: legend = [...new Set(model.events.map(event => event.accent))];
</script>

{#if data?.__type === 'ET.Calendar'}
  <section bind:this={calendar} class:full-width={isFullWidth} class="calendar" aria-label={data.title ?? 'Weekly calendar'}>
    <header><div>{#if data.title}<h2>{data.title}</h2>{/if}{#if data.subtitle}<p>{data.subtitle}</p>{/if}</div><button type="button" title="Toggle full width" aria-label="Toggle full width" onclick={toggleFullWidth}><svg viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></svg></button></header>
    <div class="toolbar"><div class="range">{formatRange(model.days[0].instant, model.days[6].instant, model.timeZone)}</div><div class="view"><span>Day</span><b>Week</b><span>Month</span></div><code>{model.timeZone}</code></div>
    <div class="calendar-frame"><div class="week-grid"><div class="corner"></div>{#each model.days as day}<div class:today={day.key === dayKey(model.reference, model.timeZone)} class="day-heading"><strong>{day.weekday}</strong><span>{day.day}</span>{#if day.key === dayKey(model.reference, model.timeZone)}<em>today</em>{/if}</div>{/each}<div class="all-day-label">all day</div>{#each model.days as day}<div class="all-day">{#each model.events.filter(event => event.allDay && dayKey(event.startMilliseconds, model.timeZone) === day.key) as event (event.__local_name ?? event.index)}<article class="all-day-event" style={`--accent:${accents[event.accent]}`}>{event.title ?? 'Untitled event'}</article>{/each}</div>{/each}<div class="time-axis">{#each hours as hour}<span style={`top:${(hour - firstHour) * hourHeight - 8}px`}>{hourLabel(hour)}</span>{/each}</div>{#each model.days as day}<div class:today={day.key === dayKey(model.reference, model.timeZone)} class="day-column">{#each hours.slice(0, -1) as _, index}<i style={`top:${index * hourHeight}px`}></i>{/each}{#each model.events.filter(event => !event.allDay && dayKey(event.startMilliseconds, model.timeZone) === day.key) as event (event.__local_name ?? event.index)}<article class="event" style={eventStyle(event, model)} title={`${event.title ?? 'Untitled event'} · ${formatTime(event.startMilliseconds, model.timeZone)}`}><small>{formatTime(event.startMilliseconds, model.timeZone)} – {formatTime(event.startMilliseconds + event.durationSeconds * 1000, model.timeZone)}</small><b>{event.title ?? 'Untitled event'}</b>{#if event.location}<em>{event.location}</em>{/if}</article>{/each}</div>{/each}</div></div>
    <footer>{#each legend as accent}<span><i style={`--accent:${accents[accent]}`}></i>{kindLabels[accent]}</span>{/each}<code>weekly view</code></footer>
  </section>
{:else}<p class="error">Calendar requires an <code>ET.Calendar</code> data value.</p>{/if}

<style>
  :global(html), :global(body) { overflow: hidden; padding: 0 !important; } .calendar { color: #ededf0; font-family: Inter, ui-sans-serif, system-ui, sans-serif; margin: 0; max-width: 820px; } .calendar.full-width { margin-left: auto; margin-right: auto; max-width: 1450px; } header { align-items: flex-start; display: flex; justify-content: space-between; padding: 0 2px; } h2 { font-size: 26px; font-weight: 650; letter-spacing: -0.035em; line-height: 1.1; margin: 0; } header p { color: #a1a1aa; font-size: 14px; margin: 8px 0 0; } button { background: #0d0d0f; border: 1px solid #303035; border-radius: 8px; color: #a1a1aa; cursor: pointer; display: grid; height: 32px; padding: 7px; place-items: center; width: 32px; } button:hover { border-color: #575761; color: #f4f4f5; } button svg { fill: none; height: 16px; stroke: currentColor; stroke-linecap: round; stroke-width: 1.5; width: 16px; } .toolbar { align-items: center; display: flex; gap: 18px; margin: 20px 0 18px; } .range { color: #f4f4f5; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; } .view { background: #111114; border: 1px solid #29292e; border-radius: 7px; display: flex; overflow: hidden; } .view span, .view b { color: #8c8c95; font-size: 12px; font-weight: 500; padding: 9px 15px; } .view b { background: linear-gradient(135deg, #7e43dd, #5730a7); color: white; } .toolbar code { color: #5d5d66; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; margin-left: auto; } .calendar-frame { background: #0a0a0c; border: 1px solid #36363b; border-radius: 16px 16px 0 0; overflow: hidden; } .week-grid { display: grid; grid-template-columns: 48px repeat(7, minmax(0, 1fr)); min-width: 0; } .corner, .day-heading { border-bottom: 1px solid #29292e; height: 60px; } .day-heading { align-items: center; border-left: 1px solid #29292e; display: flex; gap: 8px; justify-content: center; position: relative; } .day-heading strong { color: #e4e4e7; font-size: 12px; font-weight: 650; text-transform: uppercase; } .day-heading span { color: #a1a1aa; font-size: 12px; } .day-heading.today { background: linear-gradient(180deg, rgb(126 67 221 / 0.15), transparent); border-top: 4px solid #9b5cff; } .day-heading.today strong, .day-heading.today span { color: #b98bff; } .day-heading em { bottom: 10px; color: #a970ff; font-size: 10px; font-style: normal; font-weight: 600; position: absolute; text-transform: uppercase; } .all-day-label, .all-day { border-bottom: 1px solid #29292e; height: 44px; } .all-day-label { color: #a1a1aa; font-size: 9px; padding: 16px 5px 0; text-align: right; text-transform: uppercase; } .all-day { border-left: 1px solid #29292e; box-sizing: border-box; padding: 6px 5px; } .all-day-event { background: color-mix(in srgb, var(--accent) 13%, #111114); border: 1px solid color-mix(in srgb, var(--accent) 50%, #323238); border-radius: 5px; color: color-mix(in srgb, var(--accent) 70%, white); font-size: 10px; overflow: hidden; padding: 7px 6px; text-overflow: ellipsis; white-space: nowrap; } .time-axis { height: 576px; position: relative; } .time-axis span { color: #9696a0; font-size: 11px; position: absolute; right: 10px; } .day-column { background: #0c0c0f; border-left: 1px solid #29292e; height: 576px; position: relative; } .day-column.today { background: linear-gradient(180deg, rgb(118 71 212 / 0.09), #0c0c0f 45%); } .day-column i { border-top: 1px solid #242429; display: block; left: 0; position: absolute; right: 0; } .event { background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 48%, #14131c), color-mix(in srgb, var(--accent) 24%, #0a0a0d)); border: 1px solid color-mix(in srgb, var(--accent) 82%, #8c8c96); border-radius: 6px; box-shadow: 0 4px 16px rgb(0 0 0 / 0.24); box-sizing: border-box; overflow: hidden; padding: 7px 7px; position: absolute; } .event small { color: #e2d6ff; display: block; font-size: 10px; margin-bottom: 5px; white-space: nowrap; } .event b { color: #fafafa; display: block; font-size: 12px; letter-spacing: -0.01em; line-height: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .event em { color: #dedee5; display: block; font-size: 10px; font-style: normal; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } footer { align-items: center; background: #0a0a0c; border: 1px solid #36363b; border-radius: 0 0 16px 16px; border-top: 0; color: #a1a1aa; display: flex; font-size: 12px; gap: 24px; padding: 14px 28px; } footer span { align-items: center; display: flex; gap: 7px; } footer i { background: var(--accent); border-radius: 99px; height: 7px; width: 7px; } footer code { color: #5d5d66; font: 10px ui-monospace, SFMono-Regular, Menlo, monospace; margin-left: auto; } .error { color: #fda4af; } @media (max-width: 760px) { .calendar-frame { overflow: hidden; } .toolbar { gap: 12px; } .range { font-size: 13px; } .view span, .view b { padding: 8px 10px; } footer { gap: 12px; padding: 12px; } footer span { font-size: 10px; } }
</style>
