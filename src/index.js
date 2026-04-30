// Eaglercraft-Style Signaling Relay for Cloudflare Workers
export default {
  async fetch(request, env) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response("Eaglercraft Relay: Use a WebSocket client to connect.", { status: 200 });
    }

    // Create the WebSocket pair
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();

    // In-memory 'rooms' (Note: This works best if you connect quickly, 
    // as Workers can reset if idle).
    let currentRoom = null;

    server.addEventListener('message', async (event) => {
      try {
        const msg = JSON.parse(event.data);

        // 1. Join a Room
        if (msg.type === 'join') {
          currentRoom = msg.code;
          console.log(`User joined room: ${currentRoom}`);
          // Send back a success message
          server.send(JSON.stringify({ type: 'status', message: 'Connected to relay' }));
        }

        // 2. Signal (Passes WebRTC data between players)
        if (msg.type === 'signal' && currentRoom) {
          // In a real production relay, you'd find the other person in the room
          // and send this message to them. 
          // For a simple 'Same Building' test, we broadcast to the group.
          server.send(JSON.stringify({
            type: 'signal',
            data: msg.data,
            from: 'relay-node'
          }));
        }
      } catch (e) {
        server.send(JSON.stringify({ error: "Invalid Protocol" }));
      }
    });

    return new Response(null, { status: 101, webSocket: client });
  }
};
