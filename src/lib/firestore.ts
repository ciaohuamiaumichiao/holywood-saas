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
  orderBy,
  onSnapshot,
  runTransaction,
  writeBatch,
  Unsubscribe,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db } from './firebase'
import { Session, SwapRequest, Role, Assignment, Comment, Availability, Event, Slot, SlotAssignment } from './types'

// ─── 路徑輔助 ─────────────────────────────────────────────────────────────────
const sessionsCol = (teamId: string) => collection(db, 'teams', teamId, 'sessions')
const sessionDoc = (teamId: string, id: string) => doc(db, 'teams', teamId, 'sessions', id)
const eventsCol = (teamId: string) => collection(db, 'teams', teamId, 'events')
const slotsCol = (teamId: string) => collection(db, 'teams', teamId, 'slots')
const slotDoc = (teamId: string, id: string) => doc(db, 'teams', teamId, 'slots', id)
const commentsCol = (teamId: string, sessionId: string) =>
  collection(db, 'teams', teamId, 'sessions', sessionId, 'comments')
const commentDoc = (teamId: string, sessionId: string, commentId: string) =>
  doc(db, 'teams', teamId, 'sessions', sessionId, 'comments', commentId)
const swapsCol = (teamId: string) => collection(db, 'teams', teamId, 'swaps')
const swapDoc = (teamId: string, id: string) => doc(db, 'teams', teamId, 'swaps', id)
const availCol = (teamId: string) => collection(db, 'teams', teamId, 'availabilities')

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(
  teamId: string,
  data: Omit<Session, 'id' | 'teamId' | 'createdAt'>
): Promise<string> {
  const ref = doc(sessionsCol(teamId))
  await setDoc(ref, { ...data, id: ref.id, teamId, createdAt: Date.now() })
  return ref.id
}

// ─── Events & Slots (Week2) ───────────────────────────────────────────────────

export async function createEvent(
  teamId: string,
  data: Omit<Event, 'id' | 'teamId' | 'createdAt'>
): Promise<string> {
  const title = data.title.trim()
  if (!data.date) {
    throw new Error('活動日期不可空白')
  }
  if (!title) {
    throw new Error('活動標題不可空白')
  }

  const ref = doc(eventsCol(teamId))
  await setDoc(ref, {
    ...data,
    title,
    description: data.description?.trim() || '',
    id: ref.id,
    teamId,
    createdAt: Date.now(),
  })
  return ref.id
}

export async function getEvents(teamId: string): Promise<Event[]> {
  const snap = await getDocs(query(eventsCol(teamId), orderBy('date', 'asc')))
  return snap.docs.map(d => d.data() as Event)
}

export function subscribeToEvents(
  teamId: string,
  callback: (events: Event[]) => void
): Unsubscribe {
  return onSnapshot(
    query(eventsCol(teamId), orderBy('date', 'asc')),
    snap => callback(snap.docs.map(d => d.data() as Event))
  )
}

export function subscribeTeamSlots(
  teamId: string,
  callback: (slots: Slot[]) => void
): Unsubscribe {
  return onSnapshot(
    query(slotsCol(teamId), orderBy('slotDate', 'asc'), orderBy('startsAt', 'asc')),
    snap => callback(snap.docs.map(d => d.data() as Slot))
  )
}

export async function createSlots(
  teamId: string,
  slots: Array<Omit<Slot, 'id' | 'teamId' | 'assigneeIds' | 'assignments' | 'createdAt'> & {
    assignments?: Record<string, SlotAssignment>
  }>
): Promise<string[]> {
  const normalizedSlots = slots.map((slot, index) => normalizeCreateSlotInput(slot, index))
  const batch = writeBatch(db)
  const ids: string[] = []
  normalizedSlots.forEach(s => {
    const ref = doc(slotsCol(teamId))
    const assignments = s.assignments || {}
    const assigneeIds = Object.keys(assignments)
    batch.set(ref, {
      ...s,
      id: ref.id,
      teamId,
      assigneeIds,
      assignments,
      createdAt: Date.now(),
    })
    ids.push(ref.id)
  })
  await batch.commit()
  return ids
}

function normalizeCreateSlotInput(
  slot: Omit<Slot, 'id' | 'teamId' | 'assigneeIds' | 'assignments' | 'createdAt'> & {
    assignments?: Record<string, SlotAssignment>
  },
  index: number
) {
  if (!slot.eventId) throw new Error(`第 ${index + 1} 列缺少活動`)
  if (!slot.roleId) throw new Error(`第 ${index + 1} 列缺少角色`)
  if (!slot.slotDate) throw new Error(`第 ${index + 1} 列缺少日期`)
  if (!Number.isInteger(slot.capacity) || slot.capacity < 1) {
    throw new Error(`第 ${index + 1} 列名額必須是 1 以上的整數`)
  }
  if (!isValidSlotDateTime(slot.startsAt) || !isValidSlotDateTime(slot.endsAt)) {
    throw new Error(`第 ${index + 1} 列時間格式不正確`)
  }
  if (Date.parse(slot.startsAt) >= Date.parse(slot.endsAt)) {
    throw new Error(`第 ${index + 1} 列結束時間必須晚於開始時間`)
  }

  return {
    ...slot,
    title: slot.title?.trim() || '',
  }
}

function isValidSlotDateTime(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))
}

export async function getSlotsByEvent(teamId: string, eventId: string): Promise<Slot[]> {
  const snap = await getDocs(query(slotsCol(teamId), where('eventId', '==', eventId), orderBy('slotDate', 'asc'), orderBy('startsAt', 'asc')))
  return snap.docs.map(d => d.data() as Slot)
}

export function subscribeSlotsByEvent(
  teamId: string,
  eventId: string,
  callback: (slots: Slot[]) => void
): Unsubscribe {
  return onSnapshot(
    query(slotsCol(teamId), where('eventId', '==', eventId), orderBy('slotDate', 'asc'), orderBy('startsAt', 'asc')),
    snap => callback(snap.docs.map(d => d.data() as Slot))
  )
}

type AssignSlotResult = 'ok' | 'full' | 'conflict' | 'not_found'

export async function assignSlot(
  teamId: string,
  slotId: string,
  user: { uid: string; displayName: string; photoURL?: string }
): Promise<AssignSlotResult> {
  const ref = slotDoc(teamId, slotId)

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) return 'not_found'
    const slot = snap.data() as Slot

    const assignments = slot.assignments || {}
    const assigneeIds = slot.assigneeIds || []

    if (assigneeIds.includes(user.uid)) return 'ok'
    if (assigneeIds.length >= slot.capacity) return 'full'

    // 衝突檢查：找同日且 assigneeIds 含本人，檢查時間重疊
    const overlappingSnap = await getDocs(
      query(
        slotsCol(teamId),
        where('slotDate', '==', slot.slotDate),
        where('assigneeIds', 'array-contains', user.uid)
      )
    )
    const hasConflict = overlappingSnap.docs.some(d => {
      const other = d.data() as Slot
      if (other.id === slot.id) return false
      return isOverlap(slot.startsAt, slot.endsAt, other.startsAt, other.endsAt)
    })
    if (hasConflict) return 'conflict'

    const newAssignments = {
      ...assignments,
      [user.uid]: {
        userId: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        assignedAt: Date.now(),
      } satisfies SlotAssignment,
    }

    tx.update(ref, {
      assignments: newAssignments,
      assigneeIds: [...assigneeIds, user.uid],
    })
    return 'ok'
  })
}

export async function unassignSlot(
  teamId: string,
  slotId: string,
  userId: string
): Promise<void> {
  const ref = slotDoc(teamId, slotId)
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) return
    const slot = snap.data() as Slot
    const assignments = slot.assignments || {}
    if (!assignments[userId]) return
    const { [userId]: _skip, ...rest } = assignments // eslint-disable-line @typescript-eslint/no-unused-vars
    tx.update(ref, {
      assignments: rest,
      assigneeIds: (slot.assigneeIds || []).filter(id => id !== userId),
    })
  })
}

function isOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const aS = Date.parse(aStart)
  const aE = Date.parse(aEnd || aStart)
  const bS = Date.parse(bStart)
  const bE = Date.parse(bEnd || bStart)
  return aS < bE && bS < aE
}

export async function updateSession(teamId: string, id: string, data: Partial<Session>) {
  await updateDoc(sessionDoc(teamId, id), data)
}

export async function deleteSession(teamId: string, id: string) {
  const [commentsSnap, availSnap, swapsSnap] = await Promise.all([
    getDocs(commentsCol(teamId, id)),
    getDocs(query(availCol(teamId), where('sessionId', '==', id))),
    getDocs(query(swapsCol(teamId), where('sessionId', '==', id))),
  ])

  const batch = writeBatch(db)
  commentsSnap.docs.forEach(d => batch.delete(d.ref))
  availSnap.docs.forEach(d => batch.delete(d.ref))
  swapsSnap.docs.forEach(d => batch.delete(d.ref))
  batch.delete(sessionDoc(teamId, id))
  await batch.commit()
}

export async function getSessions(teamId: string): Promise<Session[]> {
  const snap = await getDocs(query(sessionsCol(teamId), orderBy('date', 'asc')))
  return snap.docs.map(d => d.data() as Session)
}

export function subscribeToSessions(
  teamId: string,
  callback: (sessions: Session[]) => void
): Unsubscribe {
  return onSnapshot(
    query(sessionsCol(teamId), orderBy('date', 'asc')),
    snap => callback(snap.docs.map(d => d.data() as Session))
  )
}

export async function assignRole(
  teamId: string,
  sessionId: string,
  role: Role,
  assignment: Assignment | null
) {
  const field = `assignments.${role}`
  await updateDoc(sessionDoc(teamId, sessionId), { [field]: assignment })
}

// ─── Self-Assign ──────────────────────────────────────────────────────────────

export type SelfAssignResult = 'ok' | 'taken' | 'already_has_role'

export async function selfAssignRole(
  teamId: string,
  sessionId: string,
  role: Role,
  user: { uid: string; displayName: string; photoURL: string }
): Promise<SelfAssignResult> {
  const ref = sessionDoc(teamId, sessionId)

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) return 'taken'

    const session = snap.data() as Session
    const assignments = session.assignments ?? {}

    if (assignments[role]?.userId && assignments[role].userId !== user.uid) {
      return 'taken'
    }

    const existingRole = Object.keys(assignments).find(
      r => r !== role && assignments[r]?.userId === user.uid
    )
    if (existingRole) return 'already_has_role'

    tx.update(ref, {
      [`assignments.${role}`]: {
        userId: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
    })
    return 'ok'
  })
}

export async function selfUnassignRole(
  teamId: string,
  sessionId: string,
  role: Role,
  userId: string
): Promise<void> {
  const ref = sessionDoc(teamId, sessionId)
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) return
    const session = snap.data() as Session
    if (session.assignments[role]?.userId !== userId) return
    tx.update(ref, { [`assignments.${role}`]: null })
  })
}

// ─── Announcement ─────────────────────────────────────────────────────────────

export async function setAnnouncement(
  teamId: string,
  sessionId: string,
  text: string,
  authorName?: string
) {
  await updateDoc(sessionDoc(teamId, sessionId), {
    announcement: text || null,
    announcementBy: text ? (authorName ?? null) : null,
  })
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function addComment(
  teamId: string,
  sessionId: string,
  user: { uid: string; displayName: string; photoURL?: string },
  text: string
): Promise<void> {
  const ref = doc(commentsCol(teamId, sessionId))
  await setDoc(ref, {
    id: ref.id,
    sessionId,
    userId: user.uid,
    displayName: user.displayName,
    photoURL: user.photoURL ?? '',
    text,
    createdAt: Date.now(),
  })
}

export async function deleteComment(
  teamId: string,
  sessionId: string,
  commentId: string
): Promise<void> {
  await deleteDoc(commentDoc(teamId, sessionId, commentId))
}

export function subscribeToComments(
  teamId: string,
  sessionId: string,
  callback: (comments: Comment[]) => void
): Unsubscribe {
  return onSnapshot(
    query(commentsCol(teamId, sessionId), orderBy('createdAt', 'asc')),
    snap => callback(snap.docs.map(d => d.data() as Comment))
  )
}

export async function toggleCommentLike(
  teamId: string,
  sessionId: string,
  commentId: string,
  userId: string,
  liked: boolean
): Promise<void> {
  await updateDoc(commentDoc(teamId, sessionId, commentId), {
    likes: liked ? arrayRemove(userId) : arrayUnion(userId),
  })
}

// ─── Swap Requests ────────────────────────────────────────────────────────────

export async function createSwapRequest(
  teamId: string,
  data: Omit<SwapRequest, 'id' | 'teamId' | 'createdAt'>
): Promise<string> {
  const ref = doc(swapsCol(teamId))
  await setDoc(ref, { ...data, id: ref.id, teamId, status: 'pending', createdAt: Date.now() })
  return ref.id
}

export async function respondToSwap(
  teamId: string,
  swapId: string,
  status: 'accepted' | 'rejected'
) {
  if (status === 'rejected') {
    await updateDoc(swapDoc(teamId, swapId), { status })
    return
  }

  const swapRef = swapDoc(teamId, swapId)
  await runTransaction(db, async (tx) => {
    const swapSnap = await tx.get(swapRef)
    if (!swapSnap.exists()) return
    const swap = swapSnap.data() as SwapRequest

    const sessionRef = sessionDoc(teamId, swap.sessionId)
    const sessionSnap = await tx.get(sessionRef)
    if (!sessionSnap.exists()) return

    const session = sessionSnap.data() as Session
    const assignments = session.assignments ?? {}

    if (assignments[swap.role]?.userId !== swap.requesterId) return

    const targetHasOtherRole = Object.keys(assignments).some(
      r => r !== swap.role && assignments[r]?.userId === swap.targetId
    )
    if (targetHasOtherRole) return

    tx.update(swapRef, { status: 'accepted' })
    tx.update(sessionRef, {
      [`assignments.${swap.role}`]: {
        userId: swap.targetId,
        displayName: swap.targetName,
        photoURL: swap.targetPhoto ?? '',
      },
    })
  })
}

export function subscribeToMySwaps(
  teamId: string,
  userId: string,
  callback: (swaps: SwapRequest[]) => void
): Unsubscribe {
  return onSnapshot(
    query(swapsCol(teamId), where('targetId', '==', userId), where('status', '==', 'pending')),
    snap => callback(snap.docs.map(d => d.data() as SwapRequest))
  )
}

export function subscribeToMyOutgoingSwaps(
  teamId: string,
  userId: string,
  callback: (swaps: SwapRequest[]) => void
): Unsubscribe {
  return onSnapshot(
    query(swapsCol(teamId), where('requesterId', '==', userId), where('status', '==', 'pending')),
    snap => callback(snap.docs.map(d => d.data() as SwapRequest))
  )
}

// ─── Availabilities ───────────────────────────────────────────────────────────

export async function addAvailability(
  teamId: string,
  userId: string,
  slotId: string,
  slotDate: string,
  slotTitle: string,
): Promise<void> {
  const ref = doc(availCol(teamId))
  await setDoc(ref, {
    id: ref.id,
    userId,
    teamId,
    slotId,
    slotDate,
    slotTitle,
    createdAt: Date.now(),
  })
}

export async function removeAvailability(
  teamId: string,
  userId: string,
  slotId: string
): Promise<void> {
  const snap = await getDocs(
    query(availCol(teamId), where('userId', '==', userId), where('slotId', '==', slotId))
  )
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
}

export function subscribeToMyAvailabilities(
  teamId: string,
  userId: string,
  callback: (availabilities: Availability[]) => void
): Unsubscribe {
  return onSnapshot(
    query(availCol(teamId), where('userId', '==', userId)),
    snap => callback(snap.docs.map(d => d.data() as Availability))
  )
}

export async function getAllAvailabilities(teamId: string): Promise<Availability[]> {
  const snap = await getDocs(availCol(teamId))
  return snap.docs.map(d => d.data() as Availability)
}

export async function getSlotAvailabilities(
  teamId: string,
  slotId: string
): Promise<(Availability & { customName?: string; photoURL?: string })[]> {
  const snap = await getDocs(
    query(availCol(teamId), where('slotId', '==', slotId))
  )
  const availabilities = snap.docs.map(d => d.data() as Availability)

  const enriched = await Promise.all(
    availabilities.map(async (a) => {
      const userSnap = await getDoc(doc(db, 'users', a.userId))
      if (userSnap.exists()) {
        const profile = userSnap.data()
        return { ...a, customName: profile.customName, photoURL: profile.photoURL }
      }
      return a
    })
  )
  return enriched
}
