import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { ApiError, parseJsonObject, readRequiredString, requireAuthUid } from '@/lib/server-auth'
import { requireActorTeamContext } from '@/lib/server-team-access'
import { Workspace, WorkspaceTeam } from '@/lib/types'

export const runtime = 'nodejs'

type WorkspaceListItem = Workspace & {
  linkedTeams: WorkspaceTeam[]
}

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const actorUid = await requireAuthUid(req)
    const body = parseJsonObject(await req.json())
    const teamId = readRequiredString(body, 'teamId')

    await requireActorTeamContext(adminDb, teamId, actorUid)

    const snap = await adminDb.collection('workspaces').where('teamIds', 'array-contains', teamId).get()
    const workspaces = await Promise.all(
      snap.docs.map(async (workspaceDoc) => {
        const data = workspaceDoc.data() as Workspace
        const linkedTeamsSnap = await workspaceDoc.ref.collection('linkedTeams').get()
        const linkedTeams = linkedTeamsSnap.docs
          .map((doc) => doc.data() as WorkspaceTeam)
          .sort((a, b) => a.joinedAt - b.joinedAt)

        return {
          ...(data as Workspace),
          id: workspaceDoc.id,
          linkedTeams,
        } satisfies WorkspaceListItem
      })
    )

    workspaces.sort((a, b) => b.updatedAt - a.updatedAt)
    return NextResponse.json({ workspaces })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/workspaces/list] unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
