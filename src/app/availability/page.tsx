'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'
import Navbar from '@/components/Navbar'
import { subscribeToSessions, subscribeToMyAvailabilities, addAvailability, removeAvailability } from '@/lib/firestore'
import { Session, Availability } from '@/lib/types'

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

export default function AvailabilityPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { activeTeamId } = useTeam()

  const [sessions, setSessions] = useState<Session[]>([])
  const [myAvailabilities, setMyAvailabilities] = useState<Availability[]>([])
  const [loading, setLoading] = useState<string | null>(null)

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

  useEffect(() => {
    if (!activeTeamId || !user) return
    const unsub = subscribeToMyAvailabilities(activeTeamId, user.uid, setMyAvailabilities)
    return () => unsub()
  }, [activeTeamId, user])

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

  const today = getToday()
  const futureSessions = sessions
    .filter(s => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const availableSessionIds = new Set(myAvailabilities.map(a => a.sessionId))

  async function handleToggle(session: Session) {
    if (!activeTeamId || !user || loading === session.id) return
    setLoading(session.id)
    try {
      if (availableSessionIds.has(session.id)) {
        await removeAvailability(activeTeamId, user.uid, session.id)
      } else {
        await addAvailability(activeTeamId, user.uid, session.id, session.date, session.title)
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', letterSpacing: '0.15em', color: 'var(--warm-white)', marginBottom: '0.5rem' }}>
          可參與日期
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
          點選場次以標記你的可參與意願，供管理員排班參考。
        </p>

        {futureSessions.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>目前沒有即將到來的場次</p>
        )}

        {futureSessions.map(session => {
          const isAvailable = availableSessionIds.has(session.id)
          const isLoading = loading === session.id

          return (
            <div
              key={session.id}
              onClick={() => handleToggle(session)}
              style={{
                background: isAvailable ? 'rgba(200,164,85,0.06)' : 'var(--dark-surface)',
                border: isAvailable ? '1px solid rgba(200,164,85,0.4)' : '1px solid var(--dark-border)',
                padding: '1.25rem 1.5rem',
                marginBottom: '0.75rem',
                cursor: isLoading ? 'wait' : 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background 0.15s, border-color 0.15s',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              <div>
                <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.1em', color: isAvailable ? 'var(--gold)' : 'var(--muted)', marginRight: '0.75rem' }}>
                  {formatDate(session.date)}
                </span>
                <span style={{ fontSize: '0.92rem', color: isAvailable ? 'var(--warm-white)' : 'var(--body-text)' }}>
                  {session.title}
                </span>
                {(session.startTime || session.endTime) && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginLeft: '0.6rem' }}>
                    {session.startTime}–{session.endTime}
                  </span>
                )}
              </div>

              {/* Checkbox indicator */}
              <div style={{
                width: 22,
                height: 22,
                border: isAvailable ? '2px solid var(--gold)' : '2px solid var(--dark-border)',
                background: isAvailable ? 'rgba(200,164,85,0.15)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {isAvailable && (
                  <span style={{ color: 'var(--gold)', fontSize: '0.85rem', lineHeight: 1 }}>✓</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
