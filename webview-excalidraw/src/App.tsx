import { useState, useEffect, useCallback, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawElement = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppState = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BinaryFiles = any;

// Debounce utility - generic version for any function
function debounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Define vscode API type
interface VsCodeApi {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
}

// The vscode API is exposed by the parent HTML as window.vscodeApi
declare global {
  interface Window {
    vscodeApi?: VsCodeApi;
  }
}

interface ExcalidrawData {
  type?: string;
  version?: number;
  uid?: string;  // Unique ID for tracking this block across edits
  elements: ExcalidrawElement[];
  appState?: Partial<AppState>;
  files?: BinaryFiles;
}

// Default appState for dark theme
const defaultAppState = {
  viewBackgroundColor: '#080808',
  currentItemStrokeColor: '#ada7a7',
  currentItemBackgroundColor: 'transparent',
  currentItemFillStyle: 'solid',
  currentItemStrokeWidth: 2,
  currentItemRoughness: 1,
  currentItemOpacity: 100,
  currentItemFontFamily: 5,
  currentItemFontSize: 20,
  currentItemTextAlign: 'left',
  currentItemRoundness: 'round',
  gridSize: 20,
};

// Extract appState fields we care about preserving
function extractAppState(appState: AppState) {
  return {
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
  };
}

// Inline editor component - used when mounting directly in preview webview
export function InlineExcalidraw({ data, onChange }: {
  data: ExcalidrawData;
  onChange: (data: ExcalidrawData) => void;
}) {
  const mergedData: ExcalidrawData = {
    ...data,
    appState: { ...defaultAppState, ...data.appState },
  };
  const uidRef = useRef(data.uid);

  const handleChange = useCallback((
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles
  ) => {
    const newData: ExcalidrawData = {
      type: 'excalidraw',
      version: 2,
      uid: uidRef.current,
      elements: elements as ExcalidrawElement[],
      appState: extractAppState(appState),
      files: files
    };
    onChange(newData);
  }, [onChange]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Excalidraw
        initialData={{
          elements: mergedData.elements || [],
          appState: mergedData.appState || {},
          files: mergedData.files || {}
        }}
        onChange={handleChange}
      />
    </div>
  );
}

function App() {
  const [initialData, setInitialData] = useState<ExcalidrawData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const vscodeRef = useRef<VsCodeApi | null>(null);
  const currentDataRef = useRef<ExcalidrawData | null>(null);
  
  // Get the VSCode API from window (set by parent HTML)
  useEffect(() => {
    if (window.vscodeApi) {
      vscodeRef.current = window.vscodeApi;
      console.log('VSCode API acquired from window');
    } else {
      console.log('Not running in VSCode webview - window.vscodeApi not found');
    }
  }, []);

  // Listen for messages from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      if (message.type === 'loadExcalidraw') {
        const data = message.data as ExcalidrawData;
        // Merge default appState with incoming data
        const mergedData: ExcalidrawData = {
          ...data,
          appState: {
            ...defaultAppState,
            ...data.appState,
          }
        };
        setInitialData(mergedData);
        currentDataRef.current = mergedData;
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

  // Debounced function to send updates to extension
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sendUpdate = useCallback(
    debounce((data: ExcalidrawData) => {
      if (vscodeRef.current) {
        vscodeRef.current.postMessage({
          type: 'excalidrawChanged',
          data: data
        });
      }
    }, 500),
    []
  );

  // Handle Excalidraw changes
  const handleChange = useCallback((
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles
  ) => {
    const newData: ExcalidrawData = {
      type: 'excalidraw',
      version: 2,
      uid: currentDataRef.current?.uid,
      elements: elements as ExcalidrawElement[],
      appState: extractAppState(appState),
      files: files
    };
    currentDataRef.current = newData;
    
    // Send debounced update to extension for live preview
    sendUpdate(newData);
  }, [sendUpdate]);

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
      />
    </div>
  );
}

export default App;
