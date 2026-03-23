import { NextRequest, NextResponse } from 'next/server'
import { createDevinSession } from '@/lib/devin'
import { buildScopePrompt } from '@/lib/prompts'
import { Signal } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const signal: Signal = await req.json()
    const prompt = buildScopePrompt(signal)
    const session = await createDevinSession(prompt)
    return NextResponse.json({ sessionId: session.session_id, sessionUrl: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
