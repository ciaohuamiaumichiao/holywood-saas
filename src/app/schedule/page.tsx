'use client'
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'
import { subscribeToEvents } from '@/lib/firestore'
import { postJsonWithAuth } from '@/lib/authed-post'
import { Event, EventRequirement, RoleConfig } from '@/lib/types'

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
  const { user, loading: authLoading } = useAuth()
  const { activeTeam, activeTeamId } = useTeam()

  const [events, setEvents] = useState<Event[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (!activeTeamId) return
    const unsub = subscribeToEvents(activeTeamId, setEvents)
    return () => unsub()
  }, [activeTeamId])

  const roles: RoleConfig[] = activeTeam?.roles
    ? [...activeTeam.roles].sort((a, b) => a.order - b.order)
    : []

  const roleLabel = (roleId: string) => roles.find((role) => role.id === roleId)?.label || roleId

  const today = getToday()
  const sortedEvents = useMemo(() => {
    return events
      .filter((event) => event.date >= today && (event.requirements ?? []).some((requirement) => requirement.capacity > 0))
      .sort((left, right) => left.date.localeCompare(right.date))
  }, [events, today])

  if (authLoading || !user) return null

  async function handleAssignEvent(event: Event, requirement: EventRequirement) {
    if (!activeTeamId || !user) return
    const busyKey = `${event.id}:${requirement.roleId}`
    setBusy(busyKey)
    setFeedback(null)
    try {
      const { result } = await postJsonWithAuth<{ result: 'ok' | 'full' | 'already_has_role' | 'not_found' }>(
        '/api/events/assignment',
        { teamId: activeTeamId, eventId: event.id, roleId: requirement.roleId, operation: 'assign' }
      )
      if (result === 'full') setFeedback({ type: 'error', text: '這個角色名額已滿' })
      else if (result === 'already_has_role') setFeedback({ type: 'error', text: '你在這個活動已經報名其他角色' })
      else if (result === 'not_found') setFeedback({ type: 'error', text: '這個活動角色需求已不存在' })
      else setFeedback({ type: 'success', text: '已加入這次活動' })
    } finally {
      setBusy(null)
    }
  }

  async function handleUnassignEvent(event: Event, requirement: EventRequirement) {
    if (!activeTeamId || !user) return
    const busyKey = `${event.id}:${requirement.roleId}`
    setBusy(busyKey)
    setFeedback(null)
    try {
      await postJsonWithAuth('/api/events/assignment', {
        teamId: activeTeamId,
        eventId: event.id,
        roleId: requirement.roleId,
        operation: 'unassign',
      })
      setFeedback({ type: 'success', text: '已取消這次活動的報名' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '2rem 1.2rem 3rem' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.9rem', letterSpacing: '0.14em', color: 'var(--warm-white)', marginBottom: '0.75rem' }}>
          排班表
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
          以活動需求作為唯一主流程。每個活動直接顯示這次需要哪些角色與目前已報名人數。
        </p>

        {feedback && (
          <div style={{
            background: feedback.type === 'error' ? 'rgba(224,85,85,0.08)' : 'rgba(118,188,129,0.08)',
            border: `1px solid ${feedback.type === 'error' ? 'rgba(224,85,85,0.4)' : 'rgba(118,188,129,0.4)'}`,
            color: feedback.type === 'error' ? '#f0aaaa' : '#82c49b',
            padding: '0.75rem 1rem',
            borderRadius: 10,
            marginBottom: '1rem',
            fontSize: '0.86rem',
          }}>
            {feedback.text}
          </div>
        )}

        {sortedEvents.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>目前沒有即將到來且已開放報名的活動</p>
        )}

        {sortedEvents.map((event) => {
          const eventRequirements = [...(event.requirements ?? [])]
            .filter((requirement) => requirement.capacity > 0)
            .sort((left, right) => {
              const leftOrder = roles.find((role) => role.id === left.roleId)?.order ?? Number.MAX_SAFE_INTEGER
              const rightOrder = roles.find((role) => role.id === right.roleId)?.order ?? Number.MAX_SAFE_INTEGER
              return leftOrder - rightOrder
            })

          return (
            <div key={event.id} style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', padding: '1.25rem 1.4rem', marginBottom: '1rem', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.1em', color: 'var(--gold)' }}>
                    {formatDate(event.date)}
                  </span>
                  <span style={{ fontSize: '0.95rem', color: 'var(--warm-white)' }}>{event.title}</span>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: event.type === 'special' ? 'rgba(200,164,85,0.2)' : 'rgba(138,132,120,0.15)',
                    color: event.type === 'special' ? 'var(--gold)' : 'var(--muted)',
                  }}>
                    {event.type === 'special' ? '特別' : '一般'}
                  </span>
                </div>
              </div>

              {event.description && (
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.8rem' }}>
                  {event.description}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {eventRequirements.map((requirement) => {
                  const assignees = Object.values(requirement.assignments || {})
                  const isMe = (requirement.assigneeIds ?? []).includes(user.uid)
                  const isFull = (requirement.assigneeIds?.length || 0) >= requirement.capacity
                  const busyKey = `${event.id}:${requirement.roleId}`
                  const btnDisabled = busy === busyKey

                  return (
                    <div key={`${event.id}:${requirement.roleId}`} style={{
                      border: '1px solid var(--dark-border)',
                      borderRadius: 10,
                      padding: '0.75rem 0.9rem',
                      display: 'grid',
                      gridTemplateColumns: '140px 1fr auto',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: 'rgba(255,255,255,0.01)',
                    }}>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', letterSpacing: '0.08em' }}>
                          {formatDate(event.date)}
                        </div>
                        <div style={{ color: 'var(--warm-white)', fontWeight: 600, fontSize: '0.95rem' }}>
                          活動需求
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.9rem', color: 'var(--warm-white)' }}>{roleLabel(requirement.roleId)}</span>
                          <span style={{ fontSize: '0.76rem', color: 'var(--muted)', letterSpacing: '0.05em' }}>
                            {assignees.length}/{requirement.capacity} 位
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {assignees.map((assignment) => (
                            <div key={assignment.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid var(--dark-border)' }}>
                              {assignment.photoURL && <img src={assignment.photoURL} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />}
                              <span style={{ color: assignment.userId === user.uid ? 'var(--gold)' : 'var(--warm-white)', fontSize: '0.82rem' }}>
                                {assignment.displayName}{assignment.userId === user.uid ? '（我）' : ''}
                              </span>
                            </div>
                          ))}
                          {assignees.length === 0 && (
                            <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>尚無報名</span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {isMe ? (
                          <button
                            onClick={() => handleUnassignEvent(event, requirement)}
                            disabled={btnDisabled}
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--dark-border)',
                              color: 'var(--muted)',
                              fontSize: '0.8rem',
                              padding: '0.35rem 0.9rem',
                              cursor: btnDisabled ? 'wait' : 'pointer',
                              borderRadius: 8,
                            }}
                          >
                            取消報名
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAssignEvent(event, requirement)}
                            disabled={btnDisabled || isFull}
                            style={{
                              background: isFull ? 'var(--dark-border)' : 'rgba(200,164,85,0.12)',
                              border: `1px solid ${isFull ? 'var(--dark-border)' : 'rgba(200,164,85,0.4)'}`,
                              color: isFull ? 'var(--muted)' : 'var(--gold)',
                              fontSize: '0.8rem',
                              padding: '0.35rem 0.9rem',
                              cursor: btnDisabled || isFull ? 'not-allowed' : 'pointer',
                              borderRadius: 8,
                            }}
                          >
                            {isFull ? '已滿' : '加入活動'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
