import { normalizeBoardType } from './boardType.js';
export function serializeTask(task) {
    return {
        id: task.id,
        column_id: task.columnId,
        board_id: task.boardId,
        title: task.title,
        description: task.description,
        position: task.position,
        bg_color: task.bgColor,
        border_color: task.borderColor,
        border_style: task.borderStyle,
        badges: JSON.parse(task.badges || '[]'),
        is_completed: task.isCompleted,
        completed_at: task.completedAt?.toISOString() ?? null,
        created_by: task.createdById,
        updated_by: task.updatedById,
        created_at: task.createdAt.toISOString(),
        updated_at: task.updatedAt.toISOString(),
    };
}
export function serializeBoard(board) {
    return {
        id: board.id,
        title: board.title,
        board_type: normalizeBoardType(board.boardType),
        owner_id: board.ownerId,
        created_at: board.createdAt.toISOString(),
        updated_at: board.updatedAt.toISOString(),
    };
}
export function serializeColumn(col) {
    return {
        id: col.id,
        board_id: col.boardId,
        title: col.title,
        position: col.position,
        created_at: col.createdAt.toISOString(),
    };
}
export function serializeUser(user) {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.displayName,
        avatar_url: user.avatarUrl,
        created_at: user.createdAt.toISOString(),
    };
}
export function serializeNotification(n) {
    return {
        id: n.id,
        user_id: n.userId,
        board_id: n.boardId,
        task_id: n.taskId,
        actor_id: n.actorId,
        type: n.type,
        message: n.message,
        read: n.read,
        created_at: n.createdAt.toISOString(),
    };
}
