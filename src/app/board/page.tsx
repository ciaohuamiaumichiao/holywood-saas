'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'
import Navbar from '@/components/Navbar'
import { subscribeToSessions } from '@/lib/firestore'
import { Session, RoleConfig } from '@/lib/types'

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

const DEMO_SESSIONS: Session[] = [
  {
    id: 'demo-1',
    teamId: 'demo',
    type: 'regular',
    date: '2026-03-10',
    title: '主日崇拜 A 場',
    startTime: '09:00',
    endTime: '11:00',
    announcement: '本週為特別崇拜，請提早 30 分鐘到場',
    createdAt: 0,
    createdBy: '',
    assignments: {
      'role-worship': { userId: 'u1', displayName: '王小明', photoURL: '' },
      'role-sound': { userId: 'u2', displayName: '李美華', photoURL: '' },
      'role-camera': { userId: '', displayName: '', photoURL: '' },
    },
  },
  {
    id: 'demo-2',
    teamId: 'demo',
    type: 'regular',
    date: '2026-03-10',
    title: '主日崇拜 B 場',
    startTime: '11:30',
    endTime: '13:00',
    announcement: '',
    createdAt: 0,
    createdBy: '',
    assignments: {
      'role-worship': { userId: 'u3', displayName: '陳大衛', photoURL: '' },
      'role-sound': { userId: '', displayName: '', photoURL: '' },
      'role-camera': { userId: 'u4', displayName: '張小花', photoURL: '' },
    },
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

  const [sessions, setSessions] = useState<Session[]>([])
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    if (activeTeamId) {
      setIsDemo(false)
      const unsub = subscribeToSessions(activeTeamId, setSessions)
      return () => unsub()
    } else {
      setIsDemo(true)
      setSessions(DEMO_SESSIONS)
    }
  }, [activeTeamId])

  const roles: RoleConfig[] = activeTeam?.roles
    ? [...activeTeam.roles].sort((a, b) => a.order - b.order)
    : DEMO_ROLES

  const today = getToday()
  const futureSessions = sessions
    .filter(s => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <>
      {user && <Navbar />}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', letterSpacing: '0.15em', color: 'var(--warm-white)', margin: 0 }}>
            排班看板
          </h1>
          {isDemo && (
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', border: '1px solid var(--dark-border)', padding: '0.15rem 0.5rem', letterSpacing: '0.06em' }}>
              DEMO
            </span>
          )}
        </div>

        {futureSessions.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>目前沒有即將到來的場次</p>
        )}

        {futureSessions.map(session => {
          const assignments = session.assignments || {}

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
                const hasAssignment = assignment && assignment.userId && assignment.displayName

                return (
                  <div key={role.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: idx < roles.length - 1 ? '1px solid var(--dark-border)' : 'none' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)', letterSpacing: '0.08em', minWidth: 90 }}>
                      {role.label}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, paddingLeft: '1rem' }}>
                      {hasAssignment ? (
                        <>
                          {assignment.photoURL && (
                            <img src={assignment.photoURL} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                          )}
                          <span style={{ fontSize: '0.85rem', color: 'var(--warm-white)' }}>
                            {assignment.displayName}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: 'var(--muted)', fontStyle: 'italic' }}>— 空缺 —</span>
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
