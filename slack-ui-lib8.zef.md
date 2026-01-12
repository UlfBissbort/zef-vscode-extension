# Slack UI Library II ◈

**Sidebar & Navigation** — The workspace architecture.

---

## Introduction

This collection provides the essential sidebar and navigation components for building a Slack-like workspace. From workspace switching to user presence, these elements form the structural backbone of team communication.

---

## Component Collection

Seven navigation and sidebar components for workspace organization.

---

### 1. Workspace Switcher

Multi-workspace selector with logos:

```svelte
<script>
  let workspaces = $state([
    { id: 1, name: 'Acme Inc', initials: 'AI', color: '#6366f1', unread: 3 },
    { id: 2, name: 'Design Team', initials: 'DT', color: '#ec4899', unread: 0 },
    { id: 3, name: 'Open Source', initials: 'OS', color: '#22c55e', unread: 12 }
  ]);
  
  let activeWorkspace = $state(1);
  let showTooltip = $state(null);
  
  function selectWorkspace(id) {
    activeWorkspace = id;
    workspaces = workspaces.map(w => 
      w.id === id ? { ...w, unread: 0 } : w
    );
  }
</script>

<div class="workspace-rail">
  {#each workspaces as workspace}
    <div class="workspace-wrapper">
      <button
        class="workspace-btn"
        class:active={activeWorkspace === workspace.id}
        style="--accent: {workspace.color}"
        onclick={() => selectWorkspace(workspace.id)}
        onmouseenter={() => showTooltip = workspace.id}
        onmouseleave={() => showTooltip = null}
      >
        <span class="workspace-initials">{workspace.initials}</span>
        {#if workspace.unread > 0}
          <span class="unread-dot"></span>
        {/if}
      </button>
      
      {#if showTooltip === workspace.id}
        <div class="workspace-tooltip">
          {workspace.name}
          {#if workspace.unread > 0}
            <span class="tooltip-badge">{workspace.unread}</span>
          {/if}
        </div>
      {/if}
    </div>
  {/each}
  
  <button class="add-workspace-btn">
    <span>+</span>
  </button>
</div>

<style>
  .workspace-rail {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 16px 12px;
    background: #09090b;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .workspace-wrapper {
    position: relative;
  }
  
  .workspace-btn {
    position: relative;
    width: 48px;
    height: 48px;
    background: linear-gradient(145deg, #1a1a1d, #111113);
    border: 2px solid transparent;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .workspace-btn:hover {
    border-radius: 12px;
    transform: translateY(-2px);
  }
  
  .workspace-btn.active {
    background: var(--accent);
    border-radius: 12px;
    box-shadow: 0 4px 16px color-mix(in srgb, var(--accent) 40%, transparent);
  }
  
  .workspace-initials {
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
  }
  
  .unread-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    background: #ef4444;
    border: 2px solid #09090b;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  
  .workspace-tooltip {
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-left: 12px;
    padding: 8px 12px;
    background: #1a1a1d;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 500;
    color: #fff;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: fadeIn 0.15s ease;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 100;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-50%) translateX(-8px); }
    to { opacity: 1; transform: translateY(-50%) translateX(0); }
  }
  
  .tooltip-badge {
    padding: 2px 6px;
    background: #ef4444;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 700;
  }
  
  .add-workspace-btn {
    width: 48px;
    height: 48px;
    background: transparent;
    border: 2px dashed rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    color: rgba(255, 255, 255, 0.4);
    font-size: 1.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .add-workspace-btn:hover {
    border-color: rgba(255, 255, 255, 0.3);
    color: #fff;
    border-radius: 12px;
  }
</style>
```

---

### 2. User Presence Status

Online status indicator with dropdown:

```svelte
<script>
  let status = $state('online');
  let customStatus = $state('');
  let showDropdown = $state(false);
  
  const statuses = [
    { id: 'online', label: 'Active', color: '#22c55e', icon: '●' },
    { id: 'away', label: 'Away', color: '#eab308', icon: '○' },
    { id: 'dnd', label: 'Do Not Disturb', color: '#ef4444', icon: '⊘' },
    { id: 'offline', label: 'Invisible', color: '#6b7280', icon: '○' }
  ];
  
  const quickStatuses = [
    { emoji: '🏠', text: 'Working remotely' },
    { emoji: '🗓️', text: 'In a meeting' },
    { emoji: '🎧', text: 'Focusing' }
  ];
  
  function setStatus(id) {
    status = id;
    showDropdown = false;
  }
  
  function setQuickStatus(qs) {
    customStatus = `${qs.emoji} ${qs.text}`;
    showDropdown = false;
  }
  
  const currentStatus = $derived(statuses.find(s => s.id === status));
</script>

<div class="presence-container">
  <button 
    class="presence-trigger"
    onclick={() => showDropdown = !showDropdown}
  >
    <div class="user-avatar">
      <span class="avatar-initials">ME</span>
      <span class="status-badge" style="--status-color: {currentStatus.color}"></span>
    </div>
    
    <div class="user-info">
      <span class="user-name">You</span>
      <span class="user-status">
        {#if customStatus}
          {customStatus}
        {:else}
          {currentStatus.label}
        {/if}
      </span>
    </div>
    
    <span class="dropdown-arrow" class:open={showDropdown}>▾</span>
  </button>
  
  {#if showDropdown}
    <div class="presence-dropdown">
      <div class="dropdown-section">
        <span class="section-label">Set status</span>
        {#each statuses as s}
          <button 
            class="status-option"
            class:active={status === s.id}
            onclick={() => setStatus(s.id)}
          >
            <span class="status-icon" style="color: {s.color}">{s.icon}</span>
            <span class="status-label">{s.label}</span>
            {#if status === s.id}
              <span class="check-mark">✓</span>
            {/if}
          </button>
        {/each}
      </div>
      
      <div class="divider"></div>
      
      <div class="dropdown-section">
        <span class="section-label">Quick status</span>
        {#each quickStatuses as qs}
          <button 
            class="quick-status-option"
            onclick={() => setQuickStatus(qs)}
          >
            <span class="quick-emoji">{qs.emoji}</span>
            <span class="quick-text">{qs.text}</span>
          </button>
        {/each}
      </div>
      
      {#if customStatus}
        <div class="divider"></div>
        <button class="clear-status-btn" onclick={() => customStatus = ''}>
          Clear status
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .presence-container {
    position: relative;
  }
  
  .presence-trigger {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 14px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .presence-trigger:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .user-avatar {
    position: relative;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
  }
  
  .avatar-initials {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    color: #fff;
  }
  
  .status-badge {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    background: var(--status-color);
    border: 2px solid #0c0c0e;
    border-radius: 50%;
  }
  
  .user-info {
    flex: 1;
    text-align: left;
    min-width: 0;
  }
  
  .user-name {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
  }
  
  .user-status {
    display: block;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .dropdown-arrow {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.8rem;
    transition: transform 0.2s ease;
  }
  
  .dropdown-arrow.open {
    transform: rotate(180deg);
  }
  
  .presence-dropdown {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    margin-bottom: 8px;
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    overflow: hidden;
    animation: slideUp 0.2s ease;
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.4);
    z-index: 100;
  }
  
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .dropdown-section {
    padding: 8px;
  }
  
  .section-label {
    display: block;
    padding: 6px 10px 4px;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.06);
  }
  
  .status-option,
  .quick-status-option {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    background: none;
    border: none;
    border-radius: 8px;
    text-align: left;
    cursor: pointer;
    transition: background 0.1s ease;
  }
  
  .status-option:hover,
  .quick-status-option:hover {
    background: rgba(255, 255, 255, 0.06);
  }
  
  .status-option.active {
    background: rgba(99, 102, 241, 0.1);
  }
  
  .status-icon {
    font-size: 0.8rem;
  }
  
  .status-label {
    flex: 1;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .check-mark {
    color: #6366f1;
    font-size: 0.9rem;
  }
  
  .quick-emoji {
    font-size: 1rem;
  }
  
  .quick-text {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .clear-status-btn {
    width: 100%;
    padding: 12px;
    background: none;
    border: none;
    font-size: 0.85rem;
    color: #ef4444;
    cursor: pointer;
    transition: background 0.1s ease;
  }
  
  .clear-status-btn:hover {
    background: rgba(239, 68, 68, 0.1);
  }
</style>
```

---

### 3. Collapsible Section

Sidebar section with expand/collapse:

```svelte
<script>
  let isExpanded = $state(true);
  
  const directMessages = [
    { name: 'Alice Chen', status: 'online', lastMessage: 'Sounds good!' },
    { name: 'Bob Smith', status: 'away', lastMessage: 'Let me check...' },
    { name: 'Carol Jones', status: 'offline', lastMessage: 'Thanks for the update' },
    { name: 'Dan Lee', status: 'dnd', lastMessage: 'On vacation 🏖️' }
  ];
  
  const statusColors = {
    online: '#22c55e',
    away: '#eab308',
    dnd: '#ef4444',
    offline: '#6b7280'
  };
</script>

<div class="sidebar-section">
  <button 
    class="section-header"
    onclick={() => isExpanded = !isExpanded}
  >
    <span class="expand-icon" class:rotated={!isExpanded}>▾</span>
    <span class="section-title">Direct Messages</span>
    <span class="section-count">{directMessages.length}</span>
  </button>
  
  <div class="section-content" class:collapsed={!isExpanded}>
    <div class="content-inner">
      {#each directMessages as dm, i}
        <button class="dm-item" style="--delay: {i * 30}ms">
          <div class="dm-avatar">
            <span class="avatar-initial">{dm.name[0]}</span>
            <span class="dm-status" style="--color: {statusColors[dm.status]}"></span>
          </div>
          <div class="dm-info">
            <span class="dm-name">{dm.name}</span>
            <span class="dm-preview">{dm.lastMessage}</span>
          </div>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .sidebar-section {
    max-width: 260px;
  }
  
  .section-header {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 10px 14px;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .section-header:hover {
    background: rgba(255, 255, 255, 0.03);
  }
  
  .expand-icon {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.4);
    transition: transform 0.2s ease;
  }
  
  .expand-icon.rotated {
    transform: rotate(-90deg);
  }
  
  .section-title {
    flex: 1;
    text-align: left;
    font-size: 0.85rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .section-count {
    padding: 2px 8px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .section-content {
    display: grid;
    grid-template-rows: 1fr;
    transition: grid-template-rows 0.25s ease;
  }
  
  .section-content.collapsed {
    grid-template-rows: 0fr;
  }
  
  .content-inner {
    overflow: hidden;
    padding: 0 8px;
  }
  
  .dm-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 10px;
    background: none;
    border: none;
    border-radius: 8px;
    text-align: left;
    cursor: pointer;
    opacity: 1;
    transform: translateX(0);
    transition: all 0.15s ease, opacity 0.25s ease var(--delay), transform 0.25s ease var(--delay);
  }
  
  .section-content.collapsed .dm-item {
    opacity: 0;
    transform: translateX(-10px);
  }
  
  .dm-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .dm-avatar {
    position: relative;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  }
  
  .avatar-initial {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #374151, #4b5563);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: #fff;
  }
  
  .dm-status {
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 10px;
    height: 10px;
    background: var(--color);
    border: 2px solid #0c0c0e;
    border-radius: 50%;
  }
  
  .dm-info {
    flex: 1;
    min-width: 0;
  }
  
  .dm-name {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    color: #fff;
  }
  
  .dm-preview {
    display: block;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
```

---

### 4. Quick Switcher

Command palette for navigation:

```svelte
<script>
  let isOpen = $state(true);
  let query = $state('');
  let selectedIndex = $state(0);
  
  const items = [
    { type: 'channel', name: 'general', icon: '#' },
    { type: 'channel', name: 'design', icon: '#' },
    { type: 'channel', name: 'dev-team', icon: '#' },
    { type: 'dm', name: 'Alice Chen', icon: '●' },
    { type: 'dm', name: 'Bob Smith', icon: '●' }
  ];
  
  const filteredItems = $derived(
    query.length > 0
      ? items.filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
      : items
  );
  
  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filteredItems.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      console.log('Navigate to:', filteredItems[selectedIndex].name);
      isOpen = false;
    } else if (e.key === 'Escape') {
      isOpen = false;
    }
  }
  
  $effect(() => {
    if (query) selectedIndex = 0;
  });
</script>

{#if isOpen}
  <div class="switcher-overlay" onclick={() => isOpen = false}>
    <div class="switcher-modal" onclick={(e) => e.stopPropagation()}>
      <div class="switcher-input-wrapper">
        <span class="search-icon">⌘</span>
        <input
          type="text"
          placeholder="Jump to..."
          bind:value={query}
          onkeydown={handleKeyDown}
        />
        <span class="hint">↑↓ to navigate</span>
      </div>
      
      <div class="switcher-results">
        {#each filteredItems as item, i}
          <button 
            class="result-item"
            class:selected={selectedIndex === i}
            onmouseenter={() => selectedIndex = i}
          >
            <span class="result-icon" class:dm={item.type === 'dm'}>
              {item.icon}
            </span>
            <span class="result-name">{item.name}</span>
            <span class="result-type">{item.type === 'dm' ? 'Direct message' : 'Channel'}</span>
          </button>
        {/each}
        
        {#if filteredItems.length === 0}
          <div class="no-results">
            <span class="no-results-icon">🔍</span>
            <span class="no-results-text">No results found</span>
          </div>
        {/if}
      </div>
      
      <div class="switcher-footer">
        <span class="shortcut"><kbd>↵</kbd> Open</span>
        <span class="shortcut"><kbd>esc</kbd> Close</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .switcher-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 15vh;
    z-index: 1000;
    animation: fadeIn 0.15s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .switcher-modal {
    width: 100%;
    max-width: 560px;
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    overflow: hidden;
    animation: slideDown 0.2s ease;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
  }
  
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-20px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  
  .switcher-input-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .search-icon {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .switcher-input-wrapper input {
    flex: 1;
    background: none;
    border: none;
    font-size: 1.1rem;
    color: #fff;
    outline: none;
  }
  
  .switcher-input-wrapper input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  .hint {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.3);
  }
  
  .switcher-results {
    max-height: 320px;
    overflow-y: auto;
    padding: 8px;
  }
  
  .result-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 14px;
    background: none;
    border: none;
    border-radius: 10px;
    text-align: left;
    cursor: pointer;
    transition: all 0.1s ease;
  }
  
  .result-item:hover,
  .result-item.selected {
    background: rgba(99, 102, 241, 0.15);
  }
  
  .result-icon {
    font-size: 1.1rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .result-icon.dm {
    color: #22c55e;
    font-size: 0.6rem;
  }
  
  .result-name {
    flex: 1;
    font-size: 0.95rem;
    font-weight: 500;
    color: #fff;
  }
  
  .result-type {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.35);
  }
  
  .no-results {
    padding: 32px;
    text-align: center;
  }
  
  .no-results-icon {
    font-size: 2rem;
    opacity: 0.3;
    display: block;
    margin-bottom: 8px;
  }
  
  .no-results-text {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .switcher-footer {
    display: flex;
    gap: 20px;
    padding: 12px 20px;
    background: rgba(0, 0, 0, 0.3);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .shortcut {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .shortcut kbd {
    padding: 2px 6px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
  }
</style>
```

---

### 5. Channel Header

Channel info bar with actions:

```svelte
<script>
  let isPinned = $state(false);
  let memberCount = $state(24);
  let showInfo = $state(false);
</script>

<div class="channel-header">
  <div class="channel-info">
    <div class="channel-title">
      <span class="channel-hash">#</span>
      <h2 class="channel-name">design-system</h2>
      <button 
        class="pin-btn" 
        class:pinned={isPinned}
        onclick={() => isPinned = !isPinned}
        title={isPinned ? 'Unpin channel' : 'Pin channel'}
      >
        📌
      </button>
    </div>
    
    <button 
      class="channel-topic"
      onclick={() => showInfo = !showInfo}
    >
      <span class="topic-text">Building the next generation design system for our product</span>
      <span class="expand-hint">▾</span>
    </button>
  </div>
  
  <div class="channel-actions">
    <button class="action-btn members" title="Members">
      <span class="icon">👥</span>
      <span class="count">{memberCount}</span>
    </button>
    
    <button class="action-btn" title="Pinned messages">
      <span class="icon">📌</span>
    </button>
    
    <div class="action-divider"></div>
    
    <button class="action-btn" title="Huddle">
      <span class="icon">🎧</span>
    </button>
    
    <button class="action-btn" title="Canvas">
      <span class="icon">📝</span>
    </button>
    
    <button 
      class="action-btn info-toggle"
      class:active={showInfo}
      onclick={() => showInfo = !showInfo}
      title="Show channel details"
    >
      <span class="icon">ℹ</span>
    </button>
  </div>
</div>

<style>
  .channel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 12px 20px;
    background: #0c0c0e;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .channel-info {
    flex: 1;
    min-width: 0;
  }
  
  .channel-title {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .channel-hash {
    font-size: 1.2rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .channel-name {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
  }
  
  .pin-btn {
    background: none;
    border: none;
    font-size: 0.85rem;
    opacity: 0.3;
    cursor: pointer;
    transition: all 0.15s ease;
    transform: rotate(0deg);
  }
  
  .pin-btn:hover {
    opacity: 0.7;
  }
  
  .pin-btn.pinned {
    opacity: 1;
    transform: rotate(45deg);
  }
  
  .channel-topic {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    background: none;
    border: none;
    cursor: pointer;
    max-width: 400px;
  }
  
  .topic-text {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.45);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
    transition: color 0.15s ease;
  }
  
  .channel-topic:hover .topic-text {
    color: rgba(255, 255, 255, 0.7);
  }
  
  .expand-hint {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.3);
    flex-shrink: 0;
  }
  
  .channel-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    background: none;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.1s ease;
  }
  
  .action-btn:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  
  .action-btn.active {
    background: rgba(99, 102, 241, 0.15);
  }
  
  .action-btn .icon {
    font-size: 0.95rem;
  }
  
  .action-btn.members {
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 20px;
  }
  
  .action-btn .count {
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .action-divider {
    width: 1px;
    height: 24px;
    background: rgba(255, 255, 255, 0.08);
    margin: 0 4px;
  }
  
  .info-toggle .icon {
    color: rgba(255, 255, 255, 0.7);
    transition: color 0.15s ease;
  }
  
  .info-toggle.active .icon {
    color: #6366f1;
  }
</style>
```

---

### 6. App Launcher

Integrated apps menu:

```svelte
<script>
  let showApps = $state(false);
  
  const apps = [
    { name: 'Jira', icon: '📋', color: '#0052cc' },
    { name: 'GitHub', icon: '🐙', color: '#333' },
    { name: 'Figma', icon: '🎨', color: '#f24e1e' },
    { name: 'Google Drive', icon: '📁', color: '#4285f4' },
    { name: 'Notion', icon: '📓', color: '#fff' },
    { name: 'Zoom', icon: '📹', color: '#2d8cff' }
  ];
</script>

<div class="app-launcher">
  <button 
    class="launcher-trigger"
    class:active={showApps}
    onclick={() => showApps = !showApps}
  >
    <span class="grid-icon">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </span>
  </button>
  
  {#if showApps}
    <div class="apps-dropdown">
      <div class="dropdown-header">
        <span class="header-title">Apps</span>
        <button class="browse-btn">Browse all</button>
      </div>
      
      <div class="apps-grid">
        {#each apps as app, i}
          <button 
            class="app-item"
            style="--delay: {i * 30}ms"
          >
            <div class="app-icon" style="--bg: {app.color}">
              {app.icon}
            </div>
            <span class="app-name">{app.name}</span>
          </button>
        {/each}
      </div>
      
      <div class="dropdown-footer">
        <button class="manage-btn">
          <span>⚙</span>
          Manage apps
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .app-launcher {
    position: relative;
  }
  
  .launcher-trigger {
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .launcher-trigger:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .launcher-trigger.active {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.3);
  }
  
  .grid-icon {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 3px;
  }
  
  .dot {
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 1px;
    transition: all 0.15s ease;
  }
  
  .launcher-trigger:hover .dot {
    background: #fff;
  }
  
  .apps-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    width: 280px;
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    overflow: hidden;
    animation: popIn 0.2s ease;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    z-index: 100;
  }
  
  @keyframes popIn {
    from { opacity: 0; transform: translateY(-8px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  
  .dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .header-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
  }
  
  .browse-btn {
    font-size: 0.75rem;
    color: #6366f1;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.15s ease;
  }
  
  .browse-btn:hover {
    color: #818cf8;
  }
  
  .apps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding: 16px;
  }
  
  .app-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px 8px;
    background: none;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
    opacity: 0;
    animation: fadeIn 0.2s ease forwards;
    animation-delay: var(--delay);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  
  .app-item:hover {
    background: rgba(255, 255, 255, 0.06);
  }
  
  .app-icon {
    width: 44px;
    height: 44px;
    background: var(--bg);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    transition: transform 0.15s ease;
  }
  
  .app-item:hover .app-icon {
    transform: scale(1.08);
  }
  
  .app-name {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.7);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  
  .dropdown-footer {
    padding: 12px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .manage-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 12px;
    background: none;
    border: none;
    border-radius: 8px;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.1s ease;
  }
  
  .manage-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
</style>
```

---

### 7. Bookmark Bar

Saved items and links:

```svelte
<script>
  let bookmarks = $state([
    { id: 1, type: 'message', title: 'API Documentation link', channel: '#dev' },
    { id: 2, type: 'file', title: 'Q4 Planning.pdf', channel: '#general' },
    { id: 3, type: 'link', title: 'Figma - Design System', channel: '#design' }
  ]);
  
  let showAll = $state(false);
  
  function removeBookmark(id) {
    bookmarks = bookmarks.filter(b => b.id !== id);
  }
  
  const icons = {
    message: '💬',
    file: '📄',
    link: '🔗'
  };
</script>

<div class="bookmark-bar">
  <div class="bookmark-header">
    <span class="bookmark-icon">🔖</span>
    <span class="bookmark-title">Saved Items</span>
    <span class="bookmark-count">{bookmarks.length}</span>
  </div>
  
  <div class="bookmark-list">
    {#each bookmarks.slice(0, showAll ? bookmarks.length : 2) as bookmark}
      <div class="bookmark-item">
        <span class="item-icon">{icons[bookmark.type]}</span>
        <div class="item-content">
          <span class="item-title">{bookmark.title}</span>
          <span class="item-channel">{bookmark.channel}</span>
        </div>
        <button 
          class="remove-btn"
          onclick={() => removeBookmark(bookmark.id)}
        >
          ✕
        </button>
      </div>
    {/each}
  </div>
  
  {#if bookmarks.length > 2}
    <button 
      class="show-more-btn"
      onclick={() => showAll = !showAll}
    >
      {showAll ? 'Show less' : `Show ${bookmarks.length - 2} more`}
    </button>
  {/if}
</div>

<style>
  .bookmark-bar {
    max-width: 280px;
    padding: 12px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
  }
  
  .bookmark-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px 12px;
  }
  
  .bookmark-icon {
    font-size: 0.9rem;
  }
  
  .bookmark-title {
    flex: 1;
    font-size: 0.85rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .bookmark-count {
    padding: 2px 8px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .bookmark-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .bookmark-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 10px;
    transition: background 0.15s ease;
  }
  
  .bookmark-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .item-icon {
    font-size: 0.95rem;
  }
  
  .item-content {
    flex: 1;
    min-width: 0;
  }
  
  .item-title {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .item-channel {
    display: block;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .remove-btn {
    width: 24px;
    height: 24px;
    background: none;
    border: none;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.3);
    font-size: 0.7rem;
    cursor: pointer;
    opacity: 0;
    transition: all 0.15s ease;
  }
  
  .bookmark-item:hover .remove-btn {
    opacity: 1;
  }
  
  .remove-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  
  .show-more-btn {
    width: 100%;
    padding: 10px;
    margin-top: 8px;
    background: none;
    border: 1px dashed rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .show-more-btn:hover {
    border-color: rgba(255, 255, 255, 0.2);
    color: #fff;
    background: rgba(255, 255, 255, 0.02);
  }
</style>
```

---

## Summary

This collection provides sidebar and navigation components:

1. **Workspace Switcher** — Multi-workspace navigation rail
2. **User Presence Status** — Online status with quick status picker
3. **Collapsible Section** — Expandable sidebar sections
4. **Quick Switcher** — Command palette for navigation
5. **Channel Header** — Channel info and actions bar
6. **App Launcher** — Integrated apps grid menu
7. **Bookmark Bar** — Saved items and links manager

---

*Navigation is architecture. Build pathways that guide teams home.*
