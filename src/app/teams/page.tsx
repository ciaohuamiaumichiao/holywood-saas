'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'
import { DEMO_TEAM_LIMIT, DEMO_TEAM_LIMIT_MESSAGE } from '@/lib/demo-config'
import { postJsonWithAuth } from '@/lib/authed-post'
import { getTeamMember } from '@/lib/firestore-teams'
import { MemberRole, TeamMember } from '@/lib/types'

const roleLabelMap: Record<MemberRole, string> = {
  owner: '擁有者',
  admin: '管理員',
  member: '成員',
}

function formatDate(ts?: number) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('zh-TW')
}

export default function TeamsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { teams, activeTeamId, switchTeam, refreshTeams, loadingTeams, teamsError } = useTeam()
  const [fetchedMemberMap, setFetchedMemberMap] = useState<Record<string, TeamMember | null>>({})
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingTeam, setDeletingTeam] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/')
    }
  }, [loading, user, router])

  useEffect(() => {
    let cancelled = false
    if (!user || teams.length === 0) return
    Promise.all(
      teams.map(async team => ({
        teamId: team.id,
        member: await getTeamMember(team.id, user.uid),
      }))
    ).then(rows => {
      if (cancelled) return
      const next: Record<string, TeamMember | null> = {}
      rows.forEach(row => { next[row.teamId] = row.member })
      setFetchedMemberMap(next)
    }).catch(error => {
      if (cancelled) return
      console.error('[teams] load members failed', error)
    })
    return () => { cancelled = true }
  }, [user, teams])

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => b.createdAt - a.createdAt)
  }, [teams])
  const ownedTeamCount = useMemo(() => {
    if (!user) return 0
    return teams.filter(team => team.createdBy === user.uid).length
  }, [teams, user])
  const hasReachedTeamLimit = ownedTeamCount >= DEMO_TEAM_LIMIT
  const memberMap = useMemo(() => {
    if (!user || teams.length === 0) return {}
    return fetchedMemberMap
  }, [fetchedMemberMap, user, teams])

  async function handleDeleteTeam() {
    if (!deleteTarget) return

    setDeletingTeam(true)
    setDeleteError(null)
    try {
      await postJsonWithAuth('/api/teams/delete', {
        teamId: deleteTarget.id,
        confirmTeamName: deleteConfirmName.trim(),
      })

      try {
        if (localStorage.getItem('activeTeamId') === deleteTarget.id) {
          localStorage.removeItem('activeTeamId')
        }
        if (localStorage.getItem('lastCreatedTeamId') === deleteTarget.id) {
          localStorage.removeItem('lastCreatedTeamId')
        }
      } catch {
        // ignore storage errors
      }

      const remainingCount = teams.filter((team) => team.id !== deleteTarget.id).length
      setDeleteTarget(null)
      setDeleteConfirmName('')
      await refreshTeams()
      router.replace(remainingCount > 0 ? '/teams' : '/onboarding')
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : '刪除失敗，請稍後再試。')
    } finally {
      setDeletingTeam(false)
    }
  }

  if (loading || !user) return null

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', color: 'var(--body-text)' }}>
      <Navbar />

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '2.2rem',
              color: 'var(--warm-white)',
              letterSpacing: '0.05em',
              marginBottom: '0.4rem',
            }}>
              我的團隊
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
              查看你加入或建立的所有團隊，並切換當前使用團隊。
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.45rem 0 0' }}>
              DEMO 版建立上限：{ownedTeamCount}/{DEMO_TEAM_LIMIT} 個團隊。
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={() => refreshTeams()}
              style={{
                fontSize: '0.78rem',
                letterSpacing: '0.08em',
                color: 'var(--muted)',
                background: 'transparent',
                border: '1px solid var(--dark-border)',
                padding: '0.45rem 0.8rem',
                cursor: 'pointer',
                fontFamily: 'Noto Sans TC, sans-serif',
              }}
            >
              重新整理
            </button>
            {hasReachedTeamLimit ? (
              <button
                disabled
                style={{
                  fontSize: '0.8rem',
                  letterSpacing: '0.1em',
                  color: 'rgba(0,0,0,0.55)',
                  background: 'rgba(200,164,85,0.35)',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  fontFamily: 'Noto Sans TC, sans-serif',
                  cursor: 'not-allowed',
                }}
              >
                已達 DEMO 上限
              </button>
            ) : (
              <Link href="/onboarding" style={{
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                color: 'var(--black)',
                background: 'var(--gold)',
                padding: '0.5rem 1rem',
                textDecoration: 'none',
                fontFamily: 'Noto Sans TC, sans-serif',
              }}>
                建立新團隊
              </Link>
            )}
          </div>
        </div>

        {hasReachedTeamLimit && (
          <div style={{
            marginTop: '1.2rem',
            padding: '1rem 1.1rem',
            border: '1px solid rgba(224,85,85,0.25)',
            background: 'rgba(224,85,85,0.08)',
          }}>
            <p style={{ margin: 0, color: '#f0a7a7', fontSize: '0.82rem' }}>{DEMO_TEAM_LIMIT_MESSAGE}</p>
          </div>
        )}

        {teamsError && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem 1.1rem',
            border: '1px solid rgba(224,85,85,0.25)',
            background: 'rgba(224,85,85,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <p style={{ margin: 0, color: '#f0a7a7', fontSize: '0.82rem' }}>{teamsError}</p>
            <button
              onClick={() => { void refreshTeams() }}
              style={{
                fontSize: '0.78rem',
                letterSpacing: '0.08em',
                color: 'var(--warm-white)',
                background: 'transparent',
                border: '1px solid var(--dark-border)',
                padding: '0.45rem 0.8rem',
                cursor: 'pointer',
                fontFamily: 'Noto Sans TC, sans-serif',
              }}
            >
              重新載入
            </button>
          </div>
        )}

        {loadingTeams ? (
          <p style={{ marginTop: '2.5rem', color: 'var(--muted)' }}>載入團隊中...</p>
        ) : teamsError && sortedTeams.length === 0 ? (
          <div style={{
            marginTop: '2.5rem',
            padding: '2rem',
            background: 'var(--dark-surface)',
            border: '1px solid var(--dark-border)',
          }}>
            <p style={{ margin: 0, color: 'var(--warm-white)' }}>目前無法讀取團隊資料。</p>
            <p style={{ margin: '0.6rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
              先重新整理一次；若問題持續，代表資料庫讀取或權限設定仍需檢查。
            </p>
          </div>
        ) : sortedTeams.length === 0 ? (
          <div style={{
            marginTop: '2.5rem',
            padding: '2rem',
            background: 'var(--dark-surface)',
            border: '1px solid var(--dark-border)',
          }}>
            <p style={{ margin: 0, color: 'var(--muted)' }}>目前尚未加入任何團隊。</p>
            <p style={{ margin: '0.6rem 0 0', fontSize: '0.85rem' }}>
              點擊「建立新團隊」開始排班，或透過邀請連結加入既有團隊。
            </p>
          </div>
        ) : (
          <div style={{
            marginTop: '2.5rem',
            display: 'grid',
            gap: '1rem',
          }}>
            {sortedTeams.map(team => {
              const member = memberMap[team.id]
              const roleLabel = member?.role ? roleLabelMap[member.role] : '—'
              const isActive = team.id === activeTeamId
              const isAdmin = member?.role === 'owner' || member?.role === 'admin'
              const isOwner = member?.role === 'owner'
              return (
                <div key={team.id} style={{
                  border: '1px solid var(--dark-border)',
                  background: isActive ? 'rgba(200,164,85,0.08)' : 'var(--dark-surface)',
                  padding: '1.25rem 1.5rem',
                  display: 'grid',
                  gap: '0.75rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        團隊名稱
                      </p>
                      <h2 style={{ margin: '0.3rem 0 0', color: 'var(--warm-white)', fontSize: '1.1rem' }}>
                        {team.name}
                      </h2>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>你的角色</p>
                      <p style={{ margin: '0.3rem 0 0', fontSize: '0.95rem', color: 'var(--gold)' }}>
                        {roleLabel}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <p style={metaLabelStyle}>方案</p>
                      <p style={metaValueStyle}>{team.plan}</p>
                    </div>
                    <div>
                      <p style={metaLabelStyle}>崗位數</p>
                      <p style={metaValueStyle}>{team.roles.length}</p>
                    </div>
                    <div>
                      <p style={metaLabelStyle}>建立日期</p>
                      <p style={metaValueStyle}>{formatDate(team.createdAt)}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => { switchTeam(team.id); router.push('/schedule?team=' + team.id) }}
                      style={{
                        fontSize: '0.8rem',
                        letterSpacing: '0.08em',
                        color: 'var(--black)',
                        background: 'var(--gold)',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        cursor: 'pointer',
                        fontFamily: 'Noto Sans TC, sans-serif',
                      }}
                    >
                      進入排班
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => { switchTeam(team.id); router.push('/admin?team=' + team.id) }}
                        style={{
                          fontSize: '0.78rem',
                          letterSpacing: '0.08em',
                          color: 'var(--warm-white)',
                          background: 'transparent',
                          border: '1px solid var(--dark-border)',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontFamily: 'Noto Sans TC, sans-serif',
                        }}
                      >
                        管理後台
                      </button>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => {
                          setDeleteTarget({ id: team.id, name: team.name })
                          setDeleteConfirmName('')
                          setDeleteError(null)
                        }}
                        style={{
                          fontSize: '0.78rem',
                          letterSpacing: '0.08em',
                          color: '#f0a7a7',
                          background: 'transparent',
                          border: '1px solid rgba(224,85,85,0.25)',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontFamily: 'Noto Sans TC, sans-serif',
                        }}
                      >
                        刪除團隊
                      </button>
                    )}
                    {isActive && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>目前使用中</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {deleteTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 100,
        }}>
          <div style={{
            width: '100%',
            maxWidth: 460,
            background: 'var(--dark-surface)',
            border: '1px solid rgba(224,85,85,0.2)',
            padding: '1.4rem 1.5rem',
            display: 'grid',
            gap: '0.9rem',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '0.12em', color: '#f0a7a7', textTransform: 'uppercase' }}>
                危險操作
              </p>
              <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.15rem', color: 'var(--warm-white)' }}>
                刪除團隊「{deleteTarget.name}」
              </h2>
            </div>

            <div style={{
              padding: '0.9rem 1rem',
              border: '1px solid rgba(224,85,85,0.18)',
              background: 'rgba(224,85,85,0.06)',
              fontSize: '0.82rem',
              color: 'var(--body-text)',
              lineHeight: 1.8,
            }}>
              這會刪除整個團隊，以及其排班歷程、活動、邀請與相關聯的聯合群組關聯。刪除後無法復原。
            </div>

            <div>
              <label style={confirmLabelStyle}>請輸入團隊名稱再次確認</label>
              <input
                value={deleteConfirmName}
                onChange={(event) => setDeleteConfirmName(event.target.value)}
                placeholder={deleteTarget.name}
                style={confirmInputStyle}
              />
            </div>

            {deleteError && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#f0a7a7' }}>
                {deleteError}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  if (deletingTeam) return
                  setDeleteTarget(null)
                  setDeleteConfirmName('')
                  setDeleteError(null)
                }}
                style={cancelButtonStyle}
              >
                取消
              </button>
              <button
                onClick={() => { void handleDeleteTeam() }}
                disabled={deletingTeam || deleteConfirmName.trim() !== deleteTarget.name}
                style={{
                  ...deleteButtonStyle,
                  opacity: deletingTeam || deleteConfirmName.trim() !== deleteTarget.name ? 0.5 : 1,
                  cursor: deletingTeam || deleteConfirmName.trim() !== deleteTarget.name ? 'not-allowed' : 'pointer',
                }}
              >
                {deletingTeam ? '刪除中...' : '確認刪除團隊'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const metaLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.75rem',
  color: 'var(--muted)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const metaValueStyle: React.CSSProperties = {
  margin: '0.35rem 0 0',
  fontSize: '0.9rem',
  color: 'var(--warm-white)',
}

const confirmLabelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.4rem',
  fontSize: '0.78rem',
  color: 'var(--muted)',
  letterSpacing: '0.08em',
}

const confirmInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--dark)',
  border: '1px solid var(--dark-border)',
  color: 'var(--warm-white)',
  padding: '0.72rem 0.8rem',
  fontSize: '0.86rem',
  fontFamily: 'Noto Sans TC, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
}

const cancelButtonStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  letterSpacing: '0.08em',
  color: 'var(--warm-white)',
  background: 'transparent',
  border: '1px solid var(--dark-border)',
  padding: '0.65rem 1rem',
  fontFamily: 'Noto Sans TC, sans-serif',
  cursor: 'pointer',
}

const deleteButtonStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  letterSpacing: '0.08em',
  color: 'var(--black)',
  background: '#e78c8c',
  border: 'none',
  padding: '0.65rem 1rem',
  fontFamily: 'Noto Sans TC, sans-serif',
}
