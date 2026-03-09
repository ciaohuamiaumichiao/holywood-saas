import { EventRequirement, RoleConfig } from './types'

export function normalizeEventRequirements(requirements: EventRequirement[] | undefined): EventRequirement[] {
  if (!Array.isArray(requirements)) return []

  return requirements
    .filter((requirement) => requirement && requirement.roleId)
    .map((requirement) => {
      const assignments = requirement.assignments ?? {}
      const assigneeIds = requirement.assigneeIds ?? Object.keys(assignments)

      return {
        roleId: requirement.roleId,
        capacity: Math.max(1, Math.trunc(requirement.capacity || assigneeIds.length || 1)),
        assigneeIds: [...new Set(assigneeIds)],
        assignments,
      }
    })
    .sort((left, right) => left.roleId.localeCompare(right.roleId))
}

export function requirementCountMap(requirements: EventRequirement[] | undefined): Record<string, string> {
  const counts: Record<string, string> = {}
  normalizeEventRequirements(requirements).forEach((requirement) => {
    counts[requirement.roleId] = String(requirement.capacity)
  })
  return counts
}

export function buildEventRequirementsFromCounts(
  roles: RoleConfig[],
  rawCounts: Record<string, string>,
  existingRequirements: EventRequirement[] = []
): { requirements: EventRequirement[]; error?: string } {
  const existingByRole = new Map(
    normalizeEventRequirements(existingRequirements).map((requirement) => [requirement.roleId, requirement])
  )

  const requirements: EventRequirement[] = []

  for (const role of [...roles].sort((left, right) => left.order - right.order)) {
    const raw = (rawCounts[role.id] ?? '').trim()
    if (!raw) continue

    const capacity = Number(raw)
    if (!Number.isInteger(capacity) || capacity < 0) {
      return { requirements: [], error: `「${role.label}」的人數需填 0 以上整數。` }
    }

    const existing = existingByRole.get(role.id)
    const currentAssignments = existing?.assignments ?? {}
    const currentAssigneeIds = existing?.assigneeIds ?? Object.keys(currentAssignments)

    if (capacity === 0) {
      if (currentAssigneeIds.length > 0) {
        return { requirements: [], error: `「${role.label}」目前已有 ${currentAssigneeIds.length} 位報名，不能直接改成 0。` }
      }
      continue
    }

    if (currentAssigneeIds.length > capacity) {
      return { requirements: [], error: `「${role.label}」目前已有 ${currentAssigneeIds.length} 位報名，不能把名額調成 ${capacity}。` }
    }

    requirements.push({
      roleId: role.id,
      capacity,
      assigneeIds: currentAssigneeIds,
      assignments: currentAssignments,
    })
  }

  return { requirements }
}
