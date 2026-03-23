import { NextResponse } from 'next/server'
import { getOpenIssues } from '@/lib/github'

export async function GET() {
  try {
    const issues = await getOpenIssues()
    return NextResponse.json(issues)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
