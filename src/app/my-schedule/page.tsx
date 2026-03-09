'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'
import { subscribeToEvents } from '@/lib/firestore'
import { Event, RoleConfig } from '@/lib/types'

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

  const [events, setEvents] = useState<Event[]>([])

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

  const roleLabel = (roleId: string) => roles.find(r => r.id === roleId)?.label || roleId

  const today = getToday()
  const userId = user?.uid ?? ''
  const myAssignments = useMemo(() => {
    if (!userId) return []

    return events
      .filter((event) => event.date >= today)
      .flatMap((event) =>
        (event.requirements ?? [])
          .filter((requirement) => (requirement.assigneeIds ?? []).includes(userId))
          .map((requirement) => ({
            id: `event:${event.id}:${requirement.roleId}`,
            date: event.date,
            title: event.title || '活動',
            roleId: requirement.roleId,
            noteText: event.description?.trim() || '',
          }))
      )
      .sort((left, right) => left.date.localeCompare(right.date) || left.title.localeCompare(right.title))
  }, [events, today, userId])

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

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', letterSpacing: '0.15em', color: 'var(--warm-white)', marginBottom: '1.2rem' }}>
          我的排班
        </h1>

        {myAssignments.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>你目前沒有已加入的活動</p>
        )}

        {myAssignments.map((assignment) => {
          return (
            <div key={assignment.id} style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', padding: '1.1rem 1.3rem', marginBottom: '0.85rem', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6rem' }}>
                <div>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.1em', color: 'var(--gold)', marginRight: '0.65rem' }}>
                    {formatDate(assignment.date)}
                  </span>
                  <span style={{ fontSize: '0.95rem', color: 'var(--warm-white)' }}>
                    {assignment.title}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>活動需求</span>
              </div>

              {assignment.noteText && (
                <div style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '0.55rem', lineHeight: 1.7 }}>
                  {assignment.noteText}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.3rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)', letterSpacing: '0.05em' }}>
                  崗位：{roleLabel(assignment.roleId)}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--gold)' }}>已加入活動</span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
