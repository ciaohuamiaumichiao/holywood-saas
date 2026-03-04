'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'
import { getInvitation } from '@/lib/firestore-teams'
import { postJsonWithAuth } from '@/lib/authed-post'
import { Invitation } from '@/lib/types'

export default function JoinPage() {
  const { user, profile, loading: authLoading, signIn } = useAuth()
  const { refreshTeams } = useTeam()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const token = params.token as string
  const teamId = searchParams.get('team') ?? ''
  const hasJoinParams = Boolean(teamId && token)

  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'joining' | 'done' | 'error'>(
    hasJoinParams ? 'loading' : 'invalid'
  )
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!hasJoinParams) return
    getInvitation(teamId, token).then(inv => {
      if (!inv || !inv.active || inv.expiresAt < Date.now()) {
        setStatus('invalid')
        return
      }
      if (inv.maxUses > 0 && inv.usedCount >= inv.maxUses) {
        setStatus('invalid')
        return
      }
      setInvitation(inv)
      setStatus('valid')
    })
  }, [hasJoinParams, teamId, token])

  const handleJoin = async () => {
    if (!user || !profile || !invitation) return
    setStatus('joining')
    try {
      await postJsonWithAuth('/api/join-team', {
        teamId,
        inviteToken: token,
      })
      await refreshTeams()
      setStatus('done')
      setTimeout(() => router.replace('/schedule'), 1500)
    } catch (e) {
      setErrorMsg('加入失敗，請稍後再試')
      setStatus('error')
      console.error(e)
    }
  }

  if (authLoading || status === 'loading') {
    return <LoadingScreen />
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', letterSpacing: '0.2em', color: 'var(--warm-white)', marginBottom: '2rem' }}>
          HOLY<span style={{ color: 'var(--gold)' }}>WOOD</span>
        </div>

        {status === 'invalid' && (
          <>
            <p style={{ color: '#e06c6c', fontSize: '0.9rem', marginBottom: '1rem' }}>
              這個邀請連結已失效或過期。
            </p>
            <button onClick={() => router.replace('/')} style={btnStyle}>
              回到首頁
            </button>
          </>
        )}

        {status === 'valid' && invitation && (
          <>
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
              你受邀加入
            </p>
            <h1 style={{ fontFamily: 'Noto Sans TC, sans-serif', fontSize: '1.4rem', color: 'var(--warm-white)', fontWeight: 400, marginBottom: '0.4rem' }}>
              {invitation.teamName}
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '2rem' }}>
              由 {invitation.createdByName} 邀請
            </p>

            {!user ? (
              <button onClick={() => signIn()} style={btnStyle}>
                用 Google 登入以加入
              </button>
            ) : (
              <button onClick={handleJoin} style={btnStyle}>
                確認加入
              </button>
            )}
          </>
        )}

        {status === 'joining' && (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>加入中…</p>
        )}

        {status === 'done' && (
          <p style={{ color: 'var(--gold)', fontSize: '0.9rem' }}>
            成功加入！正在前往排班頁面…
          </p>
        )}

        {status === 'error' && (
          <>
            <p style={{ color: '#e06c6c', fontSize: '0.9rem', marginBottom: '1rem' }}>{errorMsg}</p>
            <button onClick={() => router.replace('/')} style={btnStyle}>
              回到首頁
            </button>
          </>
        )}
      </div>
    </main>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'var(--gold)',
  color: 'var(--black)',
  border: 'none',
  padding: '0.85rem 2rem',
  fontFamily: 'Bebas Neue, sans-serif',
  letterSpacing: '0.15em',
  fontSize: '0.9rem',
  cursor: 'pointer',
}

function LoadingScreen() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>載入中…</p>
    </main>
  )
}
