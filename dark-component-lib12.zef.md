# Dark Component Library XII ◈

**Dashboard & Analytics** — Monitor. Analyze. Decide.

---

## Introduction

Dashboards transform data into decisions. This collection explores components that surface insights at a glance—from metrics cards to interactive charts. Every element serves clarity, enabling users to understand complex information through elegant visualization.

---

## Component Collection

Six dashboard and analytics components for data-driven interfaces.

---

### 1. Metric Card Grid

A grid of key metrics with sparklines and trends:

```svelte
<script>
  let metrics = $state([
    {
      id: 1,
      label: 'Total Revenue',
      value: '$48,352',
      change: 12.5,
      trend: 'up',
      sparkline: [30, 45, 35, 50, 42, 55, 48, 60, 52, 65, 58, 72]
    },
    {
      id: 2,
      label: 'Active Users',
      value: '8,429',
      change: 8.2,
      trend: 'up',
      sparkline: [20, 25, 22, 30, 35, 32, 40, 38, 45, 42, 50, 48]
    },
    {
      id: 3,
      label: 'Conversion Rate',
      value: '3.24%',
      change: -2.1,
      trend: 'down',
      sparkline: [45, 42, 48, 40, 38, 42, 35, 38, 32, 35, 30, 28]
    },
    {
      id: 4,
      label: 'Avg Session',
      value: '4m 32s',
      change: 5.8,
      trend: 'up',
      sparkline: [35, 38, 40, 42, 45, 48, 50, 52, 55, 58, 60, 62]
    }
  ]);
  
  function getSparklinePath(data) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 100;
    const height = 32;
    
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    });
    
    return `M${points.join(' L')}`;
  }
</script>

<div class="metrics-grid">
  {#each metrics as metric}
    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-label">{metric.label}</span>
        <span class="trend-badge" class:up={metric.trend === 'up'} class:down={metric.trend === 'down'}>
          {metric.trend === 'up' ? '↑' : '↓'} {Math.abs(metric.change)}%
        </span>
      </div>
      
      <div class="metric-value">{metric.value}</div>
      
      <div class="sparkline-container">
        <svg viewBox="0 0 100 32" preserveAspectRatio="none">
          <defs>
            <linearGradient id="sparkGrad-{metric.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color={metric.trend === 'up' ? '#22c55e' : '#ef4444'} stop-opacity="0.3"/>
              <stop offset="100%" stop-color={metric.trend === 'up' ? '#22c55e' : '#ef4444'} stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path 
            d="{getSparklinePath(metric.sparkline)} L100,32 L0,32 Z" 
            fill="url(#sparkGrad-{metric.id})"
          />
          <path 
            d={getSparklinePath(metric.sparkline)} 
            fill="none" 
            stroke={metric.trend === 'up' ? '#22c55e' : '#ef4444'}
            stroke-width="2"
          />
        </svg>
      </div>
    </div>
  {/each}
</div>

<style>
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    max-width: 560px;
  }
  
  .metric-card {
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 20px;
    transition: border-color 0.2s ease;
  }
  
  .metric-card:hover {
    border-color: rgba(255,255,255,0.12);
  }
  
  .metric-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .metric-label {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  
  .trend-badge {
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 600;
  }
  
  .trend-badge.up {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }
  
  .trend-badge.down {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }
  
  .metric-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 16px;
  }
  
  .sparkline-container {
    height: 32px;
  }
  
  .sparkline-container svg {
    width: 100%;
    height: 100%;
  }
</style>
```

---

### 2. Area Chart

An interactive area chart with hover tooltips:

```svelte
<script>
  let data = $state([
    { label: 'Jan', value: 4200, previous: 3800 },
    { label: 'Feb', value: 5100, previous: 4200 },
    { label: 'Mar', value: 4800, previous: 4500 },
    { label: 'Apr', value: 6200, previous: 5100 },
    { label: 'May', value: 7100, previous: 5800 },
    { label: 'Jun', value: 6800, previous: 6200 },
    { label: 'Jul', value: 8200, previous: 7100 }
  ]);
  
  let hoveredIndex = $state(null);
  
  const maxValue = Math.max(...data.flatMap(d => [d.value, d.previous]));
  const chartHeight = 180;
  const chartWidth = 420;
  
  function getY(value) {
    return chartHeight - (value / maxValue) * chartHeight;
  }
  
  function getPath(key) {
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * chartWidth;
      const y = getY(d[key]);
      return `${x},${y}`;
    });
    return `M${points.join(' L')}`;
  }
  
  function getAreaPath(key) {
    const linePath = getPath(key);
    return `${linePath} L${chartWidth},${chartHeight} L0,${chartHeight} Z`;
  }
</script>

<div class="chart-container">
  <div class="chart-header">
    <h3 class="chart-title">Revenue Overview</h3>
    <div class="chart-legend">
      <span class="legend-item current">
        <span class="legend-dot"></span>
        This Period
      </span>
      <span class="legend-item previous">
        <span class="legend-dot"></span>
        Previous
      </span>
    </div>
  </div>
  
  <div class="chart-wrapper">
    <svg viewBox="0 0 {chartWidth} {chartHeight + 30}" class="chart-svg">
      <defs>
        <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
        </linearGradient>
      </defs>
      
      <!-- Grid lines -->
      {#each [0, 0.25, 0.5, 0.75, 1] as tick}
        <line 
          x1="0" 
          y1={tick * chartHeight} 
          x2={chartWidth} 
          y2={tick * chartHeight}
          stroke="rgba(255,255,255,0.04)"
          stroke-dasharray="4,4"
        />
      {/each}
      
      <!-- Previous period area -->
      <path d={getAreaPath('previous')} fill="url(#prevGrad)" />
      <path d={getPath('previous')} fill="none" stroke="#8b5cf6" stroke-width="2" opacity="0.5" />
      
      <!-- Current period area -->
      <path d={getAreaPath('value')} fill="url(#currentGrad)" />
      <path d={getPath('value')} fill="none" stroke="#6366f1" stroke-width="2.5" />
      
      <!-- Data points -->
      {#each data as point, i}
        {@const x = (i / (data.length - 1)) * chartWidth}
        {@const y = getY(point.value)}
        
        <g 
          class="data-point-group"
          onmouseenter={() => hoveredIndex = i}
          onmouseleave={() => hoveredIndex = null}
        >
          <rect 
            x={x - 25} 
            y="0" 
            width="50" 
            height={chartHeight} 
            fill="transparent"
          />
          
          {#if hoveredIndex === i}
            <line 
              x1={x} 
              y1="0" 
              x2={x} 
              y2={chartHeight}
              stroke="rgba(255,255,255,0.1)"
              stroke-width="1"
            />
          {/if}
          
          <circle 
            cx={x} 
            cy={y}
            r={hoveredIndex === i ? 6 : 4}
            fill="#0c0c0e"
            stroke="#6366f1"
            stroke-width="2"
          />
        </g>
        
        <text 
          x={x} 
          y={chartHeight + 20}
          text-anchor="middle"
          fill="rgba(255,255,255,0.4)"
          font-size="11"
        >{point.label}</text>
      {/each}
    </svg>
    
    {#if hoveredIndex !== null}
      {@const point = data[hoveredIndex]}
      {@const x = (hoveredIndex / (data.length - 1)) * chartWidth}
      <div 
        class="tooltip"
        style="left: {x}px; top: {getY(point.value) - 10}px"
      >
        <span class="tooltip-value">${point.value.toLocaleString()}</span>
        <span class="tooltip-change">
          vs ${point.previous.toLocaleString()} ({Math.round((point.value - point.previous) / point.previous * 100)}%)
        </span>
      </div>
    {/if}
  </div>
</div>

<style>
  .chart-container {
    max-width: 480px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    padding: 24px;
  }
  
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .chart-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .chart-legend {
    display: flex;
    gap: 16px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.5);
  }
  
  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  .legend-item.current .legend-dot {
    background: #6366f1;
  }
  
  .legend-item.previous .legend-dot {
    background: #8b5cf6;
    opacity: 0.5;
  }
  
  .chart-wrapper {
    position: relative;
  }
  
  .chart-svg {
    width: 100%;
    height: auto;
  }
  
  .data-point-group {
    cursor: pointer;
  }
  
  .tooltip {
    position: absolute;
    transform: translate(-50%, -100%);
    padding: 8px 12px;
    background: #1a1a1d;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    pointer-events: none;
    white-space: nowrap;
  }
  
  .tooltip-value {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
  }
  
  .tooltip-change {
    display: block;
    font-size: 0.7rem;
    color: #22c55e;
  }
</style>
```

---

### 3. Progress Ring

A circular progress indicator with animated fill:

```svelte
<script>
  let goals = $state([
    { label: 'Sales Target', value: 78, max: 100, color: '#6366f1' },
    { label: 'New Customers', value: 142, max: 200, color: '#22c55e' },
    { label: 'Tasks Done', value: 45, max: 50, color: '#f59e0b' }
  ]);
  
  function getCircumference(radius) {
    return 2 * Math.PI * radius;
  }
  
  function getDashOffset(value, max, radius) {
    const circumference = getCircumference(radius);
    const progress = value / max;
    return circumference * (1 - progress);
  }
</script>

<div class="progress-rings">
  {#each goals as goal}
    {@const radius = 44}
    {@const circumference = getCircumference(radius)}
    {@const percentage = Math.round((goal.value / goal.max) * 100)}
    
    <div class="ring-card">
      <div class="ring-container">
        <svg viewBox="0 0 100 100">
          <!-- Background ring -->
          <circle 
            cx="50" 
            cy="50" 
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            stroke-width="8"
          />
          
          <!-- Progress ring -->
          <circle 
            cx="50" 
            cy="50" 
            r={radius}
            fill="none"
            stroke={goal.color}
            stroke-width="8"
            stroke-linecap="round"
            stroke-dasharray={circumference}
            stroke-dashoffset={getDashOffset(goal.value, goal.max, radius)}
            transform="rotate(-90 50 50)"
            style="transition: stroke-dashoffset 1s ease"
          />
        </svg>
        
        <div class="ring-content">
          <span class="ring-percentage">{percentage}%</span>
        </div>
      </div>
      
      <div class="ring-info">
        <span class="ring-label">{goal.label}</span>
        <span class="ring-values">{goal.value} / {goal.max}</span>
      </div>
    </div>
  {/each}
</div>

<style>
  .progress-rings {
    display: flex;
    gap: 20px;
    max-width: 560px;
  }
  
  .ring-card {
    flex: 1;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .ring-container {
    position: relative;
    width: 100px;
    height: 100px;
    margin-bottom: 16px;
  }
  
  .ring-container svg {
    width: 100%;
    height: 100%;
  }
  
  .ring-content {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .ring-percentage {
    font-size: 1.25rem;
    font-weight: 700;
    color: #fff;
  }
  
  .ring-info {
    text-align: center;
  }
  
  .ring-label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 4px;
  }
  
  .ring-values {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.45);
  }
</style>
```

---

### 4. Data Table

A sortable data table with row actions:

```svelte
<script>
  let users = $state([
    { id: 1, name: 'Emma Wilson', email: 'emma@example.com', role: 'Admin', status: 'active', lastActive: '2 min ago' },
    { id: 2, name: 'James Chen', email: 'james@example.com', role: 'Editor', status: 'active', lastActive: '15 min ago' },
    { id: 3, name: 'Sofia Garcia', email: 'sofia@example.com', role: 'Viewer', status: 'inactive', lastActive: '2 days ago' },
    { id: 4, name: 'Lucas Kim', email: 'lucas@example.com', role: 'Editor', status: 'active', lastActive: '1 hour ago' },
    { id: 5, name: 'Mia Johnson', email: 'mia@example.com', role: 'Viewer', status: 'pending', lastActive: 'Never' }
  ]);
  
  let sortColumn = $state('name');
  let sortDirection = $state('asc');
  let selectedRows = $state([]);
  
  function toggleSort(column) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
  }
  
  function toggleSelect(id) {
    if (selectedRows.includes(id)) {
      selectedRows = selectedRows.filter(r => r !== id);
    } else {
      selectedRows = [...selectedRows, id];
    }
  }
  
  function toggleSelectAll() {
    if (selectedRows.length === users.length) {
      selectedRows = [];
    } else {
      selectedRows = users.map(u => u.id);
    }
  }
  
  let sortedUsers = $derived(() => {
    return [...users].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const dir = sortDirection === 'asc' ? 1 : -1;
      return aVal < bVal ? -dir : aVal > bVal ? dir : 0;
    });
  });
</script>

<div class="table-container">
  <div class="table-header">
    <h3 class="table-title">Team Members</h3>
    <button class="add-btn">+ Add Member</button>
  </div>
  
  <div class="table-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th class="checkbox-cell">
            <input 
              type="checkbox" 
              checked={selectedRows.length === users.length}
              onchange={toggleSelectAll}
            />
          </th>
          <th class="sortable" onclick={() => toggleSort('name')}>
            Name
            {#if sortColumn === 'name'}
              <span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
            {/if}
          </th>
          <th class="sortable" onclick={() => toggleSort('role')}>
            Role
            {#if sortColumn === 'role'}
              <span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
            {/if}
          </th>
          <th>Status</th>
          <th>Last Active</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each sortedUsers() as user}
          <tr class:selected={selectedRows.includes(user.id)}>
            <td class="checkbox-cell">
              <input 
                type="checkbox" 
                checked={selectedRows.includes(user.id)}
                onchange={() => toggleSelect(user.id)}
              />
            </td>
            <td>
              <div class="user-cell">
                <div class="user-avatar">{user.name.charAt(0)}</div>
                <div class="user-info">
                  <span class="user-name">{user.name}</span>
                  <span class="user-email">{user.email}</span>
                </div>
              </div>
            </td>
            <td>
              <span class="role-badge">{user.role}</span>
            </td>
            <td>
              <span class="status-dot" class:active={user.status === 'active'} class:inactive={user.status === 'inactive'} class:pending={user.status === 'pending'}></span>
              {user.status}
            </td>
            <td class="muted">{user.lastActive}</td>
            <td>
              <button class="action-btn">⋯</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  
  <div class="table-footer">
    <span class="selection-count">{selectedRows.length} selected</span>
    <div class="pagination">
      <button class="page-btn" disabled>←</button>
      <span class="page-info">1 of 1</span>
      <button class="page-btn" disabled>→</button>
    </div>
  </div>
</div>

<style>
  .table-container {
    max-width: 680px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    overflow: hidden;
  }
  
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  
  .table-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .add-btn {
    padding: 8px 16px;
    background: #6366f1;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
  }
  
  .add-btn:hover {
    background: #4f46e5;
  }
  
  .table-wrapper {
    overflow-x: auto;
  }
  
  .data-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .data-table th {
    padding: 12px 16px;
    text-align: left;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255,255,255,0.45);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    background: rgba(255,255,255,0.02);
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  
  .data-table th.sortable {
    cursor: pointer;
    user-select: none;
  }
  
  .data-table th.sortable:hover {
    color: rgba(255,255,255,0.7);
  }
  
  .sort-icon {
    margin-left: 4px;
    opacity: 0.7;
  }
  
  .data-table td {
    padding: 14px 16px;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.8);
    border-bottom: 1px solid rgba(255,255,255,0.03);
  }
  
  .data-table tr:hover {
    background: rgba(255,255,255,0.02);
  }
  
  .data-table tr.selected {
    background: rgba(99, 102, 241, 0.08);
  }
  
  .checkbox-cell {
    width: 40px;
    padding-left: 20px !important;
  }
  
  .checkbox-cell input {
    accent-color: #6366f1;
  }
  
  .user-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .user-avatar {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: #fff;
  }
  
  .user-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .user-name {
    font-weight: 500;
    color: #fff;
  }
  
  .user-email {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.4);
  }
  
  .role-badge {
    padding: 4px 10px;
    background: rgba(255,255,255,0.05);
    border-radius: 10px;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.7);
  }
  
  .status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
  }
  
  .status-dot.active { background: #22c55e; }
  .status-dot.inactive { background: #6b7280; }
  .status-dot.pending { background: #f59e0b; }
  
  .muted {
    color: rgba(255,255,255,0.4);
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    font-size: 1rem;
  }
  
  .action-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }
  
  .table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 24px;
    border-top: 1px solid rgba(255,255,255,0.04);
  }
  
  .selection-count {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.45);
  }
  
  .pagination {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .page-btn {
    width: 32px;
    height: 32px;
    background: rgba(255,255,255,0.05);
    border: none;
    border-radius: 8px;
    color: rgba(255,255,255,0.6);
    cursor: pointer;
  }
  
  .page-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .page-info {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.5);
  }
</style>
```

---

### 5. Activity Timeline

A real-time activity feed with filtering:

```svelte
<script>
  let activities = $state([
    { id: 1, type: 'create', user: 'Emma', action: 'created a new project', target: 'Marketing Q1', time: '2 min ago', icon: '✦' },
    { id: 2, type: 'update', user: 'James', action: 'updated the status of', target: 'Bug Fix #234', time: '15 min ago', icon: '✎' },
    { id: 3, type: 'comment', user: 'Sofia', action: 'commented on', target: 'Design Review', time: '1 hour ago', icon: '◬' },
    { id: 4, type: 'complete', user: 'Lucas', action: 'completed', target: 'API Integration', time: '2 hours ago', icon: '✓' },
    { id: 5, type: 'delete', user: 'Mia', action: 'archived', target: 'Old Campaign', time: '3 hours ago', icon: '◎' }
  ]);
  
  let filter = $state('all');
  
  let filteredActivities = $derived(
    filter === 'all' ? activities : activities.filter(a => a.type === filter)
  );
</script>

<div class="activity-panel">
  <div class="panel-header">
    <h3 class="panel-title">Recent Activity</h3>
    <select class="filter-select" bind:value={filter}>
      <option value="all">All</option>
      <option value="create">Created</option>
      <option value="update">Updated</option>
      <option value="comment">Comments</option>
      <option value="complete">Completed</option>
    </select>
  </div>
  
  <div class="activity-list">
    {#each filteredActivities as activity (activity.id)}
      <div class="activity-item">
        <div class="activity-icon" class:create={activity.type === 'create'} class:update={activity.type === 'update'} class:comment={activity.type === 'comment'} class:complete={activity.type === 'complete'} class:delete={activity.type === 'delete'}>
          {activity.icon}
        </div>
        
        <div class="activity-content">
          <p class="activity-text">
            <span class="activity-user">{activity.user}</span>
            {activity.action}
            <span class="activity-target">{activity.target}</span>
          </p>
          <span class="activity-time">{activity.time}</span>
        </div>
      </div>
    {/each}
    
    {#if filteredActivities.length === 0}
      <div class="empty-state">No activities found</div>
    {/if}
  </div>
  
  <button class="load-more">Load More</button>
</div>

<style>
  .activity-panel {
    max-width: 400px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 20px;
  }
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .panel-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .filter-select {
    padding: 6px 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    color: rgba(255,255,255,0.8);
    font-size: 0.75rem;
    cursor: pointer;
  }
  
  .filter-select:focus {
    outline: none;
    border-color: #6366f1;
  }
  
  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 16px;
  }
  
  .activity-item {
    display: flex;
    gap: 14px;
    padding: 12px;
    border-radius: 10px;
    transition: background 0.15s ease;
  }
  
  .activity-item:hover {
    background: rgba(255,255,255,0.03);
  }
  
  .activity-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    flex-shrink: 0;
  }
  
  .activity-icon.create { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
  .activity-icon.update { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
  .activity-icon.comment { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
  .activity-icon.complete { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
  .activity-icon.delete { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
  
  .activity-content {
    flex: 1;
    min-width: 0;
  }
  
  .activity-text {
    margin: 0 0 4px;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.7);
    line-height: 1.4;
  }
  
  .activity-user {
    color: #fff;
    font-weight: 500;
  }
  
  .activity-target {
    color: #818cf8;
  }
  
  .activity-time {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.35);
  }
  
  .empty-state {
    padding: 32px;
    text-align: center;
    color: rgba(255,255,255,0.4);
    font-size: 0.85rem;
  }
  
  .load-more {
    width: 100%;
    padding: 10px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: rgba(255,255,255,0.6);
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .load-more:hover {
    border-color: rgba(255,255,255,0.2);
    color: #fff;
  }
</style>
```

---

### 6. Donut Chart

An interactive donut chart with legend:

```svelte
<script>
  let data = $state([
    { label: 'Direct', value: 4500, color: '#6366f1' },
    { label: 'Organic', value: 3200, color: '#22c55e' },
    { label: 'Referral', value: 2100, color: '#f59e0b' },
    { label: 'Social', value: 1800, color: '#ec4899' },
    { label: 'Email', value: 1400, color: '#8b5cf6' }
  ]);
  
  let hoveredIndex = $state(null);
  
  let total = $derived(data.reduce((sum, d) => sum + d.value, 0));
  
  function getArcPath(startAngle, endAngle, outerRadius, innerRadius) {
    const startOuter = polarToCartesian(outerRadius, startAngle);
    const endOuter = polarToCartesian(outerRadius, endAngle);
    const startInner = polarToCartesian(innerRadius, endAngle);
    const endInner = polarToCartesian(innerRadius, startAngle);
    
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    
    return `
      M ${startOuter.x} ${startOuter.y}
      A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}
      L ${startInner.x} ${startInner.y}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}
      Z
    `;
  }
  
  function polarToCartesian(radius, angle) {
    return {
      x: 100 + radius * Math.cos(angle - Math.PI / 2),
      y: 100 + radius * Math.sin(angle - Math.PI / 2)
    };
  }
  
  let arcs = $derived(() => {
    let startAngle = 0;
    return data.map((d, i) => {
      const angle = (d.value / total) * 2 * Math.PI;
      const arc = {
        path: getArcPath(startAngle, startAngle + angle, hoveredIndex === i ? 82 : 78, 50),
        color: d.color,
        midAngle: startAngle + angle / 2
      };
      startAngle += angle;
      return arc;
    });
  });
</script>

<div class="donut-chart">
  <div class="chart-section">
    <svg viewBox="0 0 200 200" class="donut-svg">
      {#each arcs() as arc, i}
        <path 
          d={arc.path}
          fill={arc.color}
          opacity={hoveredIndex === null || hoveredIndex === i ? 1 : 0.4}
          onmouseenter={() => hoveredIndex = i}
          onmouseleave={() => hoveredIndex = null}
          style="transition: all 0.2s ease; cursor: pointer;"
        />
      {/each}
    </svg>
    
    <div class="chart-center">
      {#if hoveredIndex !== null}
        <span class="center-value">{Math.round(data[hoveredIndex].value / total * 100)}%</span>
        <span class="center-label">{data[hoveredIndex].label}</span>
      {:else}
        <span class="center-value">{total.toLocaleString()}</span>
        <span class="center-label">Total</span>
      {/if}
    </div>
  </div>
  
  <div class="chart-legend">
    <h4 class="legend-title">Traffic Sources</h4>
    {#each data as item, i}
      <div 
        class="legend-item"
        class:active={hoveredIndex === i}
        onmouseenter={() => hoveredIndex = i}
        onmouseleave={() => hoveredIndex = null}
      >
        <span class="legend-color" style="background: {item.color}"></span>
        <span class="legend-label">{item.label}</span>
        <span class="legend-value">{item.value.toLocaleString()}</span>
        <span class="legend-percent">{Math.round(item.value / total * 100)}%</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .donut-chart {
    display: flex;
    gap: 32px;
    align-items: center;
    max-width: 520px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    padding: 28px;
  }
  
  .chart-section {
    position: relative;
    width: 180px;
    height: 180px;
    flex-shrink: 0;
  }
  
  .donut-svg {
    width: 100%;
    height: 100%;
  }
  
  .chart-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  
  .center-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
  }
  
  .center-label {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.5);
  }
  
  .chart-legend {
    flex: 1;
  }
  
  .legend-title {
    margin: 0 0 16px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    margin: 0 -12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  
  .legend-item:hover,
  .legend-item.active {
    background: rgba(255,255,255,0.04);
  }
  
  .legend-color {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  
  .legend-label {
    flex: 1;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.8);
  }
  
  .legend-value {
    font-size: 0.8rem;
    font-weight: 500;
    color: #fff;
    min-width: 50px;
    text-align: right;
  }
  
  .legend-percent {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.4);
    min-width: 35px;
    text-align: right;
  }
</style>
```

---

## Summary

This collection empowers data-driven decisions:

1. **Metric Cards** — KPIs with sparklines and trend indicators
2. **Area Charts** — Period comparison with interactive tooltips
3. **Progress Rings** — Circular goal tracking with animation
4. **Data Tables** — Sortable, selectable rows with actions
5. **Activity Timelines** — Filterable real-time event feeds
6. **Donut Charts** — Interactive segment exploration

---

*Dashboards don't just display data—they tell stories. Design for insight.*
