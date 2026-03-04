import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { ApiError, parseJsonObject, readRequiredString, requireAuthUid } from '@/lib/server-auth'

export const runtime = 'nodejs'

interface TeamMemberDoc {
  uid: string
  displayName?: string
  customName?: string
  photoURL?: string
}

interface SessionDoc {
  assignments?: Record<string, { userId?: string; displayName?: string; photoURL?: string } | null>
}

type SelfAssignAction = 'assign' | 'unassign'

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const actorUid = await requireAuthUid(req)
    const body = parseJsonObject(await req.json())
    const teamId = readRequiredString(body, 'teamId')
    const sessionId = readRequiredString(body, 'sessionId')
    const roleId = readRequiredString(body, 'roleId')
    const actionRaw = readRequiredString(body, 'action')

    if (actionRaw !== 'assign' && actionRaw !== 'unassign') {
      throw new ApiError(400, 'Invalid action')
    }
    const action = actionRaw as SelfAssignAction

    const result = await adminDb.runTransaction(async (tx) => {
      const teamRef = adminDb.collection('teams').doc(teamId)
      const memberRef = teamRef.collection('members').doc(actorUid)
      const sessionRef = teamRef.collection('sessions').doc(sessionId)

      const [memberSnap, sessionSnap] = await Promise.all([tx.get(memberRef), tx.get(sessionRef)])
      if (!memberSnap.exists) throw new ApiError(403, 'Member not in team')
      if (!sessionSnap.exists) throw new ApiError(404, 'Session not found')

      const member = memberSnap.data() as TeamMemberDoc
      const session = sessionSnap.data() as SessionDoc
      const assignments = session.assignments ?? {}

      if (action === 'assign') {
        const occupiedBy = assignments[roleId]?.userId
        if (occupiedBy && occupiedBy !== actorUid) {
          return { status: 'taken' as const }
        }
        const existingRole = Object.keys(assignments).find(
          (key) => key !== roleId && assignments[key]?.userId === actorUid
        )
        if (existingRole) {
          return { status: 'already_has_role' as const }
        }
        tx.update(sessionRef, {
          [`assignments.${roleId}`]: {
            userId: actorUid,
            displayName: member.customName || member.displayName || actorUid,
            photoURL: member.photoURL ?? '',
          },
        })

        const auditRef = teamRef.collection('auditLogs').doc()
        tx.set(auditRef, {
          action: 'self_assignment_changed',
          actorUid,
          details: { sessionId, roleId, operation: 'assign' },
          createdAt: Date.now(),
        })
        return { status: 'ok' as const }
      }

      if (assignments[roleId]?.userId !== actorUid) {
        return { status: 'not_assigned' as const }
      }

      tx.update(sessionRef, { [`assignments.${roleId}`]: null })
      const auditRef = teamRef.collection('auditLogs').doc()
      tx.set(auditRef, {
        action: 'self_assignment_changed',
        actorUid,
        details: { sessionId, roleId, operation: 'unassign' },
        createdAt: Date.now(),
      })
      return { status: 'ok' as const }
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/sessions/self-assignment] unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
