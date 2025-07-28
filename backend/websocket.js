
const WebSocket = require('ws');
const { loadData } = require('./db');

let wss;

const initWebSocket = (server) => {
    wss = new WebSocket.Server({ server });
    wss.on('connection', ws => {
        console.log('Client connected via WebSocket');
        ws.on('close', () => console.log('Client disconnected from WebSocket'));
    });
    return wss;
};

const broadcast = (message) => {
    if (!wss) return;
    const data = JSON.stringify(message);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

const broadcastUpdate = async () => {
    try {
        const data = await loadData();
        broadcast({ type: 'FULL_STATE_UPDATE', payload: data });
    } catch (error) {
        console.error("Error broadcasting update:", error);
    }
};

module.exports = { initWebSocket, broadcastUpdate, broadcast };
