# Slack UI Library V ◈

**Calls & Huddles** — Real-time collaboration.

---

## Introduction

This collection provides components for real-time communication features like video calls, huddles, and screen sharing. From call controls to participant grids, these elements power live collaboration.

---

## Component Collection

Seven call and huddle components for real-time communication.

---

### 1. Huddle Bar

Floating huddle control bar:

```svelte
<script>
  let isMuted = $state(false);
  let isDeafened = $state(false);
  let showParticipants = $state(false);
  
  const participants = [
    { name: 'You', speaking: false, muted: false },
    { name: 'Alice', speaking: true, muted: false },
    { name: 'Bob', speaking: false, muted: true }
  ];
  
  const speakingCount = $derived(participants.filter(p => p.speaking).length);
</script>

<div class="huddle-bar">
  <div class="huddle-info">
    <div class="huddle-icon">
      <span class="icon-pulse"></span>
      🎧
    </div>
    <div class="huddle-details">
      <span class="huddle-channel">#design-team</span>
      <span class="huddle-status">
        {speakingCount > 0 ? `${participants.find(p => p.speaking)?.name} is speaking` : 'Huddle active'}
      </span>
    </div>
  </div>
  
  <div class="participant-avatars" onclick={() => showParticipants = !showParticipants}>
    {#each participants as participant}
      <div 
        class="mini-avatar"
        class:speaking={participant.speaking}
        title={participant.name}
      >
        {participant.name[0]}
      </div>
    {/each}
    <span class="participant-count">{participants.length}</span>
  </div>
  
  <div class="huddle-controls">
    <button 
      class="control-btn"
      class:active={isMuted}
      onclick={() => isMuted = !isMuted}
      title={isMuted ? 'Unmute' : 'Mute'}
    >
      {isMuted ? '🔇' : '🎤'}
    </button>
    
    <button 
      class="control-btn"
      class:active={isDeafened}
      onclick={() => isDeafened = !isDeafened}
      title={isDeafened ? 'Undeafen' : 'Deafen'}
    >
      {isDeafened ? '🔈' : '🔊'}
    </button>
    
    <button class="control-btn screen" title="Share screen">
      🖥️
    </button>
    
    <button class="control-btn leave" title="Leave huddle">
      ✕
    </button>
  </div>
  
  {#if showParticipants}
    <div class="participants-dropdown">
      <div class="dropdown-header">
        <span class="header-title">In this huddle</span>
        <span class="header-count">{participants.length}</span>
      </div>
      {#each participants as participant}
        <div class="participant-row">
          <div class="participant-avatar" class:speaking={participant.speaking}>
            {participant.name[0]}
          </div>
          <span class="participant-name">
            {participant.name}
            {#if participant.name === 'You'}
              <span class="you-badge">(you)</span>
            {/if}
          </span>
          {#if participant.muted}
            <span class="muted-icon">🔇</span>
          {/if}
        </div>
      {/each}
      <button class="invite-btn">+ Invite people</button>
    </div>
  {/if}
</div>

<style>
  .huddle-bar {
    position: relative;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background: linear-gradient(135deg, #1e3a5f, #1a1a2e);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
  
  .huddle-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .huddle-icon {
    position: relative;
    font-size: 1.3rem;
  }
  
  .icon-pulse {
    position: absolute;
    inset: -6px;
    background: rgba(34, 197, 94, 0.3);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(0.8); opacity: 0.5; }
    50% { transform: scale(1.2); opacity: 0; }
  }
  
  .huddle-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .huddle-channel {
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
  }
  
  .huddle-status {
    font-size: 0.75rem;
    color: #22c55e;
  }
  
  .participant-avatars {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
    transition: background 0.15s ease;
  }
  
  .participant-avatars:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .mini-avatar {
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #374151, #4b5563);
    border: 2px solid #1e3a5f;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 600;
    color: #fff;
    margin-left: -8px;
    transition: all 0.15s ease;
  }
  
  .mini-avatar:first-child {
    margin-left: 0;
  }
  
  .mini-avatar.speaking {
    border-color: #22c55e;
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.3);
  }
  
  .participant-count {
    margin-left: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .huddle-controls {
    display: flex;
    gap: 6px;
    margin-left: auto;
  }
  
  .control-btn {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 10px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .control-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .control-btn.active {
    background: rgba(239, 68, 68, 0.3);
  }
  
  .control-btn.leave {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  
  .control-btn.leave:hover {
    background: #ef4444;
    color: #fff;
  }
  
  .participants-dropdown {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 12px;
    width: 240px;
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    overflow: hidden;
    animation: slideDown 0.2s ease;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
    z-index: 100;
  }
  
  @keyframes slideDown {
    from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  
  .dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .header-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
  }
  
  .header-count {
    padding: 2px 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .participant-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
  }
  
  .participant-avatar {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #374151, #4b5563);
    border: 2px solid transparent;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: #fff;
    transition: all 0.15s ease;
  }
  
  .participant-avatar.speaking {
    border-color: #22c55e;
  }
  
  .participant-name {
    flex: 1;
    font-size: 0.9rem;
    color: #fff;
  }
  
  .you-badge {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.8rem;
  }
  
  .muted-icon {
    font-size: 0.85rem;
    opacity: 0.5;
  }
  
  .invite-btn {
    width: 100%;
    padding: 14px;
    background: none;
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 0.85rem;
    color: #6366f1;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  
  .invite-btn:hover {
    background: rgba(99, 102, 241, 0.08);
  }
</style>
```

---

### 2. Video Tile

Participant video with controls:

```svelte
<script>
  let isMuted = $state(false);
  let isPinned = $state(false);
  let isHovered = $state(false);
  let isSpeaking = $state(true);
  
  const participant = {
    name: 'Sarah Chen',
    role: 'Host'
  };
</script>

<div 
  class="video-tile"
  class:speaking={isSpeaking}
  class:pinned={isPinned}
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}
>
  <div class="video-content">
    <div class="video-placeholder">
      <div class="avatar-large">SC</div>
    </div>
  </div>
  
  <div class="video-overlay" class:visible={isHovered}>
    <div class="overlay-actions">
      <button 
        class="action-btn"
        class:active={isPinned}
        onclick={() => isPinned = !isPinned}
        title={isPinned ? 'Unpin' : 'Pin'}
      >
        📌
      </button>
      <button class="action-btn" title="Fullscreen">
        ⛶
      </button>
      <button class="action-btn" title="More options">
        ⋯
      </button>
    </div>
  </div>
  
  <div class="video-footer">
    <div class="participant-info">
      <span class="participant-name">{participant.name}</span>
      {#if participant.role === 'Host'}
        <span class="host-badge">Host</span>
      {/if}
    </div>
    
    <div class="status-icons">
      {#if isMuted}
        <span class="status-icon muted">🔇</span>
      {/if}
      {#if isSpeaking && !isMuted}
        <span class="status-icon speaking">
          <span class="wave"></span>
          <span class="wave"></span>
          <span class="wave"></span>
        </span>
      {/if}
    </div>
  </div>
  
  {#if isPinned}
    <div class="pinned-indicator">📌</div>
  {/if}
</div>

<style>
  .video-tile {
    position: relative;
    aspect-ratio: 16/9;
    background: #111113;
    border: 2px solid transparent;
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.2s ease;
  }
  
  .video-tile.speaking {
    border-color: #22c55e;
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
  }
  
  .video-tile.pinned {
    border-color: #f59e0b;
  }
  
  .video-content {
    width: 100%;
    height: 100%;
  }
  
  .video-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(145deg, #1a1a1d, #111113);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .avatar-large {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    font-weight: 700;
    color: #fff;
  }
  
  .video-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.5) 100%);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .video-overlay.visible {
    opacity: 1;
  }
  
  .overlay-actions {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    gap: 6px;
  }
  
  .action-btn {
    width: 36px;
    height: 36px;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.15s ease;
    backdrop-filter: blur(4px);
  }
  
  .action-btn:hover {
    background: rgba(0, 0, 0, 0.7);
  }
  
  .action-btn.active {
    background: rgba(245, 158, 11, 0.5);
  }
  
  .video-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  }
  
  .participant-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .participant-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
  
  .host-badge {
    padding: 2px 8px;
    background: rgba(99, 102, 241, 0.5);
    border-radius: 6px;
    font-size: 0.65rem;
    font-weight: 600;
    color: #fff;
    text-transform: uppercase;
  }
  
  .status-icons {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .status-icon {
    font-size: 0.9rem;
  }
  
  .status-icon.muted {
    opacity: 0.7;
  }
  
  .status-icon.speaking {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 16px;
  }
  
  .wave {
    width: 3px;
    height: 8px;
    background: #22c55e;
    border-radius: 2px;
    animation: wave 0.5s ease-in-out infinite alternate;
  }
  
  .wave:nth-child(2) {
    animation-delay: 0.15s;
    height: 12px;
  }
  
  .wave:nth-child(3) {
    animation-delay: 0.3s;
  }
  
  @keyframes wave {
    from { height: 4px; }
    to { height: 16px; }
  }
  
  .pinned-indicator {
    position: absolute;
    top: 12px;
    left: 12px;
    font-size: 1.1rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  }
</style>
```

---

### 3. Call Controls

Bottom call control bar:

```svelte
<script>
  let isMuted = $state(false);
  let isCameraOn = $state(true);
  let isScreenSharing = $state(false);
  let isRecording = $state(false);
  let showMore = $state(false);
</script>

<div class="call-controls">
  <div class="controls-left">
    <div class="call-timer">
      <span class="timer-dot"></span>
      <span class="timer-text">24:35</span>
    </div>
  </div>
  
  <div class="controls-center">
    <button 
      class="control-btn"
      class:active={isMuted}
      onclick={() => isMuted = !isMuted}
    >
      <span class="btn-icon">{isMuted ? '🔇' : '🎤'}</span>
      <span class="btn-label">{isMuted ? 'Unmute' : 'Mute'}</span>
    </button>
    
    <button 
      class="control-btn"
      class:active={!isCameraOn}
      onclick={() => isCameraOn = !isCameraOn}
    >
      <span class="btn-icon">{isCameraOn ? '📹' : '📷'}</span>
      <span class="btn-label">{isCameraOn ? 'Stop video' : 'Start video'}</span>
    </button>
    
    <button 
      class="control-btn"
      class:sharing={isScreenSharing}
      onclick={() => isScreenSharing = !isScreenSharing}
    >
      <span class="btn-icon">🖥️</span>
      <span class="btn-label">{isScreenSharing ? 'Stop share' : 'Share'}</span>
    </button>
    
    <button 
      class="control-btn"
      class:recording={isRecording}
      onclick={() => isRecording = !isRecording}
    >
      <span class="btn-icon">{isRecording ? '⏹️' : '⏺️'}</span>
      <span class="btn-label">{isRecording ? 'Stop' : 'Record'}</span>
    </button>
    
    <div class="control-divider"></div>
    
    <button class="control-btn end-call">
      <span class="btn-icon">📞</span>
      <span class="btn-label">Leave</span>
    </button>
  </div>
  
  <div class="controls-right">
    <button class="control-btn icon-only" title="Participants">
      👥
      <span class="badge">4</span>
    </button>
    
    <button class="control-btn icon-only" title="Chat">
      💬
    </button>
    
    <div class="more-wrapper">
      <button 
        class="control-btn icon-only"
        onclick={() => showMore = !showMore}
        title="More options"
      >
        ⋯
      </button>
      
      {#if showMore}
        <div class="more-menu">
          <button class="menu-item">🎨 Change background</button>
          <button class="menu-item">⚙️ Audio settings</button>
          <button class="menu-item">📐 Change layout</button>
          <button class="menu-item">📋 Copy invite link</button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .call-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: linear-gradient(180deg, rgba(17, 17, 19, 0.95), #111113);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(12px);
  }
  
  .controls-left,
  .controls-right {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 180px;
  }
  
  .controls-right {
    justify-content: flex-end;
  }
  
  .call-timer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 20px;
  }
  
  .timer-dot {
    width: 8px;
    height: 8px;
    background: #22c55e;
    border-radius: 50%;
    animation: blink 1s ease-in-out infinite;
  }
  
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .timer-text {
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    font-variant-numeric: tabular-nums;
  }
  
  .controls-center {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .control-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.08);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .control-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  
  .control-btn.active {
    background: rgba(239, 68, 68, 0.2);
  }
  
  .control-btn.active:hover {
    background: rgba(239, 68, 68, 0.3);
  }
  
  .control-btn.sharing {
    background: rgba(34, 197, 94, 0.2);
  }
  
  .control-btn.recording {
    background: rgba(239, 68, 68, 0.2);
  }
  
  .control-btn.recording .btn-icon {
    animation: pulse 1s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .control-btn.end-call {
    background: #ef4444;
  }
  
  .control-btn.end-call:hover {
    background: #dc2626;
  }
  
  .control-btn.icon-only {
    position: relative;
    width: 48px;
    height: 48px;
    padding: 0;
    font-size: 1.2rem;
  }
  
  .btn-icon {
    font-size: 1.2rem;
  }
  
  .btn-label {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .control-divider {
    width: 1px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    margin: 0 8px;
  }
  
  .badge {
    position: absolute;
    top: 4px;
    right: 4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    background: #6366f1;
    border-radius: 9px;
    font-size: 0.65rem;
    font-weight: 700;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .more-wrapper {
    position: relative;
  }
  
  .more-menu {
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: 12px;
    min-width: 200px;
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 8px;
    animation: slideUp 0.2s ease;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  }
  
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 14px;
    background: none;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
    text-align: left;
    cursor: pointer;
    transition: background 0.1s ease;
  }
  
  .menu-item:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
</style>
```

---

### 4. Screen Share Preview

Screen sharing indicator:

```svelte
<script>
  let isSharing = $state(true);
  let showControls = $state(false);
</script>

<div 
  class="screen-share-preview"
  onmouseenter={() => showControls = true}
  onmouseleave={() => showControls = false}
>
  <div class="preview-header">
    <div class="sharing-status">
      <span class="status-dot"></span>
      <span class="status-text">You're sharing your screen</span>
    </div>
    <button class="stop-sharing-btn" onclick={() => isSharing = false}>
      Stop sharing
    </button>
  </div>
  
  <div class="preview-content">
    <div class="screen-placeholder">
      <span class="screen-icon">🖥️</span>
      <span class="screen-label">Your screen</span>
    </div>
    
    <div class="preview-overlay" class:visible={showControls}>
      <div class="overlay-actions">
        <button class="action-btn">
          <span class="btn-icon">🔊</span>
          Share audio
        </button>
        <button class="action-btn">
          <span class="btn-icon">✏️</span>
          Annotate
        </button>
        <button class="action-btn">
          <span class="btn-icon">⏸️</span>
          Pause
        </button>
      </div>
    </div>
  </div>
  
  <div class="viewer-count">
    <span class="viewer-icon">👁️</span>
    <span class="viewer-text">3 people viewing</span>
  </div>
</div>

<style>
  .screen-share-preview {
    max-width: 400px;
    background: #0c0c0e;
    border: 2px solid #22c55e;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 0 24px rgba(34, 197, 94, 0.15);
  }
  
  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: rgba(34, 197, 94, 0.1);
    border-bottom: 1px solid rgba(34, 197, 94, 0.2);
  }
  
  .sharing-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .status-dot {
    width: 8px;
    height: 8px;
    background: #22c55e;
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
    50% { opacity: 0.8; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
  }
  
  .status-text {
    font-size: 0.85rem;
    font-weight: 500;
    color: #22c55e;
  }
  
  .stop-sharing-btn {
    padding: 6px 14px;
    background: #ef4444;
    border: none;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .stop-sharing-btn:hover {
    background: #dc2626;
  }
  
  .preview-content {
    position: relative;
    aspect-ratio: 16/9;
  }
  
  .screen-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(145deg, #1a1a1d, #111113);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  
  .screen-icon {
    font-size: 3rem;
    opacity: 0.3;
  }
  
  .screen-label {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .preview-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .preview-overlay.visible {
    opacity: 1;
  }
  
  .overlay-actions {
    display: flex;
    gap: 12px;
  }
  
  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px 18px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 12px;
    font-size: 0.75rem;
    color: #fff;
    cursor: pointer;
    transition: all 0.15s ease;
    backdrop-filter: blur(4px);
  }
  
  .action-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
  
  .btn-icon {
    font-size: 1.2rem;
  }
  
  .viewer-count {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
  }
  
  .viewer-icon {
    font-size: 0.85rem;
    opacity: 0.6;
  }
  
  .viewer-text {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
  }
</style>
```

---

### 5. Participant Grid

Video call grid layout:

```svelte
<script>
  let participants = $state([
    { id: 1, name: 'You', initials: 'ME', speaking: false, muted: false },
    { id: 2, name: 'Alice', initials: 'AC', speaking: true, muted: false },
    { id: 3, name: 'Bob', initials: 'BS', speaking: false, muted: true },
    { id: 4, name: 'Carol', initials: 'CD', speaking: false, muted: false }
  ]);
  
  let layout = $state('grid');
</script>

<div class="grid-container">
  <div class="layout-controls">
    <button 
      class="layout-btn"
      class:active={layout === 'grid'}
      onclick={() => layout = 'grid'}
    >
      Grid
    </button>
    <button 
      class="layout-btn"
      class:active={layout === 'speaker'}
      onclick={() => layout = 'speaker'}
    >
      Speaker
    </button>
  </div>
  
  <div 
    class="participant-grid"
    class:speaker-view={layout === 'speaker'}
  >
    {#each participants as participant, i}
      <div 
        class="grid-tile"
        class:speaking={participant.speaking}
        class:main={layout === 'speaker' && i === 1}
        style="--delay: {i * 50}ms"
      >
        <div class="tile-content">
          <div class="tile-avatar">
            {participant.initials}
          </div>
        </div>
        
        <div class="tile-footer">
          <span class="tile-name">{participant.name}</span>
          {#if participant.muted}
            <span class="muted-icon">🔇</span>
          {/if}
        </div>
        
        {#if participant.speaking}
          <div class="speaking-border"></div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .grid-container {
    max-width: 600px;
  }
  
  .layout-controls {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    padding: 4px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    width: fit-content;
  }
  
  .layout-btn {
    padding: 8px 16px;
    background: none;
    border: none;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .layout-btn:hover {
    color: #fff;
  }
  
  .layout-btn.active {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  
  .participant-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .participant-grid.speaker-view {
    grid-template-columns: 1fr;
    grid-template-rows: 2fr 1fr;
  }
  
  .participant-grid.speaker-view .grid-tile:not(.main) {
    display: none;
  }
  
  .participant-grid.speaker-view .grid-tile.main {
    display: block;
  }
  
  .grid-tile {
    position: relative;
    aspect-ratio: 16/9;
    background: #111113;
    border: 2px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    overflow: hidden;
    animation: fadeIn 0.3s ease backwards;
    animation-delay: var(--delay);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  
  .grid-tile.speaking {
    border-color: #22c55e;
  }
  
  .tile-content {
    width: 100%;
    height: 100%;
    background: linear-gradient(145deg, #1a1a1d, #111113);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .tile-avatar {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: 700;
    color: #fff;
  }
  
  .participant-grid.speaker-view .grid-tile.main .tile-avatar {
    width: 100px;
    height: 100px;
    font-size: 2rem;
    border-radius: 24px;
  }
  
  .tile-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  }
  
  .tile-name {
    font-size: 0.8rem;
    font-weight: 500;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
  
  .muted-icon {
    font-size: 0.75rem;
    opacity: 0.7;
  }
  
  .speaking-border {
    position: absolute;
    inset: -2px;
    border: 2px solid #22c55e;
    border-radius: 14px;
    animation: speakPulse 1s ease-in-out infinite;
    pointer-events: none;
  }
  
  @keyframes speakPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
```

---

### 6. Incoming Call

Call notification modal:

```svelte
<script>
  let isVisible = $state(true);
  
  const caller = {
    name: 'Sarah Chen',
    initials: 'SC',
    channel: '#design-team'
  };
</script>

{#if isVisible}
  <div class="incoming-call-overlay">
    <div class="incoming-call-modal">
      <div class="call-animation">
        <div class="ring ring-1"></div>
        <div class="ring ring-2"></div>
        <div class="ring ring-3"></div>
        <div class="caller-avatar">
          {caller.initials}
        </div>
      </div>
      
      <div class="call-info">
        <h3 class="caller-name">{caller.name}</h3>
        <p class="call-type">Huddle in {caller.channel}</p>
      </div>
      
      <div class="call-actions">
        <button 
          class="call-btn decline"
          onclick={() => isVisible = false}
        >
          <span class="btn-icon">✕</span>
          <span class="btn-label">Decline</span>
        </button>
        
        <button class="call-btn accept">
          <span class="btn-icon">🎧</span>
          <span class="btn-label">Join</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .incoming-call-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .incoming-call-modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px;
    background: linear-gradient(145deg, #1a1a2e, #111113);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 32px;
    animation: slideUp 0.4s ease;
    box-shadow: 0 32px 80px rgba(0, 0, 0, 0.5);
  }
  
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(32px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  
  .call-animation {
    position: relative;
    width: 140px;
    height: 140px;
    margin-bottom: 32px;
  }
  
  .ring {
    position: absolute;
    inset: 0;
    border: 2px solid #22c55e;
    border-radius: 50%;
    animation: ring 2s ease-out infinite;
  }
  
  .ring-2 {
    animation-delay: 0.4s;
  }
  
  .ring-3 {
    animation-delay: 0.8s;
  }
  
  @keyframes ring {
    0% {
      transform: scale(0.8);
      opacity: 0.8;
    }
    100% {
      transform: scale(1.4);
      opacity: 0;
    }
  }
  
  .caller-avatar {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.2rem;
    font-weight: 700;
    color: #fff;
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.05); }
  }
  
  .call-info {
    text-align: center;
    margin-bottom: 40px;
  }
  
  .caller-name {
    margin: 0 0 8px;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
  }
  
  .call-type {
    margin: 0;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .call-actions {
    display: flex;
    gap: 24px;
  }
  
  .call-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 20px 40px;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .call-btn.decline {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  
  .call-btn.decline:hover {
    background: #ef4444;
    color: #fff;
    transform: scale(1.05);
  }
  
  .call-btn.accept {
    background: #22c55e;
    color: #fff;
  }
  
  .call-btn.accept:hover {
    background: #16a34a;
    transform: scale(1.05);
  }
  
  .btn-icon {
    font-size: 1.5rem;
  }
  
  .btn-label {
    font-size: 0.9rem;
    font-weight: 600;
  }
</style>
```

---

### 7. Audio Levels

Voice activity visualization:

```svelte
<script>
  let levels = $state([30, 60, 90, 70, 40, 80, 50, 65, 45, 85, 35, 75]);
  
  $effect(() => {
    const interval = setInterval(() => {
      levels = levels.map(() => 20 + Math.random() * 80);
    }, 100);
    
    return () => clearInterval(interval);
  });
</script>

<div class="audio-levels-container">
  <div class="levels-header">
    <span class="header-icon">🎤</span>
    <span class="header-text">Audio Input</span>
    <span class="level-indicator">Good</span>
  </div>
  
  <div class="levels-display">
    <div class="levels-bar">
      {#each levels as level, i}
        <div 
          class="level-segment"
          style="
            --height: {level}%;
            --delay: {i * 10}ms;
          "
          class:low={level < 40}
          class:medium={level >= 40 && level < 70}
          class:high={level >= 70}
        ></div>
      {/each}
    </div>
    
    <div class="level-scale">
      <span class="scale-mark">-60dB</span>
      <span class="scale-mark">-30dB</span>
      <span class="scale-mark">0dB</span>
    </div>
  </div>
  
  <div class="levels-footer">
    <div class="device-selector">
      <span class="device-icon">🎙️</span>
      <select class="device-select">
        <option>MacBook Pro Microphone</option>
        <option>External USB Mic</option>
      </select>
    </div>
    
    <div class="volume-control">
      <span class="volume-icon">🔊</span>
      <input type="range" min="0" max="100" value="75" class="volume-slider" />
    </div>
  </div>
</div>

<style>
  .audio-levels-container {
    max-width: 360px;
    padding: 20px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
  }
  
  .levels-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .header-icon {
    font-size: 1rem;
  }
  
  .header-text {
    flex: 1;
    font-size: 0.95rem;
    font-weight: 600;
    color: #fff;
  }
  
  .level-indicator {
    padding: 4px 10px;
    background: rgba(34, 197, 94, 0.15);
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #22c55e;
  }
  
  .levels-display {
    margin-bottom: 20px;
  }
  
  .levels-bar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    height: 80px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
  }
  
  .level-segment {
    flex: 1;
    margin: 0 2px;
    height: var(--height);
    min-height: 4px;
    border-radius: 2px;
    transition: height 0.1s ease, background 0.15s ease;
  }
  
  .level-segment.low {
    background: #22c55e;
  }
  
  .level-segment.medium {
    background: linear-gradient(0deg, #22c55e, #eab308);
  }
  
  .level-segment.high {
    background: linear-gradient(0deg, #22c55e, #eab308, #ef4444);
  }
  
  .level-scale {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    padding: 0 8px;
  }
  
  .scale-mark {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.3);
    font-variant-numeric: tabular-nums;
  }
  
  .levels-footer {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .device-selector {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 10px;
  }
  
  .device-icon {
    font-size: 0.9rem;
    opacity: 0.6;
  }
  
  .device-select {
    flex: 1;
    background: none;
    border: none;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    outline: none;
  }
  
  .volume-control {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 10px;
  }
  
  .volume-icon {
    font-size: 0.9rem;
    opacity: 0.6;
  }
  
  .volume-slider {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
    appearance: none;
    cursor: pointer;
  }
  
  .volume-slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.15s ease;
  }
  
  .volume-slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }
</style>
```

---

## Summary

This collection provides call and huddle components:

1. **Huddle Bar** — Floating huddle control bar with participants
2. **Video Tile** — Participant video with speaking indicator
3. **Call Controls** — Bottom call control bar with mute/video/share
4. **Screen Share Preview** — Screen sharing indicator with controls
5. **Participant Grid** — Video call grid layout with speaker view
6. **Incoming Call** — Call notification modal with animations
7. **Audio Levels** — Voice activity visualization with device settings

---

*Communication transcends distance. Build tools that bring voices together.*
