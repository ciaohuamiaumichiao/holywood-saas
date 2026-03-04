import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import { Team, TeamMember, Invitation, MemberRole, RoleConfig, UserProfile } from './types'

// ─── Teams ────────────────────────────────────────────────────────────────────

export async function createTeam(
  name: string,
  slug: string,
  roles: RoleConfig[],
  creatorUid: string,
  creatorName: string,
  creatorPhoto: string,
  creatorEmail: string,
): Promise<string> {
  const ref = doc(collection(db, 'teams'))
  const team: Team = {
    id: ref.id,
    name,
    slug,
    plan: 'free',
    roles,
    createdAt: Date.now(),
    createdBy: creatorUid,
  }
  await setDoc(ref, team)

  // 建立者設為 owner
  await setDoc(doc(db, 'teams', ref.id, 'members', creatorUid), {
    uid: creatorUid,
    displayName: creatorName,
    photoURL: creatorPhoto,
    email: creatorEmail,
    role: 'owner',
    joinedAt: Date.now(),
  } satisfies TeamMember)

  return ref.id
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const snap = await getDoc(doc(db, 'teams', teamId))
  return snap.exists() ? (snap.data() as Team) : null
}

export async function updateTeam(teamId: string, data: Partial<Pick<Team, 'name' | 'roles'>>) {
  await updateDoc(doc(db, 'teams', teamId), data)
}

// ─── Members ──────────────────────────────────────────────────────────────────

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const snap = await getDocs(collection(db, 'teams', teamId, 'members'))
  return snap.docs.map(d => d.data() as TeamMember)
}

export async function getMyTeams(uid: string): Promise<Team[]> {
  // 查詢所有 teams 下有此 uid 的 members 文件
  // Firestore 不支援 collectionGroup 按需求組合，改為查 memberships 輔助集合
  const snap = await getDocs(
    query(collection(db, 'memberships'), where('uid', '==', uid))
  )
  if (snap.empty) return []
  const teamIds = snap.docs.map(d => d.data().teamId as string)
  const teams = await Promise.all(teamIds.map(id => getTeam(id)))
  return teams.filter(Boolean) as Team[]
}

export async function addTeamMember(
  teamId: string,
  teamName: string,
  user: { uid: string; displayName: string; photoURL: string; email: string },
  role: MemberRole = 'member',
): Promise<void> {
  await setDoc(doc(db, 'teams', teamId, 'members', user.uid), {
    uid: user.uid,
    displayName: user.displayName,
    photoURL: user.photoURL,
    email: user.email,
    role,
    joinedAt: Date.now(),
  } satisfies TeamMember)

  // 更新 memberships 輔助集合（方便 getMyTeams 查詢）
  await setDoc(doc(db, 'memberships', `${user.uid}_${teamId}`), {
    uid: user.uid,
    teamId,
    teamName,
    joinedAt: Date.now(),
  })
}

export async function setMemberRole(teamId: string, uid: string, role: MemberRole): Promise<void> {
  await updateDoc(doc(db, 'teams', teamId, 'members', uid), { role })
}

export async function removeTeamMember(teamId: string, uid: string): Promise<void> {
  await deleteDoc(doc(db, 'teams', teamId, 'members', uid))
  await deleteDoc(doc(db, 'memberships', `${uid}_${teamId}`))
}

export async function getTeamMember(teamId: string, uid: string): Promise<TeamMember | null> {
  const snap = await getDoc(doc(db, 'teams', teamId, 'members', uid))
  return snap.exists() ? (snap.data() as TeamMember) : null
}

export function subscribeToTeamMembers(
  teamId: string,
  callback: (members: TeamMember[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'teams', teamId, 'members'),
    snap => callback(snap.docs.map(d => d.data() as TeamMember))
  )
}

// ─── Invitations ──────────────────────────────────────────────────────────────

function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function createInvitation(
  teamId: string,
  teamName: string,
  createdBy: string,
  createdByName: string,
  maxUses = 0,
  expiresInDays = 7,
): Promise<string> {
  const token = generateToken()
  const invitation: Invitation = {
    id: token,
    teamId,
    teamName,
    createdBy,
    createdByName,
    expiresAt: Date.now() + expiresInDays * 86400000,
    usedCount: 0,
    maxUses,
    active: true,
  }
  await setDoc(doc(db, 'teams', teamId, 'invitations', token), invitation)
  return token
}

export async function getInvitation(teamId: string, token: string): Promise<Invitation | null> {
  const snap = await getDoc(doc(db, 'teams', teamId, 'invitations', token))
  return snap.exists() ? (snap.data() as Invitation) : null
}

export async function findInvitationByToken(token: string): Promise<(Invitation & { teamId: string }) | null> {
  // token 存在路徑中，需從 URL query 取得 teamId。
  // 若未知 teamId，使用 collectionGroup 查詢
  const snap = await getDocs(
    query(collection(db, 'invitations_index'), where('token', '==', token))
  )
  if (snap.empty) return null
  const data = snap.docs[0].data()
  return await getInvitation(data.teamId, token)
    .then(inv => inv ? { ...inv, teamId: data.teamId } : null)
}

export async function deactivateInvitation(teamId: string, token: string): Promise<void> {
  await updateDoc(doc(db, 'teams', teamId, 'invitations', token), { active: false })
}

export async function getTeamInvitations(teamId: string): Promise<Invitation[]> {
  const snap = await getDocs(collection(db, 'teams', teamId, 'invitations'))
  return snap.docs.map(d => d.data() as Invitation)
}

// ─── Users ────────────────────────────────────────────────────────────────────
// (全域 users 集合，非 team 範圍)

export async function upsertUser(user: Omit<UserProfile, 'createdAt'>): Promise<void> {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, { ...user, createdAt: Date.now() })
  } else {
    await updateDoc(ref, {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    })
  }
}

export async function getUser(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as UserProfile) : null
}

export async function updateUserProfile(uid: string, data: { customName?: string }): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data)
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map(d => d.data() as UserProfile)
}
