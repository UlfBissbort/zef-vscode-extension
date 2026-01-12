# Dark Component Library IV ✦

**Data & Visualization** — Clarity. Insight. Beauty.

---

## Introduction

This fourth collection focuses on data-rich interfaces. Charts, metrics, and complex information displays that remain clear and beautiful. When data becomes art.

---

## Component Collection

Eight data-focused components for analytics, dashboards, and information-dense interfaces.

---

### 1. Sparkline Chart

A compact inline chart with tooltip on hover:

```svelte
<script>
  let data = $state([23, 45, 32, 67, 54, 78, 62, 89, 73, 95, 84, 102]);
  let hoveredIndex = $state(null);
  let tooltipPosition = $state({ x: 0, y: 0 });
  
  let max = $derived(Math.max(...data));
  let min = $derived(Math.min(...data));
  let range = $derived(max - min);
  
  let points = $derived(
    data.map((v, i) => ({
      x: (i / (data.length - 1)) * 100,
      y: 100 - ((v - min) / range) * 100,
      value: v
    }))
  );
  
  let pathD = $derived(
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  );
  
  let areaD = $derived(
    `${pathD} L 100 100 L 0 100 Z`
  );
  
  function handleHover(e, index) {
    hoveredIndex = index;
    const rect = e.target.ownerSVGElement.getBoundingClientRect();
    tooltipPosition = {
      x: e.clientX - rect.left,
      y: points[index].y
    };
  }
</script>

<div class="sparkline-container">
  <div class="sparkline-header">
    <span class="sparkline-label">Revenue</span>
    <span class="sparkline-value">${data[data.length - 1]}k</span>
  </div>
  
  <div class="sparkline-wrapper">
    <svg 
      viewBox="0 0 100 100" 
      preserveAspectRatio="none" 
      class="sparkline-svg"
      onmouseleave={() => hoveredIndex = null}
    >
      <defs>
        <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
        </linearGradient>
      </defs>
      
      <path class="area" d={areaD} fill="url(#sparkGradient)" />
      <path class="line" d={pathD} />
      
      {#each points as point, i}
        <circle 
          cx={point.x} 
          cy={point.y} 
          r="8"
          class="hit-area"
          onmouseenter={(e) => handleHover(e, i)}
        />
      {/each}
      
      {#if hoveredIndex !== null}
        <circle 
          cx={points[hoveredIndex].x} 
          cy={points[hoveredIndex].y} 
          r="4"
          class="hover-dot"
        />
        <line 
          x1={points[hoveredIndex].x}
          y1={points[hoveredIndex].y}
          x2={points[hoveredIndex].x}
          y2="100"
          class="hover-line"
        />
      {/if}
    </svg>
    
    {#if hoveredIndex !== null}
      <div 
        class="tooltip"
        style="left: {tooltipPosition.x}px; top: {tooltipPosition.y - 10}px"
      >
        ${data[hoveredIndex]}k
      </div>
    {/if}
  </div>
  
  <div class="sparkline-footer">
    <span class="trend positive">↑ 12.5%</span>
    <span class="period">vs last month</span>
  </div>
</div>

<style>
  .sparkline-container {
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    padding: 20px;
    width: 280px;
  }
  
  .sparkline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .sparkline-label {
    font-size: 13px;
    color: #71717a;
  }
  
  .sparkline-value {
    font-size: 24px;
    font-weight: 500;
    color: #fafafa;
    font-family: 'SF Mono', monospace;
  }
  
  .sparkline-wrapper {
    position: relative;
    height: 80px;
    margin-bottom: 16px;
  }
  
  .sparkline-svg {
    width: 100%;
    height: 100%;
  }
  
  .line {
    fill: none;
    stroke: #3b82f6;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
  
  .area {
    opacity: 1;
  }
  
  .hit-area {
    fill: transparent;
    cursor: pointer;
  }
  
  .hover-dot {
    fill: #3b82f6;
    stroke: #09090b;
    stroke-width: 2;
  }
  
  .hover-line {
    stroke: #3b82f6;
    stroke-width: 1;
    stroke-dasharray: 3 3;
    opacity: 0.5;
  }
  
  .tooltip {
    position: absolute;
    transform: translate(-50%, -100%);
    background: #fafafa;
    color: #09090b;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'SF Mono', monospace;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .sparkline-footer {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .trend {
    font-size: 13px;
    font-weight: 600;
  }
  .trend.positive { color: #22c55e; }
  .trend.negative { color: #ef4444; }
  
  .period {
    font-size: 12px;
    color: #52525b;
  }
</style>
```

---

### 2. Donut Chart

An animated donut chart with legend:

```svelte
<script>
  let segments = $state([
    { label: "Desktop", value: 45, color: "#3b82f6" },
    { label: "Mobile", value: 32, color: "#8b5cf6" },
    { label: "Tablet", value: 18, color: "#06b6d4" },
    { label: "Other", value: 5, color: "#71717a" }
  ]);
  
  let hoveredSegment = $state(null);
  
  let total = $derived(segments.reduce((sum, s) => sum + s.value, 0));
  
  let paths = $derived(() => {
    let startAngle = -90;
    return segments.map(segment => {
      const angle = (segment.value / total) * 360;
      const endAngle = startAngle + angle;
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = 50 + 40 * Math.cos(startRad);
      const y1 = 50 + 40 * Math.sin(startRad);
      const x2 = 50 + 40 * Math.cos(endRad);
      const y2 = 50 + 40 * Math.sin(endRad);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
      
      startAngle = endAngle;
      
      return { ...segment, path, percentage: Math.round((segment.value / total) * 100) };
    });
  });
</script>

<div class="donut-container">
  <div class="donut-chart">
    <svg viewBox="0 0 100 100" class="donut-svg">
      {#each paths() as segment, i}
        <path 
          d={segment.path}
          fill={segment.color}
          class="donut-segment"
          class:hovered={hoveredSegment === i}
          onmouseenter={() => hoveredSegment = i}
          onmouseleave={() => hoveredSegment = null}
        />
      {/each}
      <circle cx="50" cy="50" r="28" class="donut-hole" />
    </svg>
    
    <div class="donut-center">
      {#if hoveredSegment !== null}
        <span class="center-value">{paths()[hoveredSegment].percentage}%</span>
        <span class="center-label">{paths()[hoveredSegment].label}</span>
      {:else}
        <span class="center-value">{total}</span>
        <span class="center-label">Total</span>
      {/if}
    </div>
  </div>
  
  <div class="donut-legend">
    {#each paths() as segment, i}
      <div 
        class="legend-item"
        class:active={hoveredSegment === i}
        onmouseenter={() => hoveredSegment = i}
        onmouseleave={() => hoveredSegment = null}
      >
        <span class="legend-dot" style="background: {segment.color}"></span>
        <span class="legend-label">{segment.label}</span>
        <span class="legend-value">{segment.percentage}%</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .donut-container {
    display: flex;
    gap: 32px;
    align-items: center;
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    padding: 28px;
  }
  
  .donut-chart {
    position: relative;
    width: 160px;
    height: 160px;
  }
  
  .donut-svg {
    width: 100%;
    height: 100%;
    transform: rotate(0deg);
  }
  
  .donut-segment {
    transition: all 0.2s;
    cursor: pointer;
    transform-origin: center;
  }
  
  .donut-segment:hover,
  .donut-segment.hovered {
    filter: brightness(1.2);
    transform: scale(1.02);
  }
  
  .donut-hole {
    fill: #09090b;
  }
  
  .donut-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .center-value {
    font-size: 28px;
    font-weight: 500;
    color: #fafafa;
  }
  
  .center-label {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #52525b;
  }
  
  .donut-legend {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s;
  }
  
  .legend-item:hover,
  .legend-item.active {
    background: rgba(255, 255, 255, 0.04);
  }
  
  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  
  .legend-label {
    flex: 1;
    font-size: 14px;
    color: #a1a1aa;
  }
  
  .legend-value {
    font-size: 14px;
    font-weight: 500;
    font-family: 'SF Mono', monospace;
    color: #fafafa;
  }
</style>
```

---

### 3. Metric Dashboard Row

A horizontal row of key metrics with mini visualizations:

```svelte
<script>
  let metrics = $state([
    { 
      label: "Active Users", 
      value: "12.4k", 
      change: "+8.2%", 
      positive: true,
      sparkline: [45, 52, 48, 61, 55, 72, 68, 85]
    },
    { 
      label: "Conversion", 
      value: "3.2%", 
      change: "-0.4%", 
      positive: false,
      sparkline: [65, 58, 62, 55, 48, 52, 45, 42]
    },
    { 
      label: "Revenue", 
      value: "$84.2k", 
      change: "+12.5%", 
      positive: true,
      sparkline: [30, 42, 38, 55, 48, 62, 75, 82]
    },
    { 
      label: "Avg. Session", 
      value: "4m 32s", 
      change: "+0.8%", 
      positive: true,
      sparkline: [50, 55, 48, 52, 58, 54, 60, 58]
    }
  ]);
  
  function miniSparkline(data) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    return data.map((v, i) => {
      const x = (i / (data.length - 1)) * 60;
      const y = 20 - ((v - min) / range) * 18;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }
</script>

<div class="metrics-row">
  {#each metrics as metric}
    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-label">{metric.label}</span>
        <svg viewBox="0 0 60 20" class="mini-spark">
          <path 
            d={miniSparkline(metric.sparkline)}
            fill="none"
            stroke={metric.positive ? "#22c55e" : "#ef4444"}
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <div class="metric-value">{metric.value}</div>
      <div class="metric-change" class:positive={metric.positive} class:negative={!metric.positive}>
        <span class="change-arrow">{metric.positive ? '↑' : '↓'}</span>
        {metric.change}
      </div>
    </div>
  {/each}
</div>

<style>
  .metrics-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  
  .metric-card {
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    padding: 20px;
    transition: border-color 0.2s;
  }
  
  .metric-card:hover {
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .metric-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  
  .metric-label {
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #52525b;
  }
  
  .mini-spark {
    width: 60px;
    height: 20px;
  }
  
  .metric-value {
    font-size: 28px;
    font-weight: 500;
    color: #fafafa;
    margin-bottom: 8px;
    font-family: 'SF Mono', monospace;
  }
  
  .metric-change {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 8px;
  }
  
  .metric-change.positive {
    color: #22c55e;
    background: rgba(34, 197, 94, 0.1);
  }
  
  .metric-change.negative {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }
  
  .change-arrow {
    font-size: 11px;
  }
</style>
```

---

### 4. Activity Feed

A chronological activity stream with avatars and timestamps:

```svelte
<script>
  let activities = $state([
    { 
      id: 1,
      user: "Alex Morgan",
      action: "created a new project",
      target: "Mobile App Redesign",
      time: "2 min ago",
      icon: "📁",
      color: "#3b82f6"
    },
    { 
      id: 2,
      user: "Sam Chen",
      action: "commented on",
      target: "Homepage wireframes",
      time: "15 min ago",
      icon: "💬",
      color: "#8b5cf6"
    },
    { 
      id: 3,
      user: "Jordan Lee",
      action: "completed task",
      target: "User research interviews",
      time: "1 hour ago",
      icon: "✓",
      color: "#22c55e"
    },
    { 
      id: 4,
      user: "Taylor Kim",
      action: "uploaded",
      target: "design_v2.fig",
      time: "2 hours ago",
      icon: "↑",
      color: "#f59e0b"
    }
  ]);
  
  function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('');
  }
</script>

<div class="activity-feed">
  <div class="feed-header">
    <h3>Recent Activity</h3>
    <button class="view-all">View all →</button>
  </div>
  
  <div class="feed-list">
    {#each activities as activity, i}
      <div class="activity-item" style="animation-delay: {i * 50}ms">
        <div class="activity-avatar" style="background: {activity.color}">
          {getInitials(activity.user)}
        </div>
        
        <div class="activity-content">
          <p class="activity-text">
            <strong>{activity.user}</strong>
            <span class="action">{activity.action}</span>
            <span class="target">{activity.target}</span>
          </p>
          <span class="activity-time">{activity.time}</span>
        </div>
        
        <div class="activity-icon">{activity.icon}</div>
      </div>
    {/each}
  </div>
</div>

<style>
  .activity-feed {
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    padding: 24px;
    max-width: 480px;
  }
  
  .feed-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .feed-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #fafafa;
  }
  
  .view-all {
    background: none;
    border: none;
    color: #3b82f6;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
  }
  .view-all:hover {
    color: #60a5fa;
  }
  
  .feed-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 14px;
    border-radius: 12px;
    transition: background 0.15s;
    animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) backwards;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .activity-item:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  
  .activity-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
  }
  
  .activity-content {
    flex: 1;
    min-width: 0;
  }
  
  .activity-text {
    margin: 0 0 4px;
    font-size: 14px;
    line-height: 1.4;
    color: #a1a1aa;
  }
  
  .activity-text strong {
    color: #fafafa;
    font-weight: 500;
  }
  
  .activity-text .target {
    color: #3b82f6;
  }
  
  .activity-time {
    font-size: 12px;
    color: #52525b;
  }
  
  .activity-icon {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 8px;
    font-size: 14px;
  }
</style>
```

---

### 5. Data Comparison Cards

Side-by-side metric comparison with visual difference:

```svelte
<script>
  let comparison = $state({
    title: "This Week vs Last Week",
    metrics: [
      { label: "Visitors", current: 12450, previous: 10200 },
      { label: "Page Views", current: 45800, previous: 52300 },
      { label: "Bounce Rate", current: 32.4, previous: 38.1, suffix: "%" },
      { label: "Avg. Duration", current: 185, previous: 162, format: "time" }
    ]
  });
  
  function formatValue(value, format, suffix = '') {
    if (format === 'time') {
      const min = Math.floor(value / 60);
      const sec = value % 60;
      return `${min}:${sec.toString().padStart(2, '0')}`;
    }
    return value.toLocaleString() + suffix;
  }
  
  function getChange(current, previous) {
    const diff = ((current - previous) / previous) * 100;
    return diff.toFixed(1);
  }
  
  function isPositive(current, previous, label) {
    if (label.includes('Bounce')) {
      return current < previous;
    }
    return current > previous;
  }
</script>

<div class="comparison-container">
  <h3 class="comparison-title">{comparison.title}</h3>
  
  <div class="comparison-grid">
    {#each comparison.metrics as metric}
      {@const change = getChange(metric.current, metric.previous)}
      {@const positive = isPositive(metric.current, metric.previous, metric.label)}
      <div class="comparison-card">
        <div class="card-label">{metric.label}</div>
        
        <div class="values-row">
          <div class="value-column current">
            <span class="value-label">Current</span>
            <span class="value-number">
              {formatValue(metric.current, metric.format, metric.suffix)}
            </span>
          </div>
          
          <div class="value-divider">
            <span class="change-badge" class:positive class:negative={!positive}>
              {positive ? '+' : ''}{change}%
            </span>
          </div>
          
          <div class="value-column previous">
            <span class="value-label">Previous</span>
            <span class="value-number">
              {formatValue(metric.previous, metric.format, metric.suffix)}
            </span>
          </div>
        </div>
        
        <div class="comparison-bar">
          <div 
            class="bar-current"
            style="width: {Math.min((metric.current / Math.max(metric.current, metric.previous)) * 100, 100)}%"
          ></div>
          <div 
            class="bar-previous"
            style="width: {Math.min((metric.previous / Math.max(metric.current, metric.previous)) * 100, 100)}%"
          ></div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .comparison-container {
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    padding: 28px;
  }
  
  .comparison-title {
    margin: 0 0 24px;
    font-size: 16px;
    font-weight: 600;
    color: #fafafa;
  }
  
  .comparison-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .comparison-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 14px;
    padding: 20px;
  }
  
  .card-label {
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #52525b;
    margin-bottom: 16px;
  }
  
  .values-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .value-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .value-column.previous {
    text-align: right;
  }
  
  .value-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #52525b;
  }
  
  .value-number {
    font-size: 20px;
    font-weight: 500;
    font-family: 'SF Mono', monospace;
    color: #fafafa;
  }
  
  .value-column.previous .value-number {
    color: #71717a;
  }
  
  .value-divider {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  
  .change-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 6px;
  }
  
  .change-badge.positive {
    color: #22c55e;
    background: rgba(34, 197, 94, 0.15);
  }
  
  .change-badge.negative {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.15);
  }
  
  .comparison-bar {
    position: relative;
    height: 8px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .bar-current, .bar-previous {
    position: absolute;
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .bar-current {
    background: #3b82f6;
    z-index: 1;
  }
  
  .bar-previous {
    background: #3f3f46;
  }
</style>
```

---

### 6. Keyboard Shortcut List

A reference panel for keyboard shortcuts:

```svelte
<script>
  let categories = $state([
    {
      name: "General",
      shortcuts: [
        { keys: ["⌘", "K"], action: "Open command palette" },
        { keys: ["⌘", "S"], action: "Save current file" },
        { keys: ["⌘", "⇧", "P"], action: "Show all commands" }
      ]
    },
    {
      name: "Navigation",
      shortcuts: [
        { keys: ["⌘", "P"], action: "Go to file" },
        { keys: ["⌘", "G"], action: "Go to line" },
        { keys: ["⌘", "⇧", "O"], action: "Go to symbol" }
      ]
    },
    {
      name: "Editing",
      shortcuts: [
        { keys: ["⌘", "D"], action: "Select next occurrence" },
        { keys: ["⌥", "↑"], action: "Move line up" },
        { keys: ["⌘", "⇧", "K"], action: "Delete line" }
      ]
    }
  ]);
</script>

<div class="shortcuts-panel">
  <div class="panel-header">
    <h3>Keyboard Shortcuts</h3>
    <span class="platform">macOS</span>
  </div>
  
  {#each categories as category}
    <div class="shortcut-category">
      <h4 class="category-name">{category.name}</h4>
      <div class="shortcut-list">
        {#each category.shortcuts as shortcut}
          <div class="shortcut-row">
            <span class="shortcut-action">{shortcut.action}</span>
            <div class="shortcut-keys">
              {#each shortcut.keys as key, i}
                <kbd class="key">{key}</kbd>
                {#if i < shortcut.keys.length - 1}
                  <span class="key-separator">+</span>
                {/if}
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .shortcuts-panel {
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    padding: 24px;
    max-width: 400px;
  }
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }
  
  .panel-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #fafafa;
  }
  
  .platform {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #52525b;
    padding: 4px 10px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 6px;
  }
  
  .shortcut-category {
    margin-bottom: 20px;
  }
  
  .shortcut-category:last-child {
    margin-bottom: 0;
  }
  
  .category-name {
    margin: 0 0 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #3b82f6;
  }
  
  .shortcut-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .shortcut-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 10px;
    transition: background 0.15s;
  }
  
  .shortcut-row:hover {
    background: rgba(255, 255, 255, 0.04);
  }
  
  .shortcut-action {
    font-size: 14px;
    color: #a1a1aa;
  }
  
  .shortcut-keys {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 26px;
    height: 26px;
    padding: 0 8px;
    background: #18181b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    font-family: system-ui;
    font-size: 12px;
    font-weight: 500;
    color: #fafafa;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.3);
  }
  
  .key-separator {
    font-size: 10px;
    color: #52525b;
  }
</style>
```

---

### 7. Pricing Toggle

A pricing section with monthly/yearly toggle:

```svelte
<script>
  let isYearly = $state(false);
  
  let plans = $state([
    { 
      name: "Starter",
      monthlyPrice: 9,
      yearlyPrice: 7,
      features: ["5 projects", "Basic analytics", "Email support"]
    },
    { 
      name: "Pro",
      monthlyPrice: 29,
      yearlyPrice: 24,
      popular: true,
      features: ["Unlimited projects", "Advanced analytics", "Priority support", "API access"]
    },
    { 
      name: "Enterprise",
      monthlyPrice: 99,
      yearlyPrice: 79,
      features: ["Everything in Pro", "Custom integrations", "Dedicated manager", "SLA guarantee"]
    }
  ]);
  
  function getPrice(plan) {
    return isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  }
  
  let savings = $derived(isYearly ? "Save 20%" : null);
</script>

<div class="pricing-container">
  <div class="billing-toggle">
    <span class="toggle-label" class:active={!isYearly}>Monthly</span>
    <button 
      class="toggle-switch"
      class:yearly={isYearly}
      onclick={() => isYearly = !isYearly}
      role="switch"
      aria-checked={isYearly}
    >
      <span class="toggle-thumb"></span>
    </button>
    <span class="toggle-label" class:active={isYearly}>
      Yearly
      {#if savings}
        <span class="savings-badge">{savings}</span>
      {/if}
    </span>
  </div>
  
  <div class="plans-grid">
    {#each plans as plan}
      <div class="plan-card" class:popular={plan.popular}>
        {#if plan.popular}
          <div class="popular-badge">Most Popular</div>
        {/if}
        
        <h3 class="plan-name">{plan.name}</h3>
        
        <div class="plan-price">
          <span class="currency">$</span>
          <span class="amount" class:animate={true}>{getPrice(plan)}</span>
          <span class="period">/mo</span>
        </div>
        
        <ul class="plan-features">
          {#each plan.features as feature}
            <li>
              <span class="check">✓</span>
              {feature}
            </li>
          {/each}
        </ul>
        
        <button class="plan-cta" class:primary={plan.popular}>
          Get Started
        </button>
      </div>
    {/each}
  </div>
</div>

<style>
  .pricing-container {
    padding: 32px;
  }
  
  .billing-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    margin-bottom: 40px;
  }
  
  .toggle-label {
    font-size: 14px;
    font-weight: 500;
    color: #52525b;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: color 0.2s;
  }
  
  .toggle-label.active {
    color: #fafafa;
  }
  
  .savings-badge {
    font-size: 11px;
    font-weight: 600;
    color: #22c55e;
    background: rgba(34, 197, 94, 0.15);
    padding: 4px 8px;
    border-radius: 6px;
  }
  
  .toggle-switch {
    position: relative;
    width: 52px;
    height: 28px;
    background: rgba(255, 255, 255, 0.08);
    border: none;
    border-radius: 14px;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .toggle-switch.yearly {
    background: #3b82f6;
  }
  
  .toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    background: #fafafa;
    border-radius: 50%;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .toggle-switch.yearly .toggle-thumb {
    transform: translateX(24px);
  }
  
  .plans-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 900px;
    margin: 0 auto;
  }
  
  .plan-card {
    position: relative;
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    padding: 32px 28px;
    transition: all 0.2s;
  }
  
  .plan-card:hover {
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .plan-card.popular {
    border-color: #3b82f6;
    box-shadow: 0 0 40px rgba(59, 130, 246, 0.15);
  }
  
  .popular-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: #3b82f6;
    color: white;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 6px 14px;
    border-radius: 20px;
  }
  
  .plan-name {
    margin: 0 0 20px;
    font-size: 18px;
    font-weight: 600;
    color: #fafafa;
  }
  
  .plan-price {
    display: flex;
    align-items: baseline;
    gap: 2px;
    margin-bottom: 28px;
  }
  
  .currency {
    font-size: 20px;
    font-weight: 500;
    color: #52525b;
  }
  
  .amount {
    font-size: 48px;
    font-weight: 200;
    color: #fafafa;
    transition: all 0.3s;
  }
  
  .period {
    font-size: 14px;
    color: #52525b;
  }
  
  .plan-features {
    list-style: none;
    margin: 0 0 28px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .plan-features li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #a1a1aa;
  }
  
  .check {
    color: #22c55e;
    font-weight: 600;
  }
  
  .plan-cta {
    width: 100%;
    padding: 14px 24px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #fafafa;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .plan-cta:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  
  .plan-cta.primary {
    background: #3b82f6;
    border-color: #3b82f6;
  }
  
  .plan-cta.primary:hover {
    background: #2563eb;
  }
</style>
```

---

### 8. Status Indicator

A system status display with real-time updates:

```svelte
<script>
  let services = $state([
    { name: "API Gateway", status: "operational", latency: 42 },
    { name: "Database", status: "operational", latency: 12 },
    { name: "Authentication", status: "degraded", latency: 156 },
    { name: "File Storage", status: "operational", latency: 28 },
    { name: "CDN", status: "operational", latency: 8 }
  ]);
  
  let overallStatus = $derived(() => {
    if (services.some(s => s.status === 'outage')) return 'outage';
    if (services.some(s => s.status === 'degraded')) return 'degraded';
    return 'operational';
  });
  
  let statusConfig = {
    operational: { label: "All Systems Operational", color: "#22c55e", icon: "●" },
    degraded: { label: "Partial System Degradation", color: "#f59e0b", icon: "◐" },
    outage: { label: "Major Outage", color: "#ef4444", icon: "○" }
  };
  
  let currentTime = $state(new Date().toLocaleTimeString());
  
  $effect(() => {
    const interval = setInterval(() => {
      currentTime = new Date().toLocaleTimeString();
    }, 1000);
    return () => clearInterval(interval);
  });
</script>

<div class="status-panel">
  <div class="status-header" style="border-color: {statusConfig[overallStatus()].color}">
    <div class="overall-status">
      <span class="status-icon" style="color: {statusConfig[overallStatus()].color}">
        {statusConfig[overallStatus()].icon}
      </span>
      <span class="status-text">{statusConfig[overallStatus()].label}</span>
    </div>
    <span class="last-updated">Last checked: {currentTime}</span>
  </div>
  
  <div class="services-list">
    {#each services as service}
      <div class="service-row">
        <div class="service-info">
          <span class="service-indicator" style="background: {statusConfig[service.status].color}"></span>
          <span class="service-name">{service.name}</span>
        </div>
        <div class="service-metrics">
          <span class="service-latency">{service.latency}ms</span>
          <span class="service-status">{service.status}</span>
        </div>
      </div>
    {/each}
  </div>
  
  <div class="uptime-bar">
    <div class="uptime-label">
      <span>90-day uptime</span>
      <span class="uptime-value">99.98%</span>
    </div>
    <div class="uptime-track">
      {#each Array(90) as _, i}
        <div 
          class="uptime-day"
          class:full={Math.random() > 0.02}
          class:partial={Math.random() > 0.98}
          title="Day {90 - i}"
        ></div>
      {/each}
    </div>
  </div>
</div>

<style>
  .status-panel {
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    overflow: hidden;
    max-width: 500px;
  }
  
  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 2px solid;
  }
  
  .overall-status {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .status-icon {
    font-size: 16px;
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .status-text {
    font-size: 15px;
    font-weight: 600;
    color: #fafafa;
  }
  
  .last-updated {
    font-size: 12px;
    color: #52525b;
    font-family: 'SF Mono', monospace;
  }
  
  .services-list {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .service-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    border-radius: 12px;
    transition: background 0.15s;
  }
  
  .service-row:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  
  .service-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .service-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  .service-name {
    font-size: 14px;
    color: #fafafa;
  }
  
  .service-metrics {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .service-latency {
    font-size: 13px;
    font-family: 'SF Mono', monospace;
    color: #71717a;
    min-width: 50px;
    text-align: right;
  }
  
  .service-status {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #52525b;
    min-width: 80px;
    text-align: right;
  }
  
  .uptime-bar {
    padding: 20px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }
  
  .uptime-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 12px;
    color: #52525b;
  }
  
  .uptime-value {
    font-weight: 600;
    color: #22c55e;
  }
  
  .uptime-track {
    display: flex;
    gap: 2px;
  }
  
  .uptime-day {
    flex: 1;
    height: 24px;
    background: #22c55e;
    border-radius: 2px;
    opacity: 0.8;
    transition: opacity 0.15s;
  }
  
  .uptime-day:hover {
    opacity: 1;
  }
  
  .uptime-day.partial {
    background: #f59e0b;
  }
  
  .uptime-day:not(.full):not(.partial) {
    background: #ef4444;
  }
</style>
```

---

## Data Visualization Best Practices

### Color Usage
- Use consistent semantic colors (green=positive, red=negative)
- Limit palette to 5-7 distinct colors per chart
- Ensure sufficient contrast for accessibility

### Typography
- Large numbers: Light weight (200-300) for elegance
- Labels: Small, uppercase, muted for hierarchy
- Values: Monospace for alignment

### Interactivity
- Hover states reveal additional context
- Tooltips appear quickly (100-150ms delay)
- Smooth transitions between data states

---

> *"The purpose of visualization is insight, not pictures."* — Ben Shneiderman

---

*Built with Zef ✦*
