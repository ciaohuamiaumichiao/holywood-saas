import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { ApiError, parseJsonObject, readRequiredString, requireAuthUid } from '@/lib/server-auth'
import { requireActorCanManageTeam, requireActorTeamContext } from '@/lib/server-team-access'
import { Workspace, WorkspaceInvite } from '@/lib/types'

export const runtime = 'nodejs'

function generateToken() {
  return randomBytes(6).toString('hex')
}

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const actorUid = await requireAuthUid(req)
    const body = parseJsonObject(await req.json())
    const teamId = readRequiredString(body, 'teamId')
    const workspaceId = readRequiredString(body, 'workspaceId')

    const { actorRole, actorDisplayName } = await requireActorTeamContext(adminDb, teamId, actorUid)
    requireActorCanManageTeam(actorRole)

    const workspaceRef = adminDb.collection('workspaces').doc(workspaceId)
    const linkedTeamRef = workspaceRef.collection('linkedTeams').doc(teamId)
    const [workspaceSnap, linkedTeamSnap] = await Promise.all([workspaceRef.get(), linkedTeamRef.get()])

    if (!workspaceSnap.exists) {
      throw new ApiError(404, 'Workspace not found')
    }
    if (!linkedTeamSnap.exists) {
      throw new ApiError(403, 'Active team is not linked to this workspace')
    }

    const workspace = workspaceSnap.data() as Workspace
    const inviteToken = generateToken()
    const now = Date.now()
    const inviteRef = adminDb.collection('workspaceInvites').doc(inviteToken)

    await inviteRef.set({
      id: inviteToken,
      workspaceId,
      workspaceName: workspace.name,
      createdAt: now,
      createdBy: actorUid,
      createdByName: actorDisplayName,
      createdByTeamId: teamId,
      expiresAt: now + 7 * 86400000,
      usedCount: 0,
      maxUses: 1,
      active: true,
    } satisfies WorkspaceInvite)

    return NextResponse.json({
      inviteToken,
      joinUrl: `${req.nextUrl.origin}/workspaces?invite=${inviteToken}`,
    })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/workspaces/create-invite] unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
