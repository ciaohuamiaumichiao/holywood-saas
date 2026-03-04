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
  sessionId: string
  sessionDate: string     // "2026-03-07"
  sessionTitle: string    // "週六服事"
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
  role: Role
  requesterId: string
  requesterName: string
  requesterPhoto?: string
  targetId: string
  targetName: string
  targetPhoto?: string
  status: SwapStatus
  createdAt: number
}
