# Dark Component Library III ◈

**Immersive Interactions** — Depth. Motion. Presence.

---

## Philosophy

This third collection explores components that create spatial awareness and emotional resonance. From cards that respond to cursor movement to visualizations that tell stories, these patterns blur the line between interface and experience.

---

## Component Collection

Eight immersive components showcasing depth, motion, and tactile interactions.

---

### 1. 3D Tilt Card

A card that responds to cursor position with perspective transforms:

```svelte
<script>
  let cardRef = $state(null);
  let transform = $state("rotateX(0deg) rotateY(0deg)");
  let glarePosition = $state({ x: 50, y: 50 });
  let isHovering = $state(false);
  
  function handleMouseMove(e) {
    if (!cardRef) return;
    
    const rect = cardRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    
    transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    glarePosition = {
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100
    };
  }
  
  function handleMouseLeave() {
    transform = "rotateX(0deg) rotateY(0deg)";
    isHovering = false;
  }
</script>

<div class="tilt-wrapper">
  <div 
    class="tilt-card"
    bind:this={cardRef}
    onmousemove={handleMouseMove}
    onmouseenter={() => isHovering = true}
    onmouseleave={handleMouseLeave}
    style="transform: perspective(1000px) {transform}"
  >
    <div 
      class="glare"
      class:visible={isHovering}
      style="background: radial-gradient(circle at {glarePosition.x}% {glarePosition.y}%, rgba(255,255,255,0.15) 0%, transparent 60%)"
    ></div>
    
    <div class="card-content">
      <div class="card-icon">◆</div>
      <h3 class="card-title">Premium Access</h3>
      <p class="card-desc">Unlock all features and get priority support with our premium tier.</p>
      <div class="card-price">
        <span class="currency">$</span>
        <span class="amount">29</span>
        <span class="period">/mo</span>
      </div>
      <button class="card-cta">Get Started</button>
    </div>
  </div>
</div>

<style>
  .tilt-wrapper {
    perspective: 1000px;
    padding: 40px;
  }
  
  .tilt-card {
    position: relative;
    width: 300px;
    background: linear-gradient(145deg, #111113 0%, #09090b 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    overflow: hidden;
    transition: transform 0.1s ease-out, box-shadow 0.3s;
    transform-style: preserve-3d;
  }
  
  .tilt-card:hover {
    box-shadow: 
      0 30px 60px rgba(0, 0, 0, 0.5),
      0 0 1px rgba(255, 255, 255, 0.1);
  }
  
  .glare {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
    z-index: 1;
  }
  .glare.visible {
    opacity: 1;
  }
  
  .card-content {
    position: relative;
    padding: 36px;
    z-index: 2;
  }
  
  .card-icon {
    font-size: 32px;
    color: #3b82f6;
    margin-bottom: 20px;
  }
  
  .card-title {
    margin: 0 0 12px;
    font-size: 22px;
    font-weight: 600;
    color: #fafafa;
  }
  
  .card-desc {
    margin: 0 0 24px;
    font-size: 14px;
    line-height: 1.6;
    color: #71717a;
  }
  
  .card-price {
    display: flex;
    align-items: baseline;
    gap: 2px;
    margin-bottom: 28px;
  }
  
  .currency {
    font-size: 18px;
    color: #52525b;
    font-weight: 500;
  }
  
  .amount {
    font-size: 48px;
    font-weight: 200;
    color: #fafafa;
    letter-spacing: -0.02em;
  }
  
  .period {
    font-size: 14px;
    color: #52525b;
  }
  
  .card-cta {
    width: 100%;
    padding: 14px 24px;
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }
  .card-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
  }
</style>
```

---

### 2. Segmented Control

A pill-shaped toggle with sliding indicator:

```svelte
<script>
  let options = $state(["Day", "Week", "Month", "Year"]);
  let activeIndex = $state(1);
  
  let indicatorStyle = $derived(() => {
    const width = 100 / options.length;
    return `width: ${width}%; left: ${activeIndex * width}%`;
  });
</script>

<div class="segmented-control">
  <div class="indicator" style={indicatorStyle()}></div>
  {#each options as option, i}
    <button 
      class="segment"
      class:active={activeIndex === i}
      onclick={() => activeIndex = i}
    >
      {option}
    </button>
  {/each}
</div>

<style>
  .segmented-control {
    position: relative;
    display: inline-flex;
    background: #0f0f11;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    padding: 5px;
  }
  
  .indicator {
    position: absolute;
    top: 5px;
    bottom: 5px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 0;
  }
  
  .segment {
    position: relative;
    z-index: 1;
    padding: 12px 24px;
    background: none;
    border: none;
    font-size: 14px;
    font-weight: 500;
    color: #52525b;
    cursor: pointer;
    transition: color 0.2s;
  }
  
  .segment:hover {
    color: #a1a1aa;
  }
  
  .segment.active {
    color: #fafafa;
  }
</style>
```

---

### 3. Animated Counter

A number display that animates between values:

```svelte
<script>
  let targetValue = $state(12847);
  let displayValue = $state(0);
  let isAnimating = $state(false);
  
  function animateValue(target) {
    const start = displayValue;
    const diff = target - start;
    const duration = 1500;
    const startTime = performance.now();
    isAnimating = true;
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 4);
      displayValue = Math.round(start + diff * eased);
      
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        isAnimating = false;
      }
    }
    
    requestAnimationFrame(update);
  }
  
  function formatNumber(n) {
    return n.toLocaleString();
  }
  
  function randomize() {
    animateValue(Math.floor(Math.random() * 50000) + 1000);
  }
  
  // Initialize
  $effect(() => {
    animateValue(targetValue);
  });
</script>

<div class="counter-display">
  <div class="counter-label">Total Users</div>
  <div class="counter-value" class:animating={isAnimating}>
    {formatNumber(displayValue)}
  </div>
  <button class="counter-action" onclick={randomize}>
    ↻ Refresh
  </button>
</div>

<style>
  .counter-display {
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    padding: 32px 48px;
    text-align: center;
  }
  
  .counter-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #52525b;
    margin-bottom: 12px;
  }
  
  .counter-value {
    font-size: 56px;
    font-weight: 200;
    font-family: 'SF Mono', monospace;
    color: #fafafa;
    letter-spacing: -0.02em;
    margin-bottom: 20px;
    transition: color 0.2s;
  }
  
  .counter-value.animating {
    color: #3b82f6;
  }
  
  .counter-action {
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    color: #71717a;
    cursor: pointer;
    transition: all 0.2s;
  }
  .counter-action:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fafafa;
  }
</style>
```

---

### 4. Expandable FAQs

Accordion-style FAQs with smooth height animation:

```svelte
<script>
  let faqs = $state([
    {
      id: 1,
      question: "How do I get started?",
      answer: "Getting started is simple. Create an account, complete your profile, and you're ready to dive in. Our onboarding wizard will guide you through the essential features.",
      open: false
    },
    {
      id: 2,
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and bank transfers for annual plans. All payments are processed securely through Stripe.",
      open: true
    },
    {
      id: 3,
      question: "Can I cancel my subscription?",
      answer: "Yes, you can cancel anytime from your account settings. If you cancel, you'll retain access until the end of your current billing period. No hidden fees or penalties.",
      open: false
    },
    {
      id: 4,
      question: "Is there a free trial?",
      answer: "Absolutely! We offer a 14-day free trial with full access to all features. No credit card required to start your trial.",
      open: false
    }
  ]);
  
  function toggle(id) {
    faqs = faqs.map(f => ({
      ...f,
      open: f.id === id ? !f.open : f.open
    }));
  }
</script>

<div class="faq-container">
  <h2 class="faq-heading">Frequently Asked Questions</h2>
  
  <div class="faq-list">
    {#each faqs as faq}
      <div class="faq-item" class:open={faq.open}>
        <button class="faq-question" onclick={() => toggle(faq.id)}>
          <span class="question-text">{faq.question}</span>
          <span class="question-icon">{faq.open ? '−' : '+'}</span>
        </button>
        <div class="faq-answer">
          <div class="answer-inner">
            <p>{faq.answer}</p>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .faq-container {
    max-width: 600px;
  }
  
  .faq-heading {
    font-size: 24px;
    font-weight: 600;
    color: #fafafa;
    margin: 0 0 28px;
  }
  
  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .faq-item {
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    overflow: hidden;
    transition: border-color 0.2s;
  }
  
  .faq-item:hover {
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .faq-item.open {
    border-color: rgba(59, 130, 246, 0.3);
  }
  
  .faq-question {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 20px 24px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
  }
  
  .question-text {
    font-size: 15px;
    font-weight: 500;
    color: #fafafa;
    flex: 1;
    padding-right: 16px;
  }
  
  .question-icon {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 8px;
    font-size: 18px;
    font-weight: 300;
    color: #71717a;
    transition: all 0.2s;
  }
  
  .faq-item.open .question-icon {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
  }
  
  .faq-answer {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .faq-item.open .faq-answer {
    grid-template-rows: 1fr;
  }
  
  .answer-inner {
    overflow: hidden;
  }
  
  .answer-inner p {
    margin: 0;
    padding: 0 24px 20px;
    font-size: 14px;
    line-height: 1.7;
    color: #a1a1aa;
  }
</style>
```

---

### 5. Color Palette Picker

An interactive color palette with copy-to-clipboard:

```svelte
<script>
  let palettes = $state([
    { name: "Ocean", colors: ["#0ea5e9", "#0284c7", "#0369a1", "#075985", "#0c4a6e"] },
    { name: "Sunset", colors: ["#fbbf24", "#f59e0b", "#d97706", "#b45309", "#92400e"] },
    { name: "Forest", colors: ["#34d399", "#10b981", "#059669", "#047857", "#065f46"] },
    { name: "Berry", colors: ["#f472b6", "#ec4899", "#db2777", "#be185d", "#9d174d"] }
  ]);
  
  let activePalette = $state(0);
  let copiedColor = $state(null);
  
  function copyColor(color) {
    navigator.clipboard.writeText(color);
    copiedColor = color;
    setTimeout(() => copiedColor = null, 2000);
  }
</script>

<div class="palette-picker">
  <div class="palette-tabs">
    {#each palettes as palette, i}
      <button 
        class="palette-tab"
        class:active={activePalette === i}
        onclick={() => activePalette = i}
      >
        <span 
          class="tab-preview"
          style="background: linear-gradient(135deg, {palette.colors[0]} 0%, {palette.colors[2]} 100%)"
        ></span>
        <span class="tab-name">{palette.name}</span>
      </button>
    {/each}
  </div>
  
  <div class="color-grid">
    {#each palettes[activePalette].colors as color, i}
      <button 
        class="color-swatch"
        style="background: {color}; animation-delay: {i * 50}ms"
        onclick={() => copyColor(color)}
        title={color}
      >
        <span class="swatch-overlay">
          {#if copiedColor === color}
            <span class="copied-check">✓</span>
          {:else}
            <span class="copy-icon">⧉</span>
          {/if}
        </span>
        <span class="color-code">{color}</span>
      </button>
    {/each}
  </div>
  
  {#if copiedColor}
    <div class="toast">
      <span class="toast-color" style="background: {copiedColor}"></span>
      Copied {copiedColor}
    </div>
  {/if}
</div>

<style>
  .palette-picker {
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    padding: 24px;
    max-width: 420px;
  }
  
  .palette-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }
  
  .palette-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 14px 12px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .palette-tab:hover {
    background: rgba(255, 255, 255, 0.04);
  }
  
  .palette-tab.active {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .tab-preview {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .tab-name {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #71717a;
  }
  .palette-tab.active .tab-name {
    color: #fafafa;
  }
  
  .color-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
  }
  
  .color-swatch {
    aspect-ratio: 1;
    border: none;
    border-radius: 14px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    animation: swatchIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) backwards;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  @keyframes swatchIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .color-swatch:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
  
  .swatch-overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .color-swatch:hover .swatch-overlay {
    opacity: 1;
  }
  
  .copy-icon, .copied-check {
    font-size: 18px;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
  
  .color-code {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 8px 4px;
    font-size: 9px;
    font-family: 'SF Mono', monospace;
    font-weight: 600;
    text-transform: uppercase;
    color: white;
    text-align: center;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
    opacity: 0;
    transform: translateY(4px);
    transition: all 0.2s;
  }
  
  .color-swatch:hover .color-code {
    opacity: 1;
    transform: translateY(0);
  }
  
  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 18px;
    background: #18181b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    font-size: 13px;
    color: #fafafa;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    animation: toastIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes toastIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  .toast-color {
    width: 16px;
    height: 16px;
    border-radius: 4px;
  }
</style>
```

---

### 6. Image Gallery Grid

A masonry-style gallery with lightbox preview:

```svelte
<script>
  let images = $state([
    { id: 1, src: "https://picsum.photos/400/300?random=1", alt: "Nature", span: "wide" },
    { id: 2, src: "https://picsum.photos/300/400?random=2", alt: "Portrait", span: "tall" },
    { id: 3, src: "https://picsum.photos/300/300?random=3", alt: "Square", span: "normal" },
    { id: 4, src: "https://picsum.photos/300/300?random=4", alt: "Abstract", span: "normal" },
    { id: 5, src: "https://picsum.photos/400/300?random=5", alt: "Landscape", span: "wide" },
    { id: 6, src: "https://picsum.photos/300/300?random=6", alt: "Urban", span: "normal" }
  ]);
  
  let selectedImage = $state(null);
  
  function openLightbox(image) {
    selectedImage = image;
  }
  
  function closeLightbox() {
    selectedImage = null;
  }
</script>

<div class="gallery-container">
  <div class="gallery-grid">
    {#each images as image}
      <button 
        class="gallery-item {image.span}"
        onclick={() => openLightbox(image)}
      >
        <img src={image.src} alt={image.alt} loading="lazy" />
        <div class="item-overlay">
          <span class="zoom-icon">⊕</span>
        </div>
      </button>
    {/each}
  </div>
</div>

{#if selectedImage}
  <div class="lightbox" onclick={closeLightbox}>
    <div class="lightbox-content" onclick={(e) => e.stopPropagation()}>
      <img src={selectedImage.src} alt={selectedImage.alt} />
      <button class="close-btn" onclick={closeLightbox}>×</button>
    </div>
  </div>
{/if}

<style>
  .gallery-container {
    padding: 20px;
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
  }
  
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: 140px;
    gap: 12px;
  }
  
  .gallery-item {
    position: relative;
    border: none;
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    padding: 0;
    background: #18181b;
  }
  
  .gallery-item.wide {
    grid-column: span 2;
  }
  
  .gallery-item.tall {
    grid-row: span 2;
  }
  
  .gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .gallery-item:hover img {
    transform: scale(1.1);
  }
  
  .item-overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.4);
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  .gallery-item:hover .item-overlay {
    opacity: 1;
  }
  
  .zoom-icon {
    font-size: 28px;
    color: white;
    transform: scale(0.8);
    transition: transform 0.3s;
  }
  
  .gallery-item:hover .zoom-icon {
    transform: scale(1);
  }
  
  .lightbox {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: grid;
    place-items: center;
    z-index: 1000;
    animation: fadeIn 0.2s;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .lightbox-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    animation: zoomIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes zoomIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .lightbox-content img {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 12px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
  }
  
  .close-btn {
    position: absolute;
    top: -48px;
    right: 0;
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    font-size: 24px;
    color: white;
    cursor: pointer;
    transition: background 0.2s;
  }
  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
```

---

### 7. Rating Stars

An interactive star rating with half-star precision:

```svelte
<script>
  let rating = $state(3.5);
  let hoverRating = $state(null);
  let isHovering = $state(false);
  
  let displayRating = $derived(isHovering && hoverRating !== null ? hoverRating : rating);
  
  function setRating(value) {
    rating = value;
  }
  
  function handleMouseMove(e, index) {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = x < rect.width / 2;
    hoverRating = half ? index + 0.5 : index + 1;
  }
  
  function getStarFill(index) {
    const value = displayRating;
    if (value >= index + 1) return "full";
    if (value >= index + 0.5) return "half";
    return "empty";
  }
</script>

<div class="rating-container">
  <div class="rating-label">Rate your experience</div>
  
  <div 
    class="stars"
    onmouseenter={() => isHovering = true}
    onmouseleave={() => { isHovering = false; hoverRating = null; }}
  >
    {#each [0, 1, 2, 3, 4] as index}
      <button 
        class="star"
        onmousemove={(e) => handleMouseMove(e, index)}
        onclick={() => setRating(hoverRating || rating)}
      >
        <svg viewBox="0 0 24 24" class="star-svg">
          <defs>
            <linearGradient id="half-{index}">
              <stop offset="50%" stop-color="#fbbf24" />
              <stop offset="50%" stop-color="#27272a" />
            </linearGradient>
          </defs>
          <path 
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={
              getStarFill(index) === 'full' ? '#fbbf24' :
              getStarFill(index) === 'half' ? `url(#half-${index})` :
              '#27272a'
            }
            stroke={getStarFill(index) !== 'empty' ? '#fbbf24' : '#3f3f46'}
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    {/each}
  </div>
  
  <div class="rating-value">
    <span class="value-number">{displayRating.toFixed(1)}</span>
    <span class="value-max">/ 5</span>
  </div>
  
  <div class="rating-text">
    {#if displayRating >= 4.5}
      Excellent!
    {:else if displayRating >= 3.5}
      Great
    {:else if displayRating >= 2.5}
      Good
    {:else if displayRating >= 1.5}
      Fair
    {:else}
      Poor
    {/if}
  </div>
</div>

<style>
  .rating-container {
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    padding: 32px;
    text-align: center;
    max-width: 280px;
  }
  
  .rating-label {
    font-size: 14px;
    color: #71717a;
    margin-bottom: 20px;
  }
  
  .stars {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
  }
  
  .star {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: transform 0.15s;
  }
  
  .star:hover {
    transform: scale(1.15);
  }
  
  .star-svg {
    width: 36px;
    height: 36px;
    transition: all 0.15s;
  }
  
  .rating-value {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 4px;
    margin-bottom: 8px;
  }
  
  .value-number {
    font-size: 32px;
    font-weight: 200;
    color: #fafafa;
    font-family: 'SF Mono', monospace;
  }
  
  .value-max {
    font-size: 16px;
    color: #52525b;
  }
  
  .rating-text {
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #fbbf24;
  }
</style>
```

---

### 8. Draggable List

A sortable list with drag-and-drop reordering:

```svelte
<script>
  let items = $state([
    { id: 1, title: "Design mockups", priority: "high" },
    { id: 2, title: "Write documentation", priority: "medium" },
    { id: 3, title: "Code review", priority: "high" },
    { id: 4, title: "Update dependencies", priority: "low" },
    { id: 5, title: "Deploy to staging", priority: "medium" }
  ]);
  
  let draggedIndex = $state(null);
  let dragOverIndex = $state(null);
  
  const priorityColors = {
    high: "#ef4444",
    medium: "#f59e0b",
    low: "#22c55e"
  };
  
  function handleDragStart(index) {
    draggedIndex = index;
  }
  
  function handleDragOver(e, index) {
    e.preventDefault();
    dragOverIndex = index;
  }
  
  function handleDrop(index) {
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, removed);
    
    items = newItems;
    draggedIndex = null;
    dragOverIndex = null;
  }
  
  function handleDragEnd() {
    draggedIndex = null;
    dragOverIndex = null;
  }
</script>

<div class="sortable-list">
  <div class="list-header">
    <span class="header-title">Tasks</span>
    <span class="header-count">{items.length} items</span>
  </div>
  
  <div class="list-items">
    {#each items as item, index}
      <div 
        class="list-item"
        class:dragging={draggedIndex === index}
        class:drag-over={dragOverIndex === index && draggedIndex !== index}
        draggable="true"
        ondragstart={() => handleDragStart(index)}
        ondragover={(e) => handleDragOver(e, index)}
        ondrop={() => handleDrop(index)}
        ondragend={handleDragEnd}
      >
        <div class="drag-handle">
          <span class="handle-dots">⋮⋮</span>
        </div>
        <span 
          class="priority-dot"
          style="background: {priorityColors[item.priority]}"
          title={item.priority}
        ></span>
        <span class="item-title">{item.title}</span>
        <span class="item-index">{index + 1}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .sortable-list {
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    overflow: hidden;
    max-width: 400px;
  }
  
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }
  
  .header-title {
    font-size: 15px;
    font-weight: 600;
    color: #fafafa;
  }
  
  .header-count {
    font-size: 12px;
    color: #52525b;
  }
  
  .list-items {
    padding: 8px;
  }
  
  .list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid transparent;
    border-radius: 12px;
    margin-bottom: 6px;
    cursor: grab;
    transition: all 0.2s;
  }
  
  .list-item:last-child {
    margin-bottom: 0;
  }
  
  .list-item:hover {
    background: rgba(255, 255, 255, 0.04);
  }
  
  .list-item.dragging {
    opacity: 0.5;
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
  }
  
  .list-item.drag-over {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    transform: scale(1.02);
  }
  
  .drag-handle {
    color: #3f3f46;
    cursor: grab;
    padding: 4px;
  }
  
  .handle-dots {
    font-size: 14px;
    letter-spacing: -0.2em;
  }
  
  .list-item:hover .drag-handle {
    color: #71717a;
  }
  
  .priority-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  
  .item-title {
    flex: 1;
    font-size: 14px;
    color: #e4e4e7;
  }
  
  .item-index {
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    color: #52525b;
    font-family: 'SF Mono', monospace;
  }
</style>
```

---

## Motion Guidelines

### Timing
- **Micro**: 100-150ms for hovers, toggles
- **Standard**: 200-300ms for reveals, transitions
- **Expressive**: 400-600ms for entrances, celebrations

### Easing
- **Ease-out** `(0.4, 0, 0.2, 1)`: Most UI transitions
- **Ease-in-out** `(0.4, 0, 0.4, 1)`: Symmetric animations
- **Spring** `(0.175, 0.885, 0.32, 1.275)`: Playful overshoots

### Principles
1. Motion should feel natural, not mechanical
2. Avoid animation for animation's sake
3. Faster for frequent actions, slower for orientation
4. Respect user preferences (`prefers-reduced-motion`)

---

> *"Motion can evoke emotions, communicate meaning, and strengthen a user's connection to an interface."*

---

*Built with Zef ◈*
