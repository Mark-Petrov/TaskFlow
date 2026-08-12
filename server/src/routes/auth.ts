import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { serializeUser } from '../lib/serialize.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const { email, password, username, display_name } = req.body
    if (!email || !password || !username) {
      res.status(400).json({ error: 'Email, пароль и username обязательны' })
      return
    }

    const cleanUsername = String(username).replace(/^@/, '').toLowerCase()
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
      res.status(400).json({ error: 'Никнейм: 3–20 символов, буквы, цифры и _' })
      return
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username: cleanUsername }] },
    })
    if (existing) {
      res.status(409).json({ error: existing.email === email ? 'Email уже занят' : 'Никнейм уже занят' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        username: cleanUsername,
        displayName: display_name || cleanUsername,
      },
    })

    const secret = process.env.JWT_SECRET || 'dev-secret'
    const token = jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '30d' })

    res.status(201).json({ token, user: serializeUser(user) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Ошибка регистрации' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ error: 'Email и пароль обязательны' })
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Неверный email или пароль' })
      return
    }

    const secret = process.env.JWT_SECRET || 'dev-secret'
    const token = jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '30d' })

    res.json({ token, user: serializeUser(user) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Ошибка входа' })
  }
})

router.get('/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
  if (!user) {
    res.status(404).json({ error: 'Пользователь не найден' })
    return
  }
  res.json({ user: serializeUser(user) })
})

export default router
