# Dark Component Library ◆

**Modern UI Components** — Sleek. Simple. Stunning. Interactive.

---

## Philosophy

These components embrace the darkness. They use absence to create presence, subtle motion to imply depth, and precision to convey craft. Every pixel earns its place.

---

## Component Showcase

Five handcrafted components demonstrating modern design principles with meaningful interactivity.

---

### 1. Invite Popover

A refined invitation panel with search, suggestions, and smooth interactions. Inspired by modern collaboration tools, adapted for the dark side:

```svelte
<script>
  let searchQuery = $state("");
  let selectedIndex = $state(0);
  let showPopover = $state(true);
  
  let suggestions = $state([
    { id: 1, name: "Edwin Smith", email: "edwin@peakorange.com", avatar: null },
    { id: 2, name: "Steph Williams", email: "steph@peakorange.com", avatar: null },
    { id: 3, name: "Adam James", email: "adam@peakorange.com", avatar: null }
  ]);
  
  let filtered = $derived(
    searchQuery.length > 0
      ? suggestions.filter(s => 
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : suggestions
  );
  
  function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('');
  }
  
  function selectSuggestion(suggestion) {
    searchQuery = suggestion.email;
    selectedIndex = suggestions.findIndex(s => s.id === suggestion.id);
  }
  
  function handleKeydown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      selectSuggestion(filtered[selectedIndex]);
    }
  }
</script>

{#if showPopover}
<div class="popover-container">
  <div class="popover">
    <div class="to-row">
      <span class="to-label">To:</span>
      <input 
        type="text" 
        class="to-input" 
        placeholder="Name or email..."
        bind:value={searchQuery}
        onkeydown={handleKeydown}
      />
    </div>
    
    <div class="suggestions-header">Suggestions</div>
    
    <div class="suggestions-list">
      {#each filtered as suggestion, i}
        <button 
          class="suggestion-row"
          class:highlighted={i === selectedIndex}
          onclick={() => selectSuggestion(suggestion)}
          onmouseenter={() => selectedIndex = i}
        >
          <div class="person-avatar">
            <span class="initials">{getInitials(suggestion.name)}</span>
          </div>
          <div class="person-info">
            <span class="name">{suggestion.name}</span>
            <span class="email">{suggestion.email}</span>
          </div>
        </button>
      {/each}
    </div>
    
    <div class="popover-footer">
      <div class="link-section">
        <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke-linecap="round"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke-linecap="round"/>
        </svg>
        <span class="link-text">Anyone with the link can view · </span>
        <button class="copy-link">Copy link</button>
      </div>
      <button class="settings-btn">Settings</button>
    </div>
  </div>
</div>
{/if}

<style>
  .popover-container {
    padding: 24px;
  }
  .popover {
    width: 100%;
    max-width: 480px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    box-shadow: 
      0 0 0 1px rgba(255, 255, 255, 0.02),
      0 24px 48px rgba(0, 0, 0, 0.5),
      0 8px 16px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }
  
  .to-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .to-label {
    font-size: 16px;
    font-weight: 500;
    color: #71717a;
    flex-shrink: 0;
  }
  .to-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-size: 16px;
    color: #fafafa;
    padding: 8px 0;
  }
  .to-input::placeholder {
    color: #52525b;
  }
  
  .suggestions-header {
    padding: 14px 24px;
    font-size: 13px;
    font-weight: 500;
    color: #52525b;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    background: rgba(255, 255, 255, 0.01);
  }
  
  .suggestions-list {
    display: flex;
    flex-direction: column;
  }
  
  .suggestion-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 24px;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    cursor: pointer;
    transition: background 0.15s;
    text-align: left;
    width: 100%;
  }
  .suggestion-row:last-child {
    border-bottom: none;
  }
  .suggestion-row:hover,
  .suggestion-row.highlighted {
    background: rgba(59, 130, 246, 0.08);
  }
  
  .person-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .initials {
    font-size: 14px;
    font-weight: 600;
    color: #fafafa;
  }
  
  .person-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .name {
    font-size: 15px;
    font-weight: 500;
    color: #fafafa;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .email {
    font-size: 13px;
    color: #71717a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .popover-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: rgba(255, 255, 255, 0.02);
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }
  
  .link-section {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #71717a;
  }
  .link-icon {
    width: 18px;
    height: 18px;
    opacity: 0.6;
  }
  .link-text {
    color: #52525b;
  }
  .copy-link {
    background: none;
    border: none;
    color: #3b82f6;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    font-size: 13px;
  }
  .copy-link:hover {
    color: #60a5fa;
  }
  
  .settings-btn {
    background: none;
    border: none;
    color: #3b82f6;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 8px;
    transition: background 0.15s;
  }
  .settings-btn:hover {
    background: rgba(59, 130, 246, 0.1);
  }
</style>
```

---

### 2. Expandable Accordion

A smooth accordion with animated expansion and rich content areas:

```svelte
<script>
  let sections = $state([
    {
      id: "overview",
      title: "Project Overview",
      icon: "◈",
      content: "This project explores the boundaries of minimalist design through interactive components. Each element serves a purpose, nothing is superfluous.",
      expanded: true
    },
    {
      id: "features",
      title: "Key Features",
      icon: "◆",
      content: "Dark mode optimized, fluid animations, accessibility-first, responsive by default. Built with Svelte 5 runes for maximum reactivity.",
      expanded: false
    },
    {
      id: "tech",
      title: "Technology Stack",
      icon: "◇",
      content: "Svelte 5, TypeScript, CSS custom properties, hardware-accelerated animations. Zero runtime dependencies.",
      expanded: false
    }
  ]);
  
  function toggle(id) {
    sections = sections.map(s => ({
      ...s,
      expanded: s.id === id ? !s.expanded : false
    }));
  }
</script>

<div class="accordion">
  {#each sections as section}
    <div class="accordion-item" class:expanded={section.expanded}>
      <button 
        class="accordion-header"
        onclick={() => toggle(section.id)}
        aria-expanded={section.expanded}
      >
        <div class="header-left">
          <span class="icon">{section.icon}</span>
          <span class="title">{section.title}</span>
        </div>
        <span class="chevron">›</span>
      </button>
      <div class="accordion-content">
        <div class="content-inner">
          <p>{section.content}</p>
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  .accordion {
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    overflow: hidden;
  }
  
  .accordion-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }
  .accordion-item:last-child {
    border-bottom: none;
  }
  
  .accordion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 20px 24px;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background 0.2s;
  }
  .accordion-header:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .icon {
    font-size: 16px;
    color: #3b82f6;
    opacity: 0.8;
  }
  .title {
    font-size: 15px;
    font-weight: 500;
    color: #fafafa;
  }
  
  .chevron {
    font-size: 20px;
    color: #52525b;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .expanded .chevron {
    transform: rotate(90deg);
    color: #3b82f6;
  }
  
  .accordion-content {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .expanded .accordion-content {
    grid-template-rows: 1fr;
  }
  
  .content-inner {
    overflow: hidden;
  }
  .content-inner p {
    margin: 0;
    padding: 0 24px 24px 54px;
    font-size: 14px;
    line-height: 1.6;
    color: #a1a1aa;
  }
</style>
```

---

### 3. Notification Toast Stack

Animated toast notifications with different states and auto-dismiss:

```svelte
<script>
  let toasts = $state([
    { id: 1, type: "success", title: "Saved successfully", message: "Your changes have been saved.", visible: true },
    { id: 2, type: "info", title: "Syncing...", message: "Uploading to cloud storage.", visible: true },
    { id: 3, type: "warning", title: "Low storage", message: "Only 2.1 GB remaining.", visible: true }
  ]);
  
  let nextId = 4;
  
  const typeStyles = {
    success: { icon: "✓", color: "#22c55e" },
    info: { icon: "●", color: "#3b82f6" },
    warning: { icon: "!", color: "#f59e0b" },
    error: { icon: "×", color: "#ef4444" }
  };
  
  function dismiss(id) {
    toasts = toasts.map(t => 
      t.id === id ? { ...t, visible: false } : t
    );
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 300);
  }
  
  function addToast(type) {
    const messages = {
      success: { title: "Action completed", message: "Everything worked as expected." },
      info: { title: "New update", message: "Version 2.1 is available." },
      warning: { title: "Check required", message: "Please review your settings." },
      error: { title: "Something went wrong", message: "Please try again later." }
    };
    toasts = [...toasts, { 
      id: nextId++, 
      type, 
      ...messages[type], 
      visible: true 
    }];
  }
</script>

<div class="demo-container">
  <div class="trigger-bar">
    <button class="trigger success" onclick={() => addToast('success')}>+ Success</button>
    <button class="trigger info" onclick={() => addToast('info')}>+ Info</button>
    <button class="trigger warning" onclick={() => addToast('warning')}>+ Warning</button>
    <button class="trigger error" onclick={() => addToast('error')}>+ Error</button>
  </div>
  
  <div class="toast-stack">
    {#each toasts as toast}
      <div 
        class="toast {toast.type}"
        class:exiting={!toast.visible}
      >
        <div class="toast-icon" style="color: {typeStyles[toast.type].color}">
          {typeStyles[toast.type].icon}
        </div>
        <div class="toast-content">
          <span class="toast-title">{toast.title}</span>
          <span class="toast-message">{toast.message}</span>
        </div>
        <button class="toast-dismiss" onclick={() => dismiss(toast.id)}>×</button>
      </div>
    {/each}
  </div>
</div>

<style>
  .demo-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .trigger-bar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .trigger {
    padding: 10px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: #a1a1aa;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .trigger:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fafafa;
  }
  .trigger.success:hover { border-color: #22c55e; }
  .trigger.info:hover { border-color: #3b82f6; }
  .trigger.warning:hover { border-color: #f59e0b; }
  .trigger.error:hover { border-color: #ef4444; }
  
  .toast-stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 380px;
  }
  
  .toast {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px 18px;
    background: #0f0f11;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .toast.exiting {
    opacity: 0;
    transform: translateX(20px);
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .toast-icon {
    font-size: 16px;
    font-weight: 700;
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 8px;
    flex-shrink: 0;
  }
  
  .toast-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .toast-title {
    font-size: 14px;
    font-weight: 500;
    color: #fafafa;
  }
  .toast-message {
    font-size: 13px;
    color: #71717a;
  }
  
  .toast-dismiss {
    background: none;
    border: none;
    color: #52525b;
    font-size: 18px;
    cursor: pointer;
    padding: 4px;
    margin: -4px;
    line-height: 1;
    transition: color 0.15s;
  }
  .toast-dismiss:hover {
    color: #a1a1aa;
  }
</style>
```

---

### 4. Interactive Slider Control

A custom range slider with value preview and snap points:

```svelte
<script>
  let value = $state(65);
  let isDragging = $state(false);
  let snapPoints = [0, 25, 50, 75, 100];
  
  function handleInput(e) {
    value = parseInt(e.target.value);
  }
  
  function snapToNearest() {
    if (!isDragging) {
      const nearest = snapPoints.reduce((prev, curr) => 
        Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
      );
      value = nearest;
    }
  }
  
  let valueLabel = $derived(
    value === 0 ? "Muted" :
    value < 25 ? "Quiet" :
    value < 50 ? "Moderate" :
    value < 75 ? "Loud" :
    value < 100 ? "Very Loud" : "Maximum"
  );
</script>

<div class="slider-container">
  <div class="slider-header">
    <span class="slider-label">Volume Level</span>
    <div class="value-display">
      <span class="value-number">{value}</span>
      <span class="value-unit">%</span>
    </div>
  </div>
  
  <div class="slider-track-container">
    <div class="slider-track">
      <div class="slider-fill" style="width: {value}%"></div>
      <div class="slider-thumb" style="left: {value}%">
        <div class="thumb-inner" class:active={isDragging}></div>
      </div>
    </div>
    <input 
      type="range" 
      min="0" 
      max="100" 
      value={value}
      oninput={handleInput}
      onmousedown={() => isDragging = true}
      onmouseup={() => { isDragging = false; snapToNearest(); }}
      ontouchstart={() => isDragging = true}
      ontouchend={() => { isDragging = false; snapToNearest(); }}
      class="slider-input"
    />
  </div>
  
  <div class="snap-points">
    {#each snapPoints as point}
      <button 
        class="snap-point"
        class:active={value === point}
        onclick={() => value = point}
      >
        {point}
      </button>
    {/each}
  </div>
  
  <div class="value-label">{valueLabel}</div>
</div>

<style>
  .slider-container {
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    padding: 28px;
    max-width: 360px;
  }
  
  .slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  .slider-label {
    font-size: 14px;
    font-weight: 500;
    color: #a1a1aa;
  }
  .value-display {
    display: flex;
    align-items: baseline;
    gap: 2px;
  }
  .value-number {
    font-size: 28px;
    font-weight: 200;
    font-family: 'SF Mono', monospace;
    color: #fafafa;
  }
  .value-unit {
    font-size: 14px;
    color: #52525b;
  }
  
  .slider-track-container {
    position: relative;
    height: 32px;
    margin-bottom: 20px;
  }
  
  .slider-track {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 6px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 3px;
    transform: translateY(-50%);
  }
  
  .slider-fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: linear-gradient(90deg, #3b82f6 0%, #6366f1 100%);
    border-radius: 3px;
    transition: width 0.1s;
  }
  
  .slider-thumb {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
    pointer-events: none;
  }
  
  .thumb-inner {
    width: 22px;
    height: 22px;
    background: #fafafa;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .thumb-inner.active {
    transform: scale(1.15);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }
  
  .slider-input {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    opacity: 0;
    cursor: pointer;
    margin: 0;
  }
  
  .snap-points {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .snap-point {
    background: none;
    border: none;
    color: #52525b;
    font-size: 11px;
    font-family: 'SF Mono', monospace;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 6px;
    transition: all 0.2s;
  }
  .snap-point:hover {
    color: #a1a1aa;
    background: rgba(255, 255, 255, 0.04);
  }
  .snap-point.active {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }
  
  .value-label {
    text-align: center;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #52525b;
  }
</style>
```

---

### 5. Context Menu

A floating context menu with icons, shortcuts, and dividers:

```svelte
<script>
  let isOpen = $state(true);
  let menuPosition = $state({ x: 80, y: 40 });
  let hoveredItem = $state(null);
  
  let menuItems = $state([
    { id: "cut", label: "Cut", icon: "✂", shortcut: "⌘X", action: () => console.log("Cut") },
    { id: "copy", label: "Copy", icon: "⧉", shortcut: "⌘C", action: () => console.log("Copy") },
    { id: "paste", label: "Paste", icon: "⎗", shortcut: "⌘V", action: () => console.log("Paste") },
    { id: "divider1", type: "divider" },
    { id: "duplicate", label: "Duplicate", icon: "❐", shortcut: "⌘D", action: () => console.log("Duplicate") },
    { id: "delete", label: "Delete", icon: "⌫", shortcut: "⌫", danger: true, action: () => console.log("Delete") },
    { id: "divider2", type: "divider" },
    { id: "properties", label: "Properties", icon: "⚙", shortcut: "⌘I", action: () => console.log("Properties") }
  ]);
  
  function handleClick(item) {
    if (item.action) {
      item.action();
      isOpen = false;
    }
  }
  
  function toggleMenu() {
    isOpen = !isOpen;
  }
</script>

<div class="context-demo">
  <button class="demo-trigger" onclick={toggleMenu}>
    {isOpen ? "Hide" : "Show"} Context Menu
  </button>
  
  {#if isOpen}
  <div 
    class="context-menu"
    style="left: {menuPosition.x}px; top: {menuPosition.y}px"
  >
    {#each menuItems as item}
      {#if item.type === "divider"}
        <div class="menu-divider"></div>
      {:else}
        <button 
          class="menu-item"
          class:danger={item.danger}
          class:hovered={hoveredItem === item.id}
          onclick={() => handleClick(item)}
          onmouseenter={() => hoveredItem = item.id}
          onmouseleave={() => hoveredItem = null}
        >
          <span class="item-icon">{item.icon}</span>
          <span class="item-label">{item.label}</span>
          <span class="item-shortcut">{item.shortcut}</span>
        </button>
      {/if}
    {/each}
  </div>
  {/if}
</div>

<style>
  .context-demo {
    position: relative;
    min-height: 340px;
    padding: 24px;
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 20px;
  }
  
  .demo-trigger {
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    color: #a1a1aa;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .demo-trigger:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fafafa;
  }
  
  .context-menu {
    position: absolute;
    min-width: 220px;
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 6px;
    box-shadow: 
      0 0 0 1px rgba(0, 0, 0, 0.5),
      0 16px 48px rgba(0, 0, 0, 0.5),
      0 4px 12px rgba(0, 0, 0, 0.3);
    animation: menuAppear 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes menuAppear {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  .menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 14px;
    background: none;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.1s;
    text-align: left;
  }
  .menu-item:hover,
  .menu-item.hovered {
    background: rgba(255, 255, 255, 0.06);
  }
  .menu-item.danger:hover {
    background: rgba(239, 68, 68, 0.12);
  }
  
  .item-icon {
    font-size: 14px;
    color: #71717a;
    width: 18px;
    text-align: center;
  }
  .menu-item:hover .item-icon {
    color: #a1a1aa;
  }
  .menu-item.danger .item-icon {
    color: #f87171;
  }
  
  .item-label {
    flex: 1;
    font-size: 14px;
    color: #e4e4e7;
  }
  .menu-item.danger .item-label {
    color: #f87171;
  }
  
  .item-shortcut {
    font-size: 12px;
    color: #52525b;
    font-family: system-ui;
  }
  
  .menu-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.06);
    margin: 6px 8px;
  }
</style>
```

---

## Design Principles

### 1. **Contrast Through Subtlety**
We don't need stark whites. The gentlest differentiation—2-4% opacity changes—creates hierarchy without harshness.

### 2. **Animation With Purpose**
Every motion tells a story. Cubic bezier curves `(0.4, 0, 0.2, 1)` for natural deceleration. 150-300ms for micro-interactions.

### 3. **Touch-Friendly Targets**
Minimum 44px touch targets. Generous padding. Forgiving hit areas.

### 4. **Type Hierarchy**
- 11px: Labels, hints, shortcuts
- 13-14px: Body text
- 15-16px: Titles, emphasis
- 20px+: Display, metrics

---

## Color Reference

```css
/* Backgrounds */
--bg-void:       #09090b;      /* Deepest black */
--bg-surface:    #0c0c0e;      /* Raised surfaces */
--bg-elevated:   #111113;      /* Modals, popovers */
--bg-subtle:     rgba(255, 255, 255, 0.02);

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.04);
--border-muted:  rgba(255, 255, 255, 0.06);
--border-default: rgba(255, 255, 255, 0.08);
--border-strong: rgba(255, 255, 255, 0.12);

/* Text */
--text-primary:   #fafafa;
--text-secondary: #a1a1aa;
--text-muted:     #71717a;
--text-subtle:    #52525b;

/* Accents */
--accent:         #3b82f6;
--accent-hover:   #60a5fa;
--success:        #22c55e;
--warning:        #f59e0b;
--danger:         #ef4444;
```

---

> *"Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away."* — Antoine de Saint-Exupéry

---

*Built with Zef ◆*
