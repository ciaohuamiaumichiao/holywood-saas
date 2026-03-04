import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { ApiError, parseJsonObject, readRequiredString, requireAuthUid } from '@/lib/server-auth'

export const runtime = 'nodejs'

type SwapStatus = 'pending' | 'accepted' | 'rejected'

interface TeamMemberDoc {
  role?: 'owner' | 'admin' | 'member'
}

interface TeamDoc {
  roles?: Array<{ id?: string; label?: string }>
}

interface SwapDoc {
  teamId: string
  sessionId: string
  role: string
  requesterId: string
  targetId: string
  targetName?: string
  targetPhoto?: string
  status: SwapStatus
}

interface SessionDoc {
  assignments?: Record<string, { userId?: string; displayName?: string; photoURL?: string } | null>
}

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const actorUid = await requireAuthUid(req)
    const body = parseJsonObject(await req.json())
    const teamId = readRequiredString(body, 'teamId')
    const swapId = readRequiredString(body, 'swapId')
    const response = readRequiredString(body, 'response')

    if (response !== 'accepted' && response !== 'rejected') {
      throw new ApiError(400, 'Invalid response')
    }

    const result = await adminDb.runTransaction(async (tx) => {
      const teamRef = adminDb.collection('teams').doc(teamId)
      const memberRef = teamRef.collection('members').doc(actorUid)
      const swapRef = teamRef.collection('swaps').doc(swapId)

      const [memberSnap, swapSnap] = await Promise.all([tx.get(memberRef), tx.get(swapRef)])
      if (!memberSnap.exists) throw new ApiError(403, 'Member not in team')
      if (!swapSnap.exists) throw new ApiError(404, 'Swap request not found')

      const member = memberSnap.data() as TeamMemberDoc
      const swap = swapSnap.data() as SwapDoc
      const isAdmin = member.role === 'owner' || member.role === 'admin'
      const isTarget = swap.targetId === actorUid
      if (!isAdmin && !isTarget) {
        throw new ApiError(403, 'No permission')
      }
      if (swap.status !== 'pending') {
        return { status: swap.status }
      }

      if (response === 'rejected') {
        tx.update(swapRef, { status: 'rejected' })
        const auditRef = teamRef.collection('auditLogs').doc()
        tx.set(auditRef, {
          action: 'swap_responded',
          actorUid,
          details: { swapId, response: 'rejected' },
          createdAt: Date.now(),
        })
        return { status: 'rejected' as const }
      }

      const sessionRef = teamRef.collection('sessions').doc(swap.sessionId)
      const sessionSnap = await tx.get(sessionRef)
      if (!sessionSnap.exists) {
        throw new ApiError(404, 'Session not found')
      }

      const session = sessionSnap.data() as SessionDoc
      const assignments = session.assignments ?? {}
      let roleKey = swap.role
      if (assignments[roleKey]?.userId !== swap.requesterId) {
        // Backward compatibility: older swaps stored role label instead of roleId.
        const teamSnap = await tx.get(teamRef)
        const team = (teamSnap.data() as TeamDoc | undefined) ?? {}
        const matchedRoleId = (team.roles ?? []).find((r) => r.label === swap.role)?.id
        if (matchedRoleId && assignments[matchedRoleId]?.userId === swap.requesterId) {
          roleKey = matchedRoleId
        } else {
          throw new ApiError(400, 'Requester no longer occupies this role')
        }
      }
      const targetHasOtherRole = Object.keys(assignments).some(
        (roleId) => roleId !== roleKey && assignments[roleId]?.userId === swap.targetId
      )
      if (targetHasOtherRole) {
        throw new ApiError(400, 'Target already has another role in this session')
      }

      tx.update(swapRef, { status: 'accepted', role: roleKey })
      tx.update(sessionRef, {
        [`assignments.${roleKey}`]: {
          userId: swap.targetId,
          displayName: swap.targetName ?? '',
          photoURL: swap.targetPhoto ?? '',
        },
      })

      const auditRef = teamRef.collection('auditLogs').doc()
      tx.set(auditRef, {
        action: 'swap_responded',
        actorUid,
        details: { swapId, response: 'accepted' },
        createdAt: Date.now(),
      })

      return { status: 'accepted' as const }
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/swaps/respond] unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
