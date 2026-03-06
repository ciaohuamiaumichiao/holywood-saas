'use client'
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'
import { subscribeToEvents, subscribeTeamSlots, assignSlot, unassignSlot } from '@/lib/firestore'
import { Event, RoleConfig, Slot } from '@/lib/types'

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

function formatTimeRange(slot: Slot) {
  const start = slot.startsAt.slice(11, 16)
  const end = slot.endsAt?.slice(11, 16)
  return end ? `${start}–${end}` : start
}

export default function SchedulePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { activeTeam, activeTeamId } = useTeam()

  const [events, setEvents] = useState<Event[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
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

  useEffect(() => {
    if (!activeTeamId) return
    const unsub = subscribeTeamSlots(activeTeamId, setSlots)
    return () => unsub()
  }, [activeTeamId])

  const roles: RoleConfig[] = activeTeam?.roles
    ? [...activeTeam.roles].sort((a, b) => a.order - b.order)
    : []

  const roleLabel = (roleId: string) => roles.find(r => r.id === roleId)?.label || roleId

  const today = getToday()
  const futureSlots = slots.filter(s => s.slotDate >= today)
  const futureEvents = useMemo(() => {
    return events.filter((event) => event.date >= today || Boolean(futureSlots.some((slot) => slot.eventId === event.id)))
  }, [events, futureSlots, today])
  const slotsByEvent = useMemo(() => {
    const grouped: Record<string, Slot[]> = {}
    futureSlots.forEach(s => {
      if (!grouped[s.eventId]) grouped[s.eventId] = []
      grouped[s.eventId].push(s)
    })
    Object.values(grouped).forEach(list => list.sort((a, b) => a.slotDate.localeCompare(b.slotDate) || a.startsAt.localeCompare(b.startsAt)))
    return grouped
  }, [futureSlots])

  const sortedEvents = useMemo(() => {
    return futureEvents
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [futureEvents])

  if (authLoading || !user) return null

  async function handleAssign(slot: Slot) {
    if (!activeTeamId || !user) return
    setBusy(slot.id)
    setFeedback(null)
    try {
      const result = await assignSlot(activeTeamId, slot.id, {
        uid: user.uid,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
      })
      if (result === 'full') setFeedback({ type: 'error', text: '此時段名額已滿' })
      else if (result === 'conflict') setFeedback({ type: 'error', text: '與你已報名的時段時間重疊' })
      else if (result === 'not_found') setFeedback({ type: 'error', text: '此時段已不存在' })
      else setFeedback({ type: 'success', text: '報名成功' })
    } finally {
      setBusy(null)
    }
  }

  async function handleUnassign(slot: Slot) {
    if (!activeTeamId || !user) return
    setBusy(slot.id)
    setFeedback(null)
    try {
      await unassignSlot(activeTeamId, slot.id, user.uid)
      setFeedback({ type: 'success', text: '已取消報名' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '2rem 1.2rem 3rem' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.9rem', letterSpacing: '0.14em', color: 'var(--warm-white)', marginBottom: '0.75rem' }}>
          排班表（時段制）
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
          依活動與時段報名；同一時段不可重複佔位。
        </p>

        {feedback && (
          <div style={{
            background: feedback.type === 'error' ? 'rgba(224,85,85,0.08)' : 'rgba(118,188,129,0.08)',
            border: `1px solid ${feedback.type === 'error' ? 'rgba(224,85,85,0.4)' : 'rgba(118,188,129,0.4)'}`,
            color: feedback.type === 'error' ? '#f08' : '#82c49b',
            padding: '0.75rem 1rem',
            borderRadius: 10,
            marginBottom: '1rem',
            fontSize: '0.86rem',
          }}>
            {feedback.text}
          </div>
        )}

        {sortedEvents.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>目前沒有即將到來的活動或時段</p>
        )}

        {sortedEvents.map(event => {
          const eventSlots = slotsByEvent[event.id] || []

          return (
            <div key={event.id} style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', padding: '1.25rem 1.4rem', marginBottom: '1rem', borderRadius: 12 }}>
              {/* Event header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.1em', color: 'var(--gold)' }}>
                    {formatDate(event.date)}
                  </span>
                  <span style={{ fontSize: '0.95rem', color: 'var(--warm-white)' }}>{event.title}</span>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: event.type === 'special' ? 'rgba(200,164,85,0.2)' : 'rgba(138,132,120,0.15)',
                    color: event.type === 'special' ? 'var(--gold)' : 'var(--muted)'
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

              {eventSlots.length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>此活動尚無時段</p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {eventSlots.map(slot => {
                  const assignees = Object.values(slot.assignments || {})
                  const isMe = slot.assigneeIds?.includes(user.uid)
                  const isFull = (slot.assigneeIds?.length || 0) >= slot.capacity
                  const btnDisabled = busy === slot.id
                  return (
                    <div key={slot.id} style={{
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
                          {slot.slotDate && formatDate(slot.slotDate)}
                        </div>
                        <div style={{ color: 'var(--warm-white)', fontWeight: 600, fontSize: '0.95rem' }}>
                          {formatTimeRange(slot)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.9rem', color: 'var(--warm-white)' }}>{slot.title || roleLabel(slot.roleId)}</span>
                          <span style={{ fontSize: '0.76rem', color: 'var(--muted)', letterSpacing: '0.05em' }}>
                            {roleLabel(slot.roleId)} · {assignees.length}/{slot.capacity}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {assignees.map(a => (
                            <div key={a.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid var(--dark-border)' }}>
                              {a.photoURL && <img src={a.photoURL} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />}
                              <span style={{ color: a.userId === user.uid ? 'var(--gold)' : 'var(--warm-white)', fontSize: '0.82rem' }}>
                                {a.displayName}{a.userId === user.uid ? '（我）' : ''}
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
                            onClick={() => handleUnassign(slot)}
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
                            onClick={() => handleAssign(slot)}
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
                            {isFull ? '名額已滿' : '報名'}
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
