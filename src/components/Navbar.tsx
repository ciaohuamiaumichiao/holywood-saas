'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'
import { updateUserProfile } from '@/lib/firestore-teams'

export default function Navbar() {
  const { user, profile, effectiveName, signOut, refreshProfile } = useAuth()
  const { teams, activeTeam, activeMember, switchTeam } = useTeam()
  const pathname = usePathname()
  const router = useRouter()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [teamMenuOpen, setTeamMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark'
    const stored = window.localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark'
  })
  const teamMenuRef = useRef<HTMLDivElement>(null)

  const isAdmin = activeMember?.role === 'owner' || activeMember?.role === 'admin'

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (teamMenuRef.current && !teamMenuRef.current.contains(e.target as Node)) {
        setTeamMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-theme', theme)
    try {
      window.localStorage.setItem('theme', theme)
    } catch {
      // ignore storage errors (private mode)
    }
  }, [theme])


  const handleSignOut = async () => {
    await signOut()
    router.replace('/')
  }

  const handleEditName = () => {
    setNameDraft(profile?.customName || profile?.displayName || '')
    setEditingName(true)
  }

  const handleSaveName = async () => {
    if (!user) return
    setSavingName(true)
    await updateUserProfile(user.uid, { customName: nameDraft.trim() || undefined })
    await refreshProfile()
    setSavingName(false)
    setEditingName(false)
  }

  if (!user) return null

  const avatarUrl = user.photoURL || ''
  const avatarText = (effectiveName || user.displayName || user.email || '?')
    .trim()
    .slice(0, 1)
    .toUpperCase()
  const showAvatarImage = Boolean(avatarUrl && avatarError !== avatarUrl)
  const nextTheme = theme === 'light' ? 'dark' : 'light'
  const hasTeams = teams.length > 0
  const canSwitchTeams = teams.length > 1

  return (
    <nav style={{
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--dark-border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
      }}>
        {/* 左：Logo + 桌面導覽 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0 : '2rem' }}>
          <Link href="/board" style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '1.3rem',
            letterSpacing: '0.15em',
            color: 'var(--warm-white)',
            textDecoration: 'none',
          }}>
            HOLY<span style={{ color: 'var(--gold)' }}>WOOD</span>
          </Link>

          {!isMobile && (
            <>
              <NavLink href="/schedule" active={pathname === '/schedule'}>排班表</NavLink>
              <NavLink href="/my-schedule" active={pathname === '/my-schedule'}>我的排班</NavLink>
              <NavLink href="/availability" active={pathname === '/availability'}>可參與日期</NavLink>
              <NavLink href="/teams" active={pathname === '/teams'}>我的團隊</NavLink>
              <NavLink href="/workspaces" active={pathname === '/workspaces'}>聯合群組</NavLink>
              <NavLink href="/guide" active={pathname === '/guide'}>說明</NavLink>
              {isAdmin && <NavLink href="/admin" active={pathname === '/admin'}>管理</NavLink>}
            </>
          )}
        </div>

        {/* 右：桌面 */}
        {!isMobile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* 團隊切換器 */}
            {hasTeams && (
              <div ref={teamMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => canSwitchTeams && setTeamMenuOpen(v => !v)}
                  disabled={!canSwitchTeams}
                  style={{
                    fontSize: '0.72rem',
                    letterSpacing: '0.08em',
                    color: 'var(--gold)',
                    background: canSwitchTeams ? 'rgba(200,164,85,0.08)' : 'rgba(200,164,85,0.04)',
                    border: '1px solid rgba(200,164,85,0.25)',
                    padding: '0.25rem 0.6rem',
                    cursor: canSwitchTeams ? 'pointer' : 'default',
                    fontFamily: 'Noto Sans TC, sans-serif',
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    opacity: canSwitchTeams ? 1 : 0.8,
                  }}
                >
                  {activeTeam?.name ?? '我的團隊'} {canSwitchTeams ? '▾' : ''}
                </button>
                {canSwitchTeams && teamMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    background: 'var(--dark-surface)',
                    border: '1px solid var(--dark-border)',
                    minWidth: 160,
                    zIndex: 100,
                  }}>
                    {teams.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { switchTeam(t.id); setTeamMenuOpen(false) }}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.6rem 1rem',
                          fontSize: '0.82rem',
                          color: t.id === activeTeam?.id ? 'var(--gold)' : 'var(--warm-white)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'Noto Sans TC, sans-serif',
                        }}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showAvatarImage ? (
              <Image
                src={avatarUrl}
                alt={effectiveName || 'User Avatar'}
                width={26}
                height={26}
                style={{ borderRadius: '50%', border: '1px solid var(--dark-border)' }}
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(avatarUrl)}
              />
            ) : (
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  border: '1px solid var(--dark-border)',
                  background: 'var(--dark-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                }}
                aria-label="User Avatar"
              >
                {avatarText}
              </div>
            )}

            {editingName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') setEditingName(false)
                  }}
                  style={{
                    fontSize: '0.82rem',
                    background: 'var(--dark)',
                    border: '1px solid var(--gold)',
                    color: 'var(--warm-white)',
                    padding: '0.2rem 0.5rem',
                    fontFamily: 'Noto Sans TC, sans-serif',
                    width: 120,
                    outline: 'none',
                  }}
                />
                <button onClick={handleSaveName} disabled={savingName} style={smallBtnStyle('gold')}>儲存</button>
                <button onClick={() => setEditingName(false)} style={smallBtnStyle('muted')}>取消</button>
              </div>
            ) : (
              <button onClick={handleEditName} title="點擊修改顯示名稱" style={{
                fontSize: '0.82rem',
                color: 'var(--muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Noto Sans TC, sans-serif',
                padding: 0,
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--warm-white)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
              >
                {effectiveName}
              </button>
            )}

            <button onClick={handleSignOut} style={{
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
              color: 'var(--muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textTransform: 'uppercase',
              padding: '0.3rem 0.6rem',
              transition: 'color 0.3s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
            >
              登出
            </button>
            <button
              onClick={() => setTheme(nextTheme)}
              style={{
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                color: 'var(--muted)',
                background: 'none',
                border: '1px solid var(--dark-border)',
                cursor: 'pointer',
                textTransform: 'uppercase',
                padding: '0.3rem 0.6rem',
                transition: 'color 0.3s, border-color 0.3s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.borderColor = 'rgba(200,164,85,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--dark-border)' }}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? '深色' : '淺色'}
            </button>
          </div>
        ) : (
          /* 手機右側 */
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {showAvatarImage ? (
              <Image
                src={avatarUrl}
                alt={effectiveName || 'User Avatar'}
                width={26}
                height={26}
                style={{ borderRadius: '50%', border: '1px solid var(--dark-border)' }}
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(avatarUrl)}
              />
            ) : (
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  border: '1px solid var(--dark-border)',
                  background: 'var(--dark-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                }}
                aria-label="User Avatar"
              >
                {avatarText}
              </div>
            )}
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? '關閉選單' : '開啟選單'}
              style={{
                background: 'none',
                border: '1px solid ' + (menuOpen ? 'rgba(200,164,85,0.5)' : 'var(--dark-border)'),
                color: menuOpen ? 'var(--gold)' : 'var(--muted)',
                cursor: 'pointer',
                fontSize: '1.1rem',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s, border-color 0.2s',
              }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        )}
      </div>

      {/* 手機下拉選單 */}
      {isMobile && menuOpen && (
          <div style={{ borderTop: '1px solid var(--dark-border)', background: 'var(--nav-bg-strong)', padding: '0.5rem 1.5rem 1.25rem' }}>
          <MobileNavLink href="/schedule" active={pathname === '/schedule'}>排班表</MobileNavLink>
          <MobileNavLink href="/my-schedule" active={pathname === '/my-schedule'}>我的排班</MobileNavLink>
          <MobileNavLink href="/availability" active={pathname === '/availability'}>可參與日期</MobileNavLink>
          <MobileNavLink href="/teams" active={pathname === '/teams'}>我的團隊</MobileNavLink>
          <MobileNavLink href="/workspaces" active={pathname === '/workspaces'}>聯合群組</MobileNavLink>
          <MobileNavLink href="/guide" active={pathname === '/guide'}>說明</MobileNavLink>
          {isAdmin && <MobileNavLink href="/admin" active={pathname === '/admin'}>管理</MobileNavLink>}

          {hasTeams && (
            <>
              <div style={{ height: 1, background: 'var(--dark-border)', margin: '0.5rem 0' }} />
              <p style={{ fontSize: '0.72rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0.5rem 0' }}>
                {canSwitchTeams ? '切換團隊' : '目前團隊'}
              </p>
              {canSwitchTeams ? (
                teams.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { switchTeam(t.id); setMenuOpen(false) }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.6rem 0',
                      fontSize: '0.9rem',
                      color: t.id === activeTeam?.id ? 'var(--gold)' : 'var(--muted)',
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid rgba(42,42,42,0.5)',
                      cursor: 'pointer',
                      fontFamily: 'Noto Sans TC, sans-serif',
                    }}
                  >
                    {t.name}
                  </button>
                ))
              ) : (
                <p style={{ fontSize: '0.9rem', color: 'var(--warm-white)', margin: '0.2rem 0 0.6rem' }}>
                  {activeTeam?.name ?? '我的團隊'}
                </p>
              )}
            </>
          )}

          <div style={{ height: 1, background: 'var(--dark-border)', margin: '0.5rem 0 0.75rem' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {editingName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') setEditingName(false)
                  }}
                  style={{
                    fontSize: '0.88rem',
                    background: 'var(--dark)',
                    border: '1px solid var(--gold)',
                    color: 'var(--warm-white)',
                    padding: '0.3rem 0.6rem',
                    fontFamily: 'Noto Sans TC, sans-serif',
                    flex: 1,
                    outline: 'none',
                  }}
                />
                <button onClick={handleSaveName} disabled={savingName} style={smallBtnStyle('gold')}>儲存</button>
                <button onClick={() => setEditingName(false)} style={smallBtnStyle('muted')}>取消</button>
              </div>
            ) : (
              <button onClick={handleEditName} style={{
                fontSize: '0.9rem',
                color: 'var(--warm-white)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Noto Sans TC, sans-serif',
                padding: 0,
              }}>
                {effectiveName}
              </button>
            )}
            <button onClick={handleSignOut} style={{
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
              color: 'var(--muted)',
              background: 'none',
              border: '1px solid var(--dark-border)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              padding: '0.35rem 0.8rem',
              fontFamily: 'Noto Sans TC, sans-serif',
              flexShrink: 0,
            }}>
              登出
            </button>
            <button
              onClick={() => setTheme(nextTheme)}
              style={{
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                color: 'var(--muted)',
                background: 'none',
                border: '1px solid var(--dark-border)',
                cursor: 'pointer',
                textTransform: 'uppercase',
                padding: '0.35rem 0.8rem',
                fontFamily: 'Noto Sans TC, sans-serif',
                flexShrink: 0,
              }}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? '深色' : '淺色'}
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

function smallBtnStyle(color: 'gold' | 'muted'): React.CSSProperties {
  return {
    fontSize: '0.7rem',
    background: color === 'gold' ? 'var(--gold)' : 'none',
    color: color === 'gold' ? 'var(--black)' : 'var(--muted)',
    border: 'none',
    padding: color === 'gold' ? '0.2rem 0.5rem' : '0',
    cursor: 'pointer',
    fontFamily: 'Noto Sans TC, sans-serif',
  }
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      fontSize: '0.75rem',
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      textDecoration: 'none',
      color: active ? 'var(--gold)' : 'var(--muted)',
      transition: 'color 0.3s',
      fontWeight: 400,
    }}>
      {children}
    </Link>
  )
}

function MobileNavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      display: 'block',
      fontSize: '1rem',
      letterSpacing: '0.05em',
      textDecoration: 'none',
      color: active ? 'var(--gold)' : 'var(--muted)',
      padding: '0.75rem 0',
      borderBottom: '1px solid rgba(42,42,42,0.5)',
      transition: 'color 0.2s',
    }}>
      {children}
    </Link>
  )
}
