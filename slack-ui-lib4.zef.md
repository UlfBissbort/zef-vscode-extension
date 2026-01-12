# Slack UI Library IV ◈

**Media & Files** — Rich content sharing.

---

## Introduction

This collection provides components for handling media and file content in a Slack-like application. From file uploads to media previews, these elements enable rich content collaboration.

---

## Component Collection

Seven media and file components for content sharing.

---

### 1. File Upload Zone

Drag and drop file upload:

```svelte
<script>
  let isDragging = $state(false);
  let files = $state([]);
  let uploadProgress = $state(0);
  let isUploading = $state(false);
  
  function handleDrop(e) {
    e.preventDefault();
    isDragging = false;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }
  
  function handleSelect(e) {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  }
  
  function addFiles(newFiles) {
    const fileItems = newFiles.map(f => ({
      id: Date.now() + Math.random(),
      name: f.name,
      size: formatSize(f.size),
      type: getFileType(f.name),
      progress: 0
    }));
    files = [...files, ...fileItems];
    simulateUpload();
  }
  
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  
  function getFileType(name) {
    const ext = name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    return 'file';
  }
  
  function simulateUpload() {
    isUploading = true;
    uploadProgress = 0;
    const interval = setInterval(() => {
      uploadProgress += 10;
      if (uploadProgress >= 100) {
        clearInterval(interval);
        isUploading = false;
      }
    }, 200);
  }
  
  function removeFile(id) {
    files = files.filter(f => f.id !== id);
  }
  
  const fileIcons = {
    image: '🖼️',
    pdf: '📄',
    doc: '📝',
    file: '📎'
  };
</script>

<div class="upload-container">
  <div 
    class="drop-zone"
    class:dragging={isDragging}
    ondragover={(e) => { e.preventDefault(); isDragging = true; }}
    ondragleave={() => isDragging = false}
    ondrop={handleDrop}
  >
    <div class="drop-icon">
      <span class="icon-main">📁</span>
      <span class="icon-plus">+</span>
    </div>
    
    <p class="drop-text">
      {#if isDragging}
        Drop files here
      {:else}
        Drag & drop files or <label class="browse-link">
          browse
          <input type="file" multiple onchange={handleSelect} />
        </label>
      {/if}
    </p>
    
    <span class="drop-hint">Max 25 MB per file</span>
  </div>
  
  {#if files.length > 0}
    <div class="file-list">
      {#each files as file}
        <div class="file-item">
          <span class="file-icon">{fileIcons[file.type]}</span>
          <div class="file-info">
            <span class="file-name">{file.name}</span>
            <span class="file-size">{file.size}</span>
          </div>
          {#if isUploading}
            <div class="progress-bar">
              <div class="progress-fill" style="width: {uploadProgress}%"></div>
            </div>
          {:else}
            <span class="check-icon">✓</span>
          {/if}
          <button class="remove-btn" onclick={() => removeFile(file.id)}>✕</button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .upload-container {
    max-width: 400px;
  }
  
  .drop-zone {
    padding: 40px 32px;
    background: rgba(255, 255, 255, 0.02);
    border: 2px dashed rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    text-align: center;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .drop-zone:hover {
    border-color: rgba(99, 102, 241, 0.4);
    background: rgba(99, 102, 241, 0.03);
  }
  
  .drop-zone.dragging {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.08);
    transform: scale(1.01);
  }
  
  .drop-icon {
    position: relative;
    display: inline-block;
    margin-bottom: 16px;
  }
  
  .icon-main {
    font-size: 3rem;
    transition: transform 0.2s ease;
  }
  
  .drop-zone.dragging .icon-main {
    transform: scale(1.1);
  }
  
  .icon-plus {
    position: absolute;
    bottom: -4px;
    right: -8px;
    width: 24px;
    height: 24px;
    background: #6366f1;
    border-radius: 50%;
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .drop-text {
    margin: 0 0 8px;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .browse-link {
    color: #6366f1;
    cursor: pointer;
    transition: color 0.15s ease;
  }
  
  .browse-link:hover {
    color: #818cf8;
  }
  
  .browse-link input {
    display: none;
  }
  
  .drop-hint {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.35);
  }
  
  .file-list {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .file-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    animation: slideIn 0.2s ease;
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .file-icon {
    font-size: 1.3rem;
  }
  
  .file-info {
    flex: 1;
    min-width: 0;
  }
  
  .file-name {
    display: block;
    font-size: 0.9rem;
    font-weight: 500;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .file-size {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .progress-bar {
    width: 60px;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: #6366f1;
    transition: width 0.2s ease;
  }
  
  .check-icon {
    color: #22c55e;
    font-size: 0.9rem;
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
</style>
```

---

### 2. Image Gallery

Lightbox gallery preview:

```svelte
<script>
  let images = $state([
    { id: 1, url: '#', alt: 'Screenshot 1' },
    { id: 2, url: '#', alt: 'Screenshot 2' },
    { id: 3, url: '#', alt: 'Screenshot 3' },
    { id: 4, url: '#', alt: 'Screenshot 4' }
  ]);
  
  let lightboxOpen = $state(false);
  let activeIndex = $state(0);
  
  function openLightbox(index) {
    activeIndex = index;
    lightboxOpen = true;
  }
  
  function navigate(direction) {
    activeIndex = (activeIndex + direction + images.length) % images.length;
  }
</script>

<div class="gallery-container">
  <div class="gallery-grid">
    {#each images as image, i}
      <button 
        class="gallery-item"
        class:primary={i === 0}
        onclick={() => openLightbox(i)}
      >
        <div class="image-placeholder">
          <span class="placeholder-icon">🖼️</span>
          <span class="placeholder-text">{image.alt}</span>
        </div>
        <div class="image-overlay">
          <span class="zoom-icon">🔍</span>
        </div>
      </button>
    {/each}
  </div>
  
  <div class="gallery-footer">
    <span class="image-count">{images.length} images</span>
    <button class="download-all-btn">Download all</button>
  </div>
</div>

{#if lightboxOpen}
  <div class="lightbox" onclick={() => lightboxOpen = false}>
    <div class="lightbox-content" onclick={(e) => e.stopPropagation()}>
      <button class="lightbox-close" onclick={() => lightboxOpen = false}>✕</button>
      
      <button class="lightbox-nav prev" onclick={() => navigate(-1)}>‹</button>
      
      <div class="lightbox-image">
        <div class="image-placeholder large">
          <span class="placeholder-icon">🖼️</span>
          <span class="placeholder-text">{images[activeIndex].alt}</span>
        </div>
      </div>
      
      <button class="lightbox-nav next" onclick={() => navigate(1)}>›</button>
      
      <div class="lightbox-info">
        <span class="image-counter">{activeIndex + 1} / {images.length}</span>
        <button class="download-btn">↓ Download</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .gallery-container {
    max-width: 400px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    overflow: hidden;
  }
  
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2px;
    padding: 2px;
  }
  
  .gallery-item {
    position: relative;
    aspect-ratio: 16/10;
    background: #111113;
    border: none;
    cursor: pointer;
    overflow: hidden;
  }
  
  .gallery-item.primary {
    grid-column: span 2;
    aspect-ratio: 16/9;
  }
  
  .image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: linear-gradient(145deg, #1a1a1d, #111113);
  }
  
  .placeholder-icon {
    font-size: 2rem;
    opacity: 0.3;
  }
  
  .gallery-item.primary .placeholder-icon {
    font-size: 3rem;
  }
  
  .placeholder-text {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.3);
  }
  
  .image-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .gallery-item:hover .image-overlay {
    opacity: 1;
  }
  
  .zoom-icon {
    font-size: 1.5rem;
    transform: scale(0.8);
    transition: transform 0.2s ease;
  }
  
  .gallery-item:hover .zoom-icon {
    transform: scale(1);
  }
  
  .gallery-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: rgba(0, 0, 0, 0.2);
  }
  
  .image-count {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .download-all-btn {
    font-size: 0.8rem;
    color: #6366f1;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.15s ease;
  }
  
  .download-all-btn:hover {
    color: #818cf8;
  }
  
  .lightbox {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .lightbox-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .lightbox-close {
    position: absolute;
    top: -40px;
    right: 0;
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    color: #fff;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .lightbox-close:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .lightbox-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    color: #fff;
    font-size: 1.8rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .lightbox-nav:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .lightbox-nav.prev {
    left: -60px;
  }
  
  .lightbox-nav.next {
    right: -60px;
  }
  
  .lightbox-image {
    width: 600px;
    height: 400px;
    border-radius: 12px;
    overflow: hidden;
    animation: zoomIn 0.3s ease;
  }
  
  @keyframes zoomIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  .image-placeholder.large .placeholder-icon {
    font-size: 5rem;
  }
  
  .lightbox-info {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 16px;
  }
  
  .image-counter {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .download-btn {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 8px;
    font-size: 0.85rem;
    color: #fff;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .download-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
```

---

### 3. Audio Player

Voice message player:

```svelte
<script>
  let isPlaying = $state(false);
  let progress = $state(0);
  let duration = '1:24';
  let currentTime = $state('0:00');
  let playbackSpeed = $state(1);
  
  function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) simulatePlayback();
  }
  
  function simulatePlayback() {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      if (!isPlaying) {
        clearInterval(interval);
        return;
      }
      
      progress += 1;
      const totalSeconds = Math.floor(progress * 84 / 100);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      currentTime = `${mins}:${secs.toString().padStart(2, '0')}`;
      
      if (progress >= 100) {
        clearInterval(interval);
        isPlaying = false;
        progress = 0;
        currentTime = '0:00';
      }
    }, 84 / playbackSpeed);
  }
  
  function setProgress(e) {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    progress = Math.max(0, Math.min(100, (x / rect.width) * 100));
  }
  
  function cycleSpeed() {
    playbackSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
  }
</script>

<div class="audio-player">
  <div class="player-avatar">
    <span class="avatar-text">JD</span>
  </div>
  
  <div class="player-content">
    <div class="player-header">
      <span class="sender-name">John Doe</span>
      <span class="voice-label">Voice message</span>
    </div>
    
    <div class="player-controls">
      <button 
        class="play-btn"
        class:playing={isPlaying}
        onclick={togglePlay}
      >
        {#if isPlaying}
          <span class="pause-icon">❚❚</span>
        {:else}
          <span class="play-icon">▶</span>
        {/if}
      </button>
      
      <div class="waveform-container">
        <div class="waveform-track" onclick={setProgress}>
          <div class="waveform-progress" style="width: {progress}%"></div>
          <div class="waveform-bars">
            {#each Array(40) as _, i}
              <div 
                class="bar"
                class:active={i < (progress / 100 * 40)}
                style="--height: {20 + Math.random() * 80}%"
              ></div>
            {/each}
          </div>
        </div>
        
        <div class="time-display">
          <span class="current">{currentTime}</span>
          <span class="separator">/</span>
          <span class="total">{duration}</span>
        </div>
      </div>
      
      <button class="speed-btn" onclick={cycleSpeed}>
        {playbackSpeed}x
      </button>
    </div>
  </div>
</div>

<style>
  .audio-player {
    display: flex;
    gap: 12px;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    max-width: 360px;
  }
  
  .player-avatar {
    flex-shrink: 0;
  }
  
  .avatar-text {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 700;
    color: #fff;
  }
  
  .player-content {
    flex: 1;
    min-width: 0;
  }
  
  .player-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 10px;
  }
  
  .sender-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
  }
  
  .voice-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .player-controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .play-btn {
    width: 36px;
    height: 36px;
    background: #6366f1;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .play-btn:hover {
    background: #5558e3;
    transform: scale(1.05);
  }
  
  .play-icon,
  .pause-icon {
    color: #fff;
    font-size: 0.7rem;
  }
  
  .play-icon {
    margin-left: 2px;
  }
  
  .waveform-container {
    flex: 1;
    min-width: 0;
  }
  
  .waveform-track {
    position: relative;
    height: 32px;
    cursor: pointer;
    margin-bottom: 4px;
  }
  
  .waveform-progress {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: linear-gradient(90deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3));
    border-radius: 4px;
    pointer-events: none;
  }
  
  .waveform-bars {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 4px;
  }
  
  .bar {
    width: 2px;
    height: var(--height);
    background: rgba(255, 255, 255, 0.2);
    border-radius: 1px;
    transition: background 0.15s ease;
  }
  
  .bar.active {
    background: #6366f1;
  }
  
  .time-display {
    display: flex;
    gap: 4px;
    font-size: 0.7rem;
  }
  
  .current {
    color: #fff;
    font-weight: 500;
  }
  
  .separator,
  .total {
    color: rgba(255, 255, 255, 0.4);
  }
  
  .speed-btn {
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.08);
    border: none;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .speed-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }
</style>
```

---

### 4. Video Preview

Embedded video card:

```svelte
<script>
  let isPlaying = $state(false);
  let isMuted = $state(true);
  let showControls = $state(false);
</script>

<div 
  class="video-card"
  onmouseenter={() => showControls = true}
  onmouseleave={() => showControls = false}
>
  <div class="video-preview">
    <div class="video-placeholder">
      <span class="video-icon">🎬</span>
    </div>
    
    {#if !isPlaying}
      <button class="play-overlay" onclick={() => isPlaying = true}>
        <span class="play-circle">
          <span class="play-triangle">▶</span>
        </span>
        <span class="video-duration">2:34</span>
      </button>
    {/if}
    
    <div class="video-controls" class:visible={showControls && isPlaying}>
      <button class="control-btn" onclick={() => isPlaying = false}>
        ❚❚
      </button>
      <div class="progress-bar">
        <div class="progress-fill" style="width: 35%"></div>
      </div>
      <span class="time-display">0:52 / 2:34</span>
      <button class="control-btn" onclick={() => isMuted = !isMuted}>
        {isMuted ? '🔇' : '🔊'}
      </button>
      <button class="control-btn fullscreen">⛶</button>
    </div>
  </div>
  
  <div class="video-info">
    <span class="video-title">Product Demo - Q4 Features</span>
    <span class="video-meta">Shared by Alice • 2 days ago</span>
  </div>
</div>

<style>
  .video-card {
    max-width: 400px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    overflow: hidden;
  }
  
  .video-preview {
    position: relative;
    aspect-ratio: 16/9;
    background: #111113;
  }
  
  .video-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(145deg, #1a1a1d, #111113);
  }
  
  .video-icon {
    font-size: 4rem;
    opacity: 0.2;
  }
  
  .play-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    border: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  
  .play-overlay:hover {
    background: rgba(0, 0, 0, 0.3);
  }
  
  .play-circle {
    width: 72px;
    height: 72px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .play-overlay:hover .play-circle {
    transform: scale(1.08);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
  
  .play-triangle {
    color: #111113;
    font-size: 1.5rem;
    margin-left: 4px;
  }
  
  .video-duration {
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    color: #fff;
  }
  
  .video-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
    opacity: 0;
    transform: translateY(8px);
    transition: all 0.2s ease;
  }
  
  .video-controls.visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  .control-btn {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 6px;
    color: #fff;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  
  .control-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .progress-bar {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    cursor: pointer;
  }
  
  .progress-fill {
    height: 100%;
    background: #fff;
    border-radius: 2px;
    transition: width 0.1s ease;
  }
  
  .time-display {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.8);
    white-space: nowrap;
  }
  
  .video-info {
    padding: 14px 16px;
  }
  
  .video-title {
    display: block;
    font-size: 0.95rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 4px;
  }
  
  .video-meta {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
  }
</style>
```

---

### 5. Code Snippet

Syntax highlighted code block:

```svelte
<script>
  let copied = $state(false);
  let language = 'javascript';
  
  const code = `async function fetchData(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}`;
  
  function copyCode() {
    navigator.clipboard.writeText(code);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }
</script>

<div class="code-block">
  <div class="code-header">
    <span class="language-badge">{language}</span>
    <span class="file-name">api.js</span>
    <button 
      class="copy-btn"
      class:copied
      onclick={copyCode}
    >
      {#if copied}
        <span class="icon">✓</span> Copied!
      {:else}
        <span class="icon">📋</span> Copy
      {/if}
    </button>
  </div>
  
  <div class="code-content">
    <div class="line-numbers">
      {#each code.split('\n') as _, i}
        <span class="line-num">{i + 1}</span>
      {/each}
    </div>
    
    <pre class="code-text"><code>{code}</code></pre>
  </div>
  
  <div class="code-footer">
    <span class="expand-btn">Show more ▾</span>
  </div>
</div>

<style>
  .code-block {
    max-width: 500px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    overflow: hidden;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
  
  .code-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .language-badge {
    padding: 4px 10px;
    background: rgba(99, 102, 241, 0.15);
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    color: #6366f1;
    text-transform: uppercase;
  }
  
  .file-name {
    flex: 1;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .copy-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: none;
    border-radius: 6px;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .copy-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  
  .copy-btn.copied {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }
  
  .code-content {
    display: flex;
    overflow-x: auto;
  }
  
  .line-numbers {
    display: flex;
    flex-direction: column;
    padding: 14px 12px;
    background: rgba(0, 0, 0, 0.2);
    text-align: right;
    user-select: none;
  }
  
  .line-num {
    font-size: 0.75rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.25);
  }
  
  .code-text {
    flex: 1;
    margin: 0;
    padding: 14px 16px;
    font-size: 0.85rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.85);
    overflow-x: auto;
  }
  
  .code-text code {
    font-family: inherit;
  }
  
  .code-footer {
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.02);
    border-top: 1px solid rgba(255, 255, 255, 0.04);
    text-align: center;
  }
  
  .expand-btn {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: color 0.15s ease;
  }
  
  .expand-btn:hover {
    color: rgba(255, 255, 255, 0.7);
  }
</style>
```

---

### 6. Link Preview

Rich URL preview card:

```svelte
<script>
  let isHovered = $state(false);
  
  const preview = {
    url: 'https://example.com/article',
    title: 'The Future of Web Development',
    description: 'An in-depth look at emerging technologies shaping the future of web development, from AI-powered tools to new frameworks.',
    image: true,
    domain: 'example.com'
  };
</script>

<div 
  class="link-preview"
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}
>
  <div class="preview-bar"></div>
  
  <div class="preview-content">
    {#if preview.image}
      <div class="preview-image">
        <div class="image-placeholder">
          <span class="placeholder-icon">🔗</span>
        </div>
      </div>
    {/if}
    
    <div class="preview-text">
      <a href="#" class="preview-domain">
        <span class="domain-icon">🌐</span>
        {preview.domain}
      </a>
      
      <h4 class="preview-title">{preview.title}</h4>
      
      <p class="preview-description">{preview.description}</p>
    </div>
  </div>
  
  <div class="preview-actions" class:visible={isHovered}>
    <button class="action-btn">
      <span>↗</span>
      Open
    </button>
    <button class="action-btn">
      <span>🔖</span>
      Save
    </button>
    <button class="action-btn remove">
      <span>✕</span>
    </button>
  </div>
</div>

<style>
  .link-preview {
    position: relative;
    display: flex;
    max-width: 480px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease;
  }
  
  .link-preview:hover {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
  }
  
  .preview-bar {
    width: 4px;
    background: linear-gradient(180deg, #6366f1, #8b5cf6);
    flex-shrink: 0;
  }
  
  .preview-content {
    flex: 1;
    display: flex;
    gap: 14px;
    padding: 14px;
  }
  
  .preview-image {
    width: 100px;
    height: 80px;
    flex-shrink: 0;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .image-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(145deg, #1a1a1d, #111113);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .placeholder-icon {
    font-size: 1.8rem;
    opacity: 0.25;
  }
  
  .preview-text {
    flex: 1;
    min-width: 0;
  }
  
  .preview-domain {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.45);
    text-decoration: none;
    margin-bottom: 6px;
    transition: color 0.15s ease;
  }
  
  .preview-domain:hover {
    color: rgba(255, 255, 255, 0.7);
  }
  
  .domain-icon {
    font-size: 0.7rem;
  }
  
  .preview-title {
    margin: 0 0 6px;
    font-size: 0.95rem;
    font-weight: 600;
    color: #6366f1;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .preview-description {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.55);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .preview-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    padding: 4px;
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    opacity: 0;
    transform: translateY(-4px);
    transition: all 0.15s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .preview-actions.visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    background: none;
    border: none;
    border-radius: 6px;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.1s ease;
  }
  
  .action-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  
  .action-btn.remove {
    padding: 6px 8px;
  }
  
  .action-btn.remove:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
</style>
```

---

### 7. File List

Multiple file attachment list:

```svelte
<script>
  let files = $state([
    { id: 1, name: 'Project Brief.pdf', size: '2.4 MB', type: 'pdf', modified: '2 days ago' },
    { id: 2, name: 'Design Assets.zip', size: '48 MB', type: 'zip', modified: '1 week ago' },
    { id: 3, name: 'Meeting Notes.docx', size: '156 KB', type: 'doc', modified: '3 hours ago' },
    { id: 4, name: 'Budget 2024.xlsx', size: '1.2 MB', type: 'xls', modified: '5 days ago' }
  ]);
  
  let sortBy = $state('name');
  let viewMode = $state('list');
  
  const fileIcons = {
    pdf: '📄',
    zip: '📦',
    doc: '📝',
    xls: '📊'
  };
  
  const fileColors = {
    pdf: '#ef4444',
    zip: '#f59e0b',
    doc: '#3b82f6',
    xls: '#22c55e'
  };
</script>

<div class="file-list-container">
  <div class="list-header">
    <h3 class="list-title">Attachments</h3>
    <div class="list-controls">
      <select bind:value={sortBy} class="sort-select">
        <option value="name">Name</option>
        <option value="size">Size</option>
        <option value="modified">Modified</option>
      </select>
      
      <div class="view-toggle">
        <button 
          class="view-btn"
          class:active={viewMode === 'list'}
          onclick={() => viewMode = 'list'}
        >
          ☰
        </button>
        <button 
          class="view-btn"
          class:active={viewMode === 'grid'}
          onclick={() => viewMode = 'grid'}
        >
          ⊞
        </button>
      </div>
    </div>
  </div>
  
  <div class="file-list" class:grid={viewMode === 'grid'}>
    {#each files as file, i}
      <div 
        class="file-row"
        style="--delay: {i * 40}ms; --accent: {fileColors[file.type]}"
      >
        <div class="file-icon">
          {fileIcons[file.type]}
        </div>
        
        <div class="file-details">
          <span class="file-name">{file.name}</span>
          <span class="file-meta">{file.size} • {file.modified}</span>
        </div>
        
        <div class="file-actions">
          <button class="file-action-btn" title="Download">↓</button>
          <button class="file-action-btn" title="Share">↗</button>
          <button class="file-action-btn more" title="More">⋯</button>
        </div>
      </div>
    {/each}
  </div>
  
  <div class="list-footer">
    <span class="total-size">4 files • 51.8 MB total</span>
    <button class="download-all-btn">Download all</button>
  </div>
</div>

<style>
  .file-list-container {
    max-width: 480px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    overflow: hidden;
  }
  
  .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .list-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
  }
  
  .list-controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .sort-select {
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
  }
  
  .view-toggle {
    display: flex;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    padding: 2px;
  }
  
  .view-btn {
    width: 28px;
    height: 28px;
    background: none;
    border: none;
    border-radius: 4px;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .view-btn.active {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  
  .file-list {
    padding: 8px;
  }
  
  .file-list.grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .file-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 10px;
    transition: background 0.15s ease;
    animation: slideIn 0.2s ease backwards;
    animation-delay: var(--delay);
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  .file-row:hover {
    background: rgba(255, 255, 255, 0.04);
  }
  
  .file-list.grid .file-row {
    flex-direction: column;
    padding: 16px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.04);
  }
  
  .file-icon {
    width: 40px;
    height: 40px;
    background: color-mix(in srgb, var(--accent) 15%, transparent);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
  }
  
  .file-list.grid .file-icon {
    width: 52px;
    height: 52px;
    font-size: 1.5rem;
  }
  
  .file-details {
    flex: 1;
    min-width: 0;
  }
  
  .file-list.grid .file-details {
    text-align: center;
  }
  
  .file-name {
    display: block;
    font-size: 0.9rem;
    font-weight: 500;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .file-meta {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .file-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  
  .file-row:hover .file-actions {
    opacity: 1;
  }
  
  .file-list.grid .file-actions {
    opacity: 1;
    margin-top: 8px;
  }
  
  .file-action-btn {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.05);
    border: none;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.1s ease;
  }
  
  .file-action-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }
  
  .list-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: rgba(0, 0, 0, 0.2);
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }
  
  .total-size {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .download-all-btn {
    padding: 8px 14px;
    background: #6366f1;
    border: none;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 500;
    color: #fff;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .download-all-btn:hover {
    background: #5558e3;
  }
</style>
```

---

## Summary

This collection provides media and file components:

1. **File Upload Zone** — Drag and drop file upload with progress
2. **Image Gallery** — Lightbox gallery with navigation
3. **Audio Player** — Voice message player with waveform
4. **Video Preview** — Embedded video card with controls
5. **Code Snippet** — Syntax highlighted code block
6. **Link Preview** — Rich URL preview card
7. **File List** — Multiple file attachment list with views

---

*Content is king. Build tools that make sharing beautiful.*
