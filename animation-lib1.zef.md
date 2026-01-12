# Interactive Animation Library I ◈

**Fluid Motion** — Where physics meets elegance.

---

## Introduction

This collection showcases interactive animations that respond to user input with natural, physics-based motion. Each component demonstrates smooth state transitions, spring animations, and cursor-aware effects that bring interfaces to life.

---

## Component Collection

Eight interactive animation components with stunning visual feedback.

---

### 1. Liquid Button

A button with fluid, water-like hover effects:

```svelte
<script>
  let isHovered = $state(false);
  let ripples = $state([]);
  let rippleId = 0;
  
  function addRipple(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { id: rippleId++, x, y };
    ripples = [...ripples, newRipple];
    
    setTimeout(() => {
      ripples = ripples.filter(r => r.id !== newRipple.id);
    }, 1000);
  }
</script>

<button 
  class="liquid-button"
  class:hovered={isHovered}
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}
  onclick={addRipple}
>
  <span class="button-bg">
    <span class="blob blob-1"></span>
    <span class="blob blob-2"></span>
    <span class="blob blob-3"></span>
  </span>
  
  {#each ripples as ripple (ripple.id)}
    <span 
      class="ripple"
      style="left: {ripple.x}px; top: {ripple.y}px"
    ></span>
  {/each}
  
  <span class="button-text">Dive In</span>
</button>

<style>
  .liquid-button {
    position: relative;
    padding: 18px 48px;
    background: transparent;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    overflow: hidden;
    isolation: isolate;
  }
  
  .button-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #0ea5e9, #6366f1);
    border-radius: 50px;
    z-index: -2;
  }
  
  .blob {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    filter: blur(8px);
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .blob-1 {
    width: 60px;
    height: 60px;
    top: -20px;
    left: -20px;
    opacity: 0;
  }
  
  .blob-2 {
    width: 40px;
    height: 40px;
    bottom: -15px;
    right: 30%;
    opacity: 0;
  }
  
  .blob-3 {
    width: 50px;
    height: 50px;
    top: 50%;
    right: -15px;
    transform: translateY(-50%);
    opacity: 0;
  }
  
  .liquid-button.hovered .blob {
    opacity: 1;
  }
  
  .liquid-button.hovered .blob-1 {
    transform: translate(20px, 15px) scale(1.2);
  }
  
  .liquid-button.hovered .blob-2 {
    transform: translate(-10px, -10px) scale(1.3);
  }
  
  .liquid-button.hovered .blob-3 {
    transform: translate(-15px, -50%) scale(1.1);
  }
  
  .ripple {
    position: absolute;
    width: 10px;
    height: 10px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    animation: ripple-expand 1s ease-out forwards;
    pointer-events: none;
  }
  
  @keyframes ripple-expand {
    to {
      transform: translate(-50%, -50%) scale(20);
      opacity: 0;
    }
  }
  
  .button-text {
    position: relative;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    z-index: 1;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
</style>
```

---

### 2. Elastic Card Stack

Cards with spring-based stacking animation:

```svelte
<script>
  let expandedIndex = $state(-1);
  
  const cards = [
    { title: 'Design', color: '#6366f1', icon: '◇' },
    { title: 'Develop', color: '#8b5cf6', icon: '⬡' },
    { title: 'Deploy', color: '#ec4899', icon: '◎' },
    { title: 'Delight', color: '#f59e0b', icon: '✧' }
  ];
  
  function handleClick(index) {
    expandedIndex = expandedIndex === index ? -1 : index;
  }
</script>

<div class="card-stack">
  {#each cards as card, i}
    {@const isExpanded = expandedIndex === i}
    {@const offset = expandedIndex === -1 ? i * 12 : (i < expandedIndex ? -120 : (i > expandedIndex ? 120 : 0))}
    {@const scale = expandedIndex === -1 ? 1 - i * 0.03 : (isExpanded ? 1.05 : 0.9)}
    {@const zIndex = expandedIndex === -1 ? cards.length - i : (isExpanded ? 10 : 1)}
    
    <button
      class="stack-card"
      class:expanded={isExpanded}
      style="
        --card-color: {card.color};
        transform: translateY({offset}px) scale({scale});
        z-index: {zIndex};
      "
      onclick={() => handleClick(i)}
    >
      <span class="card-icon">{card.icon}</span>
      <span class="card-title">{card.title}</span>
      
      {#if isExpanded}
        <p class="card-description">
          Click to explore the {card.title.toLowerCase()} phase of our creative process.
        </p>
      {/if}
    </button>
  {/each}
</div>

<style>
  .card-stack {
    position: relative;
    width: 280px;
    height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .stack-card {
    position: absolute;
    width: 100%;
    padding: 24px;
    background: linear-gradient(145deg, var(--card-color), color-mix(in srgb, var(--card-color) 70%, #000));
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    text-align: left;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }
  
  .stack-card:hover:not(.expanded) {
    transform: translateY(var(--hover-offset, 0)) scale(1.02) !important;
  }
  
  .card-icon {
    display: block;
    font-size: 2rem;
    margin-bottom: 12px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }
  
  .card-title {
    display: block;
    font-size: 1.3rem;
    font-weight: 700;
    color: #fff;
  }
  
  .card-description {
    margin: 16px 0 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.5;
    animation: fade-in 0.3s ease;
  }
  
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
```

---

### 3. Breathing Orb

An animated orb with natural breathing motion:

```svelte
<script>
  let isActive = $state(false);
  let breathPhase = $state('inhale');
  let cycleCount = $state(0);
  let interval;
  
  function toggleBreathing() {
    isActive = !isActive;
    
    if (isActive) {
      breathCycle();
    } else {
      clearInterval(interval);
      breathPhase = 'inhale';
      cycleCount = 0;
    }
  }
  
  function breathCycle() {
    breathPhase = 'inhale';
    interval = setInterval(() => {
      if (breathPhase === 'inhale') {
        breathPhase = 'hold';
        setTimeout(() => {
          breathPhase = 'exhale';
        }, 2000);
      } else if (breathPhase === 'exhale') {
        breathPhase = 'inhale';
        cycleCount++;
      }
    }, 4000);
  }
</script>

<div class="breathing-container">
  <button
    class="orb-wrapper"
    class:active={isActive}
    class:inhale={breathPhase === 'inhale' && isActive}
    class:hold={breathPhase === 'hold' && isActive}
    class:exhale={breathPhase === 'exhale' && isActive}
    onclick={toggleBreathing}
  >
    <div class="orb">
      <div class="orb-glow"></div>
      <div class="orb-core"></div>
      <div class="orb-ring ring-1"></div>
      <div class="orb-ring ring-2"></div>
      <div class="orb-ring ring-3"></div>
    </div>
  </button>
  
  <div class="breath-info">
    <span class="breath-phase">
      {isActive ? breathPhase.charAt(0).toUpperCase() + breathPhase.slice(1) : 'Tap to begin'}
    </span>
    {#if isActive}
      <span class="cycle-count">{cycleCount} cycles</span>
    {/if}
  </div>
</div>

<style>
  .breathing-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    padding: 48px;
    background: #09090b;
    border-radius: 24px;
    max-width: 320px;
  }
  
  .orb-wrapper {
    position: relative;
    width: 180px;
    height: 180px;
    background: none;
    border: none;
    cursor: pointer;
  }
  
  .orb {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 4s cubic-bezier(0.4, 0, 0.6, 1);
  }
  
  .orb-wrapper.inhale .orb {
    transform: scale(1.3);
    transition-duration: 4s;
  }
  
  .orb-wrapper.hold .orb {
    transform: scale(1.3);
    transition-duration: 0s;
  }
  
  .orb-wrapper.exhale .orb {
    transform: scale(1);
    transition-duration: 4s;
  }
  
  .orb-glow {
    position: absolute;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(20px);
  }
  
  .orb-core {
    position: absolute;
    width: 60%;
    height: 60%;
    background: radial-gradient(circle at 30% 30%, #818cf8, #6366f1, #4f46e5);
    border-radius: 50%;
    box-shadow: 
      0 0 40px rgba(99, 102, 241, 0.6),
      inset 0 -10px 20px rgba(0, 0, 0, 0.3);
  }
  
  .orb-ring {
    position: absolute;
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 50%;
    animation: pulse-ring 3s ease-in-out infinite;
  }
  
  .ring-1 {
    width: 80%;
    height: 80%;
    animation-delay: 0s;
  }
  
  .ring-2 {
    width: 95%;
    height: 95%;
    animation-delay: 1s;
  }
  
  .ring-3 {
    width: 110%;
    height: 110%;
    animation-delay: 2s;
  }
  
  .orb-wrapper.active .orb-ring {
    animation: none;
  }
  
  @keyframes pulse-ring {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.05); }
  }
  
  .breath-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .breath-phase {
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .cycle-count {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
  }
</style>
```

---

### 4. Magnetic Gallery

Images that attract towards cursor with magnetic effect:

```svelte
<script>
  let items = $state([
    { id: 1, color: '#6366f1', x: 0, y: 0, rotation: 0 },
    { id: 2, color: '#8b5cf6', x: 0, y: 0, rotation: 0 },
    { id: 3, color: '#ec4899', x: 0, y: 0, rotation: 0 },
    { id: 4, color: '#f59e0b', x: 0, y: 0, rotation: 0 },
    { id: 5, color: '#22c55e', x: 0, y: 0, rotation: 0 },
    { id: 6, color: '#14b8a6', x: 0, y: 0, rotation: 0 }
  ]);
  
  let containerRef;
  
  function handleMouseMove(e) {
    if (!containerRef) return;
    
    const rect = containerRef.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    items = items.map((item, index) => {
      const itemEl = containerRef.children[index];
      if (!itemEl) return item;
      
      const itemRect = itemEl.getBoundingClientRect();
      const itemCenterX = itemRect.left - rect.left + itemRect.width / 2;
      const itemCenterY = itemRect.top - rect.top + itemRect.height / 2;
      
      const dx = mouseX - itemCenterX;
      const dy = mouseY - itemCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const maxDistance = 150;
      const strength = Math.max(0, 1 - distance / maxDistance);
      
      return {
        ...item,
        x: dx * strength * 0.3,
        y: dy * strength * 0.3,
        rotation: (dx * strength * 0.1)
      };
    });
  }
  
  function handleMouseLeave() {
    items = items.map(item => ({
      ...item,
      x: 0,
      y: 0,
      rotation: 0
    }));
  }
</script>

<div 
  class="magnetic-gallery"
  bind:this={containerRef}
  onmousemove={handleMouseMove}
  onmouseleave={handleMouseLeave}
>
  {#each items as item (item.id)}
    <div 
      class="gallery-item"
      style="
        --item-color: {item.color};
        transform: translate({item.x}px, {item.y}px) rotate({item.rotation}deg);
      "
    >
      <span class="item-number">{item.id}</span>
    </div>
  {/each}
</div>

<style>
  .magnetic-gallery {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    padding: 32px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    max-width: 360px;
  }
  
  .gallery-item {
    aspect-ratio: 1;
    background: linear-gradient(145deg, var(--item-color), color-mix(in srgb, var(--item-color) 60%, #000));
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease-out, box-shadow 0.3s ease;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
  
  .gallery-item:hover {
    box-shadow: 0 8px 30px color-mix(in srgb, var(--item-color) 40%, transparent);
  }
  
  .item-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
</style>
```

---

### 5. Gooey Menu

A menu with gooey blob animation effect:

```svelte
<script>
  let isOpen = $state(false);
  
  const menuItems = [
    { icon: '◇', label: 'Home' },
    { icon: '✦', label: 'Search' },
    { icon: '◎', label: 'Profile' },
    { icon: '⬡', label: 'Settings' }
  ];
</script>

<div class="gooey-menu" class:open={isOpen}>
  <svg class="goo-filter">
    <defs>
      <filter id="goo">
        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
        <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
      </filter>
    </defs>
  </svg>
  
  <div class="menu-wrapper" style="filter: url(#goo)">
    <button 
      class="menu-trigger"
      onclick={() => isOpen = !isOpen}
    >
      <span class="trigger-icon" class:rotated={isOpen}>✚</span>
    </button>
    
    {#each menuItems as item, i}
      {@const angle = -90 + (i * 45)}
      {@const distance = isOpen ? 80 : 0}
      {@const x = Math.cos(angle * Math.PI / 180) * distance}
      {@const y = Math.sin(angle * Math.PI / 180) * distance}
      
      <button 
        class="menu-item"
        style="
          transform: translate({x}px, {y}px);
          transition-delay: {isOpen ? i * 50 : (menuItems.length - i) * 50}ms;
        "
        title={item.label}
      >
        <span class="item-icon">{item.icon}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .gooey-menu {
    position: relative;
    width: 220px;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .goo-filter {
    position: absolute;
    width: 0;
    height: 0;
  }
  
  .menu-wrapper {
    position: relative;
    width: 56px;
    height: 56px;
  }
  
  .menu-trigger {
    position: absolute;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    z-index: 10;
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
    transition: transform 0.3s ease;
  }
  
  .menu-trigger:hover {
    transform: scale(1.1);
  }
  
  .trigger-icon {
    font-size: 1.5rem;
    color: #fff;
    display: block;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .trigger-icon.rotated {
    transform: rotate(45deg);
  }
  
  .menu-item {
    position: absolute;
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    left: 4px;
    top: 4px;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
    opacity: 0;
  }
  
  .gooey-menu.open .menu-item {
    opacity: 1;
  }
  
  .menu-item:hover {
    background: linear-gradient(135deg, #a78bfa, #818cf8);
  }
  
  .item-icon {
    font-size: 1.1rem;
    color: #fff;
  }
</style>
```

---

### 6. Wave Text

Text with cascading wave animation:

```svelte
<script>
  let isAnimating = $state(false);
  const text = "WAVELENGTH";
  const letters = text.split('');
  
  function triggerWave() {
    if (isAnimating) return;
    isAnimating = true;
    setTimeout(() => isAnimating = false, 1000);
  }
</script>

<div class="wave-container">
  <button 
    class="wave-text"
    class:animating={isAnimating}
    onclick={triggerWave}
  >
    {#each letters as letter, i}
      <span 
        class="wave-letter"
        style="
          --delay: {i * 50}ms;
          --color: hsl({200 + i * 15}, 80%, 60%);
        "
      >{letter}</span>
    {/each}
  </button>
  
  <p class="wave-hint">Click to trigger wave</p>
</div>

<style>
  .wave-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 48px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
  }
  
  .wave-text {
    display: flex;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }
  
  .wave-letter {
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--color);
    transition: transform 0.2s ease, color 0.2s ease;
  }
  
  .wave-letter:hover {
    transform: translateY(-8px);
    color: #fff;
  }
  
  .wave-text.animating .wave-letter {
    animation: wave 0.6s ease forwards;
    animation-delay: var(--delay);
  }
  
  @keyframes wave {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(-20px) rotate(-5deg); }
    50% { transform: translateY(-10px) rotate(3deg); }
    75% { transform: translateY(-15px) rotate(-2deg); }
  }
  
  .wave-hint {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
  }
</style>
```

---

### 7. Tilt Card

A 3D card with perspective tilt based on cursor position:

```svelte
<script>
  let rotateX = $state(0);
  let rotateY = $state(0);
  let glareX = $state(50);
  let glareY = $state(50);
  let isHovered = $state(false);
  
  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    rotateY = ((x - centerX) / centerX) * 15;
    rotateX = -((y - centerY) / centerY) * 15;
    glareX = (x / rect.width) * 100;
    glareY = (y / rect.height) * 100;
  }
  
  function handleMouseLeave() {
    isHovered = false;
    rotateX = 0;
    rotateY = 0;
  }
  
  function handleMouseEnter() {
    isHovered = true;
  }
</script>

<div class="tilt-wrapper">
  <div
    class="tilt-card"
    class:hovered={isHovered}
    onmousemove={handleMouseMove}
    onmouseleave={handleMouseLeave}
    onmouseenter={handleMouseEnter}
    style="transform: perspective(1000px) rotateX({rotateX}deg) rotateY({rotateY}deg)"
  >
    <div 
      class="card-glare"
      style="background: radial-gradient(circle at {glareX}% {glareY}%, rgba(255,255,255,0.25) 0%, transparent 60%)"
    ></div>
    
    <div class="card-content">
      <div class="card-icon">◈</div>
      <h3 class="card-title">3D Perspective</h3>
      <p class="card-text">Move your cursor to experience smooth 3D tilt effect with dynamic lighting.</p>
    </div>
    
    <div class="card-shine"></div>
  </div>
</div>

<style>
  .tilt-wrapper {
    perspective: 1000px;
    padding: 32px;
  }
  
  .tilt-card {
    position: relative;
    width: 300px;
    height: 200px;
    background: linear-gradient(145deg, #111113 0%, #0c0c0e 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    overflow: hidden;
    transition: transform 0.1s ease-out, box-shadow 0.3s ease;
    transform-style: preserve-3d;
  }
  
  .tilt-card.hovered {
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.4),
      0 0 60px rgba(99, 102, 241, 0.15);
  }
  
  .card-glare {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .tilt-card.hovered .card-glare {
    opacity: 1;
  }
  
  .card-content {
    position: relative;
    height: 100%;
    padding: 28px;
    display: flex;
    flex-direction: column;
    transform: translateZ(30px);
  }
  
  .card-icon {
    font-size: 2rem;
    color: #6366f1;
    margin-bottom: 16px;
  }
  
  .card-title {
    margin: 0 0 8px;
    font-size: 1.2rem;
    font-weight: 700;
    color: #fff;
  }
  
  .card-text {
    margin: 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.5;
  }
  
  .card-shine {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 40%,
      rgba(255, 255, 255, 0.03) 50%,
      transparent 60%
    );
    transform: translateX(-100%);
  }
  
  .tilt-card.hovered .card-shine {
    animation: shine 1.5s ease forwards;
  }
  
  @keyframes shine {
    to { transform: translateX(100%); }
  }
</style>
```

---

### 8. Stagger Reveal

Content that staggers in with elegant timing:

```svelte
<script>
  let isVisible = $state(false);
  
  const items = [
    { title: 'Innovation', desc: 'Pushing boundaries every day' },
    { title: 'Excellence', desc: 'Crafted with precision and care' },
    { title: 'Impact', desc: 'Creating meaningful experiences' }
  ];
  
  function toggleVisibility() {
    isVisible = !isVisible;
  }
</script>

<div class="stagger-container">
  <button class="reveal-trigger" onclick={toggleVisibility}>
    {isVisible ? 'Hide Content' : 'Reveal Content'}
  </button>
  
  <div class="stagger-content" class:visible={isVisible}>
    <h2 class="stagger-title">
      {#each 'Our Values'.split('') as char, i}
        <span style="--delay: {i * 30}ms">{char === ' ' ? '\u00A0' : char}</span>
      {/each}
    </h2>
    
    <div class="stagger-items">
      {#each items as item, i}
        <div class="stagger-item" style="--delay: {200 + i * 100}ms">
          <h3 class="item-title">{item.title}</h3>
          <p class="item-desc">{item.desc}</p>
        </div>
      {/each}
    </div>
    
    <div class="stagger-line" style="--delay: 500ms"></div>
  </div>
</div>

<style>
  .stagger-container {
    padding: 40px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    max-width: 400px;
  }
  
  .reveal-trigger {
    width: 100%;
    padding: 14px 24px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    border-radius: 12px;
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 32px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .reveal-trigger:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
  }
  
  .stagger-content {
    overflow: hidden;
  }
  
  .stagger-title {
    margin: 0 0 24px;
    font-size: 1.8rem;
    font-weight: 700;
    color: #fff;
    display: flex;
  }
  
  .stagger-title span {
    display: inline-block;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.4s ease, transform 0.4s ease;
    transition-delay: var(--delay);
  }
  
  .stagger-content.visible .stagger-title span {
    opacity: 1;
    transform: translateY(0);
  }
  
  .stagger-items {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .stagger-item {
    padding: 20px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    opacity: 0;
    transform: translateX(-30px);
    transition: opacity 0.5s ease, transform 0.5s ease;
    transition-delay: var(--delay);
  }
  
  .stagger-content.visible .stagger-item {
    opacity: 1;
    transform: translateX(0);
  }
  
  .item-title {
    margin: 0 0 4px;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .item-desc {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .stagger-line {
    height: 2px;
    margin-top: 24px;
    background: linear-gradient(90deg, #6366f1, #ec4899);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    transition-delay: var(--delay);
  }
  
  .stagger-content.visible .stagger-line {
    transform: scaleX(1);
  }
</style>
```

---

## Summary

This collection demonstrates fluid, physics-based animations:

1. **Liquid Button** — Water-like blobs with ripple effects
2. **Elastic Card Stack** — Spring-based card expansion
3. **Breathing Orb** — Natural breathing rhythm animation
4. **Magnetic Gallery** — Cursor-attracted grid items
5. **Gooey Menu** — SVG filter-based blob menu
6. **Wave Text** — Cascading letter animations
7. **Tilt Card** — 3D perspective with dynamic lighting
8. **Stagger Reveal** — Choreographed content entrance

---

*Motion is the language of emotion. Let your interfaces breathe, respond, and delight.*
