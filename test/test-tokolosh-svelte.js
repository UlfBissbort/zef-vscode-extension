// Test saving an ET.SvelteComponent to the tokolosh hash store
const WebSocket = require('ws');
const crypto = require('crypto');

const PORTS = Array.from({length: 20}, (_, i) => 27021 + i);

function generateUid() {
    const bytes = crypto.randomBytes(10);
    return '🍃-' + bytes.toString('hex');
}

async function tryConnect(port) {
    return new Promise((resolve) => {
        const ws = new WebSocket(`ws://localhost:${port}`);
        const timer = setTimeout(() => { ws.close(); resolve(null); }, 2000);
        ws.on('open', () => { clearTimeout(timer); resolve({ ws, port }); });
        ws.on('error', () => { clearTimeout(timer); resolve(null); });
    });
}

async function main() {
    console.log('Scanning ports for tokolosh...');
    let conn = null;
    for (const port of PORTS) {
        conn = await tryConnect(port);
        if (conn) break;
    }
    if (!conn) {
        console.error('Could not find tokolosh on any port');
        process.exit(1);
    }
    console.log(`Connected to tokolosh on port ${conn.port}`);
    const ws = conn.ws;

    // Wait for handshake
    return new Promise((resolve) => {
        let handshakeDone = false;

        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
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

                // Now test saving an ET.SvelteComponent
                setTimeout(() => {
                    const svelteContent = '<script>\n  let count = $state(0);\n</script>\n\n<button on:click={() => count++}>Count: {count}</button>';
                    const jsonPayload = JSON.stringify({
                        __type: 'ET.SvelteComponent',
                        content: svelteContent,
                    });
                    const base64Data = Buffer.from(jsonPayload).toString('base64');
                    const uid = generateUid();

                    console.log('\n--- Saving ET.SvelteComponent ---');
                    console.log('Payload (JSON):', jsonPayload);
                    console.log('Base64:', base64Data.substring(0, 60) + '...');

                    const saveMsg = {
                        __type: 'FX.SaveToHashStore',
                        __uid: uid,
                        value: {
                            __type: 'ET.SvelteComponent',
                            data: base64Data,
                        },
                    };
                    console.log('Sending:', JSON.stringify(saveMsg, null, 2));
                    ws.send(JSON.stringify(saveMsg));
                }, 500);
            }

            if (msg.__type === 'ET.HashStoreResponse') {
                console.log('\n--- Hash Store Response ---');
                console.log('Hash:', JSON.stringify(msg.hash, null, 2));
                ws.close();
                resolve();
            }
        });

        ws.on('error', (err) => {
            console.error('WS error:', err.message);
            resolve();
        });
    });
}

main().catch(console.error);
