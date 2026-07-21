<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();

  const pythonKeywords = new Set([
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else',
    'except', 'False', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'None',
    'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'True', 'try', 'while', 'with', 'yield'
  ]);

  const pythonBuiltins = new Set([
    'abs', 'all', 'any', 'bool', 'dict', 'enumerate', 'float', 'int', 'len', 'list', 'map', 'max', 'min',
    'range', 'round', 'set', 'str', 'sum', 'tuple', 'zip'
  ]);

  const source = $derived(node?.content ?? '');
  const filename = $derived(node?.filename ?? 'example.py');
  const language = $derived(node?.language ?? 'python');
  const caption = $derived(node?.caption ?? '');
  const showLineNumbers = $derived(node?.showLineNumbers !== false);
  const bodyStyle = $derived(node?.maxHeight ? `--code-block-max-height: ${node.maxHeight}` : '');
  const highlightSet = $derived(new Set(node?.highlightLines ?? []));
  const lines = $derived.by(() => tokenizePython(source, highlightSet));

  function tokenizePython(value, highlightedLines) {
    const rawLines = value.split('\n');
    let tripleQuote = null;

    return rawLines.map((rawLine, index) => {
      const lineNumber = index + 1;
      const tokens = [];
      let position = 0;
      let expectedDeclaration = false;

      while (position < rawLine.length) {
        if (tripleQuote) {
          const closingIndex = rawLine.indexOf(tripleQuote, position);
          if (closingIndex === -1) {
            tokens.push({ value: rawLine.slice(position), kind: 'string' });
            position = rawLine.length;
          } else {
            tokens.push({ value: rawLine.slice(position, closingIndex + 3), kind: 'string' });
            position = closingIndex + 3;
            tripleQuote = null;
          }
          continue;
        }

        const rest = rawLine.slice(position);
        const character = rawLine[position];

        if (/\s/.test(character)) {
          const match = rest.match(/^\s+/)[0];
          tokens.push({ value: match, kind: 'plain' });
          position += match.length;
          continue;
        }

        if (character === '#') {
          tokens.push({ value: rest, kind: 'comment' });
          break;
        }

        if (rest.startsWith('"""') || rest.startsWith("'''")) {
          const marker = rest.slice(0, 3);
          const closingIndex = rawLine.indexOf(marker, position + 3);
          if (closingIndex === -1) {
            tokens.push({ value: rawLine.slice(position), kind: 'string' });
            tripleQuote = marker;
            position = rawLine.length;
          } else {
            tokens.push({ value: rawLine.slice(position, closingIndex + 3), kind: 'string' });
            position = closingIndex + 3;
          }
          continue;
        }

        if (character === '"' || character === "'") {
          const quote = character;
          let cursor = position + 1;
          while (cursor < rawLine.length) {
            if (rawLine[cursor] === '\\') {
              cursor += 2;
              continue;
            }
            if (rawLine[cursor] === quote) {
              cursor += 1;
              break;
            }
            cursor += 1;
          }
          tokens.push({ value: rawLine.slice(position, cursor), kind: 'string' });
          position = cursor;
          continue;
        }

        if (character === '@') {
          const match = rest.match(/^@[A-Za-z_][\w.]*/)?.[0] ?? '@';
          tokens.push({ value: match, kind: 'decorator' });
          position += match.length;
          continue;
        }

        if (/\d/.test(character)) {
          const match = rest.match(/^\d[\d_]*(?:\.\d[\d_]*)?(?:e[+-]?\d+)?/i)?.[0] ?? character;
          tokens.push({ value: match, kind: 'number' });
          position += match.length;
          continue;
        }

        if (/[A-Za-z_]/.test(character)) {
          const word = rest.match(/^[A-Za-z_]\w*/)[0];
          let kind = 'identifier';
          if (expectedDeclaration) {
            kind = 'declaration';
            expectedDeclaration = false;
          } else if (pythonKeywords.has(word)) {
            kind = 'keyword';
            expectedDeclaration = word === 'def' || word === 'class';
          } else if (pythonBuiltins.has(word)) {
            kind = 'builtin';
          }
          tokens.push({ value: word, kind });
          position += word.length;
          continue;
        }

        tokens.push({ value: character, kind: 'operator' });
        position += 1;
      }

      return {
        lineNumber,
        highlighted: highlightedLines.has(lineNumber),
        tokens
      };
    });
  }
</script>

<figure class:wide={node?.size === 'wide'} class="code-block">
  <figcaption class="code-block__bar">
    <span class="code-block__file">{filename}</span>
    <span class="code-block__language">{language}</span>
  </figcaption>
  <div class="code-block__body" aria-label={`${language} code block`} role="img" style={bodyStyle}>
    {#each lines as line (line.lineNumber)}
      <div class:highlighted={line.highlighted} class="code-block__line">
        {#if showLineNumbers}
          <span class="code-block__number">{String(line.lineNumber).padStart(2, '0')}</span>
        {/if}
        <code class="code-block__source">
          {#each line.tokens as token}
            <span class={`token token--${token.kind}`}>{token.value}</span>
          {/each}
        </code>
      </div>
    {/each}
  </div>
  {#if caption}
    <figcaption class="code-block__caption">{caption}</figcaption>
  {/if}
</figure>

<style>
  .code-block {
    position: relative;
    width: min(620px, 100%);
    margin: 0;
    overflow: hidden;
    border: 1px solid rgba(167, 139, 250, 0.22);
    border-radius: 8px;
    background:
      radial-gradient(ellipse 52% 42% at 74% 8%, rgba(124, 91, 240, 0.12), transparent 68%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.018)),
      rgba(7, 10, 18, 0.94);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.045);
    text-align: left;
  }

  .code-block.wide {
    width: min(980px, 100%);
  }

  .code-block::before {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px),
      linear-gradient(180deg, rgba(255, 255, 255, 0.014) 1px, transparent 1px);
    background-size: 32px 32px;
    content: '';
    pointer-events: none;
  }

  .code-block__bar {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 0.9rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    color: var(--text-mid);
    font: 700 0.6875rem/1 var(--font-mono);
    letter-spacing: 0.04em;
  }

  .code-block__file {
    color: var(--text-bright);
  }

  .code-block__language {
    color: var(--purple-light);
    text-transform: uppercase;
  }

  .code-block__body {
    position: relative;
    z-index: 1;
    max-height: var(--code-block-max-height, 26rem);
    overflow: auto;
    padding: 0.85rem 0;
    text-align: left;
    scrollbar-color: rgba(167, 139, 250, 0.42) rgba(255, 255, 255, 0.045);
    scrollbar-width: thin;
  }

  .code-block.wide .code-block__body {
    max-height: var(--code-block-max-height, 30rem);
  }

  .code-block__body::-webkit-scrollbar {
    width: 0.65rem;
    height: 0.65rem;
  }

  .code-block__body::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.035);
  }

  .code-block__body::-webkit-scrollbar-thumb {
    border: 2px solid rgba(7, 10, 18, 0.94);
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(167, 139, 250, 0.58), rgba(56, 189, 248, 0.34));
  }

  .code-block__line {
    display: grid;
    min-width: max-content;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: baseline;
    padding: 0.02rem 1rem 0.02rem 0;
  }

  .code-block__line.highlighted {
    background: linear-gradient(90deg, rgba(124, 91, 240, 0.2), rgba(56, 189, 248, 0.07) 58%, transparent);
    box-shadow: inset 2px 0 0 var(--purple-light);
  }

  .code-block__number {
    width: 3.1rem;
    padding-right: 0.75rem;
    color: rgba(146, 153, 171, 0.42);
    font: 600 0.6875rem/1.65 var(--font-mono);
    text-align: right;
    user-select: none;
  }

  .code-block__source {
    color: #d7dbea;
    font: 0.75rem/1.65 var(--font-mono);
    letter-spacing: 0;
    text-align: left;
    white-space: pre;
  }

  .code-block__caption {
    position: relative;
    z-index: 1;
    margin: 0;
    padding: 0.75rem 0.9rem 0.85rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    color: var(--text-mid);
    font: 500 0.75rem/1.45 var(--font-body);
  }

  .token--keyword {
    color: var(--purple-light);
    font-weight: 700;
  }

  .token--declaration,
  .token--decorator {
    color: var(--cyan);
    font-weight: 700;
  }

  .token--builtin {
    color: #8bd7ff;
  }

  .token--string {
    color: #86efac;
  }

  .token--number {
    color: #fbbf24;
  }

  .token--comment {
    color: rgba(146, 153, 171, 0.62);
  }

  .token--operator {
    color: rgba(238, 240, 244, 0.76);
  }
</style>