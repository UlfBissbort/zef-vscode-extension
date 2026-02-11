import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import App, { InlineExcalidraw } from './App';

// Auto-mount for detached panel mode (when #root exists)
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Inline mounting API for preview webview
interface ExcalidrawData {
  type?: string;
  version?: number;
  uid?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appState?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  files?: any;
}

interface InlineHandle {
  root: Root;
  latestData: ExcalidrawData | null;
}

declare global {
  interface Window {
    mountExcalidraw?: (container: HTMLElement, data: ExcalidrawData) => InlineHandle;
    unmountExcalidraw?: (handle: InlineHandle) => void;
  }
}

window.mountExcalidraw = (container: HTMLElement, data: ExcalidrawData): InlineHandle => {
  const handle: InlineHandle = { root: null as unknown as Root, latestData: data };
  const root = createRoot(container);
  handle.root = root;

  const onChange = (newData: ExcalidrawData) => {
    handle.latestData = newData;
  };

  root.render(
    <React.StrictMode>
      <InlineExcalidraw data={data} onChange={onChange} />
    </React.StrictMode>
  );

  return handle;
};

window.unmountExcalidraw = (handle: InlineHandle) => {
  if (handle.root) {
    handle.root.unmount();
  }
};
