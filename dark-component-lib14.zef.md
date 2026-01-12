# Dark Component Library XIV ◈

**Experimental & Creative** — Push. Explore. Innovate.

---

## Introduction

This final collection ventures into the experimental—pushing boundaries with glassmorphism, 3D transforms, particle effects, and creative interactions. These components inspire what's possible when design meets imagination. Some are practical, others purely delightful. All are memorable.

---

## Component Collection

Six experimental components that challenge convention.

---

### 1. Glassmorphism Card

A frosted glass card with depth and blur:

```svelte
<script>
  let mouseX = $state(50);
  let mouseY = $state(50);
  
  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    mouseY = ((e.clientY - rect.top) / rect.height) * 100;
  }
</script>

<div class="glass-container" onmousemove={handleMouseMove}>
  <div class="background-orbs">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
  </div>
  
  <div 
    class="glass-card"
    style="--mouse-x: {mouseX}%; --mouse-y: {mouseY}%"
  >
    <div class="card-glow"></div>
    <div class="card-content">
      <div class="card-icon">◇</div>
      <h3 class="card-title">Premium Access</h3>
      <p class="card-description">
        Unlock exclusive features with our premium tier. 
        Experience the future of design.
      </p>
      <button class="glass-button">Get Started</button>
    </div>
  </div>
</div>

<style>
  .glass-container {
    position: relative;
    max-width: 380px;
    height: 320px;
    background: #09090b;
    border-radius: 24px;
    overflow: hidden;
  }
  
  .background-orbs {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
  
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
  }
  
  .orb-1 {
    width: 200px;
    height: 200px;
    background: #6366f1;
    top: -50px;
    left: -50px;
    opacity: 0.6;
    animation: float 8s ease-in-out infinite;
  }
  
  .orb-2 {
    width: 180px;
    height: 180px;
    background: #ec4899;
    bottom: -40px;
    right: -40px;
    opacity: 0.5;
    animation: float 10s ease-in-out infinite reverse;
  }
  
  .orb-3 {
    width: 120px;
    height: 120px;
    background: #8b5cf6;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.4;
    animation: pulse 6s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(30px, 20px); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.3); }
  }
  
  .glass-card {
    position: absolute;
    inset: 32px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    overflow: hidden;
  }
  
  .card-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at var(--mouse-x) var(--mouse-y),
      rgba(255, 255, 255, 0.15) 0%,
      transparent 50%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .glass-card:hover .card-glow {
    opacity: 1;
  }
  
  .card-content {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    text-align: center;
  }
  
  .card-icon {
    font-size: 2.5rem;
    color: #fff;
    margin-bottom: 16px;
    text-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
  }
  
  .card-title {
    margin: 0 0 12px;
    font-size: 1.4rem;
    font-weight: 700;
    color: #fff;
  }
  
  .card-description {
    margin: 0 0 24px;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.5;
  }
  
  .glass-button {
    padding: 12px 32px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .glass-button:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
  }
</style>
```

---

### 2. 3D Flip Card

A card that flips on hover revealing hidden content:

```svelte
<script>
  let isFlipped = $state(false);
</script>

<div 
  class="flip-card"
  class:flipped={isFlipped}
  onclick={() => isFlipped = !isFlipped}
>
  <div class="flip-card-inner">
    <div class="flip-card-front">
      <div class="card-shine"></div>
      <div class="front-content">
        <div class="profile-ring">
          <div class="profile-avatar">✧</div>
        </div>
        <h3 class="profile-name">Alex Rivera</h3>
        <span class="profile-title">Creative Director</span>
        <p class="profile-bio">Crafting digital experiences that inspire and delight.</p>
        <span class="flip-hint">Click to flip</span>
      </div>
    </div>
    
    <div class="flip-card-back">
      <div class="back-content">
        <h4 class="back-title">Connect</h4>
        <div class="social-links">
          <a href="#" class="social-link">
            <span class="social-icon">◎</span>
            <span>Portfolio</span>
          </a>
          <a href="#" class="social-link">
            <span class="social-icon">✦</span>
            <span>Twitter</span>
          </a>
          <a href="#" class="social-link">
            <span class="social-icon">◈</span>
            <span>LinkedIn</span>
          </a>
          <a href="#" class="social-link">
            <span class="social-icon">◇</span>
            <span>GitHub</span>
          </a>
        </div>
        <span class="flip-hint">Click to return</span>
      </div>
    </div>
  </div>
</div>

<style>
  .flip-card {
    width: 300px;
    height: 380px;
    perspective: 1000px;
    cursor: pointer;
  }
  
  .flip-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    transform-style: preserve-3d;
  }
  
  .flip-card.flipped .flip-card-inner {
    transform: rotateY(180deg);
  }
  
  .flip-card-front,
  .flip-card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 20px;
    overflow: hidden;
  }
  
  .flip-card-front {
    background: linear-gradient(145deg, #111113 0%, #0c0c0e 100%);
    border: 1px solid rgba(255,255,255,0.08);
  }
  
  .card-shine {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.05) 50%,
      transparent 70%
    );
    animation: shine 4s infinite;
  }
  
  @keyframes shine {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  }
  
  .front-content {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
  }
  
  .profile-ring {
    width: 100px;
    height: 100px;
    padding: 4px;
    background: linear-gradient(135deg, #6366f1, #ec4899);
    border-radius: 50%;
    margin-bottom: 20px;
  }
  
  .profile-avatar {
    width: 100%;
    height: 100%;
    background: #0c0c0e;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    color: #fff;
  }
  
  .profile-name {
    margin: 0 0 4px;
    font-size: 1.3rem;
    font-weight: 700;
    color: #fff;
  }
  
  .profile-title {
    display: block;
    font-size: 0.85rem;
    color: #818cf8;
    margin-bottom: 16px;
  }
  
  .profile-bio {
    margin: 0;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.6);
    text-align: center;
    line-height: 1.5;
  }
  
  .flip-hint {
    position: absolute;
    bottom: 20px;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.3);
  }
  
  .flip-card-back {
    background: linear-gradient(145deg, #6366f1 0%, #4f46e5 100%);
    transform: rotateY(180deg);
  }
  
  .back-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
  }
  
  .back-title {
    margin: 0 0 24px;
    font-size: 1.2rem;
    font-weight: 600;
    color: #fff;
  }
  
  .social-links {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
  
  .social-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    background: rgba(255,255,255,0.15);
    border-radius: 12px;
    color: #fff;
    text-decoration: none;
    font-size: 0.9rem;
    transition: background 0.15s ease;
  }
  
  .social-link:hover {
    background: rgba(255,255,255,0.25);
  }
  
  .social-icon {
    font-size: 1rem;
  }
</style>
```

---

### 3. Particle Background

An animated particle field with mouse interaction:

```svelte
<script>
  import { onMount } from 'svelte';
  
  let canvas;
  let particles = $state([]);
  let mousePos = $state({ x: 0, y: 0 });
  
  onMount(() => {
    // Generate particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
    particles = [...particles];
    
    // Animation loop
    const animate = () => {
      particles = particles.map(p => {
        let newX = p.x + p.speedX;
        let newY = p.y + p.speedY;
        
        if (newX < 0 || newX > 100) p.speedX *= -1;
        if (newY < 0 || newY > 100) p.speedY *= -1;
        
        return {
          ...p,
          x: Math.max(0, Math.min(100, newX)),
          y: Math.max(0, Math.min(100, newY))
        };
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  });
  
  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    mousePos = {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    };
  }
</script>

<div class="particle-container" onmousemove={handleMouseMove}>
  <div class="particle-field">
    {#each particles as particle, i}
      {@const dx = particle.x - mousePos.x}
      {@const dy = particle.y - mousePos.y}
      {@const distance = Math.sqrt(dx * dx + dy * dy)}
      {@const glow = distance < 20 ? 1 - distance / 20 : 0}
      
      <div 
        class="particle"
        style="
          left: {particle.x}%;
          top: {particle.y}%;
          width: {particle.size + glow * 4}px;
          height: {particle.size + glow * 4}px;
          opacity: {particle.opacity + glow * 0.5};
          box-shadow: 0 0 {glow * 15}px {glow * 5}px rgba(99, 102, 241, {glow});
        "
      ></div>
      
      {#each particles.slice(i + 1) as other}
        {@const dist = Math.sqrt(Math.pow(particle.x - other.x, 2) + Math.pow(particle.y - other.y, 2))}
        {#if dist < 15}
          <svg class="connection" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line 
              x1="{particle.x}%" 
              y1="{particle.y}%" 
              x2="{other.x}%" 
              y2="{other.y}%"
              stroke="rgba(99, 102, 241, {0.3 * (1 - dist / 15)})"
              stroke-width="0.3"
            />
          </svg>
        {/if}
      {/each}
    {/each}
  </div>
  
  <div class="content-overlay">
    <h2 class="overlay-title">Interactive Universe</h2>
    <p class="overlay-text">Move your cursor to explore</p>
  </div>
</div>

<style>
  .particle-container {
    position: relative;
    max-width: 480px;
    height: 300px;
    background: #09090b;
    border-radius: 20px;
    overflow: hidden;
  }
  
  .particle-field {
    position: absolute;
    inset: 0;
  }
  
  .particle {
    position: absolute;
    background: #6366f1;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.1s ease, height 0.1s ease, opacity 0.1s ease;
  }
  
  .connection {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  
  .content-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    pointer-events: none;
  }
  
  .overlay-title {
    margin: 0 0 8px;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 2px 20px rgba(0,0,0,0.5);
  }
  
  .overlay-text {
    margin: 0;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.6);
  }
</style>
```

---

### 4. Morphing Button

A button that morphs through states with fluid animation:

```svelte
<script>
  let state = $state('idle'); // idle, loading, success, error
  
  function handleClick() {
    if (state !== 'idle') return;
    
    state = 'loading';
    
    setTimeout(() => {
      state = Math.random() > 0.3 ? 'success' : 'error';
      
      setTimeout(() => {
        state = 'idle';
      }, 2000);
    }, 2000);
  }
</script>

<div class="morph-demo">
  <button 
    class="morph-button"
    class:loading={state === 'loading'}
    class:success={state === 'success'}
    class:error={state === 'error'}
    onclick={handleClick}
    disabled={state !== 'idle'}
  >
    <span class="button-content">
      {#if state === 'idle'}
        <span class="button-text">Submit</span>
      {:else if state === 'loading'}
        <span class="spinner"></span>
      {:else if state === 'success'}
        <span class="icon-success">✓</span>
      {:else}
        <span class="icon-error">✕</span>
      {/if}
    </span>
  </button>
  
  <p class="state-label">
    {state === 'idle' ? 'Click to submit' : 
     state === 'loading' ? 'Processing...' :
     state === 'success' ? 'Success!' : 'Error - Try again'}
  </p>
</div>

<style>
  .morph-demo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 48px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    max-width: 300px;
  }
  
  .morph-button {
    position: relative;
    width: 160px;
    height: 56px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    border-radius: 28px;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .morph-button:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 8px 32px rgba(99, 102, 241, 0.4);
  }
  
  .morph-button.loading {
    width: 56px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
  }
  
  .morph-button.success {
    width: 56px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
  }
  
  .morph-button.error {
    width: 56px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
  }
  
  .button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  
  .button-text {
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
  }
  
  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .icon-success,
  .icon-error {
    font-size: 1.5rem;
    color: #fff;
    animation: pop 0.3s ease;
  }
  
  @keyframes pop {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  
  .state-label {
    margin: 0;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.5);
    min-height: 20px;
    transition: color 0.3s ease;
  }
</style>
```

---

### 5. Gradient Border Animation

A card with animated gradient border:

```svelte
<script>
  let hovered = $state(false);
</script>

<div 
  class="gradient-card"
  class:hovered
  onmouseenter={() => hovered = true}
  onmouseleave={() => hovered = false}
>
  <div class="gradient-border">
    <div class="gradient-inner"></div>
  </div>
  
  <div class="card-body">
    <div class="card-header">
      <span class="card-icon">◈</span>
      <div class="card-badge">Pro Feature</div>
    </div>
    
    <h3 class="card-title">Advanced Analytics</h3>
    <p class="card-description">
      Unlock deep insights with our advanced analytics suite. 
      Real-time data visualization and predictive modeling.
    </p>
    
    <ul class="feature-list">
      <li>Real-time dashboards</li>
      <li>Custom reports</li>
      <li>AI-powered insights</li>
    </ul>
    
    <button class="upgrade-btn">Upgrade Now</button>
  </div>
</div>

<style>
  .gradient-card {
    position: relative;
    max-width: 340px;
    border-radius: 20px;
    background: #0c0c0e;
    padding: 2px;
  }
  
  .gradient-border {
    position: absolute;
    inset: 0;
    border-radius: 20px;
    overflow: hidden;
  }
  
  .gradient-inner {
    position: absolute;
    inset: -100%;
    background: conic-gradient(
      from 0deg,
      #6366f1,
      #8b5cf6,
      #ec4899,
      #f59e0b,
      #22c55e,
      #14b8a6,
      #6366f1
    );
    animation: rotate 3s linear infinite;
    opacity: 0.5;
    transition: opacity 0.3s ease;
  }
  
  .gradient-card.hovered .gradient-inner {
    opacity: 1;
    animation-duration: 2s;
  }
  
  @keyframes rotate {
    to { transform: rotate(360deg); }
  }
  
  .card-body {
    position: relative;
    background: #0c0c0e;
    border-radius: 18px;
    padding: 28px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .card-icon {
    font-size: 2rem;
    background: linear-gradient(135deg, #6366f1, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .card-badge {
    padding: 4px 12px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    color: #818cf8;
  }
  
  .card-title {
    margin: 0 0 12px;
    font-size: 1.3rem;
    font-weight: 700;
    color: #fff;
  }
  
  .card-description {
    margin: 0 0 20px;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.6);
    line-height: 1.5;
  }
  
  .feature-list {
    list-style: none;
    margin: 0 0 24px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .feature-list li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.8);
  }
  
  .feature-list li::before {
    content: '✓';
    color: #22c55e;
    font-size: 0.9rem;
  }
  
  .upgrade-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none;
    border-radius: 12px;
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .upgrade-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
  }
</style>
```

---

### 6. Magnetic Button

A button that follows the cursor with magnetic attraction:

```svelte
<script>
  let buttonRef;
  let textRef;
  let isHovered = $state(false);
  let transform = $state({ x: 0, y: 0 });
  let textTransform = $state({ x: 0, y: 0 });
  
  function handleMouseMove(e) {
    if (!buttonRef) return;
    
    const rect = buttonRef.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    
    transform = {
      x: deltaX * 0.3,
      y: deltaY * 0.3
    };
    
    textTransform = {
      x: deltaX * 0.15,
      y: deltaY * 0.15
    };
  }
  
  function handleMouseLeave() {
    isHovered = false;
    transform = { x: 0, y: 0 };
    textTransform = { x: 0, y: 0 };
  }
  
  function handleMouseEnter() {
    isHovered = true;
  }
</script>

<div class="magnetic-demo">
  <div 
    class="magnetic-wrapper"
    onmousemove={handleMouseMove}
    onmouseleave={handleMouseLeave}
    onmouseenter={handleMouseEnter}
  >
    <button 
      class="magnetic-button"
      class:hovered={isHovered}
      bind:this={buttonRef}
      style="transform: translate({transform.x}px, {transform.y}px)"
    >
      <span 
        class="button-text"
        bind:this={textRef}
        style="transform: translate({textTransform.x}px, {textTransform.y}px)"
      >
        Explore
      </span>
      <span class="button-bg"></span>
    </button>
  </div>
  
  <p class="demo-hint">Hover and move cursor near the button</p>
</div>

<style>
  .magnetic-demo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    padding: 80px 48px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    max-width: 360px;
  }
  
  .magnetic-wrapper {
    padding: 48px;
  }
  
  .magnetic-button {
    position: relative;
    padding: 20px 48px;
    background: transparent;
    border: 2px solid rgba(255,255,255,0.15);
    border-radius: 40px;
    cursor: pointer;
    overflow: hidden;
    transition: transform 0.15s ease-out, border-color 0.3s ease;
  }
  
  .magnetic-button.hovered {
    border-color: #6366f1;
  }
  
  .button-text {
    position: relative;
    z-index: 1;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    transition: transform 0.15s ease-out;
  }
  
  .button-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 38px;
    transform: scale(0);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .magnetic-button.hovered .button-bg {
    transform: scale(1);
  }
  
  .demo-hint {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.4);
    text-align: center;
  }
</style>
```

---

## Summary

This collection pushes creative boundaries:

1. **Glassmorphism** — Frosted glass with depth and mouse-tracking glow
2. **3D Flip Cards** — Perspective transforms revealing hidden content
3. **Particle Fields** — Interactive animated backgrounds with connections
4. **Morphing Buttons** — Fluid state transitions with shape changes
5. **Gradient Borders** — Animated conic gradient edge effects
6. **Magnetic Buttons** — Cursor-following elastic interactions

---

*Experimentation is the laboratory of design. Break rules. Create wonder.*

---

## Collection Complete ◈

This concludes the Dark Component Library—a comprehensive showcase of modern, dark-themed Svelte 5 components spanning:

- **Navigation & Layout** — Sidebars, tabs, pagination
- **Forms & Inputs** — OTP, date pickers, file uploads
- **Feedback & Status** — Alerts, progress, timelines
- **Cards & Containers** — Features, pricing, testimonials
- **Social & User** — Profiles, feeds, comments
- **Audio & Media** — Players, waveforms, galleries
- **E-Commerce** — Products, carts, checkout
- **Dashboard & Analytics** — Charts, tables, metrics
- **Utilities & Micro** — Tooltips, badges, skeletons
- **Experimental** — Glassmorphism, 3D, particles

*Design is not just what it looks like. Design is how it works, how it feels, and how it delights.*
