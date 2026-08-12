import { prisma } from '../lib/prisma.js';
import { serializeNotification } from '../lib/serialize.js';
let io = null;
export function setSocketServer(server) {
    io = server;
}
export function getSocketServer() {
    return io;
}
export async function notifyBoardMembers(boardId, actorId, taskId, type, message) {
    const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: { members: true },
    });
    if (!board)
        return;
    const memberIds = new Set();
    if (board.ownerId !== actorId)
        memberIds.add(board.ownerId);
    for (const m of board.members) {
        if (m.userId !== actorId)
            memberIds.add(m.userId);
    }
    for (const userId of memberIds) {
        const notification = await prisma.notification.create({
            data: { userId, boardId, taskId, actorId, type, message },
        });
        const serialized = serializeNotification(notification);
        io?.to(`user:${userId}`).emit('notification', serialized);
    }
}
export function emitBoardEvent(boardId, event, data) {
    io?.to(`board:${boardId}`).emit(event, data);
}
