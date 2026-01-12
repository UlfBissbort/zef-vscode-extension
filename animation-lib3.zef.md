# Interactive Animation Library III ◈

**Hover & Focus** — Respond to intention.

---

## Introduction

This collection explores hover and focus state animations—the micro-interactions that make interfaces feel responsive and alive. Every hover effect, every focus state is an opportunity to communicate with the user.

---

## Component Collection

Eight hover and focus animation components.

---

### 1. Spotlight Card

Card with spotlight effect following cursor:

```svelte
<script>
  let mousePosition = $state({ x: 0, y: 0 });
  let isHovered = $state(false);
  
  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    mousePosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
</script>

<div 
  class="spotlight-card"
  class:hovered={isHovered}
  onmousemove={handleMouseMove}
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}
>
  <div 
    class="spotlight"
    style="--x: {mousePosition.x}px; --y: {mousePosition.y}px"
  ></div>
  
  <div class="card-content">
    <div class="card-icon">✧</div>
    <h3 class="card-title">Spotlight Effect</h3>
    <p class="card-desc">Move your cursor to reveal the hidden light that follows your intention.</p>
  </div>
  
  <div class="card-border"></div>
</div>

<style>
  .spotlight-card {
    position: relative;
    max-width: 340px;
    padding: 32px;
    background: #0c0c0e;
    border-radius: 20px;
    overflow: hidden;
    cursor: default;
  }
  
  .spotlight {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      400px circle at var(--x) var(--y),
      rgba(99, 102, 241, 0.15),
      transparent 40%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .spotlight-card.hovered .spotlight {
    opacity: 1;
  }
  
  .card-border {
    position: absolute;
    inset: 0;
    border-radius: 20px;
    border: 1px solid transparent;
    background: radial-gradient(
      300px circle at var(--x) var(--y),
      rgba(99, 102, 241, 0.5),
      transparent 40%
    ) border-box;
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  
  .spotlight-card.hovered .card-border {
    opacity: 1;
  }
  
  .card-content {
    position: relative;
  }
  
  .card-icon {
    font-size: 2.5rem;
    color: #6366f1;
    margin-bottom: 16px;
  }
  
  .card-title {
    margin: 0 0 12px;
    font-size: 1.3rem;
    font-weight: 700;
    color: #fff;
  }
  
  .card-desc {
    margin: 0;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.5;
  }
</style>
```

---

### 2. Hover Reveal Image

Image that reveals on hover with smooth mask:

```svelte
<script>
  let isHovered = $state(false);
  let progress = $state(0);
  let interval;
  
  function handleEnter() {
    isHovered = true;
    clearInterval(interval);
    interval = setInterval(() => {
      progress = Math.min(progress + 5, 100);
      if (progress >= 100) clearInterval(interval);
    }, 16);
  }
  
  function handleLeave() {
    isHovered = false;
    clearInterval(interval);
    interval = setInterval(() => {
      progress = Math.max(progress - 5, 0);
      if (progress <= 0) clearInterval(interval);
    }, 16);
  }
</script>

<div 
  class="reveal-container"
  onmouseenter={handleEnter}
  onmouseleave={handleLeave}
>
  <div class="image-placeholder">
    <div class="placeholder-gradient"></div>
    <span class="placeholder-icon">◎</span>
  </div>
  
  <div 
    class="reveal-overlay"
    style="clip-path: polygon(0 0, {progress}% 0, {progress}% 100%, 0 100%)"
  >
    <div class="revealed-content">
      <div class="content-gradient"></div>
      <div class="content-info">
        <span class="reveal-tag">Featured</span>
        <h3 class="reveal-title">Creative Vision</h3>
        <p class="reveal-desc">Unveiling beauty through interaction</p>
      </div>
    </div>
  </div>
  
  <div class="hover-hint" class:hidden={isHovered}>
    Hover to reveal
  </div>
</div>

<style>
  .reveal-container {
    position: relative;
    max-width: 340px;
    height: 240px;
    border-radius: 20px;
    overflow: hidden;
    cursor: pointer;
  }
  
  .image-placeholder {
    position: absolute;
    inset: 0;
    background: #111113;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .placeholder-gradient {
    position: absolute;
    inset: 0;
    background: 
      radial-gradient(circle at 30% 70%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 70% 30%, rgba(236, 72, 153, 0.1) 0%, transparent 50%);
  }
  
  .placeholder-icon {
    font-size: 3rem;
    color: rgba(255, 255, 255, 0.2);
  }
  
  .reveal-overlay {
    position: absolute;
    inset: 0;
    transition: clip-path 0.05s linear;
  }
  
  .revealed-content {
    position: absolute;
    inset: 0;
    background: linear-gradient(145deg, #6366f1, #8b5cf6);
  }
  
  .content-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
  }
  
  .content-info {
    position: absolute;
    bottom: 24px;
    left: 24px;
    right: 24px;
  }
  
  .reveal-tag {
    display: inline-block;
    padding: 4px 12px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 12px;
  }
  
  .reveal-title {
    margin: 0 0 4px;
    font-size: 1.3rem;
    font-weight: 700;
    color: #fff;
  }
  
  .reveal-desc {
    margin: 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .hover-hint {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    transition: opacity 0.3s ease;
  }
  
  .hover-hint.hidden {
    opacity: 0;
  }
</style>
```

---

### 3. Underline Animation

Text links with creative underline animations:

```svelte
<script>
  // Different underline styles
</script>

<div class="underline-demo">
  <nav class="nav-links">
    <a href="#" class="link link-slide">
      <span class="link-text">Slide Left</span>
      <span class="link-line"></span>
    </a>
    
    <a href="#" class="link link-center">
      <span class="link-text">From Center</span>
      <span class="link-line"></span>
    </a>
    
    <a href="#" class="link link-gradient">
      <span class="link-text">Gradient</span>
      <span class="link-line"></span>
    </a>
    
    <a href="#" class="link link-thick">
      <span class="link-text">Highlight</span>
      <span class="link-line"></span>
    </a>
    
    <a href="#" class="link link-double">
      <span class="link-text">Double Line</span>
      <span class="link-line line-1"></span>
      <span class="link-line line-2"></span>
    </a>
  </nav>
</div>

<style>
  .underline-demo {
    padding: 40px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    max-width: 300px;
  }
  
  .nav-links {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .link {
    position: relative;
    text-decoration: none;
    padding: 4px 0;
    display: inline-block;
    width: fit-content;
  }
  
  .link-text {
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
    transition: color 0.3s ease;
  }
  
  .link:hover .link-text {
    color: #6366f1;
  }
  
  .link-line {
    position: absolute;
    bottom: 0;
    height: 2px;
    background: #6366f1;
  }
  
  /* Slide from left */
  .link-slide .link-line {
    left: 0;
    width: 0;
    transition: width 0.3s ease;
  }
  
  .link-slide:hover .link-line {
    width: 100%;
  }
  
  /* From center */
  .link-center .link-line {
    left: 50%;
    width: 0;
    transform: translateX(-50%);
    transition: width 0.3s ease;
  }
  
  .link-center:hover .link-line {
    width: 100%;
  }
  
  /* Gradient */
  .link-gradient .link-line {
    left: 0;
    width: 0;
    background: linear-gradient(90deg, #6366f1, #ec4899);
    transition: width 0.3s ease;
  }
  
  .link-gradient:hover .link-line {
    width: 100%;
  }
  
  /* Thick highlight */
  .link-thick .link-line {
    left: 0;
    bottom: -2px;
    width: 100%;
    height: 0;
    background: rgba(99, 102, 241, 0.3);
    transition: height 0.3s ease;
    z-index: -1;
  }
  
  .link-thick:hover .link-line {
    height: 100%;
    bottom: 0;
  }
  
  /* Double line */
  .link-double .line-1 {
    left: 0;
    width: 0;
    bottom: 0;
    transition: width 0.3s ease;
  }
  
  .link-double .line-2 {
    right: 0;
    left: auto;
    width: 0;
    bottom: 6px;
    height: 1px;
    transition: width 0.3s ease 0.1s;
  }
  
  .link-double:hover .line-1,
  .link-double:hover .line-2 {
    width: 100%;
  }
</style>
```

---

### 4. Icon Morph Button

Button with icon that morphs on hover:

```svelte
<script>
  let isHovered = $state(false);
</script>

<button 
  class="morph-button"
  class:hovered={isHovered}
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}
>
  <span class="button-content">
    <span class="icon-wrapper">
      <span class="icon icon-default">→</span>
      <span class="icon icon-hover">✓</span>
    </span>
    <span class="button-text">
      <span class="text-default">Continue</span>
      <span class="text-hover">Let's Go</span>
    </span>
  </span>
</button>

<style>
  .morph-button {
    position: relative;
    padding: 16px 32px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    border-radius: 14px;
    cursor: pointer;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .morph-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(99, 102, 241, 0.4);
  }
  
  .button-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .icon-wrapper {
    position: relative;
    width: 20px;
    height: 20px;
  }
  
  .icon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    color: #fff;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .icon-default {
    opacity: 1;
    transform: translateX(0);
  }
  
  .icon-hover {
    opacity: 0;
    transform: translateX(-10px);
  }
  
  .morph-button.hovered .icon-default {
    opacity: 0;
    transform: translateX(10px);
  }
  
  .morph-button.hovered .icon-hover {
    opacity: 1;
    transform: translateX(0);
  }
  
  .button-text {
    position: relative;
    height: 20px;
    overflow: hidden;
  }
  
  .text-default,
  .text-hover {
    display: block;
    font-size: 0.95rem;
    font-weight: 600;
    color: #fff;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .text-hover {
    position: absolute;
    top: 0;
    transform: translateY(100%);
  }
  
  .morph-button.hovered .text-default {
    transform: translateY(-100%);
  }
  
  .morph-button.hovered .text-hover {
    transform: translateY(0);
  }
</style>
```

---

### 5. Hover Card Stack

Stacked cards that fan out on hover:

```svelte
<script>
  let isHovered = $state(false);
</script>

<div 
  class="stack-container"
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}
>
  <div class="card-stack" class:hovered={isHovered}>
    <div class="stacked-card card-1">
      <span class="card-emoji">🎨</span>
      <span class="card-label">Design</span>
    </div>
    <div class="stacked-card card-2">
      <span class="card-emoji">⚡</span>
      <span class="card-label">Build</span>
    </div>
    <div class="stacked-card card-3">
      <span class="card-emoji">🚀</span>
      <span class="card-label">Ship</span>
    </div>
  </div>
  
  <p class="stack-hint">Hover to explore</p>
</div>

<style>
  .stack-container {
    padding: 80px 60px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
  }
  
  .card-stack {
    position: relative;
    width: 120px;
    height: 160px;
    perspective: 1000px;
  }
  
  .stacked-card {
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(145deg, #111113, #0c0c0e);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
  
  .card-emoji {
    font-size: 2rem;
  }
  
  .card-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .card-1 {
    z-index: 3;
    background: linear-gradient(145deg, #6366f1, #4f46e5);
  }
  
  .card-2 {
    z-index: 2;
    background: linear-gradient(145deg, #8b5cf6, #7c3aed);
  }
  
  .card-3 {
    z-index: 1;
    background: linear-gradient(145deg, #ec4899, #db2777);
  }
  
  .card-stack.hovered .card-1 {
    transform: translateX(-80px) rotate(-15deg);
  }
  
  .card-stack.hovered .card-2 {
    transform: translateX(0) rotate(0);
  }
  
  .card-stack.hovered .card-3 {
    transform: translateX(80px) rotate(15deg);
  }
  
  .card-stack.hovered .card-label {
    opacity: 1;
  }
  
  .stacked-card:hover {
    transform: translateY(-10px) !important;
    z-index: 10;
  }
  
  .stack-hint {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
    transition: opacity 0.3s ease;
  }
  
  .stack-container:hover .stack-hint {
    opacity: 0;
  }
</style>
```

---

### 6. Focus Ring Animation

Custom animated focus states for inputs:

```svelte
<script>
  let focusedField = $state('');
</script>

<div class="focus-demo">
  <div class="input-group">
    <div 
      class="input-wrapper"
      class:focused={focusedField === 'email'}
    >
      <input 
        type="email"
        placeholder="Email address"
        onfocus={() => focusedField = 'email'}
        onblur={() => focusedField = ''}
      />
      <div class="focus-ring"></div>
      <div class="focus-glow"></div>
    </div>
  </div>
  
  <div class="input-group">
    <div 
      class="input-wrapper"
      class:focused={focusedField === 'password'}
    >
      <input 
        type="password"
        placeholder="Password"
        onfocus={() => focusedField = 'password'}
        onblur={() => focusedField = ''}
      />
      <div class="focus-ring"></div>
      <div class="focus-glow"></div>
    </div>
  </div>
  
  <button class="submit-btn">Sign In</button>
</div>

<style>
  .focus-demo {
    max-width: 320px;
    padding: 32px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .input-group {
    position: relative;
  }
  
  .input-wrapper {
    position: relative;
    overflow: hidden;
    border-radius: 12px;
  }
  
  .input-wrapper input {
    width: 100%;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #fff;
    font-size: 0.95rem;
    outline: none;
    transition: background 0.3s ease;
  }
  
  .input-wrapper input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  .input-wrapper.focused input {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .focus-ring {
    position: absolute;
    inset: 0;
    border-radius: 12px;
    border: 2px solid #6366f1;
    opacity: 0;
    transform: scale(1.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
  }
  
  .input-wrapper.focused .focus-ring {
    opacity: 1;
    transform: scale(1);
  }
  
  .focus-glow {
    position: absolute;
    inset: -20px;
    background: radial-gradient(circle at center, rgba(99, 102, 241, 0.15), transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  
  .input-wrapper.focused .focus-glow {
    opacity: 1;
  }
  
  .submit-btn {
    padding: 16px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    border-radius: 12px;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 8px;
    transition: all 0.3s ease;
  }
  
  .submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
  }
  
  .submit-btn:focus {
    outline: 2px solid #6366f1;
    outline-offset: 2px;
  }
</style>
```

---

### 7. Image Zoom Hover

Image with smooth zoom and overlay on hover:

```svelte
<script>
  let isHovered = $state(false);
</script>

<div 
  class="zoom-card"
  class:hovered={isHovered}
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}
>
  <div class="image-container">
    <div class="image-placeholder">
      <div class="placeholder-pattern"></div>
    </div>
    <div class="image-overlay"></div>
  </div>
  
  <div class="card-info">
    <div class="info-content">
      <span class="card-category">Photography</span>
      <h3 class="card-title">Urban Landscapes</h3>
    </div>
    
    <button class="view-button">
      <span class="button-icon">→</span>
    </button>
  </div>
</div>

<style>
  .zoom-card {
    max-width: 320px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    overflow: hidden;
    cursor: pointer;
  }
  
  .image-container {
    position: relative;
    height: 200px;
    overflow: hidden;
  }
  
  .image-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(145deg, #6366f1, #8b5cf6);
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .zoom-card.hovered .image-placeholder {
    transform: scale(1.1);
  }
  
  .placeholder-pattern {
    position: absolute;
    inset: 0;
    background: 
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        rgba(255, 255, 255, 0.03) 10px,
        rgba(255, 255, 255, 0.03) 20px
      );
  }
  
  .image-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent 50%);
    opacity: 0.5;
    transition: opacity 0.3s ease;
  }
  
  .zoom-card.hovered .image-overlay {
    opacity: 1;
  }
  
  .card-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
  }
  
  .info-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .card-category {
    font-size: 0.75rem;
    font-weight: 600;
    color: #6366f1;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .card-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
  }
  
  .view-button {
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .button-icon {
    font-size: 1.2rem;
    color: #fff;
    transition: transform 0.3s ease;
  }
  
  .zoom-card.hovered .view-button {
    background: #6366f1;
    border-color: #6366f1;
  }
  
  .zoom-card.hovered .button-icon {
    transform: translateX(4px);
  }
</style>
```

---

### 8. Menu Item Hover

Animated menu items with sliding backgrounds:

```svelte
<script>
  let hoveredIndex = $state(-1);
  
  const menuItems = [
    { icon: '◇', label: 'Dashboard', badge: null },
    { icon: '✦', label: 'Projects', badge: '12' },
    { icon: '◎', label: 'Analytics', badge: null },
    { icon: '⬡', label: 'Messages', badge: '3' },
    { icon: '◈', label: 'Settings', badge: null }
  ];
</script>

<nav class="hover-menu">
  {#each menuItems as item, i}
    <a 
      href="#"
      class="menu-item"
      class:hovered={hoveredIndex === i}
      onmouseenter={() => hoveredIndex = i}
      onmouseleave={() => hoveredIndex = -1}
    >
      <span class="item-bg"></span>
      <span class="item-icon">{item.icon}</span>
      <span class="item-label">{item.label}</span>
      {#if item.badge}
        <span class="item-badge">{item.badge}</span>
      {/if}
      <span class="item-arrow">→</span>
    </a>
  {/each}
</nav>

<style>
  .hover-menu {
    max-width: 280px;
    padding: 12px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .menu-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    text-decoration: none;
    border-radius: 12px;
    overflow: hidden;
  }
  
  .item-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1));
    opacity: 0;
    transform: translateX(-100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .menu-item.hovered .item-bg {
    opacity: 1;
    transform: translateX(0);
  }
  
  .item-icon {
    position: relative;
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.5);
    transition: color 0.3s ease;
  }
  
  .menu-item.hovered .item-icon {
    color: #6366f1;
  }
  
  .item-label {
    position: relative;
    flex: 1;
    font-size: 0.95rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    transition: color 0.3s ease;
  }
  
  .menu-item.hovered .item-label {
    color: #fff;
  }
  
  .item-badge {
    position: relative;
    padding: 2px 8px;
    background: rgba(99, 102, 241, 0.2);
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 600;
    color: #6366f1;
  }
  
  .item-arrow {
    position: relative;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.3);
    opacity: 0;
    transform: translateX(-10px);
    transition: all 0.3s ease;
  }
  
  .menu-item.hovered .item-arrow {
    opacity: 1;
    transform: translateX(0);
    color: #6366f1;
  }
</style>
```

---

## Summary

This collection demonstrates responsive hover and focus animations:

1. **Spotlight Card** — Cursor-tracking light effect
2. **Hover Reveal** — Progressive image mask reveal
3. **Underline Animation** — Creative link underlines
4. **Icon Morph Button** — Text and icon swap
5. **Hover Card Stack** — Fanning card arrangement
6. **Focus Ring Animation** — Glowing input focus states
7. **Image Zoom Hover** — Smooth scale with overlay
8. **Menu Item Hover** — Sliding background effects

---

*Every hover is an opportunity. Every focus is a moment of intention. Make them memorable.*
