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
