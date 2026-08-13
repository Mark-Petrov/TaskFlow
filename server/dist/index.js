import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './app.js';
import { setSocketServer } from './services/notifications.js';
const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT) || 3001;
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
    },
});
setSocketServer(io);
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        next(new Error('Unauthorized'));
        return;
    }
    try {
        const secret = process.env.JWT_SECRET || 'dev-secret';
        const payload = jwt.verify(token, secret);
        socket.data.userId = payload.userId;
        next();
    }
    catch {
        next(new Error('Unauthorized'));
    }
});
io.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);
    socket.on('join-board', (boardId) => {
        socket.join(`board:${boardId}`);
    });
    socket.on('leave-board', (boardId) => {
        socket.leave(`board:${boardId}`);
    });
});
httpServer.listen(PORT, HOST, () => {
    console.log(`TaskFlow API + WebSocket → http://${HOST}:${PORT}`);
});
