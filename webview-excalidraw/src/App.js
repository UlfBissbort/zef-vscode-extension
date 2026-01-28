"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const excalidraw_1 = require("@excalidraw/excalidraw");
require("@excalidraw/excalidraw/index.css");
function App() {
    const [initialData, setInitialData] = (0, react_1.useState)(null);
    const [isReady, setIsReady] = (0, react_1.useState)(false);
    const vscodeRef = (0, react_1.useRef)(null);
    const currentDataRef = (0, react_1.useRef)(null);
    // Get the VSCode API once
    (0, react_1.useEffect)(() => {
        try {
            vscodeRef.current = acquireVsCodeApi();
        }
        catch {
            console.log('Not running in VSCode webview');
        }
    }, []);
    // Listen for messages from extension
    (0, react_1.useEffect)(() => {
        const handleMessage = (event) => {
            const message = event.data;
            if (message.type === 'loadExcalidraw') {
                const data = message.data;
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
    const handleChange = (0, react_1.useCallback)((elements, appState, files) => {
        currentDataRef.current = {
            type: 'excalidraw',
            version: 2,
            elements: elements,
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
        return (<div style={{
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
      </div>);
    }
    return (<div style={{ width: '100%', height: '100%' }}>
      <excalidraw_1.Excalidraw initialData={initialData ? {
            elements: initialData.elements || [],
            appState: initialData.appState || {},
            files: initialData.files || {}
        } : undefined} onChange={handleChange} theme="dark"/>
    </div>);
}
exports.default = App;
//# sourceMappingURL=App.js.map