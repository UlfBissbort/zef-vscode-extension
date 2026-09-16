+++
ET.MarkdownDocument('🍃-7e218eb5f83b23b170b3',
  title='Zef Slides Component Atlas.zef',
  importance=1,
  tag_=[],
  created=Time('2026-09-07 20:29:41 +0800')
)
+++

# Zef Slides Component Atlas

A deliberately elaborate, single-deck reference for the Zef Slides runtime. Open this document and run **Zef: Open Slides**.

```zef
ET.ZefSlides(
  brand='Zef Slides',
  title='Component Atlas',
  content_=[
    ET.Slide(
      id='atlas-hero', frame='orbital-hero', ariaLabel='Zef Slides component atlas',
      content_=[ET.VStack(role='hero-content', alignment='center', spacing='xl', content_=[
        ET.Badge(value='REFERENCE DECK', icon='spark'),
        ET.Title(value='Zef Slides Component Atlas', level=1, emphasis='Component Atlas', lineBreaks=['Zef Slides', 'Component Atlas']),
        ET.Paragraph(role='hero-subtitle', value='One typed deck demonstrating layouts, narrative components, data views, diagrams, progressive stages, and presentation controls.'),
        ET.ActionGroup(content_=[
          ET.CallToAction(label='Browse the catalogue', icon='arrow-right', variant='primary', action='navigate:/catalogue'),
          ET.CallToAction(label='Inspect the data', icon='braces', variant='ghost', action='navigate:/data')
        ])
      ])]
    ),
    ET.Slide(
      id='layout-primitives', frame='plain-readable', ariaLabel='Layout primitives',
      content_=[ET.HStack(alignment='top', distribution='equal', content_=[
        ET.VStack(alignment='leading', spacing='lg', content_=[
          ET.Eyebrow(value='LAYOUT PRIMITIVES', accent='cyan'),
          ET.Title(value='VStack, HStack, Spacer', level=2),
          ET.Paragraph(value='Composition is ordinary data: vertical stacks organise reading order, horizontal stacks create columns, and spacers create deliberate breathing room.'),
          ET.Spacer(),
          ET.QuotePanel(quote='The slide is a tree, not a screenshot.', attribution='Zef Slides')
        ]),
        ET.VStack(alignment='leading', spacing='md', content_=[
          ET.FeatureList(content_=[
            ET.FeatureItem(icon='braces', title='VStack', description='A vertical content container with alignment and spacing.'),
            ET.FeatureItem(icon='presentation', title='HStack', description='A horizontal content container with distribution.'),
            ET.FeatureItem(icon='spark', title='Spacer', description='Intentional visual pause without a magic pixel offset.')
          ]),
          ET.CodeBlock(filename='layout.zen', language='zef', content="ET.HStack(content_=[ET.VStack(content_=[...]), ET.VStack(content_=[...])])", highlightLines=[1], caption='The authored structure stays inspectable.')
        ])
      ])]
    ),
    ET.Slide(
      id='narrative-components', frame='plain-readable', ariaLabel='Narrative components',
      content_=[ET.VStack(alignment='center', spacing='xl', content_=[
        ET.Eyebrow(value='NARRATIVE COMPONENTS', accent='purple'),
        ET.Title(value='Make the argument readable before making it decorative', level=2),
        ET.MetricGrid(content_=[
          ET.MetricCard(value='01', label='Orient', description='Eyebrow, title, and paragraph establish a point of view.', accent='cyan'),
          ET.MetricCard(value='02', label='Support', description='Bullets, features, and quotes make the claim testable.', accent='purple'),
          ET.MetricCard(value='03', label='Invite', description='Calls to action turn the final frame into a next step.', accent='emerald')
        ]),
        ET.OutcomeStatement(primaryValue='Typed', primaryLabel='presentation data', constraintLead='Not', constraintDetail='a pile of positioned DOM nodes', finalLead='Built for', finalDetail='review and reuse')
      ])]
    ),
    ET.Slide(
      id='progressive-reading', frame='progressive-readable', ariaLabel='Progressive reading',
      steps_=[{'id': 'claim'}, {'id': 'evidence'}, {'id': 'choice'}],
      content_=[ET.VStack(role='readable-layout', alignment='leading', spacing='lg', content_=[
        ET.Eyebrow(value='PROGRESSIVE STAGES', accent='emerald'),
        ET.Title(value='Reveal an argument at the speed of attention', level=2),
        ET.StagedBulletList(marker='number', content_=[
          ET.BulletItem(value='State one clear claim.', revealAt='claim'),
          ET.BulletItem(value='Reveal only the evidence that earns the next conclusion.', revealAt='evidence'),
          ET.BulletItem(value='Leave the audience with an explicit choice or action.', revealAt='choice')
        ]),
        ET.StageHint(value='Press Space to advance a stage; arrows move between slides.'),
        ET.StatRow(content_=[
          ET.StatPill(value='3', label='stages', icon='spark', accent='cyan'),
          ET.StatPill(value='0', label='surprises', icon='braces', accent='purple'),
          ET.StatPill(value='1', label='argument', icon='arrow-right', accent='emerald')
        ])
      ])]
    ),
    ET.Slide(
      id='process-and-transformation', frame='plain-readable', ariaLabel='Process and transformation',
      content_=[ET.VStack(alignment='center', spacing='lg', content_=[
        ET.Eyebrow(value='FLOWS', accent='cyan'),
        ET.Title(value='Explain a process without drawing it by hand', level=2),
        ET.ProcessFlow(content_=[
          ET.ProcessStep(icon='document', title='Author', description='Declare a deck as a Zen entity tree.'),
          ET.ProcessStep(icon='braces', title='Convert', description='The extension converts the source to JSON-like data.'),
          ET.ProcessStep(icon='presentation', title='Render', description='Trusted Svelte components render the typed nodes.'),
          ET.ProcessStep(icon='spark', title='Present', description='The runtime owns navigation, staging, and fullscreen.')
        ]),
        ET.TransformationPipeline(title='The rendering boundary', subtitle='Data remains data; behaviour belongs to trusted code.', fromLabel='Zen', fromDetail='ET.ZefSlides(...)', effectLabel='convert + render', toLabel='Presentation', toDetail='interactive runtime')
      ])]
    ),
    ET.Slide(
      id='variables-and-derivation', frame='physics-equation', ariaLabel='Variables and derivation',
      content_=[ET.HStack(alignment='top', distribution='equal', content_=[
        ET.VStack(alignment='leading', spacing='lg', content_=[
          ET.Eyebrow(value='EXPLAIN THE MODEL', accent='purple'),
          ET.Title(value='Variables and derivations are first-class visual language', level=2),
          ET.VariableTable(content_=[
            ET.Variable(symbol='D', meaning='deck data'),
            ET.Variable(symbol='R', meaning='trusted runtime'),
            ET.Variable(symbol='P', meaning='presented slide')
          ]),
          ET.Equation(label='Runtime relation', expression='P = R(D)')
        ]),
        ET.DerivationPanel(title='A small derivation', content_=[
          ET.DerivationStep(index='1', statement='A deck is structured, reviewable data.', equation='D = ET.ZefSlides(...)'),
          ET.DerivationStep(index='2', statement='A renderer maps known types to trusted components.', equation='R: D → UI'),
          ET.DerivationStep(index='3', statement='The result is navigable without embedding imperative behaviour in content.', equation='P = R(D)')
        ])
      ])]
    ),
    ET.Slide(
      id='histogram', frame='data-histogram', ariaLabel='Histogram plot',
      content_=[ET.VStack(alignment='center', spacing='lg', content_=[
        ET.Eyebrow(value='DATA COMPONENT: HISTOGRAM', accent='emerald'),
        ET.HistogramPlot(
          title='Slides by component density', subtitle='A fictional inspection of this reference deck.',
          xAxis={'label': 'components per slide', 'unit': ''}, yAxis={'label': 'slides'},
          source={'sampleSize': 13, 'label': 'slides'}, binning={'strategy': 'fixed width', 'width': 2},
          annotations=[{'label': 'peak', 'value': 'composition-heavy'}],
          content_=[ET.BinnedSeries(content_=[
            ET.Bin(start=0, end=2, count=1), ET.Bin(start=2, end=4, count=3),
            ET.Bin(start=4, end=6, count=5, emphasis='peak'), ET.Bin(start=6, end=8, count=3), ET.Bin(start=8, end=10, count=1)
          ])]
        ),
        ET.Paragraph(value='HistogramPlot consumes a BinnedSeries with Bin values. The plotting algorithm stays in the runtime.')
      ])]
    ),
    ET.Slide(
      id='pie-and-scatter', frame='data-scatter', ariaLabel='Pie and scatter plots',
      content_=[ET.HStack(alignment='top', distribution='equal', content_=[
        ET.PieChart(title='Component families', subtitle='A compact part-to-whole view.', dimension='family', measure='components', unit='', source={'sampleSize': 30, 'label': 'renderers'}, encoding='arc area encodes share', content_=[
          ET.PieSegment(label='structure', value=8, accent='purple', emphasis='primary'),
          ET.PieSegment(label='narrative', value=9, accent='cyan'),
          ET.PieSegment(label='data', value=7, accent='emerald'),
          ET.PieSegment(label='diagrams', value=6, accent='blue')
        ]),
        ET.ScatterPlot(title='Complexity and attention', subtitle='Fictional points, real component grammar.', xAxis={'label': 'component count', 'domain': [0, 10]}, yAxis={'label': 'reading effort', 'domain': [0, 10]}, source={'sampleSize': 5, 'label': 'slides'}, content_=[
          ET.PointSeries(label='slides', accent='cyan', content_=[
            ET.DataPoint(x=2, y=2, label='claim'), ET.DataPoint(x=4, y=4, label='flow'), ET.DataPoint(x=5, y=5, label='chart'), ET.DataPoint(x=7, y=8, label='atlas'), ET.DataPoint(x=9, y=9, label='too much')
          ])
        ])
      ])]
    ),
    ET.Slide(
      id='circular-and-layered', frame='composition-map', ariaLabel='Circular and layered diagrams',
      content_=[ET.HStack(alignment='center', distribution='equal', content_=[
        ET.CircularFlow(title='Presentation loop', subtitle='A deck improves through review.', centerLabel='Review', centerSubtitle='the source', content_=[
          ET.FlowSegment(label='Author', detail='declare', accentColor='#a78bfa'),
          ET.FlowSegment(label='Render', detail='inspect', accentColor='#38bdf8'),
          ET.FlowSegment(label='Present', detail='share', accentColor='#34d399'),
          ET.FlowSegment(label='Revise', detail='learn', accentColor='#5b8def')
        ]),
        ET.LayeredStack(title='Runtime layers', subtitle='Each layer has one job.', content_=[
          ET.StackLayer(label='Deck data', detail='ET.ZefSlides and children', accent='purple'),
          ET.StackLayer(label='Converter', detail='Zen to portable value', accent='cyan'),
          ET.StackLayer(label='Runtime', detail='trusted Svelte renderers', accent='emerald'),
          ET.StackLayer(label='Panel', detail='navigation and fullscreen', accent='blue')
        ])
      ])]
    ),
    ET.Slide(
      id='capabilities', frame='plain-readable', ariaLabel='Capability map and system radar',
      content_=[ET.HStack(alignment='top', distribution='equal', content_=[
        ET.CapabilityMap(title='Capability map', subtitle='A deliberately broad catalogue.', centerLabel='Zef Slides', centerSubtitle='typed presentations', historyLabel='from source to stage', content_=[
          ET.Capability(id='author', label='Author', icon='braces', accent='purple'),
          ET.Capability(id='visualise', label='Visualise', icon='presentation', accent='cyan'),
          ET.Capability(id='navigate', label='Navigate', icon='arrow-right', accent='emerald'),
          ET.Capability(id='review', label='Review', icon='document', accent='blue')
        ]),
        ET.SystemRadar(title='Runtime radar', subtitle='A qualitative capability view.', centerLabel='Zef', centerValue='Ready', scaleLabel='coverage', content_=[
          ET.RadarAxis(label='layout', value=9, accent='purple'), ET.RadarAxis(label='narrative', value=9, accent='cyan'),
          ET.RadarAxis(label='data', value=8, accent='emerald'), ET.RadarAxis(label='interaction', value=8, accent='blue')
        ])
      ])]
    ),
    ET.Slide(
      id='flow-diagram', frame='plain-readable', ariaLabel='Flow diagram',
      content_=[ET.VStack(alignment='center', spacing='lg', content_=[
        ET.Eyebrow(value='DIAGRAM COMPONENT: FLOW DIAGRAM', accent='cyan'),
        ET.FlowDiagram(title='Deck delivery path', subtitle='Nodes and edges are plain data.', accent='cyan', content_=[
          ET.FlowNode(id='source', x=18, y=50, label='Source', subtitle='zef fence', icon='document', accent='purple'),
          ET.FlowNode(id='convert', x=50, y=50, label='Convert', subtitle='local CLI', icon='braces', accent='cyan'),
          ET.FlowNode(id='runtime', x=82, y=50, label='Runtime', subtitle='slides panel', icon='presentation', accent='emerald'),
          ET.FlowEdge(from='source', to='convert'), ET.FlowEdge(from='convert', to='runtime')
        ]),
        ET.Paragraph(value='FlowDiagram uses positioned FlowNode and FlowEdge values; the renderer owns routes and arrow geometry.')
      ])]
    ),
    ET.Slide(
      id='product-timeline', frame='plain-readable', ariaLabel='Product timeline',
      content_=[ET.VStack(alignment='center', spacing='lg', content_=[
        ET.Eyebrow(value='TIMELINE COMPONENTS', accent='emerald'),
        ET.ProductTimeline(title='A deck from idea to delivery', subtitle='A product-style horizontal timeline.', startLabel='idea', endLabel='presentation', progress=0.68, progressLabel='runtime complete', content_=[
          ET.TimelineMilestone(label='Model', detail='entity vocabulary', position=0.1, accent='purple'),
          ET.TimelineMilestone(label='Render', detail='Svelte dispatch', position=0.38, accent='cyan'),
          ET.TimelineMilestone(label='Navigate', detail='keys and overview', position=0.68, accent='emerald'),
          ET.TimelineMilestone(label='Publish', detail='share the deck', position=0.92, accent='blue')
        ]),
        ET.SwimlaneFlow(title='Parallel work, one presentation', subtitle='A compact multi-lane plan.', lanes=[{'id': 'content', 'label': 'Content'}, {'id': 'runtime', 'label': 'Runtime'}, {'id': 'review', 'label': 'Review'}], content_=[
          ET.FlowNode(id='write', lane='content', row=0, label='Write deck', meta='authoring'),
          ET.FlowNode(id='render', lane='runtime', row=0, label='Render types', meta='runtime'),
          ET.FlowNode(id='inspect', lane='review', row=0, label='Inspect', meta='feedback'),
          ET.FlowEdge(from='write', to='render'), ET.FlowEdge(from='render', to='inspect')
        ])
      ])]
    ),
    ET.Slide(
      id='closing', frame='section-divider', ariaLabel='Closing slide',
      content_=[ET.VStack(role='section-divider-content', alignment='center', spacing='xl', content_=[
        ET.Badge(value='END OF ATLAS', icon='spark'),
        ET.Title(value='Author the meaning. Let the runtime own the mechanics.', level=1, lineBreaks=['Author the meaning.', 'Let the runtime own the mechanics.']),
        ET.Paragraph(role='hero-subtitle', value='This deck is intentionally broad: use it as a source-level component reference, then copy the pieces that earn their place in a real presentation.'),
        ET.ActionGroup(content_=[
          ET.CallToAction(label='Open the data view', icon='braces', variant='primary', action='navigate:/data'),
          ET.CallToAction(label='Return to slide one', icon='arrow-right', variant='ghost', action='navigate:/start')
        ])
      ])]
    )
  ]
)
```
