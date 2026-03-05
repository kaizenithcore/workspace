/**
 * Firestore CRUD helpers and realtime listeners for Sessions.
 *
 * Sessions collection: `users/{userId}/sessions`
 * SessionTemplates collection: `users/{userId}/sessionTemplates`
 *
 * All operations use serverTimestamp() for createdAt/updatedAt.
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  getDoc,
  onSnapshot,
  orderBy,
  limit,
  startAfter,
  WriteBatch,
  writeBatch,
  serverTimestamp,
  increment,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QueryConstraint,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { Session, SessionTemplate } from "@/lib/types"

const sessionAggregateRef = (userId: string) => doc(db, `users/${userId}/aggregates/sessions`)

async function updateSessionAggregateOnCreate(userId: string, session: Omit<Session, "id">) {
  const statusKey = session.status || "planned"
  await setDoc(
    sessionAggregateRef(userId),
    {
      totalSessions: increment(1),
      [`${statusKey}Sessions`]: increment(1),
      totalEstimatedDuration: increment(session.estimatedDuration || 0),
      totalActualDuration: increment(session.actualDuration || 0),
      totalPomodoros: increment(session.sessionPomodoros || 0),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

async function updateSessionAggregateOnUpdate(userId: string, previous: Session, updates: Partial<Session>) {
  const nextStatus = updates.status ?? previous.status
  const prevStatus = previous.status
  const nextEstimated = updates.estimatedDuration ?? previous.estimatedDuration ?? 0
  const prevEstimated = previous.estimatedDuration ?? 0
  const nextActual = updates.actualDuration ?? previous.actualDuration ?? 0
  const prevActual = previous.actualDuration ?? 0
  const nextPomodoros = updates.sessionPomodoros ?? previous.sessionPomodoros ?? 0
  const prevPomodoros = previous.sessionPomodoros ?? 0

  const delta: Record<string, any> = {
    totalEstimatedDuration: increment(nextEstimated - prevEstimated),
    totalActualDuration: increment(nextActual - prevActual),
    totalPomodoros: increment(nextPomodoros - prevPomodoros),
    updatedAt: serverTimestamp(),
  }

  if (prevStatus !== nextStatus) {
    delta[`${prevStatus}Sessions`] = increment(-1)
    delta[`${nextStatus}Sessions`] = increment(1)
  }

  await setDoc(sessionAggregateRef(userId), delta, { merge: true })
}

async function updateSessionAggregateOnDelete(userId: string, previous: Session) {
  const statusKey = previous.status || "planned"
  await setDoc(
    sessionAggregateRef(userId),
    {
      totalSessions: increment(-1),
      [`${statusKey}Sessions`]: increment(-1),
      totalEstimatedDuration: increment(-(previous.estimatedDuration || 0)),
      totalActualDuration: increment(-(previous.actualDuration || 0)),
      totalPomodoros: increment(-(previous.sessionPomodoros || 0)),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

// Timestamp conversion helper
function convertTimestamps<T extends Record<string, any>>(data: T): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate()
    } else {
      result[key] = value
    }
  }
  return result as T
}

// ============ SESSIONS COLLECTION ============

export async function createSession(
  userId: string,
  sessionData: Omit<Session, "id" | "userId" | "createdAt" | "updatedAt" | "ownerId">
): Promise<Session> {
  const sessionRef = doc(collection(db, `users/${userId}/sessions`))
  const now = serverTimestamp()

  const sessionDoc: Omit<Session, "id"> = {
    ...sessionData,
    userId,
    createdAt: now as any,
    updatedAt: now as any,
    ownerId: userId,
  }

  await setDoc(sessionRef, sessionDoc)
  await updateSessionAggregateOnCreate(userId, sessionDoc)

  return {
    id: sessionRef.id,
    ...sessionDoc,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function updateSession(
  userId: string,
  sessionId: string,
  updates: Partial<Session>
): Promise<void> {
  const sessionRef = doc(db, `users/${userId}/sessions/${sessionId}`)
  const previousSnap = await getDoc(sessionRef)
  const previous = previousSnap.exists() ? ({ id: previousSnap.id, ...convertTimestamps(previousSnap.data()) } as Session) : null
  const updateData: Record<string, any> = {
    ...updates,
    updatedAt: serverTimestamp(),
  }
  await updateDoc(sessionRef, updateData)

  if (previous) {
    await updateSessionAggregateOnUpdate(userId, previous, updates)
  }
}

export async function deleteSession(userId: string, sessionId: string): Promise<void> {
  const sessionRef = doc(db, `users/${userId}/sessions/${sessionId}`)
  const previousSnap = await getDoc(sessionRef)
  const previous = previousSnap.exists() ? ({ id: previousSnap.id, ...convertTimestamps(previousSnap.data()) } as Session) : null
  await deleteDoc(sessionRef)
  if (previous) {
    await updateSessionAggregateOnDelete(userId, previous)
  }
}

export async function getSession(userId: string, sessionId: string): Promise<Session | null> {
  const sessionRef = doc(db, `users/${userId}/sessions/${sessionId}`)
  const sessionSnap = await getDoc(sessionRef)

  if (!sessionSnap.exists()) {
    return null
  }

  return {
    id: sessionSnap.id,
    ...convertTimestamps(sessionSnap.data()),
  } as Session
}

export async function getUserSessions(
  userId: string,
  options?: {
    pageSize?: number
    cursor?: QueryDocumentSnapshot<DocumentData>
  }
): Promise<Session[]> {
  const sessionsRef = collection(db, `users/${userId}/sessions`)
  const constraints: QueryConstraint[] = [
    orderBy("scheduledDate", "desc"),
    limit(options?.pageSize ?? 30),
  ]
  if (options?.cursor) {
    constraints.push(startAfter(options.cursor))
  }
  const q = query(sessionsRef, ...constraints)
  const sessionsSnap = await getDocs(q)

  return sessionsSnap.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  })) as Session[]
}

export async function getSessionsByStatus(
  userId: string,
  status: Session["status"],
  pageSize = 30,
): Promise<Session[]> {
  const sessionsRef = collection(db, `users/${userId}/sessions`)
  const q = query(
    sessionsRef,
    where("status", "==", status),
    orderBy("scheduledDate", "desc"),
    limit(pageSize)
  )
  const sessionsSnap = await getDocs(q)

  return sessionsSnap.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  })) as Session[]
}

export async function getSessionsByProject(
  userId: string,
  projectId: string,
  pageSize = 30,
): Promise<Session[]> {
  const sessionsRef = collection(db, `users/${userId}/sessions`)
  const q = query(
    sessionsRef,
    where("projectId", "==", projectId),
    orderBy("scheduledDate", "desc"),
    limit(pageSize)
  )
  const sessionsSnap = await getDocs(q)

  return sessionsSnap.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  })) as Session[]
}

export async function getSessionsByCategory(
  userId: string,
  categoryId: string,
  pageSize = 30,
): Promise<Session[]> {
  const sessionsRef = collection(db, `users/${userId}/sessions`)
  const q = query(
    sessionsRef,
    where("categoryId", "==", categoryId),
    orderBy("scheduledDate", "desc"),
    limit(pageSize)
  )
  const sessionsSnap = await getDocs(q)

  return sessionsSnap.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  })) as Session[]
}

export function subscribeToUserSessions(
  userId: string,
  callback: (sessions: Session[]) => void,
  onError?: (err: Error) => void
): () => void {
  const sessionsRef = collection(db, `users/${userId}/sessions`)
  const q = query(sessionsRef, orderBy("scheduledDate", "desc"))

  return onSnapshot(
    q,
    (snapshot) => {
      const sessions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamps(doc.data()),
      })) as Session[]
      callback(sessions)
    },
    (err) => {
      console.error("[Firestore] Error listening to sessions:", err)
      onError?.(err)
    }
  )
}

export function subscribeToSessionsByStatus(
  userId: string,
  status: Session["status"],
  callback: (sessions: Session[]) => void,
  onError?: (err: Error) => void
): () => void {
  const sessionsRef = collection(db, `users/${userId}/sessions`)
  const q = query(
    sessionsRef,
    where("status", "==", status),
    orderBy("scheduledDate", "desc")
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const sessions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamps(doc.data()),
      })) as Session[]
      callback(sessions)
    },
    (err) => {
      console.error(`[Firestore] Error listening to sessions with status ${status}:`, err)
      onError?.(err)
    }
  )
}

// ============ SESSION TEMPLATES COLLECTION ============

export async function createSessionTemplate(
  userId: string,
  templateData: Omit<SessionTemplate, "id" | "userId" | "createdAt" | "updatedAt" | "ownerId">
): Promise<SessionTemplate> {
  const templateRef = doc(collection(db, `users/${userId}/sessionTemplates`))
  const now = serverTimestamp()

  const templateDoc: Omit<SessionTemplate, "id"> = {
    ...templateData,
    userId,
    createdAt: now as any,
    updatedAt: now as any,
    ownerId: userId,
  }

  await setDoc(templateRef, templateDoc)

  return {
    id: templateRef.id,
    ...templateDoc,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function updateSessionTemplate(
  userId: string,
  templateId: string,
  updates: Partial<SessionTemplate>
): Promise<void> {
  const templateRef = doc(db, `users/${userId}/sessionTemplates/${templateId}`)
  await updateDoc(templateRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteSessionTemplate(userId: string, templateId: string): Promise<void> {
  const templateRef = doc(db, `users/${userId}/sessionTemplates/${templateId}`)
  await deleteDoc(templateRef)
}

export async function getSessionTemplate(
  userId: string,
  templateId: string
): Promise<SessionTemplate | null> {
  const templateRef = doc(db, `users/${userId}/sessionTemplates/${templateId}`)
  const templateSnap = await getDoc(templateRef)

  if (!templateSnap.exists()) {
    return null
  }

  return {
    id: templateSnap.id,
    ...convertTimestamps(templateSnap.data()),
  } as SessionTemplate
}

export async function getUserSessionTemplates(userId: string, pageSize = 30): Promise<SessionTemplate[]> {
  const templatesRef = collection(db, `users/${userId}/sessionTemplates`)
  const q = query(templatesRef, orderBy("createdAt", "desc"), limit(pageSize))
  const templatesSnap = await getDocs(q)

  return templatesSnap.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  })) as SessionTemplate[]
}

export function subscribeToUserSessionTemplates(
  userId: string,
  callback: (templates: SessionTemplate[]) => void,
  onError?: (err: Error) => void
): () => void {
  const templatesRef = collection(db, `users/${userId}/sessionTemplates`)
  const q = query(templatesRef, orderBy("createdAt", "desc"))

  return onSnapshot(
    q,
    (snapshot) => {
      const templates = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamps(doc.data()),
      })) as SessionTemplate[]
      callback(templates)
    },
    (err) => {
      console.error("[Firestore] Error listening to session templates:", err)
      onError?.(err)
    }
  )
}

// ============ SESSION CREATION FROM TEMPLATE ============

/**
 * Create a new session from a template.
 * This copies the template's default settings but allows overrides.
 */
export async function createSessionFromTemplate(
  userId: string,
  templateId: string,
  overrides: Partial<Omit<Session, "id" | "userId" | "createdAt" | "updatedAt" | "ownerId">> = {}
): Promise<Session> {
  const template = await getSessionTemplate(userId, templateId)
  if (!template) {
    throw new Error(`Template ${templateId} not found`)
  }

  const sessionData: Omit<Session, "id" | "userId" | "createdAt" | "updatedAt" | "ownerId"> = {
    title: template.title,
    description: template.description,
    scheduledDate: new Date(),
    estimatedDuration: template.estimatedDuration,
    status: "planned",
    projectId: template.projectId,
    categoryId: template.categoryId,
    taskIds: template.defaultTaskIds,
    goalIds: template.defaultGoalIds,
    pomodoroEnabled: template.pomodoroEnabled,
    sessionPomodoros: 0,
    ...overrides,
  }

  return createSession(userId, sessionData)
}

// ============ SESSION STATISTICS ============

export async function getSessionStatistics(userId: string) {
  const aggregateSnap = await getDoc(sessionAggregateRef(userId))
  if (aggregateSnap.exists()) {
    const data = aggregateSnap.data() as any
    const totalSessions = data.totalSessions ?? 0
    const completedSessions = data.completedSessions ?? 0
    const plannedSessions = data.plannedSessions ?? 0
    const activeSessions = data.activeSessions ?? 0
    const totalEstimatedDuration = data.totalEstimatedDuration ?? 0
    const totalActualDuration = data.totalActualDuration ?? 0
    const totalPomodoros = data.totalPomodoros ?? 0

    return {
      totalSessions,
      completedSessions,
      plannedSessions,
      activeSessions,
      totalEstimatedDuration,
      totalActualDuration,
      avgSessionDuration: completedSessions > 0 ? totalActualDuration / completedSessions : 0,
      completionRate:
        plannedSessions > 0
          ? (completedSessions / (completedSessions + plannedSessions)) * 100
          : 0,
      totalPomodoros,
    }
  }

  const sessions = await getUserSessions(userId)

  const completedSessions = sessions.filter((s) => s.status === "completed")
  const plannedSessions = sessions.filter((s) => s.status === "planned")
  const activeSessions = sessions.filter((s) => s.status === "active")

  const totalEstimatedDuration = sessions.reduce((sum, s) => sum + (s.estimatedDuration || 0), 0)
  const totalActualDuration = completedSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0)
  const avgSessionDuration =
    completedSessions.length > 0 ? totalActualDuration / completedSessions.length : 0

  const completionRate =
    plannedSessions.length > 0
      ? (completedSessions.length / (completedSessions.length + plannedSessions.length)) * 100
      : 0

  const totalPomodoros = completedSessions.reduce((sum, s) => sum + (s.sessionPomodoros || 0), 0)

  return {
    totalSessions: sessions.length,
    completedSessions: completedSessions.length,
    plannedSessions: plannedSessions.length,
    activeSessions: activeSessions.length,
    totalEstimatedDuration,
    totalActualDuration,
    avgSessionDuration,
    completionRate,
    totalPomodoros,
  }
}

/**
 * Get session statistics grouped by project
 */
export async function getSessionStatisticsByProject(userId: string) {
  const sessions = await getUserSessions(userId)
  const completedSessions = sessions.filter((s) => s.status === "completed")

  const projectStats: Record<
    string,
    {
      projectId: string
      projectName?: string
      sessionCount: number
      completedCount: number
      totalDuration: number
      lastSessionDate: Date | null
    }
  > = {}

  completedSessions.forEach((session) => {
    const projectId = session.projectId || "unassigned"
    if (!projectStats[projectId]) {
      projectStats[projectId] = {
        projectId,
        sessionCount: 0,
        completedCount: 0,
        totalDuration: 0,
        lastSessionDate: null,
      }
    }

    projectStats[projectId].sessionCount++
    projectStats[projectId].completedCount++
    projectStats[projectId].totalDuration += session.actualDuration || 0
    projectStats[projectId].lastSessionDate =
      !projectStats[projectId].lastSessionDate ||
      session.completedAt! > projectStats[projectId].lastSessionDate
        ? session.completedAt || new Date()
        : projectStats[projectId].lastSessionDate
  })

  return Object.values(projectStats)
}
