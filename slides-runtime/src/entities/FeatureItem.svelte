<!-- +++
ET.SvelteFile('🍃-f23ba4c6f97f2b19e04c',
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

<div class="feature-item reveal">
  <div class="feature-item__icon"><Icon name={node.icon} /></div>
  <div>
    <h3>{node.title}</h3>
    <p>{node.description}</p>
  </div>
</div>
