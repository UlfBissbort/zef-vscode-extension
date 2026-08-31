<!-- +++
ET.SvelteFile('🍃-7fe54afd182fe665322e',
  tag_=[],
  created=Time('2026-05-15 16:38:11 +0800')
)
+++ -->

<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import Icon from '../icons/Icon.svelte';

  let { node } = $props();
</script>

<article class="process-step reveal">
  <div class="process-step__icon"><Icon name={node.icon} /></div>
  <div>
    <h3>{node.title}</h3>
    <p>{node.description}</p>
  </div>
</article>
