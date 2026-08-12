import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { serializeBoard } from '../lib/serialize.js'
import { normalizeBoardType, isListLikeType } from '../lib/boardType.js'
import { authMiddleware, hasBoardAccess } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/', async (req, res) => {
  const userId = req.user!.userId
  const boards = await prisma.board.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(boards.map(serializeBoard))
})

router.post('/', async (req, res) => {
  const userId = req.user!.userId
  const boardType = normalizeBoardType(req.body.board_type ?? req.body.type)
  const { title } = req.body
  if (!title?.trim()) {
    res.status(400).json({ error: 'Название обязательно' })
    return
  }

  const board = await prisma.board.create({
    data: { title: title.trim(), boardType, ownerId: userId },
  })

  const defaultColumns = isListLikeType(boardType)
    ? ['Список']
    : ['План', 'В работе', 'Готово']

  await prisma.column.createMany({
    data: defaultColumns.map((col, i) => ({ boardId: board.id, title: col, position: i })),
  })

  await prisma.boardMember.create({
    data: { boardId: board.id, userId, role: 'owner' },
  })

  res.status(201).json(serializeBoard(board))
})

router.get('/:id', async (req, res) => {
  const userId = req.user!.userId
  const { id } = req.params

  if (!(await hasBoardAccess(userId, id))) {
    res.status(403).json({ error: 'Нет доступа' })
    return
  }

  const board = await prisma.board.findUnique({ where: { id } })
  if (!board) {
    res.status(404).json({ error: 'Доска не найдена' })
    return
  }
  res.json(serializeBoard(board))
})

router.patch('/:id', async (req, res) => {
  const userId = req.user!.userId
  const { id } = req.params
  const { title, board_type, type } = req.body
  const nextType = board_type ?? type

  if (!(await hasBoardAccess(userId, id))) {
    res.status(403).json({ error: 'Нет доступа' })
    return
  }

  const board = await prisma.board.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(nextType !== undefined && { boardType: normalizeBoardType(nextType) }),
    },
  })
  res.json(serializeBoard(board))
})

router.delete('/:id', async (req, res) => {
  const userId = req.user!.userId
  const { id } = req.params

  const board = await prisma.board.findUnique({ where: { id } })
  if (!board || board.ownerId !== userId) {
    res.status(403).json({ error: 'Только владелец может удалить доску' })
    return
  }

  await prisma.board.delete({ where: { id } })
  res.json({ ok: true })
})

export default router
