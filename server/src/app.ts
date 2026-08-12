import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import boardsRoutes from './routes/boards.js'
import columnsRoutes from './routes/columns.js'
import tasksRoutes from './routes/tasks.js'
import membersRoutes from './routes/members.js'
import notificationsRoutes from './routes/notifications.js'
import profileRoutes from './routes/profile.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '../public')

const app = express()

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'
app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'taskflow-api' })
})

app.use('/api/auth', authRoutes)
app.use('/api/boards', boardsRoutes)
app.use('/api/boards/:boardId/columns', columnsRoutes)
app.use('/api/boards/:boardId/tasks', tasksRoutes)
app.use('/api/boards/:boardId/members', membersRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/profile', profileRoutes)

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(publicDir, { index: false }))

  app.get(/^(?!\/api|\/socket\.io).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'))
  })
}

export default app
