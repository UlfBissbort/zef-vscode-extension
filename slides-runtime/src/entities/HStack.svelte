<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import RenderChildren from './RenderChildren.svelte';

  let { node, currentStage = 0, steps = [] } = $props();
  const children = $derived(node?.content_ ?? []);

  function flattenEntities(items) {
    return items.flatMap((child) => [child, ...flattenEntities(child?.content_ ?? [])]);
  }

  function densityFor(items) {
    if (node?.density) return node.density;
    const entities = flattenEntities(items);
    const bulletListCount = entities.filter((child) => child?.__type === 'ET.BulletList' || child?.__type === 'ET.StagedBulletList').length;
    const bulletItemCount = entities.filter((child) => child?.__type === 'ET.BulletItem').length;
    const titleLength = entities
      .filter((child) => child?.__type === 'ET.Title')
      .reduce((total, child) => total + (child.value?.length ?? 0), 0);
    const hasCodeBlock = entities.some((child) => child?.__type === 'ET.CodeBlock');

    if (bulletListCount >= 2 || bulletItemCount >= 6 || (hasCodeBlock && titleLength > 80)) return 'dense';
    if (bulletItemCount >= 4 || titleLength > 70 || hasCodeBlock) return 'compact';
    return 'normal';
  }

  const density = $derived(densityFor(children));
  const className = $derived(`s3__layout role-${node?.role ?? 'layout'} align-${node?.alignment ?? 'center'} distribute-${node?.distribution ?? 'start'} density-${density}`);
</script>

<div class={className}>
  <RenderChildren {children} {currentStage} {steps} />
</div>
