'use client'
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'
import { subscribeToEvents, subscribeToScheduleHistory, subscribeTeamSlots, subscribeToTeamSwaps } from '@/lib/firestore'
import { subscribeToTeamMembers } from '@/lib/firestore-teams'
import { Event, ScheduleHistoryEntry, Slot, SwapRequest, TeamMember } from '@/lib/types'

type MemberProfile = {
  uid: string
  name: string
  photoURL: string
}

type ReviewStats = {
  uid: string
  name: string
  photoURL: string
  assignments: number
  totalHours: number
  distinctRoles: number
  specialAssignments: number
  swapRequests: number
  swapAccepted: number
  swapHelps: number
  joinActions: number
  leaveActions: number
  activeMonths: number
  points: number
  roleBreakdown: Array<{ roleId: string; count: number }>
  badges: string[]
}

const currentYear = new Date().getFullYear()

function yearFromTimestamp(timestamp: number) {
  return new Date(timestamp).getFullYear()
}

function yearFromDateText(value: string | undefined) {
  if (!value) return null
  const year = Number(value.slice(0, 4))
  return Number.isFinite(year) ? year : null
}

function slotHours(slot: Slot) {
  const diff = Date.parse(slot.endsAt) - Date.parse(slot.startsAt)
  if (!Number.isFinite(diff) || diff <= 0) return 0
  return diff / 3600000
}

function buildBadges(stats: Omit<ReviewStats, 'badges'>) {
  const badges: string[] = []
  if (stats.assignments >= 12) badges.push('出勤之星')
  if (stats.distinctRoles >= 3) badges.push('多面手')
  if (stats.swapHelps >= 2) badges.push('救援王')
  if (stats.activeMonths >= 4) badges.push('穩定同行')
  if (stats.totalHours >= 20) badges.push('長跑戰將')
  return badges.slice(0, 4)
}

export default function YearReviewPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { activeTeam, activeTeamId } = useTeam()

  const [members, setMembers] = useState<TeamMember[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [historyEntries, setHistoryEntries] = useState<ScheduleHistoryEntry[]>([])
  const [swaps, setSwaps] = useState<SwapRequest[]>([])
  const [selectedYear, setSelectedYear] = useState(currentYear)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (!activeTeamId) return
    const unsubMembers = subscribeToTeamMembers(activeTeamId, setMembers)
    const unsubEvents = subscribeToEvents(activeTeamId, setEvents)
    const unsubSlots = subscribeTeamSlots(activeTeamId, setSlots)
    const unsubHistory = subscribeToScheduleHistory(activeTeamId, setHistoryEntries)
    const unsubSwaps = subscribeToTeamSwaps(activeTeamId, setSwaps)
    return () => {
      unsubMembers()
      unsubEvents()
      unsubSlots()
      unsubHistory()
      unsubSwaps()
    }
  }, [activeTeamId])

  const roleLabel = (roleId: string) =>
    activeTeam?.roles.find((role) => role.id === roleId)?.label || roleId

  const eventMap = useMemo(() => {
    const map = new Map<string, Event>()
    events.forEach((event) => map.set(event.id, event))
    return map
  }, [events])

  const slotMap = useMemo(() => {
    const map = new Map<string, Slot>()
    slots.forEach((slot) => map.set(slot.id, slot))
    return map
  }, [slots])

  const memberProfiles = useMemo(() => {
    const map = new Map<string, MemberProfile>()

    members.forEach((member) => {
      map.set(member.uid, {
        uid: member.uid,
        name: member.customName || member.displayName || member.uid,
        photoURL: member.photoURL ?? '',
      })
    })

    slots.forEach((slot) => {
      Object.values(slot.assignments || {}).forEach((assignment) => {
        if (!assignment.userId) return
        if (!map.has(assignment.userId)) {
          map.set(assignment.userId, {
            uid: assignment.userId,
            name: assignment.displayName || assignment.userId,
            photoURL: assignment.photoURL ?? '',
          })
        }
      })
    })

    historyEntries.forEach((entry) => {
      if (!map.has(entry.userId)) {
        map.set(entry.userId, {
          uid: entry.userId,
          name: entry.displayName || entry.userId,
          photoURL: entry.photoURL ?? '',
        })
      }
    })

    swaps.forEach((swap) => {
      if (!map.has(swap.requesterId)) {
        map.set(swap.requesterId, {
          uid: swap.requesterId,
          name: swap.requesterName || swap.requesterId,
          photoURL: swap.requesterPhoto ?? '',
        })
      }
      if (!map.has(swap.targetId)) {
        map.set(swap.targetId, {
          uid: swap.targetId,
          name: swap.targetName || swap.targetId,
          photoURL: swap.targetPhoto ?? '',
        })
      }
    })

    return Array.from(map.values())
  }, [historyEntries, members, slots, swaps])

  const availableYears = useMemo(() => {
    const years = new Set<number>()
    slots.forEach((slot) => {
      const year = yearFromDateText(slot.slotDate)
      if (year) years.add(year)
    })
    swaps.forEach((swap) => {
      const year = yearFromDateText(swap.sessionDate) ?? yearFromTimestamp(swap.createdAt)
      if (year) years.add(year)
    })
    historyEntries.forEach((entry) => {
      years.add(yearFromTimestamp(entry.createdAt))
    })
    years.add(currentYear)
    return Array.from(years).sort((a, b) => b - a)
  }, [historyEntries, slots, swaps])

  const activeYear = availableYears.includes(selectedYear)
    ? selectedYear
    : availableYears[0] ?? currentYear

  const yearSlots = useMemo(
    () => slots.filter((slot) => yearFromDateText(slot.slotDate) === activeYear),
    [activeYear, slots]
  )
  const yearSwaps = useMemo(
    () =>
      swaps.filter((swap) => {
        const year = yearFromDateText(swap.sessionDate) ?? yearFromTimestamp(swap.createdAt)
        return year === activeYear
      }),
    [activeYear, swaps]
  )
  const yearHistory = useMemo(
    () => historyEntries.filter((entry) => yearFromTimestamp(entry.createdAt) === activeYear),
    [activeYear, historyEntries]
  )

  const memberStats = useMemo(() => {
    const statsMap = new Map<string, {
      uid: string
      name: string
      photoURL: string
      assignments: number
      totalHours: number
      roleCounts: Map<string, number>
      specialAssignments: number
      swapRequests: number
      swapAccepted: number
      swapHelps: number
      joinActions: number
      leaveActions: number
      months: Set<string>
    }>()

    const ensureStats = (uid: string, fallbackName: string, fallbackPhoto = '') => {
      const existing = statsMap.get(uid)
      if (existing) return existing
      const profile = memberProfiles.find((member) => member.uid === uid)
      const created = {
        uid,
        name: profile?.name || fallbackName || uid,
        photoURL: profile?.photoURL || fallbackPhoto,
        assignments: 0,
        totalHours: 0,
        roleCounts: new Map<string, number>(),
        specialAssignments: 0,
        swapRequests: 0,
        swapAccepted: 0,
        swapHelps: 0,
        joinActions: 0,
        leaveActions: 0,
        months: new Set<string>(),
      }
      statsMap.set(uid, created)
      return created
    }

    memberProfiles.forEach((member) => {
      ensureStats(member.uid, member.name, member.photoURL)
    })

    yearSlots.forEach((slot) => {
      const hours = slotHours(slot)
      const event = eventMap.get(slot.eventId)
      Object.values(slot.assignments || {}).forEach((assignment) => {
        if (!assignment.userId) return
        const stats = ensureStats(
          assignment.userId,
          assignment.displayName || assignment.userId,
          assignment.photoURL ?? ''
        )
        stats.assignments += 1
        stats.totalHours += hours
        stats.months.add(slot.slotDate.slice(0, 7))
        stats.roleCounts.set(slot.roleId, (stats.roleCounts.get(slot.roleId) ?? 0) + 1)
        if (event?.type === 'special') {
          stats.specialAssignments += 1
        }
      })
    })

    yearSwaps.forEach((swap) => {
      const requester = ensureStats(
        swap.requesterId,
        swap.requesterName || swap.requesterId,
        swap.requesterPhoto ?? ''
      )
      requester.swapRequests += 1
      if (swap.status === 'accepted') {
        requester.swapAccepted += 1
        const helper = ensureStats(
          swap.targetId,
          swap.targetName || swap.targetId,
          swap.targetPhoto ?? ''
        )
        helper.swapHelps += 1
      }
    })

    yearHistory.forEach((entry) => {
      const stats = ensureStats(entry.userId, entry.displayName || entry.userId, entry.photoURL ?? '')
      if (entry.action === 'slot_joined') stats.joinActions += 1
      if (entry.action === 'slot_left') stats.leaveActions += 1
    })

    return Array.from(statsMap.values())
      .map((stats) => {
        const roleBreakdown = Array.from(stats.roleCounts.entries())
          .map(([roleId, count]) => ({ roleId, count }))
          .sort((a, b) => b.count - a.count)
        const distinctRoles = roleBreakdown.length
        const activeMonths = stats.months.size
        const points =
          stats.assignments * 10 +
          Math.round(stats.totalHours) +
          distinctRoles * 6 +
          stats.swapAccepted * 8 +
          stats.swapHelps * 12 +
          activeMonths * 4 +
          stats.specialAssignments * 5

        const reviewStats: Omit<ReviewStats, 'badges'> = {
          uid: stats.uid,
          name: stats.name,
          photoURL: stats.photoURL,
          assignments: stats.assignments,
          totalHours: stats.totalHours,
          distinctRoles,
          specialAssignments: stats.specialAssignments,
          swapRequests: stats.swapRequests,
          swapAccepted: stats.swapAccepted,
          swapHelps: stats.swapHelps,
          joinActions: stats.joinActions,
          leaveActions: stats.leaveActions,
          activeMonths,
          points,
          roleBreakdown,
        }

        return {
          ...reviewStats,
          badges: buildBadges(reviewStats),
        }
      })
      .sort((a, b) => b.points - a.points || b.assignments - a.assignments || a.name.localeCompare(b.name))
  }, [eventMap, memberProfiles, yearHistory, yearSlots, yearSwaps])

  const myStats = memberStats.find((stats) => stats.uid === user?.uid) ?? null
  const totalAssignments = memberStats.reduce((sum, stats) => sum + stats.assignments, 0)
  const totalHours = memberStats.reduce((sum, stats) => sum + stats.totalHours, 0)
  const totalAcceptedSwaps = yearSwaps.filter((swap) => swap.status === 'accepted').length
  const topContributor = memberStats[0] ?? null
  const topSupporter =
    [...memberStats].sort((a, b) => b.swapHelps - a.swapHelps || b.points - a.points)[0] ?? null

  if (authLoading || !user) return null

  if (!activeTeamId) {
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '2rem 1.5rem' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>尚未選擇團隊</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '2rem 1.5rem 3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.95rem', letterSpacing: '0.14em', color: 'var(--warm-white)', margin: 0 }}>
              年度回顧
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.86rem', margin: '0.45rem 0 0' }}>
              看見大家一年參與了多少排班、主力落在哪些崗位、以及彼此換班與支援的軌跡。
            </p>
          </div>

          <div style={{ minWidth: 160 }}>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.76rem', marginBottom: '0.35rem', letterSpacing: '0.08em' }}>年份</label>
            <select
              value={activeYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              style={{
                width: '100%',
                padding: '0.55rem 0.7rem',
                background: 'var(--dark-surface)',
                border: '1px solid var(--dark-border)',
                color: 'var(--warm-white)',
                borderRadius: 8,
                fontFamily: 'Noto Sans TC, sans-serif',
              }}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', marginBottom: '1.4rem' }}>
          <SummaryCard label="總排班次數" value={String(totalAssignments)} hint={`${activeYear} 年累積`} />
          <SummaryCard label="總服務時數" value={`${totalHours.toFixed(1)}h`} hint="依最終排班計算" />
          <SummaryCard label="成功換班" value={String(totalAcceptedSwaps)} hint="已接受的換班請求" />
          <SummaryCard label="團隊人數" value={String(memberStats.length)} hint={activeTeam?.name || '目前團隊'} />
        </div>

        {myStats && (
          <section style={{ background: 'linear-gradient(135deg, rgba(200,164,85,0.16), rgba(255,255,255,0.02))', border: '1px solid rgba(200,164,85,0.28)', borderRadius: 16, padding: '1.3rem 1.4rem', marginBottom: '1.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <p style={{ color: 'var(--muted)', fontSize: '0.76rem', letterSpacing: '0.12em', margin: 0 }}>我的年度戰績</p>
                <h2 style={{ color: 'var(--warm-white)', fontSize: '1.25rem', margin: '0.35rem 0 0.2rem' }}>{myStats.name}</h2>
                <p style={{ color: 'var(--gold)', fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>{myStats.points} 分</p>
              </div>
              <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                {myStats.badges.length === 0 && (
                  <BadgeChip label="剛起步" tone="muted" />
                )}
                {myStats.badges.map((badge) => (
                  <BadgeChip key={badge} label={badge} tone="gold" />
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.7rem', marginTop: '1rem' }}>
              <MetricTile label="排班次數" value={String(myStats.assignments)} />
              <MetricTile label="服務時數" value={`${myStats.totalHours.toFixed(1)}h`} />
              <MetricTile label="主要崗位數" value={String(myStats.distinctRoles)} />
              <MetricTile label="換班成功" value={String(myStats.swapAccepted)} />
              <MetricTile label="支援他人" value={String(myStats.swapHelps)} />
              <MetricTile label="活躍月份" value={String(myStats.activeMonths)} />
            </div>
          </section>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
          <section style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: 14, padding: '1.2rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem', gap: '0.8rem', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ color: 'var(--warm-white)', fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>團隊排行與量化資料</h2>
                <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.35rem 0 0' }}>
                  以排班次數、角色多樣性、支援次數與活躍月份綜合換算積分。
                </p>
              </div>
              {topContributor && (
                <span style={{ color: 'var(--gold)', fontSize: '0.78rem' }}>本年度主力：{topContributor.name}</span>
              )}
            </div>

            {memberStats.length === 0 && (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>這個年份還沒有可回顧的排班或換班資料。</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {memberStats.map((stats, index) => (
                <div key={stats.uid} style={{ border: '1px solid var(--dark-border)', borderRadius: 12, padding: '0.85rem 0.95rem', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 34, textAlign: 'center', color: index < 3 ? 'var(--gold)' : 'var(--muted)', fontWeight: 700 }}>
                        #{index + 1}
                      </div>
                      {stats.photoURL ? (
                        <img src={stats.photoURL} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--dark-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                          {stats.name.slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <div style={{ color: 'var(--warm-white)', fontWeight: 600 }}>{stats.name}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>
                          {stats.assignments} 次排班 · {stats.totalHours.toFixed(1)}h · {stats.swapAccepted} 次換班成功
                        </div>
                      </div>
                    </div>
                    <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1rem' }}>{stats.points} 分</div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.7rem' }}>
                    {stats.badges.length === 0 && <BadgeChip label="持續累積中" tone="muted" />}
                    {stats.badges.map((badge) => (
                      <BadgeChip key={badge} label={badge} tone="dark" />
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.7rem' }}>
                    {stats.roleBreakdown.slice(0, 4).map((role) => (
                      <span key={`${stats.uid}-${role.roleId}`} style={{ color: 'var(--muted)', fontSize: '0.76rem', border: '1px solid var(--dark-border)', borderRadius: 999, padding: '0.2rem 0.55rem' }}>
                        {roleLabel(role.roleId)} × {role.count}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <section style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: 14, padding: '1.15rem 1.2rem' }}>
              <h2 style={{ color: 'var(--warm-white)', fontSize: '1rem', fontWeight: 600, margin: 0 }}>團隊亮點</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.95rem' }}>
                <HighlightRow label="本年度主力" value={topContributor?.name || '尚無資料'} />
                <HighlightRow label="救援王" value={topSupporter?.swapHelps ? `${topSupporter.name} (${topSupporter.swapHelps} 次)` : '尚無資料'} />
                <HighlightRow label="最新歷程" value={`${yearHistory.length} 筆`} />
              </div>
            </section>

            <section style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: 14, padding: '1.15rem 1.2rem' }}>
              <h2 style={{ color: 'var(--warm-white)', fontSize: '1rem', fontWeight: 600, margin: 0 }}>近期排班歷程</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginTop: '0.95rem' }}>
                {yearHistory.slice(0, 10).map((entry) => {
                  const event = eventMap.get(entry.eventId)
                  const slot = slotMap.get(entry.slotId)
                  const actionText = entry.action === 'slot_joined' ? '報名加入' : '取消報名'
                  return (
                    <div key={entry.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.65rem' }}>
                      <div style={{ color: 'var(--warm-white)', fontSize: '0.85rem' }}>
                        {entry.displayName} {actionText}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: '0.2rem' }}>
                        {event?.title || entry.slotTitle || roleLabel(entry.roleId)} · {slot?.slotDate || entry.slotDate} · {roleLabel(entry.roleId)}
                      </div>
                    </div>
                  )
                })}
                {yearHistory.length === 0 && (
                  <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: 0 }}>
                    這一年還沒有新的排班歷程。之後大家在排班表上的報名與取消，都會累積在這裡。
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: 12, padding: '1rem 1.05rem' }}>
      <div style={{ color: 'var(--muted)', fontSize: '0.74rem', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ color: 'var(--warm-white)', fontSize: '1.45rem', fontWeight: 700, marginTop: '0.35rem' }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: '0.2rem' }}>{hint}</div>
    </div>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.8rem 0.9rem', background: 'rgba(0,0,0,0.12)' }}>
      <div style={{ color: 'var(--muted)', fontSize: '0.74rem' }}>{label}</div>
      <div style={{ color: 'var(--warm-white)', fontSize: '1.05rem', fontWeight: 700, marginTop: '0.25rem' }}>{value}</div>
    </div>
  )
}

function BadgeChip({ label, tone }: { label: string; tone: 'gold' | 'dark' | 'muted' }) {
  const palette =
    tone === 'gold'
      ? { color: 'var(--gold)', background: 'rgba(200,164,85,0.14)', border: 'rgba(200,164,85,0.35)' }
      : tone === 'dark'
        ? { color: 'var(--warm-white)', background: 'rgba(255,255,255,0.03)', border: 'var(--dark-border)' }
        : { color: 'var(--muted)', background: 'rgba(138,132,120,0.12)', border: 'rgba(138,132,120,0.22)' }

  return (
    <span style={{ color: palette.color, background: palette.background, border: `1px solid ${palette.border}`, borderRadius: 999, padding: '0.22rem 0.6rem', fontSize: '0.76rem' }}>
      {label}
    </span>
  )
}

function HighlightRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{label}</span>
      <span style={{ color: 'var(--warm-white)', fontSize: '0.84rem', textAlign: 'right' }}>{value}</span>
    </div>
  )
}
