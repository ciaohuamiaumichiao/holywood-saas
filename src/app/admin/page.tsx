'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/context/TeamContext'
import Navbar from '@/components/Navbar'
import {
  subscribeToSessions,
  createSession,
  deleteSession,
  updateSession,
  assignRole,
  setAnnouncement,
  getSessionAvailabilities,
} from '@/lib/firestore'
import {
  subscribeToTeamMembers,
  setMemberRole,
  removeTeamMember,
  createInvitation,
  getTeamInvitations,
  deactivateInvitation,
  updateTeam,
} from '@/lib/firestore-teams'
import { Session, TeamMember, Invitation, RoleConfig } from '@/lib/types'

type Tab = 'schedule' | 'members' | 'settings'

export default function AdminPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { activeTeam, activeTeamId, activeMember, refreshTeams } = useTeam()

  const isAdmin =
    activeMember?.role === 'owner' || activeMember?.role === 'admin'

  const [activeTab, setActiveTab] = useState<Tab>('schedule')

  // ─── Sessions ─────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<Session[]>([])
  const [showNewSessionForm, setShowNewSessionForm] = useState(false)
  const [newSession, setNewSession] = useState({
    date: '',
    title: '',
    type: 'regular' as 'regular' | 'special',
    startTime: '',
    endTime: '',
  })
  const [announcementModal, setAnnouncementModal] = useState<{
    sessionId: string
    current: string
  } | null>(null)
  const [announcementText, setAnnouncementText] = useState('')

  // ─── Members ──────────────────────────────────────────────────────────────
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  // ─── Settings ─────────────────────────────────────────────────────────────
  const [teamName, setTeamName] = useState('')
  const [roles, setRoles] = useState<RoleConfig[]>([])
  const [newRoleLabel, setNewRoleLabel] = useState('')
  const [settingsSaved, setSettingsSaved] = useState(false)

  // ─── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeMember !== null && !isAdmin) {
      router.replace('/')
    }
  }, [activeMember, isAdmin, router])

  // ─── Subscribe sessions ───────────────────────────────────────────────────
  useEffect(() => {
    if (!activeTeamId) return
    const unsub = subscribeToSessions(activeTeamId, (data) => {
      setSessions(data.sort((a, b) => a.date.localeCompare(b.date)))
    })
    return () => unsub()
  }, [activeTeamId])

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

  // ─── Init settings ────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTeam) {
      setTeamName(activeTeam.name)
      setRoles([...activeTeam.roles].sort((a, b) => a.order - b.order))
    }
  }, [activeTeam])

  // ─── Handlers: Sessions ───────────────────────────────────────────────────
  async function handleCreateSession() {
    if (!activeTeamId || !user) return
    if (!newSession.date || !newSession.title) return
    await createSession(activeTeamId, {
      date: newSession.date,
      title: newSession.title,
      type: newSession.type,
      startTime: newSession.startTime,
      endTime: newSession.endTime,
      assignments: {},
      createdBy: user.uid,
    })
    setNewSession({ date: '', title: '', type: 'regular', startTime: '', endTime: '' })
    setShowNewSessionForm(false)
  }

  async function handleDeleteSession(sessionId: string) {
    if (!activeTeamId) return
    if (!confirm('確定要刪除這個場次嗎？')) return
    await deleteSession(activeTeamId, sessionId)
  }

  async function handleSaveAnnouncement() {
    if (!activeTeamId || !announcementModal) return
    const authorName =
      activeMember?.customName || activeMember?.displayName || user?.displayName || '管理員'
    await setAnnouncement(activeTeamId, announcementModal.sessionId, announcementText, authorName)
    setAnnouncementModal(null)
    setAnnouncementText('')
  }

  // ─── Handlers: Members ────────────────────────────────────────────────────
  async function handleSetRole(uid: string, role: 'owner' | 'admin' | 'member') {
    if (!activeTeamId) return
    await setMemberRole(activeTeamId, uid, role)
  }

  async function handleRemoveMember(uid: string) {
    if (!activeTeamId) return
    if (!confirm('確定要移除此成員？')) return
    await removeTeamMember(activeTeamId, uid)
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
    const id = label.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const newRole: RoleConfig = { id, label, order: roles.length }
    setRoles([...roles, newRole])
    setNewRoleLabel('')
  }

  function handleDeleteRole(id: string) {
    setRoles(roles.filter((r) => r.id !== id))
  }

  function handleMoveRole(index: number, direction: 'up' | 'down') {
    const newRoles = [...roles]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newRoles.length) return
    ;[newRoles[index], newRoles[swapIndex]] = [newRoles[swapIndex], newRoles[index]]
    const reordered = newRoles.map((r, i) => ({ ...r, order: i }))
    setRoles(reordered)
  }

  async function handleSaveSettings() {
    if (!activeTeamId) return
    await updateTeam(activeTeamId, { name: teamName, roles })
    await refreshTeams()
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

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

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.4rem', color: 'var(--warm-white)', letterSpacing: '0.05em', marginBottom: '2rem' }}>
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
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--warm-white)', fontSize: '1.1rem', fontWeight: 500 }}>所有場次</h2>
              <button
                onClick={() => setShowNewSessionForm(!showNewSessionForm)}
                style={{
                  padding: '0.5rem 1.2rem',
                  background: 'var(--gold)',
                  color: 'var(--black)',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                {showNewSessionForm ? '取消' : '+ 新增場次'}
              </button>
            </div>

            {/* New Session Form */}
            {showNewSessionForm && (
              <div style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>日期</label>
                    <input
                      type="date"
                      value={newSession.date}
                      onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>類型</label>
                    <select
                      value={newSession.type}
                      onChange={(e) => setNewSession({ ...newSession, type: e.target.value as 'regular' | 'special' })}
                      style={inputStyle}
                    >
                      <option value="regular">一般服事</option>
                      <option value="special">特別聚會</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>標題</label>
                    <input
                      type="text"
                      placeholder="例：週六服事、特別聚會"
                      value={newSession.title}
                      onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>開始時間</label>
                    <input
                      type="time"
                      value={newSession.startTime}
                      onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>結束時間</label>
                    <input
                      type="time"
                      value={newSession.endTime}
                      onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateSession}
                  style={{ marginTop: '1rem', padding: '0.6rem 1.5rem', background: 'var(--gold)', color: 'var(--black)', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                >
                  建立場次
                </button>
              </div>
            )}

            {/* Sessions List */}
            {sessions.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '3rem 0' }}>尚無場次</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      background: 'var(--dark-surface)',
                      border: '1px solid var(--dark-border)',
                      borderRadius: '10px',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                        <span style={{ color: 'var(--warm-white)', fontWeight: 500 }}>{s.title}</span>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '1px 8px',
                          borderRadius: '999px',
                          background: s.type === 'special' ? 'rgba(200,164,85,0.2)' : 'rgba(138,132,120,0.2)',
                          color: s.type === 'special' ? 'var(--gold)' : 'var(--muted)',
                        }}>
                          {s.type === 'special' ? '特別' : '一般'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                        {s.date} {s.startTime && `${s.startTime}–${s.endTime}`}
                      </div>
                      {s.announcement && (
                        <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--gold-light)', padding: '0.3rem 0.6rem', background: 'rgba(200,164,85,0.08)', borderRadius: '4px' }}>
                          公告：{s.announcement}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button
                        onClick={() => {
                          setAnnouncementModal({ sessionId: s.id, current: s.announcement || '' })
                          setAnnouncementText(s.announcement || '')
                        }}
                        style={ghostBtnStyle}
                      >
                        編輯公告
                      </button>
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        style={{ ...ghostBtnStyle, color: '#e05555', borderColor: 'rgba(224,85,85,0.3)' }}
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                onChange={(e) => setTeamName(e.target.value)}
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

      {/* Announcement Modal */}
      {announcementModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setAnnouncementModal(null) }}
        >
          <div style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: 480 }}>
            <h3 style={{ color: 'var(--warm-white)', marginBottom: '1rem', fontWeight: 500 }}>編輯公告</h3>
            <textarea
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              rows={4}
              placeholder="輸入公告內容…"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button onClick={() => setAnnouncementModal(null)} style={ghostBtnStyle}>取消</button>
              <button
                onClick={handleSaveAnnouncement}
                style={{ padding: '0.5rem 1.2rem', background: 'var(--gold)', color: 'var(--black)', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
              >
                儲存公告
              </button>
            </div>
          </div>
        </div>
      )}
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
