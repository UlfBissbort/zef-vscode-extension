<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();

  const titleStyle = $derived.by(() => {
    const declarations = [];
    if (node?.scale) declarations.push(`--title-fit-scale: ${node.scale}`);
    if (node?.maxWidth) declarations.push(`--title-max-width: ${node.maxWidth}px`);
    return declarations.join('; ');
  });

  function titleLineParts(line, emphasis) {
    if (!emphasis || !line.includes(emphasis)) return [{ text: line, emphasized: false }];
    const [before, after] = line.split(emphasis);
    return [
      before && { text: before, emphasized: false },
      { text: emphasis, emphasized: true },
      after && { text: after, emphasized: false }
    ].filter(Boolean);
  }
</script>

{#if node.level === 3}
  <h3 class="timeline__title">{node.value}</h3>
{:else if node.level === 1}
  <h1 class="hero-heading reveal" style={titleStyle}>
    {#if node.lineBreaks?.length}
      {#each node.lineBreaks as line, index (index)}
        <span class="title-line">
          {#each titleLineParts(line, node.emphasis) as part}
            {#if part.emphasized}<em>{part.text}</em>{:else}{part.text}{/if}
          {/each}
        </span>
      {/each}
    {:else}
      {node.value}
    {/if}
  </h1>
{:else}
  <h2 class="s3__heading reveal" style={titleStyle}>{node.value}</h2>
{/if}
