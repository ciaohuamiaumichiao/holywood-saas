'use client'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'
import { subscribeToEvents } from '@/lib/firestore'
import { Event, EventRequirement, RoleConfig } from '@/lib/types'
import { useEffect, useMemo, useState } from 'react'

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

const DEMO_ROLES: RoleConfig[] = [
  { id: 'lead-teacher', label: '主教老師', order: 1 },
  { id: 'assistant-teacher', label: '助教老師', order: 2 },
  { id: 'transport-support', label: '交通支援', order: 3 },
]

const DEMO_EVENTS: Event[] = [
  {
    id: 'demo-evt-1',
    teamId: 'demo',
    title: '桃源國小閱讀課',
    date: '2026-04-18',
    type: 'regular',
    description: '集合 08:30，請帶繪本與點名表。',
    requirements: [
      {
        roleId: 'lead-teacher',
        capacity: 1,
        assigneeIds: ['u1'],
        assignments: {
          u1: { userId: 'u1', displayName: '王雅婷', assignedAt: 0 },
        },
      },
      {
        roleId: 'assistant-teacher',
        capacity: 2,
        assigneeIds: ['u2'],
        assignments: {
          u2: { userId: 'u2', displayName: '林以恩', assignedAt: 0 },
        },
      },
    ],
    createdAt: 0,
    createdBy: 'demo',
  },
  {
    id: 'demo-evt-2',
    teamId: 'demo',
    title: '瑞峰國小自然課',
    date: '2026-04-25',
    type: 'special',
    description: '雨備教材已放雲端，行政窗口需提前聯繫學校。',
    requirements: [
      {
        roleId: 'lead-teacher',
        capacity: 1,
        assigneeIds: ['u3'],
        assignments: {
          u3: { userId: 'u3', displayName: '陳柏宇', assignedAt: 0 },
        },
      },
      {
        roleId: 'assistant-teacher',
        capacity: 2,
        assigneeIds: [],
        assignments: {},
      },
      {
        roleId: 'transport-support',
        capacity: 1,
        assigneeIds: ['u4'],
        assignments: {
          u4: { userId: 'u4', displayName: '李佳恩', assignedAt: 0 },
        },
      },
    ],
    createdAt: 0,
    createdBy: 'demo',
  },
]

function RequirementRow({
  requirement,
  roleLabel,
}: {
  requirement: EventRequirement
  roleLabel: (roleId: string) => string
}) {
  const assignees = Object.values(requirement.assignments || {})

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '140px 1fr',
      gap: '0.75rem',
      padding: '0.65rem 0.8rem',
      borderRadius: 10,
      border: '1px solid var(--dark-border)',
      background: 'rgba(255,255,255,0.02)',
    }}>
      <div>
        <div style={{ color: 'var(--warm-white)', fontWeight: 600, fontSize: '0.95rem' }}>{roleLabel(requirement.roleId)}</div>
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', letterSpacing: '0.06em' }}>
          {assignees.length}/{requirement.capacity} 位
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
        {assignees.length === 0 && <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>尚無報名</span>}
        {assignees.map((assignment) => (
          <span key={assignment.userId} style={{ color: 'var(--warm-white)', fontSize: '0.82rem', padding: '0.2rem 0.45rem', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--dark-border)' }}>
            {assignment.displayName}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function BoardPage() {
  const { user } = useAuth()
  const { activeTeam, activeTeamId } = useTeam()

  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    if (!activeTeamId) return
    const unsub = subscribeToEvents(activeTeamId, setEvents)
    return () => unsub()
  }, [activeTeamId])

  const roles: RoleConfig[] = activeTeam?.roles
    ? [...activeTeam.roles].sort((a, b) => a.order - b.order)
    : DEMO_ROLES

  const roleLabel = (roleId: string) => roles.find((role) => role.id === roleId)?.label || roleId

  const today = getToday()
  const visibleEvents = activeTeamId ? events : DEMO_EVENTS
  const sortedEvents = useMemo(() => {
    return visibleEvents
      .filter((event) => event.date >= today && (event.requirements ?? []).some((requirement) => requirement.capacity > 0))
      .sort((left, right) => left.date.localeCompare(right.date))
  }, [today, visibleEvents])

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
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>目前沒有即將到來且已設定角色需求的活動</p>
        )}

        {sortedEvents.map((event) => {
          const requirements = [...(event.requirements ?? [])]
            .filter((requirement) => requirement.capacity > 0)
            .sort((left, right) => {
              const leftOrder = roles.find((role) => role.id === left.roleId)?.order ?? Number.MAX_SAFE_INTEGER
              const rightOrder = roles.find((role) => role.id === right.roleId)?.order ?? Number.MAX_SAFE_INTEGER
              return leftOrder - rightOrder
            })

          return (
            <div key={event.id} style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', padding: '1.25rem 1.4rem', marginBottom: '1rem', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.7rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.1em', color: 'var(--gold)' }}>
                    {formatDate(event.date)}
                  </span>
                  <span style={{ fontSize: '0.95rem', color: 'var(--warm-white)' }}>{event.title}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{event.type === 'special' ? '特別活動' : '一般活動'}</span>
              </div>

              {event.description && (
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>{event.description}</div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {requirements.map((requirement) => (
                  <RequirementRow key={`${event.id}:${requirement.roleId}`} requirement={requirement} roleLabel={roleLabel} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
