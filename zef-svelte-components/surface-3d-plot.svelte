<!-- +++
this = "ET.SvelteComponent('🍃-6ac7039e5e8b41c2f94d')"
tag_ = []
dispatched_on = "ET.Surface3dPlot"
created = "Time('2026-08-15 19:20:00 +0800')"
[ns]
"ET.Surface3dPlot" = "ET('537572666163653364506c6f74')"
+++ -->

<script>
  import { onDestroy, onMount, tick } from 'svelte';
  import { parse } from 'acorn';
  import * as THREE from 'three';

  /** A trusted WebGL renderer for a restricted JavaScript mathematical formula. */
  export let data;
  let host;
  let plot;
  let error = '';
  let isFullWidth = false;
  let renderer;
  let animationFrame;
  let disposeScene = () => {};

  const math = Object.freeze({ abs: Math.abs, cos: Math.cos, exp: Math.exp, hypot: Math.hypot, max: Math.max, min: Math.min, pow: Math.pow, sin: Math.sin, sqrt: Math.sqrt, tan: Math.tan });

  function compileFormula(body) {
    if (typeof body !== 'string' || body.length > 10_000) throw new Error('formula body must be a string shorter than 10,000 characters');
    const program = parse(`function __surface__(x, y) {\n${body}\n}`, { ecmaVersion: 2022 });
    const statements = program.body[0]?.body?.body ?? [];
    if (statements.length === 0) throw new Error('formula body is empty');
    const result = statements.at(-1);
    if (result.type !== 'ReturnStatement' || !result.argument) throw new Error('formula body must end with return <expression>;');
    if (statements.slice(0, -1).some(statement => statement.type !== 'VariableDeclaration' || statement.kind !== 'const')) throw new Error('only const declarations may precede return');
    const evaluate = (node, scope) => {
      switch (node.type) {
        case 'Literal': if (typeof node.value !== 'number') throw new Error('only numeric literals are allowed'); return node.value;
        case 'Identifier': if (!(node.name in scope)) throw new Error(`unknown identifier: ${node.name}`); return scope[node.name];
        case 'UnaryExpression': { const value = evaluate(node.argument, scope); if (node.operator === '+') return value; if (node.operator === '-') return -value; throw new Error(`operator ${node.operator} is not allowed`); }
        case 'BinaryExpression': { const a = evaluate(node.left, scope), b = evaluate(node.right, scope); switch (node.operator) { case '+': return a + b; case '-': return a - b; case '*': return a * b; case '/': return a / b; case '%': return a % b; case '**': return a ** b; default: throw new Error(`operator ${node.operator} is not allowed`); } }
        case 'CallExpression': {
          if (node.callee.type !== 'MemberExpression' || node.callee.computed || node.callee.object.type !== 'Identifier' || node.callee.object.name !== 'Math' || node.callee.property.type !== 'Identifier' || !(node.callee.property.name in math)) throw new Error('only approved Math functions are allowed');
          return math[node.callee.property.name](...node.arguments.map(argument => evaluate(argument, scope)));
        }
        default: throw new Error(`${node.type} is not allowed in a surface formula`);
      }
    };
    return (x, y) => {
      const scope = { x, y };
      for (const statement of statements.slice(0, -1)) for (const declaration of statement.declarations) {
        if (declaration.id.type !== 'Identifier' || !declaration.init) throw new Error('const declarations require an identifier and initializer');
        scope[declaration.id.name] = evaluate(declaration.init, scope);
      }
      const value = evaluate(result.argument, scope);
      return Number.isFinite(value) ? value : 0;
    };
  }

  function colorFor(t) {
    const color = new THREE.Color();
    if (t < 0.25) color.setHSL(0.74 - t * 0.24, 0.55 + t * 0.6, 0.06 + t * 0.4);
    else if (t < 0.5) color.setHSL(0.68 - (t - 0.25) * 0.4, 0.7 + (t - 0.25) * 0.4, 0.16 + (t - 0.25) * 0.48);
    else if (t < 0.75) color.setHSL(0.58 - (t - 0.5) * 0.24, 0.8, 0.28 + (t - 0.5) * 0.48);
    else color.setHSL(0.52 - (t - 0.75) * 0.12, 0.9, 0.4 + (t - 0.75) * 0.8);
    return color;
  }

  function renderSurface(plot) {
    disposeScene();
    error = '';
    if (!host || plot?.__type !== 'ET.Surface3dPlot') return;
    try {
      const formula = plot.function?.__type === 'ET.SurfaceFunction' ? compileFormula(plot.function.body) : (() => { throw new Error('Surface3dPlot requires function=ET.SurfaceFunction(body=...)'); })();
      const domain = plot.domain?.__type === 'ET.SurfaceDomain' ? plot.domain : {};
      const [x0, x1] = Array.isArray(domain.x) ? domain.x : [-10, 10];
      const [y0, y1] = Array.isArray(domain.y) ? domain.y : [-10, 10];
      const segments = Math.max(12, Math.min(120, Math.round(plot.samples ?? 80)));
      const scene = new THREE.Scene();
      // Leave the WebGL clear area transparent so the plot inherits the host page background.
      scene.background = null;
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
      const spherical = { theta: Math.PI / 4, phi: Math.PI / 3.1, radius: 34 };
      const target = new THREE.Vector3(0, -1, 0);
      const updateCamera = () => { camera.position.set(target.x + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta), target.y + spherical.radius * Math.cos(spherical.phi), target.z + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta)); camera.lookAt(target); };
      updateCamera();
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      host.replaceChildren(renderer.domElement);
      const group = new THREE.Group(); scene.add(group);
      const positions = [], colors = [], indices = [], values = [];
      for (let j = 0; j <= segments; j += 1) for (let i = 0; i <= segments; i += 1) {
        const x = x0 + (x1 - x0) * i / segments, y = y0 + (y1 - y0) * j / segments, z = formula(x, y);
        positions.push(x, z, y); values.push(z);
      }
      const low = Math.min(...values), high = Math.max(...values), span = high - low || 1;
      values.forEach(z => { const c = colorFor((z - low) / span); colors.push(c.r, c.g, c.b); });
      for (let j = 0; j < segments; j += 1) for (let i = 0; i < segments; i += 1) { const a = j * (segments + 1) + i, b = a + 1, c = a + segments + 1, d = c + 1; indices.push(a, c, b, b, c, d); }
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
      const material = new THREE.MeshPhysicalMaterial({ vertexColors: true, metalness: 0.25, roughness: 0.7, clearcoat: 0.4, clearcoatRoughness: 0.3, side: THREE.DoubleSide });
      group.add(new THREE.Mesh(geometry, material));
      const gridMaterial = new THREE.LineBasicMaterial({ color: 0x1a1a3a, transparent: true, opacity: 0.7 });
      const gridEvery = Math.max(1, Math.round(plot.gridEvery ?? 4));
      const at = (i, j) => new THREE.Vector3(positions[(j * (segments + 1) + i) * 3], positions[(j * (segments + 1) + i) * 3 + 1] + 0.035, positions[(j * (segments + 1) + i) * 3 + 2]);
      for (let n = 0; n <= segments; n += gridEvery) { group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: segments + 1 }, (_, i) => at(i, n))), gridMaterial)); group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: segments + 1 }, (_, j) => at(n, j))), gridMaterial)); }
      scene.add(new THREE.AmbientLight(0x1a1a3f, 0.6)); scene.add(new THREE.HemisphereLight(0x4466aa, 0x112244, 0.5));
      const lights = [[0x8899cc, 1.2, [10, 18, 12]], [0x3355aa, 0.6, [-14, 8, -8]], [0x44ccdd, 0.4, [-4, 12, 18]]];
      lights.forEach(([color, intensity, position]) => { const light = new THREE.DirectionalLight(color, intensity); light.position.set(...position); scene.add(light); });
      const glow = new THREE.PointLight(0x5588cc, 0.8, 40); glow.position.set(0, 8, 0); scene.add(glow);
      let dragging = false, previous;
      const pointerDown = event => { dragging = true; previous = [event.clientX, event.clientY]; renderer.domElement.setPointerCapture(event.pointerId); };
      const pointerMove = event => { if (!dragging) return; spherical.theta += (event.clientX - previous[0]) * 0.008; spherical.phi = Math.max(0.18, Math.min(Math.PI - 0.18, spherical.phi - (event.clientY - previous[1]) * 0.008)); previous = [event.clientX, event.clientY]; updateCamera(); };
      const pointerUp = () => { dragging = false; };
      const wheel = event => { event.preventDefault(); spherical.radius = Math.max(15, Math.min(60, spherical.radius + event.deltaY * 0.02)); updateCamera(); };
      renderer.domElement.addEventListener('pointerdown', pointerDown); renderer.domElement.addEventListener('pointermove', pointerMove); renderer.domElement.addEventListener('pointerup', pointerUp); renderer.domElement.addEventListener('wheel', wheel, { passive: false });
      const resize = () => { const rect = host.getBoundingClientRect(); renderer.setSize(rect.width, rect.height, false); camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix(); };
      const observer = new ResizeObserver(resize); observer.observe(host); resize();
      const animate = () => { animationFrame = requestAnimationFrame(animate); renderer.render(scene, camera); }; animate();
      disposeScene = () => { cancelAnimationFrame(animationFrame); observer.disconnect(); renderer.domElement.removeEventListener('pointerdown', pointerDown); renderer.domElement.removeEventListener('pointermove', pointerMove); renderer.domElement.removeEventListener('pointerup', pointerUp); renderer.domElement.removeEventListener('wheel', wheel); geometry.dispose(); material.dispose(); gridMaterial.dispose(); renderer.dispose(); };
    } catch (caught) { error = caught instanceof Error ? caught.message : String(caught); }
  }

  function toggleFullWidth() { isFullWidth = !isFullWidth; window.parent.postMessage({ type: 'zefEntityToggleFullWidth', entityType: 'ET.Surface3dPlot' }, '*'); requestAnimationFrame(() => requestAnimationFrame(reportHeight)); }
  function reportHeight() { if (plot) window.parent.postMessage({ type: 'zefEntityResize', height: Math.ceil(plot.getBoundingClientRect().height) }, '*'); }
  onMount(() => { renderSurface(data); reportHeight(); });
  onDestroy(() => disposeScene());
  $: if (host) { renderSurface(data); void tick().then(reportHeight); }
</script>

{#if data?.__type === 'ET.Surface3dPlot'}
  <section bind:this={plot} class:full-width={isFullWidth} class="surface-plot" aria-label={data.title ?? '3D surface plot'}>
    {#if data.title || data.subtitle}<header><div>{#if data.title}<h2>{data.title}</h2>{/if}{#if data.subtitle}<p>{data.subtitle}</p>{/if}</div></header>{/if}
    <div class="stage"><div bind:this={host} class="canvas" aria-label="Drag to orbit; scroll to zoom"></div><button type="button" title="Toggle full width" aria-label="Toggle full width" onclick={toggleFullWidth}><svg viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></svg></button></div>
    <footer><code>drag to orbit · scroll to zoom</code><span>{data.theme ?? 'deep ocean'} lighting</span></footer>
    {#if error}<p class="error">{error}</p>{/if}
  </section>
{:else}<p class="error">Surface3dPlot requires an <code>ET.Surface3dPlot</code> data value.</p>{/if}

<style>
  :global(html), :global(body) { overflow: hidden; padding: 0 !important; } .surface-plot { color: #e4e4e7; font-family: Inter, ui-sans-serif, system-ui, sans-serif; max-width: 820px; } .surface-plot.full-width { margin-left: auto; margin-right: auto; max-width: 1200px; } .surface-plot.full-width .canvas { aspect-ratio: 820 / 440; height: auto; } header { margin-bottom: 14px; padding: 0 16px; } h2 { font-size: 18px; font-weight: 600; letter-spacing: -0.02em; margin: 0; } header p { color: #8a8a94; font-size: 13px; margin: 6px 0 0; } .stage { position: relative; } button { background: transparent; border: 1px solid #30303a; border-radius: 6px; color: #a1a1aa; cursor: pointer; display: grid; height: 30px; padding: 6px; place-items: center; position: absolute; right: 10px; top: 10px; width: 30px; z-index: 2; } button:hover { border-color: #52525b; color: #e4e4e7; } button svg { fill: none; height: 16px; stroke: currentColor; stroke-linecap: round; stroke-width: 1.5; width: 16px; } .canvas { background: transparent; border: 1px solid #1b1b1e; height: 440px; overflow: hidden; } .canvas :global(canvas) { cursor: grab; display: block; height: 100%; touch-action: none; width: 100%; } .canvas :global(canvas):active { cursor: grabbing; } footer { color: #5c5c65; display: flex; font-size: 11px; justify-content: space-between; padding: 9px 2px; } code { color: #71717a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; } .error { color: #fda4af; font-family: system-ui, sans-serif; font-size: 12px; margin: 8px 0; }
</style>
