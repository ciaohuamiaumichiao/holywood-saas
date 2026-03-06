#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Migration: sessions -> events + slots
 *
 * Usage:
 *   node scripts/migrate-sessions-to-events.js
 *
 * Env:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (with \n escaped)
 */

const admin = require('firebase-admin')

function initAdmin() {
  if (admin.apps.length) return admin.app()
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const rawKey = process.env.FIREBASE_PRIVATE_KEY
  const privateKey = rawKey
    ? (rawKey.startsWith('"') && rawKey.endsWith('"') ? rawKey.slice(1, -1) : rawKey).replace(/\\n/g, '\n')
    : undefined

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) })
    return admin.app()
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp()
    return admin.app()
  }

  if (projectId) {
    admin.initializeApp({ projectId })
    return admin.app()
  }

  throw new Error('Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY')
}

function isoDateTime(date, time) {
  if (!time) return `${date}T00:00`
  const padded = time.includes(':') ? time : `${time.slice(0, 2)}:${time.slice(2)}`
  return `${date}T${padded}`
}

async function migrateTeam(db, teamId) {
  const teamRef = db.collection('teams').doc(teamId)
  const [teamSnap, sessionsSnap] = await Promise.all([
    teamRef.get(),
    teamRef.collection('sessions').get(),
  ])

  if (!teamSnap.exists) return { sessions: 0, events: 0, slots: 0 }
  const team = teamSnap.data()
  const roles = team.roles || []

  let events = 0
  let slots = 0

  for (const doc of sessionsSnap.docs) {
    const session = doc.data()
    const eventRef = teamRef.collection('events').doc()
    const event = {
      id: eventRef.id,
      teamId,
      title: session.title || '未命名活動',
      date: session.date,
      type: session.type || 'regular',
      description: session.announcement || '',
      legacySessionId: session.id,
      createdAt: session.createdAt || Date.now(),
      createdBy: session.createdBy || 'unknown',
    }
    await eventRef.set(event)
    events += 1

    // Build slots from roles; capacity = 1 by legacy definition
    const batch = db.batch()
    roles.forEach((role) => {
      const slotRef = teamRef.collection('slots').doc()
      const assignment = (session.assignments || {})[role.id]
      const assignments = assignment
        ? {
            [assignment.userId]: {
              userId: assignment.userId,
              displayName: assignment.displayName || '',
              photoURL: assignment.photoURL || '',
              assignedAt: session.createdAt || Date.now(),
            },
          }
        : {}
      batch.set(slotRef, {
        id: slotRef.id,
        teamId,
        eventId: eventRef.id,
        roleId: role.id,
        title: `${session.title || ''}・${role.label}`,
        slotDate: session.date,
        startsAt: isoDateTime(session.date, session.startTime || ''),
        endsAt: isoDateTime(session.date, session.endTime || ''),
        capacity: 1,
        assigneeIds: assignment ? [assignment.userId] : [],
        assignments,
        createdAt: session.createdAt || Date.now(),
        createdBy: session.createdBy || 'unknown',
      })
      slots += 1
    })
    await batch.commit()
  }

  return { sessions: sessionsSnap.size, events, slots }
}

async function main() {
  const app = initAdmin()
  const db = app.firestore()

  const teamsSnap = await db.collection('teams').get()
  let total = { sessions: 0, events: 0, slots: 0 }

  for (const team of teamsSnap.docs) {
    const teamId = team.id
    const res = await migrateTeam(db, teamId)
    total.sessions += res.sessions
    total.events += res.events
    total.slots += res.slots
    console.log(`[team ${teamId}] sessions=${res.sessions}, events=${res.events}, slots=${res.slots}`)
  }

  console.log('Done', total)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
