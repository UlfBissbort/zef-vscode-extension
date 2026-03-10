// Debug test: connect to tokolosh on port 27029, log everything
const PORT = 27029;
const ws = new WebSocket(`ws://localhost:${PORT}`);

ws.onopen = () => {
    console.log(`Connected to port ${PORT}`);
};

ws.onmessage = (event) => {
    console.log('Message received:', typeof event.data, event.data);
};

ws.onerror = (event) => {
    console.error('Error:', event);
};

ws.onclose = (event) => {
    console.log('Closed:', event.code, event.reason);
};

setTimeout(() => {
    console.log('ReadyState after 3s:', ws.readyState);
    // Try sending ClientHello without waiting for Welcome
    console.log('Sending ClientHello proactively...');
    ws.send(JSON.stringify({
        __type: 'ET.ClientHello',
        client_type: 'test-script',
        pid: process.pid,
        wire_format: 'json_like',
    }));
}, 3000);

setTimeout(() => {
    console.log('Timeout after 8s, closing');
    ws.close();
    process.exit(0);
}, 8000);
