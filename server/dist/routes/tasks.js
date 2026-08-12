import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { serializeTask } from '../lib/serialize.js';
import { authMiddleware, hasBoardAccess } from '../middleware/auth.js';
import { routeParam } from '../lib/params.js';
import { emitBoardEvent, notifyBoardMembers } from '../services/notifications.js';
const router = Router({ mergeParams: true });
router.use(authMiddleware);
router.get('/', async (req, res) => {
    const userId = req.user.userId;
    const boardId = routeParam(req, 'boardId');
    if (!(await hasBoardAccess(userId, boardId))) {
        res.status(403).json({ error: 'Нет доступа' });
        return;
    }
    const tasks = await prisma.task.findMany({
        where: { boardId },
        orderBy: { position: 'asc' },
    });
    res.json(tasks.map(serializeTask));
});
router.post('/', async (req, res) => {
    const userId = req.user.userId;
    const boardId = routeParam(req, 'boardId');
    const { column_id, title, description, bg_color, border_color, border_style, badges, } = req.body;
    if (!(await hasBoardAccess(userId, boardId))) {
        res.status(403).json({ error: 'Нет доступа' });
        return;
    }
    const position = await prisma.task.count({ where: { columnId: column_id, isCompleted: false } });
    const task = await prisma.task.create({
        data: {
            columnId: column_id,
            boardId,
            title: title.trim(),
            description: description ?? null,
            position,
            bgColor: bg_color ?? '#ffffff',
            borderColor: border_color ?? '#111111',
            borderStyle: border_style ?? 'solid',
            badges: JSON.stringify(badges ?? []),
            createdById: userId,
            updatedById: userId,
        },
    });
    const serialized = serializeTask(task);
    emitBoardEvent(boardId, 'task:created', serialized);
    const actor = await prisma.user.findUnique({ where: { id: userId } });
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    const actorName = actor?.displayName || actor?.username || 'Участник';
    await notifyBoardMembers(boardId, userId, task.id, 'task_created', `${actorName} добавил задачу «${task.title}» в «${board?.title}»`);
    res.status(201).json(serialized);
});
router.patch('/:taskId', async (req, res) => {
    const userId = req.user.userId;
    const boardId = routeParam(req, 'boardId');
    const { taskId } = req.params;
    const body = req.body;
    if (!(await hasBoardAccess(userId, boardId))) {
        res.status(403).json({ error: 'Нет доступа' });
        return;
    }
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) {
        res.status(404).json({ error: 'Задача не найдена' });
        return;
    }
    const isCompleted = body.is_completed;
    const task = await prisma.task.update({
        where: { id: taskId },
        data: {
            ...(body.title !== undefined && { title: body.title }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.column_id !== undefined && { columnId: body.column_id }),
            ...(body.position !== undefined && { position: body.position }),
            ...(body.bg_color !== undefined && { bgColor: body.bg_color }),
            ...(body.border_color !== undefined && { borderColor: body.border_color }),
            ...(body.border_style !== undefined && { borderStyle: body.border_style }),
            ...(body.badges !== undefined && { badges: JSON.stringify(body.badges) }),
            ...(isCompleted !== undefined && {
                isCompleted,
                completedAt: isCompleted ? new Date() : null,
            }),
            updatedById: userId,
        },
    });
    const serialized = serializeTask(task);
    emitBoardEvent(boardId, 'task:updated', serialized);
    const actor = await prisma.user.findUnique({ where: { id: userId } });
    const actorName = actor?.displayName || actor?.username || 'Участник';
    if (isCompleted !== undefined && existing.isCompleted !== isCompleted) {
        await notifyBoardMembers(boardId, userId, task.id, isCompleted ? 'task_completed' : 'task_updated', isCompleted
            ? `${actorName} выполнил «${task.title}»`
            : `${actorName} вернул задачу «${task.title}»`);
    }
    else if (body.title !== undefined && body.title !== existing.title) {
        await notifyBoardMembers(boardId, userId, task.id, 'task_updated', `${actorName} изменил задачу на «${task.title}»`);
    }
    res.json(serialized);
});
router.delete('/:taskId', async (req, res) => {
    const userId = req.user.userId;
    const boardId = routeParam(req, 'boardId');
    const { taskId } = req.params;
    if (!(await hasBoardAccess(userId, boardId))) {
        res.status(403).json({ error: 'Нет доступа' });
        return;
    }
    await prisma.task.delete({ where: { id: taskId } });
    emitBoardEvent(boardId, 'task:deleted', { id: taskId });
    res.json({ ok: true });
});
export default router;
