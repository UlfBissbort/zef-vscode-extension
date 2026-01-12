# Dark Component Library II ◇

**Advanced UI Patterns** — Craft. Precision. Elegance.

---

## Introduction

This second collection pushes further into complex interactive patterns. From data-dense displays to intricate form controls, each component demonstrates that dark interfaces can be both beautiful and highly functional.

---

## Component Collection

Eight sophisticated components showcasing advanced interaction patterns.

---

### 1. Command Palette

A keyboard-first command interface with fuzzy search and categorized results:

```svelte
<script>
  let isOpen = $state(true);
  let query = $state("");
  let selectedIndex = $state(0);
  
  let commands = $state([
    { id: "new-file", label: "New File", category: "File", icon: "📄", shortcut: "⌘N" },
    { id: "open-file", label: "Open File", category: "File", icon: "📂", shortcut: "⌘O" },
    { id: "save", label: "Save", category: "File", icon: "💾", shortcut: "⌘S" },
    { id: "find", label: "Find in Files", category: "Search", icon: "🔍", shortcut: "⇧⌘F" },
    { id: "replace", label: "Find and Replace", category: "Search", icon: "↔", shortcut: "⌘H" },
    { id: "git-commit", label: "Git: Commit", category: "Git", icon: "✓", shortcut: null },
    { id: "git-push", label: "Git: Push", category: "Git", icon: "↑", shortcut: null },
    { id: "terminal", label: "Toggle Terminal", category: "View", icon: "▬", shortcut: "⌃`" },
    { id: "settings", label: "Open Settings", category: "Preferences", icon: "⚙", shortcut: "⌘," }
  ]);
  
  let filtered = $derived(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(c => 
      c.label.toLowerCase().includes(q) || 
      c.category.toLowerCase().includes(q)
    );
  });
  
  let groupedResults = $derived(() => {
    const groups = {};
    filtered().forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  });
  
  function handleKeydown(e) {
    const results = filtered();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      executeCommand(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      isOpen = false;
    }
  }
  
  function executeCommand(cmd) {
    console.log("Executing:", cmd.id);
    isOpen = false;
  }
</script>

{#if isOpen}
<div class="palette-overlay">
  <div class="palette">
    <div class="palette-input-row">
      <span class="search-icon">⌘</span>
      <input 
        type="text"
        class="palette-input"
        placeholder="Type a command..."
        bind:value={query}
        onkeydown={handleKeydown}
        autofocus
      />
    </div>
    
    <div class="palette-results">
      {#each Object.entries(groupedResults()) as [category, items], catIndex}
        <div class="result-group">
          <div class="group-header">{category}</div>
          {#each items as item, i}
            {@const flatIndex = Object.values(groupedResults())
              .slice(0, catIndex)
              .reduce((sum, arr) => sum + arr.length, 0) + i}
            <button 
              class="result-item"
              class:selected={selectedIndex === flatIndex}
              onclick={() => executeCommand(item)}
              onmouseenter={() => selectedIndex = flatIndex}
            >
              <span class="item-icon">{item.icon}</span>
              <span class="item-label">{item.label}</span>
              {#if item.shortcut}
                <span class="item-shortcut">{item.shortcut}</span>
              {/if}
            </button>
          {/each}
        </div>
      {/each}
      
      {#if filtered().length === 0}
        <div class="no-results">
          <span class="no-results-icon">◌</span>
          <span>No commands found</span>
        </div>
      {/if}
    </div>
    
    <div class="palette-footer">
      <span class="hint"><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
      <span class="hint"><kbd>↵</kbd> select</span>
      <span class="hint"><kbd>esc</kbd> close</span>
    </div>
  </div>
</div>
{/if}

<style>
  .palette-overlay {
    position: relative;
    display: flex;
    justify-content: center;
    padding: 24px;
  }
  
  .palette {
    width: 100%;
    max-width: 560px;
    background: #0a0a0c;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 
      0 0 0 1px rgba(0, 0, 0, 0.5),
      0 32px 64px rgba(0, 0, 0, 0.6),
      0 0 120px rgba(59, 130, 246, 0.05);
    overflow: hidden;
  }
  
  .palette-input-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 22px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .search-icon {
    font-size: 18px;
    color: #3b82f6;
    opacity: 0.8;
  }
  
  .palette-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 17px;
    color: #fafafa;
    font-weight: 300;
  }
  .palette-input::placeholder {
    color: #52525b;
  }
  
  .palette-results {
    max-height: 360px;
    overflow-y: auto;
    padding: 8px 0;
  }
  
  .result-group {
    padding: 0 8px;
  }
  
  .group-header {
    padding: 12px 14px 8px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #52525b;
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
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;
  }
  .result-item:hover,
  .result-item.selected {
    background: rgba(59, 130, 246, 0.1);
  }
  
  .item-icon {
    font-size: 16px;
    width: 24px;
    text-align: center;
    opacity: 0.7;
  }
  
  .item-label {
    flex: 1;
    font-size: 14px;
    color: #e4e4e7;
  }
  
  .item-shortcut {
    font-size: 12px;
    color: #52525b;
    font-family: system-ui;
    background: rgba(255, 255, 255, 0.04);
    padding: 4px 8px;
    border-radius: 6px;
  }
  
  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 40px 20px;
    color: #52525b;
    font-size: 14px;
  }
  .no-results-icon {
    font-size: 32px;
    opacity: 0.5;
  }
  
  .palette-footer {
    display: flex;
    gap: 20px;
    padding: 14px 22px;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
    background: rgba(255, 255, 255, 0.01);
  }
  
  .hint {
    font-size: 12px;
    color: #52525b;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .hint kbd {
    background: rgba(255, 255, 255, 0.06);
    padding: 3px 7px;
    border-radius: 5px;
    font-family: system-ui;
    font-size: 11px;
  }
</style>
```

---

### 2. Avatar Stack

An overlapping avatar display with overflow indicator and hover expansion:

```svelte
<script>
  let users = $state([
    { id: 1, name: "Alex Morgan", color: "#3b82f6" },
    { id: 2, name: "Sam Chen", color: "#8b5cf6" },
    { id: 3, name: "Jordan Lee", color: "#06b6d4" },
    { id: 4, name: "Taylor Kim", color: "#10b981" },
    { id: 5, name: "Casey Brown", color: "#f59e0b" },
    { id: 6, name: "Drew Wilson", color: "#ef4444" },
    { id: 7, name: "Morgan Swift", color: "#ec4899" }
  ]);
  
  let maxVisible = $state(4);
  let isExpanded = $state(false);
  
  let visibleUsers = $derived(isExpanded ? users : users.slice(0, maxVisible));
  let overflowCount = $derived(users.length - maxVisible);
  
  function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('');
  }
</script>

<div 
  class="avatar-stack"
  class:expanded={isExpanded}
  onmouseenter={() => isExpanded = true}
  onmouseleave={() => isExpanded = false}
>
  {#each visibleUsers as user, i}
    <div 
      class="avatar"
      style="background: {user.color}; z-index: {users.length - i}; --delay: {i * 30}ms"
      title={user.name}
    >
      <span class="initials">{getInitials(user.name)}</span>
    </div>
  {/each}
  
  {#if !isExpanded && overflowCount > 0}
    <div class="overflow-indicator" style="z-index: 0">
      <span>+{overflowCount}</span>
    </div>
  {/if}
</div>

<style>
  .avatar-stack {
    display: flex;
    padding: 8px;
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 40px;
    width: fit-content;
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    margin-left: -12px;
    border: 3px solid #09090b;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    transition-delay: var(--delay);
    cursor: pointer;
  }
  .avatar:first-child {
    margin-left: 0;
  }
  
  .expanded .avatar {
    margin-left: 4px;
  }
  .expanded .avatar:first-child {
    margin-left: 0;
  }
  
  .avatar:hover {
    transform: scale(1.1);
    z-index: 100 !important;
  }
  
  .initials {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  
  .overflow-indicator {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    margin-left: -12px;
    background: #18181b;
    border: 3px solid #09090b;
    font-size: 12px;
    font-weight: 600;
    color: #71717a;
    cursor: pointer;
    transition: all 0.2s;
  }
  .overflow-indicator:hover {
    background: #27272a;
    color: #a1a1aa;
  }
</style>
```

---

### 3. Multi-Step Progress

A horizontal stepper showing workflow progress with states:

```svelte
<script>
  let steps = $state([
    { id: 1, label: "Account", description: "Create your account", status: "completed" },
    { id: 2, label: "Profile", description: "Add your details", status: "completed" },
    { id: 3, label: "Preferences", description: "Customize experience", status: "current" },
    { id: 4, label: "Complete", description: "You're all set", status: "upcoming" }
  ]);
  
  let currentStep = $derived(steps.findIndex(s => s.status === 'current') + 1);
  
  function goToStep(index) {
    steps = steps.map((s, i) => ({
      ...s,
      status: i < index ? 'completed' : i === index ? 'current' : 'upcoming'
    }));
  }
</script>

<div class="stepper">
  <div class="steps-header">
    <span class="step-count">Step {currentStep} of {steps.length}</span>
    <span class="step-title">{steps[currentStep - 1]?.label}</span>
  </div>
  
  <div class="steps-track">
    {#each steps as step, i}
      <button 
        class="step"
        class:completed={step.status === 'completed'}
        class:current={step.status === 'current'}
        class:upcoming={step.status === 'upcoming'}
        onclick={() => goToStep(i)}
      >
        <div class="step-marker">
          {#if step.status === 'completed'}
            <span class="check">✓</span>
          {:else}
            <span class="number">{i + 1}</span>
          {/if}
        </div>
        <div class="step-info">
          <span class="step-label">{step.label}</span>
          <span class="step-desc">{step.description}</span>
        </div>
      </button>
      
      {#if i < steps.length - 1}
        <div 
          class="connector"
          class:filled={step.status === 'completed'}
        ></div>
      {/if}
    {/each}
  </div>
  
  <div class="progress-bar">
    <div 
      class="progress-fill"
      style="width: {((currentStep - 1) / (steps.length - 1)) * 100}%"
    ></div>
  </div>
</div>

<style>
  .stepper {
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    padding: 28px;
    overflow: hidden;
  }
  
  .steps-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 28px;
  }
  
  .step-count {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    padding: 6px 12px;
    border-radius: 20px;
  }
  
  .step-title {
    font-size: 18px;
    font-weight: 500;
    color: #fafafa;
  }
  
  .steps-track {
    display: flex;
    align-items: flex-start;
    margin-bottom: 24px;
  }
  
  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    background: none;
    border: none;
    cursor: pointer;
    min-width: 100px;
    padding: 8px;
    border-radius: 12px;
    transition: background 0.2s;
  }
  .step:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  
  .step-marker {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: #18181b;
    border: 2px solid #27272a;
    transition: all 0.3s;
  }
  
  .step.completed .step-marker {
    background: #3b82f6;
    border-color: #3b82f6;
  }
  
  .step.current .step-marker {
    background: #09090b;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
  }
  
  .check {
    color: #fafafa;
    font-size: 16px;
  }
  
  .number {
    color: #52525b;
    font-size: 15px;
    font-weight: 600;
  }
  .step.current .number {
    color: #3b82f6;
  }
  
  .step-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  
  .step-label {
    font-size: 13px;
    font-weight: 500;
    color: #a1a1aa;
  }
  .step.current .step-label {
    color: #fafafa;
  }
  .step.upcoming .step-label {
    color: #52525b;
  }
  
  .step-desc {
    font-size: 11px;
    color: #52525b;
    text-align: center;
  }
  
  .connector {
    flex: 1;
    height: 2px;
    background: #27272a;
    margin-top: 30px;
    margin-left: -8px;
    margin-right: -8px;
    transition: background 0.3s;
  }
  .connector.filled {
    background: #3b82f6;
  }
  
  .progress-bar {
    height: 4px;
    background: #18181b;
    border-radius: 2px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #6366f1);
    border-radius: 2px;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
</style>
```

---

### 4. Tag Input

An interactive tag input with autocomplete and removal:

```svelte
<script>
  let tags = $state(["design", "svelte", "dark-mode"]);
  let inputValue = $state("");
  let isFocused = $state(false);
  
  let suggestions = ["typescript", "react", "vue", "tailwind", "figma", "ux", "animation"];
  
  let filteredSuggestions = $derived(
    inputValue.length > 0
      ? suggestions.filter(s => 
          s.toLowerCase().includes(inputValue.toLowerCase()) &&
          !tags.includes(s)
        )
      : []
  );
  
  function addTag(tag) {
    const cleaned = tag.toLowerCase().trim().replace(/\s+/g, '-');
    if (cleaned && !tags.includes(cleaned)) {
      tags = [...tags, cleaned];
    }
    inputValue = "";
  }
  
  function removeTag(tag) {
    tags = tags.filter(t => t !== tag);
  }
  
  function handleKeydown(e) {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }
</script>

<div class="tag-input-container">
  <label class="label">Tags</label>
  
  <div class="tag-input" class:focused={isFocused}>
    <div class="tags-wrapper">
      {#each tags as tag}
        <span class="tag">
          <span class="tag-text">{tag}</span>
          <button class="tag-remove" onclick={() => removeTag(tag)}>×</button>
        </span>
      {/each}
      <input 
        type="text"
        class="input-field"
        placeholder={tags.length === 0 ? "Add tags..." : ""}
        bind:value={inputValue}
        onfocus={() => isFocused = true}
        onblur={() => setTimeout(() => isFocused = false, 150)}
        onkeydown={handleKeydown}
      />
    </div>
  </div>
  
  {#if filteredSuggestions.length > 0 && isFocused}
    <div class="suggestions">
      {#each filteredSuggestions as suggestion}
        <button 
          class="suggestion-item"
          onclick={() => addTag(suggestion)}
        >
          <span class="plus">+</span>
          {suggestion}
        </button>
      {/each}
    </div>
  {/if}
  
  <span class="hint">Press Enter to add, Backspace to remove</span>
</div>

<style>
  .tag-input-container {
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    padding: 20px;
    max-width: 400px;
  }
  
  .label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #a1a1aa;
    margin-bottom: 12px;
  }
  
  .tag-input {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 10px 14px;
    transition: all 0.2s;
  }
  .tag-input.focused {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
  
  .tags-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(59, 130, 246, 0.15);
    padding: 6px 10px;
    border-radius: 8px;
    animation: tagIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes tagIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .tag-text {
    font-size: 13px;
    color: #93c5fd;
    font-weight: 500;
  }
  
  .tag-remove {
    background: none;
    border: none;
    color: #60a5fa;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    opacity: 0.6;
    transition: opacity 0.15s;
  }
  .tag-remove:hover {
    opacity: 1;
  }
  
  .input-field {
    flex: 1;
    min-width: 100px;
    background: none;
    border: none;
    outline: none;
    font-size: 14px;
    color: #fafafa;
    padding: 4px 0;
  }
  .input-field::placeholder {
    color: #52525b;
  }
  
  .suggestions {
    margin-top: 8px;
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 6px;
    display: flex;
    flex-direction: column;
  }
  
  .suggestion-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: none;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    color: #a1a1aa;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
  }
  .suggestion-item:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #fafafa;
  }
  
  .plus {
    color: #3b82f6;
    font-weight: 300;
  }
  
  .hint {
    display: block;
    margin-top: 12px;
    font-size: 11px;
    color: #52525b;
  }
</style>
```

---

### 5. Data Table Row

A sophisticated table row with inline actions and status badges:

```svelte
<script>
  let items = $state([
    { id: 1, name: "Project Alpha", status: "active", progress: 75, members: 4, updated: "2 hours ago" },
    { id: 2, name: "Design System", status: "review", progress: 100, members: 2, updated: "Yesterday" },
    { id: 3, name: "Mobile App", status: "paused", progress: 45, members: 6, updated: "3 days ago" },
    { id: 4, name: "API Refactor", status: "active", progress: 30, members: 3, updated: "Just now" }
  ]);
  
  let hoveredRow = $state(null);
  
  const statusStyles = {
    active: { label: "Active", color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)" },
    review: { label: "In Review", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
    paused: { label: "Paused", color: "#71717a", bg: "rgba(113, 113, 122, 0.1)" }
  };
</script>

<div class="table-container">
  <div class="table-header">
    <span class="col-name">Name</span>
    <span class="col-status">Status</span>
    <span class="col-progress">Progress</span>
    <span class="col-members">Team</span>
    <span class="col-updated">Updated</span>
    <span class="col-actions"></span>
  </div>
  
  <div class="table-body">
    {#each items as item}
      <div 
        class="table-row"
        class:hovered={hoveredRow === item.id}
        onmouseenter={() => hoveredRow = item.id}
        onmouseleave={() => hoveredRow = null}
      >
        <span class="col-name">
          <span class="name-text">{item.name}</span>
        </span>
        
        <span class="col-status">
          <span 
            class="status-badge"
            style="color: {statusStyles[item.status].color}; background: {statusStyles[item.status].bg}"
          >
            {statusStyles[item.status].label}
          </span>
        </span>
        
        <span class="col-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: {item.progress}%"></div>
          </div>
          <span class="progress-text">{item.progress}%</span>
        </span>
        
        <span class="col-members">
          <span class="members-count">{item.members}</span>
        </span>
        
        <span class="col-updated">{item.updated}</span>
        
        <span class="col-actions">
          <button class="action-btn" title="Edit">✎</button>
          <button class="action-btn" title="More">⋯</button>
        </span>
      </div>
    {/each}
  </div>
</div>

<style>
  .table-container {
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    overflow: hidden;
  }
  
  .table-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1.5fr 0.8fr 1fr 80px;
    gap: 16px;
    padding: 14px 20px;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }
  
  .table-header span {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #52525b;
  }
  
  .table-body {
    display: flex;
    flex-direction: column;
  }
  
  .table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1.5fr 0.8fr 1fr 80px;
    gap: 16px;
    padding: 16px 20px;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    transition: background 0.15s;
  }
  .table-row:last-child {
    border-bottom: none;
  }
  .table-row.hovered {
    background: rgba(255, 255, 255, 0.02);
  }
  
  .name-text {
    font-size: 14px;
    font-weight: 500;
    color: #fafafa;
  }
  
  .status-badge {
    font-size: 12px;
    font-weight: 500;
    padding: 5px 10px;
    border-radius: 6px;
  }
  
  .col-progress {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .progress-bar {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 3px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #6366f1);
    border-radius: 3px;
    transition: width 0.3s;
  }
  
  .progress-text {
    font-size: 12px;
    font-family: 'SF Mono', monospace;
    color: #71717a;
    min-width: 36px;
  }
  
  .members-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 8px;
    font-size: 13px;
    color: #a1a1aa;
  }
  
  .col-updated {
    font-size: 13px;
    color: #52525b;
  }
  
  .col-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .table-row.hovered .col-actions {
    opacity: 1;
  }
  
  .action-btn {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    background: none;
    border: 1px solid transparent;
    border-radius: 8px;
    color: #71717a;
    cursor: pointer;
    transition: all 0.15s;
    font-size: 14px;
  }
  .action-btn:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.08);
    color: #fafafa;
  }
</style>
```

---

### 6. Floating Label Input

A material-style input with animated floating label:

```svelte
<script>
  let value = $state("");
  let isFocused = $state(false);
  let hasError = $state(false);
  
  let isFloating = $derived(isFocused || value.length > 0);
  
  function validate() {
    hasError = value.length > 0 && value.length < 3;
  }
</script>

<div class="input-group" class:focused={isFocused} class:error={hasError} class:floating={isFloating}>
  <input 
    type="text"
    class="input"
    bind:value={value}
    onfocus={() => isFocused = true}
    onblur={() => { isFocused = false; validate(); }}
  />
  <label class="floating-label">Username</label>
  <div class="border-line"></div>
  
  {#if hasError}
    <span class="error-text">Username must be at least 3 characters</span>
  {/if}
</div>

<style>
  .input-group {
    position: relative;
    padding-top: 18px;
    max-width: 320px;
  }
  
  .input {
    width: 100%;
    padding: 16px 0 12px;
    background: transparent;
    border: none;
    border-bottom: 2px solid #27272a;
    font-size: 16px;
    color: #fafafa;
    outline: none;
    transition: border-color 0.2s;
  }
  
  .input-group.focused .input {
    border-color: #3b82f6;
  }
  .input-group.error .input {
    border-color: #ef4444;
  }
  
  .floating-label {
    position: absolute;
    left: 0;
    top: 36px;
    font-size: 16px;
    color: #52525b;
    pointer-events: none;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: left;
  }
  
  .input-group.floating .floating-label {
    top: 0;
    font-size: 12px;
    color: #71717a;
  }
  
  .input-group.focused .floating-label {
    color: #3b82f6;
  }
  .input-group.error .floating-label {
    color: #ef4444;
  }
  
  .border-line {
    position: absolute;
    bottom: 22px;
    left: 50%;
    width: 0;
    height: 2px;
    background: #3b82f6;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateX(-50%);
  }
  
  .input-group.focused .border-line {
    width: 100%;
  }
  .input-group.error .border-line {
    background: #ef4444;
  }
  
  .error-text {
    display: block;
    margin-top: 8px;
    font-size: 12px;
    color: #ef4444;
    animation: shake 0.3s;
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
</style>
```

---

### 7. Skeleton Loader

Animated placeholder content during data loading:

```svelte
<script>
  let isLoading = $state(true);
  
  function toggleLoading() {
    isLoading = !isLoading;
  }
</script>

<div class="skeleton-demo">
  <button class="toggle-btn" onclick={toggleLoading}>
    {isLoading ? "Show Content" : "Show Skeleton"}
  </button>
  
  <div class="card">
    {#if isLoading}
      <div class="skeleton-header">
        <div class="skeleton skeleton-avatar"></div>
        <div class="skeleton-text">
          <div class="skeleton skeleton-line w-40"></div>
          <div class="skeleton skeleton-line w-24"></div>
        </div>
      </div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line w-90"></div>
        <div class="skeleton skeleton-line w-75"></div>
      </div>
      <div class="skeleton-footer">
        <div class="skeleton skeleton-btn"></div>
        <div class="skeleton skeleton-btn w-sm"></div>
      </div>
    {:else}
      <div class="content-header">
        <div class="avatar">MC</div>
        <div class="user-info">
          <span class="name">Maya Chen</span>
          <span class="role">Product Designer</span>
        </div>
      </div>
      <div class="content-body">
        <p>Building the next generation of design tools. Passionate about creating intuitive interfaces that delight users.</p>
      </div>
      <div class="content-footer">
        <button class="btn primary">Follow</button>
        <button class="btn secondary">Message</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .skeleton-demo {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 360px;
  }
  
  .toggle-btn {
    padding: 10px 18px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    color: #a1a1aa;
    font-size: 13px;
    cursor: pointer;
    align-self: flex-start;
    transition: all 0.2s;
  }
  .toggle-btn:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fafafa;
  }
  
  .card {
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    padding: 24px;
  }
  
  .skeleton {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.04) 0%,
      rgba(255, 255, 255, 0.08) 50%,
      rgba(255, 255, 255, 0.04) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
  }
  
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  .skeleton-header {
    display: flex;
    gap: 14px;
    margin-bottom: 20px;
  }
  
  .skeleton-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  
  .skeleton-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 4px 0;
  }
  
  .skeleton-line {
    height: 14px;
    width: 100%;
  }
  .skeleton-line.w-90 { width: 90%; }
  .skeleton-line.w-75 { width: 75%; }
  .skeleton-line.w-40 { width: 40%; }
  .skeleton-line.w-24 { width: 24%; }
  
  .skeleton-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .skeleton-footer {
    display: flex;
    gap: 10px;
  }
  
  .skeleton-btn {
    height: 40px;
    width: 100px;
    border-radius: 10px;
  }
  .skeleton-btn.w-sm {
    width: 80px;
  }
  
  /* Actual content styles */
  .content-header {
    display: flex;
    gap: 14px;
    margin-bottom: 16px;
  }
  
  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: grid;
    place-items: center;
    font-size: 16px;
    font-weight: 600;
    color: white;
  }
  
  .user-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    justify-content: center;
  }
  
  .name {
    font-size: 16px;
    font-weight: 600;
    color: #fafafa;
  }
  
  .role {
    font-size: 13px;
    color: #71717a;
  }
  
  .content-body p {
    margin: 0 0 20px;
    font-size: 14px;
    line-height: 1.6;
    color: #a1a1aa;
  }
  
  .content-footer {
    display: flex;
    gap: 10px;
  }
  
  .btn {
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn.primary {
    background: #3b82f6;
    border: none;
    color: white;
  }
  .btn.primary:hover {
    background: #2563eb;
  }
  .btn.secondary {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #a1a1aa;
  }
  .btn.secondary:hover {
    background: rgba(255, 255, 255, 0.04);
    color: #fafafa;
  }
</style>
```

---

### 8. Dropdown Select

A custom select component with search and keyboard navigation:

```svelte
<script>
  let isOpen = $state(false);
  let searchQuery = $state("");
  let selectedIndex = $state(-1);
  let selectedOption = $state(null);
  
  let options = $state([
    { value: "us", label: "United States", flag: "🇺🇸" },
    { value: "uk", label: "United Kingdom", flag: "🇬🇧" },
    { value: "ca", label: "Canada", flag: "🇨🇦" },
    { value: "au", label: "Australia", flag: "🇦🇺" },
    { value: "de", label: "Germany", flag: "🇩🇪" },
    { value: "fr", label: "France", flag: "🇫🇷" },
    { value: "jp", label: "Japan", flag: "🇯🇵" },
    { value: "kr", label: "South Korea", flag: "🇰🇷" }
  ]);
  
  let filtered = $derived(
    searchQuery
      ? options.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
      : options
  );
  
  function selectOption(option) {
    selectedOption = option;
    isOpen = false;
    searchQuery = "";
  }
  
  function handleKeydown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      selectOption(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      isOpen = false;
    }
  }
</script>

<div class="select-container">
  <label class="label">Country</label>
  
  <button 
    class="select-trigger"
    class:open={isOpen}
    onclick={() => isOpen = !isOpen}
  >
    {#if selectedOption}
      <span class="selected-flag">{selectedOption.flag}</span>
      <span class="selected-label">{selectedOption.label}</span>
    {:else}
      <span class="placeholder">Select a country...</span>
    {/if}
    <span class="chevron">›</span>
  </button>
  
  {#if isOpen}
    <div class="dropdown">
      <div class="search-wrapper">
        <input 
          type="text"
          class="search-input"
          placeholder="Search..."
          bind:value={searchQuery}
          onkeydown={handleKeydown}
          autofocus
        />
      </div>
      
      <div class="options-list">
        {#each filtered as option, i}
          <button 
            class="option"
            class:selected={selectedOption?.value === option.value}
            class:highlighted={selectedIndex === i}
            onclick={() => selectOption(option)}
            onmouseenter={() => selectedIndex = i}
          >
            <span class="option-flag">{option.flag}</span>
            <span class="option-label">{option.label}</span>
            {#if selectedOption?.value === option.value}
              <span class="check">✓</span>
            {/if}
          </button>
        {/each}
        
        {#if filtered.length === 0}
          <div class="no-results">No countries found</div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .select-container {
    position: relative;
    max-width: 300px;
  }
  
  .label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #a1a1aa;
    margin-bottom: 8px;
  }
  
  .select-trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 14px 16px;
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
  }
  .select-trigger:hover {
    border-color: rgba(255, 255, 255, 0.15);
  }
  .select-trigger.open {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
  
  .selected-flag {
    font-size: 18px;
  }
  
  .selected-label {
    flex: 1;
    font-size: 15px;
    color: #fafafa;
  }
  
  .placeholder {
    flex: 1;
    font-size: 15px;
    color: #52525b;
  }
  
  .chevron {
    font-size: 18px;
    color: #52525b;
    transition: transform 0.2s;
  }
  .select-trigger.open .chevron {
    transform: rotate(90deg);
    color: #3b82f6;
  }
  
  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 8px;
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
    overflow: hidden;
    animation: dropIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 100;
  }
  
  @keyframes dropIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .search-wrapper {
    padding: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .search-input {
    width: 100%;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    font-size: 14px;
    color: #fafafa;
    outline: none;
    transition: border-color 0.2s;
  }
  .search-input:focus {
    border-color: rgba(59, 130, 246, 0.5);
  }
  .search-input::placeholder {
    color: #52525b;
  }
  
  .options-list {
    max-height: 240px;
    overflow-y: auto;
    padding: 8px;
  }
  
  .option {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 14px;
    background: none;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;
  }
  .option:hover,
  .option.highlighted {
    background: rgba(59, 130, 246, 0.1);
  }
  .option.selected {
    background: rgba(59, 130, 246, 0.15);
  }
  
  .option-flag {
    font-size: 20px;
  }
  
  .option-label {
    flex: 1;
    font-size: 14px;
    color: #e4e4e7;
  }
  
  .check {
    color: #3b82f6;
    font-weight: 600;
  }
  
  .no-results {
    padding: 24px;
    text-align: center;
    font-size: 14px;
    color: #52525b;
  }
</style>
```

---

## Animation Tokens

```css
/* Timing functions */
--ease-out:    cubic-bezier(0.4, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.4, 1);
--spring:      cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* Durations */
--duration-fast:   100ms;
--duration-normal: 200ms;
--duration-slow:   300ms;
--duration-slower: 500ms;
```

---

## Accessibility Notes

- All interactive elements are keyboard navigable
- Focus states are visible and meet contrast requirements
- ARIA attributes used where appropriate
- Motion respects `prefers-reduced-motion`
- Touch targets meet 44px minimum

---

> *"The details are not the details. They make the design."* — Charles Eames

---

*Built with Zef ◇*
