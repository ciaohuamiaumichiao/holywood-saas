import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { ApiError, parseJsonObject, readRequiredString, requireAuthUid } from '@/lib/server-auth'
import { EventRequirement } from '@/lib/types'

export const runtime = 'nodejs'

type Operation = 'assign' | 'unassign'

interface TeamMemberDoc {
  displayName?: string
  customName?: string
  photoURL?: string
}

interface EventDoc {
  id: string
  title?: string
  date?: string
  requirements?: EventRequirement[]
}

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const actorUid = await requireAuthUid(req)
    const body = parseJsonObject(await req.json())
    const teamId = readRequiredString(body, 'teamId')
    const eventId = readRequiredString(body, 'eventId')
    const roleId = readRequiredString(body, 'roleId')
    const operation = readRequiredString(body, 'operation') as Operation

    if (operation !== 'assign' && operation !== 'unassign') {
      throw new ApiError(400, 'Invalid operation')
    }

    const result = await adminDb.runTransaction(async (tx) => {
      const teamRef = adminDb.collection('teams').doc(teamId)
      const memberRef = teamRef.collection('members').doc(actorUid)
      const eventRef = teamRef.collection('events').doc(eventId)
      const [memberSnap, eventSnap] = await Promise.all([tx.get(memberRef), tx.get(eventRef)])

      if (!memberSnap.exists) throw new ApiError(403, 'Member not in team')
      if (!eventSnap.exists) return { result: 'not_found' as const }

      const member = (memberSnap.data() as TeamMemberDoc | undefined) ?? {}
      const event = (eventSnap.data() as EventDoc | undefined) ?? { id: eventId }
      const requirements = Array.isArray(event.requirements) ? [...event.requirements] : []
      const requirementIndex = requirements.findIndex((requirement) => requirement.roleId === roleId)

      if (requirementIndex === -1) {
        return { result: 'not_found' as const }
      }

      const requirement = requirements[requirementIndex]
      const actorName = member.customName || member.displayName || actorUid
      const actorPhoto = member.photoURL ?? ''
      const assigneeIds = requirement.assigneeIds ?? []
      const assignments = requirement.assignments ?? {}

      if (operation === 'assign') {
        if (assigneeIds.includes(actorUid)) {
          return { result: 'ok' as const }
        }
        if (assigneeIds.length >= requirement.capacity) {
          return { result: 'full' as const }
        }
        const hasOtherRole = requirements.some((item) => item.roleId !== roleId && (item.assigneeIds ?? []).includes(actorUid))
        if (hasOtherRole) {
          return { result: 'already_has_role' as const }
        }

        requirements[requirementIndex] = {
          ...requirement,
          assigneeIds: [...assigneeIds, actorUid],
          assignments: {
            ...assignments,
            [actorUid]: {
              userId: actorUid,
              displayName: actorName,
              photoURL: actorPhoto,
              assignedAt: Date.now(),
            },
          },
        }

        tx.update(eventRef, { requirements })

        const historyRef = teamRef.collection('scheduleHistory').doc()
        tx.set(historyRef, {
          id: historyRef.id,
          teamId,
          assignmentType: 'event',
          userId: actorUid,
          displayName: actorName,
          photoURL: actorPhoto,
          eventId,
          eventTitle: event.title ?? '',
          eventRequirementRoleId: roleId,
          roleId,
          slotDate: event.date ?? '',
          action: 'event_joined',
          source: 'self_service',
          createdAt: Date.now(),
        })

        return { result: 'ok' as const }
      }

      if (!assignments[actorUid]) {
        return { result: 'ok' as const }
      }

      const { [actorUid]: _removed, ...restAssignments } = assignments // eslint-disable-line @typescript-eslint/no-unused-vars
      requirements[requirementIndex] = {
        ...requirement,
        assigneeIds: assigneeIds.filter((id) => id !== actorUid),
        assignments: restAssignments,
      }

      tx.update(eventRef, { requirements })

      const historyRef = teamRef.collection('scheduleHistory').doc()
      tx.set(historyRef, {
        id: historyRef.id,
        teamId,
        assignmentType: 'event',
        userId: actorUid,
        displayName: actorName,
        photoURL: actorPhoto,
        eventId,
        eventTitle: event.title ?? '',
        eventRequirementRoleId: roleId,
        roleId,
        slotDate: event.date ?? '',
        action: 'event_left',
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
    console.error('[api/events/assignment] unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
