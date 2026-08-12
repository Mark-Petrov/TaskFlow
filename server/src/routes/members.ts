import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { serializeUser } from '../lib/serialize.js'
import { authMiddleware, hasBoardAccess } from '../middleware/auth.js'
import { routeParam } from '../lib/params.js'

const router = Router({ mergeParams: true })

router.use(authMiddleware)

router.get('/', async (req, res) => {
  const userId = req.user!.userId
  const boardId = routeParam(req, 'boardId')

  if (!(await hasBoardAccess(userId, boardId))) {
    res.status(403).json({ error: 'Нет доступа' })
    return
  }

  const members = await prisma.boardMember.findMany({
    where: { boardId },
    include: { user: true },
  })

  const owner = await prisma.board.findUnique({
    where: { id: boardId },
    include: { owner: true },
  })

  const result = members.map(m => ({
    id: m.id,
    board_id: m.boardId,
    user_id: m.userId,
    role: m.role,
    created_at: m.createdAt.toISOString(),
    profile: serializeUser(m.user),
  }))

  if (owner && !result.some(m => m.user_id === owner.ownerId)) {
    result.unshift({
      id: 'owner',
      board_id: boardId,
      user_id: owner.ownerId,
      role: 'owner',
      created_at: owner.createdAt.toISOString(),
      profile: serializeUser(owner.owner),
    })
  }

  res.json(result)
})

router.post('/', async (req, res) => {
  const userId = req.user!.userId
  const boardId = routeParam(req, 'boardId')
  const { query } = req.body

  const board = await prisma.board.findUnique({ where: { id: boardId } })
  if (!board || board.ownerId !== userId) {
    res.status(403).json({ error: 'Только владелец может добавлять участников' })
    return
  }

  const cleanQuery = String(query).replace(/^@/, '').trim()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery)

  const profile = await prisma.user.findFirst({
    where: isUuid ? { id: cleanQuery } : { username: cleanQuery.toLowerCase() },
  })

  if (!profile) {
    res.status(404).json({ error: 'Пользователь не найден' })
    return
  }

  if (profile.id === userId) {
    res.status(400).json({ error: 'Нельзя добавить себя' })
    return
  }

  try {
    const member = await prisma.boardMember.create({
      data: { boardId, userId: profile.id, role: 'member' },
      include: { user: true },
    })
    res.status(201).json({
      id: member.id,
      board_id: member.boardId,
      user_id: member.userId,
      role: member.role,
      created_at: member.createdAt.toISOString(),
      profile: serializeUser(member.user),
    })
  } catch {
    res.status(409).json({ error: 'Пользователь уже добавлен' })
  }
})

router.delete('/:memberId', async (req, res) => {
  const userId = req.user!.userId
  const boardId = routeParam(req, 'boardId')
  const { memberId } = req.params

  const board = await prisma.board.findUnique({ where: { id: boardId } })
  if (!board || board.ownerId !== userId) {
    res.status(403).json({ error: 'Только владелец может удалять участников' })
    return
  }

  await prisma.boardMember.delete({ where: { id: memberId } })
  res.json({ ok: true })
})

export default router
