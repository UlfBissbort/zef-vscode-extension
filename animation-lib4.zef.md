# Interactive Animation Library IV ◈

**State Transitions** — Smooth journeys between moments.

---

## Introduction

This collection explores state transition animations—the smooth morphs between different UI states. Loading to complete, collapsed to expanded, inactive to active. These transitions communicate change and maintain context.

---

## Component Collection

Seven state transition animation components.

---

### 1. Loading State Button

Button that transitions through loading states:

```svelte
<script>
  let state = $state('idle'); // idle | loading | success | error
  
  async function handleClick() {
    if (state !== 'idle') return;
    
    state = 'loading';
    
    await new Promise(r => setTimeout(r, 2500));
    
    state = Math.random() > 0.3 ? 'success' : 'error';
    
    await new Promise(r => setTimeout(r, 2000));
    state = 'idle';
  }
</script>

<button 
  class="state-button"
  class:loading={state === 'loading'}
  class:success={state === 'success'}
  class:error={state === 'error'}
  onclick={handleClick}
  disabled={state !== 'idle'}
>
  <span class="button-content">
    {#if state === 'idle'}
      <span class="content-text">Upload File</span>
      <span class="content-icon">↑</span>
    {:else if state === 'loading'}
      <span class="loader">
        <span class="loader-track"></span>
        <span class="loader-progress"></span>
      </span>
      <span class="content-text">Uploading...</span>
    {:else if state === 'success'}
      <span class="content-icon success-icon">✓</span>
      <span class="content-text">Complete!</span>
    {:else}
      <span class="content-icon error-icon">✕</span>
      <span class="content-text">Try Again</span>
    {/if}
  </span>
</button>

<style>
  .state-button {
    min-width: 200px;
    padding: 18px 32px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    border-radius: 16px;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .state-button:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(99, 102, 241, 0.4);
  }
  
  .state-button.loading {
    background: linear-gradient(135deg, #4f46e5, #3730a3);
  }
  
  .state-button.success {
    background: linear-gradient(135deg, #22c55e, #16a34a);
  }
  
  .state-button.error {
    background: linear-gradient(135deg, #ef4444, #dc2626);
  }
  
  .button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  
  .content-text {
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
  }
  
  .content-icon {
    font-size: 1.1rem;
    color: #fff;
    animation: slideIn 0.3s ease;
  }
  
  .success-icon,
  .error-icon {
    animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  @keyframes pop {
    0% { transform: scale(0); }
    100% { transform: scale(1); }
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  .loader {
    position: relative;
    width: 20px;
    height: 20px;
  }
  
  .loader-track {
    position: absolute;
    inset: 0;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
  }
  
  .loader-progress {
    position: absolute;
    inset: 0;
    border: 2px solid transparent;
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
```

---

### 2. Expandable Card

Card that smoothly expands to show more content:

```svelte
<script>
  let isExpanded = $state(false);
</script>

<div 
  class="expand-card"
  class:expanded={isExpanded}
>
  <div class="card-header" onclick={() => isExpanded = !isExpanded}>
    <div class="header-info">
      <div class="avatar">◇</div>
      <div class="header-text">
        <h3 class="card-name">Project Alpha</h3>
        <span class="card-meta">Updated 2 hours ago</span>
      </div>
    </div>
    <button class="expand-toggle">
      <span class="toggle-icon">{isExpanded ? '−' : '+'}</span>
    </button>
  </div>
  
  <div class="card-body">
    <div class="body-content">
      <p class="card-description">
        A comprehensive design system featuring 50+ components, 
        built with accessibility and performance in mind. 
        Includes dark mode support and responsive layouts.
      </p>
      
      <div class="card-stats">
        <div class="stat">
          <span class="stat-value">24</span>
          <span class="stat-label">Components</span>
        </div>
        <div class="stat">
          <span class="stat-value">8</span>
          <span class="stat-label">Pages</span>
        </div>
        <div class="stat">
          <span class="stat-value">3</span>
          <span class="stat-label">Themes</span>
        </div>
      </div>
      
      <div class="card-actions">
        <button class="action-btn primary">Open Project</button>
        <button class="action-btn secondary">Share</button>
      </div>
    </div>
  </div>
</div>

<style>
  .expand-card {
    max-width: 380px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    overflow: hidden;
    transition: box-shadow 0.3s ease;
  }
  
  .expand-card.expanded {
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  }
  
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  
  .card-header:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  
  .header-info {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  
  .avatar {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    color: #fff;
  }
  
  .header-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .card-name {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
  }
  
  .card-meta {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .expand-toggle {
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .expand-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .toggle-icon {
    font-size: 1.2rem;
    color: #fff;
  }
  
  .card-body {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .expand-card.expanded .card-body {
    grid-template-rows: 1fr;
  }
  
  .body-content {
    overflow: hidden;
    padding: 0 20px;
    opacity: 0;
    transition: opacity 0.3s ease, padding 0.4s ease;
  }
  
  .expand-card.expanded .body-content {
    padding: 0 20px 20px;
    opacity: 1;
  }
  
  .card-description {
    margin: 0 0 20px;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
  }
  
  .card-stats {
    display: flex;
    gap: 20px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    margin-bottom: 16px;
  }
  
  .stat {
    flex: 1;
    text-align: center;
  }
  
  .stat-value {
    display: block;
    font-size: 1.3rem;
    font-weight: 700;
    color: #6366f1;
  }
  
  .stat-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .card-actions {
    display: flex;
    gap: 10px;
  }
  
  .action-btn {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .action-btn.primary {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: #fff;
  }
  
  .action-btn.primary:hover {
    transform: translateY(-1px);
  }
  
  .action-btn.secondary {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
  
  .action-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
```

---

### 3. Toggle Switch Animation

Toggle switch with liquid morphing:

```svelte
<script>
  let isEnabled = $state(false);
</script>

<div class="toggle-demo">
  <button 
    class="liquid-toggle"
    class:enabled={isEnabled}
    onclick={() => isEnabled = !isEnabled}
    role="switch"
    aria-checked={isEnabled}
  >
    <span class="toggle-track">
      <span class="track-bg"></span>
      <span class="track-glow"></span>
    </span>
    <span class="toggle-thumb">
      <span class="thumb-icon">{isEnabled ? '✓' : '○'}</span>
    </span>
  </button>
  
  <div class="toggle-info">
    <span class="toggle-label">Notifications</span>
    <span class="toggle-status">{isEnabled ? 'Enabled' : 'Disabled'}</span>
  </div>
</div>

<style>
  .toggle-demo {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 32px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    max-width: 320px;
  }
  
  .liquid-toggle {
    position: relative;
    width: 72px;
    height: 40px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }
  
  .toggle-track {
    position: absolute;
    inset: 0;
    border-radius: 20px;
    overflow: hidden;
  }
  
  .track-bg {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.1);
    transition: background 0.4s ease;
  }
  
  .liquid-toggle.enabled .track-bg {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
  }
  
  .track-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.15), transparent 50%);
    opacity: 0;
    transition: all 0.4s ease;
  }
  
  .liquid-toggle.enabled .track-glow {
    opacity: 1;
    background: radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.2), transparent 50%);
  }
  
  .toggle-thumb {
    position: absolute;
    top: 4px;
    left: 4px;
    width: 32px;
    height: 32px;
    background: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .liquid-toggle.enabled .toggle-thumb {
    left: calc(100% - 36px);
  }
  
  .thumb-icon {
    font-size: 0.9rem;
    color: #6366f1;
    transition: transform 0.3s ease;
  }
  
  .liquid-toggle.enabled .thumb-icon {
    transform: scale(1.1);
  }
  
  .toggle-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .toggle-label {
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .toggle-status {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    transition: color 0.3s ease;
  }
  
  .liquid-toggle.enabled ~ .toggle-info .toggle-status {
    color: #6366f1;
  }
</style>
```

---

### 4. Tab Content Transition

Tabs with smooth content crossfade:

```svelte
<script>
  let activeTab = $state(0);
  let direction = $state(1);
  
  const tabs = [
    { label: 'Overview', content: 'Get a bird\'s eye view of your project. Track progress, milestones, and team activity all in one place.' },
    { label: 'Activity', content: 'Stay up to date with real-time updates. See who\'s working on what and recent changes to your project.' },
    { label: 'Settings', content: 'Customize your workspace. Configure notifications, permissions, and project preferences to match your workflow.' }
  ];
  
  function setTab(index) {
    direction = index > activeTab ? 1 : -1;
    activeTab = index;
  }
</script>

<div class="tab-container">
  <div class="tab-list">
    {#each tabs as tab, i}
      <button 
        class="tab-trigger"
        class:active={activeTab === i}
        onclick={() => setTab(i)}
      >
        {tab.label}
      </button>
    {/each}
    <div 
      class="tab-indicator"
      style="transform: translateX({activeTab * 100}%)"
    ></div>
  </div>
  
  <div class="tab-content">
    {#each tabs as tab, i}
      <div 
        class="tab-panel"
        class:active={activeTab === i}
        class:entering={activeTab === i}
        style="--direction: {direction}"
      >
        <p class="panel-text">{tab.content}</p>
      </div>
    {/each}
  </div>
</div>

<style>
  .tab-container {
    max-width: 400px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    overflow: hidden;
  }
  
  .tab-list {
    position: relative;
    display: flex;
    padding: 8px;
    background: rgba(0, 0, 0, 0.3);
  }
  
  .tab-trigger {
    flex: 1;
    padding: 12px 16px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    position: relative;
    z-index: 1;
    transition: color 0.3s ease;
  }
  
  .tab-trigger.active {
    color: #fff;
  }
  
  .tab-indicator {
    position: absolute;
    top: 8px;
    left: 8px;
    width: calc(33.333% - 5.333px);
    height: calc(100% - 16px);
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border-radius: 10px;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .tab-content {
    position: relative;
    min-height: 120px;
    padding: 24px;
  }
  
  .tab-panel {
    position: absolute;
    inset: 24px;
    opacity: 0;
    transform: translateX(calc(var(--direction) * 20px));
    transition: all 0.3s ease;
    pointer-events: none;
  }
  
  .tab-panel.active {
    position: relative;
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
  }
  
  .panel-text {
    margin: 0;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
  }
</style>
```

---

### 5. Modal Appearance

Modal with elegant spring animation:

```svelte
<script>
  let isOpen = $state(false);
</script>

<div class="modal-demo">
  <button class="open-btn" onclick={() => isOpen = true}>
    Open Modal
  </button>
  
  {#if isOpen}
    <div class="modal-overlay" onclick={() => isOpen = false}>
      <div 
        class="modal-content"
        onclick={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <h3 class="modal-title">Confirm Action</h3>
          <button class="close-btn" onclick={() => isOpen = false}>✕</button>
        </div>
        
        <div class="modal-body">
          <p class="modal-text">
            Are you sure you want to proceed? This action will update your 
            preferences and may affect your workspace settings.
          </p>
        </div>
        
        <div class="modal-footer">
          <button class="modal-btn secondary" onclick={() => isOpen = false}>
            Cancel
          </button>
          <button class="modal-btn primary" onclick={() => isOpen = false}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .modal-demo {
    padding: 48px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
  }
  
  .open-btn {
    padding: 14px 28px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    border-radius: 12px;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .open-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
  }
  
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .modal-content {
    width: 100%;
    max-width: 400px;
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    overflow: hidden;
    animation: modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  @keyframes modalIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .modal-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
  }
  
  .close-btn {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.05);
    border: none;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  
  .modal-body {
    padding: 24px;
  }
  
  .modal-text {
    margin: 0;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
  }
  
  .modal-footer {
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    background: rgba(0, 0, 0, 0.2);
  }
  
  .modal-btn {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .modal-btn.primary {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: #fff;
  }
  
  .modal-btn.primary:hover {
    transform: translateY(-1px);
  }
  
  .modal-btn.secondary {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
  
  .modal-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
```

---

### 6. Accordion Transition

Smooth accordion with rotating icons:

```svelte
<script>
  let openItems = $state(new Set([0]));
  
  const items = [
    { title: 'What is this?', content: 'A beautifully animated accordion component with smooth expand/collapse transitions and rotating indicators.' },
    { title: 'How does it work?', content: 'Using CSS grid transitions for height animation and CSS transforms for the rotating chevron icon.' },
    { title: 'Can I customize it?', content: 'Absolutely! Every aspect from colors to timing can be easily customized through CSS variables.' }
  ];
  
  function toggle(index) {
    const newSet = new Set(openItems);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    openItems = newSet;
  }
</script>

<div class="accordion">
  {#each items as item, i}
    {@const isOpen = openItems.has(i)}
    <div class="accordion-item" class:open={isOpen}>
      <button 
        class="accordion-trigger"
        onclick={() => toggle(i)}
      >
        <span class="trigger-title">{item.title}</span>
        <span class="trigger-icon">
          <span class="chevron">▾</span>
        </span>
      </button>
      
      <div class="accordion-content">
        <div class="content-inner">
          <p class="content-text">{item.content}</p>
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  .accordion {
    max-width: 400px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    overflow: hidden;
  }
  
  .accordion-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .accordion-item:last-child {
    border-bottom: none;
  }
  
  .accordion-trigger {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: none;
    border: none;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  
  .accordion-trigger:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  
  .trigger-title {
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    text-align: left;
  }
  
  .trigger-icon {
    width: 28px;
    height: 28px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease;
  }
  
  .accordion-item.open .trigger-icon {
    background: rgba(99, 102, 241, 0.2);
  }
  
  .chevron {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9rem;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease;
  }
  
  .accordion-item.open .chevron {
    transform: rotate(180deg);
    color: #6366f1;
  }
  
  .accordion-content {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .accordion-item.open .accordion-content {
    grid-template-rows: 1fr;
  }
  
  .content-inner {
    overflow: hidden;
  }
  
  .content-text {
    margin: 0;
    padding: 0 24px 20px;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.6;
  }
</style>
```

---

### 7. Progress Steps

Multi-step progress with state transitions:

```svelte
<script>
  let currentStep = $state(1);
  const totalSteps = 4;
  
  const steps = [
    { label: 'Account', icon: '◇' },
    { label: 'Details', icon: '✦' },
    { label: 'Review', icon: '◎' },
    { label: 'Complete', icon: '✓' }
  ];
</script>

<div class="progress-container">
  <div class="progress-steps">
    {#each steps as step, i}
      {@const stepNum = i + 1}
      {@const isComplete = stepNum < currentStep}
      {@const isCurrent = stepNum === currentStep}
      
      <div 
        class="step"
        class:complete={isComplete}
        class:current={isCurrent}
      >
        <div class="step-indicator">
          <span class="step-icon">
            {isComplete ? '✓' : step.icon}
          </span>
        </div>
        <span class="step-label">{step.label}</span>
        
        {#if i < steps.length - 1}
          <div class="step-connector">
            <div 
              class="connector-fill"
              style="width: {isComplete ? '100%' : '0%'}"
            ></div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
  
  <div class="progress-controls">
    <button 
      class="control-btn"
      onclick={() => currentStep = Math.max(1, currentStep - 1)}
      disabled={currentStep === 1}
    >
      ← Back
    </button>
    
    <span class="step-counter">Step {currentStep} of {totalSteps}</span>
    
    <button 
      class="control-btn primary"
      onclick={() => currentStep = Math.min(totalSteps, currentStep + 1)}
      disabled={currentStep === totalSteps}
    >
      Next →
    </button>
  </div>
</div>

<style>
  .progress-container {
    max-width: 500px;
    padding: 32px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
  }
  
  .progress-steps {
    display: flex;
    align-items: flex-start;
    margin-bottom: 32px;
  }
  
  .step {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }
  
  .step-indicator {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    margin-bottom: 12px;
  }
  
  .step.current .step-indicator {
    background: rgba(99, 102, 241, 0.2);
    border-color: #6366f1;
    transform: scale(1.1);
  }
  
  .step.complete .step-indicator {
    background: #6366f1;
    border-color: #6366f1;
  }
  
  .step-icon {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.4);
    transition: all 0.3s ease;
  }
  
  .step.current .step-icon {
    color: #6366f1;
  }
  
  .step.complete .step-icon {
    color: #fff;
    animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  @keyframes pop {
    0% { transform: scale(0); }
    100% { transform: scale(1); }
  }
  
  .step-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.4);
    transition: color 0.3s ease;
  }
  
  .step.current .step-label,
  .step.complete .step-label {
    color: #fff;
  }
  
  .step-connector {
    position: absolute;
    top: 24px;
    left: calc(50% + 30px);
    right: calc(-50% + 30px);
    height: 2px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 1px;
  }
  
  .connector-fill {
    height: 100%;
    background: #6366f1;
    border-radius: 1px;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .progress-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .control-btn {
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .control-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .control-btn:not(:disabled):hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .control-btn.primary {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
  }
  
  .control-btn.primary:not(:disabled):hover {
    transform: translateY(-1px);
  }
  
  .step-counter {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.5);
  }
</style>
```

---

## Summary

This collection demonstrates smooth state transitions:

1. **Loading State Button** — Multi-phase loading feedback
2. **Expandable Card** — Grid-based height animation
3. **Toggle Switch** — Liquid morphing toggle
4. **Tab Transitions** — Directional content crossfade
5. **Modal Appearance** — Spring-based entry animation
6. **Accordion** — Smooth expand with rotating icons
7. **Progress Steps** — Connected step indicators

---

*Transitions are the glue between moments. Make them seamless, make them meaningful.*
