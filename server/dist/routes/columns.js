import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { serializeColumn } from '../lib/serialize.js';
import { authMiddleware, hasBoardAccess } from '../middleware/auth.js';
import { routeParam } from '../lib/params.js';
import { emitBoardEvent } from '../services/notifications.js';
const router = Router({ mergeParams: true });
router.use(authMiddleware);
router.get('/', async (req, res) => {
    const userId = req.user.userId;
    const boardId = routeParam(req, 'boardId');
    if (!(await hasBoardAccess(userId, boardId))) {
        res.status(403).json({ error: 'Нет доступа' });
        return;
    }
    const columns = await prisma.column.findMany({
        where: { boardId },
        orderBy: { position: 'asc' },
    });
    res.json(columns.map(serializeColumn));
});
router.post('/', async (req, res) => {
    const userId = req.user.userId;
    const boardId = routeParam(req, 'boardId');
    const { title } = req.body;
    if (!(await hasBoardAccess(userId, boardId))) {
        res.status(403).json({ error: 'Нет доступа' });
        return;
    }
    const count = await prisma.column.count({ where: { boardId } });
    const column = await prisma.column.create({
        data: { boardId, title: title.trim(), position: count },
    });
    const serialized = serializeColumn(column);
    emitBoardEvent(boardId, 'column:created', serialized);
    res.status(201).json(serialized);
});
router.patch('/:columnId', async (req, res) => {
    const userId = req.user.userId;
    const boardId = routeParam(req, 'boardId');
    const { columnId } = req.params;
    const { title } = req.body;
    if (!(await hasBoardAccess(userId, boardId))) {
        res.status(403).json({ error: 'Нет доступа' });
        return;
    }
    const column = await prisma.column.update({
        where: { id: columnId },
        data: { title },
    });
    const serialized = serializeColumn(column);
    emitBoardEvent(boardId, 'column:updated', serialized);
    res.json(serialized);
});
router.delete('/:columnId', async (req, res) => {
    const userId = req.user.userId;
    const boardId = routeParam(req, 'boardId');
    const { columnId } = req.params;
    if (!(await hasBoardAccess(userId, boardId))) {
        res.status(403).json({ error: 'Нет доступа' });
        return;
    }
    await prisma.column.delete({ where: { id: columnId } });
    emitBoardEvent(boardId, 'column:deleted', { id: columnId });
    res.json({ ok: true });
});
export default router;
