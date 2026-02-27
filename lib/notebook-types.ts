/**
 * Notebook data types and interfaces
 * Lightweight notebook system with pages and markdown support
 */

import type { Timestamp } from "firebase/firestore"

export interface Notebook {
  id: string
  userId: string
  title: string
  description?: string | null
  projectIds: string[]
  categoryIds: string[]
  tags?: string[]
  pageCount: number
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
  ownerId: string
}

export interface NotebookPage {
  id: string
  notebookId: string
  title: string
  content: string // markdown plain text
  order: number // integer for ordering
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
}

/**
 * Lightweight denormalized search index entry
 * Stored in userNotebookIndex for faster querying
 */
export interface NotebookSearchIndex {
  id: string
  userId: string
  notebookId: string
  pageId?: string
  textSnippet: string // trimmed content or first 200 chars
  fullText: string // full page content for client-side search
  title: string
  projectIds: string[]
  categoryIds: string[]
  updatedAt: Date | Timestamp
  type: "notebook" | "page"
}

/**
 * Link metadata for a page (references to tasks, sessions, goals created from it)
 */
export interface PageLink {
  type: "task" | "session" | "goal"
  id: string
  createdAt: Date
  excerpt: string // the text that was converted
}

/**
 * Page with extended metadata (used client-side)
 */
export interface NotebookPageWithMetadata extends NotebookPage {
  links?: PageLink[]
}

/**
 * Conversion request when creating a task/session/goal from selected text
 */
export interface ConversionRequest {
  type: "task" | "session" | "goal"
  selectedText: string
  fullPageContent: string
  notebookId: string
  pageId: string
  projectId?: string | null
  categoryId?: string | null
}

/**
 * Response after successful conversion
 */
export interface ConversionResult {
  type: "task" | "session" | "goal"
  id: string
  title: string
  linkedAt: Date
}

/**
 * Client-side autosave state
 */
export interface AutosaveState {
  isDirty: boolean
  isSaving: boolean
  lastSavedAt?: Date
  error?: string
}

/**
 * Markdown render options for notebook pages
 */
export interface MarkdownRenderOptions {
  enableToc?: boolean
  lineNumbers?: boolean
  hardBreaks?: boolean
}

/**
 * Notebook search result
 */
export interface NotebookSearchResult {
  notebookId: string
  notebookTitle: string
  pageId?: string
  pageTitle: string
  score: number
  highlightedSnippet: string
}

/**
 * Pagination params for notebook list
 */
export interface NotebookPaginationParams {
  pageSize: number
  cursor?: string // for offset/cursor pagination
  sortBy: "updatedAt" | "createdAt" | "title"
  sortOrder: "asc" | "desc"
  filterProjectId?: string
  filterCategoryId?: string
  searchQuery?: string
}
