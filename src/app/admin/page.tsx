'use client'
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'
import {
  subscribeToEvents,
  subscribeTeamSlots,
  createEvent,
  createSlots,
} from '@/lib/firestore'
import {
  subscribeToTeamMembers,
  createInvitation,
  getTeamInvitations,
  deactivateInvitation,
  updateTeam,
} from '@/lib/firestore-teams'
import { postJsonWithAuth } from '@/lib/authed-post'
import { Event, RoleConfig, Slot, TeamMember, Invitation } from '@/lib/types'

type Tab = 'schedule' | 'members' | 'settings'

type SlotDraft = {
  eventId: string
  slotDate: string
  startTime: string
  endTime: string
  roleId: string
  capacity: number
  title: string
}

type ScheduleFeedback = {
  type: 'success' | 'error'
  text: string
}

export default function AdminPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { activeTeam, activeTeamId, activeMember, refreshTeams } = useTeam()

  const isAdmin = activeMember?.role === 'owner' || activeMember?.role === 'admin'

  const [activeTab, setActiveTab] = useState<Tab>('schedule')

  // ─── Events / Slots ───────────────────────────────────────────────────────
  const [events, setEvents] = useState<Event[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [newEvent, setNewEvent] = useState({
    date: '',
    title: '',
    type: 'regular' as 'regular' | 'special',
    description: '',
  })
  const [slotDrafts, setSlotDrafts] = useState<SlotDraft[]>([])
  const [savingEvent, setSavingEvent] = useState(false)
  const [savingSlots, setSavingSlots] = useState(false)
  const [slotEditorOpen, setSlotEditorOpen] = useState(false)
  const [scheduleFeedback, setScheduleFeedback] = useState<ScheduleFeedback | null>(null)
  const [preferredSlotSeed, setPreferredSlotSeed] = useState<Pick<SlotDraft, 'eventId' | 'slotDate'> | null>(null)

  // ─── Members ──────────────────────────────────────────────────────────────
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  // ─── Settings ─────────────────────────────────────────────────────────────
  const [settingsDraft, setSettingsDraft] = useState<{
    teamId: string | null
    teamName: string
    roles: RoleConfig[]
  } | null>(null)
  const [newRoleLabel, setNewRoleLabel] = useState('')
  const [settingsSaved, setSettingsSaved] = useState(false)
  const activeTeamSettings = useMemo(() => ({
    teamId: activeTeam?.id ?? null,
    teamName: activeTeam?.name ?? '',
    roles: activeTeam ? [...activeTeam.roles].sort((a, b) => a.order - b.order) : [],
  }), [activeTeam])
  const currentSettings =
    settingsDraft?.teamId === activeTeamSettings.teamId
      ? settingsDraft
      : activeTeamSettings
  const teamName = currentSettings.teamName
  const roles = currentSettings.roles

  function getEventById(eventId: string) {
    return events.find((event) => event.id === eventId) ?? null
  }

  const buildSlotDraft = useCallback((seed?: Partial<SlotDraft>): SlotDraft => {
    const seedEvent =
      (seed?.eventId && events.find((event) => event.id === seed.eventId)) ||
      (preferredSlotSeed?.eventId && events.find((event) => event.id === preferredSlotSeed.eventId)) ||
      events[0] ||
      null

    return {
      eventId: seed?.eventId ?? seedEvent?.id ?? preferredSlotSeed?.eventId ?? '',
      slotDate: seed?.slotDate ?? seedEvent?.date ?? preferredSlotSeed?.slotDate ?? '',
      startTime: seed?.startTime ?? '',
      endTime: seed?.endTime ?? '',
      roleId: seed?.roleId ?? roles[0]?.id ?? '',
      capacity: seed?.capacity ?? 1,
      title: seed?.title ?? '',
    }
  }, [events, preferredSlotSeed, roles])

  function validateSlotDraft(draft: SlotDraft, index: number) {
    const row = index + 1
    const event = getEventById(draft.eventId)

    if (!draft.eventId) return `第 ${row} 列尚未選擇活動`
    if (!event) return `第 ${row} 列的活動已不存在，請重新選擇`
    if (!draft.slotDate) return `第 ${row} 列尚未填寫日期`
    if (!draft.startTime || !draft.endTime) return `第 ${row} 列尚未填完開始與結束時間`
    if (!draft.roleId) return `第 ${row} 列尚未選擇角色`
    if (!roles.some((role) => role.id === draft.roleId)) return `第 ${row} 列的角色已不存在，請重新選擇`
    if (!Number.isInteger(draft.capacity) || draft.capacity < 1) return `第 ${row} 列名額必須是 1 以上的整數`

    const startsAt = Date.parse(`${draft.slotDate}T${draft.startTime}`)
    const endsAt = Date.parse(`${draft.slotDate}T${draft.endTime}`)
    if (Number.isNaN(startsAt) || Number.isNaN(endsAt)) return `第 ${row} 列的時間格式不正確`
    if (startsAt >= endsAt) return `第 ${row} 列的結束時間必須晚於開始時間`

    return null
  }

  function updateSettingsDraft(
    updater: (base: { teamId: string | null; teamName: string; roles: RoleConfig[] }) => {
      teamId: string | null
      teamName: string
      roles: RoleConfig[]
    }
  ) {
    setSettingsDraft((prev) => {
      const base = prev?.teamId === activeTeamSettings.teamId ? prev : activeTeamSettings
      return updater(base)
    })
  }

  // ─── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeMember !== null && !isAdmin) {
      router.replace('/')
    }
  }, [activeMember, isAdmin, router])

  // ─── Subscribe events / slots ─────────────────────────────────────────────
  useEffect(() => {
    if (!activeTeamId) return
    const unsubEvents = subscribeToEvents(activeTeamId, (data) => {
      setEvents(data.sort((a, b) => a.date.localeCompare(b.date)))
    })
    const unsubSlots = subscribeTeamSlots(activeTeamId, (data) => {
      setSlots(data.sort((a, b) => a.slotDate.localeCompare(b.slotDate) || a.startsAt.localeCompare(b.startsAt)))
    })
    return () => {
      unsubEvents?.()
      unsubSlots?.()
    }
  }, [activeTeamId])

  // ensure there is at least one draft row
  useEffect(() => {
    if (slotDrafts.length === 0) {
      setSlotDrafts([buildSlotDraft()])
    }
  }, [buildSlotDraft, events, roles, slotDrafts.length])

  // ─── Subscribe members ────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeTeamId || activeTab !== 'members') return
    const unsub = subscribeToTeamMembers(activeTeamId, setMembers)
    return () => unsub()
  }, [activeTeamId, activeTab])

  // ─── Load invitations ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeTeamId || activeTab !== 'members') return
    getTeamInvitations(activeTeamId).then(setInvitations)
  }, [activeTeamId, activeTab])

  // ─── Handlers: Events / Slots ─────────────────────────────────────────────
  async function handleCreateEvent() {
    if (!activeTeamId || !user) return
    const title = newEvent.title.trim()
    if (!newEvent.date) {
      setScheduleFeedback({ type: 'error', text: '請先輸入活動日期。' })
      return
    }
    if (!title) {
      setScheduleFeedback({ type: 'error', text: '請先輸入活動標題。' })
      return
    }

    setSavingEvent(true)
    setScheduleFeedback(null)
    try {
      const eventId = await createEvent(activeTeamId, {
        ...newEvent,
        title,
        description: newEvent.description.trim(),
        createdBy: user.uid,
      })
      const createdEvent: Event = {
        id: eventId,
        teamId: activeTeamId,
        title,
        date: newEvent.date,
        type: newEvent.type,
        description: newEvent.description.trim(),
        createdAt: Date.now(),
        createdBy: user.uid,
      }
      setEvents((prev) =>
        [...prev.filter((event) => event.id !== createdEvent.id), createdEvent].sort((a, b) => a.date.localeCompare(b.date))
      )
      setPreferredSlotSeed({ eventId, slotDate: newEvent.date })
      setSlotDrafts((prev) => {
        const hasDraftContent = prev.some((draft) =>
          Boolean(draft.startTime || draft.endTime || draft.title.trim())
        )
        if (slotEditorOpen && !hasDraftContent) {
          return [buildSlotDraft({ eventId, slotDate: newEvent.date })]
        }
        return prev
      })
      setNewEvent({ date: '', title: '', type: 'regular', description: '' })
      setScheduleFeedback({
        type: 'success',
        text: `已建立活動「${title}」。如需更細的班表，可展開進階時段設定。`,
      })
    } catch (error) {
      setScheduleFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : '建立活動失敗，請稍後再試。',
      })
    } finally {
      setSavingEvent(false)
    }
  }

  function updateSlotDraft(index: number, partial: Partial<SlotDraft>) {
    setSlotDrafts((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...partial }
      return next
    })
  }

  function addSlotDraft(copyFrom?: SlotDraft) {
    setSlotDrafts((prev) => {
      const base = copyFrom || prev[prev.length - 1]
      if (base) {
        return [...prev, { ...base, startTime: '', endTime: '' }]
      }
      return [...prev, buildSlotDraft()]
    })
  }

  function removeSlotDraft(index: number) {
    setSlotDrafts((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSlotEventChange(index: number, nextEventId: string) {
    const currentDraft = slotDrafts[index]
    const currentEvent = getEventById(currentDraft?.eventId || '')
    const nextEvent = getEventById(nextEventId)
    const shouldSyncDate = !currentDraft?.slotDate || (!!currentEvent && currentDraft.slotDate === currentEvent.date)

    updateSlotDraft(index, {
      eventId: nextEventId,
      slotDate: shouldSyncDate ? nextEvent?.date || '' : currentDraft.slotDate,
    })

    if (nextEvent) {
      setPreferredSlotSeed({ eventId: nextEvent.id, slotDate: nextEvent.date })
    }
  }

  async function handleCreateSlots() {
    if (!activeTeamId || !user) return
    if (events.length === 0) {
      setScheduleFeedback({ type: 'error', text: '請先建立至少一個活動，再設定時段。' })
      return
    }

    const validationError = slotDrafts.map((draft, index) => validateSlotDraft(draft, index)).find(Boolean)
    if (validationError) {
      setScheduleFeedback({ type: 'error', text: validationError })
      return
    }

    setSavingSlots(true)
    setScheduleFeedback(null)
    try {
      await createSlots(activeTeamId, slotDrafts.map((draft) => ({
        eventId: draft.eventId,
        roleId: draft.roleId,
        slotDate: draft.slotDate,
        startsAt: `${draft.slotDate}T${draft.startTime}`,
        endsAt: `${draft.slotDate}T${draft.endTime}`,
        capacity: Number(draft.capacity),
        title: draft.title.trim() || roles.find((role) => role.id === draft.roleId)?.label || '',
        createdBy: user.uid,
      })))
      const resetSeed = slotDrafts[0]
      setPreferredSlotSeed({ eventId: resetSeed.eventId, slotDate: resetSeed.slotDate })
      setSlotDrafts([
        buildSlotDraft({
          eventId: resetSeed.eventId,
          slotDate: resetSeed.slotDate,
          roleId: resetSeed.roleId,
          title: resetSeed.title.trim(),
        }),
      ])
      setScheduleFeedback({
        type: 'success',
        text: `已建立 ${slotDrafts.length} 個時段。`,
      })
    } catch (error) {
      setScheduleFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : '建立時段失敗，請稍後再試。',
      })
    } finally {
      setSavingSlots(false)
    }
  }

  // ─── Handlers: Members ────────────────────────────────────────────────────
  async function handleSetRole(uid: string, role: 'owner' | 'admin' | 'member') {
    if (!activeTeamId) return
    await postJsonWithAuth('/api/team-members/set-role', {
      teamId: activeTeamId,
      targetUid: uid,
      role,
    })
  }

  async function handleRemoveMember(uid: string) {
    if (!activeTeamId) return
    if (!confirm('確定要移除此成員？')) return
    await postJsonWithAuth('/api/team-members/remove', {
      teamId: activeTeamId,
      targetUid: uid,
    })
  }

  async function handleCreateInvite() {
    if (!activeTeamId || !user || !activeTeam) return
    const effectiveName =
      activeMember?.customName || activeMember?.displayName || user.displayName || '管理員'
    const token = await createInvitation(activeTeamId, activeTeam.name, user.uid, effectiveName)
    const link = `${window.location.origin}/join/${token}?team=${activeTeamId}`
    setInviteLink(link)
    getTeamInvitations(activeTeamId).then(setInvitations)
  }

  async function handleDeactivateInvitation(invId: string) {
    if (!activeTeamId) return
    await deactivateInvitation(activeTeamId, invId)
    getTeamInvitations(activeTeamId).then(setInvitations)
  }

  // ─── Handlers: Settings ───────────────────────────────────────────────────
  function handleAddRole() {
    const label = newRoleLabel.trim()
    if (!label) return
    updateSettingsDraft((base) => {
      const id = label.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
      const newRole: RoleConfig = { id, label, order: base.roles.length }
      return { ...base, roles: [...base.roles, newRole] }
    })
    setNewRoleLabel('')
  }

  function handleDeleteRole(id: string) {
    updateSettingsDraft((base) => ({
      ...base,
      roles: base.roles.filter((r) => r.id !== id),
    }))
  }

  function handleMoveRole(index: number, direction: 'up' | 'down') {
    updateSettingsDraft((base) => {
      const newRoles = [...base.roles]
      const swapIndex = direction === 'up' ? index - 1 : index + 1
      if (swapIndex < 0 || swapIndex >= newRoles.length) return base
      ;[newRoles[index], newRoles[swapIndex]] = [newRoles[swapIndex], newRoles[index]]
      const reordered = newRoles.map((r, i) => ({ ...r, order: i }))
      return { ...base, roles: reordered }
    })
  }

  async function handleSaveSettings() {
    if (!activeTeamId) return
    await updateTeam(activeTeamId, { name: teamName, roles })
    await refreshTeams()
    setSettingsDraft(null)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  const slotsByEvent = useMemo(() => {
    const grouped: Record<string, Slot[]> = {}
    slots.forEach(s => {
      if (!grouped[s.eventId]) grouped[s.eventId] = []
      grouped[s.eventId].push(s)
    })
    Object.values(grouped).forEach(list => list.sort((a, b) => a.slotDate.localeCompare(b.slotDate) || a.startsAt.localeCompare(b.startsAt)))
    return grouped
  }, [slots])

  // ─── Render ───────────────────────────────────────────────────────────────
  if (!activeMember) {
    return (
      <div style={{ background: 'var(--black)', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '6rem', color: 'var(--muted)' }}>
          載入中…
        </div>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', color: 'var(--body-text)' }}>
      <Navbar />

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.3rem', color: 'var(--warm-white)', letterSpacing: '0.05em', marginBottom: '2rem' }}>
          管理後台
        </h1>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--dark-border)', paddingBottom: '0' }}>
          {([
            { key: 'schedule', label: '排班管理' },
            { key: 'members', label: '成員管理' },
            { key: 'settings', label: '團隊設定' },
          ] as { key: Tab; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid var(--gold)' : '2px solid transparent',
                color: activeTab === tab.key ? 'var(--gold)' : 'var(--muted)',
                fontFamily: 'Noto Sans TC, sans-serif',
                fontSize: '0.9rem',
                cursor: 'pointer',
                marginBottom: '-1px',
                transition: 'color 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Tab 1: 排班管理 ─────────────────────────────────────────────── */}
        {activeTab === 'schedule' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {scheduleFeedback && (
              <div style={{
                padding: '0.9rem 1rem',
                borderRadius: 10,
                border: `1px solid ${scheduleFeedback.type === 'error' ? 'rgba(224,85,85,0.32)' : 'rgba(118,188,129,0.32)'}`,
                background: scheduleFeedback.type === 'error' ? 'rgba(224,85,85,0.08)' : 'rgba(118,188,129,0.08)',
                color: scheduleFeedback.type === 'error' ? '#f0aaaa' : '#97d8a2',
                fontSize: '0.84rem',
              }}>
                {scheduleFeedback.text}
              </div>
            )}

            {/* Event form */}
            <div style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: 12, padding: '1.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ color: 'var(--warm-white)', fontSize: '1.05rem', fontWeight: 600 }}>新增活動</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>日期</label>
                  <input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>類型</label>
                  <select value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as 'regular' | 'special' })} style={inputStyle}>
                    <option value="regular">一般活動</option>
                    <option value="special">特別活動</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>標題</label>
                  <input type="text" placeholder="例：募資市集 / 主日服事" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>說明（選填）</label>
                  <textarea rows={2} value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
              <button
                onClick={handleCreateEvent}
                disabled={savingEvent}
                style={{
                  marginTop: '1rem',
                  padding: '0.6rem 1.3rem',
                  background: 'var(--gold)',
                  color: 'var(--black)',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: savingEvent ? 'wait' : 'pointer',
                  opacity: savingEvent ? 0.7 : 1,
                }}
              >
                {savingEvent ? '建立中…' : '建立活動'}
              </button>
            </div>

            {/* Slot batch form */}
            <div style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: 12, padding: '1.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ color: 'var(--warm-white)', fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>進階：批次新增時段</h2>
                  <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '0.45rem 0 0' }}>
                    先建立活動；只有在需要分班、分角色、分名額時，再展開時段設定。
                  </p>
                </div>
                <button
                  onClick={() => setSlotEditorOpen((prev) => !prev)}
                  disabled={events.length === 0}
                  style={{
                    ...ghostBtnStyle,
                    padding: '0.45rem 0.95rem',
                    opacity: events.length === 0 ? 0.5 : 1,
                    cursor: events.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {events.length === 0 ? '請先建立活動' : slotEditorOpen ? '收合時段設定' : '展開時段設定'}
                </button>
              </div>

              {!slotEditorOpen && events.length > 0 && (
                <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '1rem 0 0' }}>
                  若這個活動只需要先公告，不必現在就建立時段。
                </p>
              )}

              {slotEditorOpen && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', marginBottom: '1rem' }}>
                    <span style={{ color: 'var(--warm-white)', fontSize: '0.88rem', fontWeight: 500 }}>時段設定表</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => addSlotDraft()} style={{ ...ghostBtnStyle, padding: '0.35rem 0.9rem' }}>+ 一列</button>
                      {slotDrafts[slotDrafts.length - 1] && (
                        <button onClick={() => addSlotDraft(slotDrafts[slotDrafts.length - 1])} style={{ ...ghostBtnStyle, padding: '0.35rem 0.9rem' }}>
                          複製上一列
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr) 80px', gap: '0.6rem', alignItems: 'center' }}>
                    <span style={columnHeader}>活動</span>
                    <span style={columnHeader}>日期</span>
                    <span style={columnHeader}>開始</span>
                    <span style={columnHeader}>結束</span>
                    <span style={columnHeader}>角色</span>
                    <span style={columnHeader}>名額</span>
                    <span style={columnHeader}>操作</span>

                    {slotDrafts.map((draft, idx) => (
                      <Fragment key={`draft-${idx}`}>
                        <select
                          value={draft.eventId}
                          onChange={(e) => handleSlotEventChange(idx, e.target.value)}
                          style={inputStyle}
                        >
                          <option value="">選擇活動</option>
                          {events.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.date} · {ev.title}</option>
                          ))}
                        </select>
                        <input key={`date-${idx}`} type="date" value={draft.slotDate} onChange={(e) => updateSlotDraft(idx, { slotDate: e.target.value })} style={inputStyle} />
                        <input key={`start-${idx}`} type="time" value={draft.startTime} onChange={(e) => updateSlotDraft(idx, { startTime: e.target.value })} style={inputStyle} />
                        <input key={`end-${idx}`} type="time" value={draft.endTime} onChange={(e) => updateSlotDraft(idx, { endTime: e.target.value })} style={inputStyle} />
                        <select
                          value={draft.roleId}
                          onChange={(e) => updateSlotDraft(idx, { roleId: e.target.value })}
                          style={inputStyle}
                        >
                          <option value="">選擇角色</option>
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.label}</option>
                          ))}
                        </select>
                        <input key={`cap-${idx}`} type="number" min={1} value={draft.capacity} onChange={(e) => updateSlotDraft(idx, { capacity: Number(e.target.value) })} style={inputStyle} />
                        <div key={`ops-${idx}`} style={{ display: 'flex', justifyContent: 'center' }}>
                          {slotDrafts.length > 1 && (
                            <button onClick={() => removeSlotDraft(idx)} style={{ ...ghostBtnStyle, padding: '0.25rem 0.6rem' }}>刪除</button>
                          )}
                        </div>
                      </Fragment>
                    ))}
                  </div>

                  <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: '0.75rem 0 0' }}>
                    選擇活動後會先帶入活動日期；如果是多日活動，你仍可再手動調整該列日期。
                  </p>

                  <div style={{ marginTop: '0.8rem' }}>
                    <label style={labelStyle}>（選填）時段標題：會套用在本表格所有列</label>
                    <input
                      type="text"
                      placeholder="例：志工報到 / 招待"
                      value={slotDrafts[0]?.title || ''}
                      onChange={(e) => {
                        const next = e.target.value
                        setSlotDrafts((prev) => prev.map(d => ({ ...d, title: next })))
                      }}
                      style={{ ...inputStyle, maxWidth: 360 }}
                    />
                  </div>

                  <button
                    onClick={handleCreateSlots}
                    disabled={savingSlots}
                    style={{ marginTop: '1rem', padding: '0.6rem 1.3rem', background: 'var(--gold)', color: 'var(--black)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: savingSlots ? 'wait' : 'pointer' }}
                  >
                    {savingSlots ? '建立中…' : '建立時段'}
                  </button>
                </>
              )}
            </div>

            {/* Existing events */}
            <div style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: 12, padding: '1.4rem' }}>
              <h2 style={{ color: 'var(--warm-white)', fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>所有活動 / 時段</h2>
              {events.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>尚無活動</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {events.map(ev => {
                  const evSlots = slotsByEvent[ev.id] || []
                  return (
                    <div key={ev.id} style={{ border: '1px solid var(--dark-border)', borderRadius: 10, padding: '1rem 1.1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ color: 'var(--gold)', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.08em' }}>{ev.date}</span>
                          <span style={{ color: 'var(--warm-white)', fontWeight: 600 }}>{ev.title}</span>
                          <span style={{ fontSize: '0.72rem', padding: '1px 8px', borderRadius: '999px', background: ev.type === 'special' ? 'rgba(200,164,85,0.2)' : 'rgba(138,132,120,0.15)', color: ev.type === 'special' ? 'var(--gold)' : 'var(--muted)' }}>
                            {ev.type === 'special' ? '特別' : '一般'}
                          </span>
                        </div>
                        <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{evSlots.length} 時段</span>
                      </div>
                      {ev.description && (
                        <div style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '0.5rem' }}>{ev.description}</div>
                      )}
                      {evSlots.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>尚無時段</p>}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {evSlots.map(slot => {
                          const assignees = Object.values(slot.assignments || {})
                          return (
                            <div key={slot.id} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.6rem', padding: '0.55rem 0.7rem', borderRadius: 8, border: '1px solid var(--dark-border)', background: 'rgba(255,255,255,0.02)' }}>
                              <div style={{ color: 'var(--warm-white)', fontSize: '0.88rem', fontWeight: 600 }}>
                                {slot.slotDate} {slot.startsAt.slice(11, 16)}–{slot.endsAt.slice(11, 16)}
                              </div>
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{roles.find(r => r.id === slot.roleId)?.label || slot.roleId}</span>
                                <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>名額 {assignees.length}/{slot.capacity}</span>
                                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                  {assignees.map(a => (
                                    <span key={a.userId} style={{ color: 'var(--warm-white)', fontSize: '0.8rem', padding: '0.15rem 0.45rem', borderRadius: 6, border: '1px solid var(--dark-border)' }}>{a.displayName}</span>
                                  ))}
                                  {assignees.length === 0 && <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>空缺</span>}
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
            </div>
          </div>
        )}

        {/* ─── Tab 2: 成員管理 ─────────────────────────────────────────────── */}
        {activeTab === 'members' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--warm-white)', fontSize: '1.1rem', fontWeight: 500 }}>成員列表</h2>
              <button
                onClick={handleCreateInvite}
                style={{ padding: '0.5rem 1.2rem', background: 'var(--gold)', color: 'var(--black)', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                產生邀請連結
              </button>
            </div>

            {inviteLink && (
              <div style={{ background: 'rgba(200,164,85,0.1)', border: '1px solid var(--gold)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>新邀請連結（複製分享）：</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <code style={{ flex: 1, fontSize: '0.78rem', color: 'var(--gold-light)', wordBreak: 'break-all', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                    {inviteLink}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(inviteLink)}
                    style={{ ...ghostBtnStyle, flexShrink: 0 }}
                  >
                    複製
                  </button>
                </div>
              </div>
            )}

            {/* Members */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {members.map((m) => (
                <div
                  key={m.uid}
                  style={{
                    background: 'var(--dark-surface)',
                    border: '1px solid var(--dark-border)',
                    borderRadius: '10px',
                    padding: '0.9rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  {m.photoURL ? (
                    <img src={m.photoURL} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--dark-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                      {(m.customName || m.displayName || '?')[0]}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--warm-white)', fontWeight: 500 }}>
                      {m.customName || m.displayName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{m.email}</div>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '2px 10px',
                    borderRadius: '999px',
                    background: m.role === 'owner' ? 'rgba(200,164,85,0.25)' : m.role === 'admin' ? 'rgba(100,160,200,0.2)' : 'rgba(138,132,120,0.15)',
                    color: m.role === 'owner' ? 'var(--gold)' : m.role === 'admin' ? '#7ab8d8' : 'var(--muted)',
                  }}>
                    {m.role === 'owner' ? 'Owner' : m.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                  {m.uid !== user?.uid && (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {activeMember?.role === 'owner' && (
                        <select
                          value={m.role}
                          onChange={(e) => handleSetRole(m.uid, e.target.value as 'owner' | 'admin' | 'member')}
                          style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.78rem', width: 'auto' }}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Owner</option>
                        </select>
                      )}
                      {activeMember?.role === 'admin' && m.role === 'member' && (
                        <select
                          value={m.role}
                          onChange={(e) => handleSetRole(m.uid, e.target.value as 'admin' | 'member')}
                          style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.78rem', width: 'auto' }}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                      <button
                        onClick={() => handleRemoveMember(m.uid)}
                        style={{ ...ghostBtnStyle, color: '#e05555', borderColor: 'rgba(224,85,85,0.3)', fontSize: '0.78rem' }}
                      >
                        移除
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Invitations */}
            <h3 style={{ color: 'var(--warm-white)', fontSize: '0.95rem', fontWeight: 500, marginBottom: '1rem' }}>現有邀請連結</h3>
            {invitations.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>尚無邀請連結</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      background: 'var(--dark-surface)',
                      border: `1px solid ${inv.active ? 'var(--dark-border)' : 'rgba(138,132,120,0.15)'}`,
                      borderRadius: '8px',
                      padding: '0.8rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      opacity: inv.active ? 1 : 0.5,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <code style={{ fontSize: '0.75rem', color: 'var(--gold-light)' }}>
                        /join/{inv.id}?team={inv.teamId}
                      </code>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                        由 {inv.createdByName} 建立 · 使用 {inv.usedCount} 次 · {inv.active ? '啟用中' : '已停用'}
                      </div>
                    </div>
                    {inv.active && (
                      <button
                        onClick={() => handleDeactivateInvitation(inv.id)}
                        style={{ ...ghostBtnStyle, fontSize: '0.78rem', color: '#e05555', borderColor: 'rgba(224,85,85,0.3)' }}
                      >
                        停用
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Tab 3: 團隊設定 ─────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div>
            <h2 style={{ color: 'var(--warm-white)', fontSize: '1.1rem', fontWeight: 500, marginBottom: '1.5rem' }}>團隊設定</h2>

            <div style={{ marginBottom: '2rem' }}>
              <label style={labelStyle}>團隊名稱</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => {
                  const nextName = e.target.value
                  updateSettingsDraft((base) => ({ ...base, teamName: nextName }))
                }}
                style={{ ...inputStyle, maxWidth: 400 }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>崗位清單</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="新崗位名稱"
                    value={newRoleLabel}
                    onChange={(e) => setNewRoleLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                    style={{ ...inputStyle, width: 160, padding: '0.4rem 0.7rem' }}
                  />
                  <button
                    onClick={handleAddRole}
                    style={{ padding: '0.4rem 0.9rem', background: 'var(--gold)', color: 'var(--black)', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
                  >
                    新增
                  </button>
                </div>
              </div>

              {roles.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>尚無崗位</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {roles.map((role, index) => (
                    <div
                      key={role.id}
                      style={{
                        background: 'var(--dark-surface)',
                        border: '1px solid var(--dark-border)',
                        borderRadius: '8px',
                        padding: '0.7rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                      }}
                    >
                      <span style={{ color: 'var(--muted)', fontSize: '0.8rem', width: 20, textAlign: 'center' }}>{index + 1}</span>
                      <span style={{ flex: 1, color: 'var(--warm-white)' }}>{role.label}</span>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button
                          onClick={() => handleMoveRole(index, 'up')}
                          disabled={index === 0}
                          style={{ ...ghostBtnStyle, padding: '0.2rem 0.5rem', opacity: index === 0 ? 0.3 : 1 }}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveRole(index, 'down')}
                          disabled={index === roles.length - 1}
                          style={{ ...ghostBtnStyle, padding: '0.2rem 0.5rem', opacity: index === roles.length - 1 ? 0.3 : 1 }}
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          style={{ ...ghostBtnStyle, color: '#e05555', borderColor: 'rgba(224,85,85,0.3)', padding: '0.2rem 0.6rem' }}
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSaveSettings}
              style={{ padding: '0.65rem 2rem', background: 'var(--gold)', color: 'var(--black)', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
            >
              {settingsSaved ? '已儲存 ✓' : '儲存設定'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Shared styles ─────────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  color: 'var(--muted)',
  marginBottom: '0.4rem',
  fontWeight: 500,
  letterSpacing: '0.03em',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--dark)',
  border: '1px solid var(--dark-border)',
  borderRadius: '6px',
  padding: '0.55rem 0.85rem',
  color: 'var(--warm-white)',
  fontSize: '0.88rem',
  outline: 'none',
}

const ghostBtnStyle: React.CSSProperties = {
  padding: '0.3rem 0.8rem',
  background: 'none',
  border: '1px solid var(--dark-border)',
  borderRadius: '6px',
  color: 'var(--muted)',
  fontSize: '0.82rem',
  cursor: 'pointer',
}

const columnHeader: React.CSSProperties = {
  color: 'var(--muted)',
  fontSize: '0.78rem',
  letterSpacing: '0.05em',
  paddingBottom: '0.2rem',
}
