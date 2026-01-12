# Slack UI Library III ◈

**User & Team** — The people behind the messages.

---

## Introduction

This collection provides components for displaying and interacting with users and teams. From profile cards to team directories, these elements bring the human element to workplace communication.

---

## Component Collection

Eight user and team components for social connection.

---

### 1. User Profile Card

Hoverable profile with details:

```svelte
<script>
  let isVisible = $state(true);
  let activeTab = $state('about');
  
  const user = {
    name: 'Sarah Chen',
    title: 'Senior Designer',
    team: 'Product Design',
    status: 'online',
    customStatus: '🎨 In the flow',
    timezone: 'PST (3:42 PM)',
    email: 'sarah.chen@company.com'
  };
</script>

{#if isVisible}
  <div class="profile-card">
    <div class="card-header">
      <div class="avatar-section">
        <div class="avatar-large">
          <span class="avatar-initials">SC</span>
          <span class="status-indicator"></span>
        </div>
      </div>
      
      <div class="user-details">
        <h3 class="user-name">{user.name}</h3>
        <p class="user-title">{user.title}</p>
        <span class="custom-status">{user.customStatus}</span>
      </div>
    </div>
    
    <div class="card-tabs">
      <button 
        class="tab-btn"
        class:active={activeTab === 'about'}
        onclick={() => activeTab = 'about'}
      >
        About
      </button>
      <button 
        class="tab-btn"
        class:active={activeTab === 'activity'}
        onclick={() => activeTab = 'activity'}
      >
        Activity
      </button>
    </div>
    
    <div class="card-content">
      {#if activeTab === 'about'}
        <div class="info-list">
          <div class="info-item">
            <span class="info-icon">👥</span>
            <span class="info-label">Team</span>
            <span class="info-value">{user.team}</span>
          </div>
          <div class="info-item">
            <span class="info-icon">🕐</span>
            <span class="info-label">Local time</span>
            <span class="info-value">{user.timezone}</span>
          </div>
          <div class="info-item">
            <span class="info-icon">✉️</span>
            <span class="info-label">Email</span>
            <span class="info-value email">{user.email}</span>
          </div>
        </div>
      {:else}
        <div class="activity-list">
          <div class="activity-item">
            <span class="activity-dot"></span>
            <span class="activity-text">Posted in #design-system</span>
            <span class="activity-time">2h ago</span>
          </div>
          <div class="activity-item">
            <span class="activity-dot"></span>
            <span class="activity-text">Shared a file</span>
            <span class="activity-time">4h ago</span>
          </div>
        </div>
      {/if}
    </div>
    
    <div class="card-actions">
      <button class="action-btn primary">
        <span>💬</span>
        Message
      </button>
      <button class="action-btn">
        <span>📞</span>
        Call
      </button>
    </div>
  </div>
{/if}

<style>
  .profile-card {
    width: 320px;
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  }
  
  .card-header {
    padding: 24px 20px;
    background: linear-gradient(145deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1));
    text-align: center;
  }
  
  .avatar-section {
    margin-bottom: 16px;
  }
  
  .avatar-large {
    position: relative;
    width: 80px;
    height: 80px;
    margin: 0 auto;
  }
  
  .avatar-initials {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    font-weight: 700;
    color: #fff;
  }
  
  .status-indicator {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 18px;
    height: 18px;
    background: #22c55e;
    border: 3px solid #111113;
    border-radius: 50%;
  }
  
  .user-details {
    
  }
  
  .user-name {
    margin: 0 0 4px;
    font-size: 1.25rem;
    font-weight: 700;
    color: #fff;
  }
  
  .user-title {
    margin: 0 0 8px;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .custom-status {
    display: inline-block;
    padding: 4px 12px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .card-tabs {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .tab-btn {
    flex: 1;
    padding: 12px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: 0.85rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .tab-btn:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.03);
  }
  
  .tab-btn.active {
    color: #6366f1;
    border-bottom-color: #6366f1;
  }
  
  .card-content {
    padding: 16px 20px;
    min-height: 120px;
  }
  
  .info-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .info-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .info-icon {
    font-size: 0.9rem;
  }
  
  .info-label {
    flex: 1;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .info-value {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .info-value.email {
    color: #6366f1;
  }
  
  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  
  .activity-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .activity-dot {
    width: 6px;
    height: 6px;
    background: #6366f1;
    border-radius: 50%;
  }
  
  .activity-text {
    flex: 1;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .activity-time {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.35);
  }
  
  .card-actions {
    display: flex;
    gap: 8px;
    padding: 16px 20px;
    background: rgba(0, 0, 0, 0.2);
  }
  
  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .action-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .action-btn.primary {
    background: #6366f1;
    border-color: #6366f1;
    color: #fff;
  }
  
  .action-btn.primary:hover {
    background: #5558e3;
  }
</style>
```

---

### 2. User Mention Chip

Inline user mention with preview:

```svelte
<script>
  let showPreview = $state(false);
  
  const user = {
    name: 'Alex Turner',
    handle: 'alex.turner',
    status: 'online',
    title: 'Engineering Lead'
  };
</script>

<span 
  class="mention-wrapper"
  onmouseenter={() => showPreview = true}
  onmouseleave={() => showPreview = false}
>
  <button class="mention-chip">
    @{user.handle}
  </button>
  
  {#if showPreview}
    <div class="mention-preview">
      <div class="preview-avatar">
        <span class="avatar-text">AT</span>
        <span class="status-dot"></span>
      </div>
      <div class="preview-info">
        <span class="preview-name">{user.name}</span>
        <span class="preview-title">{user.title}</span>
      </div>
      <button class="preview-action">View profile</button>
    </div>
  {/if}
</span>

<style>
  .mention-wrapper {
    position: relative;
    display: inline-block;
  }
  
  .mention-chip {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    background: rgba(99, 102, 241, 0.15);
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    color: #6366f1;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .mention-chip:hover {
    background: rgba(99, 102, 241, 0.25);
  }
  
  .mention-preview {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 8px;
    padding: 14px 16px;
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    animation: popIn 0.2s ease;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
    z-index: 100;
  }
  
  @keyframes popIn {
    from { opacity: 0; transform: translateX(-50%) translateY(4px) scale(0.95); }
    to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }
  
  .preview-avatar {
    position: relative;
  }
  
  .avatar-text {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
  }
  
  .status-dot {
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 14px;
    height: 14px;
    background: #22c55e;
    border: 3px solid #111113;
    border-radius: 50%;
  }
  
  .preview-info {
    text-align: center;
  }
  
  .preview-name {
    display: block;
    font-size: 0.95rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 2px;
  }
  
  .preview-title {
    display: block;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .preview-action {
    padding: 6px 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .preview-action:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
</style>
```

---

### 3. Team Directory

Searchable team member list:

```svelte
<script>
  let searchQuery = $state('');
  
  const members = [
    { name: 'Alice Chen', role: 'Product Manager', status: 'online' },
    { name: 'Bob Williams', role: 'Frontend Developer', status: 'away' },
    { name: 'Carol Davis', role: 'UX Designer', status: 'online' },
    { name: 'Dan Miller', role: 'Backend Developer', status: 'offline' },
    { name: 'Eva Martinez', role: 'Data Analyst', status: 'dnd' }
  ];
  
  const statusColors = {
    online: '#22c55e',
    away: '#eab308',
    dnd: '#ef4444',
    offline: '#6b7280'
  };
  
  const filteredMembers = $derived(
    searchQuery
      ? members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : members
  );
</script>

<div class="directory-container">
  <div class="directory-header">
    <h3 class="directory-title">Team Members</h3>
    <span class="member-count">{members.length}</span>
  </div>
  
  <div class="search-bar">
    <span class="search-icon">🔍</span>
    <input 
      type="text"
      placeholder="Search members..."
      bind:value={searchQuery}
    />
  </div>
  
  <div class="member-list">
    {#each filteredMembers as member, i}
      <button class="member-item" style="--delay: {i * 40}ms">
        <div class="member-avatar">
          <span class="avatar-initial">{member.name[0]}</span>
          <span class="status-dot" style="--color: {statusColors[member.status]}"></span>
        </div>
        <div class="member-info">
          <span class="member-name">{member.name}</span>
          <span class="member-role">{member.role}</span>
        </div>
        <span class="member-action">💬</span>
      </button>
    {/each}
    
    {#if filteredMembers.length === 0}
      <div class="no-results">
        <span class="no-results-icon">🔍</span>
        <span class="no-results-text">No members found</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .directory-container {
    max-width: 320px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    overflow: hidden;
  }
  
  .directory-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .directory-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
  }
  
  .member-count {
    padding: 4px 10px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .search-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 12px 14px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
  }
  
  .search-icon {
    font-size: 0.85rem;
    opacity: 0.4;
  }
  
  .search-bar input {
    flex: 1;
    background: none;
    border: none;
    color: #fff;
    font-size: 0.9rem;
    outline: none;
  }
  
  .search-bar input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  .member-list {
    padding: 8px;
    max-height: 320px;
    overflow-y: auto;
  }
  
  .member-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 12px;
    background: none;
    border: none;
    border-radius: 10px;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s ease;
    animation: slideIn 0.25s ease backwards;
    animation-delay: var(--delay);
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  .member-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .member-avatar {
    position: relative;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
  }
  
  .avatar-initial {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #374151, #4b5563);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95rem;
    font-weight: 600;
    color: #fff;
  }
  
  .status-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    background: var(--color);
    border: 2px solid #0c0c0e;
    border-radius: 50%;
  }
  
  .member-info {
    flex: 1;
    min-width: 0;
  }
  
  .member-name {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
  }
  
  .member-role {
    display: block;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.45);
  }
  
  .member-action {
    font-size: 1rem;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  
  .member-item:hover .member-action {
    opacity: 1;
  }
  
  .no-results {
    padding: 32px;
    text-align: center;
  }
  
  .no-results-icon {
    font-size: 2rem;
    opacity: 0.2;
    display: block;
    margin-bottom: 8px;
  }
  
  .no-results-text {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.4);
  }
</style>
```

---

### 4. Avatar Stack

Overlapping avatars for groups:

```svelte
<script>
  let members = $state([
    { name: 'Alice', color: '#6366f1' },
    { name: 'Bob', color: '#ec4899' },
    { name: 'Carol', color: '#22c55e' },
    { name: 'Dan', color: '#f59e0b' },
    { name: 'Eva', color: '#ef4444' }
  ]);
  
  let maxDisplay = 3;
  let isExpanded = $state(false);
  
  const displayedMembers = $derived(
    isExpanded ? members : members.slice(0, maxDisplay)
  );
  const hiddenCount = $derived(members.length - maxDisplay);
</script>

<div class="avatar-stack-container">
  <div 
    class="avatar-stack"
    class:expanded={isExpanded}
    onmouseenter={() => isExpanded = true}
    onmouseleave={() => isExpanded = false}
  >
    {#each displayedMembers as member, i}
      <div 
        class="stacked-avatar"
        style="
          --color: {member.color};
          --index: {i};
          --offset: {isExpanded ? i * 36 : i * -10}px;
        "
        title={member.name}
      >
        <span class="avatar-letter">{member.name[0]}</span>
      </div>
    {/each}
    
    {#if !isExpanded && hiddenCount > 0}
      <div 
        class="overflow-indicator"
        style="--offset: {maxDisplay * -10}px"
      >
        +{hiddenCount}
      </div>
    {/if}
  </div>
  
  <span class="stack-label">
    {members.length} members
  </span>
</div>

<style>
  .avatar-stack-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .avatar-stack {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    padding: 4px;
    border-radius: 24px;
    transition: all 0.3s ease;
    cursor: pointer;
  }
  
  .avatar-stack.expanded {
    background: rgba(255, 255, 255, 0.03);
    padding: 4px 8px;
  }
  
  .stacked-avatar {
    width: 32px;
    height: 32px;
    background: var(--color);
    border: 2px solid #09090b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: var(--offset);
    transition: all 0.3s ease;
    z-index: calc(10 - var(--index));
  }
  
  .avatar-stack.expanded .stacked-avatar {
    border-color: rgba(255, 255, 255, 0.1);
    margin-left: 4px;
  }
  
  .avatar-stack.expanded .stacked-avatar:first-child {
    margin-left: 0;
  }
  
  .avatar-letter {
    font-size: 0.75rem;
    font-weight: 600;
    color: #fff;
  }
  
  .overflow-indicator {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid #09090b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: var(--offset);
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    z-index: 0;
  }
  
  .stack-label {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
  }
</style>
```

---

### 5. User Group Tag

Department or team tag:

```svelte
<script>
  let groups = $state([
    { id: 1, name: 'Engineering', color: '#6366f1', count: 24 },
    { id: 2, name: 'Design', color: '#ec4899', count: 8 },
    { id: 3, name: 'Marketing', color: '#22c55e', count: 12 }
  ]);
  
  let selectedGroups = $state([1]);
  
  function toggleGroup(id) {
    if (selectedGroups.includes(id)) {
      selectedGroups = selectedGroups.filter(g => g !== id);
    } else {
      selectedGroups = [...selectedGroups, id];
    }
  }
</script>

<div class="group-tags">
  <span class="label">Notify groups:</span>
  
  <div class="tags-container">
    {#each groups as group}
      <button
        class="group-tag"
        class:selected={selectedGroups.includes(group.id)}
        style="--accent: {group.color}"
        onclick={() => toggleGroup(group.id)}
      >
        <span class="tag-icon">@</span>
        <span class="tag-name">{group.name}</span>
        <span class="tag-count">{group.count}</span>
        {#if selectedGroups.includes(group.id)}
          <span class="check-mark">✓</span>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .group-tags {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .label {
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .group-tag {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .group-tag:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .group-tag.selected {
    background: color-mix(in srgb, var(--accent) 15%, transparent);
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  }
  
  .tag-icon {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--accent);
  }
  
  .tag-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: #fff;
  }
  
  .tag-count {
    padding: 2px 6px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .group-tag.selected .tag-count {
    background: color-mix(in srgb, var(--accent) 25%, transparent);
    color: var(--accent);
  }
  
  .check-mark {
    font-size: 0.75rem;
    color: var(--accent);
    animation: popIn 0.2s ease;
  }
  
  @keyframes popIn {
    from { transform: scale(0); }
    to { transform: scale(1); }
  }
</style>
```

---

### 6. Invite Modal

User invitation dialog:

```svelte
<script>
  let isOpen = $state(true);
  let email = $state('');
  let invitees = $state([
    { email: 'john@example.com', status: 'pending' },
    { email: 'jane@example.com', status: 'sent' }
  ]);
  
  function addInvitee() {
    if (email && email.includes('@')) {
      invitees = [...invitees, { email, status: 'pending' }];
      email = '';
    }
  }
  
  function removeInvitee(emailToRemove) {
    invitees = invitees.filter(i => i.email !== emailToRemove);
  }
</script>

{#if isOpen}
  <div class="modal-overlay">
    <div class="invite-modal">
      <div class="modal-header">
        <h2 class="modal-title">Invite teammates</h2>
        <button class="close-btn" onclick={() => isOpen = false}>✕</button>
      </div>
      
      <div class="modal-content">
        <p class="invite-description">
          Invite people to join your workspace. They'll receive an email invitation.
        </p>
        
        <div class="input-group">
          <input
            type="email"
            placeholder="name@company.com"
            bind:value={email}
            onkeydown={(e) => e.key === 'Enter' && addInvitee()}
          />
          <button class="add-btn" onclick={addInvitee}>Add</button>
        </div>
        
        {#if invitees.length > 0}
          <div class="invitee-list">
            {#each invitees as invitee}
              <div class="invitee-item">
                <div class="invitee-avatar">
                  {invitee.email[0].toUpperCase()}
                </div>
                <span class="invitee-email">{invitee.email}</span>
                <span class="invitee-status" class:sent={invitee.status === 'sent'}>
                  {invitee.status}
                </span>
                <button 
                  class="remove-btn"
                  onclick={() => removeInvitee(invitee.email)}
                >
                  ✕
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      
      <div class="modal-footer">
        <button class="cancel-btn" onclick={() => isOpen = false}>Cancel</button>
        <button class="send-btn" disabled={invitees.length === 0}>
          Send {invitees.length > 0 ? `(${invitees.length})` : ''} invitations
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
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
  
  .invite-modal {
    width: 100%;
    max-width: 480px;
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    overflow: hidden;
    animation: slideUp 0.3s ease;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
  }
  
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .modal-title {
    margin: 0;
    font-size: 1.25rem;
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
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  
  .modal-content {
    padding: 24px;
  }
  
  .invite-description {
    margin: 0 0 20px;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.5;
  }
  
  .input-group {
    display: flex;
    gap: 10px;
  }
  
  .input-group input {
    flex: 1;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    color: #fff;
    font-size: 0.9rem;
    outline: none;
    transition: all 0.15s ease;
  }
  
  .input-group input:focus {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.05);
  }
  
  .input-group input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  .add-btn {
    padding: 12px 20px;
    background: #6366f1;
    border: none;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .add-btn:hover {
    background: #5558e3;
  }
  
  .invitee-list {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .invitee-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
    animation: slideIn 0.2s ease;
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  .invitee-avatar {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #374151, #4b5563);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: #fff;
  }
  
  .invitee-email {
    flex: 1;
    font-size: 0.9rem;
    color: #fff;
  }
  
  .invitee-status {
    padding: 4px 10px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
  }
  
  .invitee-status.sent {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
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
    transition: all 0.15s ease;
  }
  
  .remove-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    background: rgba(0, 0, 0, 0.2);
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }
  
  .cancel-btn {
    padding: 10px 20px;
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .cancel-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
  
  .send-btn {
    padding: 10px 24px;
    background: #6366f1;
    border: none;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .send-btn:hover:not(:disabled) {
    background: #5558e3;
  }
  
  .send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
```

---

### 7. Role Badge

User role indicator:

```svelte
<script>
  let roles = $state([
    { id: 'owner', label: 'Owner', color: '#f59e0b', icon: '👑' },
    { id: 'admin', label: 'Admin', color: '#ef4444', icon: '⚡' },
    { id: 'member', label: 'Member', color: '#6366f1', icon: '●' },
    { id: 'guest', label: 'Guest', color: '#6b7280', icon: '○' }
  ]);
  
  let selectedRole = $state('member');
</script>

<div class="role-section">
  <span class="section-label">Select role:</span>
  
  <div class="role-options">
    {#each roles as role}
      <button
        class="role-badge"
        class:selected={selectedRole === role.id}
        style="--accent: {role.color}"
        onclick={() => selectedRole = role.id}
      >
        <span class="role-icon">{role.icon}</span>
        <span class="role-label">{role.label}</span>
      </button>
    {/each}
  </div>
  
  <div class="role-description">
    {#if selectedRole === 'owner'}
      Full control over the workspace, billing, and all settings.
    {:else if selectedRole === 'admin'}
      Can manage channels, members, and workspace settings.
    {:else if selectedRole === 'member'}
      Can participate in channels and direct messages.
    {:else}
      Limited access to specific channels only.
    {/if}
  </div>
</div>

<style>
  .role-section {
    max-width: 400px;
  }
  
  .section-label {
    display: block;
    margin-bottom: 12px;
    font-size: 0.85rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .role-options {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .role-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.04);
    border: 2px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .role-badge:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  
  .role-badge.selected {
    background: color-mix(in srgb, var(--accent) 15%, transparent);
    border-color: var(--accent);
  }
  
  .role-icon {
    font-size: 0.9rem;
  }
  
  .role-label {
    font-size: 0.9rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .role-badge.selected .role-label {
    color: #fff;
  }
  
  .role-description {
    margin-top: 16px;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.5;
    animation: fadeIn 0.2s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
```

---

### 8. Activity Feed

User activity stream:

```svelte
<script>
  let activities = $state([
    { id: 1, user: 'Alice', action: 'joined', target: '#design-system', time: '2 min ago', icon: '➕' },
    { id: 2, user: 'Bob', action: 'shared', target: 'Project Brief.pdf', time: '15 min ago', icon: '📄' },
    { id: 3, user: 'Carol', action: 'mentioned you in', target: '#general', time: '1 hour ago', icon: '@' },
    { id: 4, user: 'Dan', action: 'reacted to your message', target: '👍', time: '2 hours ago', icon: '😀' }
  ]);
</script>

<div class="activity-feed">
  <div class="feed-header">
    <h3 class="feed-title">Activity</h3>
    <button class="mark-read-btn">Mark all read</button>
  </div>
  
  <div class="feed-list">
    {#each activities as activity, i}
      <div class="activity-item" style="--delay: {i * 50}ms">
        <div class="activity-icon">{activity.icon}</div>
        <div class="activity-content">
          <p class="activity-text">
            <strong>{activity.user}</strong> {activity.action} <span class="target">{activity.target}</span>
          </p>
          <span class="activity-time">{activity.time}</span>
        </div>
        <button class="dismiss-btn">✕</button>
      </div>
    {/each}
  </div>
  
  <button class="view-all-btn">View all activity</button>
</div>

<style>
  .activity-feed {
    max-width: 360px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    overflow: hidden;
  }
  
  .feed-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .feed-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
  }
  
  .mark-read-btn {
    font-size: 0.75rem;
    color: #6366f1;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.15s ease;
  }
  
  .mark-read-btn:hover {
    color: #818cf8;
  }
  
  .feed-list {
    padding: 8px;
  }
  
  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border-radius: 10px;
    transition: background 0.15s ease;
    animation: slideIn 0.25s ease backwards;
    animation-delay: var(--delay);
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .activity-item:hover {
    background: rgba(255, 255, 255, 0.03);
  }
  
  .activity-icon {
    width: 32px;
    height: 32px;
    background: rgba(99, 102, 241, 0.15);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    flex-shrink: 0;
  }
  
  .activity-content {
    flex: 1;
    min-width: 0;
  }
  
  .activity-text {
    margin: 0 0 4px;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.4;
  }
  
  .activity-text strong {
    color: #fff;
    font-weight: 600;
  }
  
  .activity-text .target {
    color: #6366f1;
  }
  
  .activity-time {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.35);
  }
  
  .dismiss-btn {
    width: 24px;
    height: 24px;
    background: none;
    border: none;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.25);
    font-size: 0.7rem;
    cursor: pointer;
    opacity: 0;
    transition: all 0.15s ease;
  }
  
  .activity-item:hover .dismiss-btn {
    opacity: 1;
  }
  
  .dismiss-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  
  .view-all-btn {
    width: 100%;
    padding: 14px;
    background: none;
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 0.85rem;
    font-weight: 500;
    color: #6366f1;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .view-all-btn:hover {
    background: rgba(99, 102, 241, 0.05);
  }
</style>
```

---

## Summary

This collection provides user and team components:

1. **User Profile Card** — Hoverable profile with tabs and actions
2. **User Mention Chip** — Inline mention with preview popup
3. **Team Directory** — Searchable team member list
4. **Avatar Stack** — Overlapping group avatars
5. **User Group Tag** — Department or team tag selector
6. **Invite Modal** — User invitation dialog
7. **Role Badge** — User role indicator selector
8. **Activity Feed** — User activity stream

---

*People power products. Design interfaces that celebrate the humans behind them.*
