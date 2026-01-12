# Interactive Animation Library II ◈

**Scroll & Reveal** — Motion that responds to journey.

---

## Introduction

This collection explores scroll-driven animations and reveal effects. Components respond to viewport position, creating immersive experiences as users navigate through content. Each animation is crafted to feel natural and purposeful.

---

## Component Collection

Seven scroll and reveal animation components.

---

### 1. Parallax Cards

Cards with layered depth parallax on scroll:

```svelte
<script>
  let scrollY = $state(0);
  let containerRef;
  
  const cards = [
    { title: 'Depth', color: '#6366f1', layer: 1 },
    { title: 'Motion', color: '#8b5cf6', layer: 2 },
    { title: 'Flow', color: '#ec4899', layer: 3 }
  ];
  
  function handleScroll() {
    if (containerRef) {
      scrollY = containerRef.scrollTop;
    }
  }
</script>

<div 
  class="parallax-container"
  bind:this={containerRef}
  onscroll={handleScroll}
>
  <div class="parallax-content">
    <div class="intro-section">
      <h2 class="parallax-title">Scroll Down</h2>
      <span class="scroll-arrow">↓</span>
    </div>
    
    {#each cards as card, i}
      {@const offset = scrollY * (0.1 + card.layer * 0.15)}
      <div 
        class="parallax-card"
        style="
          --card-color: {card.color};
          transform: translateY({-offset}px);
        "
      >
        <div class="card-layer layer-bg" style="transform: translateY({offset * 0.2}px)"></div>
        <div class="card-layer layer-mid" style="transform: translateY({offset * 0.4}px)"></div>
        <div class="card-content">
          <span class="card-number">0{i + 1}</span>
          <h3 class="card-title">{card.title}</h3>
        </div>
      </div>
    {/each}
    
    <div class="outro-section">
      <p class="outro-text">Experience the depth</p>
    </div>
  </div>
</div>

<style>
  .parallax-container {
    width: 100%;
    max-width: 400px;
    height: 400px;
    overflow-y: auto;
    background: #09090b;
    border-radius: 24px;
    scroll-behavior: smooth;
  }
  
  .parallax-content {
    min-height: 1200px;
    padding: 40px;
    display: flex;
    flex-direction: column;
    gap: 200px;
  }
  
  .intro-section {
    text-align: center;
    padding: 60px 0;
  }
  
  .parallax-title {
    margin: 0 0 16px;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
  }
  
  .scroll-arrow {
    font-size: 2rem;
    color: rgba(255, 255, 255, 0.5);
    animation: bounce 2s infinite;
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(10px); }
    60% { transform: translateY(5px); }
  }
  
  .parallax-card {
    position: relative;
    height: 180px;
    border-radius: 20px;
    overflow: hidden;
    will-change: transform;
  }
  
  .card-layer {
    position: absolute;
    inset: 0;
    will-change: transform;
  }
  
  .layer-bg {
    background: linear-gradient(145deg, var(--card-color), color-mix(in srgb, var(--card-color) 50%, #000));
  }
  
  .layer-mid {
    background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent);
  }
  
  .card-content {
    position: relative;
    height: 100%;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  
  .card-number {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 4px;
  }
  
  .card-title {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 800;
    color: #fff;
  }
  
  .outro-section {
    text-align: center;
    padding: 60px 0;
  }
  
  .outro-text {
    margin: 0;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.6);
  }
</style>
```

---

### 2. Fade Reveal Grid

Grid items that fade in as they enter viewport:

```svelte
<script>
  import { onMount } from 'svelte';
  
  let visibleItems = $state(new Set());
  let gridRef;
  
  const items = Array.from({ length: 9 }, (_, i) => ({
    id: i,
    icon: ['◇', '✦', '◎', '⬡', '◈', '✧', '○', '△', '□'][i],
    label: ['Design', 'Build', 'Ship', 'Scale', 'Grow', 'Lead', 'Win', 'Rise', 'Shine'][i]
  }));
  
  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const id = parseInt(entry.target.dataset.id);
          if (entry.isIntersecting) {
            visibleItems = new Set([...visibleItems, id]);
          }
        });
      },
      { threshold: 0.3, root: gridRef?.parentElement }
    );
    
    const itemElements = gridRef?.querySelectorAll('.grid-item');
    itemElements?.forEach(el => observer.observe(el));
    
    return () => observer.disconnect();
  });
</script>

<div class="reveal-container">
  <div class="grid-wrapper" bind:this={gridRef}>
    {#each items as item, i}
      <div 
        class="grid-item"
        class:visible={visibleItems.has(item.id)}
        data-id={item.id}
        style="--delay: {(i % 3) * 100 + Math.floor(i / 3) * 100}ms"
      >
        <span class="item-icon">{item.icon}</span>
        <span class="item-label">{item.label}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .reveal-container {
    max-width: 360px;
    padding: 32px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
  }
  
  .grid-wrapper {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  
  .grid-item {
    aspect-ratio: 1;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    opacity: 0;
    transform: translateY(20px) scale(0.9);
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    transition-delay: var(--delay);
  }
  
  .grid-item.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  
  .grid-item:hover {
    background: rgba(99, 102, 241, 0.1);
    border-color: rgba(99, 102, 241, 0.3);
    transform: translateY(-2px) scale(1.02);
  }
  
  .item-icon {
    font-size: 1.5rem;
    color: #6366f1;
  }
  
  .item-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
  }
</style>
```

---

### 3. Number Counter

Animated number counter on visibility:

```svelte
<script>
  import { onMount } from 'svelte';
  
  let isVisible = $state(false);
  let containerRef;
  
  const stats = [
    { value: 2847, suffix: '+', label: 'Projects Delivered' },
    { value: 99, suffix: '%', label: 'Client Satisfaction' },
    { value: 142, suffix: 'K', label: 'Users Worldwide' },
    { value: 24, suffix: '/7', label: 'Support Available' }
  ];
  
  let animatedValues = $state(stats.map(() => 0));
  
  onMount(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          isVisible = true;
          animateNumbers();
        }
      },
      { threshold: 0.5 }
    );
    
    if (containerRef) observer.observe(containerRef);
    return () => observer.disconnect();
  });
  
  function animateNumbers() {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      
      animatedValues = stats.map(stat => 
        Math.round(stat.value * eased)
      );
      
      if (currentStep >= steps) {
        clearInterval(timer);
        animatedValues = stats.map(stat => stat.value);
      }
    }, interval);
  }
</script>

<div class="counter-container" bind:this={containerRef}>
  <div class="stats-grid">
    {#each stats as stat, i}
      <div class="stat-card" style="--delay: {i * 100}ms">
        <span class="stat-value">
          {animatedValues[i]}{stat.suffix}
        </span>
        <span class="stat-label">{stat.label}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .counter-container {
    max-width: 400px;
    padding: 32px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .stat-card {
    padding: 24px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 16px;
    text-align: center;
    transition: all 0.3s ease;
  }
  
  .stat-card:hover {
    background: rgba(99, 102, 241, 0.08);
    border-color: rgba(99, 102, 241, 0.2);
    transform: translateY(-4px);
  }
  
  .stat-value {
    display: block;
    font-size: 2rem;
    font-weight: 800;
    background: linear-gradient(135deg, #6366f1, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }
</style>
```

---

### 4. Scroll Progress

Progress bar tied to scroll position:

```svelte
<script>
  let scrollProgress = $state(0);
  let containerRef;
  
  function handleScroll() {
    if (!containerRef) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef;
    scrollProgress = (scrollTop / (scrollHeight - clientHeight)) * 100;
  }
</script>

<div class="scroll-progress-demo">
  <div class="progress-header">
    <span class="progress-label">Reading Progress</span>
    <span class="progress-value">{Math.round(scrollProgress)}%</span>
  </div>
  
  <div class="progress-track">
    <div 
      class="progress-fill"
      style="width: {scrollProgress}%"
    ></div>
  </div>
  
  <div 
    class="scroll-content"
    bind:this={containerRef}
    onscroll={handleScroll}
  >
    <article class="article-content">
      <h2 class="article-title">The Art of Motion</h2>
      
      <p class="article-text">
        Animation in user interfaces is more than decoration—it's communication. 
        Well-crafted motion guides attention, provides feedback, and creates 
        emotional connection.
      </p>
      
      <p class="article-text">
        The key principles include timing, easing, and purpose. Every animation 
        should serve a function, whether that's indicating state change, 
        directing focus, or providing spatial context.
      </p>
      
      <h3 class="article-subtitle">Timing Matters</h3>
      
      <p class="article-text">
        Quick animations (150-200ms) feel snappy and responsive. Longer 
        animations (300-500ms) feel smooth and intentional. The context 
        determines which is appropriate.
      </p>
      
      <p class="article-text">
        Easing curves add personality. Linear motion feels mechanical. 
        Ease-out curves feel natural and responsive. Ease-in-out curves 
        feel smooth and polished.
      </p>
      
      <h3 class="article-subtitle">Purpose Over Polish</h3>
      
      <p class="article-text">
        The best animations go unnoticed. They enhance without distracting. 
        They guide without demanding attention. They delight without 
        overwhelming.
      </p>
      
      <p class="article-text">
        When done right, motion becomes invisible—a seamless part of the 
        experience that just feels right.
      </p>
    </article>
  </div>
</div>

<style>
  .scroll-progress-demo {
    max-width: 400px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    overflow: hidden;
  }
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .progress-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
  }
  
  .progress-value {
    font-size: 0.85rem;
    font-weight: 600;
    color: #6366f1;
  }
  
  .progress-track {
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #ec4899);
    transition: width 0.1s ease-out;
  }
  
  .scroll-content {
    height: 300px;
    overflow-y: auto;
    padding: 24px;
  }
  
  .article-content {
    max-width: 100%;
  }
  
  .article-title {
    margin: 0 0 20px;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
  }
  
  .article-subtitle {
    margin: 24px 0 12px;
    font-size: 1.1rem;
    font-weight: 600;
    color: #6366f1;
  }
  
  .article-text {
    margin: 0 0 16px;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.7;
  }
</style>
```

---

### 5. Horizontal Scroll Gallery

Gallery with snap scroll and indicator:

```svelte
<script>
  let activeIndex = $state(0);
  let galleryRef;
  
  const images = [
    { id: 1, color: '#6366f1', title: 'Violet Dreams' },
    { id: 2, color: '#8b5cf6', title: 'Purple Haze' },
    { id: 3, color: '#ec4899', title: 'Pink Sunset' },
    { id: 4, color: '#f59e0b', title: 'Golden Hour' },
    { id: 5, color: '#22c55e', title: 'Forest Green' }
  ];
  
  function handleScroll() {
    if (!galleryRef) return;
    const itemWidth = galleryRef.offsetWidth * 0.85;
    activeIndex = Math.round(galleryRef.scrollLeft / itemWidth);
  }
  
  function scrollTo(index) {
    if (!galleryRef) return;
    const itemWidth = galleryRef.offsetWidth * 0.85;
    galleryRef.scrollTo({ left: index * itemWidth, behavior: 'smooth' });
  }
</script>

<div class="gallery-container">
  <div 
    class="gallery-scroll"
    bind:this={galleryRef}
    onscroll={handleScroll}
  >
    {#each images as image, i}
      <div 
        class="gallery-item"
        class:active={activeIndex === i}
        style="--item-color: {image.color}"
      >
        <div class="item-content">
          <span class="item-number">0{i + 1}</span>
          <h3 class="item-title">{image.title}</h3>
        </div>
      </div>
    {/each}
  </div>
  
  <div class="gallery-indicators">
    {#each images as _, i}
      <button 
        class="indicator"
        class:active={activeIndex === i}
        onclick={() => scrollTo(i)}
      ></button>
    {/each}
  </div>
</div>

<style>
  .gallery-container {
    max-width: 400px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    overflow: hidden;
    padding-bottom: 20px;
  }
  
  .gallery-scroll {
    display: flex;
    gap: 16px;
    padding: 24px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  
  .gallery-scroll::-webkit-scrollbar {
    display: none;
  }
  
  .gallery-item {
    flex: 0 0 85%;
    height: 200px;
    background: linear-gradient(145deg, var(--item-color), color-mix(in srgb, var(--item-color) 60%, #000));
    border-radius: 20px;
    scroll-snap-align: start;
    transition: transform 0.3s ease, opacity 0.3s ease;
    opacity: 0.6;
    transform: scale(0.95);
  }
  
  .gallery-item.active {
    opacity: 1;
    transform: scale(1);
  }
  
  .item-content {
    height: 100%;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  
  .item-number {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 4px;
  }
  
  .item-title {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 700;
    color: #fff;
  }
  
  .gallery-indicators {
    display: flex;
    justify-content: center;
    gap: 8px;
    padding-top: 4px;
  }
  
  .indicator {
    width: 8px;
    height: 8px;
    padding: 0;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .indicator.active {
    width: 24px;
    border-radius: 4px;
    background: #6366f1;
  }
</style>
```

---

### 6. Scroll-Triggered Text

Text that reveals word by word on scroll:

```svelte
<script>
  import { onMount } from 'svelte';
  
  const sentence = "Design is not just what it looks like—design is how it works.";
  const words = sentence.split(' ');
  
  let revealedWords = $state(0);
  let containerRef;
  
  function handleScroll() {
    if (!containerRef) return;
    
    const rect = containerRef.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const visibleRatio = 1 - (rect.top / windowHeight);
    
    const targetWords = Math.floor(visibleRatio * words.length * 1.5);
    revealedWords = Math.min(Math.max(0, targetWords), words.length);
  }
  
  onMount(() => {
    handleScroll();
  });
</script>

<svelte:window onscroll={handleScroll} />

<div class="text-reveal-container" bind:this={containerRef}>
  <p class="reveal-text">
    {#each words as word, i}
      <span 
        class="reveal-word"
        class:revealed={i < revealedWords}
        style="--delay: {i * 30}ms"
      >{word}</span>{' '}
    {/each}
  </p>
  
  <div class="author">— Steve Jobs</div>
</div>

<style>
  .text-reveal-container {
    max-width: 480px;
    padding: 48px 40px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    text-align: center;
  }
  
  .reveal-text {
    margin: 0 0 24px;
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.6;
  }
  
  .reveal-word {
    display: inline-block;
    color: rgba(255, 255, 255, 0.15);
    transition: color 0.4s ease, transform 0.4s ease;
    transition-delay: var(--delay);
  }
  
  .reveal-word.revealed {
    color: #fff;
  }
  
  .author {
    font-size: 0.9rem;
    font-style: italic;
    color: rgba(255, 255, 255, 0.4);
  }
</style>
```

---

### 7. Scroll-Driven Timeline

Timeline that animates as you scroll:

```svelte
<script>
  let scrollProgress = $state(0);
  let containerRef;
  
  const events = [
    { year: '2020', title: 'Founded', desc: 'Started with a vision' },
    { year: '2021', title: 'First Product', desc: 'Launched our MVP' },
    { year: '2022', title: 'Series A', desc: 'Raised $10M funding' },
    { year: '2023', title: 'Global', desc: 'Expanded worldwide' },
    { year: '2024', title: 'Market Leader', desc: 'Reached #1 position' }
  ];
  
  function handleScroll() {
    if (!containerRef) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef;
    scrollProgress = scrollTop / (scrollHeight - clientHeight);
  }
</script>

<div 
  class="timeline-container"
  bind:this={containerRef}
  onscroll={handleScroll}
>
  <div class="timeline-track">
    <div 
      class="timeline-progress"
      style="height: {scrollProgress * 100}%"
    ></div>
  </div>
  
  <div class="timeline-content">
    {#each events as event, i}
      {@const threshold = i / (events.length - 1)}
      {@const isActive = scrollProgress >= threshold - 0.1}
      
      <div 
        class="timeline-event"
        class:active={isActive}
      >
        <div class="event-marker"></div>
        <div class="event-content">
          <span class="event-year">{event.year}</span>
          <h3 class="event-title">{event.title}</h3>
          <p class="event-desc">{event.desc}</p>
        </div>
      </div>
    {/each}
    
    <div class="timeline-spacer"></div>
  </div>
</div>

<style>
  .timeline-container {
    position: relative;
    max-width: 360px;
    height: 400px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    overflow-y: auto;
    scroll-behavior: smooth;
  }
  
  .timeline-track {
    position: absolute;
    left: 32px;
    top: 40px;
    bottom: 40px;
    width: 2px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 1px;
  }
  
  .timeline-progress {
    width: 100%;
    background: linear-gradient(to bottom, #6366f1, #ec4899);
    border-radius: 1px;
    transition: height 0.1s ease-out;
  }
  
  .timeline-content {
    padding: 40px 32px 40px 56px;
    display: flex;
    flex-direction: column;
    gap: 48px;
  }
  
  .timeline-event {
    position: relative;
    opacity: 0.4;
    transform: translateX(10px);
    transition: all 0.4s ease;
  }
  
  .timeline-event.active {
    opacity: 1;
    transform: translateX(0);
  }
  
  .event-marker {
    position: absolute;
    left: -32px;
    top: 4px;
    width: 12px;
    height: 12px;
    background: #0c0c0e;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transition: all 0.3s ease;
  }
  
  .timeline-event.active .event-marker {
    background: #6366f1;
    border-color: #6366f1;
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.5);
  }
  
  .event-year {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6366f1;
    margin-bottom: 4px;
  }
  
  .event-title {
    margin: 0 0 4px;
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
  }
  
  .event-desc {
    margin: 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .timeline-spacer {
    height: 100px;
  }
</style>
```

---

## Summary

This collection demonstrates scroll-aware animations:

1. **Parallax Cards** — Multi-layer depth on scroll
2. **Fade Reveal Grid** — Intersection observer triggers
3. **Number Counter** — Animated counting on visibility
4. **Scroll Progress** — Reading progress indicator
5. **Horizontal Gallery** — Snap scroll with indicators
6. **Text Reveal** — Word-by-word visibility
7. **Scroll Timeline** — Progress-driven timeline

---

*Let the journey be part of the experience. Scroll-driven motion creates discovery.*
