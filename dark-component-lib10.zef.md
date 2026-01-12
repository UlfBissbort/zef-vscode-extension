# Dark Component Library X ◈

**Audio & Media** — Play. Visualize. Immerse.

---

## Introduction

Media interfaces demand attention without distraction. This collection explores audio players, video controls, and visualization components—transforming passive consumption into active engagement through elegant, purposeful design.

---

## Component Collection

Six audio and media components for immersive experiences.

---

### 1. Music Player Card

A compact music player with progress and controls:

```svelte
<script>
  let isPlaying = $state(false);
  let progress = $state(35);
  let volume = $state(75);
  let showVolume = $state(false);
  
  let track = $state({
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We're Dreaming",
    duration: "4:03",
    currentTime: "1:25"
  });
  
  function togglePlay() {
    isPlaying = !isPlaying;
  }
  
  function formatTime(percent) {
    const total = 243; // 4:03 in seconds
    const current = Math.floor(total * percent / 100);
    const min = Math.floor(current / 60);
    const sec = current % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }
  
  $effect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        if (progress < 100) {
          progress += 0.5;
          track.currentTime = formatTime(progress);
        } else {
          isPlaying = false;
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  });
</script>

<div class="player-card">
  <div class="album-art">
    <div class="art-gradient"></div>
    <div class="art-overlay" class:playing={isPlaying}>
      <div class="sound-wave">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
    </div>
  </div>
  
  <div class="player-content">
    <div class="track-info">
      <h3 class="track-title">{track.title}</h3>
      <p class="track-artist">{track.artist}</p>
    </div>
    
    <div class="progress-section">
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progress}%"></div>
        <div class="progress-knob" style="left: {progress}%"></div>
      </div>
      <div class="time-display">
        <span>{track.currentTime}</span>
        <span>{track.duration}</span>
      </div>
    </div>
    
    <div class="controls">
      <button class="control-btn">⏮</button>
      <button class="control-btn play-btn" onclick={togglePlay}>
        {isPlaying ? '❚❚' : '▶'}
      </button>
      <button class="control-btn">⏭</button>
      
      <div class="volume-control">
        <button 
          class="control-btn volume-btn"
          onclick={() => showVolume = !showVolume}
        >
          {volume > 50 ? '🔊' : volume > 0 ? '🔉' : '🔇'}
        </button>
        
        {#if showVolume}
          <div class="volume-slider">
            <input 
              type="range" 
              min="0" 
              max="100" 
              bind:value={volume}
            />
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .player-card {
    display: flex;
    gap: 20px;
    max-width: 420px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    padding: 16px;
  }
  
  .album-art {
    width: 120px;
    height: 120px;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
  }
  
  .art-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%);
  }
  
  .art-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.3);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .art-overlay.playing {
    opacity: 1;
  }
  
  .sound-wave {
    display: flex;
    gap: 3px;
    align-items: flex-end;
    height: 32px;
  }
  
  .sound-wave span {
    width: 4px;
    background: #fff;
    border-radius: 2px;
    animation: wave 0.5s ease-in-out infinite;
  }
  
  .sound-wave span:nth-child(1) { height: 60%; animation-delay: 0s; }
  .sound-wave span:nth-child(2) { height: 100%; animation-delay: 0.1s; }
  .sound-wave span:nth-child(3) { height: 40%; animation-delay: 0.2s; }
  .sound-wave span:nth-child(4) { height: 80%; animation-delay: 0.3s; }
  .sound-wave span:nth-child(5) { height: 50%; animation-delay: 0.4s; }
  
  @keyframes wave {
    0%, 100% { transform: scaleY(0.5); }
    50% { transform: scaleY(1); }
  }
  
  .player-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
  }
  
  .track-info {
    margin-bottom: 12px;
  }
  
  .track-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .track-artist {
    margin: 4px 0 0;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.5);
  }
  
  .progress-section {
    margin-bottom: 16px;
  }
  
  .progress-bar {
    position: relative;
    height: 4px;
    background: rgba(255,255,255,0.1);
    border-radius: 2px;
    cursor: pointer;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    border-radius: 2px;
    transition: width 0.1s linear;
  }
  
  .progress-knob {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    background: #fff;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    transition: opacity 0.15s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  
  .progress-bar:hover .progress-knob {
    opacity: 1;
  }
  
  .time-display {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 0.65rem;
    color: rgba(255,255,255,0.4);
    font-variant-numeric: tabular-nums;
  }
  
  .controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .control-btn {
    width: 36px;
    height: 36px;
    background: transparent;
    border: none;
    border-radius: 50%;
    color: rgba(255,255,255,0.7);
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }
  
  .control-btn:hover {
    color: #fff;
    background: rgba(255,255,255,0.1);
  }
  
  .play-btn {
    width: 44px;
    height: 44px;
    background: #6366f1;
    color: #fff;
    font-size: 1rem;
  }
  
  .play-btn:hover {
    background: #4f46e5;
    transform: scale(1.05);
  }
  
  .volume-control {
    position: relative;
    margin-left: auto;
  }
  
  .volume-btn {
    font-size: 1rem;
  }
  
  .volume-slider {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 8px;
    background: #1a1a1d;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
  }
  
  .volume-slider input {
    writing-mode: vertical-lr;
    direction: rtl;
    width: 4px;
    height: 80px;
    appearance: none;
    background: rgba(255,255,255,0.1);
    border-radius: 2px;
  }
  
  .volume-slider input::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: #6366f1;
    border-radius: 50%;
    cursor: pointer;
  }
</style>
```

---

### 2. Audio Waveform Visualizer

An animated waveform display with playback:

```svelte
<script>
  let isPlaying = $state(false);
  let playhead = $state(25);
  
  // Generate random waveform data
  const bars = Array.from({ length: 60 }, () => 
    Math.random() * 0.8 + 0.2
  );
  
  function togglePlay() {
    isPlaying = !isPlaying;
  }
  
  $effect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        if (playhead < 100) {
          playhead += 0.3;
        } else {
          isPlaying = false;
        }
      }, 50);
      return () => clearInterval(interval);
    }
  });
  
  function seek(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    playhead = ((e.clientX - rect.left) / rect.width) * 100;
  }
</script>

<div class="waveform-player">
  <div class="player-header">
    <button class="play-toggle" onclick={togglePlay}>
      {isPlaying ? '❚❚' : '▶'}
    </button>
    <div class="track-details">
      <span class="track-name">Audio Sample.mp3</span>
      <span class="track-meta">2:34 • 320kbps</span>
    </div>
  </div>
  
  <div class="waveform-container" onclick={seek}>
    <div class="waveform">
      {#each bars as height, i}
        {@const isPlayed = (i / bars.length) * 100 < playhead}
        <div 
          class="bar"
          class:played={isPlayed}
          class:active={isPlaying && isPlayed}
          style="height: {height * 100}%"
        ></div>
      {/each}
    </div>
    <div class="playhead-line" style="left: {playhead}%"></div>
  </div>
  
  <div class="waveform-footer">
    <span class="current-time">{Math.floor(playhead * 1.54 / 60)}:{String(Math.floor(playhead * 1.54 % 60)).padStart(2, '0')}</span>
    <span class="total-time">2:34</span>
  </div>
</div>

<style>
  .waveform-player {
    max-width: 500px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 20px;
  }
  
  .player-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }
  
  .play-toggle {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none;
    border-radius: 50%;
    color: #fff;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease;
    flex-shrink: 0;
  }
  
  .play-toggle:hover {
    transform: scale(1.08);
  }
  
  .track-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .track-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #fff;
  }
  
  .track-meta {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.4);
  }
  
  .waveform-container {
    position: relative;
    height: 80px;
    cursor: pointer;
    margin-bottom: 12px;
  }
  
  .waveform {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 100%;
  }
  
  .bar {
    flex: 1;
    background: rgba(255,255,255,0.15);
    border-radius: 1px;
    transition: background 0.15s ease;
  }
  
  .bar.played {
    background: #6366f1;
  }
  
  .bar.active {
    animation: pulse 0.5s ease infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  .playhead-line {
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: 2px;
    background: #fff;
    border-radius: 1px;
    pointer-events: none;
    box-shadow: 0 0 8px rgba(255,255,255,0.5);
  }
  
  .waveform-footer {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.4);
    font-variant-numeric: tabular-nums;
  }
</style>
```

---

### 3. Video Player Controls

A sleek video control bar overlay:

```svelte
<script>
  let isPlaying = $state(false);
  let progress = $state(42);
  let volume = $state(80);
  let isMuted = $state(false);
  let isFullscreen = $state(false);
  let showControls = $state(true);
  let quality = $state('1080p');
  let showSettings = $state(false);
  
  const qualities = ['2160p', '1080p', '720p', '480p', '360p'];
  
  function togglePlay() {
    isPlaying = !isPlaying;
  }
  
  function toggleMute() {
    isMuted = !isMuted;
  }
  
  function skip(seconds) {
    progress = Math.max(0, Math.min(100, progress + seconds / 1.2));
  }
</script>

<div class="video-container" class:fullscreen={isFullscreen}>
  <div class="video-placeholder">
    <div class="video-gradient"></div>
    {#if !isPlaying}
      <button class="big-play" onclick={togglePlay}>▶</button>
    {/if}
  </div>
  
  {#if showControls}
    <div class="controls-overlay">
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-buffered" style="width: 65%"></div>
          <div class="progress-played" style="width: {progress}%"></div>
          <div class="progress-handle" style="left: {progress}%"></div>
        </div>
      </div>
      
      <div class="controls-bar">
        <div class="controls-left">
          <button class="ctrl-btn" onclick={togglePlay}>
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <button class="ctrl-btn" onclick={() => skip(-10)}>↺</button>
          <button class="ctrl-btn" onclick={() => skip(10)}>↻</button>
          
          <div class="volume-group">
            <button class="ctrl-btn" onclick={toggleMute}>
              {isMuted || volume === 0 ? '🔇' : volume > 50 ? '🔊' : '🔉'}
            </button>
            <input 
              type="range" 
              class="volume-slider"
              min="0" 
              max="100" 
              bind:value={volume}
            />
          </div>
          
          <span class="time-display">
            1:42 <span class="time-sep">/</span> 4:03
          </span>
        </div>
        
        <div class="controls-right">
          <div class="settings-dropdown">
            <button 
              class="ctrl-btn"
              onclick={() => showSettings = !showSettings}
            >
              ⚙
            </button>
            
            {#if showSettings}
              <div class="dropdown-menu">
                <div class="dropdown-label">Quality</div>
                {#each qualities as q}
                  <button 
                    class="dropdown-item"
                    class:active={quality === q}
                    onclick={() => { quality = q; showSettings = false; }}
                  >
                    {q}
                    {#if quality === q}<span class="check">✓</span>{/if}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
          
          <button class="ctrl-btn">⊡</button>
          <button 
            class="ctrl-btn"
            onclick={() => isFullscreen = !isFullscreen}
          >
            {isFullscreen ? '⊙' : '⛶'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .video-container {
    position: relative;
    max-width: 640px;
    background: #000;
    border-radius: 12px;
    overflow: hidden;
  }
  
  .video-container.fullscreen {
    max-width: none;
    border-radius: 0;
  }
  
  .video-placeholder {
    aspect-ratio: 16/9;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .video-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  }
  
  .big-play {
    position: relative;
    z-index: 2;
    width: 80px;
    height: 80px;
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(8px);
    border: 2px solid rgba(255,255,255,0.2);
    border-radius: 50%;
    color: #fff;
    font-size: 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 6px;
    transition: all 0.2s ease;
  }
  
  .big-play:hover {
    background: rgba(255,255,255,0.2);
    transform: scale(1.1);
  }
  
  .controls-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.8));
    padding: 32px 16px 12px;
  }
  
  .progress-container {
    margin-bottom: 12px;
  }
  
  .progress-bar {
    position: relative;
    height: 4px;
    background: rgba(255,255,255,0.2);
    border-radius: 2px;
    cursor: pointer;
  }
  
  .progress-bar:hover {
    height: 6px;
  }
  
  .progress-buffered {
    position: absolute;
    height: 100%;
    background: rgba(255,255,255,0.3);
    border-radius: 2px;
  }
  
  .progress-played {
    position: absolute;
    height: 100%;
    background: #ef4444;
    border-radius: 2px;
  }
  
  .progress-handle {
    position: absolute;
    top: 50%;
    width: 14px;
    height: 14px;
    background: #ef4444;
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    transition: transform 0.15s ease;
  }
  
  .progress-bar:hover .progress-handle {
    transform: translate(-50%, -50%) scale(1);
  }
  
  .controls-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .controls-left,
  .controls-right {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .ctrl-btn {
    width: 36px;
    height: 36px;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background 0.15s ease;
  }
  
  .ctrl-btn:hover {
    background: rgba(255,255,255,0.1);
  }
  
  .volume-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .volume-slider {
    width: 60px;
    height: 4px;
    appearance: none;
    background: rgba(255,255,255,0.2);
    border-radius: 2px;
  }
  
  .volume-slider::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: #fff;
    border-radius: 50%;
    cursor: pointer;
  }
  
  .time-display {
    font-size: 0.75rem;
    color: #fff;
    font-variant-numeric: tabular-nums;
    margin-left: 8px;
  }
  
  .time-sep {
    opacity: 0.5;
    margin: 0 2px;
  }
  
  .settings-dropdown {
    position: relative;
  }
  
  .dropdown-menu {
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    min-width: 120px;
    background: rgba(20,20,25,0.95);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 8px 0;
    backdrop-filter: blur(8px);
  }
  
  .dropdown-label {
    padding: 6px 12px;
    font-size: 0.65rem;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .dropdown-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.8);
    font-size: 0.8rem;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease;
  }
  
  .dropdown-item:hover {
    background: rgba(255,255,255,0.1);
  }
  
  .dropdown-item.active {
    color: #fff;
  }
  
  .check {
    color: #22c55e;
  }
</style>
```

---

### 4. Podcast Episode Card

A podcast card with play controls and episode info:

```svelte
<script>
  let episodes = $state([
    {
      id: 1,
      title: "The Future of Web Development",
      podcast: "Code Talk",
      duration: "48:23",
      date: "Jan 15, 2025",
      description: "We discuss the latest trends in web development, from edge computing to AI-assisted coding.",
      isPlaying: false,
      progress: 0
    },
    {
      id: 2,
      title: "Building Design Systems at Scale",
      podcast: "Design Weekly",
      duration: "35:10",
      date: "Jan 12, 2025",
      description: "How leading companies create and maintain design systems across large organizations.",
      isPlaying: false,
      progress: 65
    },
    {
      id: 3,
      title: "Startup Stories: From Zero to IPO",
      podcast: "Founders Journey",
      duration: "1:02:45",
      date: "Jan 10, 2025",
      description: "An in-depth conversation with founders who took their companies public.",
      isPlaying: true,
      progress: 32
    }
  ]);
  
  function togglePlay(id) {
    episodes = episodes.map(ep => ({
      ...ep,
      isPlaying: ep.id === id ? !ep.isPlaying : false
    }));
  }
</script>

<div class="podcast-list">
  {#each episodes as episode}
    <div class="episode-card" class:playing={episode.isPlaying}>
      <div class="episode-artwork">
        <div class="artwork-gradient" style="background: linear-gradient(135deg, 
          {episode.id === 1 ? '#6366f1, #8b5cf6' : 
           episode.id === 2 ? '#ec4899, #f59e0b' : 
           '#22c55e, #14b8a6'})">
        </div>
        <button class="play-overlay" onclick={() => togglePlay(episode.id)}>
          {episode.isPlaying ? '❚❚' : '▶'}
        </button>
      </div>
      
      <div class="episode-content">
        <span class="podcast-name">{episode.podcast}</span>
        <h4 class="episode-title">{episode.title}</h4>
        <p class="episode-desc">{episode.description}</p>
        
        {#if episode.progress > 0}
          <div class="resume-progress">
            <div class="progress-track">
              <div class="progress-fill" style="width: {episode.progress}%"></div>
            </div>
            <span class="progress-text">{episode.progress}% complete</span>
          </div>
        {/if}
        
        <div class="episode-meta">
          <span class="meta-item">{episode.date}</span>
          <span class="meta-divider">•</span>
          <span class="meta-item">{episode.duration}</span>
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  .podcast-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 480px;
  }
  
  .episode-card {
    display: flex;
    gap: 16px;
    padding: 16px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    transition: all 0.2s ease;
  }
  
  .episode-card:hover {
    border-color: rgba(255,255,255,0.12);
  }
  
  .episode-card.playing {
    background: rgba(99, 102, 241, 0.05);
    border-color: rgba(99, 102, 241, 0.2);
  }
  
  .episode-artwork {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
  }
  
  .artwork-gradient {
    position: absolute;
    inset: 0;
  }
  
  .play-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.3);
    border: none;
    color: #fff;
    font-size: 1.2rem;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .episode-card:hover .play-overlay,
  .episode-card.playing .play-overlay {
    opacity: 1;
  }
  
  .episode-content {
    flex: 1;
    min-width: 0;
  }
  
  .podcast-name {
    display: block;
    font-size: 0.7rem;
    color: #818cf8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
  }
  
  .episode-title {
    margin: 0 0 6px;
    font-size: 0.95rem;
    font-weight: 600;
    color: #fff;
    line-height: 1.3;
  }
  
  .episode-desc {
    margin: 0 0 10px;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.5);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .resume-progress {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  
  .progress-track {
    flex: 1;
    height: 3px;
    background: rgba(255,255,255,0.1);
    border-radius: 2px;
  }
  
  .progress-fill {
    height: 100%;
    background: #6366f1;
    border-radius: 2px;
  }
  
  .progress-text {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.4);
    flex-shrink: 0;
  }
  
  .episode-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .meta-item {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.35);
  }
  
  .meta-divider {
    font-size: 0.5rem;
    color: rgba(255,255,255,0.2);
  }
</style>
```

---

### 5. Audio Equalizer

An interactive audio equalizer with presets:

```svelte
<script>
  let bands = $state([
    { freq: '60', value: 40 },
    { freq: '150', value: 55 },
    { freq: '400', value: 70 },
    { freq: '1K', value: 65 },
    { freq: '2.5K', value: 50 },
    { freq: '6K', value: 75 },
    { freq: '12K', value: 60 },
    { freq: '16K', value: 45 }
  ]);
  
  const presets = [
    { name: 'Flat', values: [50, 50, 50, 50, 50, 50, 50, 50] },
    { name: 'Bass Boost', values: [80, 75, 60, 50, 50, 50, 50, 50] },
    { name: 'Treble', values: [45, 50, 50, 55, 60, 70, 80, 85] },
    { name: 'Vocal', values: [40, 50, 70, 75, 70, 55, 45, 40] },
    { name: 'Rock', values: [70, 65, 55, 45, 55, 70, 75, 70] }
  ];
  
  let activePreset = $state('Flat');
  
  function applyPreset(preset) {
    activePreset = preset.name;
    bands = bands.map((band, i) => ({
      ...band,
      value: preset.values[i]
    }));
  }
  
  function updateBand(index, value) {
    bands[index].value = value;
    activePreset = 'Custom';
    bands = [...bands];
  }
</script>

<div class="equalizer">
  <div class="eq-header">
    <h3 class="eq-title">Equalizer</h3>
    <div class="eq-toggle">
      <span class="toggle-label">ON</span>
      <div class="toggle-switch active"></div>
    </div>
  </div>
  
  <div class="presets">
    {#each presets as preset}
      <button 
        class="preset-btn"
        class:active={activePreset === preset.name}
        onclick={() => applyPreset(preset)}
      >
        {preset.name}
      </button>
    {/each}
  </div>
  
  <div class="bands-container">
    <div class="db-scale">
      <span>+12</span>
      <span>0</span>
      <span>-12</span>
    </div>
    
    <div class="bands">
      {#each bands as band, i}
        <div class="band">
          <div class="slider-track">
            <div class="slider-fill" style="height: {band.value}%"></div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={band.value}
              oninput={(e) => updateBand(i, parseInt(e.target.value))}
            />
            <div class="slider-thumb" style="bottom: {band.value}%"></div>
          </div>
          <span class="band-freq">{band.freq}</span>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .equalizer {
    max-width: 400px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    padding: 24px;
  }
  
  .eq-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .eq-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .eq-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .toggle-label {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.5);
  }
  
  .toggle-switch {
    width: 36px;
    height: 20px;
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
    position: relative;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  
  .toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s ease;
  }
  
  .toggle-switch.active {
    background: #6366f1;
  }
  
  .toggle-switch.active::after {
    transform: translateX(16px);
  }
  
  .presets {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  
  .preset-btn {
    padding: 6px 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    color: rgba(255,255,255,0.6);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .preset-btn:hover {
    background: rgba(255,255,255,0.08);
    color: #fff;
  }
  
  .preset-btn.active {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.3);
    color: #818cf8;
  }
  
  .bands-container {
    display: flex;
    gap: 12px;
  }
  
  .db-scale {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    font-size: 0.6rem;
    color: rgba(255,255,255,0.3);
    padding: 8px 0 24px;
  }
  
  .bands {
    flex: 1;
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  
  .band {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  
  .slider-track {
    position: relative;
    width: 24px;
    height: 120px;
    background: rgba(255,255,255,0.06);
    border-radius: 12px;
    overflow: hidden;
  }
  
  .slider-fill {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, #6366f1, #8b5cf6);
    border-radius: 12px;
    transition: height 0.1s ease;
  }
  
  .slider-track input {
    position: absolute;
    width: 120px;
    height: 24px;
    transform: rotate(-90deg) translateX(-100%);
    transform-origin: top left;
    opacity: 0;
    cursor: pointer;
  }
  
  .slider-thumb {
    position: absolute;
    left: 50%;
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 50%;
    transform: translate(-50%, 50%);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    pointer-events: none;
    transition: bottom 0.1s ease;
  }
  
  .band-freq {
    font-size: 0.6rem;
    color: rgba(255,255,255,0.4);
  }
</style>
```

---

### 6. Media Gallery Grid

A responsive media gallery with lightbox preview:

```svelte
<script>
  let items = $state([
    { id: 1, type: 'image', aspect: 'square', color: '#6366f1' },
    { id: 2, type: 'video', aspect: 'landscape', color: '#ec4899', duration: '2:34' },
    { id: 3, type: 'image', aspect: 'portrait', color: '#22c55e' },
    { id: 4, type: 'image', aspect: 'square', color: '#f59e0b' },
    { id: 5, type: 'video', aspect: 'square', color: '#14b8a6', duration: '1:15' },
    { id: 6, type: 'image', aspect: 'landscape', color: '#8b5cf6' }
  ]);
  
  let selectedItem = $state(null);
  
  function openLightbox(item) {
    selectedItem = item;
  }
  
  function closeLightbox() {
    selectedItem = null;
  }
</script>

<div class="gallery-container">
  <div class="gallery-grid">
    {#each items as item}
      <button 
        class="gallery-item"
        class:landscape={item.aspect === 'landscape'}
        class:portrait={item.aspect === 'portrait'}
        onclick={() => openLightbox(item)}
      >
        <div class="item-bg" style="background: linear-gradient(135deg, {item.color}, {item.color}88)"></div>
        {#if item.type === 'video'}
          <div class="video-badge">
            <span class="play-icon">▶</span>
            <span class="duration">{item.duration}</span>
          </div>
        {/if}
        <div class="item-overlay">
          <span class="zoom-icon">⊕</span>
        </div>
      </button>
    {/each}
  </div>
</div>

{#if selectedItem}
  <div class="lightbox" onclick={closeLightbox}>
    <button class="lightbox-close">×</button>
    <div class="lightbox-content" onclick={(e) => e.stopPropagation()}>
      <div class="lightbox-media" style="background: linear-gradient(135deg, {selectedItem.color}, {selectedItem.color}88)">
        {#if selectedItem.type === 'video'}
          <button class="lightbox-play">▶</button>
        {/if}
      </div>
      <div class="lightbox-info">
        <span class="media-type">{selectedItem.type === 'video' ? '🎬 Video' : '📷 Image'}</span>
        {#if selectedItem.duration}
          <span class="media-duration">{selectedItem.duration}</span>
        {/if}
      </div>
    </div>
    <div class="lightbox-nav">
      <button class="nav-btn">←</button>
      <button class="nav-btn">→</button>
    </div>
  </div>
{/if}

<style>
  .gallery-container {
    max-width: 480px;
  }
  
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .gallery-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 12px;
    overflow: hidden;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  
  .gallery-item:hover {
    transform: scale(1.02);
  }
  
  .gallery-item.landscape {
    grid-column: span 2;
    aspect-ratio: 2/1;
  }
  
  .gallery-item.portrait {
    grid-row: span 2;
    aspect-ratio: 1/2;
  }
  
  .item-bg {
    position: absolute;
    inset: 0;
  }
  
  .video-badge {
    position: absolute;
    bottom: 8px;
    left: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    border-radius: 12px;
    font-size: 0.7rem;
    color: #fff;
  }
  
  .play-icon {
    font-size: 0.6rem;
  }
  
  .item-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.4);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .gallery-item:hover .item-overlay {
    opacity: 1;
  }
  
  .zoom-icon {
    font-size: 1.5rem;
    color: #fff;
  }
  
  .lightbox {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.95);
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
  
  .lightbox-close {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    background: rgba(255,255,255,0.1);
    border: none;
    border-radius: 50%;
    color: #fff;
    font-size: 1.5rem;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  
  .lightbox-close:hover {
    background: rgba(255,255,255,0.2);
  }
  
  .lightbox-content {
    max-width: 80vw;
    max-height: 80vh;
  }
  
  .lightbox-media {
    width: 500px;
    height: 350px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .lightbox-play {
    width: 80px;
    height: 80px;
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(8px);
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    color: #fff;
    font-size: 1.5rem;
    cursor: pointer;
    padding-left: 6px;
    transition: all 0.2s ease;
  }
  
  .lightbox-play:hover {
    background: rgba(255,255,255,0.3);
    transform: scale(1.1);
  }
  
  .lightbox-info {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 16px;
  }
  
  .media-type,
  .media-duration {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.6);
  }
  
  .lightbox-nav {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 12px;
  }
  
  .nav-btn {
    width: 48px;
    height: 48px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 50%;
    color: #fff;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .nav-btn:hover {
    background: rgba(255,255,255,0.2);
  }
</style>
```

---

## Summary

This collection immerses users in rich media experiences:

1. **Music Player** — Compact controls with waveform animation
2. **Waveform Visualizer** — Scrrubbable audio waveform display
3. **Video Controls** — Complete player overlay with quality settings
4. **Podcast Cards** — Episode list with resume progress
5. **Equalizer** — Interactive frequency band adjustment
6. **Media Gallery** — Grid layout with lightbox preview

---

*Audio and video shape emotion. Design for the senses.*
