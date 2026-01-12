# Dark Component Library VI ◈

**Forms & Inputs** — Precision. Clarity. Validation.

---

## Introduction

Form inputs are where users speak to interfaces. This collection reimagines form controls with pixel-perfect polish, smooth animations, and immediate feedback. Every keystroke feels considered, every validation guides with grace.

---

## Component Collection

Seven sophisticated form components for data entry perfection.

---

### 1. OTP Input

A one-time password input with auto-focus and paste support:

```svelte
<script>
  let digits = $state(['', '', '', '', '', '']);
  let isComplete = $derived(digits.every(d => d !== ''));
  let isVerifying = $state(false);
  let verified = $state(false);
  
  function handleInput(index, e) {
    const value = e.target.value.replace(/\D/g, '').slice(-1);
    digits[index] = value;
    
    if (value && index < 5) {
      const nextInput = document.querySelector(`[data-index="${index + 1}"]`);
      nextInput?.focus();
    }
  }
  
  function handleKeydown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.querySelector(`[data-index="${index - 1}"]`);
      prevInput?.focus();
    }
  }
  
  function handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    text.split('').forEach((char, i) => {
      digits[i] = char;
    });
    const lastFilledIndex = Math.min(text.length - 1, 5);
    const lastInput = document.querySelector(`[data-index="${lastFilledIndex}"]`);
    lastInput?.focus();
  }
  
  async function verify() {
    isVerifying = true;
    await new Promise(r => setTimeout(r, 1500));
    verified = true;
    isVerifying = false;
  }
</script>

<div class="otp-container">
  <div class="otp-header">
    <span class="otp-icon">🔐</span>
    <h3 class="otp-title">Verification Code</h3>
    <p class="otp-desc">Enter the 6-digit code sent to your device</p>
  </div>
  
  <div class="otp-inputs" onpaste={handlePaste}>
    {#each digits as digit, i}
      <input
        type="text"
        inputmode="numeric"
        maxlength="1"
        class="otp-digit"
        class:filled={digit !== ''}
        class:verified={verified}
        data-index={i}
        value={digit}
        oninput={(e) => handleInput(i, e)}
        onkeydown={(e) => handleKeydown(i, e)}
      />
      {#if i === 2}
        <span class="otp-separator">—</span>
      {/if}
    {/each}
  </div>
  
  <button 
    class="verify-btn"
    class:loading={isVerifying}
    class:success={verified}
    disabled={!isComplete || isVerifying || verified}
    onclick={verify}
  >
    {#if verified}
      ✓ Verified
    {:else if isVerifying}
      Verifying...
    {:else}
      Verify Code
    {/if}
  </button>
  
  <p class="resend-text">
    Didn't receive the code? <button class="resend-link">Resend</button>
  </p>
</div>

<style>
  .otp-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 40px 32px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    text-align: center;
  }
  
  .otp-header {
    margin-bottom: 32px;
  }
  
  .otp-icon {
    font-size: 2rem;
    margin-bottom: 12px;
    display: block;
  }
  
  .otp-title {
    margin: 0 0 8px;
    font-size: 1.25rem;
    font-weight: 600;
    color: #fff;
  }
  
  .otp-desc {
    margin: 0;
    font-size: 0.875rem;
    color: rgba(255,255,255,0.5);
  }
  
  .otp-inputs {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 32px;
  }
  
  .otp-digit {
    width: 48px;
    height: 56px;
    background: rgba(255,255,255,0.03);
    border: 2px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    color: #fff;
    font-size: 1.5rem;
    font-weight: 600;
    text-align: center;
    transition: all 0.2s ease;
    caret-color: #6366f1;
  }
  
  .otp-digit:focus {
    outline: none;
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.05);
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }
  
  .otp-digit.filled {
    border-color: rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.05);
  }
  
  .otp-digit.verified {
    border-color: #22c55e;
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
  }
  
  .otp-separator {
    color: rgba(255,255,255,0.2);
    font-size: 1rem;
    margin: 0 4px;
  }
  
  .verify-btn {
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
    margin-bottom: 20px;
  }
  
  .verify-btn:hover:not(:disabled) {
    background: #4f46e5;
    transform: translateY(-1px);
  }
  
  .verify-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .verify-btn.loading {
    background: #4f46e5;
    pointer-events: none;
  }
  
  .verify-btn.success {
    background: #22c55e;
  }
  
  .resend-text {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.4);
  }
  
  .resend-link {
    background: none;
    border: none;
    color: #818cf8;
    font-size: 0.8rem;
    cursor: pointer;
    padding: 0;
  }
  
  .resend-link:hover {
    text-decoration: underline;
  }
</style>
```

---

### 2. File Upload Dropzone

A drag-and-drop file uploader with progress visualization:

```svelte
<script>
  let isDragging = $state(false);
  let files = $state([]);
  
  function handleDragOver(e) {
    e.preventDefault();
    isDragging = true;
  }
  
  function handleDragLeave(e) {
    e.preventDefault();
    isDragging = false;
  }
  
  function handleDrop(e) {
    e.preventDefault();
    isDragging = false;
    addFiles(e.dataTransfer.files);
  }
  
  function handleFileInput(e) {
    addFiles(e.target.files);
  }
  
  function addFiles(fileList) {
    const newFiles = Array.from(fileList).map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type,
      progress: 0,
      status: 'uploading'
    }));
    
    files = [...files, ...newFiles];
    
    // Simulate upload progress
    newFiles.forEach(file => {
      simulateUpload(file.id);
    });
  }
  
  function simulateUpload(fileId) {
    const interval = setInterval(() => {
      const file = files.find(f => f.id === fileId);
      if (!file) {
        clearInterval(interval);
        return;
      }
      
      if (file.progress >= 100) {
        file.status = 'complete';
        files = [...files];
        clearInterval(interval);
        return;
      }
      
      file.progress += Math.random() * 15;
      if (file.progress > 100) file.progress = 100;
      files = [...files];
    }, 200);
  }
  
  function removeFile(fileId) {
    files = files.filter(f => f.id !== fileId);
  }
  
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
</script>

<div class="upload-container">
  <div 
    class="dropzone"
    class:dragging={isDragging}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    <div class="dropzone-icon">
      <span class="icon-cloud">☁</span>
      <span class="icon-arrow">↑</span>
    </div>
    <p class="dropzone-text">
      <span class="primary">Drop files here</span>
      <span class="secondary">or click to browse</span>
    </p>
    <p class="dropzone-hint">Supports: PDF, PNG, JPG up to 10MB</p>
    <input 
      type="file"
      class="file-input"
      multiple
      onchange={handleFileInput}
    />
  </div>
  
  {#if files.length > 0}
    <div class="file-list">
      {#each files as file}
        <div class="file-item" class:complete={file.status === 'complete'}>
          <div class="file-icon">
            {#if file.type.includes('pdf')}
              📄
            {:else if file.type.includes('image')}
              🖼
            {:else}
              📁
            {/if}
          </div>
          <div class="file-info">
            <span class="file-name">{file.name}</span>
            <span class="file-meta">{formatSize(file.size)}</span>
          </div>
          <div class="file-status">
            {#if file.status === 'uploading'}
              <div class="progress-ring">
                <svg viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" class="bg"></circle>
                  <circle 
                    cx="18" cy="18" r="16" 
                    class="progress"
                    style="stroke-dashoffset: {100 - file.progress}"
                  ></circle>
                </svg>
                <span class="progress-text">{Math.round(file.progress)}%</span>
              </div>
            {:else}
              <span class="complete-icon">✓</span>
            {/if}
          </div>
          <button class="remove-btn" onclick={() => removeFile(file.id)}>×</button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .upload-container {
    max-width: 500px;
  }
  
  .dropzone {
    position: relative;
    padding: 48px 32px;
    background: rgba(255,255,255,0.02);
    border: 2px dashed rgba(255,255,255,0.15);
    border-radius: 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .dropzone:hover {
    border-color: rgba(99, 102, 241, 0.4);
    background: rgba(99, 102, 241, 0.03);
  }
  
  .dropzone.dragging {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.08);
    transform: scale(1.01);
  }
  
  .dropzone-icon {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
  }
  
  .icon-cloud {
    font-size: 3rem;
    color: rgba(255,255,255,0.15);
  }
  
  .icon-arrow {
    position: absolute;
    font-size: 1.25rem;
    color: #6366f1;
    animation: bounce 1s ease infinite;
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
  
  .dropzone.dragging .icon-arrow {
    animation: none;
    transform: translateY(-8px);
  }
  
  .dropzone-text {
    margin: 0 0 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .dropzone-text .primary {
    font-size: 1rem;
    font-weight: 500;
    color: #fff;
  }
  
  .dropzone-text .secondary {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.4);
  }
  
  .dropzone-hint {
    margin: 0;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.3);
  }
  
  .file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
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
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
  }
  
  .file-item.complete {
    border-color: rgba(34, 197, 94, 0.2);
  }
  
  .file-icon {
    font-size: 1.5rem;
  }
  
  .file-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .file-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .file-meta {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.4);
  }
  
  .progress-ring {
    position: relative;
    width: 36px;
    height: 36px;
  }
  
  .progress-ring svg {
    transform: rotate(-90deg);
  }
  
  .progress-ring circle {
    fill: none;
    stroke-width: 3;
    stroke-linecap: round;
  }
  
  .progress-ring .bg {
    stroke: rgba(255,255,255,0.1);
  }
  
  .progress-ring .progress {
    stroke: #6366f1;
    stroke-dasharray: 100;
    transition: stroke-dashoffset 0.2s ease;
  }
  
  .progress-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.55rem;
    font-weight: 600;
    color: rgba(255,255,255,0.7);
  }
  
  .complete-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(34, 197, 94, 0.15);
    border-radius: 50%;
    color: #22c55e;
    font-size: 0.9rem;
  }
  
  .remove-btn {
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: rgba(255,255,255,0.4);
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .remove-btn:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }
</style>
```

---

### 3. Date Picker

An inline date picker with month navigation and today highlight:

```svelte
<script>
  let currentDate = $state(new Date());
  let selectedDate = $state(null);
  
  let viewYear = $state(currentDate.getFullYear());
  let viewMonth = $state(currentDate.getMonth());
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  let calendarDays = $derived(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const prevMonthLast = new Date(viewYear, viewMonth, 0).getDate();
    
    const days = [];
    
    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({ date: prevMonthLast - i, isOtherMonth: true, isPast: true });
    }
    
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(viewYear, viewMonth, i);
      days.push({
        date: i,
        isOtherMonth: false,
        isToday: isSameDay(date, currentDate),
        isSelected: selectedDate && isSameDay(date, selectedDate),
        fullDate: date
      });
    }
    
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: i, isOtherMonth: true, isFuture: true });
    }
    
    return days;
  });
  
  function isSameDay(a, b) {
    return a.getDate() === b.getDate() && 
           a.getMonth() === b.getMonth() && 
           a.getFullYear() === b.getFullYear();
  }
  
  function prevMonth() {
    if (viewMonth === 0) {
      viewMonth = 11;
      viewYear--;
    } else {
      viewMonth--;
    }
  }
  
  function nextMonth() {
    if (viewMonth === 11) {
      viewMonth = 0;
      viewYear++;
    } else {
      viewMonth++;
    }
  }
  
  function selectDay(day) {
    if (!day.isOtherMonth && day.fullDate) {
      selectedDate = day.fullDate;
    }
  }
</script>

<div class="datepicker">
  <div class="datepicker-header">
    <button class="nav-btn" onclick={prevMonth}>‹</button>
    <span class="month-year">{monthNames[viewMonth]} {viewYear}</span>
    <button class="nav-btn" onclick={nextMonth}>›</button>
  </div>
  
  <div class="datepicker-grid">
    <div class="day-names">
      {#each dayNames as day}
        <span class="day-name">{day}</span>
      {/each}
    </div>
    
    <div class="days-grid">
      {#each calendarDays() as day}
        <button 
          class="day-cell"
          class:other-month={day.isOtherMonth}
          class:today={day.isToday}
          class:selected={day.isSelected}
          onclick={() => selectDay(day)}
          disabled={day.isOtherMonth}
        >
          {day.date}
        </button>
      {/each}
    </div>
  </div>
  
  {#if selectedDate}
    <div class="selected-display">
      Selected: {selectedDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}
    </div>
  {/if}
</div>

<style>
  .datepicker {
    max-width: 320px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 20px;
  }
  
  .datepicker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  
  .month-year {
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .nav-btn {
    width: 32px;
    height: 32px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    color: #fff;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .nav-btn:hover {
    background: rgba(255,255,255,0.08);
  }
  
  .day-names {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 8px;
  }
  
  .day-name {
    text-align: center;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255,255,255,0.35);
    padding: 8px 0;
  }
  
  .days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }
  
  .day-cell {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 10px;
    color: rgba(255,255,255,0.8);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .day-cell:not(:disabled):hover {
    background: rgba(255,255,255,0.06);
  }
  
  .day-cell.other-month {
    color: rgba(255,255,255,0.15);
    cursor: default;
  }
  
  .day-cell.today {
    color: #6366f1;
    font-weight: 600;
    border: 1px solid rgba(99, 102, 241, 0.4);
  }
  
  .day-cell.selected {
    background: #6366f1;
    color: #fff;
    font-weight: 600;
  }
  
  .day-cell.selected.today {
    border-color: transparent;
  }
  
  .selected-display {
    margin-top: 16px;
    padding: 12px 16px;
    background: rgba(99, 102, 241, 0.1);
    border-radius: 10px;
    font-size: 0.8rem;
    color: #a5b4fc;
    text-align: center;
  }
</style>
```

---

### 4. Credit Card Input

A polished credit card input with real-time formatting and card detection:

```svelte
<script>
  let cardNumber = $state('');
  let expiry = $state('');
  let cvc = $state('');
  let cardHolder = $state('');
  let focusedField = $state(null);
  
  let cardType = $derived(() => {
    const num = cardNumber.replace(/\s/g, '');
    if (/^4/.test(num)) return 'visa';
    if (/^5[1-5]/.test(num)) return 'mastercard';
    if (/^3[47]/.test(num)) return 'amex';
    return null;
  });
  
  let formattedNumber = $derived(() => {
    const clean = cardNumber.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  });
  
  function handleNumberInput(e) {
    const clean = e.target.value.replace(/\D/g, '').slice(0, 16);
    cardNumber = clean;
  }
  
  function handleExpiryInput(e) {
    let value = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    expiry = value;
  }
  
  function handleCvcInput(e) {
    cvc = e.target.value.replace(/\D/g, '').slice(0, 4);
  }
</script>

<div class="card-form">
  <div 
    class="card-preview" 
    class:flipped={focusedField === 'cvc'}
  >
    <div class="card-front">
      <div class="card-brand">
        {#if cardType() === 'visa'}
          <span class="brand-visa">VISA</span>
        {:else if cardType() === 'mastercard'}
          <span class="brand-mc">●●</span>
        {:else if cardType() === 'amex'}
          <span class="brand-amex">AMEX</span>
        {:else}
          <span class="brand-placeholder">◇</span>
        {/if}
      </div>
      <div class="card-chip">▦</div>
      <div class="card-number-display">
        {formattedNumber() || '•••• •••• •••• ••••'}
      </div>
      <div class="card-bottom">
        <div class="card-holder-display">
          {cardHolder.toUpperCase() || 'YOUR NAME'}
        </div>
        <div class="card-expiry-display">
          {expiry || 'MM/YY'}
        </div>
      </div>
    </div>
    <div class="card-back">
      <div class="card-stripe"></div>
      <div class="card-cvc-strip">
        <span class="cvc-display">{cvc || '•••'}</span>
      </div>
    </div>
  </div>
  
  <div class="form-fields">
    <div class="field full">
      <label>Card Number</label>
      <input
        type="text"
        placeholder="1234 5678 9012 3456"
        value={formattedNumber()}
        oninput={handleNumberInput}
        onfocus={() => focusedField = 'number'}
        onblur={() => focusedField = null}
      />
    </div>
    
    <div class="field full">
      <label>Card Holder</label>
      <input
        type="text"
        placeholder="Your Name"
        bind:value={cardHolder}
        onfocus={() => focusedField = 'holder'}
        onblur={() => focusedField = null}
      />
    </div>
    
    <div class="field-row">
      <div class="field">
        <label>Expiry</label>
        <input
          type="text"
          placeholder="MM/YY"
          value={expiry}
          oninput={handleExpiryInput}
          onfocus={() => focusedField = 'expiry'}
          onblur={() => focusedField = null}
        />
      </div>
      <div class="field">
        <label>CVC</label>
        <input
          type="text"
          placeholder="•••"
          value={cvc}
          oninput={handleCvcInput}
          onfocus={() => focusedField = 'cvc'}
          onblur={() => focusedField = null}
        />
      </div>
    </div>
  </div>
</div>

<style>
  .card-form {
    max-width: 400px;
  }
  
  .card-preview {
    position: relative;
    height: 200px;
    margin-bottom: 24px;
    perspective: 1000px;
  }
  
  .card-front, .card-back {
    position: absolute;
    inset: 0;
    border-radius: 16px;
    backface-visibility: hidden;
    transition: transform 0.6s ease;
    padding: 24px;
  }
  
  .card-front {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    display: flex;
    flex-direction: column;
  }
  
  .card-back {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    transform: rotateY(180deg);
    padding: 0;
  }
  
  .card-preview.flipped .card-front {
    transform: rotateY(-180deg);
  }
  
  .card-preview.flipped .card-back {
    transform: rotateY(0deg);
  }
  
  .card-brand {
    margin-bottom: auto;
  }
  
  .brand-visa {
    font-size: 1.25rem;
    font-weight: 700;
    font-style: italic;
    color: #fff;
  }
  
  .brand-mc {
    font-size: 1.5rem;
    background: linear-gradient(90deg, #eb001b, #f79e1b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .brand-amex {
    font-size: 0.9rem;
    font-weight: 700;
    color: #fff;
  }
  
  .brand-placeholder {
    font-size: 1.25rem;
    color: rgba(255,255,255,0.3);
  }
  
  .card-chip {
    position: absolute;
    top: 60px;
    left: 24px;
    font-size: 1.75rem;
    color: #d4af37;
    opacity: 0.8;
  }
  
  .card-number-display {
    font-size: 1.25rem;
    font-family: 'SF Mono', monospace;
    letter-spacing: 0.15em;
    color: #fff;
    margin-top: 40px;
  }
  
  .card-bottom {
    display: flex;
    justify-content: space-between;
    margin-top: auto;
  }
  
  .card-holder-display, .card-expiry-display {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.7);
  }
  
  .card-stripe {
    height: 50px;
    background: #111;
    margin-top: 30px;
  }
  
  .card-cvc-strip {
    margin: 20px 24px;
    padding: 10px 16px;
    background: #fff;
    border-radius: 4px;
    text-align: right;
  }
  
  .cvc-display {
    font-family: 'SF Mono', monospace;
    font-size: 0.9rem;
    color: #000;
    font-style: italic;
  }
  
  .form-fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }
  
  .field.full {
    width: 100%;
  }
  
  .field-row {
    display: flex;
    gap: 16px;
  }
  
  label {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255,255,255,0.5);
  }
  
  input {
    padding: 12px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #fff;
    font-size: 0.95rem;
    transition: all 0.15s ease;
  }
  
  input::placeholder {
    color: rgba(255,255,255,0.25);
  }
  
  input:focus {
    outline: none;
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.05);
  }
</style>
```

---

### 5. Search with Autocomplete

A search input with live suggestions and keyboard navigation:

```svelte
<script>
  let query = $state('');
  let isOpen = $state(false);
  let selectedIndex = $state(-1);
  
  const allItems = [
    { id: 1, label: 'Dashboard', category: 'Pages', icon: '◎' },
    { id: 2, label: 'User Settings', category: 'Pages', icon: '⚙' },
    { id: 3, label: 'Analytics', category: 'Pages', icon: '◈' },
    { id: 4, label: 'Create Project', category: 'Actions', icon: '+' },
    { id: 5, label: 'Export Data', category: 'Actions', icon: '↓' },
    { id: 6, label: 'Dark Mode', category: 'Settings', icon: '●' },
    { id: 7, label: 'Notifications', category: 'Settings', icon: '◉' },
    { id: 8, label: 'John Doe', category: 'Users', icon: '◎' },
    { id: 9, label: 'Jane Smith', category: 'Users', icon: '◎' }
  ];
  
  let filtered = $derived(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allItems.filter(item => 
      item.label.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });
  
  function handleKeydown(e) {
    const items = filtered();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      selectItem(items[selectedIndex]);
    } else if (e.key === 'Escape') {
      isOpen = false;
    }
  }
  
  function selectItem(item) {
    query = item.label;
    isOpen = false;
    selectedIndex = -1;
  }
  
  function handleFocus() {
    isOpen = true;
  }
  
  function handleBlur() {
    setTimeout(() => isOpen = false, 150);
  }
</script>

<div class="search-container">
  <div class="search-input-wrapper">
    <span class="search-icon">⌕</span>
    <input
      type="text"
      class="search-input"
      placeholder="Search anything..."
      bind:value={query}
      onkeydown={handleKeydown}
      onfocus={handleFocus}
      onblur={handleBlur}
    />
    {#if query}
      <button class="clear-btn" onclick={() => { query = ''; selectedIndex = -1; }}>
        ×
      </button>
    {/if}
  </div>
  
  {#if isOpen && filtered().length > 0}
    <div class="suggestions">
      {#each filtered() as item, i}
        <button
          class="suggestion-item"
          class:selected={selectedIndex === i}
          onclick={() => selectItem(item)}
          onmouseenter={() => selectedIndex = i}
        >
          <span class="item-icon">{item.icon}</span>
          <span class="item-label">{item.label}</span>
          <span class="item-category">{item.category}</span>
        </button>
      {/each}
    </div>
  {/if}
  
  {#if isOpen && query && filtered().length === 0}
    <div class="no-results">
      <span class="no-results-icon">◌</span>
      <span>No results for "{query}"</span>
    </div>
  {/if}
</div>

<style>
  .search-container {
    position: relative;
    max-width: 400px;
  }
  
  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .search-icon {
    position: absolute;
    left: 16px;
    font-size: 1rem;
    color: rgba(255,255,255,0.4);
  }
  
  .search-input {
    width: 100%;
    padding: 14px 44px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    color: #fff;
    font-size: 0.95rem;
    transition: all 0.2s ease;
  }
  
  .search-input::placeholder {
    color: rgba(255,255,255,0.35);
  }
  
  .search-input:focus {
    outline: none;
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.05);
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }
  
  .clear-btn {
    position: absolute;
    right: 12px;
    width: 24px;
    height: 24px;
    background: rgba(255,255,255,0.1);
    border: none;
    border-radius: 50%;
    color: rgba(255,255,255,0.6);
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .clear-btn:hover {
    background: rgba(255,255,255,0.15);
    color: #fff;
  }
  
  .suggestions {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background: #0f0f11;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.5);
    overflow: hidden;
    z-index: 100;
  }
  
  .suggestion-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: background 0.1s ease;
  }
  
  .suggestion-item:hover,
  .suggestion-item.selected {
    background: rgba(255,255,255,0.05);
  }
  
  .item-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.06);
    border-radius: 6px;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.7);
  }
  
  .item-label {
    flex: 1;
    font-size: 0.9rem;
    color: #fff;
  }
  
  .item-category {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .no-results {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    padding: 24px;
    background: #0f0f11;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: rgba(255,255,255,0.5);
    font-size: 0.85rem;
  }
  
  .no-results-icon {
    font-size: 1.5rem;
    opacity: 0.4;
  }
</style>
```

---

### 6. Range Slider with Dual Handles

A price range slider with two draggable handles:

```svelte
<script>
  let minValue = $state(200);
  let maxValue = $state(800);
  const min = 0;
  const max = 1000;
  
  let isDragging = $state(null);
  
  function getPercent(value) {
    return ((value - min) / (max - min)) * 100;
  }
  
  function handleMouseDown(handle) {
    return (e) => {
      isDragging = handle;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };
  }
  
  function handleMouseMove(e) {
    if (!isDragging) return;
    const track = document.querySelector('.slider-track');
    const rect = track.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const value = Math.round(min + (percent / 100) * (max - min));
    
    if (isDragging === 'min') {
      minValue = Math.min(value, maxValue - 50);
    } else {
      maxValue = Math.max(value, minValue + 50);
    }
  }
  
  function handleMouseUp() {
    isDragging = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
</script>

<div class="range-slider-container">
  <div class="range-header">
    <span class="range-label">Price Range</span>
    <span class="range-value">${minValue} – ${maxValue}</span>
  </div>
  
  <div class="slider-track">
    <div 
      class="slider-range"
      style="left: {getPercent(minValue)}%; width: {getPercent(maxValue) - getPercent(minValue)}%"
    ></div>
    
    <div 
      class="slider-handle min"
      style="left: {getPercent(minValue)}%"
      onmousedown={handleMouseDown('min')}
    >
      <div class="handle-tooltip">${minValue}</div>
    </div>
    
    <div 
      class="slider-handle max"
      style="left: {getPercent(maxValue)}%"
      onmousedown={handleMouseDown('max')}
    >
      <div class="handle-tooltip">${maxValue}</div>
    </div>
  </div>
  
  <div class="slider-labels">
    <span>${min}</span>
    <span>${max}</span>
  </div>
</div>

<style>
  .range-slider-container {
    padding: 24px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
  }
  
  .range-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .range-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: rgba(255,255,255,0.7);
  }
  
  .range-value {
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    padding: 6px 12px;
    background: rgba(99, 102, 241, 0.15);
    border-radius: 8px;
    color: #a5b4fc;
  }
  
  .slider-track {
    position: relative;
    height: 6px;
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
    margin: 16px 0;
  }
  
  .slider-range {
    position: absolute;
    height: 100%;
    background: #6366f1;
    border-radius: 3px;
  }
  
  .slider-handle {
    position: absolute;
    top: 50%;
    width: 24px;
    height: 24px;
    background: #fff;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    cursor: grab;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    transition: transform 0.1s ease;
  }
  
  .slider-handle:hover {
    transform: translate(-50%, -50%) scale(1.1);
  }
  
  .slider-handle:active {
    cursor: grabbing;
    transform: translate(-50%, -50%) scale(1.15);
  }
  
  .handle-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    background: #1f1f23;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.15s ease;
    pointer-events: none;
  }
  
  .slider-handle:hover .handle-tooltip {
    opacity: 1;
  }
  
  .slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.4);
  }
</style>
```

---

### 7. Password Strength Meter

A password input with real-time strength analysis:

```svelte
<script>
  let password = $state('');
  let showPassword = $state(false);
  
  let strength = $derived(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  });
  
  let strengthLabel = $derived(() => {
    if (password.length === 0) return '';
    if (strength() <= 2) return 'Weak';
    if (strength() <= 4) return 'Fair';
    if (strength() <= 5) return 'Good';
    return 'Strong';
  });
  
  let strengthColor = $derived(() => {
    if (strength() <= 2) return '#ef4444';
    if (strength() <= 4) return '#f59e0b';
    if (strength() <= 5) return '#22c55e';
    return '#10b981';
  });
  
  let checks = $derived(() => [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) }
  ]);
</script>

<div class="password-container">
  <div class="input-wrapper">
    <input
      type={showPassword ? 'text' : 'password'}
      class="password-input"
      placeholder="Enter your password"
      bind:value={password}
    />
    <button 
      class="toggle-visibility"
      onclick={() => showPassword = !showPassword}
    >
      {showPassword ? '◉' : '◎'}
    </button>
  </div>
  
  {#if password.length > 0}
    <div class="strength-meter">
      <div class="meter-track">
        {#each [1,2,3,4,5,6] as segment}
          <div 
            class="meter-segment"
            class:filled={segment <= strength()}
            style="background: {segment <= strength() ? strengthColor() : 'rgba(255,255,255,0.1)'}"
          ></div>
        {/each}
      </div>
      <span class="strength-label" style="color: {strengthColor()}">{strengthLabel()}</span>
    </div>
    
    <div class="requirements">
      {#each checks() as check}
        <div class="requirement" class:met={check.met}>
          <span class="check-icon">{check.met ? '✓' : '○'}</span>
          <span class="check-label">{check.label}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .password-container {
    max-width: 360px;
  }
  
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .password-input {
    width: 100%;
    padding: 14px 48px 14px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    color: #fff;
    font-size: 0.95rem;
    transition: all 0.2s ease;
  }
  
  .password-input:focus {
    outline: none;
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.05);
  }
  
  .toggle-visibility {
    position: absolute;
    right: 14px;
    background: none;
    border: none;
    font-size: 1.1rem;
    color: rgba(255,255,255,0.4);
    cursor: pointer;
    transition: color 0.15s ease;
  }
  
  .toggle-visibility:hover {
    color: rgba(255,255,255,0.7);
  }
  
  .strength-meter {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
  }
  
  .meter-track {
    flex: 1;
    display: flex;
    gap: 4px;
  }
  
  .meter-segment {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    transition: background 0.2s ease;
  }
  
  .strength-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: color 0.2s ease;
  }
  
  .requirements {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: rgba(255,255,255,0.02);
    border-radius: 10px;
  }
  
  .requirement {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.4);
    transition: color 0.15s ease;
  }
  
  .requirement.met {
    color: #22c55e;
  }
  
  .check-icon {
    font-size: 0.9rem;
  }
  
  .requirement.met .check-icon {
    color: #22c55e;
  }
</style>
```

---

## Summary

This collection elevates form interactions through:

1. **OTP Input** — Smooth auto-advancing verification with paste support
2. **File Upload** — Drag-and-drop with progress rings and status states
3. **Date Picker** — Inline calendar with elegant navigation
4. **Credit Card Input** — Live formatting with 3D card preview flip
5. **Search Autocomplete** — Keyboard-first suggestion navigation
6. **Range Slider** — Dual-handle price filtering with precision
7. **Password Strength** — Real-time feedback with visual requirements

---

*Every input is a conversation. Make it elegant.*
