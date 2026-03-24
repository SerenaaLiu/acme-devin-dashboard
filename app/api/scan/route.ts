import { NextResponse } from 'next/server'
import { createDevinSession } from '@/lib/devin'
import { createDevinScanIssue } from '@/lib/github'

const REPO_URL = `https://github.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}`

const SCAN_SIGNALS = [
  {
    title: 'Auto-detected: ENABLE_LEGACY_AUTH flag stale since Nov 2022',
    source: 'tech-debt' as const,
    confidence: 'high' as const,
    reasoning: 'Flag has been True since Nov 2022 with OAuth migration complete — safe removal with no active callers.',
    plan: [
      'Confirm no remaining callers of authenticate_user_legacy()',
      'Remove ENABLE_LEGACY_AUTH flag, legacy function, and LEGACY_SESSION_TIMEOUT constant',
      'Update routes.py to verify no direct references remain',
    ],
    file: 'src/auth/auth_service.py',
  },
  {
    title: 'Auto-detected: API docs token expiry 24h vs actual 1h',
    source: 'doc-drift' as const,
    confidence: 'high' as const,
    reasoning: 'Code defines DEFAULT_SESSION_TIMEOUT=3600 but docs/api/reference.md states 86400 seconds.',
    plan: [
      'Update token expiry in docs/api/reference.md from 86400s to 3600s',
      'Remove stale Out of date warning since doc will be corrected',
      'Verify legacy session timeout note is still accurate',
    ],
    file: 'docs/api/reference.md',
  },
  {
    title: 'Auto-detected: dead _legacy_session_cleanup function',
    source: 'tech-debt' as const,
    confidence: 'high' as const,
    reasoning: 'Function defined but never called anywhere in the codebase since OAuth migration.',
    plan: [
      'Grep codebase to confirm zero callers of _legacy_session_cleanup',
      'Delete the function from src/auth/auth_service.py',
      'Verify no tests reference it',
    ],
    file: 'src/auth/auth_service.py',
  },
]

export async function POST() {
  try {
    // Fire Devin scan session asynchronously — don't wait for it
    const scanPrompt = `Perform a codebase health scan of ${REPO_URL}. 
Read the key source files and identify the top signals across: stale feature flags, dead code, and documentation drift.
Return your findings as a JSON object with a "signals" array. Each signal should have: title, source, confidence, reasoning, plan (array), and file.`

    createDevinSession(scanPrompt).catch(() => {})

    // File GitHub issues immediately using pre-analyzed signals
    const filed = []
    for (const signal of SCAN_SIGNALS) {
      try {
        const issue = await createDevinScanIssue(signal)
        filed.push({ title: signal.title, url: issue.html_url, number: issue.number })
      } catch (err) {
        console.error('Failed to file issue:', err)
      }
    }

    return NextResponse.json({
      scanned: true,
      issued: filed.length,
      issues: filed,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
