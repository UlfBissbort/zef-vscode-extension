# Dark Component Library V ◈

**Navigation & Layout** — Structure. Flow. Wayfinding.

---

## Introduction

Navigation is the skeleton of any interface. This collection explores elegant, dark-themed navigation patterns—from sidebars that breathe to breadcrumbs that tell stories. Each component guides users with clarity and grace.

---

## Component Collection

Six navigation and layout components that define spatial hierarchy.

---

### 1. Collapsible Sidebar

A sleek sidebar that expands on hover, revealing labels while staying minimal when collapsed:

```svelte
<script>
  let isExpanded = $state(false);
  let activeItem = $state("dashboard");
  
  const navItems = [
    { id: "dashboard", icon: "◎", label: "Dashboard" },
    { id: "projects", icon: "▦", label: "Projects" },
    { id: "messages", icon: "◉", label: "Messages", badge: 3 },
    { id: "calendar", icon: "◫", label: "Calendar" },
    { id: "analytics", icon: "◈", label: "Analytics" },
    { id: "settings", icon: "⚙", label: "Settings" }
  ];
</script>

<div class="sidebar-demo">
  <aside 
    class="sidebar"
    class:expanded={isExpanded}
    onmouseenter={() => isExpanded = true}
    onmouseleave={() => isExpanded = false}
  >
    <div class="sidebar-header">
      <span class="logo">{isExpanded ? "◇ Flux" : "◇"}</span>
    </div>
    
    <nav class="sidebar-nav">
      {#each navItems as item}
        <button 
          class="nav-item"
          class:active={activeItem === item.id}
          onclick={() => activeItem = item.id}
        >
          <span class="nav-icon">{item.icon}</span>
          <span class="nav-label">{item.label}</span>
          {#if item.badge}
            <span class="nav-badge">{item.badge}</span>
          {/if}
        </button>
      {/each}
    </nav>
    
    <div class="sidebar-footer">
      <div class="user-avatar">U</div>
      {#if isExpanded}
        <div class="user-info">
          <span class="user-name">User</span>
          <span class="user-status">● Online</span>
        </div>
      {/if}
    </div>
  </aside>
  
  <main class="content-area">
    <h3>Selected: {navItems.find(i => i.id === activeItem)?.label}</h3>
    <p class="hint">Hover the sidebar to expand</p>
  </main>
</div>

<style>
  .sidebar-demo {
    display: flex;
    min-height: 400px;
    background: #09090b;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.06);
  }
  
  .sidebar {
    width: 64px;
    background: #0c0c0e;
    border-right: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }
  
  .sidebar.expanded {
    width: 220px;
  }
  
  .sidebar-header {
    padding: 20px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  
  .logo {
    font-size: 1.25rem;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
  }
  
  .sidebar-nav {
    flex: 1;
    padding: 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: transparent;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    color: rgba(255,255,255,0.5);
  }
  
  .nav-item:hover {
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.8);
  }
  
  .nav-item.active {
    background: rgba(255,255,255,0.08);
    color: #fff;
  }
  
  .nav-icon {
    font-size: 1.1rem;
    width: 24px;
    text-align: center;
    flex-shrink: 0;
  }
  
  .nav-label {
    font-size: 0.875rem;
    font-weight: 500;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  
  .sidebar.expanded .nav-label {
    opacity: 1;
  }
  
  .nav-badge {
    margin-left: auto;
    background: #e11d48;
    color: #fff;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  
  .sidebar.expanded .nav-badge {
    opacity: 1;
  }
  
  .sidebar-footer {
    padding: 16px;
    border-top: 1px solid rgba(255,255,255,0.04);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .user-avatar {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: #fff;
    flex-shrink: 0;
  }
  
  .user-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
  }
  
  .user-name {
    font-size: 0.8rem;
    font-weight: 500;
    color: #fff;
  }
  
  .user-status {
    font-size: 0.7rem;
    color: #22c55e;
  }
  
  .content-area {
    flex: 1;
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .content-area h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 500;
    color: #fff;
  }
  
  .hint {
    margin-top: 8px;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.4);
  }
</style>
```

---

### 2. Animated Breadcrumbs

Breadcrumbs with smooth transitions and interactive path editing:

```svelte
<script>
  let path = $state([
    { id: "home", label: "Home", icon: "⌂" },
    { id: "projects", label: "Projects" },
    { id: "design", label: "Design System" },
    { id: "components", label: "Components" }
  ]);
  
  function navigateTo(index) {
    path = path.slice(0, index + 1);
  }
  
  function goDeeper() {
    const items = ["Details", "Settings", "Preview", "Export"];
    const newItem = items[path.length % items.length];
    path = [...path, { id: newItem.toLowerCase(), label: newItem }];
  }
</script>

<div class="breadcrumbs-container">
  <nav class="breadcrumbs">
    {#each path as item, i}
      <div class="crumb-wrapper" style="--delay: {i * 0.05}s">
        {#if i > 0}
          <span class="separator">⟩</span>
        {/if}
        <button 
          class="crumb"
          class:current={i === path.length - 1}
          onclick={() => navigateTo(i)}
          disabled={i === path.length - 1}
        >
          {#if item.icon}
            <span class="crumb-icon">{item.icon}</span>
          {/if}
          <span class="crumb-label">{item.label}</span>
        </button>
      </div>
    {/each}
  </nav>
  
  <button class="add-btn" onclick={goDeeper}>
    + Go Deeper
  </button>
</div>

<style>
  .breadcrumbs-container {
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .breadcrumbs {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .crumb-wrapper {
    display: flex;
    align-items: center;
    gap: 4px;
    animation: slideIn 0.3s ease backwards;
    animation-delay: var(--delay);
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-8px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .separator {
    color: rgba(255,255,255,0.2);
    font-size: 0.75rem;
    margin: 0 4px;
  }
  
  .crumb {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .crumb:not(:disabled):hover {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.9);
  }
  
  .crumb.current {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.1);
    color: #fff;
    font-weight: 500;
    cursor: default;
  }
  
  .crumb-icon {
    font-size: 0.9rem;
  }
  
  .add-btn {
    align-self: flex-start;
    padding: 8px 16px;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 8px;
    color: #818cf8;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .add-btn:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.5);
  }
</style>
```

---

### 3. Floating Tab Bar

A mobile-inspired tab bar with fluid indicator animation:

```svelte
<script>
  let activeTab = $state(0);
  
  const tabs = [
    { icon: "⌂", label: "Home" },
    { icon: "◎", label: "Explore" },
    { icon: "+", label: "Create", accent: true },
    { icon: "♡", label: "Saved" },
    { icon: "◉", label: "Profile" }
  ];
</script>

<div class="tab-bar-container">
  <nav class="tab-bar">
    <div 
      class="tab-indicator"
      style="transform: translateX({activeTab * 100}%)"
    ></div>
    
    {#each tabs as tab, i}
      <button 
        class="tab"
        class:active={activeTab === i}
        class:accent={tab.accent}
        onclick={() => activeTab = i}
      >
        <span class="tab-icon" class:pop={activeTab === i}>{tab.icon}</span>
        <span class="tab-label">{tab.label}</span>
      </button>
    {/each}
  </nav>
  
  <p class="current-view">Current: {tabs[activeTab].label}</p>
</div>

<style>
  .tab-bar-container {
    background: #09090b;
    border-radius: 16px;
    padding: 48px 24px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    border: 1px solid rgba(255,255,255,0.06);
  }
  
  .tab-bar {
    position: relative;
    display: flex;
    background: #0f0f11;
    border-radius: 24px;
    padding: 6px;
    box-shadow: 
      0 4px 24px rgba(0,0,0,0.4),
      inset 0 1px 0 rgba(255,255,255,0.04);
  }
  
  .tab-indicator {
    position: absolute;
    top: 6px;
    left: 6px;
    width: calc(20% - 2.4px);
    height: calc(100% - 12px);
    background: rgba(255,255,255,0.08);
    border-radius: 20px;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .tab {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 20px;
    background: transparent;
    border: none;
    cursor: pointer;
    z-index: 1;
  }
  
  .tab-icon {
    font-size: 1.25rem;
    color: rgba(255,255,255,0.4);
    transition: all 0.2s ease;
  }
  
  .tab-icon.pop {
    transform: scale(1.2);
    color: #fff;
  }
  
  .tab.accent .tab-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 50%;
    font-size: 1.5rem;
    color: #fff;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
    margin: -12px 0;
  }
  
  .tab.accent .tab-icon.pop {
    transform: scale(1.1);
    box-shadow: 0 6px 24px rgba(99, 102, 241, 0.6);
  }
  
  .tab-label {
    font-size: 0.65rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255,255,255,0.3);
    transition: color 0.2s ease;
  }
  
  .tab.active .tab-label {
    color: rgba(255,255,255,0.8);
  }
  
  .current-view {
    margin: 0;
    font-size: 0.9rem;
    color: rgba(255,255,255,0.5);
  }
</style>
```

---

### 4. Stepper Navigation

A multi-step progress navigation with status indicators:

```svelte
<script>
  let currentStep = $state(1);
  
  const steps = [
    { id: 1, label: "Account", description: "Create your account" },
    { id: 2, label: "Profile", description: "Add personal details" },
    { id: 3, label: "Preferences", description: "Set your preferences" },
    { id: 4, label: "Review", description: "Confirm and submit" }
  ];
  
  function getStatus(stepId) {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  }
</script>

<div class="stepper-container">
  <div class="stepper">
    {#each steps as step, i}
      <button 
        class="step"
        class:completed={getStatus(step.id) === 'completed'}
        class:current={getStatus(step.id) === 'current'}
        onclick={() => currentStep = step.id}
      >
        <div class="step-indicator">
          {#if getStatus(step.id) === 'completed'}
            <span class="check">✓</span>
          {:else}
            <span class="number">{step.id}</span>
          {/if}
        </div>
        <div class="step-content">
          <span class="step-label">{step.label}</span>
          <span class="step-desc">{step.description}</span>
        </div>
      </button>
      
      {#if i < steps.length - 1}
        <div 
          class="connector"
          class:filled={step.id < currentStep}
        ></div>
      {/if}
    {/each}
  </div>
  
  <div class="stepper-actions">
    <button 
      class="btn-secondary"
      onclick={() => currentStep = Math.max(1, currentStep - 1)}
      disabled={currentStep === 1}
    >
      Previous
    </button>
    <button 
      class="btn-primary"
      onclick={() => currentStep = Math.min(steps.length, currentStep + 1)}
      disabled={currentStep === steps.length}
    >
      {currentStep === steps.length ? 'Complete' : 'Continue'}
    </button>
  </div>
</div>

<style>
  .stepper-container {
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 32px;
  }
  
  .stepper {
    display: flex;
    align-items: flex-start;
    gap: 0;
    margin-bottom: 32px;
  }
  
  .step {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    border-radius: 12px;
    transition: background 0.15s ease;
  }
  
  .step:hover {
    background: rgba(255,255,255,0.02);
  }
  
  .step-indicator {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.04);
    border: 2px solid rgba(255,255,255,0.1);
    transition: all 0.25s ease;
    flex-shrink: 0;
  }
  
  .step.current .step-indicator {
    background: rgba(99, 102, 241, 0.15);
    border-color: #6366f1;
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
  }
  
  .step.completed .step-indicator {
    background: #22c55e;
    border-color: #22c55e;
  }
  
  .number {
    font-size: 0.9rem;
    font-weight: 600;
    color: rgba(255,255,255,0.4);
  }
  
  .step.current .number {
    color: #818cf8;
  }
  
  .check {
    font-size: 1rem;
    color: #fff;
  }
  
  .step-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .step-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
    transition: color 0.15s ease;
  }
  
  .step.current .step-label,
  .step.completed .step-label {
    color: #fff;
  }
  
  .step-desc {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.3);
  }
  
  .connector {
    flex: 1;
    height: 2px;
    background: rgba(255,255,255,0.1);
    margin: 19px 8px;
    border-radius: 1px;
    position: relative;
    overflow: hidden;
  }
  
  .connector::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 0%;
    background: #22c55e;
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .connector.filled::after {
    width: 100%;
  }
  
  .stepper-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  .btn-secondary {
    padding: 10px 20px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px;
    color: rgba(255,255,255,0.7);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.25);
  }
  
  .btn-secondary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  .btn-primary {
    padding: 10px 24px;
    background: #6366f1;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #4f46e5;
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
```

---

### 5. Split Panel Layout

A resizable split panel with drag handle:

```svelte
<script>
  let splitPosition = $state(50);
  let isDragging = $state(false);
  
  function handleMouseDown(e) {
    isDragging = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
  
  function handleMouseMove(e) {
    if (!isDragging) return;
    const container = document.querySelector('.split-container');
    const rect = container.getBoundingClientRect();
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
    splitPosition = Math.max(20, Math.min(80, newPosition));
  }
  
  function handleMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
</script>

<div class="split-container" class:dragging={isDragging}>
  <div class="panel left-panel" style="width: {splitPosition}%">
    <div class="panel-header">
      <span class="panel-title">◧ Editor</span>
    </div>
    <div class="panel-content">
      <div class="code-lines">
        {#each Array(8) as _, i}
          <div class="code-line">
            <span class="line-num">{i + 1}</span>
            <span class="line-code" style="width: {40 + Math.random() * 50}%"></span>
          </div>
        {/each}
      </div>
    </div>
  </div>
  
  <div 
    class="divider"
    onmousedown={handleMouseDown}
  >
    <div class="divider-handle">
      <span class="handle-dots">⋮</span>
    </div>
  </div>
  
  <div class="panel right-panel" style="width: {100 - splitPosition}%">
    <div class="panel-header">
      <span class="panel-title">◨ Preview</span>
    </div>
    <div class="panel-content">
      <div class="preview-placeholder">
        <span class="preview-icon">◎</span>
        <span class="preview-text">Live Preview</span>
      </div>
    </div>
  </div>
</div>

<p class="split-hint">Drag the center handle to resize panels</p>

<style>
  .split-container {
    display: flex;
    height: 300px;
    background: #09090b;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    overflow: hidden;
  }
  
  .split-container.dragging {
    cursor: col-resize;
    user-select: none;
  }
  
  .panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  
  .panel-header {
    padding: 12px 16px;
    background: rgba(255,255,255,0.02);
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  
  .panel-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255,255,255,0.5);
  }
  
  .panel-content {
    flex: 1;
    padding: 16px;
    overflow: auto;
  }
  
  .divider {
    width: 8px;
    background: rgba(255,255,255,0.02);
    border-left: 1px solid rgba(255,255,255,0.06);
    border-right: 1px solid rgba(255,255,255,0.06);
    cursor: col-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease;
  }
  
  .divider:hover {
    background: rgba(99, 102, 241, 0.1);
  }
  
  .divider-handle {
    padding: 8px 2px;
    border-radius: 4px;
  }
  
  .handle-dots {
    color: rgba(255,255,255,0.3);
    font-size: 0.9rem;
  }
  
  .code-lines {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .code-line {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .line-num {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.2);
    font-family: monospace;
    width: 16px;
    text-align: right;
  }
  
  .line-code {
    height: 8px;
    background: rgba(255,255,255,0.08);
    border-radius: 4px;
  }
  
  .preview-placeholder {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  
  .preview-icon {
    font-size: 2rem;
    color: rgba(255,255,255,0.15);
  }
  
  .preview-text {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.3);
  }
  
  .split-hint {
    text-align: center;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.3);
    margin-top: 16px;
  }
</style>
```

---

### 6. Pagination Component

An elegant pagination bar with page size selector:

```svelte
<script>
  let currentPage = $state(1);
  let pageSize = $state(10);
  let totalItems = $state(247);
  
  let totalPages = $derived(Math.ceil(totalItems / pageSize));
  
  let visiblePages = $derived(() => {
    const pages = [];
    const total = totalPages;
    const current = currentPage;
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, '...', total);
      } else if (current >= total - 2) {
        pages.push(1, '...', total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', total);
      }
    }
    return pages;
  });
  
  function goToPage(page) {
    if (typeof page === 'number' && page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }
</script>

<div class="pagination-container">
  <div class="pagination-info">
    <span class="showing">
      Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
    </span>
  </div>
  
  <nav class="pagination">
    <button 
      class="page-btn nav-btn"
      onclick={() => goToPage(currentPage - 1)}
      disabled={currentPage === 1}
    >
      ‹
    </button>
    
    {#each visiblePages() as page}
      {#if page === '...'}
        <span class="ellipsis">⋯</span>
      {:else}
        <button 
          class="page-btn"
          class:active={currentPage === page}
          onclick={() => goToPage(page)}
        >
          {page}
        </button>
      {/if}
    {/each}
    
    <button 
      class="page-btn nav-btn"
      onclick={() => goToPage(currentPage + 1)}
      disabled={currentPage === totalPages}
    >
      ›
    </button>
  </nav>
  
  <div class="page-size-selector">
    <span class="size-label">Per page:</span>
    <select bind:value={pageSize} onchange={() => currentPage = 1}>
      <option value={10}>10</option>
      <option value={25}>25</option>
      <option value={50}>50</option>
      <option value={100}>100</option>
    </select>
  </div>
</div>

<style>
  .pagination-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    padding: 20px 24px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
  }
  
  .pagination-info .showing {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.5);
  }
  
  .pagination {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .page-btn {
    min-width: 36px;
    height: 36px;
    padding: 0 12px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    color: rgba(255,255,255,0.6);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .page-btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.1);
  }
  
  .page-btn.active {
    background: #6366f1;
    border-color: #6366f1;
    color: #fff;
  }
  
  .page-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .nav-btn {
    font-size: 1.1rem;
  }
  
  .ellipsis {
    padding: 0 8px;
    color: rgba(255,255,255,0.3);
    font-size: 0.8rem;
  }
  
  .page-size-selector {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .size-label {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.5);
  }
  
  select {
    padding: 6px 28px 6px 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: #fff;
    font-size: 0.8rem;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='rgba(255,255,255,0.5)' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
  }
  
  select:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.5);
  }
</style>
```

---

## Summary

This collection establishes spatial awareness through:

1. **Collapsible Sidebar** — Adaptive navigation that breathes with user attention
2. **Animated Breadcrumbs** — Story-driven path visualization with interactive editing
3. **Floating Tab Bar** — Mobile-first bottom navigation with fluid transitions
4. **Stepper Navigation** — Progress-aware multi-step guidance
5. **Split Panel Layout** — Resizable workspace partitioning
6. **Pagination** — Data navigation with intelligent ellipsis compression

---

*Navigation is architecture. Structure is storytelling.*
