<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import RenderChildren from './RenderChildren.svelte';

  let { node, currentStage = 0, steps = [] } = $props();
  const children = $derived(node?.content_ ?? []);

  function countBulletItems(items) {
    return items.reduce((total, child) => {
      if (child?.__type === 'ET.BulletList' || child?.__type === 'ET.StagedBulletList') {
        return total + (child.content_?.length ?? 0);
      }
      return total;
    }, 0);
  }

  function densityFor(items) {
    if (node?.density) return node.density;
    const titleLength = items
      .filter((child) => child?.__type === 'ET.Title')
      .reduce((total, child) => total + (child.value?.length ?? 0), 0);
    const bulletListCount = items.filter((child) => child?.__type === 'ET.BulletList' || child?.__type === 'ET.StagedBulletList').length;
    const bulletItemCount = countBulletItems(items);
    const hasCodeBlock = items.some((child) => child?.__type === 'ET.CodeBlock');

    if (bulletItemCount >= 5 || bulletListCount >= 2 || (hasCodeBlock && titleLength > 72)) return 'dense';
    if (bulletItemCount >= 3 || titleLength > 58 || hasCodeBlock) return 'compact';
    return 'normal';
  }

  const density = $derived(densityFor(children));
  const className = $derived(`vstack role-${node?.role ?? 'stack'} align-${node?.alignment ?? 'leading'} gap-${node?.spacing ?? 'md'} density-${density}`);
</script>

<div class={className}>
  <RenderChildren {children} {currentStage} {steps} />
</div>
