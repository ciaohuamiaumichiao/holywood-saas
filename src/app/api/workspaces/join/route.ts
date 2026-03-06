import { FieldValue } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { ApiError, parseJsonObject, readRequiredString, requireAuthUid } from '@/lib/server-auth'
import { requireActorCanManageTeam, requireActorTeamContext } from '@/lib/server-team-access'
import { WorkspaceInvite, WorkspaceTeam } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const actorUid = await requireAuthUid(req)
    const body = parseJsonObject(await req.json())
    const teamId = readRequiredString(body, 'teamId')
    const inviteToken = readRequiredString(body, 'inviteToken')

    const { teamName, actorRole, actorDisplayName } = await requireActorTeamContext(adminDb, teamId, actorUid)
    requireActorCanManageTeam(actorRole)

    const now = Date.now()
    const result = await adminDb.runTransaction(async (tx) => {
      const inviteRef = adminDb.collection('workspaceInvites').doc(inviteToken)
      const inviteSnap = await tx.get(inviteRef)
      if (!inviteSnap.exists) {
        throw new ApiError(400, 'Workspace invite is invalid')
      }

      const invite = inviteSnap.data() as WorkspaceInvite
      const workspaceRef = adminDb.collection('workspaces').doc(invite.workspaceId)
      const linkedTeamRef = workspaceRef.collection('linkedTeams').doc(teamId)

      const [workspaceSnap, linkedTeamSnap] = await Promise.all([
        tx.get(workspaceRef),
        tx.get(linkedTeamRef),
      ])

      if (!workspaceSnap.exists) {
        throw new ApiError(404, 'Workspace not found')
      }
      if (!invite.active || invite.expiresAt < now) {
        throw new ApiError(400, 'Workspace invite is expired')
      }
      if (invite.maxUses > 0 && invite.usedCount >= invite.maxUses) {
        throw new ApiError(400, 'Workspace invite has reached max usage')
      }
      if (linkedTeamSnap.exists) {
        return { status: 'already_joined' as const, workspaceId: invite.workspaceId }
      }

      tx.set(linkedTeamRef, {
        teamId,
        teamName,
        joinedAt: now,
        joinedBy: actorUid,
        joinedByName: actorDisplayName,
        joinedByTeamRole: actorRole,
      } satisfies WorkspaceTeam)

      tx.update(workspaceRef, {
        teamIds: FieldValue.arrayUnion(teamId),
        teamCount: FieldValue.increment(1),
        updatedAt: now,
      })

      const nextUsedCount = invite.usedCount + 1
      const inviteUpdate: Partial<WorkspaceInvite> = { usedCount: nextUsedCount }
      if (invite.maxUses > 0 && nextUsedCount >= invite.maxUses) {
        inviteUpdate.active = false
      }
      tx.update(inviteRef, inviteUpdate)

      tx.set(workspaceRef.collection('auditLogs').doc(), {
        action: 'workspace_team_joined',
        actorUid,
        details: {
          inviteToken,
          teamId,
          teamName,
        },
        createdAt: now,
      })

      return { status: 'joined' as const, workspaceId: invite.workspaceId }
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/workspaces/join] unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
