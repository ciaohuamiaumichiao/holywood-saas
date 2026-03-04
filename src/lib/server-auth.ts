import { NextRequest } from 'next/server'
import { getAdminAuth } from './firebase-admin'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function requireAuthUid(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) {
    throw new ApiError(401, 'Missing bearer token')
  }

  try {
    const adminAuth = getAdminAuth()
    const decoded = await adminAuth.verifyIdToken(token)
    return decoded.uid
  } catch {
    throw new ApiError(401, 'Invalid auth token')
  }
}

export function parseJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(400, 'Invalid JSON body')
  }
  return value as Record<string, unknown>
}

export function readRequiredString(
  data: Record<string, unknown>,
  key: string,
  label = key
): string {
  const value = data[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(400, `Missing ${label}`)
  }
  return value.trim()
}
