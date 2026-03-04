'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'

export default function LoginPage() {
  const { user, loading, signIn, authError } = useAuth()
  const { teams, loadingTeams } = useTeam()
  const router = useRouter()

  useEffect(() => {
    if (loading || loadingTeams) return
    if (!user) return
    if (teams.length > 0) {
      router.replace('/schedule')
    } else {
      router.replace('/onboarding')
    }
  }, [user, loading, teams, loadingTeams, router])

  if (loading) return null

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--black)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        {/* Logo */}
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '3rem',
          letterSpacing: '0.25em',
          marginBottom: '0.3rem',
          color: 'var(--warm-white)',
        }}>
          HOLY<span style={{ color: 'var(--gold)' }}>WOOD</span>
        </div>
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '0.85rem',
          letterSpacing: '0.3em',
          color: 'var(--muted)',
          marginBottom: '3rem',
        }}>
          影視排班平台
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem', textAlign: 'left' }}>
          {[
            { icon: '◈', title: '多團隊管理', desc: '一個帳號管理多個服事團隊' },
            { icon: '◉', title: '崗位自訂', desc: '依團隊需求彈性設定崗位' },
            { icon: '◎', title: '邀請連結', desc: '一鍵邀請新成員加入' },
          ].map(f => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ color: 'var(--gold)', fontSize: '1rem', marginTop: '0.1rem', flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--warm-white)', marginBottom: '0.1rem' }}>{f.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Login Button */}
        <button
          onClick={() => signIn()}
          style={{
            width: '100%',
            background: 'var(--gold)',
            color: 'var(--black)',
            border: 'none',
            padding: '1rem',
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '1rem',
            letterSpacing: '0.2em',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          用 Google 登入
        </button>

        {authError && (
          <p style={{ fontSize: '0.76rem', color: '#e06c6c', marginTop: '0.75rem', lineHeight: 1.6 }}>
            {authError}
          </p>
        )}

        <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '1.5rem', letterSpacing: '0.05em' }}>
          v1.0 · SaaS 多租戶版
        </p>
      </div>
    </main>
  )
}
