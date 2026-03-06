'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, User } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { upsertUser, getUser } from '@/lib/firestore-teams'
import { resolveGoogleAvatarUrl } from '@/lib/google-avatar'
import { UserProfile } from '@/lib/types'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  effectiveName: string
  effectivePhotoURL: string
  authError: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  effectiveName: '',
  effectivePhotoURL: '',
  authError: null,
  signIn: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
})

function extractAuthCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code?: unknown }).code ?? '')
  }
  return ''
}

function extractAuthMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message ?? '')
  }
  return ''
}

function mapSignInError(error: unknown): string {
  const code = extractAuthCode(error)
  const message = extractAuthMessage(error)

  if (code === 'auth/unauthorized-domain') {
    return '此網域尚未加入 Firebase Authentication Authorized domains，請先加入 holywood-saas.vercel.app。'
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Firebase Authentication 尚未啟用 Google 登入，請到 Firebase Console 開啟 Google provider。'
  }
  if (code === 'auth/invalid-api-key') {
    return 'Firebase API key 無效，請檢查 Vercel 的 NEXT_PUBLIC_FIREBASE_API_KEY。'
  }
  if (code === 'auth/network-request-failed') {
    return '網路請求失敗。若你有使用廣告/隱私外掛，請先允許 holywood-saas.vercel.app 與 accounts.google.com 再重試。'
  }
  if (code === 'auth/cancelled-popup-request') {
    return '已取消登入視窗，請再試一次。'
  }
  if (code === 'auth/popup-blocked') {
    return '瀏覽器阻擋了登入視窗，請允許彈出視窗後再試一次。'
  }
  if (code === 'auth/popup-closed-by-user') {
    return '登入視窗已關閉，請再試一次。'
  }
  if (message.includes('Illegal url for new iframe')) {
    return 'Firebase 設定讀到了異常字元。請強制重整頁面後再試，若仍失敗請通知我重設 Vercel 環境變數。'
  }
  if (
    message.toLowerCase().includes('blocked by') ||
    message.toLowerCase().includes('content blocker')
  ) {
    return '瀏覽器內容阻擋器擋住 Google 登入流程，請停用外掛或將 holywood-saas.vercel.app、accounts.google.com 加入白名單。'
  }
  return `Google 登入失敗（${code || 'unknown'}）${message ? `：${message}` : ''}`
}

function shouldFallbackToRedirect(code: string): boolean {
  if (!code) return true
  if (code === 'auth/unauthorized-domain') return false
  if (code === 'auth/operation-not-allowed') return false
  if (code === 'auth/invalid-api-key') return false
  return true
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getRedirectResult(auth)
      .then(() => {
        if (!cancelled) setAuthError(null)
      })
      .catch((error) => {
        if (cancelled) return
        setAuthError(mapSignInError(error))
        console.error('[auth] getRedirectResult failed', error)
      })

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      try {
        if (firebaseUser) {
          setAuthError(null)
          const googlePhotoURL = resolveGoogleAvatarUrl(firebaseUser)
          await upsertUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName ?? '',
            email: firebaseUser.email ?? '',
            photoURL: googlePhotoURL,
          })
          const p = await getUser(firebaseUser.uid)
          setProfile(p)
        } else {
          setProfile(null)
        }
      } catch (error) {
        console.error('[auth] failed to sync user profile', error)
        if (firebaseUser) {
          const googlePhotoURL = resolveGoogleAvatarUrl(firebaseUser)
          setProfile({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName ?? '',
            email: firebaseUser.email ?? '',
            photoURL: googlePhotoURL,
            createdAt: Date.now(),
          })
        } else {
          setProfile(null)
        }
      } finally {
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  const refreshProfile = async () => {
    if (!user) return
    const p = await getUser(user.uid)
    setProfile(p)
  }

  const handleSignIn = async () => {
    setAuthError(null)
    try {
      await signInWithPopup(auth, googleProvider)
      return
    } catch (popupError) {
      const code = extractAuthCode(popupError)
      if (!shouldFallbackToRedirect(code)) {
        setAuthError(mapSignInError(popupError))
        console.error('[auth] signInWithPopup failed (no redirect fallback)', popupError)
        return
      }
    }

    // Popup 被阻擋或失敗，再走 redirect
    try {
      await signInWithRedirect(auth, googleProvider)
      return
    } catch (redirectError) {
      setAuthError(mapSignInError(redirectError))
      console.error('[auth] signInWithRedirect failed after popup', redirectError)
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
  }

  const effectiveName = profile?.customName || profile?.displayName || user?.displayName || ''
  const effectivePhotoURL = resolveGoogleAvatarUrl(user, profile?.photoURL ?? '')

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      effectiveName,
      effectivePhotoURL,
      authError,
      signIn: handleSignIn,
      signOut: handleSignOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
