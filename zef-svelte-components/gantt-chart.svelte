<!-- +++
this = "ET.SvelteComponent('🍃-f47a9d0c63be2185a704')"
tag_ = []
dispatched_on = "ET.GanttChart"
created = "Time('2026-08-15 16:10:00 +0800')"
[ns]
"ET.GanttChart" = "ET('47616e74744368617274')"
+++ -->

<script>
  /** A data-in, DOM-out renderer for an ET.GanttChart value. */
  export let data;

  let hovered = null;

  const dayMilliseconds = 86_400_000;
  const dayWidth = 40;
  const labelWidth = 190;
  const accentColors = {
    violet: '#ad6cff',
    blue: '#5e83ef',
    emerald: '#3ec189',
    amber: '#ff9f43'
  };
  const fallbackAccents = ['violet', 'blue', 'emerald', 'amber'];

  function parseDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function addDays(date, days) {
    return new Date(date.getTime() + days * dayMilliseconds);
  }

  function dayDifference(left, right) {
    return Math.round((right.getTime() - left.getTime()) / dayMilliseconds);
  }

  function phasesFor(chart) {
    return (chart?.content_ ?? []).filter(phase => phase?.__type === 'ET.ProjectPhase');
  }

  function rowsFor(chart) {
    return phasesFor(chart).flatMap((phase, phaseIndex) =>
      (phase.content_ ?? [])
        .filter(task => task?.__type === 'ET.GanttTask')
        .map((task, taskIndex) => ({
          phase,
          phaseIndex,
          task,
          firstInPhase: taskIndex === 0,
          startDate: parseDate(task.start),
          endDate: parseDate(task.end)
        }))
        .filter(row => row.startDate && row.endDate && row.endDate >= row.startDate)
    );
  }

  function boundsFor(chart, rows) {
    const explicitStart = parseDate(chart?.range?.start);
    const explicitEnd = parseDate(chart?.range?.end);
    const starts = rows.map(row => row.startDate.getTime());
    const ends = rows.map(row => row.endDate.getTime());
    const first = explicitStart ?? (starts.length ? new Date(Math.min(...starts)) : new Date());
    const last = explicitEnd ?? (ends.length ? new Date(Math.max(...ends)) : addDays(first, 14));
    return { start: first, end: last >= first ? last : first };
  }

  function daysFor(bounds) {
    return Array.from({ length: dayDifference(bounds.start, bounds.end) + 1 }, (_, index) => addDays(bounds.start, index));
  }

  function accentFor(row) {
    return accentColors[row.phase.accent] ?? row.phase.accent ?? accentColors[fallbackAccents[row.phaseIndex % fallbackAccents.length]];
  }

  function clampedProgress(task) {
    return typeof task.progress === 'number' ? Math.max(0, Math.min(1, task.progress)) : null;
  }

  function dateLabel(date) {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
  }

  function tickLabel(date, index) {
    if (date.getUTCDate() === 1 || index === 0) return dateLabel(date);
    return String(date.getUTCDate());
  }

  function durationLabel(row) {
    const days = dayDifference(row.startDate, row.endDate) + 1;
    return `${days} day${days === 1 ? '' : 's'}`;
  }

  function showTooltip(event, row) {
    const surface = event.currentTarget.closest('.schedule-shell');
    const surfaceRect = surface.getBoundingClientRect();
    const barRect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(surfaceRect.width - 250, Math.max(12, barRect.left - surfaceRect.left + barRect.width / 2 - 120));
    const above = barRect.top - surfaceRect.top > 190;
    hovered = {
      row,
      x,
      y: above ? barRect.top - surfaceRect.top - 12 : barRect.bottom - surfaceRect.top + 12,
      above
    };
  }

  function clearTooltip() {
    hovered = null;
  }

  function toggleFullWidth() {
    window.parent.postMessage({ type: 'zefEntityToggleFullWidth', entityType: 'ET.GanttChart' }, '*');
  }

  $: rows = rowsFor(data);
  $: bounds = boundsFor(data, rows);
  $: days = daysFor(bounds);
  $: timelineWidth = days.length * dayWidth;
  $: today = parseDate(data?.today);
  $: todayOffset = today && today >= bounds.start && today <= bounds.end ? dayDifference(bounds.start, today) * dayWidth + dayWidth / 2 : null;
</script>

{#if data?.__type === 'ET.GanttChart'}
  <figure class="gantt" aria-labelledby="gantt-title">
    <figcaption class="chart-header">
      <div>
        <p class="eyebrow">Project schedule</p>
        <h2 id="gantt-title">{data.title}</h2>
        {#if data.subtitle}<p class="subtitle">{data.subtitle}</p>{/if}
      </div>
      <button class="expand" type="button" title="Toggle full width" aria-label="Toggle full width" onclick={toggleFullWidth}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></svg>
      </button>
    </figcaption>

    <div class="schedule-shell">
      <div class="schedule-scroll">
        <div class="schedule" style={`--timeline-width: ${timelineWidth}px; --schedule-width: ${labelWidth + timelineWidth}px; height: ${40 + rows.length * 54}px;`}>
          <div class="corner">Task</div>
          <div class="timeline-header">
            {#each days as date, index (date.getTime())}
              <div class:today={today?.getTime() === date.getTime()} class="date-cell" style={`left: ${index * dayWidth}px; width: ${dayWidth}px;`}>
                {tickLabel(date, index)}
              </div>
            {/each}
          </div>

          {#each rows as row, rowIndex (row.task.id ?? `${row.phase.id}:${row.task.title}`)}
            <div class:first-in-phase={row.firstInPhase && rowIndex > 0} class="task-label" style={`top: ${40 + rowIndex * 54}px;`}>
              {#if row.firstInPhase}<span class="phase" style={`color: ${accentFor(row)}`}>{row.phase.title}</span>{/if}
              <span class="task-name">{row.task.title}</span>
            </div>
            <div class:first-in-phase={row.firstInPhase && rowIndex > 0} class="chart-row" style={`top: ${40 + rowIndex * 54}px;`}>
              <div class="day-grid" style={`background-size: ${dayWidth}px 100%;`}></div>
              <button
                class="task-bar"
                style={`left: ${dayDifference(bounds.start, row.startDate) * dayWidth + 4}px; width: ${Math.max(dayWidth - 8, (dayDifference(row.startDate, row.endDate) + 1) * dayWidth - 8)}px; background: ${accentFor(row)};`}
                type="button"
                aria-label={`${row.task.title}, ${dateLabel(row.startDate)} to ${dateLabel(row.endDate)}`}
                onmouseenter={(event) => showTooltip(event, row)}
                onfocus={(event) => showTooltip(event, row)}
                onmouseleave={clearTooltip}
                onblur={clearTooltip}
              >
                {#if clampedProgress(row.task) !== null}<span class="task-progress" style={`width: ${clampedProgress(row.task) * 100}%`}></span>{/if}
                <span class="bar-label">{row.task.title}</span>
                {#if clampedProgress(row.task) !== null}<span class="bar-progress">{Math.round(clampedProgress(row.task) * 100)}%</span>{/if}
              </button>
            </div>
          {/each}

          {#if todayOffset !== null}
            <div class="today-line" style={`left: ${labelWidth + todayOffset}px; height: ${rows.length * 54}px;`}></div>
          {/if}
        </div>
      </div>

      {#if hovered}
        {@const row = hovered.row}
        <aside class:above={hovered.above} class="tooltip" style={`left: ${hovered.x}px; top: ${hovered.y}px;`} role="status">
          <span class="tooltip-phase" style={`color: ${accentFor(row)}`}>{row.phase.title}</span>
          <strong>{row.task.title}</strong>
          <div class="tooltip-dates"><span>{dateLabel(row.startDate)} – {dateLabel(row.endDate)}</span><i>{durationLabel(row)}</i></div>
          {#if row.task.description}<p>{row.task.description}</p>{/if}
          {#if clampedProgress(row.task) !== null}
            <div class="tooltip-progress"><span>Completion</span><b>{Math.round(clampedProgress(row.task) * 100)}%</b></div>
            <div class="progress-track"><i style={`width: ${clampedProgress(row.task) * 100}%; background: ${accentFor(row)}`}></i></div>
          {/if}
        </aside>
      {/if}
    </div>

    <footer><span>{dateLabel(bounds.start)} – {dateLabel(bounds.end)}</span><span>{rows.length} tasks</span></footer>
  </figure>
{:else}
  <p class="error">GanttChart requires an <code>ET.GanttChart</code> data value.</p>
{/if}

<style>
  .gantt { color: #e4e4e7; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; max-width: none; }
  .chart-header { align-items: flex-start; display: flex; justify-content: space-between; margin-bottom: 16px; }
  .eyebrow { color: #71717a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; letter-spacing: 0.12em; margin: 0 0 4px; text-transform: uppercase; }
  h2 { color: #e4e4e7; font-size: 18px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.25; margin: 0; }
  .subtitle { color: #8a8a94; font-size: 13px; line-height: 1.5; margin: 7px 0 0; }
  .expand { background: transparent; border: 1px solid #27272a; border-radius: 6px; color: #71717a; cursor: pointer; display: grid; height: 30px; padding: 6px; place-items: center; width: 30px; }
  .expand:hover { border-color: #3f3f46; color: #a1a1aa; } .expand svg { fill: none; height: 16px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; width: 16px; }
  .schedule-shell { border-bottom: 1px solid #222; border-top: 1px solid #222; position: relative; }
  .schedule-scroll { overflow-x: auto; overflow-y: hidden; scrollbar-color: #3f3f46 transparent; scrollbar-width: thin; }
  .schedule-scroll::-webkit-scrollbar { height: 7px; } .schedule-scroll::-webkit-scrollbar-track { background: transparent; } .schedule-scroll::-webkit-scrollbar-thumb { background: #3f3f46; border: 2px solid transparent; background-clip: padding-box; border-radius: 999px; } .schedule-scroll::-webkit-scrollbar-thumb:hover { background-color: #52525b; }
  .schedule { min-height: 40px; position: relative; width: var(--schedule-width); }
  .corner { align-items: flex-end; background: #0a0a0a; border-bottom: 1px solid #222; border-right: 1px solid #222; color: #5c5c65; display: flex; font: 10px ui-monospace, SFMono-Regular, Menlo, monospace; height: 40px; left: 0; letter-spacing: 0.1em; padding: 0 14px 10px; position: sticky; text-transform: uppercase; top: 0; width: 190px; z-index: 5; }
  .timeline-header { border-bottom: 1px solid #222; height: 40px; left: 190px; position: absolute; top: 0; width: var(--timeline-width); }
  .date-cell { align-items: flex-end; border-right: 1px solid #1c1c1f; color: #5c5c65; display: flex; font: 10px ui-monospace, SFMono-Regular, Menlo, monospace; height: 40px; justify-content: center; padding-bottom: 10px; position: absolute; white-space: nowrap; }
  .date-cell.today { color: #ad6cff; font-weight: 600; }
  .task-label { align-items: center; background: #0a0a0a; border-bottom: 1px solid #222; border-right: 1px solid #222; display: flex; flex-direction: column; height: 54px; justify-content: center; left: 0; padding: 0 14px; position: sticky; width: 190px; z-index: 4; }
  .task-label.first-in-phase, .chart-row.first-in-phase { border-top: 1px solid #323238; }
  .phase { align-self: stretch; font: 9px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.09em; margin-bottom: 3px; opacity: 0.8; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
  .task-name { align-self: stretch; color: #a1a1aa; font-size: 12px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .chart-row { border-bottom: 1px solid #222; height: 54px; left: 190px; position: absolute; width: var(--timeline-width); }
  .day-grid { background-image: linear-gradient(90deg, transparent calc(100% - 1px), #1c1c1f calc(100% - 1px)); inset: 0; position: absolute; }
  .task-bar { border: 0; border-radius: 6px; color: #fff; cursor: crosshair; display: flex; height: 24px; overflow: hidden; padding: 0 8px; position: absolute; top: 15px; transition: filter 160ms ease, transform 160ms ease; }
  .task-bar:hover, .task-bar:focus-visible { filter: brightness(1.08); outline: none; transform: scale(1.01); z-index: 3; }
  .task-progress { background: rgb(255 255 255 / 0.2); border-radius: 6px; inset: 0 auto 0 0; position: absolute; }
  .bar-label, .bar-progress { align-items: center; display: flex; font-size: 10px; font-weight: 600; min-width: 0; position: relative; text-shadow: 0 1px 2px rgb(0 0 0 / 0.25); z-index: 1; }
  .bar-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .bar-progress { margin-left: auto; padding-left: 8px; }
  .today-line { background: #ad6cff; pointer-events: none; position: absolute; top: 40px; width: 1px; z-index: 3; }
  .tooltip { background: rgb(24 24 27 / 0.94); border: 1px solid #3f3f46; border-radius: 10px; box-shadow: 0 12px 32px rgb(0 0 0 / 0.42); box-sizing: border-box; padding: 13px; pointer-events: none; position: absolute; transform-origin: top center; width: 240px; z-index: 10; }
  .tooltip.above { transform: translateY(-100%); transform-origin: bottom center; }
  .tooltip-phase { display: block; font: 9px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.1em; margin-bottom: 4px; text-transform: uppercase; }
  .tooltip strong { color: #e4e4e7; display: block; font-size: 13px; font-weight: 600; }
  .tooltip-dates { align-items: center; color: #8a8a94; display: flex; font-size: 10px; gap: 7px; margin-top: 7px; } .tooltip-dates i { background: rgb(255 255 255 / 0.06); border-radius: 4px; font-style: normal; padding: 2px 5px; }
  .tooltip p { color: #a1a1aa; font-size: 11px; line-height: 1.5; margin: 10px 0; }
  .tooltip-progress { color: #71717a; display: flex; font: 9px ui-monospace, SFMono-Regular, Menlo, monospace; justify-content: space-between; letter-spacing: 0.08em; margin-top: 10px; text-transform: uppercase; } .tooltip-progress b { color: #c3c3ca; font-weight: 600; }
  .progress-track { background: rgb(255 255 255 / 0.07); border-radius: 99px; height: 4px; margin-top: 6px; overflow: hidden; } .progress-track i { border-radius: inherit; display: block; height: 100%; }
  footer { color: #5c5c65; display: flex; font: 10px ui-monospace, SFMono-Regular, Menlo, monospace; gap: 16px; justify-content: space-between; padding-top: 10px; }
  .error { color: #fda4af; font-family: system-ui, sans-serif; }
</style>
