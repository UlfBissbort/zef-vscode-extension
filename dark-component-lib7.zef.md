# Dark Component Library VII ◈

**Feedback & Status** — Signal. Inform. Guide.

---

## Introduction

Great interfaces communicate. This collection explores feedback patterns—from ephemeral notifications to persistent status indicators. Each component ensures users always know what's happening, what happened, and what to do next.

---

## Component Collection

Six feedback and status components for responsive communication.

---

### 1. Alert Banner System

Dismissible alert banners with different severity levels:

```svelte
<script>
  let alerts = $state([
    { id: 1, type: 'info', title: 'New Feature', message: 'Dark mode is now available in settings.', dismissible: true },
    { id: 2, type: 'success', title: 'Payment Complete', message: 'Your subscription has been renewed successfully.', dismissible: true },
    { id: 3, type: 'warning', title: 'Storage Almost Full', message: 'You\'ve used 85% of your storage quota.', dismissible: true },
    { id: 4, type: 'error', title: 'Connection Lost', message: 'Unable to sync. Changes will be saved locally.', dismissible: false }
  ]);
  
  function dismiss(id) {
    alerts = alerts.filter(a => a.id !== id);
  }
  
  const icons = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✕'
  };
</script>

<div class="alerts-container">
  {#each alerts as alert (alert.id)}
    <div class="alert alert-{alert.type}">
      <div class="alert-icon">{icons[alert.type]}</div>
      <div class="alert-content">
        <span class="alert-title">{alert.title}</span>
        <span class="alert-message">{alert.message}</span>
      </div>
      {#if alert.dismissible}
        <button class="alert-dismiss" onclick={() => dismiss(alert.id)}>×</button>
      {/if}
    </div>
  {/each}
  
  {#if alerts.length === 0}
    <div class="empty-state">
      <span class="empty-icon">◎</span>
      <span>All caught up!</span>
    </div>
  {/if}
</div>

<style>
  .alerts-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 500px;
  }
  
  .alert {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    border-radius: 12px;
    animation: slideIn 0.3s ease;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .alert-info {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.25);
  }
  
  .alert-success {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.25);
  }
  
  .alert-warning {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.25);
  }
  
  .alert-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
  }
  
  .alert-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    flex-shrink: 0;
  }
  
  .alert-info .alert-icon {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }
  
  .alert-success .alert-icon {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
  }
  
  .alert-warning .alert-icon {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
  }
  
  .alert-error .alert-icon {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }
  
  .alert-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .alert-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
  }
  
  .alert-message {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.6);
    line-height: 1.4;
  }
  
  .alert-dismiss {
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: rgba(255,255,255,0.4);
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .alert-dismiss:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 32px;
    color: rgba(255,255,255,0.4);
    font-size: 0.9rem;
  }
  
  .empty-icon {
    font-size: 2rem;
    opacity: 0.4;
  }
</style>
```

---

### 2. Circular Progress Indicator

A customizable circular progress with animated stroke:

```svelte
<script>
  let progress = $state(72);
  let isAnimating = $state(false);
  
  function randomize() {
    isAnimating = true;
    const target = Math.floor(Math.random() * 100);
    const step = target > progress ? 1 : -1;
    
    const interval = setInterval(() => {
      if (progress === target) {
        clearInterval(interval);
        isAnimating = false;
        return;
      }
      progress += step;
    }, 15);
  }
  
  let circumference = 2 * Math.PI * 45;
  let strokeDashoffset = $derived(circumference - (progress / 100) * circumference);
  
  let statusColor = $derived(() => {
    if (progress >= 80) return '#22c55e';
    if (progress >= 50) return '#6366f1';
    if (progress >= 25) return '#f59e0b';
    return '#ef4444';
  });
</script>

<div class="progress-demo">
  <div class="circular-progress">
    <svg viewBox="0 0 100 100">
      <circle 
        cx="50" cy="50" r="45"
        class="track"
      />
      <circle 
        cx="50" cy="50" r="45"
        class="progress-ring"
        style="
          stroke: {statusColor()};
          stroke-dasharray: {circumference};
          stroke-dashoffset: {strokeDashoffset};
        "
      />
    </svg>
    <div class="progress-content">
      <span class="progress-value">{progress}</span>
      <span class="progress-label">%</span>
    </div>
  </div>
  
  <div class="progress-info">
    <h4 class="progress-title">Project Completion</h4>
    <p class="progress-subtitle">72 of 100 tasks completed</p>
  </div>
  
  <button class="randomize-btn" onclick={randomize} disabled={isAnimating}>
    {isAnimating ? 'Updating...' : 'Randomize'}
  </button>
</div>

<style>
  .progress-demo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 32px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    max-width: 280px;
  }
  
  .circular-progress {
    position: relative;
    width: 160px;
    height: 160px;
  }
  
  .circular-progress svg {
    transform: rotate(-90deg);
  }
  
  .track {
    fill: none;
    stroke: rgba(255,255,255,0.08);
    stroke-width: 8;
  }
  
  .progress-ring {
    fill: none;
    stroke-width: 8;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.3s ease, stroke 0.3s ease;
  }
  
  .progress-content {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }
  
  .progress-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: #fff;
    font-variant-numeric: tabular-nums;
  }
  
  .progress-label {
    font-size: 1rem;
    font-weight: 500;
    color: rgba(255,255,255,0.5);
    margin-top: 8px;
  }
  
  .progress-info {
    text-align: center;
  }
  
  .progress-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .progress-subtitle {
    margin: 4px 0 0;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.5);
  }
  
  .randomize-btn {
    padding: 10px 24px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 8px;
    color: #818cf8;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .randomize-btn:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.25);
  }
  
  .randomize-btn:disabled {
    opacity: 0.5;
    cursor: wait;
  }
</style>
```

---

### 3. Multi-Step Loading

A loading indicator showing multiple processing stages:

```svelte
<script>
  let currentStep = $state(0);
  let isLoading = $state(false);
  
  const steps = [
    { label: 'Analyzing', icon: '◎' },
    { label: 'Processing', icon: '⚡' },
    { label: 'Optimizing', icon: '◈' },
    { label: 'Finalizing', icon: '✓' }
  ];
  
  async function startLoading() {
    isLoading = true;
    currentStep = 0;
    
    for (let i = 0; i < steps.length; i++) {
      currentStep = i;
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
    }
    
    await new Promise(r => setTimeout(r, 500));
    isLoading = false;
  }
</script>

<div class="loading-container">
  {#if isLoading}
    <div class="loading-card">
      <div class="spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      
      <div class="loading-steps">
        {#each steps as step, i}
          <div 
            class="step"
            class:active={currentStep === i}
            class:completed={currentStep > i}
          >
            <span class="step-icon">{currentStep > i ? '✓' : step.icon}</span>
            <span class="step-label">{step.label}</span>
          </div>
        {/each}
      </div>
      
      <p class="loading-status">{steps[currentStep].label}...</p>
    </div>
  {:else}
    <div class="idle-state">
      <button class="start-btn" onclick={startLoading}>
        Start Processing
      </button>
    </div>
  {/if}
</div>

<style>
  .loading-container {
    display: flex;
    justify-content: center;
    padding: 24px;
  }
  
  .loading-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    padding: 48px 40px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    min-width: 320px;
  }
  
  .spinner {
    position: relative;
    width: 80px;
    height: 80px;
  }
  
  .spinner-ring {
    position: absolute;
    inset: 0;
    border: 3px solid transparent;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .spinner-ring:nth-child(2) {
    inset: 8px;
    border-top-color: #818cf8;
    animation-duration: 1.5s;
    animation-direction: reverse;
  }
  
  .spinner-ring:nth-child(3) {
    inset: 16px;
    border-top-color: #a5b4fc;
    animation-duration: 2s;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .loading-steps {
    display: flex;
    gap: 8px;
  }
  
  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 16px;
    border-radius: 10px;
    transition: all 0.3s ease;
  }
  
  .step.active {
    background: rgba(99, 102, 241, 0.15);
  }
  
  .step.completed {
    background: rgba(34, 197, 94, 0.1);
  }
  
  .step-icon {
    font-size: 1.25rem;
    color: rgba(255,255,255,0.3);
    transition: all 0.3s ease;
  }
  
  .step.active .step-icon {
    color: #818cf8;
    animation: pulse 1s ease infinite;
  }
  
  .step.completed .step-icon {
    color: #22c55e;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .step-label {
    font-size: 0.65rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255,255,255,0.4);
    transition: color 0.3s ease;
  }
  
  .step.active .step-label {
    color: #a5b4fc;
  }
  
  .step.completed .step-label {
    color: #86efac;
  }
  
  .loading-status {
    margin: 0;
    font-size: 0.9rem;
    color: rgba(255,255,255,0.6);
  }
  
  .idle-state {
    padding: 40px;
  }
  
  .start-btn {
    padding: 14px 32px;
    background: #6366f1;
    border: none;
    border-radius: 12px;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .start-btn:hover {
    background: #4f46e5;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
  }
</style>
```

---

### 4. Status Pills

Compact status indicators for inline use:

```svelte
<script>
  let items = $state([
    { id: 1, name: 'API Server', status: 'online', latency: '12ms' },
    { id: 2, name: 'Database', status: 'online', latency: '5ms' },
    { id: 3, name: 'CDN', status: 'degraded', latency: '89ms' },
    { id: 4, name: 'Email Service', status: 'offline', latency: null },
    { id: 5, name: 'Analytics', status: 'maintenance', latency: null }
  ]);
  
  function toggleStatus(id) {
    const statuses = ['online', 'degraded', 'offline', 'maintenance'];
    items = items.map(item => {
      if (item.id === id) {
        const currentIndex = statuses.indexOf(item.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        return { 
          ...item, 
          status: nextStatus,
          latency: nextStatus === 'online' ? `${Math.floor(Math.random() * 50)}ms` : null
        };
      }
      return item;
    });
  }
</script>

<div class="status-list">
  <h4 class="list-title">System Status</h4>
  
  {#each items as item}
    <div class="status-row" onclick={() => toggleStatus(item.id)}>
      <span class="service-name">{item.name}</span>
      <div class="status-right">
        {#if item.latency}
          <span class="latency">{item.latency}</span>
        {/if}
        <span class="status-pill status-{item.status}">
          <span class="status-dot"></span>
          {item.status}
        </span>
      </div>
    </div>
  {/each}
  
  <p class="hint">Click a row to cycle status</p>
</div>

<style>
  .status-list {
    max-width: 400px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    overflow: hidden;
  }
  
  .list-title {
    margin: 0;
    padding: 16px 20px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  
  .status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    cursor: pointer;
    transition: background 0.15s ease;
  }
  
  .status-row:last-of-type {
    border-bottom: none;
  }
  
  .status-row:hover {
    background: rgba(255,255,255,0.02);
  }
  
  .service-name {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.8);
  }
  
  .status-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .latency {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.4);
    font-family: 'SF Mono', monospace;
  }
  
  .status-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: capitalize;
  }
  
  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  
  .status-online {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
  }
  
  .status-online .status-dot {
    background: #22c55e;
    box-shadow: 0 0 8px #22c55e;
    animation: pulse 2s ease infinite;
  }
  
  .status-degraded {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
  }
  
  .status-degraded .status-dot {
    background: #f59e0b;
  }
  
  .status-offline {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
  }
  
  .status-offline .status-dot {
    background: #ef4444;
  }
  
  .status-maintenance {
    background: rgba(99, 102, 241, 0.15);
    color: #a5b4fc;
  }
  
  .status-maintenance .status-dot {
    background: #6366f1;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .hint {
    margin: 0;
    padding: 12px 20px;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.3);
    text-align: center;
    background: rgba(255,255,255,0.02);
  }
</style>
```

---

### 5. Progress Timeline

A vertical timeline showing task progress with timestamps:

```svelte
<script>
  let events = $state([
    { id: 1, title: 'Order Placed', description: 'Your order has been confirmed', time: '10:30 AM', status: 'completed' },
    { id: 2, title: 'Payment Verified', description: 'Payment successfully processed', time: '10:32 AM', status: 'completed' },
    { id: 3, title: 'Processing', description: 'Order is being prepared', time: '11:15 AM', status: 'current' },
    { id: 4, title: 'Shipped', description: 'On the way to delivery', time: 'Pending', status: 'pending' },
    { id: 5, title: 'Delivered', description: 'Package delivered successfully', time: 'Pending', status: 'pending' }
  ]);
</script>

<div class="timeline-container">
  <h4 class="timeline-title">Order #12847</h4>
  
  <div class="timeline">
    {#each events as event, i}
      <div class="timeline-item" class:completed={event.status === 'completed'} class:current={event.status === 'current'}>
        <div class="timeline-marker">
          <div class="marker-dot">
            {#if event.status === 'completed'}
              ✓
            {:else if event.status === 'current'}
              <div class="pulse-ring"></div>
            {/if}
          </div>
          {#if i < events.length - 1}
            <div class="marker-line" class:active={event.status === 'completed'}></div>
          {/if}
        </div>
        
        <div class="timeline-content">
          <div class="event-header">
            <span class="event-title">{event.title}</span>
            <span class="event-time">{event.time}</span>
          </div>
          <p class="event-description">{event.description}</p>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .timeline-container {
    max-width: 400px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 24px;
  }
  
  .timeline-title {
    margin: 0 0 24px;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .timeline {
    display: flex;
    flex-direction: column;
  }
  
  .timeline-item {
    display: flex;
    gap: 16px;
  }
  
  .timeline-marker {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
  }
  
  .marker-dot {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.06);
    border: 2px solid rgba(255,255,255,0.1);
    border-radius: 50%;
    color: rgba(255,255,255,0.3);
    font-size: 0.75rem;
    position: relative;
  }
  
  .timeline-item.completed .marker-dot {
    background: #22c55e;
    border-color: #22c55e;
    color: #fff;
  }
  
  .timeline-item.current .marker-dot {
    background: rgba(99, 102, 241, 0.2);
    border-color: #6366f1;
  }
  
  .pulse-ring {
    width: 10px;
    height: 10px;
    background: #6366f1;
    border-radius: 50%;
    animation: pulse 1.5s ease infinite;
  }
  
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  .marker-line {
    width: 2px;
    height: 40px;
    background: rgba(255,255,255,0.08);
    margin: 4px 0;
  }
  
  .marker-line.active {
    background: #22c55e;
  }
  
  .timeline-content {
    flex: 1;
    padding-bottom: 24px;
  }
  
  .timeline-item:last-child .timeline-content {
    padding-bottom: 0;
  }
  
  .event-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  
  .event-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
  }
  
  .timeline-item.completed .event-title,
  .timeline-item.current .event-title {
    color: #fff;
  }
  
  .event-time {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.4);
    font-family: 'SF Mono', monospace;
  }
  
  .event-description {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.4);
    line-height: 1.4;
  }
</style>
```

---

### 6. Confetti Celebration

A success celebration with animated confetti burst:

```svelte
<script>
  let isCelebrating = $state(false);
  let confetti = $state([]);
  
  function celebrate() {
    isCelebrating = true;
    
    // Generate confetti pieces
    const pieces = [];
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#22c55e', '#f59e0b', '#ef4444'];
    
    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        size: 6 + Math.random() * 6,
        rotation: Math.random() * 360
      });
    }
    
    confetti = pieces;
    
    setTimeout(() => {
      isCelebrating = false;
      confetti = [];
    }, 3000);
  }
</script>

<div class="celebration-container">
  {#if confetti.length > 0}
    <div class="confetti-container">
      {#each confetti as piece}
        <div 
          class="confetti-piece"
          style="
            left: {piece.left}%;
            background: {piece.color};
            width: {piece.size}px;
            height: {piece.size}px;
            animation-delay: {piece.delay}s;
            transform: rotate({piece.rotation}deg);
          "
        ></div>
      {/each}
    </div>
  {/if}
  
  <div class="celebration-card" class:celebrating={isCelebrating}>
    <div class="success-icon" class:pop={isCelebrating}>
      {isCelebrating ? '🎉' : '✓'}
    </div>
    
    <h3 class="success-title">
      {isCelebrating ? 'Congratulations!' : 'Task Complete'}
    </h3>
    <p class="success-message">
      {isCelebrating ? 'You did it! Time to celebrate!' : 'Your task has been completed successfully.'}
    </p>
    
    <button 
      class="celebrate-btn"
      onclick={celebrate}
      disabled={isCelebrating}
    >
      {isCelebrating ? 'Celebrating...' : '🎊 Celebrate!'}
    </button>
  </div>
</div>

<style>
  .celebration-container {
    position: relative;
    display: flex;
    justify-content: center;
    padding: 40px 24px;
    overflow: hidden;
  }
  
  .confetti-container {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  
  .confetti-piece {
    position: absolute;
    top: -20px;
    border-radius: 2px;
    animation: fall 3s ease-out forwards;
  }
  
  @keyframes fall {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(400px) rotate(720deg);
      opacity: 0;
    }
  }
  
  .celebration-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 48px 40px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    max-width: 320px;
    z-index: 1;
    transition: all 0.3s ease;
  }
  
  .celebration-card.celebrating {
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 0 0 40px rgba(99, 102, 241, 0.2);
  }
  
  .success-icon {
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(34, 197, 94, 0.15);
    border-radius: 50%;
    font-size: 1.75rem;
    color: #22c55e;
    margin-bottom: 20px;
    transition: all 0.3s ease;
  }
  
  .success-icon.pop {
    animation: pop 0.5s ease;
    background: rgba(99, 102, 241, 0.15);
    font-size: 2.5rem;
  }
  
  @keyframes pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
  
  .success-title {
    margin: 0 0 8px;
    font-size: 1.25rem;
    font-weight: 600;
    color: #fff;
  }
  
  .success-message {
    margin: 0 0 24px;
    font-size: 0.9rem;
    color: rgba(255,255,255,0.5);
    line-height: 1.5;
  }
  
  .celebrate-btn {
    padding: 12px 28px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .celebrate-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
  }
  
  .celebrate-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
</style>
```

---

## Summary

This collection ensures users stay informed through:

1. **Alert Banners** — Severity-coded messages with smooth dismissal
2. **Circular Progress** — Animated ring with dynamic color states
3. **Multi-Step Loading** — Sequential stage indicators with spinners
4. **Status Pills** — Compact inline indicators with pulse animations
5. **Progress Timeline** — Vertical journey tracking with timestamps
6. **Confetti Celebration** — Joyful success feedback with particle effects

---

*Feedback is trust. Keep users in the loop.*
