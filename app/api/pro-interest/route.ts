import { NextResponse } from "next/server"

export const runtime = "nodejs"

interface ProInterestData {
  email: string
  name?: string
  context?: {
    location?: string
    variant?: string
  }
}

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 8
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  return "unknown"
}

function isRateLimited(ip: string) {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true
  }

  entry.count += 1
  rateLimitStore.set(ip, entry)
  return false
}

function sanitizeText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, message: "Rate limit exceeded" },
      { status: 429 },
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON" },
      { status: 400 },
    )
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { success: false, message: "Invalid payload" },
      { status: 400 },
    )
  }

  const raw = payload as Record<string, unknown>

  if ("newsletter" in raw || "tags" in raw) {
    return NextResponse.json(
      { success: false, message: "Invalid payload" },
      { status: 400 },
    )
  }

  const emailValue = typeof raw.email === "string" ? raw.email : ""
  const email = sanitizeText(emailValue).toLowerCase()
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { success: false, message: "Invalid email" },
      { status: 400 },
    )
  }

  const nameValue = typeof raw.name === "string" ? raw.name : ""
  const name = nameValue ? sanitizeText(nameValue) : undefined

  const contextRaw = raw.context
  const context =
    contextRaw && typeof contextRaw === "object"
      ? (contextRaw as ProInterestData["context"])
      : undefined

  const location =
    typeof context?.location === "string" ? sanitizeText(context.location) : undefined
  const variant =
    typeof context?.variant === "string" ? sanitizeText(context.variant) : undefined

  const apiKey = process.env.MAILCHIMP_PRO_API_KEY
  const listId = process.env.MAILCHIMP_PRO_LIST_ID
  const dc = process.env.MAILCHIMP_PRO_DC

  if (!apiKey || !listId || !dc) {
    console.warn("[pro-interest] Missing Mailchimp env vars - dev mode")
    return NextResponse.json({ success: true, message: "dev mode" })
  }

  const tags = ["kaizenith", "pro-interest"]
  if (location) {
    tags.push(`context:${location}`)
  }
  if (variant) {
    tags.push(`variant:${variant}`)
  }

  console.log("[pro-interest] Sending to Mailchimp:", { email, tags, dc, listId: listId.substring(0, 8) + "..." })

  try {
    const response = await fetch(
      `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
        },
        body: JSON.stringify({
          email_address: email,
          status: "subscribed",
          merge_fields: name ? { FNAME: name } : {},
          tags: Array.from(new Set(tags)),
        }),
      },
    )

    const responseText = await response.text()
    console.log("[pro-interest] Mailchimp response:", response.status, responseText.substring(0, 200))

    if (response.ok) {
      console.log("[pro-interest] Successfully added to Mailchimp")
      return NextResponse.json({ success: true })
    }

    let errorPayload: any = null
    try {
      errorPayload = JSON.parse(responseText)
    } catch {
      // Not JSON
    }

    const errorTitle = typeof errorPayload?.title === "string" ? errorPayload.title : ""
    const errorDetail = typeof errorPayload?.detail === "string" ? errorPayload.detail : ""

    if (
      response.status === 400 &&
      (errorTitle.includes("Member Exists") || errorDetail.includes("already a list member"))
    ) {
      console.log("[pro-interest] User already exists in Mailchimp")
      return NextResponse.json({ success: true, alreadyRegistered: true, message: "Already registered" })
    }

    console.error("[pro-interest] Mailchimp error:", response.status, errorPayload)
    return NextResponse.json(
      { success: false, message: `Mailchimp error: ${errorTitle || errorDetail || response.statusText}` },
      { status: 502 },
    )
  } catch (err) {
    console.error("[pro-interest] Request failed:", err)
    return NextResponse.json(
      { success: false, message: "Network error" },
      { status: 502 },
    )
  }
}
