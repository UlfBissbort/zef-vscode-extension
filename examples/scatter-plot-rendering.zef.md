# Entity-directed scatter plot

The following typed fence is resolved through the Svelte component catalogue.

```zef
{
  "__type": "ET.ScatterPlot",
  "title": "Logical qubits vs T-depth",
  "subtitle": "Illustrative Pareto frontier for candidate decompositions",
  "xAxis": {
    "__type": "ET.Axis",
    "label": "Logical qubits",
    "unit": "k",
    "domain": [0, 120]
  },
  "yAxis": {"__type": "ET.Axis", "label": "T-depth", "unit": "M", "domain": [0, 90]},
  "source": {"__type": "ET.DataSource", "label": "compiled variants", "sampleSize": 16},
  "encoding": "each point is one compiled candidate; lower-left is better",
  "trendLine": {"from": {"x": 8, "y": 78}, "to": {"x": 112, "y": 18}},
  "content_": [
    {
      "__type": "ET.PointSeries",
      "label": "Candidates",
      "accent": "emerald",
      "content_": [
        {"__type": "ET.DataPoint", "x": 10, "y": 78, "label": "Tiny memory"},
        {"__type": "ET.DataPoint", "x": 18, "y": 68},
        {"__type": "ET.DataPoint", "x": 26, "y": 61},
        {"__type": "ET.DataPoint", "x": 34, "y": 53},
        {"__type": "ET.DataPoint", "x": 43, "y": 47, "emphasis": "highlight"},
        {"__type": "ET.DataPoint", "x": 52, "y": 42},
        {"__type": "ET.DataPoint", "x": 61, "y": 37},
        {"__type": "ET.DataPoint", "x": 70, "y": 33},
        {
          "__type": "ET.DataPoint",
          "x": 82,
          "y": 29,
          "label": "Balanced",
          "emphasis": "highlight"
        },
        {"__type": "ET.DataPoint", "x": 94, "y": 25},
        {"__type": "ET.DataPoint", "x": 108, "y": 21, "label": "Fast path"}
      ]
    }
  ],
  "annotations": [
    {"label": "Frontier", "value": "11 viable"},
    {"label": "Selected", "value": "balanced"}
  ]
}
```
