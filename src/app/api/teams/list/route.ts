import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { ApiError, requireAuthUid } from '@/lib/server-auth'
import { Team, TeamMember } from '@/lib/types'

export const runtime = 'nodejs'

type UserDoc = {
  displayName?: string
  customName?: string
  email?: string
  photoURL?: string
}

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const actorUid = await requireAuthUid(req)

    const [teamsSnap, userSnap] = await Promise.all([
      adminDb.collection('teams').get(),
      adminDb.collection('users').doc(actorUid).get(),
    ])
    const user = (userSnap.data() as UserDoc | undefined) ?? {}
    const teamDocs = teamsSnap.docs
    const memberRefs = teamDocs.map((teamDoc) => teamDoc.ref.collection('members').doc(actorUid))
    const memberSnaps = memberRefs.length > 0 ? await adminDb.getAll(...memberRefs) : []

    const repairBatch = adminDb.batch()
    let needsRepairCommit = false
    const teams: Team[] = []

    teamDocs.forEach((teamDoc, index) => {
      const team = teamDoc.data() as Team
      const memberSnap = memberSnaps[index]
      const isCreator = team.createdBy === actorUid
      const isMember = memberSnap?.exists ?? false

      if (!isCreator && !isMember) return
      teams.push(team)

      if (isCreator && !isMember) {
        repairBatch.set(teamDoc.ref.collection('members').doc(actorUid), {
          uid: actorUid,
          displayName: user.displayName ?? '',
          customName: user.customName ?? '',
          email: user.email ?? '',
          photoURL: user.photoURL ?? '',
          role: 'owner',
          joinedAt: Date.now(),
        } satisfies TeamMember)
        needsRepairCommit = true
      }
    })

    if (needsRepairCommit) {
      await repairBatch.commit()
    }

    return NextResponse.json({ teams: teams.sort((a, b) => b.createdAt - a.createdAt) })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/teams/list] unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
