import type { Board, Column, Task } from '../types'

const DB_NAME = 'taskflow-offline'
const DB_VERSION = 1

export interface BoardCache {
  boardId: string
  board: Board
  columns: Column[]
  tasks: Task[]
  savedAt: number
}

export interface BoardListCache {
  userId: string
  boards: Board[]
  savedAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('boards')) {
        db.createObjectStore('boards', { keyPath: 'boardId' })
      }
      if (!db.objectStoreNames.contains('boardList')) {
        db.createObjectStore('boardList', { keyPath: 'userId' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function txStore<T>(storeName: string, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    const req = fn(store)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  }))
}

export async function saveBoardCache(data: Omit<BoardCache, 'savedAt'>) {
  if (!('indexedDB' in globalThis)) return
  await txStore('boards', 'readwrite', store =>
    store.put({ ...data, savedAt: Date.now() })
  )
}

export async function loadBoardCache(boardId: string): Promise<BoardCache | null> {
  if (!('indexedDB' in globalThis)) return null
  try {
    return await txStore<BoardCache | undefined>('boards', 'readonly', store =>
      store.get(boardId)
    ) ?? null
  } catch {
    return null
  }
}

export async function saveBoardListCache(userId: string, boards: Board[]) {
  if (!('indexedDB' in globalThis)) return
  await txStore('boardList', 'readwrite', store =>
    store.put({ userId, boards, savedAt: Date.now() })
  )
}

export async function loadBoardListCache(userId: string): Promise<Board[] | null> {
  if (!('indexedDB' in globalThis)) return null
  try {
    const data = await txStore<BoardListCache | undefined>('boardList', 'readonly', store =>
      store.get(userId)
    )
    return data?.boards ?? null
  } catch {
    return null
  }
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}
