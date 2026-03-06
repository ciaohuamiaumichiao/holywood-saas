import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { ApiError, parseJsonObject, readRequiredString, requireAuthUid } from '@/lib/server-auth'
import { requireActorCanManageTeam, requireActorTeamContext } from '@/lib/server-team-access'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const actorUid = await requireAuthUid(req)
    const body = parseJsonObject(await req.json())
    const teamId = readRequiredString(body, 'teamId')
    const workspaceId = readRequiredString(body, 'workspaceId')

    const { actorRole, actorDisplayName } = await requireActorTeamContext(adminDb, teamId, actorUid)
    requireActorCanManageTeam(actorRole)

    const rawName = body.name
    const rawPurpose = body.purpose
    const rawSharedBrief = body.sharedBrief

    const updateData: Record<string, unknown> = { updatedAt: Date.now() }
    if (typeof rawName === 'string') {
      const name = rawName.trim()
      if (!name) {
        throw new ApiError(400, 'Workspace name cannot be empty')
      }
      updateData.name = name
    }
    if (typeof rawPurpose === 'string') {
      updateData.purpose = rawPurpose.trim()
    }
    if (typeof rawSharedBrief === 'string') {
      updateData.sharedBrief = rawSharedBrief.trim()
    }

    if (Object.keys(updateData).length === 1) {
      throw new ApiError(400, 'No workspace fields to update')
    }

    const workspaceRef = adminDb.collection('workspaces').doc(workspaceId)
    const linkedTeamRef = workspaceRef.collection('linkedTeams').doc(teamId)
    const [workspaceSnap, linkedTeamSnap] = await Promise.all([workspaceRef.get(), linkedTeamRef.get()])

    if (!workspaceSnap.exists) {
      throw new ApiError(404, 'Workspace not found')
    }
    if (!linkedTeamSnap.exists) {
      throw new ApiError(403, 'Active team is not linked to this workspace')
    }

    await workspaceRef.update(updateData)
    await workspaceRef.collection('auditLogs').add({
      action: 'workspace_updated',
      actorUid,
      details: {
        actorName: actorDisplayName,
        teamId,
        updatedFields: Object.keys(updateData).filter((field) => field !== 'updatedAt'),
      },
      createdAt: Date.now(),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/workspaces/update] unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
