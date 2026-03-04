import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { ApiError, parseJsonObject, readRequiredString, requireAuthUid } from '@/lib/server-auth'

export const runtime = 'nodejs'

interface InvitationDoc {
  active?: boolean
  expiresAt?: number
  maxUses?: number
  usedCount?: number
  teamName?: string
}

interface UserDoc {
  displayName?: string
  customName?: string
  email?: string
  photoURL?: string
}

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const actorUid = await requireAuthUid(req)
    const body = parseJsonObject(await req.json())
    const teamId = readRequiredString(body, 'teamId')
    const inviteToken = readRequiredString(body, 'inviteToken')

    const now = Date.now()
    const result = await adminDb.runTransaction(async (tx) => {
      const teamRef = adminDb.collection('teams').doc(teamId)
      const teamSnap = await tx.get(teamRef)
      if (!teamSnap.exists) {
        throw new ApiError(404, 'Team not found')
      }

      const invitationRef = teamRef.collection('invitations').doc(inviteToken)
      const invitationSnap = await tx.get(invitationRef)
      if (!invitationSnap.exists) {
        throw new ApiError(400, 'Invitation is invalid')
      }

      const invitation = invitationSnap.data() as InvitationDoc
      const active = Boolean(invitation.active)
      const expiresAt = Number(invitation.expiresAt ?? 0)
      const maxUses = Number(invitation.maxUses ?? 0)
      const usedCount = Number(invitation.usedCount ?? 0)

      if (!active || expiresAt < now) {
        throw new ApiError(400, 'Invitation is expired')
      }
      if (maxUses > 0 && usedCount >= maxUses) {
        throw new ApiError(400, 'Invitation has reached max usage')
      }

      const memberRef = teamRef.collection('members').doc(actorUid)
      const memberSnap = await tx.get(memberRef)
      if (memberSnap.exists) {
        return { status: 'already_member' as const }
      }

      const userRef = adminDb.collection('users').doc(actorUid)
      const userSnap = await tx.get(userRef)
      const profile = (userSnap.data() as UserDoc | undefined) ?? {}

      tx.set(memberRef, {
        uid: actorUid,
        displayName: profile.displayName ?? '',
        customName: profile.customName ?? '',
        email: profile.email ?? '',
        photoURL: profile.photoURL ?? '',
        role: 'member',
        joinedAt: now,
      })

      const nextUsedCount = usedCount + 1
      const invitationUpdate: Partial<InvitationDoc> = { usedCount: nextUsedCount }
      if (maxUses > 0 && nextUsedCount >= maxUses) {
        invitationUpdate.active = false
      }
      tx.update(invitationRef, invitationUpdate)

      const auditRef = teamRef.collection('auditLogs').doc()
      tx.set(auditRef, {
        action: 'member_joined',
        actorUid,
        details: {
          inviteToken,
          invitationTeamName: invitation.teamName ?? '',
        },
        createdAt: now,
      })

      return { status: 'joined' as const }
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/join-team] unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
