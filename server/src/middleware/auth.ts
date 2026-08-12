import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

export interface AuthPayload {
  userId: string
  email: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Требуется авторизация' })
    return
  }
  const token = header.slice(7)
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret'
    req.user = jwt.verify(token, secret) as AuthPayload
    next()
  } catch {
    res.status(401).json({ error: 'Недействительный токен' })
  }
}

export async function hasBoardAccess(userId: string, boardId: string): Promise<boolean> {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
  })
  return Boolean(board)
}
