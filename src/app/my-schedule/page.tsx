'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function MySchedulePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { activeTeam, activeTeamId } = useTeam()

  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (!activeTeamId) return
    const unsub = subscribeToSessions(activeTeamId, setSessions)
    return () => unsub()
  }, [activeTeamId])

  if (authLoading || !user) return null

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
  const userId = user.uid

  const mySessions = sessions
    .filter(s => {
      if (s.date < today) return false
      const assignments = s.assignments || {}
      return Object.values(assignments).some(a => a.userId === userId)
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  function getRoleLabel(roleId: string): string {
    const found = roles.find(r => r.id === roleId)
    return found ? found.label : roleId
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', letterSpacing: '0.15em', color: 'var(--warm-white)', marginBottom: '1.5rem' }}>
          我的排班
        </h1>

        {mySessions.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>你目前沒有已排定的場次</p>
        )}

        {mySessions.map(session => {
          const assignments = session.assignments || {}
          const myEntries = Object.entries(assignments).filter(([, a]) => a.userId === userId)

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

              {/* My roles */}
              {myEntries.map(([roleId], idx) => (
                <div key={roleId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: idx < myEntries.length - 1 ? '1px solid var(--dark-border)' : 'none' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', letterSpacing: '0.08em' }}>
                    {getRoleLabel(roleId)}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--gold)' }}>
                    我的崗位
                  </span>
                </div>
              ))}

              {/* Announcement */}
              {session.announcement && (
                <div style={{ border: '1px solid var(--gold)', padding: '0.6rem 0.9rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--gold-light)' }}>
                  {session.announcement}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
