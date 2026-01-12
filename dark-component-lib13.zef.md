# Dark Component Library XIII ◈

**Utilities & Micro-Interactions** — Details. Polish. Delight.

---

## Introduction

The magic is in the micro. This collection explores the small components that elevate good interfaces to great ones—tooltips that inform, badges that notify, chips that filter. Each interaction is a moment of delight, refined to pixel perfection.

---

## Component Collection

Seven utility components for polished interactions.

---

### 1. Tooltip System

Contextual tooltips with multiple placements:

```svelte
<script>
  let tooltips = $state([
    { id: 1, placement: 'top', text: 'Save changes', visible: false },
    { id: 2, placement: 'bottom', text: 'Delete item', visible: false },
    { id: 3, placement: 'left', text: 'Previous page', visible: false },
    { id: 4, placement: 'right', text: 'Next page', visible: false }
  ]);
  
  function show(id) {
    tooltips = tooltips.map(t => ({ ...t, visible: t.id === id }));
  }
  
  function hide() {
    tooltips = tooltips.map(t => ({ ...t, visible: false }));
  }
</script>

<div class="tooltip-demo">
  <p class="demo-label">Hover the buttons to see tooltips</p>
  
  <div class="button-grid">
    {#each tooltips as tooltip}
      <div class="tooltip-wrapper">
        <button 
          class="demo-btn"
          onmouseenter={() => show(tooltip.id)}
          onmouseleave={hide}
        >
          {tooltip.placement.charAt(0).toUpperCase() + tooltip.placement.slice(1)}
        </button>
        
        {#if tooltip.visible}
          <div class="tooltip" class:top={tooltip.placement === 'top'} class:bottom={tooltip.placement === 'bottom'} class:left={tooltip.placement === 'left'} class:right={tooltip.placement === 'right'}>
            {tooltip.text}
            <span class="tooltip-arrow"></span>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .tooltip-demo {
    max-width: 400px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 32px;
  }
  
  .demo-label {
    margin: 0 0 24px;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.5);
    text-align: center;
  }
  
  .button-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .tooltip-wrapper {
    position: relative;
    display: flex;
    justify-content: center;
  }
  
  .demo-btn {
    padding: 12px 24px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: rgba(255,255,255,0.8);
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .demo-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }
  
  .tooltip {
    position: absolute;
    padding: 8px 12px;
    background: #1a1a1d;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    font-size: 0.75rem;
    color: #fff;
    white-space: nowrap;
    z-index: 100;
    animation: tooltipFade 0.15s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  }
  
  @keyframes tooltipFade {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  
  .tooltip-arrow {
    position: absolute;
    width: 8px;
    height: 8px;
    background: #1a1a1d;
    border: 1px solid rgba(255,255,255,0.12);
    transform: rotate(45deg);
  }
  
  .tooltip.top {
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
  }
  
  .tooltip.top .tooltip-arrow {
    bottom: -5px;
    left: 50%;
    margin-left: -4px;
    border-top: none;
    border-left: none;
  }
  
  .tooltip.bottom {
    top: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
  }
  
  .tooltip.bottom .tooltip-arrow {
    top: -5px;
    left: 50%;
    margin-left: -4px;
    border-bottom: none;
    border-right: none;
  }
  
  .tooltip.left {
    right: calc(100% + 10px);
    top: 50%;
    transform: translateY(-50%);
  }
  
  .tooltip.left .tooltip-arrow {
    right: -5px;
    top: 50%;
    margin-top: -4px;
    border-left: none;
    border-bottom: none;
  }
  
  .tooltip.right {
    left: calc(100% + 10px);
    top: 50%;
    transform: translateY(-50%);
  }
  
  .tooltip.right .tooltip-arrow {
    left: -5px;
    top: 50%;
    margin-top: -4px;
    border-right: none;
    border-top: none;
  }
</style>
```

---

### 2. Badge & Notification Dots

Various badge styles for notifications and status:

```svelte
<script>
  let notifications = $state(5);
  let messages = $state(12);
  let updates = $state(99);
</script>

<div class="badges-demo">
  <h4 class="section-label">Notification Badges</h4>
  <div class="badge-row">
    <div class="badge-item">
      <button class="icon-btn">
        🔔
        {#if notifications > 0}
          <span class="badge">{notifications}</span>
        {/if}
      </button>
      <span class="badge-label">Count</span>
    </div>
    
    <div class="badge-item">
      <button class="icon-btn">
        ✉️
        {#if messages > 0}
          <span class="badge large">{messages}</span>
        {/if}
      </button>
      <span class="badge-label">Large</span>
    </div>
    
    <div class="badge-item">
      <button class="icon-btn">
        ⚡
        {#if updates > 0}
          <span class="badge large">{updates > 99 ? '99+' : updates}</span>
        {/if}
      </button>
      <span class="badge-label">Overflow</span>
    </div>
    
    <div class="badge-item">
      <button class="icon-btn">
        💬
        <span class="dot"></span>
      </button>
      <span class="badge-label">Dot</span>
    </div>
    
    <div class="badge-item">
      <button class="icon-btn">
        📡
        <span class="dot pulse"></span>
      </button>
      <span class="badge-label">Pulse</span>
    </div>
  </div>
  
  <h4 class="section-label">Status Badges</h4>
  <div class="status-row">
    <span class="status-badge online">
      <span class="status-dot"></span>
      Online
    </span>
    <span class="status-badge away">
      <span class="status-dot"></span>
      Away
    </span>
    <span class="status-badge busy">
      <span class="status-dot"></span>
      Busy
    </span>
    <span class="status-badge offline">
      <span class="status-dot"></span>
      Offline
    </span>
  </div>
  
  <h4 class="section-label">Label Badges</h4>
  <div class="label-row">
    <span class="label-badge blue">New</span>
    <span class="label-badge green">Success</span>
    <span class="label-badge yellow">Warning</span>
    <span class="label-badge red">Error</span>
    <span class="label-badge purple">Beta</span>
    <span class="label-badge outline">v2.0</span>
  </div>
</div>

<style>
  .badges-demo {
    max-width: 420px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 24px;
  }
  
  .section-label {
    margin: 0 0 16px;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .section-label:not(:first-child) {
    margin-top: 28px;
  }
  
  .badge-row {
    display: flex;
    gap: 24px;
  }
  
  .badge-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  
  .icon-btn {
    position: relative;
    width: 48px;
    height: 48px;
    background: rgba(255,255,255,0.06);
    border: none;
    border-radius: 12px;
    font-size: 1.25rem;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  
  .icon-btn:hover {
    background: rgba(255,255,255,0.1);
  }
  
  .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    background: #ef4444;
    border-radius: 9px;
    font-size: 0.65rem;
    font-weight: 600;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #0c0c0e;
  }
  
  .badge.large {
    min-width: 22px;
    height: 22px;
    font-size: 0.7rem;
    top: -6px;
    right: -6px;
  }
  
  .dot {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    background: #ef4444;
    border-radius: 50%;
    border: 2px solid #0c0c0e;
  }
  
  .dot.pulse {
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
    70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }
  
  .badge-label {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.4);
  }
  
  .status-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(255,255,255,0.04);
    border-radius: 16px;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.7);
  }
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  .status-badge.online .status-dot { background: #22c55e; }
  .status-badge.away .status-dot { background: #f59e0b; }
  .status-badge.busy .status-dot { background: #ef4444; }
  .status-badge.offline .status-dot { background: #6b7280; }
  
  .label-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .label-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
  }
  
  .label-badge.blue { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
  .label-badge.green { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
  .label-badge.yellow { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
  .label-badge.red { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
  .label-badge.purple { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
  .label-badge.outline { 
    background: transparent; 
    border: 1px solid rgba(255,255,255,0.2); 
    color: rgba(255,255,255,0.6); 
  }
</style>
```

---

### 3. Chip & Tag Input

Selectable chips and tag input field:

```svelte
<script>
  let categories = $state([
    { id: 1, label: 'Technology', selected: true },
    { id: 2, label: 'Design', selected: false },
    { id: 3, label: 'Business', selected: true },
    { id: 4, label: 'Science', selected: false },
    { id: 5, label: 'Art', selected: false }
  ]);
  
  let tags = $state(['svelte', 'typescript', 'css']);
  let tagInput = $state('');
  
  function toggleChip(id) {
    categories = categories.map(c => 
      c.id === id ? { ...c, selected: !c.selected } : c
    );
  }
  
  function addTag(e) {
    if (e.key === 'Enter' && tagInput.trim()) {
      if (!tags.includes(tagInput.trim().toLowerCase())) {
        tags = [...tags, tagInput.trim().toLowerCase()];
      }
      tagInput = '';
    }
  }
  
  function removeTag(tag) {
    tags = tags.filter(t => t !== tag);
  }
</script>

<div class="chips-demo">
  <h4 class="section-label">Filter Chips</h4>
  <div class="chips-row">
    {#each categories as chip}
      <button 
        class="chip"
        class:selected={chip.selected}
        onclick={() => toggleChip(chip.id)}
      >
        {#if chip.selected}
          <span class="check">✓</span>
        {/if}
        {chip.label}
      </button>
    {/each}
  </div>
  
  <h4 class="section-label">Tag Input</h4>
  <div class="tag-input-container">
    <div class="tags-wrapper">
      {#each tags as tag}
        <span class="tag">
          {tag}
          <button class="tag-remove" onclick={() => removeTag(tag)}>×</button>
        </span>
      {/each}
      <input 
        type="text" 
        class="tag-input"
        placeholder={tags.length === 0 ? 'Add tags...' : ''}
        bind:value={tagInput}
        onkeydown={addTag}
      />
    </div>
  </div>
  <p class="hint">Press Enter to add a tag</p>
</div>

<style>
  .chips-demo {
    max-width: 400px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 24px;
  }
  
  .section-label {
    margin: 0 0 14px;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .section-label:not(:first-child) {
    margin-top: 28px;
  }
  
  .chips-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    color: rgba(255,255,255,0.7);
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .chip:hover {
    border-color: rgba(255,255,255,0.2);
    color: #fff;
  }
  
  .chip.selected {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.4);
    color: #818cf8;
  }
  
  .check {
    font-size: 0.7rem;
  }
  
  .tag-input-container {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 8px 12px;
    min-height: 48px;
    transition: border-color 0.15s ease;
  }
  
  .tag-input-container:focus-within {
    border-color: #6366f1;
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
    padding: 4px 10px;
    background: rgba(99, 102, 241, 0.2);
    border-radius: 6px;
    font-size: 0.8rem;
    color: #818cf8;
  }
  
  .tag-remove {
    width: 16px;
    height: 16px;
    background: transparent;
    border: none;
    color: rgba(129, 140, 248, 0.7);
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    transition: color 0.15s ease;
  }
  
  .tag-remove:hover {
    color: #fff;
  }
  
  .tag-input {
    flex: 1;
    min-width: 80px;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 0.85rem;
    padding: 4px 0;
  }
  
  .tag-input::placeholder {
    color: rgba(255,255,255,0.35);
  }
  
  .tag-input:focus {
    outline: none;
  }
  
  .hint {
    margin: 10px 0 0;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.35);
  }
</style>
```

---

### 4. Skeleton Loader

Content placeholder with shimmer animation:

```svelte
<script>
  let isLoading = $state(true);
  
  setTimeout(() => {
    isLoading = false;
  }, 3000);
</script>

<div class="skeleton-demo">
  <div class="demo-header">
    <span class="demo-label">Skeleton Loading</span>
    <button class="reload-btn" onclick={() => { isLoading = true; setTimeout(() => isLoading = false, 3000); }}>
      ↻ Reload
    </button>
  </div>
  
  <div class="card-preview">
    {#if isLoading}
      <div class="skeleton-card">
        <div class="skeleton skeleton-avatar"></div>
        <div class="skeleton-content">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text short"></div>
        </div>
      </div>
      
      <div class="skeleton-card">
        <div class="skeleton skeleton-avatar"></div>
        <div class="skeleton-content">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text short"></div>
        </div>
      </div>
    {:else}
      <div class="loaded-card">
        <div class="card-avatar">JD</div>
        <div class="card-content">
          <span class="card-name">John Doe</span>
          <p class="card-text">Software engineer passionate about building great user experiences.</p>
        </div>
      </div>
      
      <div class="loaded-card">
        <div class="card-avatar">AS</div>
        <div class="card-content">
          <span class="card-name">Alice Smith</span>
          <p class="card-text">Product designer with a focus on accessibility and inclusive design.</p>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .skeleton-demo {
    max-width: 380px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 20px;
  }
  
  .demo-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .demo-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
  }
  
  .reload-btn {
    padding: 6px 12px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px;
    color: rgba(255,255,255,0.6);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .reload-btn:hover {
    border-color: rgba(255,255,255,0.25);
    color: #fff;
  }
  
  .card-preview {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .skeleton-card,
  .loaded-card {
    display: flex;
    gap: 14px;
    padding: 16px;
    background: rgba(255,255,255,0.02);
    border-radius: 12px;
  }
  
  .skeleton {
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.04) 0%,
      rgba(255,255,255,0.08) 50%,
      rgba(255,255,255,0.04) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }
  
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  .skeleton-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  
  .skeleton-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .skeleton-title {
    height: 16px;
    width: 50%;
  }
  
  .skeleton-text {
    height: 12px;
    width: 100%;
  }
  
  .skeleton-text.short {
    width: 70%;
  }
  
  .card-avatar {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    flex-shrink: 0;
  }
  
  .card-content {
    flex: 1;
  }
  
  .card-name {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 4px;
  }
  
  .card-text {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.6);
    line-height: 1.4;
  }
</style>
```

---

### 5. Copy to Clipboard

Copy button with success feedback:

```svelte
<script>
  let items = $state([
    { id: 1, label: 'API Key', value: 'sk_live_4eC39HqLyjWDarjtT1zdp7dc', copied: false },
    { id: 2, label: 'Webhook URL', value: 'https://api.example.com/webhooks/v1', copied: false },
    { id: 3, label: 'Secret Token', value: 'whsec_8KYb2xN0qRwP5LmJd3FvT9Ag', copied: false }
  ]);
  
  async function copyToClipboard(id) {
    const item = items.find(i => i.id === id);
    await navigator.clipboard?.writeText(item.value);
    
    items = items.map(i => ({ ...i, copied: i.id === id }));
    
    setTimeout(() => {
      items = items.map(i => ({ ...i, copied: false }));
    }, 2000);
  }
</script>

<div class="copy-demo">
  <h4 class="demo-title">Credentials</h4>
  
  <div class="copy-items">
    {#each items as item}
      <div class="copy-item">
        <div class="item-header">
          <span class="item-label">{item.label}</span>
        </div>
        <div class="item-content">
          <code class="item-value">{item.value.slice(0, 20)}...</code>
          <button 
            class="copy-btn"
            class:copied={item.copied}
            onclick={() => copyToClipboard(item.id)}
          >
            {#if item.copied}
              <span class="copy-icon">✓</span>
              Copied!
            {:else}
              <span class="copy-icon">⊕</span>
              Copy
            {/if}
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .copy-demo {
    max-width: 400px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 20px;
  }
  
  .demo-title {
    margin: 0 0 20px;
    font-size: 0.95rem;
    font-weight: 600;
    color: #fff;
  }
  
  .copy-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .copy-item {
    padding: 14px 16px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
  }
  
  .item-header {
    margin-bottom: 8px;
  }
  
  .item-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  
  .item-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .item-value {
    flex: 1;
    font-size: 0.8rem;
    font-family: 'SF Mono', monospace;
    color: rgba(255,255,255,0.7);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: rgba(255,255,255,0.7);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }
  
  .copy-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }
  
  .copy-btn.copied {
    background: rgba(34, 197, 94, 0.15);
    border-color: rgba(34, 197, 94, 0.3);
    color: #22c55e;
  }
  
  .copy-icon {
    font-size: 0.85rem;
  }
</style>
```

---

### 6. Keyboard Shortcuts

Keyboard shortcut hints display:

```svelte
<script>
  let shortcuts = $state([
    { action: 'Save', keys: ['⌘', 'S'] },
    { action: 'Copy', keys: ['⌘', 'C'] },
    { action: 'Paste', keys: ['⌘', 'V'] },
    { action: 'Undo', keys: ['⌘', 'Z'] },
    { action: 'Search', keys: ['⌘', 'K'] },
    { action: 'New Tab', keys: ['⌘', 'T'] }
  ]);
</script>

<div class="shortcuts-demo">
  <h4 class="demo-title">Keyboard Shortcuts</h4>
  
  <div class="shortcuts-grid">
    {#each shortcuts as shortcut}
      <div class="shortcut-item">
        <span class="shortcut-action">{shortcut.action}</span>
        <div class="shortcut-keys">
          {#each shortcut.keys as key, i}
            {#if i > 0}<span class="key-separator">+</span>{/if}
            <kbd class="key">{key}</kbd>
          {/each}
        </div>
      </div>
    {/each}
  </div>
  
  <div class="inline-hint">
    Press <kbd class="inline-key">⌘</kbd><kbd class="inline-key">K</kbd> to open command palette
  </div>
</div>

<style>
  .shortcuts-demo {
    max-width: 360px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 20px;
  }
  
  .demo-title {
    margin: 0 0 20px;
    font-size: 0.95rem;
    font-weight: 600;
    color: #fff;
  }
  
  .shortcuts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .shortcut-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
  }
  
  .shortcut-action {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.7);
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
    min-width: 24px;
    height: 24px;
    padding: 0 6px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 5px;
    font-size: 0.7rem;
    font-family: system-ui;
    color: rgba(255,255,255,0.8);
    box-shadow: 0 2px 0 rgba(0,0,0,0.3);
  }
  
  .key-separator {
    font-size: 0.6rem;
    color: rgba(255,255,255,0.3);
  }
  
  .inline-hint {
    padding: 12px 16px;
    background: rgba(99, 102, 241, 0.08);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 10px;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.7);
    text-align: center;
  }
  
  .inline-key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    padding: 0 5px;
    margin: 0 3px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 4px;
    font-size: 0.7rem;
    font-family: system-ui;
    color: #fff;
    box-shadow: 0 1px 0 rgba(0,0,0,0.2);
  }
</style>
```

---

### 7. Animated Counter

Number counter with smooth transitions:

```svelte
<script>
  let counters = $state([
    { id: 1, label: 'Users', target: 12847, current: 0, prefix: '', suffix: '' },
    { id: 2, label: 'Revenue', target: 48350, current: 0, prefix: '$', suffix: '' },
    { id: 3, label: 'Growth', target: 156, current: 0, prefix: '', suffix: '%' }
  ]);
  
  let started = $state(false);
  
  function startAnimation() {
    started = true;
    
    counters.forEach((counter, idx) => {
      const duration = 2000;
      const steps = 60;
      const stepValue = counter.target / steps;
      let step = 0;
      
      const interval = setInterval(() => {
        step++;
        counters[idx].current = Math.min(
          Math.round(stepValue * step),
          counter.target
        );
        counters = [...counters];
        
        if (step >= steps) {
          clearInterval(interval);
        }
      }, duration / steps);
    });
  }
</script>

<div class="counter-demo">
  <div class="counters-row">
    {#each counters as counter}
      <div class="counter-card">
        <span class="counter-label">{counter.label}</span>
        <span class="counter-value">
          {counter.prefix}{counter.current.toLocaleString()}{counter.suffix}
        </span>
      </div>
    {/each}
  </div>
  
  <button 
    class="animate-btn"
    onclick={startAnimation}
    disabled={started}
  >
    {started ? 'Animation Complete' : 'Start Animation'}
  </button>
</div>

<style>
  .counter-demo {
    max-width: 420px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 24px;
  }
  
  .counters-row {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
  }
  
  .counter-card {
    flex: 1;
    padding: 20px 16px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    text-align: center;
  }
  
  .counter-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }
  
  .counter-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    font-variant-numeric: tabular-nums;
  }
  
  .animate-btn {
    width: 100%;
    padding: 12px;
    background: #6366f1;
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .animate-btn:hover:not(:disabled) {
    background: #4f46e5;
  }
  
  .animate-btn:disabled {
    background: rgba(99, 102, 241, 0.3);
    cursor: not-allowed;
  }
</style>
```

---

## Summary

This collection perfects the small moments:

1. **Tooltips** — Contextual hints with smart positioning
2. **Badges** — Notifications, status, and labels
3. **Chips** — Filter selection and tag management
4. **Skeletons** — Shimmer loading placeholders
5. **Clipboard** — Copy with instant feedback
6. **Shortcuts** — Keyboard hint displays
7. **Counters** — Animated number transitions

---

*Excellence lives in the details. Polish every pixel.*
