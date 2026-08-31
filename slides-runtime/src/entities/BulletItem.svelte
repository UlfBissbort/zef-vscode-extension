<!-- +++
ET.SvelteFile('🍃-98dc89445a6d570c2ba4',
  tag_=[],
  created=Time('2026-05-15 16:38:11 +0800')
)
+++ -->

<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node, currentStage = 0, steps = [] } = $props();

  function stageNumber(stageId) {
    if (!stageId) return undefined;
    const index = steps.findIndex((step) => step.id === stageId);
    return index === -1 ? undefined : index + 1;
  }

  const visible = $derived(() => {
    const stage = stageNumber(node.revealAt);
    return stage === undefined || currentStage >= stage;
  });
</script>

{#if visible()}
  <li class="bullet-item-visible">{node.value}</li>
{/if}
