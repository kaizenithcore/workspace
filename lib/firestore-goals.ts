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
  writeBatch,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  Query,
} from "firebase/firestore"
import { db } from "./firebase/config"
import type {
  Goal,
  GoalSnapshot,
  GoalEvent,
  Challenge,
  GoalType,
  GoalUnit,
  GoalAutoCalcSource,
  GoalStatus,
  GoalEventType,
  ChallengeState,
} from "./types"

// ============ GOALS COLLECTION ============

export async function createGoal(
  userId: string,
  goalData: Omit<Goal, "id" | "userId" | "createdAt" | "updatedAt" | "ownerId">
): Promise<Goal> {
  const goalRef = doc(collection(db, `users/${userId}/goals`))
  const now = serverTimestamp()

  const goalDoc: Omit<Goal, "id"> = {
    ...goalData,
    userId,
    archived: goalData.archived ?? false,
    createdAt: now as any,
    updatedAt: now as any,
    ownerId: userId,
  }

  await setDoc(goalRef, goalDoc)

  return {
    id: goalRef.id,
    ...goalDoc,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function updateGoal(userId: string, goalId: string, updates: Partial<Goal>): Promise<void> {
  const goalRef = doc(db, `users/${userId}/goals/${goalId}`)
  await updateDoc(goalRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  const goalRef = doc(db, `users/${userId}/goals/${goalId}`)
  await deleteDoc(goalRef)
}

export async function getGoal(userId: string, goalId: string): Promise<Goal | null> {
  const goalRef = doc(db, `users/${userId}/goals/${goalId}`)
  const goalSnap = await getDoc(goalRef)

  if (!goalSnap.exists()) {
    return null
  }

  return {
    id: goalSnap.id,
    ...goalSnap.data(),
  } as Goal
}

export async function getUserGoals(userId: string): Promise<Goal[]> {
  const goalsRef = collection(db, `users/${userId}/goals`)
  const goalsSnap = await getDocs(goalsRef)

  return goalsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Goal[]
}

export function subscribeToUserGoals(userId: string, callback: (goals: Goal[]) => void): () => void {
  const goalsRef = collection(db, `users/${userId}/goals`)
  const q = query(goalsRef)

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Goal[]
    callback(goals)
  })

  return unsubscribe
}

// ============ GOAL EVENTS COLLECTION ============

export async function recordGoalEvent(
  userId: string,
  eventData: Omit<GoalEvent, "id" | "userId" | "ownerId">
): Promise<GoalEvent> {
  const eventRef = doc(collection(db, `users/${userId}/goal_events`))
  const timestamp = serverTimestamp()

  const eventDoc: Omit<GoalEvent, "id"> = {
    ...eventData,
    userId,
    timestamp: timestamp as any,
    ownerId: userId,
  }

  await setDoc(eventRef, eventDoc)

  return {
    id: eventRef.id,
    ...eventDoc,
    timestamp: new Date(),
  }
}

export async function getGoalEvents(userId: string, goalId: string): Promise<GoalEvent[]> {
  const eventsRef = collection(db, `users/${userId}/goal_events`)
  const q = query(eventsRef, where("goalId", "==", goalId))
  const eventsSnap = await getDocs(q)

  return eventsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as GoalEvent[]
}

export function subscribeToGoalEvents(userId: string, goalId: string, callback: (events: GoalEvent[]) => void): () => void {
  const eventsRef = collection(db, `users/${userId}/goal_events`)
  const q = query(eventsRef, where("goalId", "==", goalId))

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GoalEvent[]
    callback(events)
  })

  return unsubscribe
}

// ============ GOAL SNAPSHOTS COLLECTION ============

export async function createGoalSnapshot(
  userId: string,
  goalId: string,
  value: number
): Promise<GoalSnapshot> {
  const snapshotRef = doc(collection(db, `users/${userId}/goal_snapshots`))
  const timestamp = serverTimestamp()

  const snapshot: Omit<GoalSnapshot, "id"> = {
    userId,
    goalId,
    value,
    timestamp: timestamp as any,
    ownerId: userId,
  }

  await setDoc(snapshotRef, snapshot)

  return {
    id: snapshotRef.id,
    ...snapshot,
    timestamp: new Date(),
  }
}

export async function getGoalSnapshots(userId: string, goalId: string): Promise<GoalSnapshot[]> {
  const snapshotsRef = collection(db, `users/${userId}/goal_snapshots`)
  const q = query(snapshotsRef, where("goalId", "==", goalId))
  const snapshotsSnap = await getDocs(q)

  return snapshotsSnap.docs
    .map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        userId: data.userId,
        goalId: data.goalId,
        value: data.value,
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
        ownerId: data.ownerId,
      } as GoalSnapshot
    })
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

// ============ CHALLENGES COLLECTION ============

export async function createChallenge(userId: string, challengeData: Omit<Challenge, "id" | "userId" | "createdAt" | "updatedAt" | "ownerId">): Promise<Challenge> {
  const challengeRef = doc(collection(db, `users/${userId}/challenges`))
  const now = serverTimestamp()

  const challengeDoc: Omit<Challenge, "id"> = {
    ...challengeData,
    userId,
    archived: challengeData.archived ?? false,
    createdAt: now as any,
    updatedAt: now as any,
    ownerId: userId,
  }

  await setDoc(challengeRef, challengeDoc)

  return {
    id: challengeRef.id,
    ...challengeDoc,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function updateChallenge(userId: string, challengeId: string, updates: Partial<Challenge>): Promise<void> {
  const challengeRef = doc(db, `users/${userId}/challenges/${challengeId}`)
  await updateDoc(challengeRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function getUserChallenges(userId: string): Promise<Challenge[]> {
  const challengesRef = collection(db, `users/${userId}/challenges`)
  const challengesSnap = await getDocs(challengesRef)

  return challengesSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Challenge[]
}

export function subscribeToUserChallenges(userId: string, callback: (challenges: Challenge[]) => void): () => void {
  const challengesRef = collection(db, `users/${userId}/challenges`)
  const q = query(challengesRef)

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const challenges = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Challenge[]
    callback(challenges)
  })

  return unsubscribe
}

// ============ BULK OPERATIONS ============

/**
 * Update goal progress with an event in a transaction
 */
export async function incrementGoalProgress(userId: string, goalId: string, delta: number, eventType: GoalEventType, refId?: string): Promise<void> {
  const batch = writeBatch(db)

  const goalRef = doc(db, `users/${userId}/goals/${goalId}`)
  const goalSnap = await getDoc(goalRef)

  if (!goalSnap.exists()) {
    throw new Error("Goal not found")
  }

  const currentGoal = goalSnap.data() as Goal
  const newCurrent = Math.max(0, currentGoal.current + delta)

  // Update goal progress
  batch.update(goalRef, {
    current: newCurrent,
    updatedAt: serverTimestamp(),
  })

  // Create goal event
  const eventRef = doc(collection(db, `users/${userId}/goal_events`))
  batch.set(eventRef, {
    goalId,
    type: eventType,
    refId,
    delta,
    timestamp: serverTimestamp(),
    ownerId: userId,
  })

  await batch.commit()
}

/**
 * Initialize a challenge for a user
 */
export async function initializeChallenge(
  userId: string,
  challengeData: Omit<Challenge, "id" | "userId" | "createdAt" | "updatedAt" | "ownerId">
): Promise<Challenge> {
  return createChallenge(userId, challengeData)
}
