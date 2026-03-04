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

function isMemberRole(value: string): value is MemberRole {
  return value === 'owner' || value === 'admin' || value === 'member'
}

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const actorUid = await requireAuthUid(req)
    const body = parseJsonObject(await req.json())
    const teamId = readRequiredString(body, 'teamId')
    const targetUid = readRequiredString(body, 'targetUid')
    const nextRoleRaw = readRequiredString(body, 'role')

    if (!isMemberRole(nextRoleRaw)) {
      throw new ApiError(400, 'Invalid role')
    }
    if (targetUid === actorUid) {
      throw new ApiError(400, 'Cannot change your own role')
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
      if (actorRole === 'admin' && (nextRoleRaw === 'owner' || targetRole !== 'member')) {
        throw new ApiError(403, 'Admin can only update regular members to admin/member')
      }
      if (nextRoleRaw === targetRole) return

      tx.update(targetRef, { role: nextRoleRaw })

      const auditRef = teamRef.collection('auditLogs').doc()
      tx.set(auditRef, {
        action: 'member_role_changed',
        actorUid,
        details: {
          targetUid,
          fromRole: targetRole,
          toRole: nextRoleRaw,
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
    console.error('[api/team-members/set-role] unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
