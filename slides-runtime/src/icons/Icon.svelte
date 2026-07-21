<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { name } = $props();
</script>

<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  {#if name === 'arrow-right'}
    <path d="M2 8h12" />
    <path d="M9.5 3.5 14 8l-4.5 4.5" />
  {:else if name === 'plus-circle'}
    <path d="M8 4v8" />
    <path d="M4 8h8" />
  {:else if name === 'document'}
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <path d="M6 6h4" />
    <path d="M6 10h4" />
  {:else if name === 'clock'}
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4v4l3 3" />
  {:else if name === 'trending-up'}
    <path d="M2 10l4-4 3 3 5-5" />
    <path d="M10 4h4v4" />
  {:else if name === 'check'}
    <path d="M3 8.5 6.5 12 13 4" />
  {:else if name === 'users'}
    <path d="M6.5 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    <path d="M1.5 14c.6-2.4 2.3-3.6 5-3.6s4.4 1.2 5 3.6" />
    <path d="M11 8.4a2.5 2.5 0 0 0 0-4.8" />
    <path d="M12.5 10.8c1.1.5 1.8 1.5 2 3.2" />
  {:else if name === 'spark'}
    <path d="M8 1.5 9.6 6.4 14.5 8l-4.9 1.6L8 14.5 6.4 9.6 1.5 8l4.9-1.6L8 1.5Z" />
  {:else if name === 'braces'}
    <path d="M6 2H5a2 2 0 0 0-2 2v1.5A2.5 2.5 0 0 1 1.5 8 2.5 2.5 0 0 1 3 10.5V12a2 2 0 0 0 2 2h1" />
    <path d="M10 2h1a2 2 0 0 1 2 2v1.5A2.5 2.5 0 0 0 14.5 8a2.5 2.5 0 0 0-1.5 2.5V12a2 2 0 0 1-2 2h-1" />
  {:else if name === 'tree'}
    <path d="M8 2v4" />
    <path d="M4 10V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <rect x="2" y="10" width="4" height="4" rx="1" />
    <rect x="10" y="10" width="4" height="4" rx="1" />
  {:else if name === 'component'}
    <rect x="2" y="2" width="5" height="5" rx="1" />
    <rect x="9" y="2" width="5" height="5" rx="1" />
    <rect x="2" y="9" width="5" height="5" rx="1" />
    <rect x="9" y="9" width="5" height="5" rx="1" />
  {:else if name === 'presentation'}
    <rect x="2" y="3" width="12" height="8" rx="1" />
    <path d="M8 11v3" />
    <path d="M5.5 14h5" />
  {:else}
    <circle cx="8" cy="8" r="5" />
  {/if}
</svg>

<style>
  svg {
    width: 14px;
    height: 14px;
    flex: 0 0 auto;
  }
</style>