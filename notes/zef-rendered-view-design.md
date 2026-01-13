# Rendered View for .zef.md Files - Design Exploration

## Goal
Show `.zef.md` files in a beautifully rendered mode in VS Code, with the ability to toggle between text/rendered view or show side-by-side.

---

## Approach 1: Webview Panel (Side Panel)

**How it works:**
- Create a Webview panel that renders markdown to HTML
- User triggers via command: "Zef: Show Preview"
- Panel updates live as user edits the source

**Implementation:**
```typescript
const panel = vscode.window.createWebviewPanel(
    'zefPreview',
    'Zef Preview',
    vscode.ViewColumn.Two,
    { enableScripts: true }
);
panel.webview.html = renderMarkdownToHtml(document.getText());
```

**Tradeoffs:**
| Pro | Con |
|-----|-----|
| Simple to implement | Separate panel, not integrated |
| Full control over rendering | Duplicates VS Code's markdown preview |
| Can add custom styling/interactivity | Two places to look at |
| Live updates possible | Webview state management needed |

**Verdict:** Good for MVP. Easy to implement, but feels like a second-class citizen.

---

## Approach 2: Custom Editor Provider (Replace Default Editor)

**How it works:**
- Register a Custom Editor for `*.zef.md` files
- User opens file → sees rendered view OR toggle button
- Can switch between "source" and "rendered" mode

**Implementation:**
```typescript
vscode.window.registerCustomEditorProvider(
    'zef.zefmdEditor',
    new ZefMdEditorProvider(),
    { webviewOptions: { retainContextWhenHidden: true } }
);
```

**Tradeoffs:**
| Pro | Con |
|-----|-----|
| First-class experience | Complex to implement |
| Toggle in same view | Must reimplement text editing |
| Can be the default for .zef.md | Custom editor = custom everything |
| Clean, focused UX | Lose VS Code text editor features |

**Verdict:** High effort, high reward. Best for polished product, not MVP.

---

## Approach 3: Markdown Preview Extension Point

**How it works:**
- Extend VS Code's built-in Markdown Preview
- Add custom CSS/JS for zef-specific rendering
- User uses standard "Markdown: Open Preview" command

**Implementation:**
```json
// package.json
"contributes": {
    "markdown.previewStyles": ["./styles/zef-preview.css"],
    "markdown.previewScripts": ["./scripts/zef-preview.js"]
}
```

**Tradeoffs:**
| Pro | Con |
|-----|-----|
| Uses existing infrastructure | Limited customization |
| Familiar UX (Cmd+Shift+V) | Can't add custom code block execution |
| Zero new code for basic preview | Tied to VS Code's markdown renderer |
| Free live updates | No toggle in same pane |

**Verdict:** Easiest path. Good enough for basic rendering, limited for custom features.

---

## Approach 4: Notebook-style Rendering (Custom Notebook)

**How it works:**
- Register `.zef.md` as a notebook type
- Each markdown section = markdown cell
- Each code block = code cell (with execute button)
- True notebook experience

**Implementation:**
```typescript
vscode.workspace.registerNotebookSerializer(
    'zef-notebook',
    new ZefNotebookSerializer()
);
```

**Tradeoffs:**
| Pro | Con |
|-----|-----|
| Native notebook experience | Major architectural change |
| Execute in place | File format changes meaning |
| Output cells inline | Complex serialization |
| Best for interactive docs | Overkill for simple preview |

**Verdict:** Most powerful, but changes the mental model. Good for "Zef as Jupyter alternative."

---

## Approach 5: Decorations + Folding (In-Editor Rendering)

**How it works:**
- Keep standard text editor
- Use decorations to render markdown inline (like some Obsidian-style editors)
- Fold code blocks, show rendered output

**Implementation:**
```typescript
// Render headings with larger, bold decorations
// Render images inline as decoration images
// Fold code blocks, show "▶ output" decoration
```

**Tradeoffs:**
| Pro | Con |
|-----|-----|
| Single pane, WYSIWYG-ish | Very complex decoration management |
| No context switch | Limited rendering capabilities |
| Edit and preview in one | Performance concerns |
| Novel UX | Decorations can't do full HTML |

**Verdict:** Innovative but fragile. High complexity, uncertain payoff.

---

## Recommendation: Top 3 Approaches

### 🥇 1. Webview Panel (MVP Choice)
**Why:** Fast to implement, proven pattern, decoupled from editing. Ship in 1-2 days.

**Implementation path:**
1. Add command "Zef: Open Preview to Side"
2. Create webview with marked.js or markdown-it
3. Listen to document changes, update webview
4. Style code blocks nicely, add syntax highlighting

---

### 🥈 2. Markdown Preview Extension (Zero-Effort)
**Why:** If basic preview is enough, just extend built-in preview.

**Implementation path:**
1. Add `markdown.previewStyles` with custom CSS
2. Add `markdown.previewScripts` for code block highlighting
3. Done. User uses Cmd+Shift+V.

---

### 🥉 3. Custom Editor Provider (Full Control)
**Why:** For a polished, toggle-in-place experience later.

**Implementation path:**
1. Implement CustomTextEditorProvider
2. Build webview-based editor
3. Add toggle button in editor title
4. Implement text editing in webview OR use VS Code's TextEditor API

---

## Decision Matrix

| Approach | Effort | UX Quality | Customization | Recommendation |
|----------|--------|------------|---------------|----------------|
| Webview Panel | Low | Good | High | ✅ MVP |
| Markdown Extension | Very Low | Okay | Low | ✅ Quick Win |
| Custom Editor | High | Excellent | Full | Later |
| Notebook | Very High | Different | Full | Different product |
| Decorations | High | Novel | Limited | Experimental |

---

## Next Steps

1. **Start with Webview Panel** - implement "Zef: Open Preview" command
2. **Add live sync** - update preview on document change
3. **Style it nicely** - custom CSS for zef branding
4. **Later: Custom Editor** - for toggle-in-place if needed
