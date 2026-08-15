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
  .faq-section { background: #050505; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif; margin: 0; overflow: hidden; }
  .faq-header { margin: 0 auto 6rem; max-width: 750px; position: relative; text-align: center; }
  h2 { color: #ffffff; font-size: 2.5rem; font-weight: 600; letter-spacing: -0.03em; line-height: 1.2; margin: 0 0 1rem; } .faq-header p { color: rgb(255 255 255 / 0.75); font-size: 1.125rem; font-weight: 400; line-height: 1.6; margin: 0; }
  .faq-list { margin: 4rem auto 0; max-width: 800px; }
  .faq-item { border-bottom: 1px solid rgb(45 212 191 / 0.18); overflow: hidden; }
  h3 { font-size: inherit; font-weight: inherit; margin: 0; }
  button { align-items: center; background: transparent; border: 0; color: #ffffff; cursor: pointer; display: flex; font: 500 1.125rem/1.5 -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif; justify-content: space-between; padding: 1.5rem 0; text-align: left; transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1); width: 100%; }
  button:hover, button:focus-visible { color: #5eead4; outline: none; } button:focus-visible { outline: 1px solid #2dd4bf; outline-offset: -4px; }
  button i { color: #2dd4bf; flex: 0 0 auto; font-family: inherit; font-size: 1.5rem; font-style: normal; font-weight: 400; line-height: 1; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  .answer-wrap { max-height: 0; overflow: hidden; transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1); } .answer p { color: rgb(255 255 255 / 0.75); font-size: 1.125rem; font-weight: 400; line-height: 1.6; margin: 0; padding: 0 0 1.5rem; }
  .faq-item.open button i { transform: rotate(45deg); } .faq-item.open .answer-wrap { max-height: 300px; }
  .error { color: #fda4af; font-family: system-ui, sans-serif; }
  @media (max-width: 640px) { .faq-header { margin-bottom: 3rem; } h2 { font-size: 2rem; } .faq-list { margin-top: 2rem; } }
  @media (prefers-reduced-motion: reduce) { .answer-wrap, button, button i { transition: none; } }
</style>
