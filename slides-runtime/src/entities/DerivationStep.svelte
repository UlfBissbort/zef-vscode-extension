<!-- +++
ET.SvelteFile('🍃-103212fbe32447f3ee20',
  tag_=[],
  created=Time('2026-05-15 16:38:11 +0800')
)
+++ -->

<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();
</script>

<div class="derivation-step">
  <span class="derivation-step__index">{node.index}</span>
  <div>
    <p>{node.statement}</p>
    <code>{node.equation}</code>
  </div>
</div>
