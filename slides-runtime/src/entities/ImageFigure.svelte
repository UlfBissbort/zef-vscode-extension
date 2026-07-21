<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();

  const frame = $derived(node.frame ?? {});
  const fade = $derived(node.fade ?? {});
  const variant = $derived(node.variant ?? 'glass');
  const aspectRatio = $derived(node.aspectRatio ?? '16 / 10');
  const edgeFade = $derived(fade.edges ?? 0);
  const glow = $derived(frame.glow ?? (variant === 'plain' ? 0 : 0.16));
  const radius = $derived(frame.radius ?? (variant === 'device' ? 24 : 18));
  const showBorder = $derived(frame.border ?? variant !== 'plain');

  function imageStyle() {
    return [
      `object-fit: ${node.fit ?? 'cover'}`,
      `object-position: ${node.position ?? 'center'}`,
      `opacity: ${node.opacity ?? 1}`
    ].join('; ');
  }

  function figureStyle() {
    return [
      `--image-aspect: ${aspectRatio}`,
      `--image-radius: ${radius}px`,
      `--image-glow: ${glow}`,
      `--edge-fade: ${edgeFade * 100}%`
    ].join('; ');
  }
</script>

<figure
  class={`image-figure image-figure--${variant}`}
  class:image-figure--bordered={showBorder}
  style={figureStyle()}
>
  <div class="image-figure__media">
    <img src={node.src} alt={node.alt ?? ''} style={imageStyle()} loading="lazy" />
    {#if edgeFade > 0}
      <span class="image-figure__fade image-figure__fade--top"></span>
      <span class="image-figure__fade image-figure__fade--bottom"></span>
      <span class="image-figure__fade image-figure__fade--left"></span>
      <span class="image-figure__fade image-figure__fade--right"></span>
    {/if}
  </div>
  {#if node.caption || node.credit}
    <figcaption>
      {#if node.caption}<span>{node.caption}</span>{/if}
      {#if node.credit}<small>{node.credit}</small>{/if}
    </figcaption>
  {/if}
</figure>

<style>
  .image-figure {
    width: min(var(--image-width, 520px), 100%);
    margin: 0;
    color: var(--text-mid);
  }

  .image-figure__media {
    position: relative;
    aspect-ratio: var(--image-aspect);
    overflow: hidden;
    border-radius: var(--image-radius);
    background: rgba(16, 19, 30, 0.72);
    box-shadow:
      0 22px 58px rgba(0, 0, 0, 0.24),
      0 0 calc(var(--image-glow) * 70px) rgba(56, 189, 248, var(--image-glow));
  }

  .image-figure--bordered .image-figure__media {
    border: 1px solid rgba(255, 255, 255, 0.09);
  }

  .image-figure--device .image-figure__media {
    padding: 0.55rem;
    background:
      linear-gradient(135deg, rgba(167, 139, 250, 0.12), transparent 48%),
      rgba(12, 16, 27, 0.94);
  }

  .image-figure--device img {
    border-radius: calc(var(--image-radius) - 10px);
  }

  .image-figure--cutout .image-figure__media {
    background: transparent;
    box-shadow: none;
  }

  .image-figure--plain .image-figure__media {
    background: transparent;
    box-shadow: none;
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
  }

  .image-figure__fade {
    position: absolute;
    pointer-events: none;
  }

  .image-figure__fade--top {
    inset: 0 0 auto;
    height: var(--edge-fade);
    background: linear-gradient(180deg, rgba(6, 8, 14, 0.8), transparent);
  }

  .image-figure__fade--bottom {
    inset: auto 0 0;
    height: var(--edge-fade);
    background: linear-gradient(0deg, rgba(6, 8, 14, 0.8), transparent);
  }

  .image-figure__fade--left {
    inset: 0 auto 0 0;
    width: var(--edge-fade);
    background: linear-gradient(90deg, rgba(6, 8, 14, 0.8), transparent);
  }

  .image-figure__fade--right {
    inset: 0 0 0 auto;
    width: var(--edge-fade);
    background: linear-gradient(270deg, rgba(6, 8, 14, 0.8), transparent);
  }

  figcaption {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 0.65rem;
    color: var(--text-dim);
    font-size: 0.66rem;
    line-height: 1.35;
  }

  figcaption small {
    color: var(--text-ghost);
    font: 800 0.56rem/1.35 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
</style>
