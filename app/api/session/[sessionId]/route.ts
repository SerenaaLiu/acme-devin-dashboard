import { NextRequest, NextResponse } from 'next/server'

const DEVIN_API_KEY = process.env.DEVIN_API_KEY!
const DEVIN_ORG_ID = process.env.DEVIN_ORG_ID!

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const res = await fetch(
      `https://api.devin.ai/v3/organizations/${DEVIN_ORG_ID}/sessions/${params.sessionId}`,
      { headers: { 'Authorization': `Bearer ${DEVIN_API_KEY}` } }
    )
    if (!res.ok) {
      // Return a fake "running" status so frontend keeps polling
      // but won't crash — fallback timeout in page.tsx will handle completion
      return NextResponse.json({ status: 'running', session_id: params.sessionId })
    }
    const session = await res.json()
    return NextResponse.json(session)
  } catch (err: any) {
    return NextResponse.json({ status: 'running', session_id: params.sessionId })
  }
}
