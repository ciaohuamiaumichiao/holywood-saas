'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, User } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { upsertUser, getUser } from '@/lib/firestore-teams'
import { UserProfile } from '@/lib/types'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  effectiveName: string
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
  authError: null,
  signIn: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
})

function mapSignInError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : ''

  if (code === 'auth/unauthorized-domain') {
    return '此網域尚未加入 Firebase Authentication Authorized domains，請先加入 holywood-saas.vercel.app。'
  }
  if (code === 'auth/popup-blocked') {
    return '瀏覽器阻擋了登入視窗，請允許彈出視窗後再試一次。'
  }
  if (code === 'auth/popup-closed-by-user') {
    return '登入視窗已關閉，請再試一次。'
  }
  return 'Google 登入失敗，請稍後再試。'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        setAuthError(null)
        await upsertUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName ?? '',
          email: firebaseUser.email ?? '',
          photoURL: firebaseUser.photoURL ?? '',
        })
        const p = await getUser(firebaseUser.uid)
        setProfile(p)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
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
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: unknown }).code ?? '')
          : ''

      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, googleProvider)
          return
        } catch (redirectError) {
          setAuthError(mapSignInError(redirectError))
          throw redirectError
        }
      }

      setAuthError(mapSignInError(error))
      throw error
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
  }

  const effectiveName = profile?.customName || profile?.displayName || user?.displayName || ''

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      effectiveName,
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
