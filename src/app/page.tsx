'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'

export default function LoginPage() {
  const { user, loading, signIn, authError } = useAuth()
  const { teams, loadingTeams } = useTeam()
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
  const isInApp = /FBAN|FBAV|Instagram|MicroMessenger|Line\//i.test(ua)
    || (ua.includes('Android') && ua.includes('; wv)'))

  useEffect(() => {
    if (loading || loadingTeams) return
    if (!user) return
    if (teams.length > 0) {
      router.replace('/schedule')
    } else {
      router.replace('/onboarding')
    }
  }, [user, loading, teams, loadingTeams, router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const currentUa = window.navigator.userAgent
    if (!/Line\//i.test(currentUa)) return

    const url = new URL(window.location.href)
    if (url.searchParams.has('openExternalBrowser')) return
    url.searchParams.set('openExternalBrowser', '1')
    window.location.replace(url.toString())
  }, [])

  const handleCopy = () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }).catch(() => {})
  }

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

        {/* Login */}
        {isInApp ? (
          <div style={{
            border: '1px solid rgba(200,164,85,0.4)',
            background: 'rgba(200,164,85,0.06)',
            padding: '1rem 1.15rem',
            textAlign: 'left',
          }}>
            <p style={{
              fontSize: '0.82rem',
              color: 'var(--gold)',
              letterSpacing: '0.05em',
              marginBottom: '0.45rem',
              fontWeight: 500,
            }}>
              請改用外部瀏覽器登入
            </p>
            <p style={{
              fontSize: '0.76rem',
              color: 'var(--body-text)',
              lineHeight: 1.7,
              marginBottom: '0.8rem',
            }}>
              目前是內建瀏覽器，Google 登入常被封鎖。<br />
              請用 Safari / Chrome 開啟此頁面再登入。
            </p>
            <button
              onClick={handleCopy}
              style={{
                width: '100%',
                background: copied ? 'rgba(200,164,85,0.16)' : 'transparent',
                color: copied ? 'var(--gold)' : 'var(--muted)',
                border: '1px solid var(--dark-border)',
                padding: '0.65rem',
                fontFamily: 'Noto Sans TC, sans-serif',
                fontSize: '0.76rem',
                letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >
              {copied ? '✓ 已複製連結' : '複製連結'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => { void signIn() }}
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
        )}

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
