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

  const hourHeight = 54;
  const firstHour = 8;
  const lastHour = 19;
  const accents = { violet: '#a78bfa', cyan: '#22d3ee', orange: '#fb923c', green: '#34d399', pink: '#f472b6', blue: '#60a5fa' };

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
  function addLocalDays(milliseconds, days, timeZone) {
    const value = parts(milliseconds, timeZone);
    return Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day) + days, 12, 0, 0);
  }
  function formatDay(milliseconds, timeZone) { return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', day: 'numeric' }).format(new Date(milliseconds)); }
  function formatRange(start, end, timeZone) { return new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(start)) + ' – ' + new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(end)); }
  function formatTime(milliseconds, timeZone) { return new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit' }).format(new Date(milliseconds)); }
  function formatDuration(seconds) { const minutes = Math.max(0, Math.round(Number(seconds) / 60)); return minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}` : `${minutes}m`; }

  function calendarModel(value) {
    const timeZone = zone(value?.timeZone ?? 'UTC');
    const weekStart = unixTime(value?.weekOf) ?? Date.now();
    const days = Array.from({ length: 7 }, (_, index) => {
      const localNoon = addLocalDays(weekStart, index, timeZone);
      return { key: dayKey(localNoon, timeZone), label: formatDay(localNoon, timeZone), instant: localNoon };
    });
    const events = (value?.content_ ?? []).filter(event => event?.__type === 'ET.CalendarEvent').map((event, index) => ({ ...event, startMilliseconds: unixTime(event.start), durationSeconds: Math.max(60, Number(event.duration) || 3600), index })).filter(event => event.startMilliseconds !== null);
    const byDay = new Map(days.map(day => [day.key, []]));
    for (const event of events) { const entries = byDay.get(dayKey(event.startMilliseconds, timeZone)); if (entries) entries.push(event); }
    const positioned = new Map();
    for (const [key, entries] of byDay) {
      const lanes = [];
      for (const event of entries.sort((left, right) => left.startMilliseconds - right.startMilliseconds || left.index - right.index)) {
        const start = localMinutes(event.startMilliseconds, timeZone);
        const end = start + event.durationSeconds / 60;
        let lane = lanes.findIndex(laneEnd => laneEnd <= start);
        if (lane < 0) lane = lanes.length;
        lanes[lane] = end;
        positioned.set(event, { lane, lanes: 1, start, end });
      }
      for (const event of entries) positioned.get(event).lanes = lanes.length;
    }
    const reference = unixTime(value?.referenceTime) ?? Date.now();
    const upcoming = events.filter(event => event.startMilliseconds >= reference).sort((left, right) => left.startMilliseconds - right.startMilliseconds).slice(0, Math.max(1, Number(value?.upcomingCount) || 5));
    return { timeZone, weekStart, days, events, positioned, upcoming };
  }
  function eventStyle(event, model) {
    const placement = model.positioned.get(event);
    if (!placement) return '';
    const visibleStart = Math.max(firstHour * 60, placement.start);
    const visibleEnd = Math.min(lastHour * 60, placement.end);
    if (visibleEnd <= firstHour * 60 || visibleStart >= lastHour * 60) return 'display: none';
    const top = (visibleStart - firstHour * 60) / 60 * hourHeight;
    const height = Math.max(24, (visibleEnd - visibleStart) / 60 * hourHeight);
    const width = 100 / placement.lanes;
    return `top:${top}px;height:${height}px;left:calc(${placement.lane * width}% + 3px);width:calc(${width}% - 6px);--accent:${accents[event.accent] ?? accents.violet}`;
  }
  function toggleFullWidth() { isFullWidth = !isFullWidth; window.parent.postMessage({ type: 'zefEntityToggleFullWidth', entityType: 'ET.Calendar' }, '*'); requestAnimationFrame(() => requestAnimationFrame(reportHeight)); }
  function reportHeight() { if (calendar) window.parent.postMessage({ type: 'zefEntityResize', height: Math.ceil(calendar.getBoundingClientRect().height) }, '*'); }
  function reportHeightAfterLayout() { void tick().then(() => { requestAnimationFrame(() => requestAnimationFrame(reportHeight)); window.setTimeout(reportHeight, 100); }); }
  onMount(() => { const observer = new ResizeObserver(reportHeightAfterLayout); observer.observe(calendar); reportHeightAfterLayout(); return () => observer.disconnect(); });

  $: model = calendarModel(data);
  $: hours = Array.from({ length: lastHour - firstHour + 1 }, (_, index) => firstHour + index);
</script>

{#if data?.__type === 'ET.Calendar'}
  <section bind:this={calendar} class:full-width={isFullWidth} class="calendar" aria-label={data.title ?? 'Weekly calendar'}>
    <header><div>{#if data.title}<h2>{data.title}</h2>{/if}{#if data.subtitle}<p>{data.subtitle}</p>{/if}<strong>{formatRange(model.days[0].instant, model.days[6].instant, model.timeZone)}</strong></div><div class="actions"><span>{model.timeZone}</span><button type="button" title="Toggle full width" aria-label="Toggle full width" onclick={toggleFullWidth}><svg viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></svg></button></div></header>
    <div class="calendar-body">
      <div class="week-shell"><div class="week-grid"><div class="corner">time</div>{#each model.days as day}<div class="day-heading">{day.label}</div>{/each}<div class="time-axis">{#each hours as hour}<span style={`top:${(hour - firstHour) * hourHeight - 7}px`}>{hour === 12 ? '12 pm' : hour > 12 ? `${hour - 12} pm` : `${hour} am`}</span>{/each}</div>{#each model.days as day}<div class="day-column">{#each hours.slice(0, -1) as _, index}<i style={`top:${index * hourHeight}px`}></i>{/each}{#each model.events.filter(event => dayKey(event.startMilliseconds, model.timeZone) === day.key) as event (event.__local_name ?? event.index)}<article class="event" style={eventStyle(event, model)} title={`${event.title ?? 'Untitled event'} · ${formatTime(event.startMilliseconds, model.timeZone)} · ${formatDuration(event.durationSeconds)}`}><b>{event.title ?? 'Untitled event'}</b><small>{formatTime(event.startMilliseconds, model.timeZone)} · {formatDuration(event.durationSeconds)}</small>{#if event.location}<em>{event.location}</em>{/if}</article>{/each}</div>{/each}</div></div>
      <aside><div class="aside-heading"><h3>Upcoming</h3><span>{model.upcoming.length}</span></div>{#if model.upcoming.length}<ol>{#each model.upcoming as event (event.__local_name ?? event.index)}<li style={`--accent:${accents[event.accent] ?? accents.violet}`}><i></i><div><b>{event.title ?? 'Untitled event'}</b><small>{formatDay(event.startMilliseconds, model.timeZone)} · {formatTime(event.startMilliseconds, model.timeZone)} · {formatDuration(event.durationSeconds)}</small>{#if event.location}<em>{event.location}</em>{/if}</div></li>{/each}</ol>{:else}<p class="empty">No events after the reference time.</p>{/if}</aside>
    </div>
    <footer><code>ET.CalendarEvent · start: Time · duration: seconds</code><span>weekly view</span></footer>
  </section>
{:else}<p class="error">Calendar requires an <code>ET.Calendar</code> data value.</p>{/if}

<style>
  :global(html), :global(body) { overflow: hidden; padding: 0 !important; } .calendar { color: #e4e4e7; font-family: Inter, ui-sans-serif, system-ui, sans-serif; margin: 0; max-width: 820px; } .calendar.full-width { margin-left: auto; margin-right: auto; max-width: 1200px; } header { align-items: flex-start; display: flex; justify-content: space-between; margin-bottom: 16px; padding: 0 2px; } h2 { font-size: 18px; font-weight: 600; letter-spacing: -0.02em; margin: 0; } header p { color: #8a8a94; font-size: 13px; margin: 5px 0 8px; } header strong { color: #a1a1aa; font-size: 12px; font-weight: 500; } .actions { align-items: center; color: #5c5c65; display: flex; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; gap: 9px; } button { background: transparent; border: 1px solid #27272a; border-radius: 6px; color: #71717a; cursor: pointer; display: grid; height: 30px; padding: 6px; place-items: center; width: 30px; } button:hover { color: #a1a1aa; } button svg { fill: none; height: 16px; stroke: currentColor; stroke-linecap: round; stroke-width: 1.5; width: 16px; } .calendar-body { display: grid; gap: 18px; grid-template-columns: minmax(0, 1fr) 220px; } .week-shell { border: 1px solid #1b1b1e; overflow: hidden; } .week-grid { display: grid; grid-template-columns: 52px repeat(7, minmax(74px, 1fr)); min-width: 620px; } .corner, .day-heading { border-bottom: 1px solid #1b1b1e; color: #71717a; font-size: 11px; height: 39px; padding: 13px 8px 0; } .corner { color: #52525b; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; text-align: right; } .day-heading { border-left: 1px solid #17171a; color: #a1a1aa; font-weight: 600; text-align: center; } .time-axis { height: 594px; position: relative; } .time-axis span { color: #52525b; font: 10px ui-monospace, SFMono-Regular, Menlo, monospace; position: absolute; right: 8px; } .day-column { background: #08080a; border-left: 1px solid #17171a; height: 594px; position: relative; } .day-column i { border-top: 1px solid #18181b; display: block; left: 0; position: absolute; right: 0; } .event { background: color-mix(in srgb, var(--accent) 18%, #0b0b0e); border-left: 2px solid var(--accent); box-sizing: border-box; cursor: default; min-height: 24px; overflow: hidden; padding: 5px 6px; position: absolute; } .event b { color: #e4e4e7; display: block; font-size: 11px; line-height: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .event small, .event em { color: #a1a1aa; display: block; font-size: 10px; line-height: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .event em { color: #71717a; font-style: normal; } aside { border-top: 1px solid #1b1b1e; } .aside-heading { align-items: center; border-bottom: 1px solid #1b1b1e; display: flex; justify-content: space-between; padding: 10px 0; } h3 { font-size: 12px; font-weight: 600; margin: 0; } .aside-heading span { color: #71717a; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; } ol { list-style: none; margin: 0; padding: 0; } li { border-bottom: 1px solid #18181b; display: flex; gap: 8px; padding: 11px 0; } li > i { background: var(--accent); border-radius: 99px; height: 7px; margin-top: 5px; width: 7px; } li div { min-width: 0; } li b, li small, li em { display: block; } li b { color: #d4d4d8; font-size: 12px; font-weight: 500; } li small, li em, .empty { color: #71717a; font-size: 11px; line-height: 16px; } li em { color: #52525b; font-style: normal; } .empty { margin: 12px 0; } footer { border-top: 1px solid #1b1b1e; color: #5c5c65; display: flex; font-size: 11px; justify-content: space-between; margin-top: 14px; padding: 9px 2px; } code { color: #71717a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; } .error { color: #fda4af; } @media (max-width: 940px) { .calendar-body { grid-template-columns: 1fr; } aside { display: grid; grid-template-columns: 130px 1fr; gap: 14px; padding: 10px 0; } .aside-heading { border: 0; padding: 0; } ol { display: grid; gap: 0 14px; grid-template-columns: repeat(2, minmax(0, 1fr)); } li { padding: 5px 0; } } @media (max-width: 620px) { .week-shell { overflow-x: auto; } aside { display: block; } .aside-heading { border-bottom: 1px solid #1b1b1e; padding: 0 0 10px; } ol { display: block; } }
</style>
