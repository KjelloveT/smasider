// Enkel WebSocket server for Kviss demo
// Kjør med: node server.js

const WebSocket = require('ws');
const http = require('http');

// HTTP server for å serve quiz-filer
const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*'
    });
    res.end('WebSocket server running');
});

// WebSocket server
const wss = new WebSocket.Server({ server });

// Quiz rooms
const quizRooms = new Map();

console.log('🎯 Kviss WebSocket Server starting...');

wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received:', data);
            
            switch (data.type) {
                case 'join':
                    handleJoin(ws, data);
                    break;
                case 'answer':
                    handleAnswer(ws, data);
                    break;
                case 'question':
                    handleQuestion(ws, data);
                    break;
                case 'results':
                    handleResults(ws, data);
                    break;
                case 'quiz-end':
                    handleQuizEnd(ws, data);
                    break;
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
        handleDisconnect(ws);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

function handleJoin(ws, data) {
    const { roomCode, playerId, playerName } = data;
    
    // Join or create room
    if (!quizRooms.has(roomCode)) {
        quizRooms.set(roomCode, {
            host: null,
            players: new Map(),
            quizActive: false
        });
    }
    
    const room = quizRooms.get(roomCode);
    
    // First client in room becomes host
    if (!room.host) {
        room.host = ws;
        ws.isHost = true;
        ws.roomCode = roomCode;
        console.log(`Host joined room ${roomCode}`);
        
        ws.send(JSON.stringify({
            type: 'host-assigned',
            roomCode: roomCode
        }));
    } else {
        // Add player
        const player = {
            id: playerId,
            name: playerName,
            ws: ws,
            score: 0,
            answers: []
        };
        
        room.players.set(playerId, player);
        ws.isHost = false;
        ws.roomCode = roomCode;
        ws.playerId = playerId;
        
        console.log(`Player ${playerName} joined room ${roomCode}`);
        
        // Notify host
        room.host.send(JSON.stringify({
            type: 'player-joined',
            playerId: playerId,
            playerName: playerName
        }));
        
        // Confirm to player
        ws.send(JSON.stringify({
            type: 'join-confirmed',
            roomCode: roomCode
        }));
    }
}

function handleAnswer(ws, data) {
    const { roomCode, playerId, answer, responseTime } = data;
    const room = quizRooms.get(roomCode);
    
    if (room && room.host) {
        // Forward answer to host
        room.host.send(JSON.stringify({
            type: 'answer',
            playerId: playerId,
            answer: answer,
            responseTime: responseTime
        }));
    }
}

function handleQuestion(ws, data) {
    if (!ws.isHost) return;
    
    const room = quizRooms.get(ws.roomCode);
    if (!room) return;
    
    // Broadcast question to all players
    room.players.forEach((player) => {
        player.ws.send(JSON.stringify({
            type: 'question',
            ...data
        }));
    });
}

function handleResults(ws, data) {
    if (!ws.isHost) return;
    
    const room = quizRooms.get(ws.roomCode);
    if (!room) return;
    
    // Broadcast results to all players
    room.players.forEach((player) => {
        player.ws.send(JSON.stringify({
            type: 'results',
            ...data
        }));
    });
}

function handleQuizEnd(ws, data) {
    if (!ws.isHost) return;
    
    const room = quizRooms.get(ws.roomCode);
    if (!room) return;
    
    // Broadcast quiz end to all players
    room.players.forEach((player) => {
        player.ws.send(JSON.stringify({
            type: 'quiz-end',
            ...data
        }));
    });
}

function handleDisconnect(ws) {
    if (ws.isHost) {
        // Host disconnected - clean up room
        const roomCode = ws.roomCode;
        if (roomCode && quizRooms.has(roomCode)) {
            const room = quizRooms.get(roomCode);
            
            // Notify all players
            room.players.forEach((player) => {
                player.ws.send(JSON.stringify({
                    type: 'host-disconnected'
                }));
            });
            
            quizRooms.delete(roomCode);
            console.log(`Room ${roomCode} closed (host disconnected)`);
        }
    } else {
        // Player disconnected - remove from room
        const roomCode = ws.roomCode;
        const playerId = ws.playerId;
        
        if (roomCode && playerId && quizRooms.has(roomCode)) {
            const room = quizRooms.get(roomCode);
            room.players.delete(playerId);
            
            // Notify host
            if (room.host) {
                room.host.send(JSON.stringify({
                    type: 'player-disconnected',
                    playerId: playerId
                }));
            }
            
            console.log(`Player ${playerId} disconnected from room ${roomCode}`);
        }
    }
}

// Start server
const PORT = 8082;
server.listen(PORT, () => {
    console.log(`🚀 Kviss Server running on port ${PORT}`);
    console.log(`📱 Quiz host: http://localhost:${PORT}/quiz-host.html`);
    console.log(`👥 Quiz join: http://localhost:${PORT}/quiz-join.html`);
    console.log(`\n💡 Bruk denne serveren for ekte live quiz!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});
