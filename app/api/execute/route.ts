import { NextRequest, NextResponse } from 'next/server'
import { createDevinSession } from '@/lib/devin'
import { buildExecutePrompt } from '@/lib/prompts'
import { Signal, ScopeResult } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { signal, scopeResult }: { signal: Signal; scopeResult: ScopeResult } = await req.json()
    const prompt = buildExecutePrompt(signal, scopeResult)
    const session = await createDevinSession(prompt)
    return NextResponse.json({ sessionId: session.session_id, sessionUrl: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
