import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { serializeNotification } from '../lib/serialize.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/', async (req, res) => {
  const userId = req.user!.userId
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  res.json(notifications.map(serializeNotification))
})

router.patch('/:id/read', async (req, res) => {
  const userId = req.user!.userId
  const { id } = req.params

  const notification = await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  })

  if (notification.count === 0) {
    res.status(404).json({ error: 'Не найдено' })
    return
  }
  res.json({ ok: true })
})

router.post('/read-all', async (req, res) => {
  const userId = req.user!.userId
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
  res.json({ ok: true })
})

export default router
