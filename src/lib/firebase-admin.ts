import { getApps, initializeApp, cert, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function getPrivateKey() {
  const raw = process.env.FIREBASE_PRIVATE_KEY
  if (!raw) return undefined
  const unquoted =
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
      ? raw.slice(1, -1)
      : raw
  return unquoted.replace(/\\n/g, '\n')
}

function getFirebaseAdminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = getPrivateKey()

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    })
  }

  if (!projectId) {
    throw new Error('Missing FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID) for firebase-admin')
  }

  return initializeApp({ projectId })
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp())
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp())
}
