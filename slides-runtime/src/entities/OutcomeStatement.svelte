<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();

  const accent = $derived(node?.accent ?? 'cyan');
  const metricValue = $derived(node?.primaryValue ?? node?.metricValue ?? node?.value ?? '93%');
  const metricLabel = $derived(node?.primaryLabel ?? node?.metricLabel ?? 'performance improvement');
  const zeroLead = $derived(node?.constraintLead ?? node?.zeroLead ?? 'Zero');
  const zeroDetail = $derived(node?.constraintDetail ?? node?.zeroDetail ?? 'feature work');
  const finalLead = $derived(node?.causeLead ?? node?.finalLead ?? 'Just');
  const finalWord = $derived(node?.causeDetail ?? node?.finalWord ?? 'architecture');
</script>

<div class={`impact impact--${accent}`} aria-label={`${metricValue} ${metricLabel}. ${zeroLead} ${zeroDetail}. ${finalLead} ${finalWord}.`}>
  <div class="impact__orbit" aria-hidden="true">
    <span></span><span></span><span></span>
  </div>

  <div class="impact__kicker">
    <span class="impact__dot"></span>
    Architecture result
  </div>

  <div class="impact__layout">
    <section class="impact__metric-block">
      <div class="impact__metric">{metricValue}</div>
      <div class="impact__label">{metricLabel}</div>
    </section>

    <div class="impact__rule" aria-hidden="true"></div>

    <section class="impact__claim-block">
      <div class="impact__claim impact__claim--muted">
        <span>{zeroLead}</span>
        <strong>{zeroDetail}</strong>
      </div>
      <div class="impact__claim impact__claim--main">
        <span>{finalLead}</span>
        <strong>{finalWord}</strong>
      </div>
    </section>
  </div>
</div>

<style>
  .impact {
    position: relative;
    z-index: 2;
    width: min(1040px, calc(100vw - 8rem));
    min-height: 460px;
    display: grid;
    place-items: center;
    color: var(--text-bright);
  }

  .impact__orbit {
    position: absolute;
    inset: -5rem 2rem -4rem;
    opacity: 0.52;
    pointer-events: none;
  }

  .impact__orbit span {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 610px;
    height: 610px;
    border: 1px solid rgba(124, 91, 240, 0.075);
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }

  .impact__orbit span:nth-child(2) {
    width: 420px;
    height: 420px;
    border-color: rgba(91, 141, 239, 0.07);
  }

  .impact__orbit span:nth-child(3) {
    width: 250px;
    height: 250px;
    border-color: rgba(56, 189, 248, 0.07);
  }

  .impact__kicker {
    position: absolute;
    top: 1.4rem;
    left: 50%;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.55rem 0.85rem;
    border: 1px solid rgba(124, 91, 240, 0.28);
    border-radius: 999px;
    background: rgba(124, 91, 240, 0.08);
    color: rgba(196, 181, 253, 0.92);
    font: 0.76rem/1 var(--font-mono);
    letter-spacing: 0.025em;
    transform: translateX(-50%);
    box-shadow: 0 0 32px rgba(124, 91, 240, 0.08);
  }

  .impact__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--purple);
    box-shadow: 0 0 14px rgba(124, 91, 240, 0.7);
  }

  .impact__layout {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 0.98fr) 1px minmax(0, 0.82fr);
    align-items: center;
    gap: clamp(2.25rem, 5vw, 4.25rem);
    width: 100%;
    padding-top: 1.5rem;
  }

  .impact__metric-block {
    display: grid;
    justify-items: end;
    gap: 1.05rem;
  }

  .impact__metric {
    font-family: var(--font-display);
    font-size: clamp(7.8rem, 13.5vw, 11.2rem);
    line-height: 0.82;
    letter-spacing: -0.105em;
    font-weight: 850;
    color: #f1f5fb;
    text-shadow: 0 20px 70px rgba(0, 0, 0, 0.45);
  }

  .impact__label {
    margin-right: 0.5rem;
    color: var(--text-mid);
    font: 0.98rem/1.2 var(--font-body);
    letter-spacing: -0.025em;
  }

  .impact__rule {
    height: 272px;
    background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.16), rgba(56, 189, 248, 0.18), transparent);
  }

  .impact__claim-block {
    display: grid;
    gap: 2.05rem;
    justify-items: start;
  }

  .impact__claim {
    display: grid;
    gap: 0.18rem;
  }

  .impact__claim span {
    color: var(--text-dim);
    font-family: var(--font-display);
    font-weight: 780;
    letter-spacing: -0.055em;
  }

  .impact__claim strong {
    font-family: var(--font-display);
    font-weight: 840;
    letter-spacing: -0.07em;
  }

  .impact__claim--muted span {
    font-size: 1.8rem;
    line-height: 0.95;
  }

  .impact__claim--muted strong {
    color: rgba(238, 240, 244, 0.92);
    font-size: clamp(2.75rem, 4.6vw, 3.65rem);
    line-height: 0.92;
  }

  .impact__claim--main span {
    font-size: 2rem;
    line-height: 0.95;
  }

  .impact__claim--main strong {
    color: var(--text-bright);
    font-size: clamp(4rem, 7vw, 5.8rem);
    line-height: 0.84;
  }

  .impact__claim--main strong::after {
    content: '';
    display: block;
    width: 100%;
    height: 1px;
    margin-top: 1rem;
    background: linear-gradient(90deg, rgba(56, 189, 248, 0.58), rgba(124, 91, 240, 0.44), transparent);
  }

  .impact--purple .impact__claim--main strong::after {
    background: linear-gradient(90deg, rgba(167, 139, 250, 0.58), rgba(56, 189, 248, 0.34), transparent);
  }

  .impact--emerald .impact__claim--main strong::after {
    background: linear-gradient(90deg, rgba(52, 211, 153, 0.58), rgba(56, 189, 248, 0.34), transparent);
  }

  @media (max-width: 900px) {
    .impact {
      width: min(100%, calc(100vw - 2rem));
      min-height: 500px;
    }

    .impact__layout {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .impact__metric-block,
    .impact__claim-block {
      justify-items: center;
      text-align: center;
    }

    .impact__rule {
      width: min(420px, 80%);
      height: 1px;
      justify-self: center;
      background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.24), transparent);
    }
  }
</style>
