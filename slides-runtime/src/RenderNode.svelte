<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import HStack from './entities/HStack.svelte';
  import VStack from './entities/VStack.svelte';
  import Badge from './entities/Badge.svelte';
  import Eyebrow from './entities/Eyebrow.svelte';
  import Title from './entities/Title.svelte';
  import Paragraph from './entities/Paragraph.svelte';
  import Equation from './entities/Equation.svelte';
  import Spacer from './entities/Spacer.svelte';
  import ActionGroup from './entities/ActionGroup.svelte';
  import CallToAction from './entities/CallToAction.svelte';
  import MetricGrid from './entities/MetricGrid.svelte';
  import MetricCard from './entities/MetricCard.svelte';
  import StatRow from './entities/StatRow.svelte';
  import StatPill from './entities/StatPill.svelte';
  import FeatureList from './entities/FeatureList.svelte';
  import FeatureItem from './entities/FeatureItem.svelte';
  import ProcessFlow from './entities/ProcessFlow.svelte';
  import ProcessStep from './entities/ProcessStep.svelte';
  import BulletList from './entities/BulletList.svelte';
  import StagedBulletList from './entities/StagedBulletList.svelte';
  import BulletItem from './entities/BulletItem.svelte';
  import QuotePanel from './entities/QuotePanel.svelte';
  import StageHint from './entities/StageHint.svelte';
  import VariableTable from './entities/VariableTable.svelte';
  import Variable from './entities/Variable.svelte';
  import DerivationPanel from './entities/DerivationPanel.svelte';
  import DerivationStep from './entities/DerivationStep.svelte';
  import MeasurementGrid from './entities/MeasurementGrid.svelte';
  import Measurement from './entities/Measurement.svelte';
  import PlotPanel from './entities/PlotPanel.svelte';
  import HistogramPlot from './entities/HistogramPlot.svelte';
  import ScatterPlot from './entities/ScatterPlot.svelte';
  import PointSeries from './entities/PointSeries.svelte';
  import DataPoint from './entities/DataPoint.svelte';
  import PieChart from './entities/PieChart.svelte';
  import PieSegment from './entities/PieSegment.svelte';
  import CircularFlow from './entities/CircularFlow.svelte';
  import SwimlaneFlow from './entities/SwimlaneFlow.svelte';
  import TransformationPipeline from './entities/TransformationPipeline.svelte';
  import CapabilityMap from './entities/CapabilityMap.svelte';
  import LayeredStack from './entities/LayeredStack.svelte';
  import SystemRadar from './entities/SystemRadar.svelte';
  import DecisionTree from './entities/DecisionTree.svelte';
  import ProductTimeline from './entities/ProductTimeline.svelte';
  import ImageFigure from './entities/ImageFigure.svelte';
  import CodeBlock from './entities/CodeBlock.svelte';
  import OutcomeStatement from './entities/OutcomeStatement.svelte';
  import FlowDiagram from './entities/FlowDiagram.svelte';
  import Timeline from './entities/Timeline.svelte';
  import TimelineItem from './entities/TimelineItem.svelte';
  import UnknownNode from './entities/UnknownNode.svelte';

  const componentRegistry = {
    HStack,
    VStack,
    Badge,
    Eyebrow,
    Title,
    Paragraph,
    Equation,
    Spacer,
    ActionGroup,
    CallToAction,
    MetricGrid,
    MetricCard,
    StatRow,
    StatPill,
    FeatureList,
    FeatureItem,
    ProcessFlow,
    ProcessStep,
    BulletList,
    StagedBulletList,
    BulletItem,
    QuotePanel,
    StageHint,
    VariableTable,
    Variable,
    DerivationPanel,
    DerivationStep,
    MeasurementGrid,
    Measurement,
    PlotPanel,
    HistogramPlot,
    ScatterPlot,
    PointSeries,
    DataPoint,
    PieChart,
    PieSegment,
    CircularFlow,
    SwimlaneFlow,
    TransformationPipeline,
    CapabilityMap,
    LayeredStack,
    SystemRadar,
    DecisionTree,
    ProductTimeline,
    ImageFigure,
    CodeBlock,
    OutcomeStatement,
    FlowDiagram,
    Timeline,
    TimelineItem
  };

  let { node, currentStage = 0, steps = [] } = $props();

  const typeName = $derived((node?.__type ?? '').replace('ET.', ''));
  const EntityComponent = $derived(componentRegistry[typeName] ?? UnknownNode);
</script>

<EntityComponent {node} {currentStage} {steps} />

<style>
  :global {
  .s3__layout {
    position: relative;
    z-index: 2;
    display: grid;
    width: 100%;
    max-width: 1100px;
    padding: 0 3rem;
    gap: 5rem;
    grid-template-columns: 1fr 1fr;
  }

  .align-top {
    align-items: center;
  }

  .distribute-equal {
    grid-template-columns: 1fr 1fr;
  }

  .vstack {
    display: flex;
    flex-direction: column;
  }

  .align-leading {
    align-items: flex-start;
  }

  .align-center {
    align-items: center;
    text-align: center;
  }

  .gap-lg {
    gap: 0;
  }

  .gap-xl {
    gap: 0;
  }

  :global(.role-metrics-layout) {
    position: relative;
    z-index: 2;
    width: min(1100px, calc(100vw - 6rem));
  }

  :global(.role-metrics-layout .s3__label),
  :global(.role-metrics-layout .s3__heading) {
    text-align: center;
  }

  :global(.role-composition-layout) {
    position: relative;
    z-index: 2;
    grid-template-columns: minmax(0, 0.92fr) minmax(420px, 1.08fr);
  }

  :global(.role-composition-copy) {
    max-width: 440px;
  }

  :global(.role-data-viz-layout) {
    position: relative;
    z-index: 2;
    grid-template-columns: minmax(0, 0.78fr) minmax(560px, 1.22fr);
    max-width: 1240px;
  }

  :global(.role-data-viz-copy) {
    max-width: 470px;
  }

  :global(.role-science-layout),
  :global(.role-lab-layout) {
    position: relative;
    z-index: 2;
    grid-template-columns: minmax(0, 0.92fr) minmax(420px, 1.08fr);
  }

  :global(.role-science-copy),
  :global(.role-lab-copy) {
    max-width: 460px;
  }

  :global(.role-section-divider-content) {
    position: relative;
    z-index: 2;
    max-width: 920px;
    padding: 0 3rem;
  }

  :global(.role-readable-layout) {
    position: relative;
    z-index: 2;
    width: min(920px, calc(100vw - 7rem));
  }

  :global(.role-summary-layout) {
    position: relative;
    z-index: 2;
    width: min(1120px, calc(100vw - 7rem));
    min-height: 560px;
    justify-content: center;
  }

  :global(.role-summary-layout > .s3__label) {
    margin-bottom: 1rem;
    color: rgba(56, 189, 248, 0.82);
    font-size: 0.64rem;
    letter-spacing: 0.18em;
  }

  :global(.role-summary-layout > .s3__heading) {
    max-width: none;
    margin-bottom: 2.45rem;
    font-size: clamp(2.35rem, 4.25vw, 3.55rem);
    line-height: 1.04;
    letter-spacing: -0.048em;
    font-weight: 720;
  }

  :global(.role-summary-layout > .bullet-list) {
    gap: 1.28rem;
    max-width: 1040px;
    margin-bottom: 3.35rem;
  }

  :global(.role-summary-layout > .bullet-list li) {
    min-height: 0;
    padding: 0 0 0 2.15rem;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    color: rgba(238, 240, 244, 0.82);
    font-size: clamp(1.38rem, 2.28vw, 1.88rem);
    font-weight: 540;
    line-height: 1.28;
    letter-spacing: -0.035em;
  }

  :global(.role-summary-layout > .bullet-list li::before) {
    top: 0.64em;
    left: 0.18rem;
    width: 0.42rem;
    height: 0.42rem;
    margin: 0;
    border-radius: 2px;
    background: rgba(56, 189, 248, 0.62);
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.2);
  }

  :global(.role-summary-images) {
    width: 100%;
    max-width: none;
    padding: 0;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.85rem;
  }

  :global(.role-summary-images .image-figure) {
    --image-width: 100%;
  }

  :global(.role-summary-images .image-figure__media) {
    background:
      linear-gradient(135deg, rgba(56, 189, 248, 0.09), transparent 52%),
      rgba(16, 19, 30, 0.76);
    box-shadow:
      0 22px 54px rgba(0, 0, 0, 0.24),
      0 0 34px rgba(56, 189, 248, 0.045);
  }

  :global(.role-summary-images img) {
    filter: saturate(0.82) contrast(1.04) brightness(0.84);
  }

  :global(.role-flowchart-showcase-layout) {
    position: relative;
    z-index: 2;
    grid-template-columns: minmax(0, 0.82fr) minmax(520px, 1.18fr);
    max-width: 1140px;
  }

  :global(.role-flowchart-showcase-copy) {
    max-width: 445px;
  }

  :global(.role-flowchart-showcase-layout .flow-diagram) {
    --flow-width: 590px;
    --flow-height: 404px;
  }

  :global(.role-flowchart-full-layout) {
    position: relative;
    z-index: 2;
    width: min(1120px, calc(100vw - 7rem));
  }

  :global(.role-flowchart-full-layout .flow-diagram) {
    --flow-width: 1210px;
    --flow-height: 500px;
  }

  :global(.role-hero-content) {
    position: relative;
    z-index: 2;
    max-width: 680px;
    padding: 0 2rem;
  }

  :global(.role-code-showcase-layout) {
    position: relative;
    z-index: 2;
    grid-template-columns: minmax(0, 0.8fr) minmax(520px, 1.2fr);
    max-width: 1120px;
  }

  :global(.role-code-showcase-copy) {
    max-width: 430px;
  }

  :global(.role-code-full) {
    position: relative;
    z-index: 2;
    width: min(980px, 100%);
  }

  :global(.density-compact) {
    --title-fit-scale: 0.92;
    --bullet-scale: 0.9;
    --bullet-gap: 0.95rem;
    --bullet-padding-y: 0.78rem;
  }

  :global(.density-dense) {
    --title-fit-scale: 0.84;
    --bullet-scale: 0.82;
    --bullet-gap: 0.72rem;
    --bullet-padding-y: 0.68rem;
  }

  :global(.role-code-full .s3__label) {
    margin-bottom: 0.95rem;
  }

  :global(.role-code-full .s3__heading) {
    max-width: min(880px, 100%);
    margin-bottom: 1.1rem;
    font-size: calc(clamp(1.8rem, 3vw, 2.65rem) * var(--title-fit-scale, 1));
    text-wrap: balance;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 2.5rem;
    padding: 0.4rem 1rem 0.4rem 0.6rem;
    border: 1px solid rgba(124, 91, 240, 0.15);
    border-radius: 999px;
    background: rgba(124, 91, 240, 0.08);
    color: var(--purple-light);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.04em;
  }

  .hero-badge__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--purple);
    box-shadow: 0 0 8px rgba(124, 91, 240, 0.7);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .hero-heading {
    margin: 0 0 1.75rem;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: calc(clamp(2.75rem, 6vw, 4.5rem) * var(--title-fit-scale, 1));
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: 0;
  }

  .title-line {
    display: block;
  }

  .hero-heading em {
    background: linear-gradient(135deg, var(--purple-light), var(--blue), var(--cyan));
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-style: normal;
  }

  .s3__label {
    margin: 0 0 1.25rem;
    color: var(--purple-light);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  :global(.role-metrics-layout > .s3__label) {
    color: var(--emerald);
  }

  :global(.role-composition-copy > .s3__label) {
    color: var(--cyan);
  }

  :global(.role-data-viz-copy > .s3__label) {
    color: var(--emerald);
  }

  :global(.role-science-copy > .s3__label),
  :global(.role-lab-copy > .s3__label) {
    color: var(--cyan);
  }

  .s3__heading {
    max-width: var(--title-max-width, 470px);
    margin: 0 0 1.5rem;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: calc(clamp(2rem, 3.5vw, 3rem) * var(--title-fit-scale, 1));
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: 0;
  }

  .s3__body {
    max-width: 420px;
    margin: 0 0 2.5rem;
    color: var(--text-mid);
    font-size: 0.9375rem;
    line-height: 1.8;
  }

  .hero-subtitle {
    max-width: 480px;
    margin-right: auto;
    margin-left: auto;
    font-size: 1.125rem;
    line-height: 1.7;
  }

  .spacer {
    display: none;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: 0;
    border-radius: 10px;
    color: #fff;
    font-family: var(--font-body);
    font-size: 0.8125rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.25s ease;
  }

  .btn--primary {
    background: linear-gradient(135deg, var(--purple), #6048d6);
    box-shadow: 0 2px 20px rgba(124, 91, 240, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .btn--primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 32px rgba(124, 91, 240, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .btn--ghost {
    border: 1px solid rgba(255, 255, 255, 0.09);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-bright);
  }

  .btn--ghost:hover {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.07);
  }

  .action-group {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.875rem;
  }

  :global(.action-group > .btn) {
    animation: none;
  }

  .metric-grid {
    display: grid;
    width: 100%;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
    margin-top: 2rem;
  }

  .metric-card {
    position: relative;
    overflow: hidden;
    min-height: 248px;
    padding: 2rem 1.75rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    background: #10131e;
    color: var(--purple-light);
    transition: border-color 0.3s, transform 0.3s;
  }

  .metric-card:hover {
    border-color: rgba(255, 255, 255, 0.09);
    transform: translateY(-3px);
  }

  .metric-card__glow {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, currentColor, transparent);
  }

  .metric-card__value {
    margin-bottom: 0.5rem;
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 4.5vw, 3.75rem);
    font-weight: 800;
    line-height: 1;
  }

  .metric-card__label {
    margin-bottom: 0.5rem;
    color: var(--text-bright);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .metric-card__description {
    margin: 0;
    color: var(--text-dim);
    font-size: 0.75rem;
    line-height: 1.6;
  }

  .sparkline {
    width: 100%;
    height: 40px;
    margin-top: 1.5rem;
  }

  :global(.accent-purple) { color: var(--purple-light); }
  :global(.accent-emerald) { color: var(--emerald); }
  :global(.accent-blue) { color: var(--blue); }
  :global(.accent-cyan) { color: var(--cyan); }
  :global(.accent-amber) { color: #fbbf24; }
  :global(.accent-rose) { color: #fb7185; }

  .stat-row {
    display: grid;
    width: 100%;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.25rem;
    margin-top: 1.25rem;
  }

  .stat-pill {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 66px;
    padding: 1rem 1.25rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    background: #10131e;
  }

  .stat-pill__icon,
  .feature-item__icon,
  .process-step__icon {
    display: grid;
    width: 32px;
    height: 32px;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 8px;
    background: color-mix(in srgb, currentColor 14%, transparent);
  }

  .stat-pill__text {
    display: flex;
    flex-direction: column;
  }

  .stat-pill__value {
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .stat-pill__label {
    color: var(--text-dim);
    font-size: 0.6875rem;
  }

  .feature-list {
    display: grid;
    gap: 0.875rem;
    width: 100%;
  }

  .feature-item {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.875rem;
    align-items: start;
    padding: 0.875rem 0;
  }

  .feature-item__icon {
    color: var(--cyan);
  }

  .feature-item h3,
  .process-step h3 {
    margin: 0 0 0.25rem;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 0.9375rem;
  }

  .feature-item p,
  .process-step p {
    margin: 0;
    color: var(--text-dim);
    font-size: 0.75rem;
    line-height: 1.6;
  }

  .process-flow {
    position: relative;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .process-flow::before {
    content: '';
    position: absolute;
    inset: 50% 12% auto;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(124, 91, 240, 0.5), rgba(56, 189, 248, 0.35), transparent);
  }

  .process-step {
    position: relative;
    min-height: 180px;
    padding: 1.25rem;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 8px;
    background: rgba(16, 19, 30, 0.86);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .process-step__icon {
    margin-bottom: 1.5rem;
    color: var(--purple-light);
  }

  .bullet-list {
    display: grid;
    gap: var(--bullet-gap, 1.25rem);
    width: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  :global(.bullet-list li) {
    position: relative;
    min-height: 3.75rem;
    padding: var(--bullet-padding-y, 0.95rem) 1.15rem var(--bullet-padding-y, 0.95rem) 4rem;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 8px;
    background: rgba(16, 19, 30, 0.72);
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: calc(clamp(1.15rem, 2vw, 1.55rem) * var(--bullet-scale, 1));
    font-weight: 600;
    line-height: 1.35;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
    transition: opacity 0.42s var(--ease-out-expo), transform 0.42s var(--ease-out-expo), filter 0.42s ease;
  }

  :global(.bullet-list li::before) {
    position: absolute;
    top: 1rem;
    left: 1.15rem;
    display: grid;
    width: 1.8rem;
    height: 1.8rem;
    place-items: center;
    border-radius: 50%;
    background: rgba(56, 189, 248, 0.12);
    color: var(--cyan);
    font-family: var(--font-mono);
    font-size: 0.85rem;
  }

  :global(.marker-check li::before) {
    content: '✓';
  }

  :global(.marker-dot li::before) {
    content: '';
    width: 0.72rem;
    height: 0.72rem;
    margin: 0.54rem;
    box-shadow: 0 0 18px rgba(56, 189, 248, 0.45);
  }

  :global(.marker-number) {
    counter-reset: staged-bullet;
  }

  :global(.marker-number li) {
    counter-increment: staged-bullet;
  }

  :global(.marker-number li::before) {
    content: counter(staged-bullet, decimal-leading-zero);
    width: 2.15rem;
    border-radius: 8px;
    background: rgba(52, 211, 153, 0.11);
    color: var(--emerald);
    font-size: 0.72rem;
  }

  :global(.staged-bullet-list .bullet-item-visible) {
    animation: staged-bullet-in 0.42s var(--ease-out-expo) both;
  }

  @keyframes staged-bullet-in {
    from { opacity: 0; transform: translateY(18px); filter: blur(4px); }
    to { opacity: 1; transform: translateY(0); filter: blur(0); }
  }

  .quote-panel {
    margin: 1.5rem 0 0;
    padding: 1.25rem 1.5rem;
    border-left: 2px solid rgba(167, 139, 250, 0.7);
    border-radius: 8px;
    background: rgba(124, 91, 240, 0.07);
  }

  .quote-panel blockquote {
    margin: 0;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: clamp(1.05rem, 1.7vw, 1.35rem);
    line-height: 1.45;
  }

  .quote-panel figcaption {
    margin-top: 0.75rem;
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .stage-hint {
    align-self: flex-start;
    margin-top: 0.25rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid rgba(52, 211, 153, 0.16);
    border-radius: 999px;
    background: rgba(52, 211, 153, 0.07);
    color: var(--emerald);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .equation-card {
    width: 100%;
    margin: 0 0 1.25rem;
    padding: 1.25rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    background: linear-gradient(180deg, rgba(16, 19, 30, 0.92), rgba(10, 13, 22, 0.92));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 18px 50px rgba(0, 0, 0, 0.22);
  }

  .equation-card figcaption,
  .derivation-panel header,
  .plot-panel header {
    margin-bottom: 0.875rem;
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .equation-expression {
    color: var(--text-bright);
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(1.35rem, 2.4vw, 2rem);
    line-height: 1.35;
  }

  .variable-table {
    display: grid;
    width: 100%;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .variable-row {
    display: grid;
    grid-template-columns: 3rem 1fr;
    align-items: center;
    gap: 0.875rem;
    padding: 0.625rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.055);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.025);
  }

  .variable-symbol {
    color: var(--cyan);
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.2rem;
    font-style: italic;
  }

  .variable-meaning {
    color: var(--text-mid);
    font-size: 0.75rem;
    line-height: 1.5;
  }

  .derivation-panel,
  .plot-panel {
    position: relative;
    width: 100%;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    background: rgba(16, 19, 30, 0.86);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .derivation-step {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1rem;
    align-items: start;
    padding: 1rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.055);
  }

  .derivation-step__index {
    color: var(--cyan);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
  }

  .derivation-step p {
    margin: 0 0 0.35rem;
    color: var(--text-mid);
    font-size: 0.8125rem;
  }

  .derivation-step code {
    color: var(--text-bright);
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.25rem;
  }

  :global(.derivation-panel > .equation-card) {
    box-shadow: none;
  }

  .measurement-grid {
    display: grid;
    width: 100%;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .measurement-card {
    min-height: 96px;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.065);
    border-radius: 8px;
    background: #10131e;
  }

  .measurement-card span {
    display: block;
    margin-bottom: 0.75rem;
    color: var(--text-dim);
    font-size: 0.6875rem;
  }

  .measurement-card strong {
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 1.05rem;
  }

  :global(.trend-narrow) { box-shadow: inset 0 1px 0 rgba(56, 189, 248, 0.18); }
  :global(.trend-broad) { box-shadow: inset 0 1px 0 rgba(167, 139, 250, 0.18); }
  :global(.trend-limit) { box-shadow: inset 0 1px 0 rgba(52, 211, 153, 0.18); }

  .plot-panel svg {
    width: 100%;
    height: 320px;
    margin-top: 0.25rem;
  }

  .plot-grid {
    stroke: rgba(255, 255, 255, 0.055);
    stroke-width: 1;
  }

  .plot-axis {
    stroke: rgba(255, 255, 255, 0.2);
    stroke-width: 1.5;
  }

  .plot-curve {
    stroke: var(--cyan);
    stroke-width: 3;
    filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.45));
  }

  .plot-band {
    fill: rgba(124, 91, 240, 0.08);
    stroke: rgba(167, 139, 250, 0.18);
  }

  :global(.plot-band.band-1) {
    fill: rgba(56, 189, 248, 0.04);
    stroke: rgba(56, 189, 248, 0.14);
  }

  .plot-panel text {
    fill: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 0.625rem;
    text-anchor: middle;
  }

  .plot-labels {
    display: flex;
    justify-content: space-between;
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 0.625rem;
    letter-spacing: 0.04em;
  }

  .plot-panel p {
    margin: 1rem 0 0;
    color: var(--text-mid);
    font-size: 0.8125rem;
    line-height: 1.6;
  }

  .histogram-panel {
    position: relative;
    width: 100%;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    background: rgba(16, 19, 30, 0.88);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .histogram-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .histogram-header p,
  .histogram-footer,
  .histogram-x-axis,
  .histogram-y-axis,
  .histogram-source span {
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.04em;
  }

  .histogram-header p {
    margin: 0 0 0.5rem;
    text-transform: uppercase;
  }

  .histogram-header h3 {
    margin: 0 0 0.35rem;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: clamp(1.25rem, 2vw, 1.75rem);
  }

  .histogram-header div > span {
    color: var(--text-mid);
    font-size: 0.8125rem;
  }

  .histogram-source {
    min-width: 96px;
    padding: 0.75rem;
    border: 1px solid rgba(52, 211, 153, 0.16);
    border-radius: 8px;
    background: rgba(52, 211, 153, 0.07);
    text-align: right;
  }

  .histogram-source strong {
    display: block;
    color: var(--emerald);
    font-family: var(--font-display);
    font-size: 1.5rem;
    line-height: 1;
  }

  .histogram-chart {
    display: grid;
    grid-template-columns: 2.25rem 1fr;
    gap: 0.75rem;
    height: 330px;
  }

  .histogram-y-axis {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0.35rem 0 1.9rem;
    text-align: right;
  }

  .histogram-plot-area {
    position: relative;
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    align-items: end;
    gap: 0.5rem;
    padding: 0.75rem 0.75rem 1.9rem;
    border-left: 1px solid rgba(255, 255, 255, 0.12);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    background:
      linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
    background-size: 100% 33.333%, 12.5% 100%;
  }

  .histogram-bin {
    display: flex;
    align-items: end;
    height: 100%;
    min-width: 0;
  }

  .histogram-bar {
    position: relative;
    width: 100%;
    height: var(--bar-height);
    min-height: 8px;
    border: 1px solid rgba(52, 211, 153, 0.2);
    border-radius: 6px 6px 2px 2px;
    background: linear-gradient(180deg, rgba(52, 211, 153, 0.82), rgba(52, 211, 153, 0.24));
    box-shadow: 0 0 22px rgba(52, 211, 153, 0.12);
    animation: histogram-grow 0.7s var(--ease-out-expo) both;
    transform-origin: bottom;
  }

  .histogram-bar.peak {
    border-color: rgba(167, 139, 250, 0.35);
    background: linear-gradient(180deg, rgba(167, 139, 250, 0.9), rgba(124, 91, 240, 0.28));
    box-shadow: 0 0 28px rgba(124, 91, 240, 0.28);
  }

  .histogram-bar span {
    position: absolute;
    top: -1.4rem;
    left: 50%;
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 0.625rem;
    transform: translateX(-50%);
  }

  @keyframes histogram-grow {
    from { transform: scaleY(0.05); opacity: 0.35; }
    to { transform: scaleY(1); opacity: 1; }
  }

  .histogram-x-axis {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 1rem;
    margin: 0.65rem 0 1rem 3rem;
  }

  .histogram-x-axis span:last-child {
    text-align: right;
  }

  .histogram-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .histogram-footer div {
    display: flex;
    gap: 0.5rem;
  }

  .histogram-footer strong {
    padding: 0.35rem 0.5rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.045);
    color: var(--text-bright);
    font-weight: 600;
  }

  .scatter-panel {
    position: relative;
    width: 100%;
    padding: 1.45rem 1.45rem 1.2rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    background: rgba(16, 19, 30, 0.88);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .scatter-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .scatter-header p,
  .scatter-footer,
  .scatter-source span,
  .scatter-x-tick,
  .scatter-y-tick {
    color: rgba(190, 198, 214, 0.74);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.04em;
  }

  .scatter-header p {
    margin: 0 0 0.5rem;
    text-transform: uppercase;
  }

  .scatter-header h3 {
    margin: 0 0 0.35rem;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: clamp(1.4rem, 2vw, 1.95rem);
  }

  .scatter-header div > span {
    color: var(--text-mid);
    font-size: 0.8125rem;
  }

  .scatter-source {
    min-width: 96px;
    padding: 0.75rem;
    border: 1px solid rgba(56, 189, 248, 0.18);
    border-radius: 8px;
    background: rgba(56, 189, 248, 0.08);
    text-align: right;
  }

  .scatter-source strong {
    display: block;
    color: var(--cyan);
    font-family: var(--font-display);
    font-size: 1.5rem;
    line-height: 1;
  }

  .scatter-chart {
    display: block;
    width: 100%;
    height: 430px;
    overflow: visible;
  }

  .scatter-plot-bg {
    fill: rgba(8, 11, 20, 0.52);
    stroke: none;
  }

  .scatter-grid-line {
    stroke: rgba(255, 255, 255, 0.055);
    stroke-width: 1;
  }

  .scatter-grid-line.vertical {
    stroke: rgba(255, 255, 255, 0.035);
  }

  .scatter-axis {
    fill: none;
    stroke: rgba(255, 255, 255, 0.12);
    stroke-width: 1;
  }

  .scatter-x-tick,
  .scatter-y-tick,
  .scatter-axis-label {
    fill: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 400;
    letter-spacing: 0.04em;
  }

  .scatter-y-tick {
    text-anchor: end;
  }

  .scatter-x-tick,
  .scatter-axis-label {
    text-anchor: middle;
  }

  .scatter-trend {
    fill: none;
    stroke: rgba(167, 139, 250, 0.72);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 7 8;
    filter: drop-shadow(0 0 10px rgba(124, 91, 240, 0.28));
  }

  .scatter-point-group {
    animation: scatter-rise 0.6s var(--ease-out-expo) both;
  }

  .scatter-point-halo {
    opacity: 0.22;
  }

  .scatter-point {
    stroke: none;
  }

  .accent-emerald .scatter-point {
    fill: rgba(52, 211, 153, 0.96);
  }

  .accent-emerald .scatter-point-halo {
    fill: rgba(52, 211, 153, 0.56);
  }

  .accent-cyan .scatter-point {
    fill: rgba(56, 189, 248, 0.96);
  }

  .accent-cyan .scatter-point-halo {
    fill: rgba(56, 189, 248, 0.5);
  }

  .accent-highlight .scatter-point {
    fill: rgba(167, 139, 250, 0.98);
  }

  .accent-highlight .scatter-point-halo {
    fill: rgba(124, 91, 240, 0.62);
  }

  @keyframes scatter-rise {
    from { opacity: 0; transform: translateY(8px) scale(0.82); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .scatter-point-label {
    fill: rgba(238, 240, 244, 0.82);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.03em;
  }

  .scatter-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 0.8rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .scatter-footer div {
    display: flex;
    gap: 0.5rem;
  }

  .scatter-footer strong {
    padding: 0.35rem 0.5rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.045);
    color: var(--text-bright);
    font-weight: 600;
  }

  .pie-panel {
    position: relative;
    width: 100%;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    background: rgba(16, 19, 30, 0.88);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .pie-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .pie-header p,
  .pie-footer,
  .pie-source span,
  .pie-label-percent,
  .pie-label-value {
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.04em;
  }

  .pie-header p {
    margin: 0 0 0.5rem;
    text-transform: uppercase;
  }

  .pie-header h3 {
    margin: 0 0 0.35rem;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: clamp(1.25rem, 2vw, 1.75rem);
  }

  .pie-header div > span {
    color: var(--text-mid);
    font-size: 0.8125rem;
  }

  .pie-source {
    min-width: 96px;
    padding: 0.75rem;
    border: 1px solid rgba(124, 91, 240, 0.18);
    border-radius: 8px;
    background: rgba(124, 91, 240, 0.075);
    text-align: right;
  }

  .pie-source strong {
    display: block;
    color: var(--purple-light);
    font-family: var(--font-display);
    font-size: 1.5rem;
    line-height: 1;
  }

  .pie-body {
    display: grid;
    grid-template-columns: minmax(260px, 0.95fr) minmax(220px, 0.85fr);
    align-items: center;
    gap: 1.35rem;
    min-height: 330px;
  }

  .pie-chart {
    display: block;
    width: 100%;
    height: 330px;
    overflow: visible;
  }

  .pie-track {
    fill: none;
    stroke: rgba(255, 255, 255, 0.055);
    stroke-width: 48;
  }

  .pie-segment {
    stroke: rgba(16, 19, 30, 0.92);
    stroke-width: 2.4;
    filter: drop-shadow(0 0 14px rgba(52, 211, 153, 0.08));
    animation: pie-reveal 0.75s var(--ease-out-expo) both;
    transform-origin: 150px 150px;
  }

  .pie-segment.emphasis {
    filter: drop-shadow(0 0 22px rgba(52, 211, 153, 0.18));
  }

  .pie-segment.accent-emerald,
  .pie-swatch.accent-emerald {
    fill: rgba(52, 211, 153, 0.9);
    background: rgba(52, 211, 153, 0.9);
  }

  .pie-segment.accent-purple,
  .pie-swatch.accent-purple {
    fill: rgba(167, 139, 250, 0.88);
    background: rgba(167, 139, 250, 0.88);
  }

  .pie-segment.accent-cyan,
  .pie-swatch.accent-cyan {
    fill: rgba(56, 189, 248, 0.82);
    background: rgba(56, 189, 248, 0.82);
  }

  .pie-segment.accent-blue,
  .pie-swatch.accent-blue {
    fill: rgba(91, 141, 239, 0.86);
    background: rgba(91, 141, 239, 0.86);
  }

  .pie-segment.accent-amber,
  .pie-swatch.accent-amber {
    fill: rgba(251, 191, 36, 0.82);
    background: rgba(251, 191, 36, 0.82);
  }

  .pie-segment.accent-rose,
  .pie-swatch.accent-rose {
    fill: rgba(251, 113, 133, 0.82);
    background: rgba(251, 113, 133, 0.82);
  }

  @keyframes pie-reveal {
    from { opacity: 0.25; transform: scale(0.92) rotate(-8deg); }
    to { opacity: 1; transform: scale(1) rotate(0); }
  }

  .pie-core {
    fill: rgba(20, 24, 36, 0.94);
    stroke: rgba(255, 255, 255, 0.12);
    stroke-width: 1;
  }

  .pie-core-value,
  .pie-core-label {
    text-anchor: middle;
  }

  .pie-core-value {
    fill: var(--text-bright);
    font-family: var(--font-display);
    font-size: 2.1rem;
    font-weight: 700;
  }

  .pie-core-label {
    fill: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 0.625rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .pie-label-rail {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .pie-label-row {
    display: grid;
    grid-template-columns: 0.65rem minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 0.65rem;
    padding: 0.55rem 0.65rem;
    border: 1px solid rgba(255, 255, 255, 0.055);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.028);
  }

  .pie-label-row.primary {
    border-color: rgba(52, 211, 153, 0.16);
    background: rgba(52, 211, 153, 0.055);
  }

  .pie-swatch {
    width: 0.65rem;
    height: 0.65rem;
    border-radius: 999px;
    box-shadow: 0 0 14px currentColor;
  }

  .pie-label-name {
    min-width: 0;
    overflow: hidden;
    color: var(--text-bright);
    font-size: 0.875rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pie-label-percent {
    color: var(--text-mid);
  }

  .pie-label-value {
    min-width: 3.4rem;
    text-align: right;
  }

  .pie-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .pie-footer div {
    display: flex;
    gap: 0.5rem;
  }

  .pie-footer strong {
    padding: 0.35rem 0.5rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.045);
    color: var(--text-bright);
    font-weight: 600;
  }

  .timeline {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .timeline::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 24px;
    bottom: 24px;
    width: 1px;
    background: linear-gradient(180deg, var(--purple), var(--blue), var(--emerald));
    opacity: 0.25;
  }

  .timeline__item {
    position: relative;
    display: flex;
    gap: 1.25rem;
    padding: 1.25rem 0;
  }

  .timeline__node {
    position: relative;
    z-index: 2;
    display: flex;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #10131e;
  }

  .timeline__item:nth-child(1) .timeline__node {
    background: #10131e;
    border: 1px solid rgba(124, 91, 240, 0.3);
    box-shadow: 0 0 20px rgba(124, 91, 240, 0.15);
    color: var(--purple-light);
  }

  .timeline__item:nth-child(2) .timeline__node {
    background: #10131e;
    border: 1px solid rgba(91, 141, 239, 0.3);
    box-shadow: 0 0 20px rgba(91, 141, 239, 0.15);
    color: var(--blue);
  }

  .timeline__item:nth-child(3) .timeline__node {
    background: #10131e;
    border: 1px solid rgba(56, 189, 248, 0.3);
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.15);
    color: var(--cyan);
  }

  .timeline__item:nth-child(4) .timeline__node {
    background: #10131e;
    border: 1px solid rgba(52, 211, 153, 0.3);
    box-shadow: 0 0 20px rgba(52, 211, 153, 0.15);
    color: var(--emerald);
  }

  .timeline__content {
    padding-top: 0.25rem;
  }

  .timeline__title {
    margin: 0 0 0.25rem;
    color: var(--text-bright);
    font-family: var(--font-display);
    font-size: 0.9375rem;
    font-weight: 700;
  }

  :global(.timeline__content .s3__body) {
    max-width: none;
    margin: 0;
    color: var(--text-dim);
    font-size: 0.75rem;
    line-height: 1.6;
  }

  .reveal {
    opacity: 1;
    transform: translateY(0);
    animation: reveal-in 0.7s var(--ease-out-expo) both;
  }

  :global(.vstack > .reveal:nth-child(1)),
  :global(.timeline > .reveal:nth-child(1)) { animation-delay: 0.15s; }
  :global(.vstack > .reveal:nth-child(2)),
  :global(.timeline > .reveal:nth-child(2)) { animation-delay: 0.3s; }
  :global(.vstack > .reveal:nth-child(3)),
  :global(.timeline > .reveal:nth-child(3)) { animation-delay: 0.45s; }
  :global(.vstack > .reveal:nth-child(4)),
  :global(.timeline > .reveal:nth-child(4)) { animation-delay: 0.6s; }
  :global(.vstack > .reveal:nth-child(5)),
  :global(.timeline > .reveal:nth-child(5)) { animation-delay: 0.75s; }

  @keyframes reveal-in {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .unknown-node {
    color: #fb7185;
    font: 0.75rem/1.4 var(--font-mono);
  }

  @media (max-width: 820px) {
    .s3__layout {
      grid-template-columns: 1fr;
      gap: 2rem;
      padding: 6rem 1.5rem 2rem;
      align-content: center;
    }

    .s3__heading {
      font-size: 2rem;
    }

    .hero-heading {
      font-size: 2.75rem;
    }

    .metric-grid,
    .stat-row,
    .process-flow,
    .measurement-grid {
      grid-template-columns: 1fr;
    }

    .role-metrics-layout {
      width: min(100%, calc(100vw - 3rem));
      padding-top: 4rem;
      padding-bottom: 4rem;
    }
  }
  }
</style>
