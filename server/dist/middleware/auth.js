import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
export function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Требуется авторизация' });
        return;
    }
    const token = header.slice(7);
    try {
        const secret = process.env.JWT_SECRET || 'dev-secret';
        req.user = jwt.verify(token, secret);
        next();
    }
    catch {
        res.status(401).json({ error: 'Недействительный токен' });
    }
}
export async function hasBoardAccess(userId, boardId) {
    const board = await prisma.board.findFirst({
        where: {
            id: boardId,
            OR: [
                { ownerId: userId },
                { members: { some: { userId } } },
            ],
        },
    });
    return Boolean(board);
}
