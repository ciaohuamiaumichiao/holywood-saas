import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { ApiError, parseJsonObject, readRequiredString, requireAuthUid } from '@/lib/server-auth'
import { requireActorTeamContext } from '@/lib/server-team-access'
import { Event, Slot, Team, WorkspaceTeam } from '@/lib/types'

export const runtime = 'nodejs'

type WorkspaceScheduleEntry = {
  id: string
  teamId: string
  teamName: string
  slotId: string
  slotDate: string
  startsAt: string
  endsAt: string
  eventTitle: string
  roleLabel: string
  assignees: Array<{
    userId: string
    displayName: string
  }>
  conflictUserIds: string[]
}

type WorkspaceConflict = {
  id: string
  userId: string
  displayName: string
  entries: [
    {
      entryId: string
      teamId: string
      teamName: string
      eventTitle: string
      roleLabel: string
      startsAt: string
      endsAt: string
    },
    {
      entryId: string
      teamId: string
      teamName: string
      eventTitle: string
      roleLabel: string
      startsAt: string
      endsAt: string
    },
  ]
}

function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function rangesOverlap(left: WorkspaceScheduleEntry, right: WorkspaceScheduleEntry) {
  return left.startsAt < right.endsAt && right.startsAt < left.endsAt
}

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const actorUid = await requireAuthUid(req)
    const body = parseJsonObject(await req.json())
    const teamId = readRequiredString(body, 'teamId')
    const workspaceId = readRequiredString(body, 'workspaceId')
    const rawDateFrom = typeof body.dateFrom === 'string' ? body.dateFrom.trim() : ''
    const rawDateTo = typeof body.dateTo === 'string' ? body.dateTo.trim() : ''

    await requireActorTeamContext(adminDb, teamId, actorUid)

    const workspaceRef = adminDb.collection('workspaces').doc(workspaceId)
    const linkedTeamsRef = workspaceRef.collection('linkedTeams')
    const [workspaceSnap, activeLinkedTeamSnap, linkedTeamsSnap] = await Promise.all([
      workspaceRef.get(),
      linkedTeamsRef.doc(teamId).get(),
      linkedTeamsRef.get(),
    ])

    if (!workspaceSnap.exists) {
      throw new ApiError(404, 'Workspace not found')
    }
    if (!activeLinkedTeamSnap.exists) {
      throw new ApiError(403, 'Active team is not linked to this workspace')
    }

    const linkedTeams = linkedTeamsSnap.docs.map((doc) => doc.data() as WorkspaceTeam)
    const linkedTeamIds = linkedTeams.map((linkedTeam) => linkedTeam.teamId)
    if (linkedTeamIds.length === 0) {
      return NextResponse.json({ entries: [], conflicts: [] })
    }

    const dateFrom = isValidDateString(rawDateFrom) ? rawDateFrom : new Date().toISOString().slice(0, 10)
    const dateTo = isValidDateString(rawDateTo) ? rawDateTo : '9999-12-31'

    const teamRefs = linkedTeamIds.map((linkedTeamId) => adminDb.collection('teams').doc(linkedTeamId))
    const teamSnaps = await adminDb.getAll(...teamRefs)
    const teamMap = new Map<string, Team>()
    teamSnaps.forEach((teamSnap) => {
      if (teamSnap.exists) {
        const team = teamSnap.data() as Team
        teamMap.set(team.id, team)
      }
    })

    const entries: WorkspaceScheduleEntry[] = []

    await Promise.all(linkedTeamIds.map(async (linkedTeamId) => {
      const team = teamMap.get(linkedTeamId)
      if (!team) return

      const [eventsSnap, slotsSnap] = await Promise.all([
        adminDb.collection('teams').doc(linkedTeamId).collection('events').get(),
        adminDb.collection('teams').doc(linkedTeamId).collection('slots').get(),
      ])

      const eventTitleMap = new Map<string, string>()
      eventsSnap.docs.forEach((eventDoc) => {
        const event = eventDoc.data() as Event
        eventTitleMap.set(event.id, event.title)
      })

      const teamName =
        linkedTeams.find((linkedTeam) => linkedTeam.teamId === linkedTeamId)?.teamName ||
        team.name
      const roleLabelMap = new Map(team.roles.map((role) => [role.id, role.label]))

      slotsSnap.docs.forEach((slotDoc) => {
        const slot = slotDoc.data() as Slot
        if (slot.slotDate < dateFrom || slot.slotDate > dateTo) return

        const assignments = Object.entries(slot.assignments || {}).map(([userId, assignment]) => ({
          userId,
          displayName: assignment.displayName,
        }))

        entries.push({
          id: `${linkedTeamId}:${slot.id}`,
          teamId: linkedTeamId,
          teamName,
          slotId: slot.id,
          slotDate: slot.slotDate,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          eventTitle: eventTitleMap.get(slot.eventId) || slot.title || '未命名活動',
          roleLabel: roleLabelMap.get(slot.roleId) || slot.title || slot.roleId,
          assignees: assignments,
          conflictUserIds: [],
        })
      })
    }))

    entries.sort((left, right) => {
      if (left.slotDate !== right.slotDate) return left.slotDate.localeCompare(right.slotDate)
      if (left.startsAt !== right.startsAt) return left.startsAt.localeCompare(right.startsAt)
      return left.teamName.localeCompare(right.teamName)
    })

    const entryById = new Map(entries.map((entry) => [entry.id, entry]))
    const userAssignments = new Map<string, Array<{ entry: WorkspaceScheduleEntry; displayName: string }>>()

    entries.forEach((entry) => {
      entry.assignees.forEach((assignee) => {
        const next = userAssignments.get(assignee.userId) ?? []
        next.push({ entry, displayName: assignee.displayName })
        userAssignments.set(assignee.userId, next)
      })
    })

    const conflicts: WorkspaceConflict[] = []

    userAssignments.forEach((assignments, userId) => {
      const sortedAssignments = [...assignments].sort((left, right) => left.entry.startsAt.localeCompare(right.entry.startsAt))
      for (let index = 0; index < sortedAssignments.length; index += 1) {
        const current = sortedAssignments[index]
        for (let nextIndex = index + 1; nextIndex < sortedAssignments.length; nextIndex += 1) {
          const next = sortedAssignments[nextIndex]
          if (current.entry.teamId === next.entry.teamId) continue
          if (!rangesOverlap(current.entry, next.entry)) continue

          const currentEntry = entryById.get(current.entry.id)
          const nextEntry = entryById.get(next.entry.id)
          if (currentEntry && !currentEntry.conflictUserIds.includes(userId)) {
            currentEntry.conflictUserIds.push(userId)
          }
          if (nextEntry && !nextEntry.conflictUserIds.includes(userId)) {
            nextEntry.conflictUserIds.push(userId)
          }

          conflicts.push({
            id: `${userId}:${current.entry.id}:${next.entry.id}`,
            userId,
            displayName: current.displayName || next.displayName || '未命名成員',
            entries: [
              {
                entryId: current.entry.id,
                teamId: current.entry.teamId,
                teamName: current.entry.teamName,
                eventTitle: current.entry.eventTitle,
                roleLabel: current.entry.roleLabel,
                startsAt: current.entry.startsAt,
                endsAt: current.entry.endsAt,
              },
              {
                entryId: next.entry.id,
                teamId: next.entry.teamId,
                teamName: next.entry.teamName,
                eventTitle: next.entry.eventTitle,
                roleLabel: next.entry.roleLabel,
                startsAt: next.entry.startsAt,
                endsAt: next.entry.endsAt,
              },
            ],
          })
        }
      }
    })

    return NextResponse.json({
      dateFrom,
      dateTo,
      entries,
      conflicts,
    })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/workspaces/overview] unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
