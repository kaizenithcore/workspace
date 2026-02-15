import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export const runtime = "nodejs"

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

const FEEDBACK_TYPES = new Map([
  ["bug-report", "bug-report"],
  ["suggestion", "suggestion"],
  ["general-opinion", "general-opinion"],
  ["other", "other"],
])

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

function getTypeTag(type: string) {
  return FEEDBACK_TYPES.get(type) ?? "other"
}

async function sendFeedbackEmail(params: {
  to: string
  type: string
  message: string
  email?: string
  consent: boolean
  pageContext?: string
}) {
  const host = process.env.SMTP_HOST
  const portValue = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || params.to

  if (!host || !portValue || !user || !pass) {
    console.warn("[feedback] Missing SMTP env vars - skipping email")
    return false
  }

  const port = Number(portValue)
  const secure = port === 465

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })

  const subjectParts = ["Kaizenith Feedback", params.type]
  if (params.pageContext) {
    subjectParts.push(params.pageContext)
  }

  const lines = [
    `Type: ${params.type}`,
    `Message: ${params.message}`,
    `From: ${params.email || "anonymous"}`,
    `Consent: ${params.consent ? "yes" : "no"}`,
    params.pageContext ? `Context: ${params.pageContext}` : "",
  ].filter(Boolean)

  await transporter.sendMail({
    from,
    to: params.to,
    subject: subjectParts.join(" | "),
    text: lines.join("\n"),
  })

  return true
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

  const typeValue = typeof raw.type === "string" ? raw.type : ""
  if (!FEEDBACK_TYPES.has(typeValue)) {
    return NextResponse.json(
      { success: false, message: "Invalid feedback type" },
      { status: 400 },
    )
  }

  const messageValue = typeof raw.message === "string" ? raw.message : ""
  const message = sanitizeText(messageValue)
  if (!message || message.length > 500) {
    return NextResponse.json(
      { success: false, message: "Invalid message" },
      { status: 400 },
    )
  }

  const emailValue = typeof raw.email === "string" ? raw.email : ""
  const email = emailValue ? sanitizeText(emailValue).toLowerCase() : ""

  const consent = raw.consent === true
  if (email && !isValidEmail(email)) {
    return NextResponse.json(
      { success: false, message: "Invalid email" },
      { status: 400 },
    )
  }

  const pageContextValue =
    typeof raw.pageContext === "string" ? raw.pageContext : ""
  const pageContext = pageContextValue ? sanitizeText(pageContextValue) : ""

  console.log("[feedback] New submission", {
    type: typeValue,
    message,
    email: email || undefined,
    consent,
    pageContext: pageContext || undefined,
  })

  const to = process.env.FEEDBACK_EMAIL_TO || "hola@kaizenith.es"
  let emailSent = false

  try {
    emailSent = await sendFeedbackEmail({
      to,
      type: typeValue,
      message,
      email: email || undefined,
      consent,
      pageContext: pageContext || undefined,
    })
  } catch (error) {
    console.error("[feedback] Email send failed:", error)
  }

  if (email && consent) {
    const apiKey = process.env.MAILCHIMP_EARLY_ACCESS_API_KEY
    const listId = process.env.MAILCHIMP_EARLY_ACCESS_LIST_ID
    const dc = process.env.MAILCHIMP_EARLY_ACCESS_DC

    if (!apiKey || !listId || !dc) {
      console.warn("[feedback] Missing Mailchimp env vars - dev mode")
      return NextResponse.json({ success: true, mailchimp: false, emailSent })
    }

    const tags = ["early-access", "feedback-user", getTypeTag(typeValue)]
    if (pageContext) {
      tags.push(`context:${pageContext}`)
    }

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
            tags: Array.from(new Set(tags)),
          }),
        },
      )

      const responseText = await response.text()

      if (response.ok) {
        return NextResponse.json({ success: true, mailchimp: true, emailSent })
      }

      let errorPayload: any = null
      try {
        errorPayload = JSON.parse(responseText)
      } catch {
        // ignore
      }

      const errorTitle = typeof errorPayload?.title === "string" ? errorPayload.title : ""
      const errorDetail = typeof errorPayload?.detail === "string" ? errorPayload.detail : ""

      if (
        response.status === 400 &&
        (errorTitle.includes("Member Exists") || errorDetail.includes("already a list member"))
      ) {
        return NextResponse.json({
          success: true,
          mailchimp: true,
          alreadyRegistered: true,
          emailSent,
        })
      }

      console.error("[feedback] Mailchimp error:", response.status, errorPayload)
      return NextResponse.json(
        { success: false, message: "Mailchimp error" },
        { status: 502 },
      )
    } catch (error) {
      console.error("[feedback] Mailchimp request failed:", error)
      return NextResponse.json(
        { success: false, message: "Network error" },
        { status: 502 },
      )
    }
  }

  return NextResponse.json({ success: true, mailchimp: false, emailSent })
}
