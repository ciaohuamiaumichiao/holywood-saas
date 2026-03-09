'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'
import { postJsonWithAuth } from '@/lib/authed-post'
import { MemberRole, Workspace, WorkspaceTeam } from '@/lib/types'

type WorkspaceListItem = Workspace & {
  linkedTeams: WorkspaceTeam[]
}

type WorkspaceListResponse = {
  workspaces: WorkspaceListItem[]
}

type WorkspaceCreateResponse = {
  workspaceId: string
}

type WorkspaceInviteResponse = {
  inviteToken: string
  joinUrl: string
}

type WorkspaceJoinResponse = {
  status: 'joined' | 'already_joined'
  workspaceId: string
}

type WorkspaceOverviewEntry = {
  id: string
  teamId: string
  teamName: string
  eventId: string
  eventDate: string
  eventTitle: string
  roleLabel: string
  assignees: Array<{
    userId: string
    displayName: string
  }>
  conflictUserIds: string[]
}

type WorkspaceOverviewConflict = {
  id: string
  userId: string
  displayName: string
  entries: [
    {
      entryId: string
      teamId: string
      teamName: string
      eventDate: string
      eventTitle: string
      roleLabel: string
    },
    {
      entryId: string
      teamId: string
      teamName: string
      eventDate: string
      eventTitle: string
      roleLabel: string
    },
  ]
}

type WorkspaceOverviewResponse = {
  dateFrom: string
  dateTo: string
  entries: WorkspaceOverviewEntry[]
  conflicts: WorkspaceOverviewConflict[]
}

const teamRoleLabel: Record<MemberRole, string> = {
  owner: '擁有者',
  admin: '管理員',
  member: '成員',
}

function formatDate(value: string) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  })
}

function formatDateTime(ts?: number) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return '操作失敗，請稍後再試。'
}

export default function WorkspacesPage() {
  return (
    <Suspense fallback={<WorkspacesPageFallback />}>
      <WorkspacesPageContent />
    </Suspense>
  )
}

function WorkspacesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const {
    activeTeam,
    activeTeamId,
    activeMember,
    loadingTeams,
    teamsError,
    refreshTeams,
  } = useTeam()

  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([])
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [createName, setCreateName] = useState('')
  const [createPurpose, setCreatePurpose] = useState('')
  const [creatingWorkspace, setCreatingWorkspace] = useState(false)

  const [joinToken, setJoinToken] = useState(() => searchParams.get('invite')?.trim() ?? '')
  const [joiningWorkspace, setJoiningWorkspace] = useState(false)

  const [sharedBriefDrafts, setSharedBriefDrafts] = useState<Record<string, string>>({})
  const [savingWorkspaceId, setSavingWorkspaceId] = useState<string | null>(null)
  const [creatingInviteFor, setCreatingInviteFor] = useState<string | null>(null)
  const [inviteResults, setInviteResults] = useState<Record<string, WorkspaceInviteResponse>>({})
  const [overviewDateFrom, setOverviewDateFrom] = useState(() => getTodayDateString())
  const [overviewDateTo, setOverviewDateTo] = useState(() => addDays(getTodayDateString(), 14))
  const [overviewByWorkspaceId, setOverviewByWorkspaceId] = useState<Record<string, WorkspaceOverviewResponse>>({})
  const [loadingOverviewFor, setLoadingOverviewFor] = useState<string | null>(null)

  const isManager = activeMember?.role === 'owner' || activeMember?.role === 'admin'

  const fetchWorkspaces = useCallback(async () => {
    if (!activeTeamId) return

    setLoadingWorkspaces(true)
    setPageError(null)

    try {
      const { workspaces: nextWorkspaces } = await postJsonWithAuth<WorkspaceListResponse>(
        '/api/workspaces/list',
        { teamId: activeTeamId }
      )
      setWorkspaces(nextWorkspaces)
      setSharedBriefDrafts(
        Object.fromEntries(nextWorkspaces.map((workspace) => [workspace.id, workspace.sharedBrief ?? '']))
      )
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setLoadingWorkspaces(false)
    }
  }, [activeTeamId])

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/')
    }
  }, [loading, user, router])

  useEffect(() => {
    if (!user || !activeTeamId) return
    void fetchWorkspaces()
  }, [user, activeTeamId, fetchWorkspaces])

  async function handleRefresh() {
    setNotice(null)
    await refreshTeams()
    await fetchWorkspaces()
  }

  async function handleCreateWorkspace() {
    if (!activeTeamId) return

    const name = createName.trim()
    if (!name) {
      setPageError('請先輸入聯合群組名稱。')
      return
    }

    setCreatingWorkspace(true)
    setPageError(null)
    setNotice(null)

    try {
      await postJsonWithAuth<WorkspaceCreateResponse>('/api/workspaces/create', {
        teamId: activeTeamId,
        name,
        purpose: createPurpose.trim(),
      })
      setCreateName('')
      setCreatePurpose('')
      setNotice('聯合群組已建立，現在可以產生邀請碼給合作團隊。')
      await fetchWorkspaces()
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setCreatingWorkspace(false)
    }
  }

  async function handleJoinWorkspace() {
    if (!activeTeamId) return

    const inviteToken = joinToken.trim()
    if (!inviteToken) {
      setPageError('請輸入聯合群組邀請碼。')
      return
    }

    setJoiningWorkspace(true)
    setPageError(null)
    setNotice(null)

    try {
      const result = await postJsonWithAuth<WorkspaceJoinResponse>('/api/workspaces/join', {
        teamId: activeTeamId,
        inviteToken,
      })
      setJoinToken('')
      setNotice(
        result.status === 'already_joined'
          ? '目前使用中的團隊已經在這個聯合群組裡。'
          : '已加入聯合群組，現在兩邊團隊都能共享說明與合作資訊。'
      )
      router.replace('/workspaces')
      await fetchWorkspaces()
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setJoiningWorkspace(false)
    }
  }

  async function handleSaveSharedBrief(workspaceId: string) {
    if (!activeTeamId) return

    setSavingWorkspaceId(workspaceId)
    setPageError(null)
    setNotice(null)

    try {
      await postJsonWithAuth('/api/workspaces/update', {
        teamId: activeTeamId,
        workspaceId,
        sharedBrief: sharedBriefDrafts[workspaceId] ?? '',
      })
      setNotice('共享說明已更新。')
      await fetchWorkspaces()
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setSavingWorkspaceId(null)
    }
  }

  async function handleCreateInvite(workspaceId: string) {
    if (!activeTeamId) return

    setCreatingInviteFor(workspaceId)
    setPageError(null)
    setNotice(null)

    try {
      const result = await postJsonWithAuth<WorkspaceInviteResponse>('/api/workspaces/create-invite', {
        teamId: activeTeamId,
        workspaceId,
      })
      setInviteResults((prev) => ({ ...prev, [workspaceId]: result }))
      setNotice('已產生合作邀請，請把連結交給另一個團隊的 Owner 或 Admin。')
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setCreatingInviteFor(null)
    }
  }

  async function handleCopyInvite(text: string) {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setPageError('目前無法自動複製，請手動選取連結。')
      return
    }

    await navigator.clipboard.writeText(text)
    setNotice('邀請連結已複製。')
  }

  async function handleLoadOverview(workspaceId: string) {
    if (!activeTeamId) return

    setLoadingOverviewFor(workspaceId)
    setPageError(null)

    try {
      const result = await postJsonWithAuth<WorkspaceOverviewResponse>('/api/workspaces/overview', {
        teamId: activeTeamId,
        workspaceId,
        dateFrom: overviewDateFrom,
        dateTo: overviewDateTo,
      })
      setOverviewByWorkspaceId((prev) => ({ ...prev, [workspaceId]: result }))
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setLoadingOverviewFor(null)
    }
  }

  if (loading || !user) return null

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', color: 'var(--body-text)' }}>
      <Navbar />

      <main style={{ maxWidth: 1040, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '2.3rem',
              color: 'var(--warm-white)',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
            }}>
              聯合群組
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.8 }}>
              以目前使用中的團隊建立跨團隊合作空間，集中共享合作目的、聯合說明與 partner team。
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {activeTeam && (
              <div style={{
                border: '1px solid rgba(200,164,85,0.22)',
                background: 'rgba(200,164,85,0.08)',
                padding: '0.45rem 0.75rem',
                fontSize: '0.78rem',
                color: 'var(--gold)',
              }}>
                目前團隊：{activeTeam.name}
              </div>
            )}
            {activeMember && (
              <div style={{
                border: '1px solid var(--dark-border)',
                background: 'var(--dark-surface)',
                padding: '0.45rem 0.75rem',
                fontSize: '0.78rem',
                color: 'var(--muted)',
              }}>
                目前角色：{teamRoleLabel[activeMember.role]}
              </div>
            )}
            <button
              onClick={() => { void handleRefresh() }}
              style={{
                fontSize: '0.8rem',
                letterSpacing: '0.08em',
                color: 'var(--warm-white)',
                background: 'transparent',
                border: '1px solid var(--dark-border)',
                padding: '0.48rem 0.9rem',
                cursor: 'pointer',
                fontFamily: 'Noto Sans TC, sans-serif',
              }}
            >
              重新整理
            </button>
          </div>
        </div>

        <div style={{
          marginTop: '1.25rem',
          padding: '1rem 1.1rem',
          border: '1px solid var(--dark-border)',
          background: 'var(--dark-surface)',
          display: 'grid',
          gap: '0.45rem',
        }}>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--warm-white)' }}>
            一個帳號可以同時加入多個團隊，也能自己建立多個團隊。
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.8 }}>
            若你要代表另一個團隊加入合作，先到
            {' '}
            <Link href="/teams" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
              我的團隊
            </Link>
            {' '}
            切換目前使用中的團隊，再回來建立或加入聯合群組。
          </p>
        </div>

        {teamsError && (
          <div style={{
            marginTop: '1.25rem',
            padding: '1rem 1.1rem',
            border: '1px solid rgba(224,85,85,0.25)',
            background: 'rgba(224,85,85,0.08)',
            color: '#f0a7a7',
            fontSize: '0.82rem',
          }}>
            {teamsError}
          </div>
        )}

        {pageError && (
          <div style={{
            marginTop: '1.25rem',
            padding: '1rem 1.1rem',
            border: '1px solid rgba(224,85,85,0.25)',
            background: 'rgba(224,85,85,0.08)',
            color: '#f0a7a7',
            fontSize: '0.82rem',
          }}>
            {pageError}
          </div>
        )}

        {notice && (
          <div style={{
            marginTop: '1.25rem',
            padding: '1rem 1.1rem',
            border: '1px solid rgba(200,164,85,0.25)',
            background: 'rgba(200,164,85,0.08)',
            color: 'var(--gold-light)',
            fontSize: '0.82rem',
          }}>
            {notice}
          </div>
        )}

        {loadingTeams ? (
          <p style={{ marginTop: '2.5rem', color: 'var(--muted)' }}>載入團隊中...</p>
        ) : !activeTeamId || !activeTeam ? (
          <div style={{
            marginTop: '2.5rem',
            padding: '2rem',
            background: 'var(--dark-surface)',
            border: '1px solid var(--dark-border)',
            display: 'grid',
            gap: '0.8rem',
          }}>
            <p style={{ margin: 0, color: 'var(--warm-white)' }}>你目前還沒有可操作的團隊。</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.8 }}>
              先建立自己的團隊，或透過邀請加入既有團隊，之後就能建立聯合群組與其他團隊合作。
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <Link href="/onboarding" style={primaryLinkStyle}>建立第一個團隊</Link>
              <Link href="/teams" style={secondaryLinkStyle}>查看我的團隊</Link>
            </div>
          </div>
        ) : (
          <>
            <div style={{
              marginTop: '2rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem',
            }}>
              <section style={panelStyle}>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={eyebrowStyle}>建立新的合作空間</p>
                  <h2 style={sectionTitleStyle}>為目前團隊開一個聯合群組</h2>
                  <p style={sectionDescStyle}>
                    適合用在大型活動、跨單位合作或雙團隊共用一份前置說明時。
                  </p>
                </div>

                {isManager ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>聯合群組名稱</label>
                      <input
                        value={createName}
                        onChange={(event) => setCreateName(event.target.value)}
                        placeholder="例：母親節特別聚會聯合作業"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>合作目的</label>
                      <textarea
                        rows={3}
                        value={createPurpose}
                        onChange={(event) => setCreatePurpose(event.target.value)}
                        placeholder="例：A 團隊負責影像，B 團隊負責招待與報到，雙方共用一份現場 brief。"
                        style={{ ...inputStyle, resize: 'vertical', minHeight: 96 }}
                      />
                    </div>
                    <button
                      onClick={() => { void handleCreateWorkspace() }}
                      disabled={creatingWorkspace}
                      style={primaryButtonStyle}
                    >
                      {creatingWorkspace ? '建立中...' : '建立聯合群組'}
                    </button>
                  </div>
                ) : (
                  <p style={readonlyNoticeStyle}>
                    只有目前團隊的 Owner / Admin 可以建立聯合群組。你現在可以查看既有合作空間，但不能新增或邀請其他團隊。
                  </p>
                )}
              </section>

              <section style={panelStyle}>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={eyebrowStyle}>加入既有合作空間</p>
                  <h2 style={sectionTitleStyle}>用邀請碼把另一個團隊接進來</h2>
                  <p style={sectionDescStyle}>
                    先切到要代表加入的團隊，再貼上對方分享的邀請碼即可加入。
                  </p>
                </div>

                {isManager ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>聯合群組邀請碼</label>
                      <input
                        value={joinToken}
                        onChange={(event) => setJoinToken(event.target.value)}
                        placeholder="貼上對方提供的邀請碼"
                        style={inputStyle}
                      />
                    </div>
                    <button
                      onClick={() => { void handleJoinWorkspace() }}
                      disabled={joiningWorkspace}
                      style={secondaryButtonStyle}
                    >
                      {joiningWorkspace ? '加入中...' : '加入聯合群組'}
                    </button>
                  </div>
                ) : (
                  <p style={readonlyNoticeStyle}>
                    只有目前團隊的 Owner / Admin 可以代表團隊加入新的聯合群組。若你需要加入，請聯絡團隊管理者操作。
                  </p>
                )}
              </section>
            </div>

            <section style={{ marginTop: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div>
                  <p style={eyebrowStyle}>目前團隊可見的合作空間</p>
                  <h2 style={{ ...sectionTitleStyle, marginBottom: '0.25rem' }}>我的聯合群組列表</h2>
                </div>
                {activeTeam && (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                    顯示與 {activeTeam.name} 有連結的所有合作空間
                  </p>
                )}
              </div>

              <div style={{ ...panelStyle, marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div>
                    <label style={labelStyle}>聯合活動起日</label>
                    <input
                      type="date"
                      value={overviewDateFrom}
                      onChange={(event) => setOverviewDateFrom(event.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>聯合活動迄日</label>
                    <input
                      type="date"
                      value={overviewDateTo}
                      onChange={(event) => setOverviewDateTo(event.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.8 }}>
                    聯合群組內的排班仍由各自原團隊管理。這裡只做整體觀測與衝突提示。
                  </p>
                </div>
              </div>

              {loadingWorkspaces ? (
                <div style={panelStyle}>
                  <p style={{ margin: 0, color: 'var(--muted)' }}>載入聯合群組中...</p>
                </div>
              ) : workspaces.length === 0 ? (
                <div style={panelStyle}>
                  <p style={{ margin: 0, color: 'var(--warm-white)' }}>目前還沒有聯合群組。</p>
                  <p style={{ margin: '0.6rem 0 0', fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.8 }}>
                    你可以先建立一個新的合作空間，或貼上其他團隊分享的邀請碼加入。
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {workspaces.map((workspace) => {
                    const inviteResult = inviteResults[workspace.id]
                    const draftSharedBrief = sharedBriefDrafts[workspace.id] ?? ''
                    const overview = overviewByWorkspaceId[workspace.id]
                    const entriesByDate = (overview?.entries ?? []).reduce<Record<string, WorkspaceOverviewEntry[]>>((groups, entry) => {
                      if (!groups[entry.eventDate]) groups[entry.eventDate] = []
                      groups[entry.eventDate].push(entry)
                      return groups
                    }, {})

                    return (
                      <article key={workspace.id} style={panelStyle}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          flexWrap: 'wrap',
                        }}>
                          <div>
                            <p style={eyebrowStyle}>合作空間</p>
                            <h3 style={{ margin: '0.25rem 0 0.45rem', fontSize: '1.2rem', color: 'var(--warm-white)' }}>
                              {workspace.name}
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.8 }}>
                              {workspace.purpose || '尚未填寫合作目的。'}
                            </p>
                          </div>
                          <div style={{
                            border: '1px solid rgba(200,164,85,0.2)',
                            background: 'rgba(200,164,85,0.08)',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.78rem',
                            color: 'var(--gold)',
                          }}>
                            {workspace.teamCount} 個團隊已連結
                          </div>
                        </div>

                        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.55rem' }}>
                          <p style={labelStyle}>已連結團隊</p>
                          <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                            {workspace.linkedTeams.map((linkedTeam) => (
                              <div
                                key={linkedTeam.teamId}
                                style={{
                                  padding: '0.55rem 0.7rem',
                                  border: '1px solid var(--dark-border)',
                                  background: linkedTeam.teamId === activeTeamId ? 'rgba(200,164,85,0.08)' : 'var(--dark)',
                                  minWidth: 180,
                                }}
                              >
                                <div style={{ fontSize: '0.82rem', color: linkedTeam.teamId === activeTeamId ? 'var(--gold)' : 'var(--warm-white)' }}>
                                  {linkedTeam.teamName}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.25rem', lineHeight: 1.6 }}>
                                  {teamRoleLabel[linkedTeam.joinedByTeamRole]} 加入 · {linkedTeam.joinedByName || '團隊管理者'}
                                  <br />
                                  {formatDateTime(linkedTeam.joinedAt)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.55rem' }}>
                          <label style={labelStyle}>共享說明</label>
                          {isManager ? (
                            <>
                              <textarea
                                rows={4}
                                value={draftSharedBrief}
                                onChange={(event) => {
                                  const nextValue = event.target.value
                                  setSharedBriefDrafts((prev) => ({ ...prev, [workspace.id]: nextValue }))
                                }}
                                placeholder="輸入兩個團隊都要看到的聯合 brief、分工、現場注意事項。"
                                style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => { void handleSaveSharedBrief(workspace.id) }}
                                  disabled={savingWorkspaceId === workspace.id}
                                  style={secondaryButtonStyle}
                                >
                                  {savingWorkspaceId === workspace.id ? '儲存中...' : '儲存共享說明'}
                                </button>
                                <button
                                  onClick={() => { void handleCreateInvite(workspace.id) }}
                                  disabled={creatingInviteFor === workspace.id}
                                  style={ghostButtonStyle}
                                >
                                  {creatingInviteFor === workspace.id ? '產生中...' : '產生合作邀請'}
                                </button>
                              </div>
                            </>
                          ) : (
                            <div style={{
                              padding: '0.9rem 1rem',
                              border: '1px solid var(--dark-border)',
                              background: 'var(--dark)',
                              fontSize: '0.84rem',
                              color: workspace.sharedBrief ? 'var(--body-text)' : 'var(--muted)',
                              lineHeight: 1.8,
                              whiteSpace: 'pre-wrap',
                            }}>
                              {workspace.sharedBrief || '尚未填寫共享說明。'}
                            </div>
                          )}
                        </div>

                        {inviteResult && (
                          <div style={{
                            marginTop: '1rem',
                            padding: '0.95rem 1rem',
                            border: '1px solid rgba(200,164,85,0.22)',
                            background: 'rgba(200,164,85,0.06)',
                            display: 'grid',
                            gap: '0.55rem',
                          }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--warm-white)' }}>
                              把這個連結交給另一個團隊的 Owner / Admin
                            </p>
                            <code style={{
                              fontSize: '0.76rem',
                              color: 'var(--gold-light)',
                              background: 'rgba(0,0,0,0.3)',
                              padding: '0.6rem 0.75rem',
                              overflowWrap: 'anywhere',
                            }}>
                              {inviteResult.joinUrl}
                            </code>
                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => { void handleCopyInvite(inviteResult.joinUrl) }}
                                style={secondaryButtonStyle}
                              >
                                複製邀請連結
                              </button>
                              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', alignSelf: 'center' }}>
                                邀請碼：{inviteResult.inviteToken}
                              </span>
                            </div>
                          </div>
                        )}

                        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <div>
                              <label style={labelStyle}>聯合活動總覽</label>
                              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.8 }}>
                                顯示 {overviewDateFrom} 到 {overviewDateTo} 之間，各 linked teams 已安排的活動角色，並提醒同一人在不同團隊的同日重複參與。
                              </p>
                            </div>
                            <button
                              onClick={() => { void handleLoadOverview(workspace.id) }}
                              disabled={loadingOverviewFor === workspace.id}
                              style={ghostButtonStyle}
                            >
                              {loadingOverviewFor === workspace.id ? '讀取聯合總覽中...' : overview ? '重新整理聯合總覽' : '載入聯合總覽'}
                            </button>
                          </div>

                          {overview && (
                            <>
                              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                <div style={summaryChipStyle}>
                                  {overview.entries.length} 個活動角色需求
                                </div>
                                <div style={summaryChipStyle}>
                                  {overview.entries.reduce((sum, entry) => sum + entry.assignees.length, 0)} 個已加入人次
                                </div>
                                <div style={{
                                  ...summaryChipStyle,
                                  color: overview.conflicts.length > 0 ? '#f5b0b0' : 'var(--muted)',
                                  border: overview.conflicts.length > 0 ? '1px solid rgba(224,85,85,0.25)' : summaryChipStyle.border,
                                  background: overview.conflicts.length > 0 ? 'rgba(224,85,85,0.08)' : summaryChipStyle.background,
                                }}>
                                  {overview.conflicts.length} 筆同日提醒
                                </div>
                              </div>

                              {overview.conflicts.length > 0 ? (
                                <div style={{
                                  padding: '0.95rem 1rem',
                                  border: '1px solid rgba(224,85,85,0.25)',
                                  background: 'rgba(224,85,85,0.08)',
                                  display: 'grid',
                                  gap: '0.65rem',
                                }}>
                                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#f5b0b0' }}>
                                    同一個人在不同團隊的同一天都已加入活動，請回各自原團隊協調安排。
                                  </p>
                                  <div style={{ display: 'grid', gap: '0.55rem' }}>
                                    {overview.conflicts.map((conflict) => (
                                      <div key={conflict.id} style={{ padding: '0.75rem 0.85rem', border: '1px solid rgba(224,85,85,0.2)', background: 'rgba(0,0,0,0.18)' }}>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--warm-white)' }}>
                                          {conflict.displayName}
                                        </div>
                                        <div style={{ marginTop: '0.35rem', display: 'grid', gap: '0.35rem' }}>
                                          {conflict.entries.map((entry) => (
                                            <div key={entry.entryId} style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.7 }}>
                                              {entry.teamName} · {entry.eventTitle} · {entry.roleLabel} · {formatDate(entry.eventDate)}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div style={{
                                  padding: '0.9rem 1rem',
                                  border: '1px solid rgba(200,164,85,0.15)',
                                  background: 'rgba(200,164,85,0.04)',
                                  fontSize: '0.8rem',
                                  color: 'var(--muted)',
                                }}>
                                  目前這段期間沒有偵測到跨團隊的同日重複參與。
                                </div>
                              )}

                              {Object.keys(entriesByDate).length > 0 ? (
                                <div style={{ display: 'grid', gap: '0.85rem' }}>
                                  {Object.entries(entriesByDate).map(([eventDate, dateEntries]) => (
                                    <div key={eventDate} style={{ display: 'grid', gap: '0.55rem' }}>
                                      <div style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>{formatDate(eventDate)}</div>
                                      {dateEntries.map((entry) => (
                                        <div key={entry.id} style={{
                                          padding: '0.8rem 0.9rem',
                                          border: '1px solid var(--dark-border)',
                                          background: 'var(--dark)',
                                          display: 'grid',
                                          gap: '0.45rem',
                                        }}>
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                              <span style={teamTagStyle}>{entry.teamName}</span>
                                              <span style={{ fontSize: '0.82rem', color: 'var(--warm-white)' }}>{entry.eventTitle}</span>
                                              <span style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>{entry.roleLabel}</span>
                                            </div>
                                            <span style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>活動需求</span>
                                          </div>
                                          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                                            {entry.assignees.length > 0 ? entry.assignees.map((assignee) => {
                                              const hasConflict = entry.conflictUserIds.includes(assignee.userId)
                                              return (
                                                <span
                                                  key={`${entry.id}:${assignee.userId}`}
                                                  style={{
                                                    padding: '0.22rem 0.5rem',
                                                    border: hasConflict ? '1px solid rgba(224,85,85,0.28)' : '1px solid var(--dark-border)',
                                                    background: hasConflict ? 'rgba(224,85,85,0.08)' : 'transparent',
                                                    color: hasConflict ? '#f5b0b0' : 'var(--body-text)',
                                                    fontSize: '0.76rem',
                                                  }}
                                                >
                                                  {assignee.displayName}{hasConflict ? ' · 衝突' : ''}
                                                </span>
                                              )
                                            }) : (
                                              <span style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>尚未分派人員</span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{
                                  padding: '0.9rem 1rem',
                                  border: '1px solid var(--dark-border)',
                                  background: 'var(--dark)',
                                  fontSize: '0.8rem',
                                  color: 'var(--muted)',
                                }}>
                                  這段期間內還沒有任何已安排的活動角色。
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        <div style={{
                          marginTop: '1rem',
                          paddingTop: '1rem',
                          borderTop: '1px solid var(--dark-border)',
                          fontSize: '0.76rem',
                          color: 'var(--muted)',
                          display: 'flex',
                          gap: '1rem',
                          flexWrap: 'wrap',
                        }}>
                          <span>建立時間：{formatDateTime(workspace.createdAt)}</span>
                          <span>最後更新：{formatDateTime(workspace.updatedAt)}</span>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function WorkspacesPageFallback() {
  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', color: 'var(--body-text)' }}>
      <Navbar />
      <main style={{ maxWidth: 1040, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
        <p style={{ color: 'var(--muted)' }}>載入聯合群組中...</p>
      </main>
    </div>
  )
}

const panelStyle = {
  background: 'var(--dark-surface)',
  border: '1px solid var(--dark-border)',
  padding: '1.35rem 1.4rem',
}

const eyebrowStyle = {
  margin: 0,
  fontSize: '0.72rem',
  letterSpacing: '0.16em',
  color: 'var(--gold)',
  textTransform: 'uppercase' as const,
}

const sectionTitleStyle = {
  margin: '0.35rem 0 0',
  color: 'var(--warm-white)',
  fontSize: '1.1rem',
}

const sectionDescStyle = {
  margin: '0.45rem 0 0',
  fontSize: '0.82rem',
  color: 'var(--muted)',
  lineHeight: 1.8,
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.35rem',
  color: 'var(--muted)',
  fontSize: '0.74rem',
  letterSpacing: '0.08em',
}

const inputStyle = {
  width: '100%',
  background: 'var(--dark)',
  border: '1px solid var(--dark-border)',
  color: 'var(--warm-white)',
  padding: '0.7rem 0.8rem',
  fontSize: '0.86rem',
  fontFamily: 'Noto Sans TC, sans-serif',
  outline: 'none',
}

const primaryButtonStyle = {
  background: 'var(--gold)',
  color: 'var(--black)',
  border: 'none',
  padding: '0.72rem 1rem',
  fontSize: '0.84rem',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'Noto Sans TC, sans-serif',
}

const secondaryButtonStyle = {
  background: 'transparent',
  color: 'var(--warm-white)',
  border: '1px solid var(--dark-border)',
  padding: '0.72rem 1rem',
  fontSize: '0.84rem',
  cursor: 'pointer',
  fontFamily: 'Noto Sans TC, sans-serif',
}

const ghostButtonStyle = {
  background: 'rgba(200,164,85,0.08)',
  color: 'var(--gold)',
  border: '1px solid rgba(200,164,85,0.24)',
  padding: '0.72rem 1rem',
  fontSize: '0.84rem',
  cursor: 'pointer',
  fontFamily: 'Noto Sans TC, sans-serif',
}

const summaryChipStyle = {
  padding: '0.35rem 0.6rem',
  border: '1px solid var(--dark-border)',
  background: 'rgba(255,255,255,0.02)',
  color: 'var(--muted)',
  fontSize: '0.75rem',
}

const teamTagStyle = {
  padding: '0.2rem 0.45rem',
  border: '1px solid rgba(200,164,85,0.22)',
  background: 'rgba(200,164,85,0.08)',
  color: 'var(--gold)',
  fontSize: '0.72rem',
}

const primaryLinkStyle = {
  display: 'inline-block',
  background: 'var(--gold)',
  color: 'var(--black)',
  padding: '0.7rem 1rem',
  textDecoration: 'none',
  fontSize: '0.84rem',
  fontFamily: 'Noto Sans TC, sans-serif',
}

const secondaryLinkStyle = {
  display: 'inline-block',
  background: 'transparent',
  color: 'var(--warm-white)',
  border: '1px solid var(--dark-border)',
  padding: '0.7rem 1rem',
  textDecoration: 'none',
  fontSize: '0.84rem',
  fontFamily: 'Noto Sans TC, sans-serif',
}

const readonlyNoticeStyle = {
  margin: 0,
  fontSize: '0.82rem',
  color: 'var(--muted)',
  lineHeight: 1.8,
}
