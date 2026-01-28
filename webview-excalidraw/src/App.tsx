import { useState, useEffect, useCallback, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawElement = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppState = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BinaryFiles = any;

// Define vscode API type
declare const acquireVsCodeApi: () => {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

interface ExcalidrawData {
  type?: string;
  version?: number;
  elements: ExcalidrawElement[];
  appState?: Partial<AppState>;
  files?: BinaryFiles;
}

function App() {
  const [initialData, setInitialData] = useState<ExcalidrawData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const vscodeRef = useRef<ReturnType<typeof acquireVsCodeApi> | null>(null);
  const currentDataRef = useRef<ExcalidrawData | null>(null);
  
  // Get the VSCode API once
  useEffect(() => {
    try {
      vscodeRef.current = acquireVsCodeApi();
    } catch {
      console.log('Not running in VSCode webview');
    }
  }, []);

  // Listen for messages from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      if (message.type === 'loadExcalidraw') {
        const data = message.data as ExcalidrawData;
        setInitialData(data);
        currentDataRef.current = data;
        setIsReady(true);
      }
      
      if (message.type === 'requestSave') {
        // Send current data back to extension
        if (vscodeRef.current && currentDataRef.current) {
          vscodeRef.current.postMessage({
            type: 'saveExcalidraw',
            data: currentDataRef.current
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Signal that we're ready to receive data
    if (vscodeRef.current) {
      vscodeRef.current.postMessage({ type: 'ready' });
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle Excalidraw changes
  const handleChange = useCallback((
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles
  ) => {
    currentDataRef.current = {
      type: 'excalidraw',
      version: 2,
      elements: elements as ExcalidrawElement[],
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor,
        currentItemStrokeColor: appState.currentItemStrokeColor,
        currentItemBackgroundColor: appState.currentItemBackgroundColor,
        currentItemFillStyle: appState.currentItemFillStyle,
        currentItemStrokeWidth: appState.currentItemStrokeWidth,
        currentItemRoughness: appState.currentItemRoughness,
        currentItemOpacity: appState.currentItemOpacity,
        currentItemFontFamily: appState.currentItemFontFamily,
        currentItemFontSize: appState.currentItemFontSize,
        currentItemTextAlign: appState.currentItemTextAlign,
        currentItemRoundness: appState.currentItemRoundness,
        gridSize: appState.gridSize,
      },
      files: files
    };
  }, []);

  if (!isReady) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#121212',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✏️</div>
          <div>Loading Excalidraw...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Excalidraw
        initialData={initialData ? {
          elements: initialData.elements || [],
          appState: initialData.appState || {},
          files: initialData.files || {}
        } : undefined}
        onChange={handleChange}
        theme="dark"
      />
    </div>
  );
}

export default App;
