import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { serializeUser } from '../lib/serialize.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.put('/', async (req, res) => {
  try {
    const userId = req.user!.userId
    const { display_name, username, avatar_url } = req.body

    const data: {
      displayName?: string | null
      username?: string
      avatarUrl?: string | null
    } = {}

    if (display_name !== undefined) {
      const name = String(display_name).trim()
      if (!name) {
        res.status(400).json({ error: 'Имя не может быть пустым' })
        return
      }
      if (name.length > 50) {
        res.status(400).json({ error: 'Имя: максимум 50 символов' })
        return
      }
      data.displayName = name
    }

    if (username !== undefined) {
      const cleanUsername = String(username).replace(/^@/, '').toLowerCase()
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
        res.status(400).json({ error: 'Никнейм: 3–20 символов, буквы, цифры и _' })
        return
      }

      const taken = await prisma.user.findFirst({
        where: { username: cleanUsername, NOT: { id: userId } },
      })
      if (taken) {
        res.status(409).json({ error: 'Никнейм уже занят' })
        return
      }
      data.username = cleanUsername
    }

    if (avatar_url !== undefined) {
      const url = avatar_url === null || avatar_url === '' ? null : String(avatar_url).trim()
      if (url && url.length > 2048) {
        res.status(400).json({ error: 'Ссылка на аватар слишком длинная' })
        return
      }
      if (url && !/^https?:\/\/.+/i.test(url) && !/^data:image\//i.test(url)) {
        res.status(400).json({ error: 'Аватар: укажите URL изображения или data:image/...' })
        return
      }
      data.avatarUrl = url
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'Нет данных для обновления' })
      return
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
    })

    res.json({ user: serializeUser(user) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Не удалось обновить профиль' })
  }
})

export default router
