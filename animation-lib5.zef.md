# Interactive Animation Library V ◈

**Delight & Wonder** — Unexpected joy in every interaction.

---

## Introduction

This final collection explores delightful animations—the unexpected moments of joy that transform functional interfaces into memorable experiences. Confetti celebrations, playful reactions, and whimsical interactions that make users smile.

---

## Component Collection

Eight delightful animation components.

---

### 1. Confetti Celebration

Explosion of confetti on success:

```svelte
<script>
  let particles = $state([]);
  let isExploding = $state(false);
  
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#14b8a6'];
  
  function explode() {
    if (isExploding) return;
    isExploding = true;
    
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: 50 + (Math.random() - 0.5) * 20,
        y: 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        velocityX: (Math.random() - 0.5) * 15,
        velocityY: Math.random() * -15 - 5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 20
      });
    }
    
    particles = newParticles;
    
    let frame = 0;
    const animate = () => {
      frame++;
      particles = particles.map(p => ({
        ...p,
        x: p.x + p.velocityX * 0.5,
        y: p.y + p.velocityY * 0.5,
        velocityY: p.velocityY + 0.5,
        rotation: p.rotation + p.rotationSpeed
      })).filter(p => p.y < 150);
      
      if (frame < 100 && particles.length > 0) {
        requestAnimationFrame(animate);
      } else {
        particles = [];
        isExploding = false;
      }
    };
    
    requestAnimationFrame(animate);
  }
</script>

<div class="confetti-container">
  <div class="confetti-area">
    {#each particles as particle (particle.id)}
      <div 
        class="confetti-particle"
        style="
          left: {particle.x}%;
          top: {particle.y}%;
          width: {particle.size}px;
          height: {particle.size * 0.6}px;
          background: {particle.color};
          transform: rotate({particle.rotation}deg);
        "
      ></div>
    {/each}
  </div>
  
  <button class="celebrate-btn" onclick={explode}>
    <span class="btn-icon">🎉</span>
    <span class="btn-text">Celebrate!</span>
  </button>
</div>

<style>
  .confetti-container {
    position: relative;
    max-width: 320px;
    padding: 80px 40px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    display: flex;
    justify-content: center;
  }
  
  .confetti-area {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }
  
  .confetti-particle {
    position: absolute;
    border-radius: 2px;
  }
  
  .celebrate-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 32px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 1;
  }
  
  .celebrate-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 32px rgba(99, 102, 241, 0.4);
  }
  
  .celebrate-btn:active {
    transform: scale(0.98);
  }
  
  .btn-icon {
    font-size: 1.3rem;
  }
  
  .btn-text {
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }
</style>
```

---

### 2. Heart Burst

Like button with heart explosion:

```svelte
<script>
  let isLiked = $state(false);
  let hearts = $state([]);
  let heartId = 0;
  
  function toggleLike() {
    isLiked = !isLiked;
    
    if (isLiked) {
      const newHearts = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        newHearts.push({
          id: heartId++,
          angle,
          distance: Math.random() * 30 + 20
        });
      }
      hearts = newHearts;
      
      setTimeout(() => {
        hearts = [];
      }, 600);
    }
  }
</script>

<div class="heart-container">
  <button 
    class="heart-button"
    class:liked={isLiked}
    onclick={toggleLike}
  >
    <span class="heart-icon">
      {#if isLiked}♥{:else}♡{/if}
    </span>
    
    {#each hearts as heart (heart.id)}
      <span 
        class="burst-heart"
        style="
          --angle: {heart.angle}rad;
          --distance: {heart.distance}px;
        "
      >♥</span>
    {/each}
  </button>
  
  <span class="like-count">{isLiked ? '1,247' : '1,246'}</span>
</div>

<style>
  .heart-container {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 32px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
  }
  
  .heart-button {
    position: relative;
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .heart-button:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
  }
  
  .heart-button.liked {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.3);
  }
  
  .heart-icon {
    font-size: 1.5rem;
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.2s ease;
  }
  
  .heart-button.liked .heart-icon {
    color: #ef4444;
    animation: heartPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  @keyframes heartPop {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
  
  .burst-heart {
    position: absolute;
    top: 50%;
    left: 50%;
    font-size: 0.8rem;
    color: #ef4444;
    opacity: 0;
    animation: burstOut 0.6s ease-out forwards;
  }
  
  @keyframes burstOut {
    0% {
      opacity: 1;
      transform: translate(-50%, -50%) translateX(0) translateY(0) scale(0.5);
    }
    100% {
      opacity: 0;
      transform: 
        translate(-50%, -50%) 
        translateX(calc(cos(var(--angle)) * var(--distance))) 
        translateY(calc(sin(var(--angle)) * var(--distance)))
        scale(1);
    }
  }
  
  .like-count {
    font-size: 0.95rem;
    font-weight: 600;
    color: #fff;
  }
</style>
```

---

### 3. Emoji Reaction

Floating emoji reaction picker:

```svelte
<script>
  let isOpen = $state(false);
  let selectedReaction = $state(null);
  let floatingEmojis = $state([]);
  let emojiId = 0;
  
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '🎉'];
  
  function selectReaction(emoji) {
    selectedReaction = emoji;
    isOpen = false;
    
    // Float up animation
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        floatingEmojis = [...floatingEmojis, {
          id: emojiId++,
          emoji,
          x: 50 + (Math.random() - 0.5) * 60,
          delay: i * 100
        }];
      }, i * 100);
    }
    
    setTimeout(() => {
      floatingEmojis = [];
    }, 2000);
  }
</script>

<div class="reaction-container">
  <div class="floating-area">
    {#each floatingEmojis as float (float.id)}
      <span 
        class="floating-emoji"
        style="left: {float.x}%"
      >{float.emoji}</span>
    {/each}
  </div>
  
  <div class="reaction-wrapper">
    <button 
      class="reaction-trigger"
      onclick={() => isOpen = !isOpen}
    >
      <span class="trigger-emoji">{selectedReaction || '😊'}</span>
      <span class="trigger-text">{selectedReaction ? 'React' : 'Add Reaction'}</span>
    </button>
    
    {#if isOpen}
      <div class="reaction-picker">
        {#each reactions as emoji, i}
          <button 
            class="emoji-option"
            style="--delay: {i * 30}ms"
            onclick={() => selectReaction(emoji)}
          >
            {emoji}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .reaction-container {
    position: relative;
    max-width: 280px;
    height: 200px;
    padding: 32px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  
  .floating-area {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }
  
  .floating-emoji {
    position: absolute;
    bottom: 100px;
    font-size: 1.5rem;
    animation: floatUp 1.5s ease-out forwards;
  }
  
  @keyframes floatUp {
    0% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-150px) scale(0.5);
    }
  }
  
  .reaction-wrapper {
    position: relative;
  }
  
  .reaction-trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 30px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .reaction-trigger:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.02);
  }
  
  .trigger-emoji {
    font-size: 1.3rem;
  }
  
  .trigger-text {
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
  }
  
  .reaction-picker {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 4px;
    padding: 8px 12px;
    background: #111113;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 30px;
    margin-bottom: 12px;
    animation: popIn 0.2s ease;
  }
  
  @keyframes popIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(10px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0) scale(1);
    }
  }
  
  .emoji-option {
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    border-radius: 50%;
    font-size: 1.4rem;
    cursor: pointer;
    transition: all 0.2s ease;
    animation: popUp 0.3s ease backwards;
    animation-delay: var(--delay);
  }
  
  @keyframes popUp {
    from {
      opacity: 0;
      transform: scale(0) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  .emoji-option:hover {
    transform: scale(1.3);
    background: rgba(255, 255, 255, 0.1);
  }
</style>
```

---

### 4. Success Checkmark

Animated checkmark with circle draw:

```svelte
<script>
  let isComplete = $state(false);
  
  function toggleComplete() {
    isComplete = !isComplete;
  }
</script>

<div class="checkmark-demo">
  <button 
    class="complete-button"
    class:complete={isComplete}
    onclick={toggleComplete}
  >
    <svg class="checkmark-svg" viewBox="0 0 52 52">
      <circle 
        class="checkmark-circle"
        cx="26" 
        cy="26" 
        r="24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
      />
      <path 
        class="checkmark-check"
        fill="none"
        stroke="currentColor"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M14 27l8 8 16-16"
      />
    </svg>
  </button>
  
  <p class="status-text">
    {isComplete ? 'Task Complete!' : 'Click to complete'}
  </p>
</div>

<style>
  .checkmark-demo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 48px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
  }
  
  .complete-button {
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.03);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
    color: rgba(255, 255, 255, 0.3);
    padding: 16px;
  }
  
  .complete-button:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .complete-button.complete {
    background: rgba(34, 197, 94, 0.15);
    border-color: #22c55e;
    color: #22c55e;
  }
  
  .checkmark-svg {
    width: 100%;
    height: 100%;
  }
  
  .checkmark-circle {
    stroke-dasharray: 166;
    stroke-dashoffset: 166;
    transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .complete-button.complete .checkmark-circle {
    stroke-dashoffset: 0;
  }
  
  .checkmark-check {
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    transition: stroke-dashoffset 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s;
  }
  
  .complete-button.complete .checkmark-check {
    stroke-dashoffset: 0;
  }
  
  .status-text {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    transition: color 0.3s ease;
  }
</style>
```

---

### 5. Bouncing Notification

Playful notification badge animation:

```svelte
<script>
  let count = $state(0);
  let isBouncing = $state(false);
  
  function addNotification() {
    count++;
    isBouncing = true;
    setTimeout(() => isBouncing = false, 400);
  }
  
  function clearNotifications() {
    count = 0;
  }
</script>

<div class="notification-demo">
  <div class="icon-wrapper">
    <div class="bell-icon">
      <span class="bell">🔔</span>
    </div>
    
    {#if count > 0}
      <span class="badge" class:bouncing={isBouncing}>
        {count > 99 ? '99+' : count}
      </span>
    {/if}
  </div>
  
  <div class="demo-controls">
    <button class="control-btn add" onclick={addNotification}>
      Add Notification
    </button>
    <button class="control-btn clear" onclick={clearNotifications} disabled={count === 0}>
      Clear All
    </button>
  </div>
</div>

<style>
  .notification-demo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    padding: 48px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    max-width: 300px;
  }
  
  .icon-wrapper {
    position: relative;
  }
  
  .bell-icon {
    width: 72px;
    height: 72px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .bell {
    font-size: 2rem;
  }
  
  .badge {
    position: absolute;
    top: -8px;
    right: -8px;
    min-width: 24px;
    height: 24px;
    padding: 0 6px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  }
  
  .badge.bouncing {
    animation: bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  @keyframes bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.4); }
  }
  
  .demo-controls {
    display: flex;
    gap: 12px;
  }
  
  .control-btn {
    padding: 12px 20px;
    border: none;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .control-btn.add {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: #fff;
  }
  
  .control-btn.add:hover {
    transform: translateY(-1px);
  }
  
  .control-btn.clear {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
  
  .control-btn.clear:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .control-btn.clear:not(:disabled):hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
```

---

### 6. Typing Indicator

Chat typing indicator with bouncing dots:

```svelte
<script>
  let isTyping = $state(true);
</script>

<div class="chat-demo">
  <div class="message received">
    <span class="message-text">Hey! How are you?</span>
  </div>
  
  <div class="message sent">
    <span class="message-text">I'm doing great, thanks!</span>
  </div>
  
  {#if isTyping}
    <div class="typing-indicator">
      <div class="typing-avatar">S</div>
      <div class="typing-bubble">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>
  {/if}
  
  <button 
    class="toggle-typing"
    onclick={() => isTyping = !isTyping}
  >
    {isTyping ? 'Stop Typing' : 'Start Typing'}
  </button>
</div>

<style>
  .chat-demo {
    max-width: 320px;
    padding: 24px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .message {
    max-width: 80%;
    padding: 12px 16px;
    border-radius: 18px;
    font-size: 0.9rem;
  }
  
  .message.received {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    align-self: flex-start;
    border-bottom-left-radius: 4px;
  }
  
  .message.sent {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: #fff;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
  }
  
  .message-text {
    line-height: 1.4;
  }
  
  .typing-indicator {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    align-self: flex-start;
  }
  
  .typing-avatar {
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #ec4899, #db2777);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    color: #fff;
  }
  
  .typing-bubble {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 14px 18px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    border-bottom-left-radius: 4px;
  }
  
  .dot {
    width: 8px;
    height: 8px;
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
      transform: translateY(-6px);
      opacity: 1;
    }
  }
  
  .toggle-typing {
    align-self: center;
    margin-top: 12px;
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #fff;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .toggle-typing:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
```

---

### 7. Star Rating

Interactive star rating with shimmer:

```svelte
<script>
  let rating = $state(0);
  let hoverRating = $state(0);
  
  function setRating(value) {
    rating = value;
  }
</script>

<div class="rating-demo">
  <div class="stars-container">
    {#each [1, 2, 3, 4, 5] as star}
      <button
        class="star-btn"
        class:filled={star <= (hoverRating || rating)}
        class:active={star === rating}
        onmouseenter={() => hoverRating = star}
        onmouseleave={() => hoverRating = 0}
        onclick={() => setRating(star)}
      >
        <span class="star">★</span>
        <span class="shimmer"></span>
      </button>
    {/each}
  </div>
  
  <p class="rating-text">
    {#if rating === 0}
      Click to rate
    {:else if rating === 1}
      Poor
    {:else if rating === 2}
      Fair
    {:else if rating === 3}
      Good
    {:else if rating === 4}
      Great
    {:else}
      Excellent!
    {/if}
  </p>
</div>

<style>
  .rating-demo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 40px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
  }
  
  .stars-container {
    display: flex;
    gap: 8px;
  }
  
  .star-btn {
    position: relative;
    width: 48px;
    height: 48px;
    background: none;
    border: none;
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  
  .star-btn:hover {
    transform: scale(1.15);
  }
  
  .star {
    font-size: 2.5rem;
    color: rgba(255, 255, 255, 0.15);
    transition: color 0.2s ease, text-shadow 0.2s ease;
  }
  
  .star-btn.filled .star {
    color: #f59e0b;
    text-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
  }
  
  .star-btn.active .star {
    animation: starPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  @keyframes starPop {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
  
  .shimmer {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.4), transparent 60%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  
  .star-btn.active .shimmer {
    animation: shimmer 0.5s ease;
  }
  
  @keyframes shimmer {
    0% { opacity: 1; transform: scale(0.5); }
    100% { opacity: 0; transform: scale(2); }
  }
  
  .rating-text {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    min-height: 24px;
  }
</style>
```

---

### 8. Shake Error

Input with shake animation on error:

```svelte
<script>
  let email = $state('');
  let hasError = $state(false);
  let isShaking = $state(false);
  let errorMessage = $state('');
  
  function validateEmail() {
    const isValid = email.includes('@') && email.includes('.');
    
    if (!isValid && email.length > 0) {
      hasError = true;
      isShaking = true;
      errorMessage = 'Please enter a valid email';
      setTimeout(() => isShaking = false, 500);
    } else {
      hasError = false;
      errorMessage = '';
    }
  }
</script>

<div class="shake-demo">
  <div 
    class="input-wrapper"
    class:error={hasError}
    class:shaking={isShaking}
  >
    <input
      type="email"
      placeholder="Enter your email"
      bind:value={email}
      oninput={() => { hasError = false; errorMessage = ''; }}
    />
    
    {#if hasError}
      <span class="error-icon">!</span>
    {/if}
  </div>
  
  {#if errorMessage}
    <p class="error-message">{errorMessage}</p>
  {/if}
  
  <button class="validate-btn" onclick={validateEmail}>
    Submit
  </button>
</div>

<style>
  .shake-demo {
    max-width: 320px;
    padding: 32px;
    background: #0c0c0e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .input-wrapper input {
    width: 100%;
    padding: 16px 20px;
    padding-right: 48px;
    background: rgba(255, 255, 255, 0.03);
    border: 2px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    color: #fff;
    font-size: 0.95rem;
    outline: none;
    transition: all 0.2s ease;
  }
  
  .input-wrapper input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  .input-wrapper input:focus {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.05);
  }
  
  .input-wrapper.error input {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
  }
  
  .input-wrapper.shaking {
    animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
    20%, 40%, 60%, 80% { transform: translateX(8px); }
  }
  
  .error-icon {
    position: absolute;
    right: 16px;
    width: 24px;
    height: 24px;
    background: #ef4444;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    color: #fff;
    animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  @keyframes popIn {
    from { transform: scale(0); }
    to { transform: scale(1); }
  }
  
  .error-message {
    margin: 0;
    font-size: 0.8rem;
    color: #ef4444;
    animation: slideIn 0.3s ease;
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .validate-btn {
    padding: 14px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    border-radius: 12px;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .validate-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
  }
</style>
```

---

## Summary

This collection demonstrates delightful animations:

1. **Confetti Celebration** — Particle explosion on success
2. **Heart Burst** — Like button with radiating hearts
3. **Emoji Reaction** — Floating reaction picker
4. **Success Checkmark** — Animated SVG check with circle draw
5. **Bouncing Notification** — Playful badge animation
6. **Typing Indicator** — Chat dots with wave motion
7. **Star Rating** — Interactive rating with shimmer
8. **Shake Error** — Error feedback with shake animation

---

*Delight is the unexpected gift. Sprinkle moments of joy throughout your interface.*

---

## Collection Complete ◈

This concludes the Interactive Animation Libraries—a comprehensive showcase of motion design principles:

- **Fluid Motion** — Physics-based, spring animations
- **Scroll & Reveal** — Scroll-driven, progressive disclosure
- **Hover & Focus** — Responsive micro-interactions
- **State Transitions** — Seamless state morphing
- **Delight & Wonder** — Celebratory, playful moments

*Motion is not decoration—it's communication. Use it wisely, use it well.*
