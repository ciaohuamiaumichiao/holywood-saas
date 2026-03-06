import { NextRequest, NextResponse } from 'next/server'
import { DEMO_TEAM_LIMIT, DEMO_TEAM_LIMIT_MESSAGE } from '@/lib/demo-config'
import { getAdminDb } from '@/lib/firebase-admin'
import { ApiError, parseJsonObject, readRequiredString, requireAuthUid } from '@/lib/server-auth'

export const runtime = 'nodejs'

type RoleConfigInput = {
  id: string
  label: string
  order: number
}

type UserDoc = {
  displayName?: string
  customName?: string
  email?: string
  photoURL?: string
}

function readRoles(data: Record<string, unknown>): RoleConfigInput[] {
  const raw = data.roles
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ApiError(400, 'Missing roles')
  }

  return raw.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new ApiError(400, `Invalid role at index ${index}`)
    }

    const roleData = item as Record<string, unknown>
    const id = readRequiredString(roleData, 'id', `roles[${index}].id`)
    const label = readRequiredString(roleData, 'label', `roles[${index}].label`)
    const orderValue = roleData.order
    const order =
      typeof orderValue === 'number' && Number.isFinite(orderValue) ? Math.floor(orderValue) : index

    return { id, label, order }
  })
}

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const actorUid = await requireAuthUid(req)
    const body = parseJsonObject(await req.json())
    const name = readRequiredString(body, 'name')
    const slug = readRequiredString(body, 'slug')
    const roles = readRoles(body)
    const now = Date.now()

    const teamId = await adminDb.runTransaction(async (tx) => {
      const ownedTeamsSnap = await tx.get(
        adminDb.collection('teams').where('createdBy', '==', actorUid).limit(DEMO_TEAM_LIMIT)
      )
      if (ownedTeamsSnap.size >= DEMO_TEAM_LIMIT) {
        throw new ApiError(403, DEMO_TEAM_LIMIT_MESSAGE)
      }

      const teamRef = adminDb.collection('teams').doc()
      const userRef = adminDb.collection('users').doc(actorUid)
      const userSnap = await tx.get(userRef)
      const profile = (userSnap.data() as UserDoc | undefined) ?? {}

      tx.set(teamRef, {
        id: teamRef.id,
        name,
        slug,
        plan: 'free',
        roles,
        createdAt: now,
        createdBy: actorUid,
      })

      tx.set(teamRef.collection('members').doc(actorUid), {
        uid: actorUid,
        displayName: profile.displayName ?? '',
        customName: profile.customName ?? '',
        email: profile.email ?? '',
        photoURL: profile.photoURL ?? '',
        role: 'owner',
        joinedAt: now,
      })

      tx.set(teamRef.collection('auditLogs').doc(), {
        action: 'team_created',
        actorUid,
        details: { teamName: name },
        createdAt: now,
      })

      return teamRef.id
    })

    return NextResponse.json({ teamId })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/teams/create] unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
