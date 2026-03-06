'use client'
import { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'
import { subscribeToEvents, subscribeTeamSlots } from '@/lib/firestore'
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

const DEMO_EVENTS: Event[] = [
  { id: 'demo-evt-1', teamId: 'demo', title: '主日崇拜 A 場', date: '2026-03-10', type: 'regular', description: '示範資料', createdAt: 0, createdBy: '' },
  { id: 'demo-evt-2', teamId: 'demo', title: '主日崇拜 B 場', date: '2026-03-10', type: 'regular', description: '', createdAt: 0, createdBy: '' },
]

const DEMO_SLOTS: Slot[] = [
  {
    id: 'demo-slot-1', teamId: 'demo', eventId: 'demo-evt-1', roleId: 'role-worship', slotDate: '2026-03-10',
    startsAt: '2026-03-10T09:00', endsAt: '2026-03-10T11:00', capacity: 1, assigneeIds: ['u1'],
    assignments: { u1: { userId: 'u1', displayName: '王小明', assignedAt: 0 } }, title: '敬拜', createdAt: 0, createdBy: 'demo'
  },
  {
    id: 'demo-slot-2', teamId: 'demo', eventId: 'demo-evt-1', roleId: 'role-sound', slotDate: '2026-03-10',
    startsAt: '2026-03-10T09:00', endsAt: '2026-03-10T11:00', capacity: 1, assigneeIds: ['u2'],
    assignments: { u2: { userId: 'u2', displayName: '李美華', assignedAt: 0 } }, title: '音控', createdAt: 0, createdBy: 'demo'
  },
  {
    id: 'demo-slot-3', teamId: 'demo', eventId: 'demo-evt-2', roleId: 'role-camera', slotDate: '2026-03-10',
    startsAt: '2026-03-10T11:30', endsAt: '2026-03-10T13:00', capacity: 2, assigneeIds: ['u3'],
    assignments: { u3: { userId: 'u3', displayName: '張小花', assignedAt: 0 } }, title: '攝影', createdAt: 0, createdBy: 'demo'
  },
]

const DEMO_ROLES: RoleConfig[] = [
  { id: 'role-worship', label: '敬拜領唱', order: 1 },
  { id: 'role-sound', label: '音控', order: 2 },
  { id: 'role-camera', label: '攝影', order: 3 },
]

export default function BoardPage() {
  const { user } = useAuth()
  const { activeTeam, activeTeamId } = useTeam()

  const [events, setEvents] = useState<Event[]>([])
  const [slots, setSlots] = useState<Slot[]>([])

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
    : DEMO_ROLES

  const roleLabel = (roleId: string) => roles.find(r => r.id === roleId)?.label || roleId

  const today = getToday()
  const visibleEvents = activeTeamId ? events : DEMO_EVENTS
  const visibleSlots = activeTeamId ? slots : DEMO_SLOTS

  const slotsByEvent = useMemo(() => {
    const grouped: Record<string, Slot[]> = {}
    visibleSlots
      .filter(s => s.slotDate >= today)
      .forEach(s => {
        if (!grouped[s.eventId]) grouped[s.eventId] = []
        grouped[s.eventId].push(s)
      })
    Object.values(grouped).forEach(list => list.sort((a, b) => a.slotDate.localeCompare(b.slotDate) || a.startsAt.localeCompare(b.startsAt)))
    return grouped
  }, [visibleSlots, today])

  const sortedEvents = visibleEvents
    .filter(e => slotsByEvent[e.id]?.length)
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <>
      {user && <Navbar />}
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', letterSpacing: '0.15em', color: 'var(--warm-white)', margin: 0 }}>
            排班看板
          </h1>
          {!activeTeamId && (
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', border: '1px solid var(--dark-border)', padding: '0.15rem 0.5rem', letterSpacing: '0.06em' }}>
              DEMO
            </span>
          )}
        </div>

        {sortedEvents.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>目前沒有即將到來的時段</p>
        )}

        {sortedEvents.map(event => {
          const eventSlots = slotsByEvent[event.id] || []
          const firstDate = eventSlots[0]?.slotDate || event.date
          return (
            <div key={event.id} style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', padding: '1.25rem 1.4rem', marginBottom: '1rem', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.7rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.1em', color: 'var(--gold)' }}>
                    {formatDate(firstDate)}
                  </span>
                  <span style={{ fontSize: '0.95rem', color: 'var(--warm-white)' }}>{event.title}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{event.type === 'special' ? '特別活動' : '一般'}</span>
              </div>

              {event.description && (
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.6rem' }}>{event.description}</div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {eventSlots.map(slot => {
                  const assignees = Object.values(slot.assignments || {})
                  return (
                    <div key={slot.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '140px 1fr',
                      gap: '0.75rem',
                      padding: '0.65rem 0.8rem',
                      borderRadius: 10,
                      border: '1px solid var(--dark-border)',
                      background: 'rgba(255,255,255,0.02)'
                    }}>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', letterSpacing: '0.08em' }}>{formatDate(slot.slotDate)}</div>
                        <div style={{ color: 'var(--warm-white)', fontWeight: 600, fontSize: '0.95rem' }}>{formatTimeRange(slot)}</div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                          <span style={{ color: 'var(--warm-white)', fontSize: '0.92rem' }}>{slot.title || roleLabel(slot.roleId)}</span>
                          <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{roleLabel(slot.roleId)} · {assignees.length}/{slot.capacity}</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {assignees.length === 0 && <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>— 空缺 —</span>}
                          {assignees.map(a => (
                            <span key={a.userId} style={{ color: 'var(--warm-white)', fontSize: '0.82rem', padding: '0.2rem 0.45rem', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--dark-border)' }}>
                              {a.displayName}
                            </span>
                          ))}
                        </div>
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
