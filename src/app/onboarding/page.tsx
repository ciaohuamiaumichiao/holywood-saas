'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'
import { DEMO_TEAM_LIMIT, DEMO_TEAM_LIMIT_MESSAGE } from '@/lib/demo-config'
import { getTeam } from '@/lib/firestore-teams'
import { postJsonWithAuth } from '@/lib/authed-post'
import { RoleConfig } from '@/lib/types'

const DEFAULT_ROLES: RoleConfig[] = [
  { id: 'director', label: '導播', order: 0 },
  { id: 'ad', label: 'AD', order: 1 },
  { id: 'camera1', label: '攝影師 1', order: 2 },
  { id: 'camera2', label: '攝影師 2', order: 3 },
  { id: 'camera3', label: '攝影師 3', order: 4 },
  { id: 'camera4', label: '攝影師 4', order: 5 },
  { id: 'livestream', label: '網路直播', order: 6 },
  { id: 'photography', label: '平面攝影', order: 7 },
]

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth()
  const { refreshTeams, switchTeam, teams, loadingTeams } = useTeam()
  const router = useRouter()

  const [teamName, setTeamName] = useState('')
  const [roles, setRoles] = useState<RoleConfig[]>(DEFAULT_ROLES)
  const [newRoleLabel, setNewRoleLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const ownedTeamCount = user ? teams.filter(team => team.createdBy === user.uid).length : 0
  const hasReachedTeamLimit = ownedTeamCount >= DEMO_TEAM_LIMIT

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/')
    }
  }, [authLoading, user, router])

  const handleAddRole = () => {
    const label = newRoleLabel.trim()
    if (!label) return
    const id = label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
    setRoles(prev => [...prev, { id, label, order: prev.length }])
    setNewRoleLabel('')
  }

  const handleRemoveRole = (id: string) => {
    setRoles(prev => prev.filter(r => r.id !== id))
  }

  const handleCreate = async () => {
    const name = teamName.trim()
    if (!name) { setError('請輸入團隊名稱'); return }
    if (!user) return
    if (roles.length === 0) { setError('至少需要一個崗位'); return }
    if (loadingTeams) { setError('正在確認可建立的團隊數量，請稍後再試。'); return }
    if (hasReachedTeamLimit) { setError(DEMO_TEAM_LIMIT_MESSAGE); return }

    setCreating(true)
    setError('')
    try {
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'team'
      const { teamId } = await postJsonWithAuth<{ teamId: string }>('/api/teams/create', {
        name,
        slug: slug + '-' + Date.now().toString(36),
        roles,
      })
      const created = await getTeam(teamId)
      if (!created) {
        throw new Error('team_not_found_after_create')
      }
      try {
        localStorage.setItem('lastCreatedTeamId', teamId)
      } catch {
        // ignore storage errors
      }
      try {
        await refreshTeams()
      } catch (refreshError) {
        console.error('[onboarding] refreshTeams failed after createTeam', refreshError)
      }
      switchTeam(teamId)
      router.replace('/schedule?team=' + teamId)
    } catch (e) {
      const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code?: unknown }).code ?? '') : ''
      const message = typeof e === 'object' && e !== null && 'message' in e ? String((e as { message?: unknown }).message ?? '') : ''
      setError(`建立失敗：${[code, message].filter(Boolean).join(' ') || '請稍後再試'}`)
      console.error(e)
    } finally {
      setCreating(false)
    }
  }

  if (authLoading || !user) return null

  return (
    <main style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', letterSpacing: '0.2em', color: 'var(--warm-white)', marginBottom: '0.5rem' }}>
            HOLY<span style={{ color: 'var(--gold)' }}>WOOD</span>
          </div>
          <h1 style={{ fontFamily: 'Noto Sans TC, sans-serif', fontSize: '1.1rem', color: 'var(--warm-white)', fontWeight: 400, marginBottom: '0.4rem' }}>
            建立你的團隊
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.7 }}>
            設定團隊名稱與崗位清單，完成後即可開始排班。
          </p>
        </div>

        <div style={{
          marginBottom: '1.2rem',
          padding: '0.9rem 1rem',
          border: `1px solid ${hasReachedTeamLimit ? 'rgba(224,85,85,0.35)' : 'rgba(200,164,85,0.22)'}`,
          background: hasReachedTeamLimit ? 'rgba(224,85,85,0.08)' : 'rgba(200,164,85,0.08)',
        }}>
          <p style={{ margin: 0, fontSize: '0.82rem', color: hasReachedTeamLimit ? '#f0aaaa' : 'var(--warm-white)' }}>
            DEMO 版每個帳號最多可建立 {DEMO_TEAM_LIMIT} 個團隊。你目前已建立 {ownedTeamCount} 個。
          </p>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
            若需更多團隊，請洽管理員協助開通。
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 團隊名稱 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              團隊名稱
            </label>
            <input
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="例：HOLYWOOD 影視服事"
              style={{
                width: '100%',
                background: 'var(--dark-surface)',
                border: '1px solid var(--dark-border)',
                color: 'var(--warm-white)',
                padding: '0.75rem 1rem',
                fontSize: '0.9rem',
                fontFamily: 'Noto Sans TC, sans-serif',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* 崗位清單 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              崗位設定
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {roles.map((r, i) => (
                <div key={r.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  background: 'var(--dark-surface)',
                  border: '1px solid var(--dark-border)',
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--warm-white)' }}>
                    <span style={{ color: 'var(--muted)', marginRight: '0.6rem', fontSize: '0.75rem' }}>{i + 1}</span>
                    {r.label}
                  </span>
                  <button
                    onClick={() => handleRemoveRole(r.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.9rem', padding: '0 0.2rem' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {/* 新增崗位 */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={newRoleLabel}
                onChange={e => setNewRoleLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddRole()}
                placeholder="新增崗位名稱"
                style={{
                  flex: 1,
                  background: 'var(--dark)',
                  border: '1px solid var(--dark-border)',
                  color: 'var(--warm-white)',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.85rem',
                  fontFamily: 'Noto Sans TC, sans-serif',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAddRole}
                style={{
                  background: 'rgba(200,164,85,0.1)',
                  border: '1px solid rgba(200,164,85,0.3)',
                  color: 'var(--gold)',
                  padding: '0.55rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontFamily: 'Noto Sans TC, sans-serif',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                + 新增
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontSize: '0.82rem', color: '#e06c6c', margin: 0 }}>{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={creating || loadingTeams || hasReachedTeamLimit}
            style={{
              width: '100%',
              background: creating || loadingTeams || hasReachedTeamLimit ? 'rgba(200,164,85,0.3)' : 'var(--gold)',
              color: 'var(--black)',
              border: 'none',
              padding: '0.9rem',
              fontSize: '0.9rem',
              fontFamily: 'Bebas Neue, sans-serif',
              letterSpacing: '0.15em',
              cursor: creating || loadingTeams || hasReachedTeamLimit ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {creating ? '建立中…' : hasReachedTeamLimit ? '已達 DEMO 團隊上限' : loadingTeams ? '檢查中…' : '建立團隊'}
          </button>
        </div>
      </div>
    </main>
  )
}
