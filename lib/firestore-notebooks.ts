/**
 * Firestore CRUD helpers and realtime listeners for Notebooks.
 *
 * Notebooks collection: `users/{userId}/notebooks`
 * Pages subcollection: `users/{userId}/notebooks/{notebookId}/pages`
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
  writeBatch,
  serverTimestamp,
  Timestamp,
  collectionGroup,
  deleteField,
  increment,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { Notebook, NotebookPage } from "@/lib/notebook-types"

/**
 * Convert Firestore Timestamps to Date objects
 */
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

// ============ NOTEBOOKS COLLECTION ============

/**
 * Create a new notebook
 */
export async function createNotebook(
  userId: string,
  notebookData: Omit<Notebook, "id" | "userId" | "createdAt" | "updatedAt" | "pageCount">
): Promise<Notebook> {
  console.log('[createNotebook] Creating notebook for user:', userId)
  console.log('[createNotebook] Notebook data:', notebookData)
  
  const notebookRef = doc(collection(db, `users/${userId}/notebooks`))
  const now = serverTimestamp()

  const notebookDoc = {
    ...notebookData,
    userId,
    pageCount: 0,
    createdAt: now,
    updatedAt: now,
  }

  console.log('[createNotebook] Document to save:', { ...notebookDoc, id: notebookRef.id })

  try {
    await setDoc(notebookRef, notebookDoc)
    console.log('[createNotebook] Notebook created successfully with ID:', notebookRef.id)
  } catch (error) {
    console.error('[createNotebook] Error creating notebook:', error)
    throw error
  }

  return {
    id: notebookRef.id,
    ...notebookDoc,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Notebook
}

/**
 * Get a single notebook by ID
 */
export async function getNotebook(userId: string, notebookId: string): Promise<Notebook | null> {
  const notebookRef = doc(db, `users/${userId}/notebooks/${notebookId}`)
  const snapshot = await getDoc(notebookRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...convertTimestamps(snapshot.data()),
  } as Notebook
}

/**
 * List all notebooks for a user with optional filters
 */
export async function listNotebooks(
  userId: string,
  filters?: {
    projectId?: string
    categoryId?: string
    sortBy?: "updatedAt" | "createdAt" | "title"
    sortOrder?: "asc" | "desc"
    limit?: number
  }
): Promise<Notebook[]> {
  const page = await listNotebooksPage(userId, filters)
  return page.items
}

export async function listNotebooksPage(
  userId: string,
  filters?: {
    projectId?: string
    categoryId?: string
    sortBy?: "updatedAt" | "createdAt" | "title"
    sortOrder?: "asc" | "desc"
    limit?: number
    cursor?: QueryDocumentSnapshot<DocumentData>
  }
): Promise<{
  items: Notebook[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
  hasMore: boolean
}> {
  const constraints: QueryConstraint[] = []

  if (filters?.projectId) {
    constraints.push(where("projectIds", "array-contains", filters.projectId))
  }
  if (filters?.categoryId) {
    constraints.push(where("categoryIds", "array-contains", filters.categoryId))
  }

  const sortField = filters?.sortBy || "updatedAt"
  const sortOrder = filters?.sortOrder || "desc"
  constraints.push(orderBy(sortField, sortOrder))

  const pageSize = filters?.limit ?? 100
  constraints.push(limit(pageSize))

  if (filters?.cursor) {
    constraints.push(startAfter(filters.cursor))
  }

  const q = query(collection(db, `users/${userId}/notebooks`), ...constraints)
  const snapshot = await getDocs(q)

  const items = snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...convertTimestamps(doc.data()),
      } as Notebook)
  )

  return {
    items,
    lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
    hasMore: snapshot.docs.length === pageSize,
  }
}

/**
 * Update a notebook
 */
export async function updateNotebook(
  userId: string,
  notebookId: string,
  updates: Partial<Notebook>
): Promise<void> {
  const notebookRef = doc(db, `users/${userId}/notebooks/${notebookId}`)
  const updateData: Record<string, any> = {
    ...updates,
    updatedAt: serverTimestamp(),
  }
  // Remove fields that should not be updated
  delete updateData.id
  delete updateData.userId
  delete updateData.createdAt
  delete updateData.ownerId

  await updateDoc(notebookRef, updateData)
}

/**
 * Delete a notebook and all its pages
 */
export async function deleteNotebook(userId: string, notebookId: string): Promise<void> {
  const batch = writeBatch(db)

  // Delete all pages in the notebook
  const pagesRef = collection(db, `users/${userId}/notebooks/${notebookId}/pages`)
  const pagesSnapshot = await getDocs(pagesRef)
  pagesSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })

  // Delete the notebook itself
  const notebookRef = doc(db, `users/${userId}/notebooks/${notebookId}`)
  batch.delete(notebookRef)

  // Delete denormalized search index entries for this notebook.
  const searchRef = collection(db, `users/${userId}/notebook_search`)
  const searchQuery = query(searchRef, where("notebookId", "==", notebookId))
  const searchSnapshot = await getDocs(searchQuery)
  searchSnapshot.docs.forEach((searchDoc) => {
    batch.delete(searchDoc.ref)
  })

  await batch.commit()
}

/**
 * Subscribe to real-time notebook updates
 */
export function subscribeToNotebook(
  userId: string,
  notebookId: string,
  onUpdate: (notebook: Notebook) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const notebookRef = doc(db, `users/${userId}/notebooks/${notebookId}`)
  return onSnapshot(
    notebookRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const notebook = {
          id: snapshot.id,
          ...convertTimestamps(snapshot.data()),
        } as Notebook
        onUpdate(notebook)
      }
    },
    onError
  )
}

/**
 * Subscribe to real-time notebook list updates
 */
export function subscribeToNotebooks(
  userId: string,
  onUpdate: (notebooks: Notebook[]) => void,
  onError?: (error: Error) => void,
  pageSize = 100,
): Unsubscribe {
  const q = query(
    collection(db, `users/${userId}/notebooks`),
    orderBy("updatedAt", "desc"),
    limit(pageSize),
  )
  return onSnapshot(
    q,
    (snapshot) => {
      const notebooks = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...convertTimestamps(doc.data()),
          } as Notebook)
      )
      onUpdate(notebooks)
    },
    onError
  )
}

// ============ PAGES SUBCOLLECTION ============

async function upsertNotebookSearchIndex(params: {
  userId: string
  notebookId: string
  pageId: string
  pageTitle: string
  content: string
}) {
  const { userId, notebookId, pageId, pageTitle, content } = params
  const searchDocRef = doc(db, `users/${userId}/notebook_search/${pageId}`)
  await setDoc(
    searchDocRef,
    {
      notebookId,
      pageId,
      pageTitle,
      content,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

async function deleteNotebookSearchIndex(userId: string, pageId: string) {
  const searchDocRef = doc(db, `users/${userId}/notebook_search/${pageId}`)
  await deleteDoc(searchDocRef)
}

/**
 * Create a new page in a notebook
 */
export async function createPage(
  userId: string,
  notebookId: string,
  pageData: Omit<NotebookPage, "id" | "notebookId" | "createdAt" | "updatedAt">
): Promise<NotebookPage> {
  const pageRef = doc(collection(db, `users/${userId}/notebooks/${notebookId}/pages`))
  const now = serverTimestamp()

  const pageDoc = {
    ...pageData,
    notebookId,
    createdAt: now,
    updatedAt: now,
  }

  await setDoc(pageRef, pageDoc)

  await upsertNotebookSearchIndex({
    userId,
    notebookId,
    pageId: pageRef.id,
    pageTitle: pageData.title,
    content: pageData.content,
  })

  // Increment page count in notebook
  await updateNotebook(userId, notebookId, {
    pageCount: increment(1) as any,
  })

  return {
    id: pageRef.id,
    ...pageDoc,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as NotebookPage
}

/**
 * Get a single page by ID
 */
export async function getPage(
  userId: string,
  notebookId: string,
  pageId: string
): Promise<NotebookPage | null> {
  const pageRef = doc(db, `users/${userId}/notebooks/${notebookId}/pages/${pageId}`)
  const snapshot = await getDoc(pageRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...convertTimestamps(snapshot.data()),
  } as NotebookPage
}

/**
 * List all pages in a notebook, ordered by page order
 */
export async function listPages(
  userId: string,
  notebookId: string
): Promise<NotebookPage[]> {
  const q = query(
    collection(db, `users/${userId}/notebooks/${notebookId}/pages`),
    orderBy("order", "asc")
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...convertTimestamps(doc.data()),
      } as NotebookPage)
  )
}

/**
 * Update a page
 */
export async function updatePage(
  userId: string,
  notebookId: string,
  pageId: string,
  updates: Partial<NotebookPage>
): Promise<void> {
  const pageRef = doc(db, `users/${userId}/notebooks/${notebookId}/pages/${pageId}`)
  const updateData: Record<string, any> = {
    ...updates,
    updatedAt: serverTimestamp(),
  }
  // Remove fields that should not be updated
  delete updateData.id
  delete updateData.notebookId
  delete updateData.createdAt

  await updateDoc(pageRef, updateData)

  if (typeof updates.title === "string" || typeof updates.content === "string") {
    const latestPage = await getPage(userId, notebookId, pageId)
    if (latestPage) {
      await upsertNotebookSearchIndex({
        userId,
        notebookId,
        pageId,
        pageTitle: latestPage.title,
        content: latestPage.content,
      })
    }
  }
}

/**
 * Delete a page from a notebook
 */
export async function deletePage(
  userId: string,
  notebookId: string,
  pageId: string
): Promise<void> {
  const pageRef = doc(db, `users/${userId}/notebooks/${notebookId}/pages/${pageId}`)
  await deleteDoc(pageRef)
  await deleteNotebookSearchIndex(userId, pageId)

  // Decrement page count in notebook
  await updateNotebook(userId, notebookId, {
    pageCount: increment(-1) as any,
  })
}

/**
 * Reorder pages by updating their order field
 */
export async function reorderPages(
  userId: string,
  notebookId: string,
  pageOrders: Array<{ pageId: string; order: number }>
): Promise<void> {
  const batch = writeBatch(db)

  pageOrders.forEach(({ pageId, order }) => {
    const pageRef = doc(db, `users/${userId}/notebooks/${notebookId}/pages/${pageId}`)
    batch.update(pageRef, {
      order,
      updatedAt: serverTimestamp(),
    })
  })

  await batch.commit()
}

/**
 * Subscribe to real-time page updates for a notebook
 */
export function subscribeToPages(
  userId: string,
  notebookId: string,
  onUpdate: (pages: NotebookPage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, `users/${userId}/notebooks/${notebookId}/pages`),
    orderBy("order", "asc")
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const pages = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...convertTimestamps(doc.data()),
          } as NotebookPage)
      )
      onUpdate(pages)
    },
    onError
  )
}

/**
 * Search for pages across all user notebooks (client-side, for Fuse.js)
 */
export async function searchPages(
  userId: string,
  searchQuery: string
): Promise<
  Array<{
    notebookId: string
    pageId: string
    notebookTitle: string
    pageTitle: string
    content: string
    score?: number
  }>
> {
  const notebooks = await listNotebooks(userId, { limit: 200 })
  const notebookTitleById = new Map(notebooks.map((notebook) => [notebook.id, notebook.title]))

  const searchIndexRef = collection(db, `users/${userId}/notebook_search`)
  const searchIndexQuery = query(searchIndexRef, orderBy("updatedAt", "desc"), limit(500))
  const searchIndexSnapshot = await getDocs(searchIndexQuery)

  const results: Array<{
    notebookId: string
    pageId: string
    notebookTitle: string
    pageTitle: string
    content: string
  }> = []

  const normalizedQuery = searchQuery.toLowerCase()

  searchIndexSnapshot.docs.forEach((indexDoc) => {
    const data = indexDoc.data() as {
      notebookId: string
      pageId: string
      pageTitle: string
      content: string
    }

    const notebookTitle = notebookTitleById.get(data.notebookId) || ""
    if (
      data.pageTitle.toLowerCase().includes(normalizedQuery) ||
      data.content.toLowerCase().includes(normalizedQuery) ||
      notebookTitle.toLowerCase().includes(normalizedQuery)
    ) {
      results.push({
        notebookId: data.notebookId,
        pageId: data.pageId,
        notebookTitle,
        pageTitle: data.pageTitle,
        content: data.content,
      })
    }
  })

  return results
}

/**
 * Get page count for a specific notebook
 */
export async function getPageCount(userId: string, notebookId: string): Promise<number> {
  const notebook = await getNotebook(userId, notebookId)
  return notebook?.pageCount || 0
}

/**
 * Batch create pages
 */
export async function batchCreatePages(
  userId: string,
  notebookId: string,
  pagesData: Array<Omit<NotebookPage, "id" | "notebookId" | "createdAt" | "updatedAt">>
): Promise<NotebookPage[]> {
  const batch = writeBatch(db)
  const now = serverTimestamp()
  const createdPages: NotebookPage[] = []

  pagesData.forEach((pageData) => {
    const pageRef = doc(collection(db, `users/${userId}/notebooks/${notebookId}/pages`))
    const pageDoc = {
      ...pageData,
      notebookId,
      createdAt: now,
      updatedAt: now,
    }
    batch.set(pageRef, pageDoc)

    const searchRef = doc(db, `users/${userId}/notebook_search/${pageRef.id}`)
    batch.set(searchRef, {
      notebookId,
      pageId: pageRef.id,
      pageTitle: pageData.title,
      content: pageData.content,
      updatedAt: now,
    })

    createdPages.push({
      id: pageRef.id,
      ...pageDoc,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as NotebookPage)
  })

  // Update notebook page count
  const notebookRef = doc(db, `users/${userId}/notebooks/${notebookId}`)
  batch.update(notebookRef, {
    pageCount: increment(pagesData.length),
    updatedAt: now,
  })

  await batch.commit()
  return createdPages
}
