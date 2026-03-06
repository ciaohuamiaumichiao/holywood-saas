import { FieldValue } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { ApiError, parseJsonObject, readRequiredString, requireAuthUid } from '@/lib/server-auth'
import { requireActorTeamContext } from '@/lib/server-team-access'
import { Workspace, WorkspaceTeam } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const actorUid = await requireAuthUid(req)
    const body = parseJsonObject(await req.json())
    const teamId = readRequiredString(body, 'teamId')
    const confirmTeamName = readRequiredString(body, 'confirmTeamName')

    const { teamName, actorRole, actorDisplayName } = await requireActorTeamContext(adminDb, teamId, actorUid)
    if (actorRole !== 'owner') {
      throw new ApiError(403, 'Only team owner can delete the team')
    }
    if (confirmTeamName !== teamName) {
      throw new ApiError(400, 'Team name confirmation does not match')
    }

    const now = Date.now()
    const teamRef = adminDb.collection('teams').doc(teamId)
    const [workspaceSnap, workspaceInvitesSnap] = await Promise.all([
      adminDb.collection('workspaces').where('teamIds', 'array-contains', teamId).get(),
      adminDb.collection('workspaceInvites').where('createdByTeamId', '==', teamId).get(),
    ])

    for (const workspaceDoc of workspaceSnap.docs) {
      const workspaceRef = workspaceDoc.ref
      const workspace = workspaceDoc.data() as Workspace
      const linkedTeamsSnap = await workspaceRef.collection('linkedTeams').get()
      const remainingTeams = linkedTeamsSnap.docs
        .filter((linkedTeamDoc) => linkedTeamDoc.id !== teamId)
        .map((linkedTeamDoc) => linkedTeamDoc.data() as WorkspaceTeam)

      if (remainingTeams.length === 0) {
        await adminDb.recursiveDelete(workspaceRef)
        continue
      }

      const nextOwnerTeam = remainingTeams[0]
      const updateData: Record<string, unknown> = {
        teamIds: FieldValue.arrayRemove(teamId),
        teamCount: remainingTeams.length,
        updatedAt: now,
      }

      if (workspace.createdByTeamId === teamId) {
        updateData.createdByTeamId = nextOwnerTeam.teamId
        updateData.createdBy = nextOwnerTeam.joinedBy
      }

      const batch = adminDb.batch()
      batch.delete(workspaceRef.collection('linkedTeams').doc(teamId))
      batch.update(workspaceRef, updateData)
      batch.set(workspaceRef.collection('auditLogs').doc(), {
        action: 'workspace_team_removed_due_to_team_delete',
        actorUid,
        details: {
          deletedTeamId: teamId,
          deletedTeamName: teamName,
          actorDisplayName,
        },
        createdAt: now,
      })
      await batch.commit()
    }

    if (!workspaceInvitesSnap.empty) {
      const inviteBatch = adminDb.batch()
      workspaceInvitesSnap.docs.forEach((inviteDoc) => {
        inviteBatch.delete(inviteDoc.ref)
      })
      await inviteBatch.commit()
    }

    await teamRef.collection('auditLogs').add({
      action: 'team_deleted',
      actorUid,
      details: {
        teamName,
        actorDisplayName,
      },
      createdAt: now,
    })

    await adminDb.recursiveDelete(teamRef)

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/teams/delete] unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
