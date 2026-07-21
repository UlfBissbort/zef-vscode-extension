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
