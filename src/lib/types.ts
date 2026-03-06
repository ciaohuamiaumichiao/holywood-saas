// ─── Role ────────────────────────────────────────────────────────────────────
// Role 是 string，由各 team 自訂（不再是 union type）
export type Role = string

export interface RoleConfig {
  id: string      // 唯一 key，如 'director'、'camera1'
  label: string   // 顯示名稱，如 '導播'、'攝影師 1'
  order: number   // 排序
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface UserProfile {
  uid: string
  displayName: string
  customName?: string   // 使用者自訂暱稱，優先顯示
  email: string
  photoURL: string
  createdAt: number
}

// ─── Team ─────────────────────────────────────────────────────────────────────
export type TeamPlan = 'free' | 'pro'

export interface Team {
  id: string
  name: string            // 團隊名稱，如 'HOLYWOOD 影視'
  slug: string            // URL 用，如 'holywood'
  plan: TeamPlan
  roles: RoleConfig[]     // 可自訂崗位清單
  createdAt: number
  createdBy: string       // uid
}

// ─── TeamMember ───────────────────────────────────────────────────────────────
export type MemberRole = 'owner' | 'admin' | 'member'

export interface TeamMember {
  uid: string
  displayName: string
  customName?: string
  photoURL: string
  email: string
  role: MemberRole        // 在此團隊的權限
  joinedAt: number
}

// ─── Workspaces（跨團隊聯合作業）──────────────────────────────────────────────
export interface Workspace {
  id: string
  name: string
  purpose: string
  sharedBrief?: string
  createdAt: number
  updatedAt: number
  createdBy: string
  createdByTeamId: string
  teamIds: string[]
  teamCount: number
}

export interface WorkspaceTeam {
  teamId: string
  teamName: string
  joinedAt: number
  joinedBy: string
  joinedByName: string
  joinedByTeamRole: MemberRole
}

export interface WorkspaceInvite {
  id: string
  workspaceId: string
  workspaceName: string
  createdAt: number
  createdBy: string
  createdByName: string
  createdByTeamId: string
  expiresAt: number
  usedCount: number
  maxUses: number
  active: boolean
}

// ─── Invitation ───────────────────────────────────────────────────────────────
export interface Invitation {
  id: string              // token（隨機字串）
  teamId: string
  teamName: string
  createdBy: string       // uid
  createdByName: string
  expiresAt: number       // timestamp ms
  usedCount: number
  maxUses: number         // 0 = 無限制
  active: boolean
}

// ─── Assignment ───────────────────────────────────────────────────────────────
export interface Assignment {
  userId: string
  displayName: string
  photoURL?: string
}

// ─── Slot / Event (Week2 新模型) ─────────────────────────────────────────────
export interface Event {
  id: string
  teamId: string
  title: string
  date: string              // YYYY-MM-DD（主要日期，用於列表）
  type: 'regular' | 'special'
  description?: string
  legacySessionId?: string  // 由舊 session 轉換時帶入
  createdAt: number
  createdBy: string
}

export interface SlotAssignment extends Assignment {
  assignedAt: number
}

export interface Slot {
  id: string
  teamId: string
  eventId: string
  roleId: Role
  slotDate: string            // YYYY-MM-DD，便於同日查詢
  startsAt: string            // ISO-like string "2026-03-10T09:00"
  endsAt: string              // ISO-like string
  capacity: number
  assigneeIds: string[]       // for fast queries
  assignments: Record<string, SlotAssignment> // key = userId
  title?: string
  location?: string
  createdAt: number
  createdBy: string
}

// ─── Session ──────────────────────────────────────────────────────────────────
export interface Session {
  id: string
  teamId: string
  date: string            // ISO date string: "2026-03-07"
  title: string           // e.g. "週六服事" or "特別聚會"
  type: 'regular' | 'special'
  startTime: string       // e.g. "14:00"
  endTime: string         // e.g. "17:00"
  assignments: Record<string, Assignment>   // key = role id
  announcement?: string
  announcementBy?: string
  createdAt: number
  createdBy: string
}

// ─── Comment ──────────────────────────────────────────────────────────────────
export interface Comment {
  id: string
  sessionId: string
  userId: string
  displayName: string
  photoURL?: string
  text: string
  likes?: string[]        // 按讚的 userIds
  createdAt: number
}

// ─── Availability ─────────────────────────────────────────────────────────────
export interface Availability {
  id: string
  userId: string
  teamId: string
  slotId: string
  slotDate: string     // "2026-03-07"
  slotTitle: string    // e.g. event title or slot label
  createdAt: number
}

// ─── SwapRequest ──────────────────────────────────────────────────────────────
export type SwapStatus = 'pending' | 'accepted' | 'rejected'

export interface SwapRequest {
  id: string
  teamId: string
  sessionId: string
  sessionDate: string
  sessionTitle: string
  role: Role              // roleId
  roleLabel?: string      // 顯示名稱（可選）
  requesterId: string
  requesterName: string
  requesterPhoto?: string
  targetId: string
  targetName: string
  targetPhoto?: string
  status: SwapStatus
  createdAt: number
}
