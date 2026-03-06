import { getApps, initializeApp, cert, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function cleanAdminEnv(value: string | undefined): string | undefined {
  if (!value) return undefined
  const sanitized = value
    .replace(/[\r\n]+/g, '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
  return sanitized || undefined
}

function getPrivateKey() {
  const raw = cleanAdminEnv(process.env.FIREBASE_PRIVATE_KEY)
  if (!raw) return undefined
  let value = raw.trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  value = value.replace(/\\n/g, '\n').replace(/\r/g, '').trim()

  const begin = '-----BEGIN PRIVATE KEY-----'
  const end = '-----END PRIVATE KEY-----'
  if (!value.includes(begin) || !value.includes(end)) {
    return value || undefined
  }

  const beginIndex = value.indexOf(begin)
  const endIndex = value.indexOf(end)
  if (beginIndex === -1 || endIndex === -1 || endIndex <= beginIndex) {
    return value || undefined
  }

  // Reformat PEM body so mis-pasted single-line keys still work.
  const body = value
    .slice(beginIndex + begin.length, endIndex)
    .replace(/[\s\n\r]+/g, '')
  if (!body) return value || undefined

  const lines = body.match(/.{1,64}/g) ?? []
  return `${begin}\n${lines.join('\n')}\n${end}\n`
}

function getFirebaseAdminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  const projectId =
    cleanAdminEnv(process.env.FIREBASE_PROJECT_ID) ||
    cleanAdminEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
  const clientEmail = cleanAdminEnv(process.env.FIREBASE_CLIENT_EMAIL)
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
