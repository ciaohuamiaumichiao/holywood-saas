'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'
import Navbar from '@/components/Navbar'
import { subscribeToSessions, subscribeToMySwaps, subscribeToMyOutgoingSwaps, createSwapRequest } from '@/lib/firestore'
import { postJsonWithAuth } from '@/lib/authed-post'
import { Session, SwapRequest, RoleConfig } from '@/lib/types'

const WEEKDAY_ZH = ['日', '一', '二', '三', '四', '五', '六']

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const wd = WEEKDAY_ZH[d.getDay()]
  return `${m}/${day}（週${wd}）`
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

export default function SchedulePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { activeTeam, activeTeamId, activeMember } = useTeam()

  const [sessions, setSessions] = useState<Session[]>([])
  const [mySwaps, setMySwaps] = useState<SwapRequest[]>([])
  const [outgoing, setOutgoing] = useState<SwapRequest[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  useEffect(() => {
    if (!activeTeamId) return
    const unsub = subscribeToSessions(activeTeamId, setSessions)
    return () => unsub()
  }, [activeTeamId])

  useEffect(() => {
    if (!activeTeamId || !user) return
    const unsub = subscribeToMySwaps(activeTeamId, user.uid, setMySwaps)
    return () => unsub()
  }, [activeTeamId, user])

  useEffect(() => {
    if (!activeTeamId || !user) return
    const unsub = subscribeToMyOutgoingSwaps(activeTeamId, user.uid, setOutgoing)
    return () => unsub()
  }, [activeTeamId, user])

  if (!user) return null

  if (!activeTeamId) {
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>尚未選擇團隊</p>
        </div>
      </>
    )
  }

  const roles: RoleConfig[] = activeTeam?.roles
    ? [...activeTeam.roles].sort((a, b) => a.order - b.order)
    : []

  const today = getToday()
  const futureSessions = sessions
    .filter(s => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const userId = user.uid
  const displayName = user.displayName || ''
  const photoURL = user.photoURL || ''

  async function handleAssign(sessionId: string, roleId: string) {
    if (!activeTeamId) return
    await postJsonWithAuth('/api/sessions/self-assignment', {
      teamId: activeTeamId,
      sessionId,
      roleId,
      action: 'assign',
    })
  }

  async function handleUnassign(sessionId: string, roleId: string) {
    if (!activeTeamId) return
    await postJsonWithAuth('/api/sessions/self-assignment', {
      teamId: activeTeamId,
      sessionId,
      roleId,
      action: 'unassign',
    })
  }

  async function handleSwapRequest(session: Session, roleId: string, targetId: string, targetName: string, targetPhoto: string) {
    if (!activeTeamId) return
    const myRoleId = Object.entries(session.assignments || {}).find(([, a]) => a.userId === userId)?.[0]
    if (!myRoleId) return
    const myRoleLabel = roles.find(r => r.id === myRoleId)?.label || myRoleId
    await createSwapRequest(activeTeamId, {
      sessionId: session.id,
      sessionDate: session.date,
      sessionTitle: session.title,
      role: myRoleId,
      roleLabel: myRoleLabel,
      requesterId: userId,
      requesterName: displayName,
      requesterPhoto: photoURL,
      targetId,
      targetName,
      targetPhoto,
      status: 'pending',
    })
  }

  async function handleRespondSwap(swapId: string, resp: 'accepted' | 'rejected') {
    if (!activeTeamId) return
    await postJsonWithAuth('/api/swaps/respond', {
      teamId: activeTeamId,
      swapId,
      response: resp,
    })
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', letterSpacing: '0.15em', color: 'var(--warm-white)', marginBottom: '1.5rem' }}>
          排班表
        </h1>

        {/* Incoming swap requests */}
        {mySwaps.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', letterSpacing: '0.12em', color: 'var(--gold)', marginBottom: '0.75rem' }}>
              換班申請（待回應）
            </h2>
            {mySwaps.map(sw => (
              <div key={sw.id} style={{ background: 'var(--dark-surface)', border: '1px solid var(--gold)', padding: '1rem 1.25rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--warm-white)' }}>
                    {sw.requesterName}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginLeft: '0.5rem' }}>
                    申請換班｜{sw.sessionDate} {sw.sessionTitle}｜{sw.roleLabel || sw.role}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleRespondSwap(sw.id, 'accepted')}
                    style={{ background: 'rgba(200,164,85,0.08)', border: '1px solid rgba(200,164,85,0.3)', color: 'var(--gold)', fontSize: '0.72rem', padding: '0.3rem 0.75rem', cursor: 'pointer' }}
                  >
                    接受
                  </button>
                  <button
                    onClick={() => handleRespondSwap(sw.id, 'rejected')}
                    style={{ background: 'transparent', border: '1px solid var(--dark-border)', color: 'var(--muted)', fontSize: '0.72rem', padding: '0.3rem 0.75rem', cursor: 'pointer' }}
                  >
                    拒絕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Outgoing swap requests status */}
        {outgoing.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: '0.5rem' }}>
              我的換班申請（寄出）
            </h2>
            {outgoing.map(sw => (
              <div key={sw.id} style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>
                → {sw.targetName}｜{sw.sessionDate} {sw.sessionTitle}｜{sw.roleLabel || sw.role}｜
                <span style={{ color: sw.status === 'accepted' ? 'var(--gold)' : sw.status === 'rejected' ? '#e05' : 'var(--muted)' }}>
                  {sw.status === 'pending' ? '待回應' : sw.status === 'accepted' ? '已接受' : '已拒絕'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Sessions */}
        {futureSessions.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>目前沒有即將到來的場次</p>
        )}

        {futureSessions.map(session => {
          const assignments = session.assignments || {}
          const myRoleId = Object.entries(assignments).find(([, a]) => a.userId === userId)?.[0]

          return (
            <div key={session.id} style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
              {/* Session header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.1em', color: 'var(--gold)', marginRight: '0.75rem' }}>
                    {formatDate(session.date)}
                  </span>
                  <span style={{ fontSize: '0.95rem', color: 'var(--warm-white)' }}>
                    {session.title}
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  {session.startTime}–{session.endTime}
                </span>
              </div>

              {/* Announcement */}
              {session.announcement && (
                <div style={{ border: '1px solid var(--gold)', padding: '0.6rem 0.9rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--gold-light)' }}>
                  {session.announcement}
                </div>
              )}

              {/* Roles */}
              {roles.map((role, idx) => {
                const assignment = assignments[role.id]
                const isMe = assignment?.userId === userId
                const isMyRole = myRoleId === role.id
                const isOtherAssigned = assignment && !isMe

                return (
                  <div key={role.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: idx < roles.length - 1 ? '1px solid var(--dark-border)' : 'none' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)', letterSpacing: '0.08em', minWidth: 90 }}>
                      {role.label}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, paddingLeft: '1rem' }}>
                      {assignment ? (
                        <>
                          {assignment.photoURL && (
                            <img src={assignment.photoURL} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                          )}
                          <span style={{ fontSize: '0.85rem', color: isMe ? 'var(--gold)' : 'var(--warm-white)' }}>
                            {assignment.displayName}{isMe ? '（我）' : ''}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: 'var(--muted)', fontStyle: 'italic' }}>— 空缺 —</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {isMe && (
                        <button
                          onClick={() => handleUnassign(session.id, role.id)}
                          style={{ background: 'transparent', border: '1px solid var(--dark-border)', color: 'var(--muted)', fontSize: '0.72rem', padding: '0.25rem 0.6rem', cursor: 'pointer' }}
                        >
                          取消報名
                        </button>
                      )}
                      {!assignment && !myRoleId && (
                        <button
                          onClick={() => handleAssign(session.id, role.id)}
                          style={{ background: 'rgba(200,164,85,0.08)', border: '1px solid rgba(200,164,85,0.3)', color: 'var(--gold)', fontSize: '0.72rem', padding: '0.25rem 0.6rem', cursor: 'pointer' }}
                        >
                          報名
                        </button>
                      )}
                      {myRoleId && isOtherAssigned && (
                        <button
                          onClick={() => handleSwapRequest(session, role.id, assignment.userId, assignment.displayName, assignment.photoURL || '')}
                          style={{ background: 'rgba(200,164,85,0.08)', border: '1px solid rgba(200,164,85,0.3)', color: 'var(--gold)', fontSize: '0.72rem', padding: '0.25rem 0.6rem', cursor: 'pointer' }}
                        >
                          申請換班
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </>
  )
}
