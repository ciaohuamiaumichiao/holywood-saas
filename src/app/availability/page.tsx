'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'
import { subscribeToEvents, subscribeTeamSlots, subscribeToMyAvailabilities, addAvailability, removeAvailability } from '@/lib/firestore'
import { Event, Availability, Slot } from '@/lib/types'

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

export default function AvailabilityPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { activeTeam, activeTeamId } = useTeam()

  const [events, setEvents] = useState<Event[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [myAvailabilities, setMyAvailabilities] = useState<Availability[]>([])
  const [loadingSlot, setLoadingSlot] = useState<string | null>(null)

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

  useEffect(() => {
    if (!activeTeamId || !user) return
    const unsub = subscribeToMyAvailabilities(activeTeamId, user.uid, setMyAvailabilities)
    return () => unsub()
  }, [activeTeamId, user])

  const eventsMap = useMemo(() => {
    const m: Record<string, Event> = {}
    events.forEach(e => { m[e.id] = e })
    return m
  }, [events])

  const roleLabel = (roleId: string) => {
    const role = activeTeam?.roles.find(r => r.id === roleId)
    return role ? role.label : roleId
  }

  const today = getToday()
  const futureSlots = slots
    .filter(s => s.slotDate >= today)
    .sort((a, b) => a.slotDate.localeCompare(b.slotDate) || a.startsAt.localeCompare(b.startsAt))

  const availableSlotIds = new Set(myAvailabilities.map(a => a.slotId))

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

  async function handleToggle(slot: Slot) {
    if (!activeTeamId || !user || loadingSlot === slot.id) return
    setLoadingSlot(slot.id)
    try {
      if (availableSlotIds.has(slot.id)) {
        await removeAvailability(activeTeamId, user.uid, slot.id)
      } else {
        const title = slot.title || eventsMap[slot.eventId]?.title || roleLabel(slot.roleId)
        await addAvailability(activeTeamId, user.uid, slot.id, slot.slotDate, title)
      }
    } finally {
      setLoadingSlot(null)
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', letterSpacing: '0.15em', color: 'var(--warm-white)', marginBottom: '0.5rem' }}>
          時段可參與意願
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '1.4rem' }}>
          勾選你可參與的時段，供管理員排班參考。
        </p>

        {futureSlots.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>目前沒有即將到來的時段</p>
        )}

        {futureSlots.map(slot => {
          const isAvailable = availableSlotIds.has(slot.id)
          const isLoading = loadingSlot === slot.id
          const event = eventsMap[slot.eventId]
          return (
            <div
              key={slot.id}
              onClick={() => handleToggle(slot)}
              style={{
                background: isAvailable ? 'rgba(200,164,85,0.08)' : 'var(--dark-surface)',
                border: isAvailable ? '1px solid rgba(200,164,85,0.45)' : '1px solid var(--dark-border)',
                padding: '1.1rem 1.3rem',
                marginBottom: '0.8rem',
                cursor: isLoading ? 'wait' : 'pointer',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '0.8rem',
                alignItems: 'center',
                opacity: isLoading ? 0.65 : 1,
                borderRadius: 10,
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.95rem', letterSpacing: '0.1em', color: isAvailable ? 'var(--gold)' : 'var(--muted)' }}>
                    {formatDate(slot.slotDate)}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: isAvailable ? 'var(--warm-white)' : 'var(--body-text)' }}>
                    {event?.title || slot.title || roleLabel(slot.roleId)}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                  {formatTimeRange(slot)} · {roleLabel(slot.roleId)} · 名額 {slot.capacity}
                </div>
              </div>

              <div style={{
                width: 22,
                height: 22,
                border: isAvailable ? '2px solid var(--gold)' : '2px solid var(--dark-border)',
                background: isAvailable ? 'rgba(200,164,85,0.12)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
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
