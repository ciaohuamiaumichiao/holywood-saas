import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { ApiError, parseJsonObject, readRequiredString, requireAuthUid } from '@/lib/server-auth'
import { requireActorCanManageTeam, requireActorTeamContext } from '@/lib/server-team-access'
import { Workspace, WorkspaceTeam } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const actorUid = await requireAuthUid(req)
    const body = parseJsonObject(await req.json())
    const teamId = readRequiredString(body, 'teamId')
    const name = readRequiredString(body, 'name')
    const purpose = typeof body.purpose === 'string' ? body.purpose.trim() : ''

    const { teamName, actorRole, actorDisplayName } = await requireActorTeamContext(adminDb, teamId, actorUid)
    requireActorCanManageTeam(actorRole)

    const now = Date.now()
    const workspaceRef = adminDb.collection('workspaces').doc()

    await adminDb.runTransaction(async (tx) => {
      tx.set(workspaceRef, {
        id: workspaceRef.id,
        name,
        purpose,
        sharedBrief: '',
        createdAt: now,
        updatedAt: now,
        createdBy: actorUid,
        createdByTeamId: teamId,
        teamIds: [teamId],
        teamCount: 1,
      } satisfies Workspace)

      tx.set(workspaceRef.collection('linkedTeams').doc(teamId), {
        teamId,
        teamName,
        joinedAt: now,
        joinedBy: actorUid,
        joinedByName: actorDisplayName,
        joinedByTeamRole: actorRole,
      } satisfies WorkspaceTeam)

      tx.set(workspaceRef.collection('auditLogs').doc(), {
        action: 'workspace_created',
        actorUid,
        details: {
          workspaceName: name,
          teamId,
          teamName,
        },
        createdAt: now,
      })
    })

    return NextResponse.json({ workspaceId: workspaceRef.id })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/workspaces/create] unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
