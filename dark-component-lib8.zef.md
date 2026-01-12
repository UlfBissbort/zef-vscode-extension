# Dark Component Library VIII ◈

**Cards & Containers** — Frame. Elevate. Contain.

---

## Introduction

Cards are the building blocks of modern interfaces—containers that group, organize, and elevate content. This collection explores diverse card patterns from marketing to e-commerce, each crafted with depth, shadow, and purposeful hierarchy.

---

## Component Collection

Six card and container components for content presentation.

---

### 1. Feature Highlight Card

A product feature card with icon, gradient accent, and hover reveal:

```svelte
<script>
  let features = $state([
    { 
      id: 1,
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Optimized for speed with sub-100ms response times and instant feedback.',
      gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)'
    },
    { 
      id: 2,
      icon: '🛡',
      title: 'Secure by Default',
      description: 'End-to-end encryption and zero-knowledge architecture protect your data.',
      gradient: 'linear-gradient(135deg, #22c55e, #14b8a6)'
    },
    { 
      id: 3,
      icon: '◎',
      title: 'Beautifully Minimal',
      description: 'Clean interfaces that focus on what matters. No clutter, no distractions.',
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
    }
  ]);
</script>

<div class="features-grid">
  {#each features as feature}
    <div class="feature-card">
      <div class="card-glow" style="background: {feature.gradient}"></div>
      <div class="card-content">
        <div class="icon-wrapper" style="background: {feature.gradient}">
          <span class="feature-icon">{feature.icon}</span>
        </div>
        <h3 class="feature-title">{feature.title}</h3>
        <p class="feature-description">{feature.description}</p>
        <button class="learn-more">
          Learn more <span class="arrow">→</span>
        </button>
      </div>
    </div>
  {/each}
</div>

<style>
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 20px;
  }
  
  .feature-card {
    position: relative;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .feature-card:hover {
    transform: translateY(-4px);
    border-color: rgba(255,255,255,0.12);
  }
  
  .card-glow {
    position: absolute;
    top: -50%;
    left: -50%;
    right: -50%;
    height: 200%;
    opacity: 0;
    filter: blur(60px);
    transition: opacity 0.4s ease;
    pointer-events: none;
  }
  
  .feature-card:hover .card-glow {
    opacity: 0.15;
  }
  
  .card-content {
    position: relative;
    padding: 32px;
    z-index: 1;
  }
  
  .icon-wrapper {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    margin-bottom: 20px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }
  
  .feature-icon {
    font-size: 1.5rem;
    filter: grayscale(1) brightness(10);
  }
  
  .feature-title {
    margin: 0 0 12px;
    font-size: 1.15rem;
    font-weight: 600;
    color: #fff;
  }
  
  .feature-description {
    margin: 0 0 20px;
    font-size: 0.875rem;
    color: rgba(255,255,255,0.5);
    line-height: 1.6;
  }
  
  .learn-more {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.6);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    transition: color 0.2s ease;
  }
  
  .learn-more:hover {
    color: #fff;
  }
  
  .arrow {
    transition: transform 0.2s ease;
  }
  
  .learn-more:hover .arrow {
    transform: translateX(4px);
  }
</style>
```

---

### 2. Pricing Card

A pricing tier card with popular badge and feature list:

```svelte
<script>
  let isAnnual = $state(true);
  
  let plan = $state({
    name: 'Pro',
    popular: true,
    monthlyPrice: 29,
    annualPrice: 24,
    description: 'For growing teams and businesses',
    features: [
      { text: 'Unlimited projects', included: true },
      { text: 'Priority support', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'API access', included: true },
      { text: 'White-label', included: false }
    ]
  });
  
  let currentPrice = $derived(isAnnual ? plan.annualPrice : plan.monthlyPrice);
</script>

<div class="pricing-demo">
  <div class="billing-toggle">
    <span class:active={!isAnnual}>Monthly</span>
    <button class="toggle" onclick={() => isAnnual = !isAnnual}>
      <div class="toggle-thumb" class:annual={isAnnual}></div>
    </button>
    <span class:active={isAnnual}>Annual <span class="save-badge">Save 17%</span></span>
  </div>
  
  <div class="pricing-card" class:popular={plan.popular}>
    {#if plan.popular}
      <div class="popular-badge">Most Popular</div>
    {/if}
    
    <div class="plan-header">
      <h3 class="plan-name">{plan.name}</h3>
      <p class="plan-desc">{plan.description}</p>
    </div>
    
    <div class="price-display">
      <span class="currency">$</span>
      <span class="amount">{currentPrice}</span>
      <span class="period">/month</span>
    </div>
    
    <button class="subscribe-btn">Get Started</button>
    
    <ul class="features-list">
      {#each plan.features as feature}
        <li class:included={feature.included}>
          <span class="check-icon">{feature.included ? '✓' : '×'}</span>
          <span class="feature-text">{feature.text}</span>
        </li>
      {/each}
    </ul>
  </div>
</div>

<style>
  .pricing-demo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
  
  .billing-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.5);
  }
  
  .billing-toggle span.active {
    color: #fff;
    font-weight: 500;
  }
  
  .save-badge {
    display: inline-block;
    padding: 2px 8px;
    background: rgba(34, 197, 94, 0.15);
    border-radius: 10px;
    font-size: 0.7rem;
    color: #4ade80;
    font-weight: 600;
    margin-left: 4px;
  }
  
  .toggle {
    width: 44px;
    height: 24px;
    background: rgba(255,255,255,0.1);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    padding: 2px;
  }
  
  .toggle-thumb {
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: 10px;
    transition: transform 0.2s ease;
  }
  
  .toggle-thumb.annual {
    transform: translateX(20px);
  }
  
  .pricing-card {
    width: 320px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px;
    padding: 32px;
    position: relative;
    overflow: hidden;
  }
  
  .pricing-card.popular {
    border-color: #6366f1;
    box-shadow: 0 0 40px rgba(99, 102, 241, 0.15);
  }
  
  .popular-badge {
    position: absolute;
    top: 16px;
    right: -32px;
    background: #6366f1;
    color: #fff;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 6px 40px;
    transform: rotate(45deg);
  }
  
  .plan-header {
    margin-bottom: 24px;
  }
  
  .plan-name {
    margin: 0 0 4px;
    font-size: 1.25rem;
    font-weight: 600;
    color: #fff;
  }
  
  .plan-desc {
    margin: 0;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.5);
  }
  
  .price-display {
    display: flex;
    align-items: baseline;
    gap: 2px;
    margin-bottom: 24px;
  }
  
  .currency {
    font-size: 1.25rem;
    font-weight: 600;
    color: rgba(255,255,255,0.7);
    align-self: flex-start;
    margin-top: 8px;
  }
  
  .amount {
    font-size: 3.5rem;
    font-weight: 700;
    color: #fff;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  
  .period {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.4);
    margin-left: 4px;
  }
  
  .subscribe-btn {
    width: 100%;
    padding: 14px 24px;
    background: #6366f1;
    border: none;
    border-radius: 12px;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 24px;
  }
  
  .subscribe-btn:hover {
    background: #4f46e5;
    transform: translateY(-2px);
  }
  
  .features-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .features-list li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.875rem;
    color: rgba(255,255,255,0.6);
  }
  
  .features-list li.included {
    color: rgba(255,255,255,0.9);
  }
  
  .check-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.7rem;
  }
  
  li.included .check-icon {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
  }
  
  li:not(.included) .check-icon {
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.3);
  }
</style>
```

---

### 3. Testimonial Card

A customer testimonial with avatar, rating, and quote styling:

```svelte
<script>
  let testimonial = $state({
    quote: "This product completely transformed how our team collaborates. The interface is intuitive, the performance is incredible, and the support team is always there when we need them.",
    author: "Sarah Chen",
    role: "Head of Product",
    company: "TechFlow",
    avatar: "SC",
    rating: 5
  });
</script>

<div class="testimonial-card">
  <div class="quote-mark">"</div>
  
  <div class="rating">
    {#each Array(5) as _, i}
      <span class="star" class:filled={i < testimonial.rating}>★</span>
    {/each}
  </div>
  
  <blockquote class="quote-text">
    {testimonial.quote}
  </blockquote>
  
  <div class="author-section">
    <div class="avatar">{testimonial.avatar}</div>
    <div class="author-info">
      <span class="author-name">{testimonial.author}</span>
      <span class="author-role">{testimonial.role} at {testimonial.company}</span>
    </div>
  </div>
</div>

<style>
  .testimonial-card {
    max-width: 480px;
    background: linear-gradient(135deg, #0f0f11 0%, #0c0c0e 100%);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 24px;
    padding: 40px;
    position: relative;
  }
  
  .quote-mark {
    position: absolute;
    top: 20px;
    left: 32px;
    font-size: 5rem;
    font-family: Georgia, serif;
    color: rgba(99, 102, 241, 0.15);
    line-height: 1;
    pointer-events: none;
  }
  
  .rating {
    display: flex;
    gap: 4px;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
  }
  
  .star {
    font-size: 1rem;
    color: rgba(255,255,255,0.2);
  }
  
  .star.filled {
    color: #fbbf24;
  }
  
  .quote-text {
    margin: 0 0 28px;
    font-size: 1.05rem;
    line-height: 1.7;
    color: rgba(255,255,255,0.85);
    font-weight: 400;
    position: relative;
    z-index: 1;
  }
  
  .author-section {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  
  .avatar {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
  }
  
  .author-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .author-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #fff;
  }
  
  .author-role {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.5);
  }
</style>
```

---

### 4. Team Member Card

A profile card with social links and hover effects:

```svelte
<script>
  let member = $state({
    name: "Alex Rivera",
    role: "Lead Designer",
    initials: "AR",
    bio: "Crafting beautiful experiences for 8+ years",
    socials: [
      { platform: "twitter", icon: "𝕏", url: "#" },
      { platform: "linkedin", icon: "in", url: "#" },
      { platform: "dribbble", icon: "◉", url: "#" }
    ]
  });
  
  let isHovered = $state(false);
</script>

<div 
  class="team-card"
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}
>
  <div class="card-bg"></div>
  
  <div class="avatar-section">
    <div class="avatar-ring">
      <div class="avatar">
        {member.initials}
      </div>
    </div>
    <div class="status-dot"></div>
  </div>
  
  <div class="member-info">
    <h3 class="member-name">{member.name}</h3>
    <span class="member-role">{member.role}</span>
    <p class="member-bio">{member.bio}</p>
  </div>
  
  <div class="social-links" class:visible={isHovered}>
    {#each member.socials as social}
      <a href={social.url} class="social-link" title={social.platform}>
        {social.icon}
      </a>
    {/each}
  </div>
  
  <button class="contact-btn">
    <span class="btn-text">Get in touch</span>
    <span class="btn-icon">→</span>
  </button>
</div>

<style>
  .team-card {
    position: relative;
    width: 280px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 24px;
    padding: 32px;
    text-align: center;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .team-card:hover {
    border-color: rgba(255,255,255,0.12);
    transform: translateY(-4px);
  }
  
  .card-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    opacity: 0.1;
  }
  
  .avatar-section {
    position: relative;
    display: inline-block;
    margin-bottom: 20px;
  }
  
  .avatar-ring {
    width: 96px;
    height: 96px;
    padding: 4px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 50%;
  }
  
  .avatar {
    width: 100%;
    height: 100%;
    background: #1a1a1d;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
  }
  
  .status-dot {
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 16px;
    height: 16px;
    background: #22c55e;
    border: 3px solid #0c0c0e;
    border-radius: 50%;
  }
  
  .member-info {
    margin-bottom: 20px;
  }
  
  .member-name {
    margin: 0 0 4px;
    font-size: 1.15rem;
    font-weight: 600;
    color: #fff;
  }
  
  .member-role {
    display: block;
    font-size: 0.85rem;
    color: #818cf8;
    margin-bottom: 12px;
  }
  
  .member-bio {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.5);
    line-height: 1.5;
  }
  
  .social-links {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease;
  }
  
  .social-links.visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  .social-link {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.05);
    border-radius: 10px;
    color: rgba(255,255,255,0.6);
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.15s ease;
  }
  
  .social-link:hover {
    background: rgba(99, 102, 241, 0.2);
    color: #fff;
  }
  
  .contact-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .contact-btn:hover {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.3);
  }
  
  .btn-icon {
    transition: transform 0.2s ease;
  }
  
  .contact-btn:hover .btn-icon {
    transform: translateX(4px);
  }
</style>
```

---

### 5. Notification Card

An interactive notification with actions and timestamp:

```svelte
<script>
  let notifications = $state([
    {
      id: 1,
      type: 'mention',
      icon: '@',
      title: 'New mention',
      message: 'Sarah tagged you in a comment on "Q4 Marketing Plan"',
      time: '2 min ago',
      unread: true
    },
    {
      id: 2,
      type: 'update',
      icon: '↻',
      title: 'Project updated',
      message: 'Design System v2.0 has been published',
      time: '1 hour ago',
      unread: true
    },
    {
      id: 3,
      type: 'invite',
      icon: '✉',
      title: 'Team invitation',
      message: 'You\'ve been invited to join the Growth team',
      time: '3 hours ago',
      unread: false,
      actions: ['Accept', 'Decline']
    }
  ]);
  
  function markRead(id) {
    notifications = notifications.map(n => 
      n.id === id ? { ...n, unread: false } : n
    );
  }
  
  function dismiss(id) {
    notifications = notifications.filter(n => n.id !== id);
  }
</script>

<div class="notifications-list">
  {#each notifications as notif (notif.id)}
    <div 
      class="notification-card"
      class:unread={notif.unread}
      onclick={() => markRead(notif.id)}
    >
      <div class="notif-icon" class:mention={notif.type === 'mention'} class:update={notif.type === 'update'} class:invite={notif.type === 'invite'}>
        {notif.icon}
      </div>
      
      <div class="notif-content">
        <div class="notif-header">
          <span class="notif-title">{notif.title}</span>
          <span class="notif-time">{notif.time}</span>
        </div>
        <p class="notif-message">{notif.message}</p>
        
        {#if notif.actions}
          <div class="notif-actions">
            {#each notif.actions as action}
              <button 
                class="action-btn"
                class:primary={action === 'Accept'}
              >
                {action}
              </button>
            {/each}
          </div>
        {/if}
      </div>
      
      <button class="dismiss-btn" onclick|stopPropagation={() => dismiss(notif.id)}>
        ×
      </button>
      
      {#if notif.unread}
        <div class="unread-dot"></div>
      {/if}
    </div>
  {/each}
  
  {#if notifications.length === 0}
    <div class="empty-state">
      <span class="empty-icon">◎</span>
      <span>All caught up!</span>
    </div>
  {/if}
</div>

<style>
  .notifications-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 440px;
  }
  
  .notification-card {
    position: relative;
    display: flex;
    gap: 14px;
    padding: 16px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .notification-card:hover {
    background: #0f0f11;
    border-color: rgba(255,255,255,0.1);
  }
  
  .notification-card.unread {
    background: rgba(99, 102, 241, 0.03);
    border-color: rgba(99, 102, 241, 0.1);
  }
  
  .notif-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    flex-shrink: 0;
  }
  
  .notif-icon.mention {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
  }
  
  .notif-icon.update {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
  }
  
  .notif-icon.invite {
    background: rgba(168, 85, 247, 0.15);
    color: #c084fc;
  }
  
  .notif-content {
    flex: 1;
    min-width: 0;
  }
  
  .notif-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  
  .notif-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #fff;
  }
  
  .notif-time {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.4);
  }
  
  .notif-message {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.6);
    line-height: 1.4;
  }
  
  .notif-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
  
  .action-btn {
    padding: 6px 16px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: rgba(255,255,255,0.7);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .action-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }
  
  .action-btn.primary {
    background: #6366f1;
    border-color: #6366f1;
    color: #fff;
  }
  
  .action-btn.primary:hover {
    background: #4f46e5;
  }
  
  .dismiss-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: rgba(255,255,255,0.3);
    font-size: 1rem;
    cursor: pointer;
    opacity: 0;
    transition: all 0.15s ease;
  }
  
  .notification-card:hover .dismiss-btn {
    opacity: 1;
  }
  
  .dismiss-btn:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }
  
  .unread-dot {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 8px;
    height: 8px;
    background: #6366f1;
    border-radius: 50%;
  }
  
  .notification-card:hover .unread-dot {
    display: none;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 40px;
    color: rgba(255,255,255,0.4);
    font-size: 0.9rem;
  }
  
  .empty-icon {
    font-size: 2rem;
    opacity: 0.4;
  }
</style>
```

---

### 6. Stat Card Grid

A responsive grid of metric cards with trends:

```svelte
<script>
  let stats = $state([
    { 
      label: 'Total Revenue',
      value: '$48,295',
      change: '+12.5%',
      trend: 'up',
      icon: '◈'
    },
    { 
      label: 'Active Users',
      value: '2,420',
      change: '+8.2%',
      trend: 'up',
      icon: '◎'
    },
    { 
      label: 'Conversion Rate',
      value: '3.24%',
      change: '-0.4%',
      trend: 'down',
      icon: '⟳'
    },
    { 
      label: 'Avg. Session',
      value: '4m 32s',
      change: '+18s',
      trend: 'up',
      icon: '◷'
    }
  ]);
</script>

<div class="stats-grid">
  {#each stats as stat}
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-icon">{stat.icon}</span>
        <span class="stat-label">{stat.label}</span>
      </div>
      
      <div class="stat-value">{stat.value}</div>
      
      <div class="stat-trend" class:up={stat.trend === 'up'} class:down={stat.trend === 'down'}>
        <span class="trend-arrow">{stat.trend === 'up' ? '↑' : '↓'}</span>
        <span class="trend-value">{stat.change}</span>
        <span class="trend-period">vs last month</span>
      </div>
      
      <div class="sparkline">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none">
          <path 
            d={stat.trend === 'up' 
              ? "M0,25 L15,22 L30,18 L45,20 L60,15 L75,12 L90,8 L100,5"
              : "M0,10 L15,12 L30,15 L45,14 L60,18 L75,20 L90,22 L100,25"
            }
            class="spark-line"
            class:up={stat.trend === 'up'}
            class:down={stat.trend === 'down'}
          />
        </svg>
      </div>
    </div>
  {/each}
</div>

<style>
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
  
  .stat-card {
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 20px;
    position: relative;
    overflow: hidden;
  }
  
  .stat-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .stat-icon {
    font-size: 1rem;
    color: rgba(255,255,255,0.4);
  }
  
  .stat-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255,255,255,0.5);
    font-weight: 500;
  }
  
  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 8px;
    font-variant-numeric: tabular-nums;
  }
  
  .stat-trend {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
  }
  
  .stat-trend.up {
    color: #4ade80;
  }
  
  .stat-trend.down {
    color: #f87171;
  }
  
  .trend-arrow {
    font-size: 0.85rem;
  }
  
  .trend-value {
    font-weight: 600;
  }
  
  .trend-period {
    color: rgba(255,255,255,0.35);
  }
  
  .sparkline {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    opacity: 0.3;
  }
  
  .sparkline svg {
    width: 100%;
    height: 100%;
  }
  
  .spark-line {
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  
  .spark-line.up {
    stroke: #22c55e;
  }
  
  .spark-line.down {
    stroke: #ef4444;
  }
</style>
```

---

## Summary

This collection frames content beautifully with:

1. **Feature Cards** — Gradient accents with hover glow effects
2. **Pricing Cards** — Toggle billing with popular badge callout
3. **Testimonials** — Quote styling with star ratings
4. **Team Cards** — Avatar rings with social reveal on hover
5. **Notification Cards** — Actions, timestamps, and unread states
6. **Stat Cards** — Metrics with trends and sparkline visualization

---

*Cards are canvases. Paint them with purpose.*
