# Entity-directed Svelte components and Zef Slides

## Entity-directed components

The extension renders trusted, reusable Svelte components from typed Zef entity data.

- Component sources live in `zef-svelte-components/`.
- Each source has a TOML header declaring the root entity type or types it owns.
- `npm run compile` scans those headers and writes `src/generated/zefSvelteComponentCatalog.ts`.
- The generated catalogue is static: document data chooses among bundled components but cannot load arbitrary modules.
- At preview time, a `zef` fence is parsed as JSON first; if it starts with `ET.` and is not JSON, the extension evaluates it with the local CLI through `to_json_like | to_json | collect`.
- If the resulting root value has a catalogue type, the preview mounts that component with one prop: `{ data }`.

A component is a deliberate render boundary. Its nested entity values remain ordinary data that the component owns; they are not recursively dispatched as separate Svelte components.

```svelte
<!-- +++
this = "ET.SvelteComponent('🍃-03b38e22608c60bc15dc')"
dispatched_on = "ET.ScatterPlot"
+++ -->

<script>
  export let data;
</script>
```

The current bundled component roots are:

| Root entity | Nested data it interprets |
| --- | --- |
| `ET.ScatterPlot` | `ET.Axis`, `ET.PointSeries`, `ET.DataPoint`, `ET.HoverAnnotation` |
| `ET.LinePlot` | `ET.Axis`, `ET.LineSeries`, `ET.DataPoint`, `ET.HoverAnnotation` |
| `ET.TerminalAnimation` | `ET.TerminalComment`, `ET.TerminalCommand`, `ET.TerminalOutput`, `ET.Typing`, `ET.Loop` |
| `ET.WorkflowTimeline` | `ET.WorkflowStep`, `ET.WorkflowPlayback` |

### Authoring data

JSON-shaped data is useful when the source is already JSON.

````markdown
```zef
{
  "__type": "ET.ScatterPlot",
  "title": "CI strategy frontier",
  "content_": []
}
```
````

Constructor-style Zen is usually more readable for nested values.

````markdown
```zef
ET.TerminalAnimation(
  title='Release preview',
  typing=ET.Typing(charDelay=0.05),
  content_=[
    ET.TerminalCommand(
      content='zef doctor',
      content_=[ET.TerminalOutput(content='✓ Ready', tone='success')]
    )
  ]
)
```
````

All component timing fields use SI seconds and accept integers or floats. For example, `charDelay=0.05`, `holdAfter=1`, and `finalHold=4` mean 50 ms, one second, and four seconds respectively. Components convert seconds to browser timer units only at the DOM boundary.

### Creating or changing a component

1. Add or modify a `.svelte` file under `zef-svelte-components/`.
2. Give it a TOML header with `this = "ET.SvelteComponent(...)"` and `dispatched_on`.
3. Use a unique root type. The catalogue generator rejects duplicate owners.
4. Run `npm run compile`; this regenerates the catalogue and validates the TypeScript build.
5. Run `python3 build.py dev` to package and install the local extension, then reload VS Code.

Use plain entity data and a small, validated vocabulary of fields. Keep timers, DOM access, scrolling, pointer handling, reduced-motion behavior, and styling in the trusted component rather than in document data.

## Zef Slides

Zef Slides is a separate, data-driven presentation runtime. It is not an entity-directed Svelte catalogue component.

- A `zef` fence whose source begins with `ET.ZefSlides(` is recognised as a slide deck.
- The extension converts the Zen expression with the local `zef` CLI, then supplies the resulting JSON value to the bundled `slides-runtime` iframe.
- A document supports one `ET.ZefSlides` fence for the slide panel.
- The deck root owns ordered `ET.Slide` values in `content_`.
- Each slide owns an entity tree such as `ET.VStack`, `ET.Title`, `ET.Paragraph`, and `ET.BulletList`.
- The trusted slide runtime maps this closed entity vocabulary to its own Svelte renderers and owns navigation, progressive `steps_`, and presentation chrome.

The same design principle applies in both systems: authored data describes domain content and structure, while trusted bundled code owns rendering behavior and interaction.

````markdown
```zef
ET.ZefSlides(
  brand='Zef',
  content_=[
    ET.Slide(
      frame='plain-readable',
      content_=[
        ET.VStack(
          role='readable-layout',
          content_=[
            ET.Eyebrow(value='Zef Slides'),
            ET.Title(value='One entity tree, one slide', level=2),
            ET.Paragraph(value='The runtime turns typed data into a navigable presentation.')
          ]
        )
      ]
    )
  ]
)
```
````

Use **Zef: Open Slides** to open the dedicated presentation panel. In the ordinary preview, the fence also offers rendered and source views plus a pop-out control.
