// Minimal Bun test: save ET.SvelteComponent to tokolosh hash store
const PORT = 27021;

function generateUid(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(10));
    return '🍃-' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
let handshakeDone = false;

ws.onopen = () => {
    console.log(`Connected to tokolosh on port ${PORT}`);
};

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data as string);
    console.log('Received:', JSON.stringify(msg, null, 2));

    if (!handshakeDone && msg.__type === 'ET.Welcome') {
        console.log('Sending ClientHello...');
        ws.send(JSON.stringify({
            __type: 'ET.ClientHello',
            client_type: 'test-script',
            pid: process.pid,
            wire_format: 'json_like',
        }));
        handshakeDone = true;

        // Save a test Svelte component
        setTimeout(() => {
            const svelteContent = '<script>\n  let count = $state(0);\n</script>\n\n<button onclick={() => count++}>Count: {count}</button>';
            // Send the raw Svelte source code as base64, not a JSON wrapper
            const base64Data = btoa(svelteContent);
            const uid = generateUid();

            const saveMsg = {
                __type: 'FX.SaveToHashStore',
                __uid: uid,
                value: {
                    __type: 'ET.SvelteComponent',
                    data: base64Data,
                },
            };
            console.log('\nSending FX.SaveToHashStore...');
            console.log('UID:', uid);
            ws.send(JSON.stringify(saveMsg));
        }, 300);
    }

    if (msg.__type === 'ET.HashStoreResponse') {
        console.log('\n=== SUCCESS ===');
        console.log('Hash:', JSON.stringify(msg.hash, null, 2));
        ws.close();
        process.exit(0);
    }
};

ws.onerror = (event) => {
    console.error('WS error:', event);
    process.exit(1);
};

// Timeout after 5 seconds
setTimeout(() => {
    console.error('Timeout - no response after 5s');
    ws.close();
    process.exit(1);
}, 5000);
