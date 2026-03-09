'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'

export default function LoginPage() {
  const { user, loading, signIn, authError } = useAuth()
  const { teams, loadingTeams, teamsError, refreshTeams } = useTeam()
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
  const isInApp = /FBAN|FBAV|Instagram|MicroMessenger|Line\//i.test(ua)
    || (ua.includes('Android') && ua.includes('; wv)'))

  useEffect(() => {
    if (loading || loadingTeams || teamsError) return
    if (!user) return
    if (teams.length > 0) {
      router.replace('/schedule')
    } else {
      router.replace('/onboarding')
    }
  }, [user, loading, teams, loadingTeams, teamsError, router])

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
          letterSpacing: '0.18em',
          color: 'var(--muted)',
          marginBottom: '0.8rem',
        }}>
          跨組織、多角色、短期任務型人力協作平台
        </div>
        <p style={{
          fontSize: '0.76rem',
          color: 'var(--muted)',
          lineHeight: 1.8,
          margin: '0 0 2.2rem',
        }}>
          先建立活動，再讓成員直接加入活動角色，並把平時的參與、取消與支援軌跡累積成年度回顧。
        </p>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem', textAlign: 'left' }}>
          {[
            { icon: '◈', title: '多團隊協作', desc: '同一個帳號可建立自己的團隊，也能加入別人的團隊' },
            { icon: '◉', title: '活動角色排班', desc: '直接以活動需求安排主責、助教或其他角色名額' },
            { icon: '◎', title: '年度回顧', desc: '平時的參與、取消與換班會自然累積成量化資料' },
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
        {user && teamsError ? (
          <div style={{
            border: '1px solid rgba(224,85,85,0.35)',
            background: 'rgba(224,85,85,0.08)',
            padding: '1rem 1.15rem',
            textAlign: 'left',
          }}>
            <p style={{
              fontSize: '0.82rem',
              color: '#f0a7a7',
              letterSpacing: '0.05em',
              marginBottom: '0.45rem',
              fontWeight: 500,
            }}>
              已登入，但團隊資料暫時讀不到
            </p>
            <p style={{
              fontSize: '0.76rem',
              color: 'var(--body-text)',
              lineHeight: 1.7,
              marginBottom: '0.8rem',
            }}>
              {teamsError}
            </p>
            <button
              onClick={() => { void refreshTeams() }}
              style={{
                width: '100%',
                background: 'transparent',
                color: 'var(--warm-white)',
                border: '1px solid var(--dark-border)',
                padding: '0.65rem',
                fontFamily: 'Noto Sans TC, sans-serif',
                fontSize: '0.76rem',
                letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >
              重新載入團隊
            </button>
          </div>
        ) : isInApp ? (
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
          <>
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
            <p style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '0.75rem', lineHeight: 1.7 }}>
              登入後，若你已加入團隊會直接進入排班表；若還沒有團隊，系統會引導你建立第一個團隊。
            </p>
            <div style={{ marginTop: '0.6rem' }}>
              <Link
                href="/landing"
                style={{ fontSize: '0.74rem', color: 'var(--gold)', textDecoration: 'none' }}
              >
                先看功能介紹
              </Link>
            </div>
          </>
        )}

        {(authError || (!user && teamsError)) && (
          <p style={{ fontSize: '0.76rem', color: '#e06c6c', marginTop: '0.75rem', lineHeight: 1.6 }}>
            {authError || teamsError}
          </p>
        )}

        <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '1.5rem', letterSpacing: '0.05em' }}>
          v1.0 · 活動協作版
        </p>
      </div>
    </main>
  )
}
