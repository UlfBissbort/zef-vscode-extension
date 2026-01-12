# Svelte Render Test

A simple test to check if rendered-html blocks work on load.



In Rust:
```rust
println!("The answer is {}", 40 + 2);
1.2345
```
````Result
1.2345
````
````Side Effects
[
    ET.UnmanagedEffect(
        what='stdout',
        content='The answer is 42'
    )
]
````





Or Svelte
```svelte
<script>
  let clicked = 0;
</script>

<button on:click={() => clicked++}>
  {clicked === 0 ? 'Click me' : `Clicked ${clicked}×`}
</button>

<style>
  button {
    padding: 12px 28px;
    font-size: 14px;
    font-weight: 500;
    color: #fafafa;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  button::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #667eea);
    background-size: 300% 100%;
    z-index: -1;
    border-radius: 10px;
    animation: gradient 3s linear infinite;
    opacity: 0.5;
    transition: opacity 0.3s;
  }
  button:hover::before { opacity: 1; }
  button:hover { transform: translateY(-2px); box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3); }
  @keyframes gradient { 0% { background-position: 0% 50%; } 100% { background-position: 300% 50%; } }
</style>
```

---

## Invite Popover Component

An interactive invite popover with suggestion list and hover states:

```svelte
<script>
  let inputValue = '';
  let highlightedIndex = 0;
  
  const suggestions = [
    { name: 'Edwin Smith', email: 'edwin@peakorange.com', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { name: 'Steph Williams', email: 'steph@peakorange.com', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { name: 'Adam James', email: 'adam@peakorange.com', avatar: 'https://randomuser.me/api/portraits/men/12.jpg' }
  ];
  
  function selectPerson(person) {
    inputValue = person.email;
  }
</script>

<div class="popover">
  <div class="to-row">
    <div class="label">To:</div>
    <input 
      class="to-input" 
      placeholder="Taylor or taylor@example.com"
      bind:value={inputValue}
    />
  </div>

  <div class="subhead">Suggestions</div>

  <div class="list">
    {#each suggestions as person, i}
      <div 
        class="row" 
        class:highlight={i === highlightedIndex}
        on:mouseenter={() => highlightedIndex = i}
        on:click={() => selectPerson(person)}
      >
        <div class="person-avatar">
          <img alt="" src={person.avatar} />
        </div>
        <div class="who">
          <div class="name">{person.name}</div>
          <div class="email">{person.email}</div>
        </div>
      </div>
    {/each}
  </div>

  <div class="footer">
    <div class="link-left">
      <div class="link-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M10.59 13.41a1 1 0 0 0 1.41 1.41l3.54-3.54a3 3 0 1 0-4.24-4.24L8.76 9.58" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M13.41 10.59a1 1 0 0 0-1.41-1.41L8.46 12.72a3 3 0 1 0 4.24 4.24l2.54-2.54" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <span>People with the link can edit · <span class="copy-link">Copy link</span></span>
    </div>
    <div class="settings">Settings</div>
  </div>
</div>

<style>
  .popover {
    width: 100%;
    max-width: 500px;
    background: #ffffff;
    border: 1px solid #e2e5e8;
    border-radius: 12px;
    box-shadow: 0 14px 28px rgba(60,64,67,.15), 0 2px 6px rgba(60,64,67,.3);
    overflow: hidden;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .to-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 22px;
    border-bottom: 1px solid #e9ecef;
  }

  .label {
    color: #6b6f74;
    font-size: 17px;
    font-weight: 500;
  }

  .to-input {
    flex: 1;
    font-size: 17px;
    border: 0;
    outline: 0;
    padding: 6px 0;
    color: #202124;
    background: transparent;
  }
  .to-input::placeholder { color: #a7aaae; }

  .subhead {
    padding: 14px 22px;
    color: #6b6f74;
    font-size: 14px;
    border-bottom: 1px solid #e9ecef;
    background: #fff;
  }

  .list { display: flex; flex-direction: column; }

  .row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 22px;
    border-bottom: 1px solid #e9ecef;
    background: #fff;
    cursor: pointer;
    transition: background 0.15s;
  }
  .row.highlight { background: #e8f0fe; }

  .person-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    flex: 0 0 auto;
    box-shadow: 0 0 0 1px rgba(0,0,0,.06) inset;
  }
  .person-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }

  .who {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .name {
    font-size: 15px;
    font-weight: 500;
    color: #2b2d30;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .email {
    font-size: 13px;
    color: #80868b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: #fff;
  }

  .link-left {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #5f6368;
    font-size: 13px;
  }

  .link-icon {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    color: #5f6368;
  }

  .copy-link {
    color: #1a73e8;
    font-weight: 500;
    cursor: pointer;
  }
  .copy-link:hover { text-decoration: underline; }

  .settings {
    color: #1a73e8;
    font-weight: 500;
    font-size: 14px;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
  }
  .settings:hover { background: #e8f0fe; }
</style>
```

The end