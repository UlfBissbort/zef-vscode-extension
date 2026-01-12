# Dark Component Library XI ◈

**E-Commerce** — Browse. Select. Convert.

---

## Introduction

E-commerce interfaces must balance beauty with utility. Every pixel serves conversion—from product discovery to checkout completion. This collection explores components that turn browsers into buyers through elegant, trust-building design.

---

## Component Collection

Six e-commerce components for modern online stores.

---

### 1. Product Card

A feature-rich product card with quick actions:

```svelte
<script>
  let product = $state({
    name: "Wireless Pro Headphones",
    price: 299,
    originalPrice: 349,
    rating: 4.8,
    reviews: 1247,
    colors: ['#1a1a1a', '#e5e5e5', '#1e40af'],
    selectedColor: '#1a1a1a',
    isNew: true,
    inWishlist: false
  });
  
  function toggleWishlist() {
    product.inWishlist = !product.inWishlist;
  }
  
  function selectColor(color) {
    product.selectedColor = color;
  }
  
  let discount = $derived(Math.round((1 - product.price / product.originalPrice) * 100));
</script>

<div class="product-card">
  <div class="product-image">
    <div class="image-placeholder" style="background: linear-gradient(135deg, {product.selectedColor}22, {product.selectedColor}44)">
      <span class="product-icon">🎧</span>
    </div>
    
    {#if product.isNew}
      <span class="badge new">New</span>
    {/if}
    
    {#if discount > 0}
      <span class="badge sale">-{discount}%</span>
    {/if}
    
    <button 
      class="wishlist-btn"
      class:active={product.inWishlist}
      onclick={toggleWishlist}
    >
      {product.inWishlist ? '♥' : '♡'}
    </button>
    
    <div class="quick-actions">
      <button class="quick-btn">Quick View</button>
    </div>
  </div>
  
  <div class="product-info">
    <div class="rating">
      <span class="stars">{'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}</span>
      <span class="rating-text">{product.rating} ({product.reviews})</span>
    </div>
    
    <h3 class="product-name">{product.name}</h3>
    
    <div class="color-options">
      {#each product.colors as color}
        <button 
          class="color-swatch"
          class:active={product.selectedColor === color}
          style="background: {color}"
          onclick={() => selectColor(color)}
        ></button>
      {/each}
    </div>
    
    <div class="price-row">
      <span class="current-price">${product.price}</span>
      {#if product.originalPrice > product.price}
        <span class="original-price">${product.originalPrice}</span>
      {/if}
    </div>
    
    <button class="add-to-cart">Add to Cart</button>
  </div>
</div>

<style>
  .product-card {
    max-width: 280px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .product-card:hover {
    border-color: rgba(255,255,255,0.12);
    transform: translateY(-4px);
  }
  
  .product-image {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
  }
  
  .image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .product-icon {
    font-size: 4rem;
    filter: drop-shadow(0 8px 16px rgba(0,0,0,0.3));
  }
  
  .badge {
    position: absolute;
    top: 12px;
    left: 12px;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  
  .badge.new {
    background: #6366f1;
    color: #fff;
  }
  
  .badge.sale {
    background: #ef4444;
    color: #fff;
    top: 44px;
  }
  
  .wishlist-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(8px);
    border: none;
    border-radius: 50%;
    color: rgba(255,255,255,0.7);
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .wishlist-btn:hover {
    background: rgba(255,255,255,0.2);
  }
  
  .wishlist-btn.active {
    color: #ef4444;
  }
  
  .quick-actions {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px;
    background: linear-gradient(transparent, rgba(0,0,0,0.8));
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }
  
  .product-card:hover .quick-actions {
    transform: translateY(0);
  }
  
  .quick-btn {
    width: 100%;
    padding: 10px;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 8px;
    color: #fff;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  
  .quick-btn:hover {
    background: rgba(255,255,255,0.25);
  }
  
  .product-info {
    padding: 16px;
  }
  
  .rating {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .stars {
    color: #f59e0b;
    font-size: 0.8rem;
    letter-spacing: 1px;
  }
  
  .rating-text {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.5);
  }
  
  .product-name {
    margin: 0 0 12px;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    line-height: 1.3;
  }
  
  .color-options {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .color-swatch {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .color-swatch:hover {
    transform: scale(1.1);
  }
  
  .color-swatch.active {
    border-color: #fff;
    box-shadow: 0 0 0 2px #0c0c0e;
  }
  
  .price-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 16px;
  }
  
  .current-price {
    font-size: 1.25rem;
    font-weight: 700;
    color: #fff;
  }
  
  .original-price {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.4);
    text-decoration: line-through;
  }
  
  .add-to-cart {
    width: 100%;
    padding: 12px;
    background: #6366f1;
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .add-to-cart:hover {
    background: #4f46e5;
    transform: translateY(-1px);
  }
</style>
```

---

### 2. Shopping Cart

A slide-out cart with quantity controls:

```svelte
<script>
  let items = $state([
    { 
      id: 1, 
      name: 'Wireless Pro Headphones', 
      variant: 'Midnight Black',
      price: 299, 
      quantity: 1,
      icon: '🎧'
    },
    { 
      id: 2, 
      name: 'Premium Watch Band', 
      variant: 'Ocean Blue / M',
      price: 49, 
      quantity: 2,
      icon: '⌚'
    },
    { 
      id: 3, 
      name: 'USB-C Charging Cable', 
      variant: '2m Length',
      price: 29, 
      quantity: 1,
      icon: '🔌'
    }
  ]);
  
  function updateQuantity(id, delta) {
    items = items.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
  }
  
  function removeItem(id) {
    items = items.filter(item => item.id !== id);
  }
  
  let subtotal = $derived(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  let shipping = $derived(subtotal > 200 ? 0 : 15);
  let total = $derived(subtotal + shipping);
</script>

<div class="cart-panel">
  <div class="cart-header">
    <h3 class="cart-title">Shopping Cart</h3>
    <span class="item-count">{items.length} items</span>
  </div>
  
  <div class="cart-items">
    {#each items as item (item.id)}
      <div class="cart-item">
        <div class="item-image">
          <span>{item.icon}</span>
        </div>
        
        <div class="item-details">
          <h4 class="item-name">{item.name}</h4>
          <span class="item-variant">{item.variant}</span>
          
          <div class="item-actions">
            <div class="quantity-control">
              <button 
                class="qty-btn"
                onclick={() => updateQuantity(item.id, -1)}
              >−</button>
              <span class="qty-value">{item.quantity}</span>
              <button 
                class="qty-btn"
                onclick={() => updateQuantity(item.id, 1)}
              >+</button>
            </div>
            
            <button 
              class="remove-btn"
              onclick={() => removeItem(item.id)}
            >Remove</button>
          </div>
        </div>
        
        <div class="item-price">
          ${item.price * item.quantity}
        </div>
      </div>
    {/each}
  </div>
  
  <div class="cart-summary">
    <div class="summary-row">
      <span>Subtotal</span>
      <span>${subtotal}</span>
    </div>
    <div class="summary-row">
      <span>Shipping</span>
      <span>{shipping === 0 ? 'Free' : `$${shipping}`}</span>
    </div>
    {#if shipping > 0}
      <div class="free-shipping-hint">
        Add ${200 - subtotal} more for free shipping
      </div>
    {/if}
    <div class="summary-row total">
      <span>Total</span>
      <span>${total}</span>
    </div>
  </div>
  
  <button class="checkout-btn">
    Proceed to Checkout
  </button>
</div>

<style>
  .cart-panel {
    max-width: 380px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    padding: 24px;
  }
  
  .cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .cart-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .item-count {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.5);
  }
  
  .cart-items {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
    max-height: 320px;
    overflow-y: auto;
  }
  
  .cart-item {
    display: flex;
    gap: 14px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  
  .cart-item:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
  
  .item-image {
    width: 64px;
    height: 64px;
    background: rgba(255,255,255,0.04);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    flex-shrink: 0;
  }
  
  .item-details {
    flex: 1;
    min-width: 0;
  }
  
  .item-name {
    margin: 0 0 2px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .item-variant {
    display: block;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.45);
    margin-bottom: 10px;
  }
  
  .item-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .quantity-control {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.04);
    border-radius: 8px;
    padding: 4px;
  }
  
  .qty-btn {
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.6);
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s ease;
  }
  
  .qty-btn:hover {
    color: #fff;
  }
  
  .qty-value {
    min-width: 24px;
    text-align: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: #fff;
  }
  
  .remove-btn {
    background: none;
    border: none;
    color: rgba(255,255,255,0.4);
    font-size: 0.7rem;
    cursor: pointer;
    transition: color 0.15s ease;
    padding: 0;
  }
  
  .remove-btn:hover {
    color: #ef4444;
  }
  
  .item-price {
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    flex-shrink: 0;
  }
  
  .cart-summary {
    padding: 20px 0;
    border-top: 1px solid rgba(255,255,255,0.06);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    margin-bottom: 20px;
  }
  
  .summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.6);
    margin-bottom: 10px;
  }
  
  .summary-row.total {
    margin-top: 16px;
    margin-bottom: 0;
    padding-top: 12px;
    border-top: 1px solid rgba(255,255,255,0.06);
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .free-shipping-hint {
    font-size: 0.7rem;
    color: #22c55e;
    margin-bottom: 12px;
  }
  
  .checkout-btn {
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
  
  .checkout-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
  }
</style>
```

---

### 3. Checkout Form

A streamlined checkout with shipping and payment:

```svelte
<script>
  let step = $state(1);
  let shipping = $state({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    country: 'US',
    zip: ''
  });
  
  let payment = $state({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  
  let shippingMethod = $state('standard');
  
  const shippingOptions = [
    { id: 'standard', name: 'Standard', price: 0, time: '5-7 days' },
    { id: 'express', name: 'Express', price: 15, time: '2-3 days' },
    { id: 'overnight', name: 'Overnight', price: 30, time: 'Next day' }
  ];
</script>

<div class="checkout-form">
  <div class="steps-indicator">
    <div class="step-item" class:active={step >= 1} class:completed={step > 1}>
      <span class="step-number">{step > 1 ? '✓' : '1'}</span>
      <span class="step-label">Shipping</span>
    </div>
    <div class="step-line" class:active={step >= 2}></div>
    <div class="step-item" class:active={step >= 2} class:completed={step > 2}>
      <span class="step-number">{step > 2 ? '✓' : '2'}</span>
      <span class="step-label">Payment</span>
    </div>
    <div class="step-line" class:active={step >= 3}></div>
    <div class="step-item" class:active={step >= 3}>
      <span class="step-number">3</span>
      <span class="step-label">Review</span>
    </div>
  </div>
  
  {#if step === 1}
    <div class="form-section">
      <h3 class="section-title">Contact</h3>
      <div class="input-group">
        <input 
          type="email" 
          placeholder="Email address"
          bind:value={shipping.email}
        />
      </div>
      
      <h3 class="section-title">Shipping Address</h3>
      <div class="input-row">
        <input 
          type="text" 
          placeholder="First name"
          bind:value={shipping.firstName}
        />
        <input 
          type="text" 
          placeholder="Last name"
          bind:value={shipping.lastName}
        />
      </div>
      <div class="input-group">
        <input 
          type="text" 
          placeholder="Address"
          bind:value={shipping.address}
        />
      </div>
      <div class="input-row">
        <input 
          type="text" 
          placeholder="City"
          bind:value={shipping.city}
        />
        <input 
          type="text" 
          placeholder="ZIP code"
          bind:value={shipping.zip}
        />
      </div>
      
      <h3 class="section-title">Shipping Method</h3>
      <div class="shipping-options">
        {#each shippingOptions as option}
          <label class="shipping-option" class:selected={shippingMethod === option.id}>
            <input 
              type="radio" 
              name="shipping" 
              value={option.id}
              bind:group={shippingMethod}
            />
            <div class="option-content">
              <span class="option-name">{option.name}</span>
              <span class="option-time">{option.time}</span>
            </div>
            <span class="option-price">
              {option.price === 0 ? 'Free' : `$${option.price}`}
            </span>
          </label>
        {/each}
      </div>
    </div>
  {:else if step === 2}
    <div class="form-section">
      <h3 class="section-title">Payment Details</h3>
      <div class="input-group">
        <input 
          type="text" 
          placeholder="Card number"
          bind:value={payment.cardNumber}
        />
        <div class="card-icons">
          <span>💳</span>
        </div>
      </div>
      <div class="input-row">
        <input 
          type="text" 
          placeholder="MM / YY"
          bind:value={payment.expiry}
        />
        <input 
          type="text" 
          placeholder="CVV"
          bind:value={payment.cvv}
        />
      </div>
      <div class="input-group">
        <input 
          type="text" 
          placeholder="Name on card"
          bind:value={payment.name}
        />
      </div>
      
      <div class="security-note">
        <span class="lock-icon">🔒</span>
        Your payment info is encrypted and secure
      </div>
    </div>
  {:else}
    <div class="form-section">
      <h3 class="section-title">Order Review</h3>
      <div class="review-block">
        <span class="review-label">Ship to</span>
        <span class="review-value">{shipping.firstName} {shipping.lastName}</span>
        <span class="review-sub">{shipping.address}, {shipping.city} {shipping.zip}</span>
      </div>
      <div class="review-block">
        <span class="review-label">Method</span>
        <span class="review-value">{shippingOptions.find(o => o.id === shippingMethod)?.name}</span>
      </div>
      <div class="review-block">
        <span class="review-label">Payment</span>
        <span class="review-value">•••• {payment.cardNumber.slice(-4) || '••••'}</span>
      </div>
    </div>
  {/if}
  
  <div class="form-actions">
    {#if step > 1}
      <button class="back-btn" onclick={() => step--}>Back</button>
    {/if}
    <button 
      class="continue-btn"
      onclick={() => step < 3 ? step++ : null}
    >
      {step === 3 ? 'Place Order' : 'Continue'}
    </button>
  </div>
</div>

<style>
  .checkout-form {
    max-width: 440px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    padding: 28px;
  }
  
  .steps-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32px;
  }
  
  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  
  .step-number {
    width: 28px;
    height: 28px;
    background: rgba(255,255,255,0.06);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255,255,255,0.4);
    transition: all 0.2s ease;
  }
  
  .step-item.active .step-number {
    background: #6366f1;
    color: #fff;
  }
  
  .step-item.completed .step-number {
    background: #22c55e;
    color: #fff;
  }
  
  .step-label {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.4);
  }
  
  .step-item.active .step-label {
    color: #fff;
  }
  
  .step-line {
    flex: 1;
    height: 2px;
    background: rgba(255,255,255,0.1);
    margin: 0 16px 20px;
    transition: background 0.2s ease;
  }
  
  .step-line.active {
    background: #6366f1;
  }
  
  .form-section {
    margin-bottom: 24px;
  }
  
  .section-title {
    margin: 0 0 16px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
  }
  
  .input-group {
    position: relative;
    margin-bottom: 12px;
  }
  
  .input-row {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
  }
  
  .input-row input {
    flex: 1;
  }
  
  input {
    width: 100%;
    padding: 14px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    color: #fff;
    font-size: 0.9rem;
    transition: border-color 0.15s ease;
  }
  
  input::placeholder {
    color: rgba(255,255,255,0.35);
  }
  
  input:focus {
    outline: none;
    border-color: #6366f1;
  }
  
  .card-icons {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.1rem;
  }
  
  .shipping-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .shipping-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .shipping-option:hover {
    border-color: rgba(255,255,255,0.15);
  }
  
  .shipping-option.selected {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.05);
  }
  
  .shipping-option input {
    width: auto;
    accent-color: #6366f1;
  }
  
  .option-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .option-name {
    font-size: 0.85rem;
    color: #fff;
    font-weight: 500;
  }
  
  .option-time {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.45);
  }
  
  .option-price {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.7);
    font-weight: 500;
  }
  
  .security-note {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.5);
  }
  
  .lock-icon {
    font-size: 0.9rem;
  }
  
  .review-block {
    padding: 16px;
    background: rgba(255,255,255,0.02);
    border-radius: 10px;
    margin-bottom: 12px;
  }
  
  .review-label {
    display: block;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.45);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }
  
  .review-value {
    display: block;
    font-size: 0.9rem;
    color: #fff;
    font-weight: 500;
  }
  
  .review-sub {
    display: block;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.5);
    margin-top: 4px;
  }
  
  .form-actions {
    display: flex;
    gap: 12px;
  }
  
  .back-btn {
    flex: 1;
    padding: 14px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 10px;
    color: rgba(255,255,255,0.7);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .back-btn:hover {
    border-color: rgba(255,255,255,0.25);
    color: #fff;
  }
  
  .continue-btn {
    flex: 2;
    padding: 14px;
    background: #6366f1;
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .continue-btn:hover {
    background: #4f46e5;
  }
</style>
```

---

### 4. Size Selector

A clothing size selector with availability:

```svelte
<script>
  let sizes = $state([
    { label: 'XS', available: true },
    { label: 'S', available: true },
    { label: 'M', available: true },
    { label: 'L', available: false },
    { label: 'XL', available: true },
    { label: 'XXL', available: true }
  ]);
  
  let selectedSize = $state('M');
  let showGuide = $state(false);
  
  function selectSize(size) {
    if (size.available) {
      selectedSize = size.label;
    }
  }
</script>

<div class="size-selector">
  <div class="selector-header">
    <span class="selector-label">Size</span>
    <button class="guide-btn" onclick={() => showGuide = !showGuide}>
      Size Guide
    </button>
  </div>
  
  <div class="size-options">
    {#each sizes as size}
      <button 
        class="size-option"
        class:selected={selectedSize === size.label}
        class:unavailable={!size.available}
        disabled={!size.available}
        onclick={() => selectSize(size)}
      >
        {size.label}
        {#if !size.available}
          <span class="strikethrough"></span>
        {/if}
      </button>
    {/each}
  </div>
  
  {#if !sizes.find(s => s.label === selectedSize)?.available}
    <div class="notify-block">
      <span class="notify-icon">🔔</span>
      <div class="notify-content">
        <span class="notify-title">This size is sold out</span>
        <button class="notify-btn">Notify me when available</button>
      </div>
    </div>
  {/if}
  
  {#if showGuide}
    <div class="size-guide">
      <div class="guide-header">
        <h4>Size Guide</h4>
        <button class="close-guide" onclick={() => showGuide = false}>×</button>
      </div>
      <table class="guide-table">
        <thead>
          <tr>
            <th>Size</th>
            <th>Chest</th>
            <th>Waist</th>
            <th>Length</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>XS</td><td>34"</td><td>28"</td><td>26"</td></tr>
          <tr><td>S</td><td>36"</td><td>30"</td><td>27"</td></tr>
          <tr><td>M</td><td>38"</td><td>32"</td><td>28"</td></tr>
          <tr><td>L</td><td>40"</td><td>34"</td><td>29"</td></tr>
          <tr><td>XL</td><td>42"</td><td>36"</td><td>30"</td></tr>
          <tr><td>XXL</td><td>44"</td><td>38"</td><td>31"</td></tr>
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .size-selector {
    max-width: 340px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 20px;
  }
  
  .selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }
  
  .selector-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
  }
  
  .guide-btn {
    background: none;
    border: none;
    color: #818cf8;
    font-size: 0.75rem;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  
  .size-options {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .size-option {
    position: relative;
    min-width: 48px;
    height: 48px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: rgba(255,255,255,0.8);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .size-option:hover:not(:disabled) {
    border-color: rgba(255,255,255,0.25);
  }
  
  .size-option.selected {
    background: #6366f1;
    border-color: #6366f1;
    color: #fff;
  }
  
  .size-option.unavailable {
    color: rgba(255,255,255,0.25);
    cursor: not-allowed;
  }
  
  .strikethrough {
    position: absolute;
    top: 50%;
    left: 8px;
    right: 8px;
    height: 1px;
    background: rgba(255,255,255,0.2);
    transform: rotate(-45deg);
  }
  
  .notify-block {
    display: flex;
    gap: 12px;
    margin-top: 16px;
    padding: 14px;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.2);
    border-radius: 10px;
  }
  
  .notify-icon {
    font-size: 1.1rem;
  }
  
  .notify-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .notify-title {
    font-size: 0.8rem;
    color: #f59e0b;
  }
  
  .notify-btn {
    background: none;
    border: none;
    color: rgba(255,255,255,0.7);
    font-size: 0.75rem;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    text-align: left;
  }
  
  .size-guide {
    margin-top: 16px;
    padding: 16px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    animation: slideDown 0.2s ease;
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .guide-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .guide-header h4 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
  }
  
  .close-guide {
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.5);
    font-size: 1rem;
    cursor: pointer;
  }
  
  .guide-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.75rem;
  }
  
  .guide-table th {
    text-align: left;
    padding: 8px 0;
    color: rgba(255,255,255,0.5);
    font-weight: 500;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  
  .guide-table td {
    padding: 8px 0;
    color: rgba(255,255,255,0.8);
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
</style>
```

---

### 5. Review Card

A product review with helpful votes:

```svelte
<script>
  let reviews = $state([
    {
      id: 1,
      author: 'Alex M.',
      rating: 5,
      date: 'Jan 15, 2025',
      verified: true,
      title: 'Best headphones I\'ve ever owned',
      content: 'The sound quality is incredible and the noise cancellation is top-notch. Battery life easily lasts a full week of commuting. Highly recommend!',
      helpful: 47,
      notHelpful: 3,
      voted: null,
      images: 2
    },
    {
      id: 2,
      author: 'Sarah K.',
      rating: 4,
      date: 'Jan 10, 2025',
      verified: true,
      title: 'Great but pricey',
      content: 'Amazing build quality and comfort. The app could use some work though. Taking off one star for the price point.',
      helpful: 23,
      notHelpful: 5,
      voted: null,
      images: 0
    }
  ]);
  
  function vote(id, type) {
    reviews = reviews.map(r => {
      if (r.id === id) {
        if (r.voted === type) {
          return {
            ...r,
            voted: null,
            helpful: type === 'helpful' ? r.helpful - 1 : r.helpful,
            notHelpful: type === 'not-helpful' ? r.notHelpful - 1 : r.notHelpful
          };
        } else {
          return {
            ...r,
            voted: type,
            helpful: type === 'helpful' ? r.helpful + 1 : (r.voted === 'helpful' ? r.helpful - 1 : r.helpful),
            notHelpful: type === 'not-helpful' ? r.notHelpful + 1 : (r.voted === 'not-helpful' ? r.notHelpful - 1 : r.notHelpful)
          };
        }
      }
      return r;
    });
  }
</script>

<div class="reviews-section">
  <div class="reviews-header">
    <h3 class="reviews-title">Customer Reviews</h3>
    <div class="overall-rating">
      <span class="rating-score">4.8</span>
      <span class="stars">★★★★★</span>
      <span class="review-count">Based on 1,247 reviews</span>
    </div>
  </div>
  
  <div class="reviews-list">
    {#each reviews as review}
      <div class="review-card">
        <div class="review-header">
          <div class="reviewer-info">
            <span class="reviewer-name">{review.author}</span>
            {#if review.verified}
              <span class="verified-badge">✓ Verified</span>
            {/if}
          </div>
          <span class="review-date">{review.date}</span>
        </div>
        
        <div class="review-rating">
          <span class="stars">{#each Array(5) as _, i}{i < review.rating ? '★' : '☆'}{/each}</span>
        </div>
        
        <h4 class="review-title">{review.title}</h4>
        <p class="review-content">{review.content}</p>
        
        {#if review.images > 0}
          <div class="review-images">
            <div class="image-thumb"></div>
            {#if review.images > 1}
              <div class="image-thumb"></div>
            {/if}
          </div>
        {/if}
        
        <div class="review-actions">
          <span class="helpful-label">Was this helpful?</span>
          <button 
            class="vote-btn"
            class:active={review.voted === 'helpful'}
            onclick={() => vote(review.id, 'helpful')}
          >
            👍 {review.helpful}
          </button>
          <button 
            class="vote-btn"
            class:active={review.voted === 'not-helpful'}
            onclick={() => vote(review.id, 'not-helpful')}
          >
            👎 {review.notHelpful}
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .reviews-section {
    max-width: 480px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    padding: 24px;
  }
  
  .reviews-header {
    margin-bottom: 24px;
  }
  
  .reviews-title {
    margin: 0 0 12px;
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .overall-rating {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .rating-score {
    font-size: 1.75rem;
    font-weight: 700;
    color: #fff;
  }
  
  .stars {
    color: #f59e0b;
    font-size: 0.9rem;
    letter-spacing: 1px;
  }
  
  .review-count {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.5);
  }
  
  .reviews-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .review-card {
    padding: 20px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.04);
    border-radius: 14px;
  }
  
  .review-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
  }
  
  .reviewer-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .reviewer-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
  }
  
  .verified-badge {
    padding: 2px 8px;
    background: rgba(34, 197, 94, 0.15);
    border-radius: 10px;
    font-size: 0.65rem;
    color: #22c55e;
  }
  
  .review-date {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.4);
  }
  
  .review-rating {
    margin-bottom: 10px;
  }
  
  .review-title {
    margin: 0 0 8px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
  }
  
  .review-content {
    margin: 0 0 12px;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.7);
    line-height: 1.5;
  }
  
  .review-images {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;
  }
  
  .image-thumb {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #6366f144, #8b5cf644);
    border-radius: 8px;
  }
  
  .review-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255,255,255,0.04);
  }
  
  .helpful-label {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.4);
  }
  
  .vote-btn {
    padding: 6px 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    color: rgba(255,255,255,0.6);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .vote-btn:hover {
    border-color: rgba(255,255,255,0.15);
    color: #fff;
  }
  
  .vote-btn.active {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.3);
    color: #818cf8;
  }
</style>
```

---

### 6. Order Confirmation

A celebratory order confirmation with tracking:

```svelte
<script>
  let order = $state({
    number: 'ORD-2025-8847',
    date: 'January 18, 2025',
    total: '$347.00',
    email: 'alex@example.com',
    estimatedDelivery: 'January 23-25, 2025',
    items: [
      { name: 'Wireless Pro Headphones', qty: 1, price: '$299' },
      { name: 'USB-C Charging Cable', qty: 2, price: '$48' }
    ],
    trackingNumber: null
  });
  
  let confetti = $state(true);
  
  setTimeout(() => confetti = false, 3000);
</script>

<div class="confirmation-card">
  {#if confetti}
    <div class="confetti-container">
      {#each Array(20) as _, i}
        <div 
          class="confetti"
          style="left: {Math.random() * 100}%; animation-delay: {Math.random() * 2}s; background: {['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'][i % 5]}"
        ></div>
      {/each}
    </div>
  {/if}
  
  <div class="success-icon">
    <span class="checkmark">✓</span>
  </div>
  
  <h2 class="success-title">Order Confirmed!</h2>
  <p class="success-message">
    Thank you for your purchase. We've sent a confirmation to <strong>{order.email}</strong>
  </p>
  
  <div class="order-details">
    <div class="detail-row">
      <span class="detail-label">Order number</span>
      <span class="detail-value">{order.number}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Order date</span>
      <span class="detail-value">{order.date}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Estimated delivery</span>
      <span class="detail-value">{order.estimatedDelivery}</span>
    </div>
  </div>
  
  <div class="order-items">
    <h4 class="items-title">Order Summary</h4>
    {#each order.items as item}
      <div class="order-item">
        <span class="item-name">{item.name} × {item.qty}</span>
        <span class="item-price">{item.price}</span>
      </div>
    {/each}
    <div class="order-total">
      <span>Total</span>
      <span>{order.total}</span>
    </div>
  </div>
  
  <div class="action-buttons">
    <button class="track-btn">Track Order</button>
    <button class="continue-btn">Continue Shopping</button>
  </div>
</div>

<style>
  .confirmation-card {
    position: relative;
    max-width: 420px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 24px;
    padding: 40px 32px;
    text-align: center;
    overflow: hidden;
  }
  
  .confetti-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 200px;
    pointer-events: none;
    overflow: hidden;
  }
  
  .confetti {
    position: absolute;
    top: -10px;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    animation: fall 3s ease-out forwards;
  }
  
  @keyframes fall {
    to {
      transform: translateY(250px) rotate(720deg);
      opacity: 0;
    }
  }
  
  .success-icon {
    width: 72px;
    height: 72px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    animation: scaleIn 0.4s ease backwards;
  }
  
  @keyframes scaleIn {
    from {
      transform: scale(0);
    }
    to {
      transform: scale(1);
    }
  }
  
  .checkmark {
    color: #fff;
    font-size: 2rem;
    font-weight: 700;
  }
  
  .success-title {
    margin: 0 0 12px;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
  }
  
  .success-message {
    margin: 0 0 28px;
    font-size: 0.9rem;
    color: rgba(255,255,255,0.6);
    line-height: 1.5;
  }
  
  .success-message strong {
    color: #fff;
  }
  
  .order-details {
    padding: 20px;
    background: rgba(255,255,255,0.02);
    border-radius: 14px;
    margin-bottom: 20px;
  }
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
  }
  
  .detail-row:not(:last-child) {
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  
  .detail-label {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.5);
  }
  
  .detail-value {
    font-size: 0.8rem;
    color: #fff;
    font-weight: 500;
  }
  
  .order-items {
    text-align: left;
    margin-bottom: 28px;
  }
  
  .items-title {
    margin: 0 0 12px;
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255,255,255,0.6);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .order-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.8);
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  
  .item-price {
    color: #fff;
  }
  
  .order-total {
    display: flex;
    justify-content: space-between;
    padding: 14px 0 0;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .track-btn {
    width: 100%;
    padding: 14px;
    background: #6366f1;
    border: none;
    border-radius: 12px;
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  
  .track-btn:hover {
    background: #4f46e5;
  }
  
  .continue-btn {
    width: 100%;
    padding: 14px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px;
    color: rgba(255,255,255,0.8);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .continue-btn:hover {
    border-color: rgba(255,255,255,0.25);
    color: #fff;
  }
</style>
```

---

## Summary

This collection drives conversions through:

1. **Product Cards** — Rich display with quick actions and wishlists
2. **Shopping Cart** — Quantity controls and free shipping prompts
3. **Checkout Forms** — Step-by-step with shipping options
4. **Size Selectors** — Availability indicators and size guides
5. **Review Cards** — Social proof with helpful voting
6. **Order Confirmation** — Celebratory feedback with tracking

---

*Great e-commerce design builds trust. Every interaction is a sale in progress.*
