<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();
</script>

<p class={`s3__body ${node.role === 'hero-subtitle' ? 'hero-subtitle' : ''} reveal`}>{node.value}</p>
