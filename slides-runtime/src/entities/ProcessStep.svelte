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
