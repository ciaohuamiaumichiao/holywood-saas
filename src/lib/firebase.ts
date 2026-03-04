import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'

function cleanFirebaseEnv(value: string | undefined): string | undefined {
  if (!value) return undefined
  const sanitized = value
    .replace(/[\r\n]+/g, '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
  return sanitized || undefined
}

const projectId = cleanFirebaseEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)

const firebaseConfig = {
  apiKey: cleanFirebaseEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain:
    cleanFirebaseEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) ||
    (projectId ? `${projectId}.firebaseapp.com` : undefined),
  projectId,
  storageBucket: cleanFirebaseEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanFirebaseEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanFirebaseEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  measurementId: cleanFirebaseEnv(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID),
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
let analyticsInstance: Analytics | null = null

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (analyticsInstance) return analyticsInstance
  if (typeof window === 'undefined') return null
  try {
    const supported = await isSupported()
    if (!supported) return null
    analyticsInstance = getAnalytics(app)
    return analyticsInstance
  } catch {
    return null
  }
}
