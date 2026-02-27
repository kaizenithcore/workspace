/**
 * Notebook utility functions
 * Markdown rendering, text conversion, and helper utilities
 */

import type { NotebookSearchResult } from "@/lib/notebook-types"

/**
 * Truncate text and add ellipsis
 */
export function truncateText(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + "..."
}

/**
 * Extract plain text from markdown content (removes markdown syntax)
 */
export function extractPlainText(markdown: string): string {
  return markdown
    .replace(/#+\s/g, "") // Remove headings
    .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.+?)\*/g, "$1") // Remove italic
    .replace(/`(.+?)`/g, "$1") // Remove inline code
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Generate a snippet from markdown content
 */
export function generateSnippet(content: string, maxLength: number = 200): string {
  const plainText = extractPlainText(content)
  return truncateText(plainText, maxLength)
}

/**
 * Create URL-safe slug from notebook/page title
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Parse markdown headings from content
 */
export function extractHeadings(
  content: string
): Array<{ level: number; text: string; id: string }> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const headings: Array<{ level: number; text: string; id: string }> = []

  let match
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    headings.push({
      level,
      text,
      id: slugify(text),
    })
  }

  return headings
}

/**
 * Check if markdown has basic formatting
 */
export function hasMarkdownFormatting(text: string): boolean {
  const markdownPatterns = [
    /#{1,6}\s/, // headings
    /\*\*.*?\*\*/, // bold
    /\*.*?\*/, // italic
    /`.*?`/, // inline code
    /\[.*?\]\(.*?\)/, // links
    /^[\s]*[-*]\s/, // lists
    /^[\s]*\d+\.\s/, // numbered lists
    /```[\s\S]*?```/, // code blocks
  ]

  return markdownPatterns.some((pattern) => pattern.test(text))
}

/**
 * Validate notebook title (non-empty, max length)
 */
export function validateNotebookTitle(title: string, maxLength: number = 200): {
  valid: boolean
  error?: string
} {
  const trimmed = title.trim()
  if (!trimmed) {
    return { valid: false, error: "Title cannot be empty" }
  }
  if (trimmed.length > maxLength) {
    return { valid: false, error: `Title must be ${maxLength} characters or less` }
  }
  return { valid: true }
}

/**
 * Validate page title (non-empty, max length)
 */
export function validatePageTitle(title: string, maxLength: number = 200): {
  valid: boolean
  error?: string
} {
  return validateNotebookTitle(title, maxLength)
}

/**
 * Convert selected text to task title
 */
export function selectedTextToTaskTitle(selectedText: string, maxLength: number = 100): string {
  return truncateText(selectedText.trim(), maxLength).replace(/\n/g, " ")
}

/**
 * Highlight search results in snippet
 */
export function highlightSearchTerms(
  text: string,
  searchTerms: string[],
  maxLength: number = 200
): string {
  let result = generateSnippet(text, maxLength)

  // Simple highlighting: wrap terms in markers
  searchTerms.forEach((term) => {
    const regex = new RegExp(`\\b${term}\\b`, "gi")
    result = result.replace(regex, `**${term}**`)
  })

  return result
}

/**
 * Parse search query and extract terms
 */
export function parseSearchQuery(query: string): {
  terms: string[]
  projectFilter?: string
  categoryFilter?: string
} {
  const terms: string[] = []
  let projectFilter: string | undefined
  let categoryFilter: string | undefined

  // Look for special filters: project:projectName category:categoryName
  const projectMatch = query.match(/project:(\S+)/)
  const categoryMatch = query.match(/category:(\S+)/)

  if (projectMatch) {
    projectFilter = projectMatch[1]
  }
  if (categoryMatch) {
    categoryFilter = categoryMatch[1]
  }

  // Extract search terms (everything that's not a filter)
  const cleanQuery = query
    .replace(/project:\S+/g, "")
    .replace(/category:\S+/g, "")
    .trim()

  if (cleanQuery) {
    terms.push(
      ...cleanQuery
        .split(/\s+/)
        .filter((t) => t.length > 0)
        .map((t) => t.toLowerCase())
    )
  }

  return { terms, projectFilter, categoryFilter }
}

/**
 * Calculate reading time in minutes (200 words per minute)
 */
export function calculateReadingTime(markdownContent: string): number {
  const plainText = extractPlainText(markdownContent)
  const wordCount = plainText.split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

/**
 * Format relative date (e.g., "2 hours ago")
 */
export function formatRelativeDate(date: Date | null | undefined): string {
  if (!date) return "Never"

  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return new Date(date).toLocaleDateString()
}

/**
 * Check if two notebook page arrays are different
 */
export function pagesAreEqual(
  pages1: Array<{ id: string; order: number }>,
  pages2: Array<{ id: string; order: number }>
): boolean {
  if (pages1.length !== pages2.length) return false
  return pages1.every((p, i) => p.id === pages2[i].id && p.order === pages2[i].order)
}

/**
 * Generate unique notebook ID (client-side, for optimistic updates)
 */
export function generateNotebookId(): string {
  return `notebook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate unique page ID (client-side, for optimistic updates)
 */
export function generatePageId(): string {
  return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create a new blank notebook object
 */
export function createBlankNotebook(userId: string): Omit<any, "id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    title: "New Notebook",
    description: null,
    projectIds: [],
    categoryIds: [],
    tags: [],
    pageCount: 0,
    ownerId: userId,
  }
}

/**
 * Create a new blank page object
 */
export function createBlankPage(notebookId: string, order: number = 0): Omit<any, "id" | "createdAt" | "updatedAt"> {
  return {
    notebookId,
    title: "New Page",
    content: "",
    order,
  }
}

/**
 * Check if a string looks like a valid markdown heading
 */
export function looksLikeHeading(text: string): boolean {
  return /^#+\s/.test(text)
}

/**
 * Count markdown syntax elements in content
 */
export function countMarkdownElements(content: string): {
  headings: number
  lists: number
  codeBlocks: number
  links: number
} {
  const headings = (content.match(/^#+\s/gm) || []).length
  const lists = (content.match(/^[\s]*[-*]\s/gm) || []).length
  const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length
  const links = (content.match(/\[.*?\]\(.*?\)/g) || []).length

  return { headings, lists, codeBlocks, links }
}
