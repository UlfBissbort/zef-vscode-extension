// Bun test: retrieve ET.SvelteComponent from tokolosh hash store
const PORT = 27021;
const HASH = '🗿-c57f9d5f50c6177e2d2b41befbddf382ea43a99a0bdc2aa1d5d621223a1f621f';

function generateUid(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(10));
    return '🍃-' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
let handshakeDone = false;

ws.onopen = () => console.log(`Connected to port ${PORT}`);

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data as string);
    console.log('Received:', JSON.stringify(msg, null, 2));

    if (!handshakeDone && msg.__type === 'ET.Welcome') {
        ws.send(JSON.stringify({
            __type: 'ET.ClientHello',
            client_type: 'test-script',
            pid: process.pid,
            wire_format: 'json_like',
        }));
        handshakeDone = true;

        // Retrieve by hash
        setTimeout(() => {
            const uid = generateUid();
            const retrieveMsg = {
                __type: 'FX.RetrieveFromHashStore',
                __uid: uid,
                hash: {
                    __type: 'ZefValueHash',
                    data_type: 'ET.SvelteComponent',
                    hash: HASH,
                },
            };
            console.log('\nSending FX.RetrieveFromHashStore...');
            ws.send(JSON.stringify(retrieveMsg));
        }, 300);
    }

    if (msg.__type === 'ET.HashStoreGetResponse') {
        console.log('\n=== RETRIEVE SUCCESS ===');
        if (msg.value?.data) {
            const decoded = atob(msg.value.data);
            console.log('Decoded content:', decoded);
        }
        ws.close();
        process.exit(0);
    }

    if (msg.__type === 'ET.HashStoreNotFound') {
        console.log('\n=== NOT FOUND ===');
        ws.close();
        process.exit(1);
    }
};

ws.onerror = (event) => { console.error('Error:', event); process.exit(1); };

setTimeout(() => { console.error('Timeout'); ws.close(); process.exit(1); }, 5000);
