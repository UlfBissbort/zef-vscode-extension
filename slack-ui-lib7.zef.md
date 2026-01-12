# Slack UI Library I ◈

**Core Messaging** — The heart of team communication.

---

## Introduction

This collection provides the essential messaging components for building a modern Slack-like application. Each component is crafted for real-time collaboration, featuring smooth animations and dark theme elegance.

---

## Component Collection

Seven core messaging components for chat applications.

---

### 1. Message Bubble

Rich message bubble with reactions and actions:

```svelte
<script>
  let showActions = $state(false);
  let reactions = $state([
    { emoji: '👍', count: 3, reacted: false },
    { emoji: '❤️', count: 1, reacted: true }
  ]);
  
  function toggleReaction(index) {
    reactions = reactions.map((r, i) => {
      if (i === index) {
        return {
          ...r,
          count: r.reacted ? r.count - 1 : r.count + 1,
          reacted: !r.reacted
        };
      }
      return r;
    }).filter(r => r.count > 0);
  }
  
  function addReaction(emoji) {
    const existing = reactions.find(r => r.emoji === emoji);
    if (existing) {
      toggleReaction(reactions.indexOf(existing));
    } else {
      reactions = [...reactions, { emoji, count: 1, reacted: true }];
    }
  }
</script>

<div 
  class="message-container"
  onmouseenter={() => showActions = true}
  onmouseleave={() => showActions = false}
>
  <div class="message-avatar">
    <span class="avatar-text">JD</span>
    <span class="status-dot online"></span>
  </div>
  
  <div class="message-content">
    <div class="message-header">
      <span class="sender-name">John Doe</span>
      <span class="message-time">11:42 AM</span>
    </div>
    
    <div class="message-body">
      <p class="message-text">
        Hey team! 👋 Just pushed the new feature branch. Would love some feedback 
        when you get a chance. The PR is ready for review.
      </p>
    </div>
    
    {#if reactions.length > 0}
      <div class="reactions-bar">
        {#each reactions as reaction, i}
          <button 
            class="reaction-chip"
            class:active={reaction.reacted}
            onclick={() => toggleReaction(i)}
          >
            <span class="reaction-emoji">{reaction.emoji}</span>
            <span class="reaction-count">{reaction.count}</span>
          </button>
        {/each}
        <button class="add-reaction-btn" onclick={() => addReaction('🎉')}>
          <span>+</span>
        </button>
      </div>
    {/if}
  </div>
  
  <div class="message-actions" class:visible={showActions}>
    <button class="action-btn" title="React">😀</button>
    <button class="action-btn" title="Reply">↩</button>
    <button class="action-btn" title="Share">↗</button>
    <button class="action-btn" title="More">⋯</button>
  </div>
</div>

<style>
  .message-container {
    position: relative;
    display: flex;
    gap: 12px;
    padding: 12px 20px;
    border-radius: 8px;
    transition: background 0.15s ease;
  }
  
  .message-container:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  
  .message-avatar {
    position: relative;
    flex-shrink: 0;
  }
  
  .avatar-text {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 700;
    color: #fff;
  }
  
  .status-dot {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    border: 2px solid #0c0c0e;
    border-radius: 50%;
  }
  
  .status-dot.online {
    background: #22c55e;
  }
  
  .message-content {
    flex: 1;
    min-width: 0;
  }
  
  .message-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 4px;
  }
  
  .sender-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: #fff;
  }
  
  .message-time {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .message-body {
    margin-bottom: 8px;
  }
  
  .message-text {
    margin: 0;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.5;
  }
  
  .reactions-bar {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  
  .reaction-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .reaction-chip:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .reaction-chip.active {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.3);
  }
  
  .reaction-emoji {
    font-size: 0.9rem;
  }
  
  .reaction-count {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .add-reaction-btn {
    width: 28px;
    height: 28px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px dashed rgba(255, 255, 255, 0.15);
    border-radius: 14px;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .add-reaction-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    border-style: solid;
    color: #fff;
  }
  
  .message-actions {
    position: absolute;
    top: 8px;
    right: 16px;
    display: flex;
    gap: 2px;
    padding: 4px;
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    opacity: 0;
    transform: translateY(-4px);
    transition: all 0.15s ease;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
  
  .message-actions.visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  .action-btn {
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.1s ease;
  }
  
  .action-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
</style>
```

---

### 2. Thread Reply

Collapsed thread preview with expand:

```svelte
<script>
  let isExpanded = $state(false);
  
  const replies = [
    { name: 'Alice', avatar: 'A', text: 'Looks great! I\'ll review it now.' },
    { name: 'Bob', avatar: 'B', text: 'Already approved ✅' },
    { name: 'Carol', avatar: 'C', text: 'Nice work on the animations!' }
  ];
</script>

<div class="thread-container">
  <button 
    class="thread-preview"
    onclick={() => isExpanded = !isExpanded}
  >
    <div class="thread-avatars">
      {#each replies.slice(0, 3) as reply}
        <span class="mini-avatar">{reply.avatar}</span>
      {/each}
    </div>
    
    <span class="thread-count">{replies.length} replies</span>
    <span class="thread-time">Last reply 5 min ago</span>
    
    <span class="expand-icon" class:rotated={isExpanded}>▾</span>
  </button>
  
  <div class="thread-replies" class:expanded={isExpanded}>
    <div class="replies-content">
      {#each replies as reply, i}
        <div class="reply-item" style="--delay: {i * 50}ms">
          <span class="reply-avatar">{reply.avatar}</span>
          <div class="reply-body">
            <span class="reply-name">{reply.name}</span>
            <p class="reply-text">{reply.text}</p>
          </div>
        </div>
      {/each}
      
      <div class="reply-input">
        <input type="text" placeholder="Reply in thread..." />
      </div>
    </div>
  </div>
</div>

<style>
  .thread-container {
    margin-left: 52px;
    border-left: 2px solid rgba(255, 255, 255, 0.08);
  }
  
  .thread-preview {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 16px;
    background: none;
    border: none;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  
  .thread-preview:hover {
    background: rgba(255, 255, 255, 0.03);
  }
  
  .thread-avatars {
    display: flex;
    margin-right: 4px;
  }
  
  .mini-avatar {
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #ec4899, #db2777);
    border: 2px solid #0c0c0e;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 700;
    color: #fff;
    margin-left: -8px;
  }
  
  .mini-avatar:first-child {
    margin-left: 0;
  }
  
  .mini-avatar:nth-child(2) {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
  }
  
  .mini-avatar:nth-child(3) {
    background: linear-gradient(135deg, #22c55e, #16a34a);
  }
  
  .thread-count {
    font-size: 0.85rem;
    font-weight: 600;
    color: #6366f1;
  }
  
  .thread-time {
    flex: 1;
    text-align: right;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .expand-icon {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
    transition: transform 0.2s ease;
  }
  
  .expand-icon.rotated {
    transform: rotate(180deg);
  }
  
  .thread-replies {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s ease;
  }
  
  .thread-replies.expanded {
    grid-template-rows: 1fr;
  }
  
  .replies-content {
    overflow: hidden;
    padding: 0 16px;
  }
  
  .thread-replies.expanded .replies-content {
    padding-bottom: 16px;
  }
  
  .reply-item {
    display: flex;
    gap: 10px;
    padding: 10px 0;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.2s ease;
    transition-delay: var(--delay);
  }
  
  .thread-replies.expanded .reply-item {
    opacity: 1;
    transform: translateY(0);
  }
  
  .reply-avatar {
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }
  
  .reply-body {
    flex: 1;
    min-width: 0;
  }
  
  .reply-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
    margin-right: 8px;
  }
  
  .reply-text {
    margin: 2px 0 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.75);
  }
  
  .reply-input {
    padding-top: 8px;
  }
  
  .reply-input input {
    width: 100%;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: #fff;
    font-size: 0.85rem;
    outline: none;
    transition: all 0.2s ease;
  }
  
  .reply-input input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  .reply-input input:focus {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.05);
  }
</style>
```

---

### 3. Message Composer

Rich text message composer with formatting:

```svelte
<script>
  let message = $state('');
  let isFocused = $state(false);
  let showEmoji = $state(false);
  
  const quickEmojis = ['😀', '👍', '❤️', '🎉', '🔥', '💯'];
  
  function insertEmoji(emoji) {
    message += emoji;
    showEmoji = false;
  }
  
  function handleSubmit() {
    if (message.trim()) {
      console.log('Sending:', message);
      message = '';
    }
  }
</script>

<div class="composer-container" class:focused={isFocused}>
  <div class="format-toolbar">
    <button class="format-btn" title="Bold">
      <strong>B</strong>
    </button>
    <button class="format-btn" title="Italic">
      <em>I</em>
    </button>
    <button class="format-btn" title="Strikethrough">
      <s>S</s>
    </button>
    <span class="toolbar-divider"></span>
    <button class="format-btn" title="Link">🔗</button>
    <button class="format-btn" title="Code">{'<>'}</button>
    <button class="format-btn" title="List">☰</button>
  </div>
  
  <div class="input-area">
    <textarea
      bind:value={message}
      placeholder="Message #general"
      onfocus={() => isFocused = true}
      onblur={() => isFocused = false}
      onkeydown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
      }}
    ></textarea>
  </div>
  
  <div class="composer-footer">
    <div class="attachment-actions">
      <button class="attach-btn" title="Attach file">📎</button>
      <div class="emoji-wrapper">
        <button 
          class="attach-btn" 
          title="Add emoji"
          onclick={() => showEmoji = !showEmoji}
        >
          😊
        </button>
        {#if showEmoji}
          <div class="emoji-picker">
            {#each quickEmojis as emoji}
              <button 
                class="emoji-option"
                onclick={() => insertEmoji(emoji)}
              >
                {emoji}
              </button>
            {/each}
          </div>
        {/if}
      </div>
      <button class="attach-btn" title="Mention">@</button>
    </div>
    
    <button 
      class="send-btn"
      class:active={message.trim().length > 0}
      onclick={handleSubmit}
      disabled={!message.trim()}
    >
      <span class="send-icon">➤</span>
    </button>
  </div>
</div>

<style>
  .composer-container {
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    overflow: hidden;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  
  .composer-container.focused {
    border-color: rgba(99, 102, 241, 0.5);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  .format-toolbar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .format-btn {
    width: 32px;
    height: 28px;
    background: none;
    border: none;
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.1s ease;
  }
  
  .format-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  
  .toolbar-divider {
    width: 1px;
    height: 20px;
    background: rgba(255, 255, 255, 0.08);
    margin: 0 4px;
  }
  
  .input-area {
    padding: 4px 12px;
  }
  
  .input-area textarea {
    width: 100%;
    min-height: 60px;
    max-height: 200px;
    background: none;
    border: none;
    color: #fff;
    font-size: 0.9rem;
    line-height: 1.5;
    resize: none;
    outline: none;
  }
  
  .input-area textarea::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  .composer-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.2);
  }
  
  .attachment-actions {
    display: flex;
    gap: 4px;
  }
  
  .attach-btn {
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.1s ease;
  }
  
  .attach-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .emoji-wrapper {
    position: relative;
  }
  
  .emoji-picker {
    position: absolute;
    bottom: 100%;
    left: 0;
    display: flex;
    gap: 4px;
    padding: 8px;
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    margin-bottom: 8px;
    animation: popUp 0.2s ease;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
  
  @keyframes popUp {
    from { opacity: 0; transform: translateY(8px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  
  .emoji-option {
    width: 36px;
    height: 36px;
    background: none;
    border: none;
    border-radius: 6px;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.1s ease;
  }
  
  .emoji-option:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.1);
  }
  
  .send-btn {
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.05);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  .send-btn.active {
    background: linear-gradient(135deg, #22c55e, #16a34a);
  }
  
  .send-btn:not(:disabled):hover {
    transform: scale(1.05);
  }
  
  .send-icon {
    color: #fff;
    font-size: 0.9rem;
  }
</style>
```

---

### 4. Typing Indicator

Real-time typing indicator for channels:

```svelte
<script>
  let typingUsers = $state(['Alice', 'Bob']);
  
  $effect(() => {
    const interval = setInterval(() => {
      typingUsers = typingUsers.length === 0 
        ? ['Alice']
        : typingUsers.length === 1 
          ? ['Alice', 'Bob']
          : [];
    }, 4000);
    
    return () => clearInterval(interval);
  });
</script>

<div class="typing-container">
  {#if typingUsers.length > 0}
    <div class="typing-indicator">
      <div class="typing-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
      
      <span class="typing-text">
        {#if typingUsers.length === 1}
          <strong>{typingUsers[0]}</strong> is typing...
        {:else if typingUsers.length === 2}
          <strong>{typingUsers[0]}</strong> and <strong>{typingUsers[1]}</strong> are typing...
        {:else}
          Several people are typing...
        {/if}
      </span>
    </div>
  {:else}
    <div class="typing-placeholder"></div>
  {/if}
</div>

<style>
  .typing-container {
    min-height: 28px;
    padding: 4px 20px;
  }
  
  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    animation: fadeIn 0.2s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .typing-dots {
    display: flex;
    gap: 3px;
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
  }
  
  .dot {
    width: 6px;
    height: 6px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    animation: typingBounce 1.4s ease-in-out infinite;
  }
  
  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes typingBounce {
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.5;
    }
    30% {
      transform: translateY(-4px);
      opacity: 1;
    }
  }
  
  .typing-text {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .typing-text strong {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 600;
  }
  
  .typing-placeholder {
    height: 20px;
  }
</style>
```

---

### 5. Message Search

Inline message search with results:

```svelte
<script>
  let query = $state('');
  let isFocused = $state(false);
  
  const recentSearches = ['design system', 'meeting notes', 'API docs'];
  const results = [
    { channel: '#general', sender: 'John', text: 'Check out the new design system', time: '2d ago' },
    { channel: '#dev', sender: 'Alice', text: 'Design patterns documentation ready', time: '5d ago' }
  ];
  
  const showDropdown = $derived(isFocused && (query.length > 0 || recentSearches.length > 0));
</script>

<div class="search-container">
  <div class="search-input-wrapper" class:focused={isFocused}>
    <span class="search-icon">🔍</span>
    <input
      type="text"
      placeholder="Search messages..."
      bind:value={query}
      onfocus={() => isFocused = true}
      onblur={() => setTimeout(() => isFocused = false, 200)}
    />
    {#if query}
      <button class="clear-btn" onclick={() => query = ''}>✕</button>
    {/if}
  </div>
  
  {#if showDropdown}
    <div class="search-dropdown">
      {#if query.length === 0}
        <div class="dropdown-section">
          <span class="section-label">Recent Searches</span>
          {#each recentSearches as search}
            <button class="search-item" onclick={() => query = search}>
              <span class="item-icon">🕐</span>
              <span class="item-text">{search}</span>
            </button>
          {/each}
        </div>
      {:else}
        <div class="dropdown-section">
          <span class="section-label">Messages</span>
          {#each results as result}
            <button class="result-item">
              <div class="result-header">
                <span class="result-channel">{result.channel}</span>
                <span class="result-time">{result.time}</span>
              </div>
              <p class="result-text">
                <strong>{result.sender}:</strong> {result.text}
              </p>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .search-container {
    position: relative;
    max-width: 400px;
  }
  
  .search-input-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    transition: all 0.2s ease;
  }
  
  .search-input-wrapper.focused {
    background: rgba(255, 255, 255, 0.08);
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  .search-icon {
    font-size: 0.9rem;
    opacity: 0.5;
  }
  
  .search-input-wrapper input {
    flex: 1;
    background: none;
    border: none;
    color: #fff;
    font-size: 0.9rem;
    outline: none;
  }
  
  .search-input-wrapper input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  .clear-btn {
    width: 20px;
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.7rem;
    cursor: pointer;
    transition: all 0.1s ease;
  }
  
  .clear-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
  
  .search-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 8px;
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    overflow: hidden;
    animation: slideDown 0.2s ease;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
  }
  
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .dropdown-section {
    padding: 8px;
  }
  
  .section-label {
    display: block;
    padding: 8px 10px 4px;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .search-item,
  .result-item {
    display: block;
    width: 100%;
    padding: 10px;
    background: none;
    border: none;
    border-radius: 8px;
    text-align: left;
    cursor: pointer;
    transition: background 0.1s ease;
  }
  
  .search-item:hover,
  .result-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .search-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .item-icon {
    font-size: 0.9rem;
    opacity: 0.5;
  }
  
  .item-text {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .result-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  
  .result-channel {
    font-size: 0.8rem;
    font-weight: 600;
    color: #6366f1;
  }
  
  .result-time {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .result-text {
    margin: 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .result-text strong {
    color: #fff;
  }
</style>
```

---

### 6. Unread Badge

Channel with unread message count:

```svelte
<script>
  let channels = $state([
    { name: 'general', unread: 0, mentions: 0 },
    { name: 'design', unread: 12, mentions: 0 },
    { name: 'dev-team', unread: 3, mentions: 2 },
    { name: 'random', unread: 47, mentions: 0 }
  ]);
  
  let activeChannel = $state('general');
  
  function selectChannel(name) {
    activeChannel = name;
    channels = channels.map(ch => 
      ch.name === name ? { ...ch, unread: 0, mentions: 0 } : ch
    );
  }
</script>

<div class="channel-list">
  <div class="section-header">
    <span class="section-title">Channels</span>
    <button class="add-channel-btn">+</button>
  </div>
  
  {#each channels as channel}
    <button 
      class="channel-item"
      class:active={activeChannel === channel.name}
      class:unread={channel.unread > 0}
      onclick={() => selectChannel(channel.name)}
    >
      <span class="channel-icon">#</span>
      <span class="channel-name">{channel.name}</span>
      
      {#if channel.mentions > 0}
        <span class="mention-badge">{channel.mentions}</span>
      {:else if channel.unread > 0}
        <span class="unread-badge">{channel.unread > 99 ? '99+' : channel.unread}</span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .channel-list {
    max-width: 260px;
    padding: 12px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 10px;
    margin-bottom: 4px;
  }
  
  .section-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .add-channel-btn {
    width: 20px;
    height: 20px;
    background: rgba(255, 255, 255, 0.05);
    border: none;
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.1s ease;
  }
  
  .add-channel-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  
  .channel-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    background: none;
    border: none;
    border-radius: 8px;
    text-align: left;
    cursor: pointer;
    transition: all 0.1s ease;
  }
  
  .channel-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .channel-item.active {
    background: rgba(99, 102, 241, 0.15);
  }
  
  .channel-icon {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .channel-item.active .channel-icon,
  .channel-item.unread .channel-icon {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .channel-name {
    flex: 1;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
    transition: color 0.1s ease;
  }
  
  .channel-item.active .channel-name,
  .channel-item.unread .channel-name {
    color: #fff;
    font-weight: 600;
  }
  
  .unread-badge {
    padding: 2px 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .mention-badge {
    padding: 2px 8px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 700;
    color: #fff;
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    50% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
  }
</style>
```

---

### 7. Message Attachments

File and link preview attachments:

```svelte
<script>
  let attachments = $state([
    { type: 'file', name: 'design-specs.pdf', size: '2.4 MB', icon: '📄' },
    { type: 'image', name: 'screenshot.png', preview: true },
    { type: 'link', title: 'GitHub - New Feature PR', url: 'github.com/project/pr/123', description: 'Adds new animation components' }
  ]);
</script>

<div class="attachments-container">
  {#each attachments as attachment}
    {#if attachment.type === 'file'}
      <div class="file-attachment">
        <div class="file-icon">{attachment.icon}</div>
        <div class="file-info">
          <span class="file-name">{attachment.name}</span>
          <span class="file-size">{attachment.size}</span>
        </div>
        <button class="download-btn">↓</button>
      </div>
    {:else if attachment.type === 'image'}
      <div class="image-attachment">
        <div class="image-preview">
          <div class="image-placeholder">🖼</div>
        </div>
        <span class="image-name">{attachment.name}</span>
      </div>
    {:else if attachment.type === 'link'}
      <a href="#" class="link-attachment">
        <div class="link-bar"></div>
        <div class="link-content">
          <span class="link-title">{attachment.title}</span>
          <span class="link-url">{attachment.url}</span>
          <p class="link-description">{attachment.description}</p>
        </div>
      </a>
    {/if}
  {/each}
</div>

<style>
  .attachments-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 400px;
  }
  
  .file-attachment {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    transition: all 0.15s ease;
  }
  
  .file-attachment:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
  }
  
  .file-icon {
    width: 40px;
    height: 40px;
    background: rgba(99, 102, 241, 0.15);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
  }
  
  .file-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .file-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
  }
  
  .file-size {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .download-btn {
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .download-btn:hover {
    background: #6366f1;
    border-color: #6366f1;
  }
  
  .image-attachment {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .image-preview {
    height: 180px;
    background: linear-gradient(145deg, #1a1a1d, #111113);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .image-placeholder {
    font-size: 3rem;
    opacity: 0.3;
  }
  
  .image-name {
    display: block;
    padding: 10px 14px;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    background: rgba(0, 0, 0, 0.3);
  }
  
  .link-attachment {
    display: flex;
    text-decoration: none;
    border-radius: 12px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.15s ease;
  }
  
  .link-attachment:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
  }
  
  .link-bar {
    width: 4px;
    background: #6366f1;
    flex-shrink: 0;
  }
  
  .link-content {
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .link-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: #6366f1;
  }
  
  .link-url {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .link-description {
    margin: 4px 0 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
  }
</style>
```

---

## Summary

This collection provides core messaging components:

1. **Message Bubble** — Rich messages with reactions and hover actions
2. **Thread Reply** — Expandable thread preview
3. **Message Composer** — Full-featured text editor
4. **Typing Indicator** — Real-time typing status
5. **Message Search** — Inline search with results
6. **Unread Badge** — Channel list with notifications
7. **Message Attachments** — Files, images, and links

---

*Communication is connection. Build tools that bring people together.*
