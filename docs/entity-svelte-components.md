# Entity-directed Svelte components

The extension discovers trusted Svelte files in `zef-svelte-components/` when `npm run compile` runs.

Each component starts with a TOML header in an HTML comment and declares one or more entity types that it can render.

```svelte
<!-- +++
this = "ET.SvelteComponent('🍃-03b38e22608c60bc15dc')"
dispatched_on = ["ET.ScatterPlot"]
+++ -->

<script>
  export let data;
</script>
```

A JSON object in a `zef` fence is a rendering boundary when its `__type` matches a registered component.

````markdown
```zef
{
  "__type": "ET.ScatterPlot",
  "title": "Logical qubits vs T-depth"
}
```
````

The preview detects `data.__type`, resolves the registered component, and mounts it with `{ data }`. Other `zef` fences remain ordinary Zef source blocks.

A constructor-only Zen expression works too. When JSON parsing fails and the fence begins with `ET.`, the extension evaluates `<expression> | to_json_like | to_json | collect` with the local `zef` CLI, then dispatches on the converted `__type`.

````markdown
```zef
ET.ScatterPlot(
  title='Logical qubits vs T-depth',
  xAxis=ET.Axis(label='Logical qubits', domain=[0, 120]),
  yAxis=ET.Axis(label='T-depth', domain=[0, 90]),
  content_=[]
)
```
````

Nested entity-shaped values remain data owned by the selected component unless that component deliberately delegates a child slot to a later dispatcher.

New or changed files in `zef-svelte-components/` require `npm run compile` before they become part of the extension catalogue. Duplicate `dispatched_on` registrations cause the build to fail.
