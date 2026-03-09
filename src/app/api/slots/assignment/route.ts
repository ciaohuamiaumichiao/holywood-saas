import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { ApiError, parseJsonObject, readRequiredString, requireAuthUid } from '@/lib/server-auth'

export const runtime = 'nodejs'

type Operation = 'assign' | 'unassign'

interface TeamMemberDoc {
  displayName?: string
  customName?: string
  photoURL?: string
}

interface SlotDoc {
  id: string
  eventId: string
  roleId: string
  slotDate: string
  startsAt: string
  endsAt: string
  capacity: number
  assigneeIds?: string[]
  assignments?: Record<string, { userId?: string; displayName?: string; photoURL?: string; assignedAt?: number }>
  title?: string
}

function isOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const aS = Date.parse(aStart)
  const aE = Date.parse(aEnd || aStart)
  const bS = Date.parse(bStart)
  const bE = Date.parse(bEnd || bStart)
  return aS < bE && bS < aE
}

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const actorUid = await requireAuthUid(req)
    const body = parseJsonObject(await req.json())
    const teamId = readRequiredString(body, 'teamId')
    const slotId = readRequiredString(body, 'slotId')
    const operation = readRequiredString(body, 'operation') as Operation

    if (operation !== 'assign' && operation !== 'unassign') {
      throw new ApiError(400, 'Invalid operation')
    }

    const result = await adminDb.runTransaction(async (tx) => {
      const teamRef = adminDb.collection('teams').doc(teamId)
      const memberRef = teamRef.collection('members').doc(actorUid)
      const slotRef = teamRef.collection('slots').doc(slotId)
      const [memberSnap, slotSnap] = await Promise.all([tx.get(memberRef), tx.get(slotRef)])

      if (!memberSnap.exists) throw new ApiError(403, 'Member not in team')
      if (!slotSnap.exists) throw new ApiError(404, 'Slot not found')

      const member = (memberSnap.data() as TeamMemberDoc | undefined) ?? {}
      const slot = slotSnap.data() as SlotDoc
      const actorName = member.customName || member.displayName || actorUid
      const actorPhoto = member.photoURL ?? ''
      const assigneeIds = slot.assigneeIds ?? []
      const assignments = slot.assignments ?? {}

      if (operation === 'assign') {
        if (assigneeIds.includes(actorUid)) {
          return { result: 'ok' as const }
        }
        if (assigneeIds.length >= slot.capacity) {
          return { result: 'full' as const }
        }

        const overlappingQuery = teamRef
          .collection('slots')
          .where('slotDate', '==', slot.slotDate)
          .where('assigneeIds', 'array-contains', actorUid)
        const overlappingSnap = await tx.get(overlappingQuery)
        const hasConflict = overlappingSnap.docs.some((docSnap) => {
          const other = docSnap.data() as SlotDoc
          if (other.id === slot.id) return false
          return isOverlap(slot.startsAt, slot.endsAt, other.startsAt, other.endsAt)
        })
        if (hasConflict) {
          return { result: 'conflict' as const }
        }

        tx.update(slotRef, {
          assigneeIds: [...assigneeIds, actorUid],
          [`assignments.${actorUid}`]: {
            userId: actorUid,
            displayName: actorName,
            photoURL: actorPhoto,
            assignedAt: Date.now(),
          },
        })
        const historyRef = teamRef.collection('scheduleHistory').doc()
        tx.set(historyRef, {
          id: historyRef.id,
          teamId,
          userId: actorUid,
          displayName: actorName,
          photoURL: actorPhoto,
          slotId: slot.id,
          eventId: slot.eventId,
          roleId: slot.roleId,
          slotTitle: slot.title ?? '',
          slotDate: slot.slotDate,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          action: 'slot_joined',
          source: 'self_service',
          createdAt: Date.now(),
        })
        return { result: 'ok' as const }
      }

      if (!assignments[actorUid]) {
        return { result: 'ok' as const }
      }

      const { [actorUid]: _removed, ...restAssignments } = assignments // eslint-disable-line @typescript-eslint/no-unused-vars
      tx.update(slotRef, {
        assigneeIds: assigneeIds.filter((id) => id !== actorUid),
        assignments: restAssignments,
      })
      const historyRef = teamRef.collection('scheduleHistory').doc()
      tx.set(historyRef, {
        id: historyRef.id,
        teamId,
        userId: actorUid,
        displayName: actorName,
        photoURL: actorPhoto,
        slotId: slot.id,
        eventId: slot.eventId,
        roleId: slot.roleId,
        slotTitle: slot.title ?? '',
        slotDate: slot.slotDate,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        action: 'slot_left',
        source: 'self_service',
        createdAt: Date.now(),
      })
      return { result: 'ok' as const }
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/slots/assignment] unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
