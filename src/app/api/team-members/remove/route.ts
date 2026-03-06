import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { ApiError, parseJsonObject, readRequiredString, requireAuthUid } from '@/lib/server-auth'

export const runtime = 'nodejs'

type MemberRole = 'owner' | 'admin' | 'member'

interface TeamMemberDoc {
  role?: MemberRole
  displayName?: string
  customName?: string
}

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const actorUid = await requireAuthUid(req)
    const body = parseJsonObject(await req.json())
    const teamId = readRequiredString(body, 'teamId')
    const targetUid = readRequiredString(body, 'targetUid')

    if (targetUid === actorUid) {
      throw new ApiError(400, 'Cannot remove yourself')
    }

    await adminDb.runTransaction(async (tx) => {
      const teamRef = adminDb.collection('teams').doc(teamId)
      const actorRef = teamRef.collection('members').doc(actorUid)
      const targetRef = teamRef.collection('members').doc(targetUid)

      const [actorSnap, targetSnap] = await Promise.all([tx.get(actorRef), tx.get(targetRef)])
      if (!actorSnap.exists) throw new ApiError(403, 'Actor is not in team')
      if (!targetSnap.exists) throw new ApiError(404, 'Target member not found')

      const actor = actorSnap.data() as TeamMemberDoc
      const target = targetSnap.data() as TeamMemberDoc
      const actorRole = actor.role ?? 'member'
      const targetRole = target.role ?? 'member'

      if (actorRole !== 'owner' && actorRole !== 'admin') {
        throw new ApiError(403, 'No permission')
      }
      if (actorRole === 'admin' && targetRole !== 'member') {
        throw new ApiError(403, 'Admin can only remove regular members')
      }
      if (targetRole === 'owner') {
        throw new ApiError(403, 'Cannot remove an owner')
      }

      tx.delete(targetRef)

      const auditRef = teamRef.collection('auditLogs').doc()
      tx.set(auditRef, {
        action: 'member_removed',
        actorUid,
        details: {
          targetUid,
          targetRole,
          targetName: target.customName || target.displayName || '',
        },
        createdAt: Date.now(),
      })
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/team-members/remove] unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
