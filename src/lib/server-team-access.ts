import type { Firestore } from 'firebase-admin/firestore'
import { ApiError } from './server-auth'
import { MemberRole } from './types'

type TeamDoc = {
  name?: string
}

type TeamMemberDoc = {
  role?: MemberRole
  displayName?: string
  customName?: string
}

export type ActorTeamContext = {
  teamName: string
  actorRole: MemberRole
  actorDisplayName: string
}

export async function requireActorTeamContext(
  adminDb: Firestore,
  teamId: string,
  actorUid: string
): Promise<ActorTeamContext> {
  const teamRef = adminDb.collection('teams').doc(teamId)
  const actorRef = teamRef.collection('members').doc(actorUid)
  const [teamSnap, actorSnap] = await Promise.all([teamRef.get(), actorRef.get()])

  if (!teamSnap.exists) {
    throw new ApiError(404, 'Team not found')
  }
  if (!actorSnap.exists) {
    throw new ApiError(403, 'Actor is not in team')
  }

  const team = (teamSnap.data() as TeamDoc | undefined) ?? {}
  const actor = (actorSnap.data() as TeamMemberDoc | undefined) ?? {}

  return {
    teamName: team.name ?? '',
    actorRole: actor.role ?? 'member',
    actorDisplayName: actor.customName || actor.displayName || '',
  }
}

export function requireActorCanManageTeam(role: MemberRole) {
  if (role !== 'owner' && role !== 'admin') {
    throw new ApiError(403, 'No permission')
  }
}
