export function normalizeBoardType(raw) {
    if (raw === 'list' || raw === 'simple')
        return 'simple';
    if (raw === 'shopping')
        return 'shopping';
    return 'kanban';
}
export function isListLikeType(type) {
    return type === 'simple' || type === 'shopping';
}
