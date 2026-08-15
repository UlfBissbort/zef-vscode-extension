<!-- +++
this = "ET.SvelteComponent('🍃-e81c503bd7a9462f9c16')"
tag_ = []
dispatched_on = "ET.FAQSection"
created = "Time('2026-08-15 15:05:00 +0800')"
[ns]
"ET.FAQSection" = "ET('46415153656374696f6e')"
+++ -->

<script>
  /** A data-in, DOM-out renderer for an ET.FAQSection value. */
  export let data;

  let openKeys = [];
  let configuredData;

  function itemsFor(section) {
    return (section?.content_ ?? []).filter(item => item?.__type === 'ET.FAQItem');
  }

  function keyFor(item, index) {
    return item.id ?? `${index}:${item.question ?? ''}`;
  }

  function toggle(key) {
    openKeys = openKeys.includes(key)
      ? openKeys.filter(openKey => openKey !== key)
      : [...openKeys, key];
  }

  $: if (data !== configuredData) {
    configuredData = data;
    openKeys = itemsFor(data).flatMap((item, index) => item.open === true ? [keyFor(item, index)] : []);
  }
</script>

{#if data?.__type === 'ET.FAQSection'}
  {@const items = itemsFor(data)}
  <section class="faq-section" aria-labelledby="faq-title">
    <header class="faq-header">
      <h2 id="faq-title">{data.title ?? 'Frequently asked questions'}</h2>
      {#if data.subtitle}<p>{data.subtitle}</p>{/if}
    </header>

    <div class="faq-list">
      {#each items as item, index (keyFor(item, index))}
        {@const key = keyFor(item, index)}
        {@const isOpen = openKeys.includes(key)}
        <article class:open={isOpen} class="faq-item">
          <h3>
            <button type="button" aria-expanded={isOpen} aria-controls={`faq-answer-${index}`} onclick={() => toggle(key)}>
              <span>{item.question}</span>
              <i aria-hidden="true">+</i>
            </button>
          </h3>
          <div class="answer-wrap" id={`faq-answer-${index}`} role="region" aria-label={item.question}>
            <div class="answer"><p>{item.answer}</p></div>
          </div>
        </article>
      {/each}
    </div>
  </section>
{:else}
  <p class="error">FAQSection requires an <code>ET.FAQSection</code> data value.</p>
{/if}

<style>
  .faq-section { color: #e4e4e7; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; max-width: 720px; }
  .faq-header { margin: 0 0 24px; } h2 { color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: 0; line-height: 1.2; margin: 0; } .faq-header p { color: #9a9a9a; font-size: 14px; line-height: 1.6; margin: 8px 0 0; }
  .faq-list { border-top: 1px solid #252525; }
  .faq-item { border-bottom: 1px solid #252525; overflow: hidden; }
  h3 { font-size: inherit; font-weight: inherit; margin: 0; }
  button { align-items: center; background: transparent; border: 0; color: #c3c3ca; cursor: pointer; display: flex; font: 600 16px/1.3 Inter, ui-sans-serif, system-ui, sans-serif; gap: 16px; justify-content: space-between; padding: 16px; text-align: left; transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1); width: 100%; }
  button:hover, button:focus-visible { color: #d4d4d8; outline: none; } button:focus-visible { box-shadow: inset 0 0 0 1px #2dd4bf; }
  button i { color: #3ecf8e; flex: 0 0 auto; font-family: inherit; font-size: 1.5rem; font-style: normal; font-weight: 400; line-height: 1; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  .answer-wrap { max-height: 0; overflow: hidden; transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1); } .answer p { color: #7a7a7a; font-size: 14px; line-height: 1.6; margin: 0; padding: 0 16px 16px; }
  .faq-item.open button i { transform: rotate(45deg); } .faq-item.open .answer-wrap { max-height: 300px; }
  .error { color: #fda4af; font-family: system-ui, sans-serif; }
  @media (prefers-reduced-motion: reduce) { .faq-item, .answer-wrap, button, button i { transition: none; } }
</style>
