// Scan for tokolosh on ports 27021-27040
for (let port = 27021; port <= 27040; port++) {
    try {
        const ws = new WebSocket(`ws://localhost:${port}`);
        const p = new Promise<void>((resolve) => {
            const timer = setTimeout(() => { ws.close(); resolve(); }, 1000);
            ws.onopen = () => {
                clearTimeout(timer);
                console.log(`FOUND tokolosh on port ${port}`);
                ws.onmessage = (ev) => {
                    const msg = JSON.parse(ev.data as string);
                    console.log(`  Welcome message: ${msg.__type}`);
                    ws.close();
                    resolve();
                };
                setTimeout(() => { ws.close(); resolve(); }, 2000);
            };
            ws.onerror = () => { clearTimeout(timer); resolve(); };
        });
        await p;
    } catch {}
}
console.log('Scan complete');
