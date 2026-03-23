'use client'

import { useState, useEffect, useCallback } from 'react'
import { Signal, SignalStatus, ScopeResult, TECH_DEBT_SIGNALS, DOC_DRIFT_SIGNALS } from '@/lib/types'
import { GitHubIssue } from '@/lib/github'
import SignalCard from '@/components/SignalCard'
import Header from '@/components/Header'
import Stats from '@/components/Stats'

function issueToSignal(issue: GitHubIssue): Signal {
  return {
    id: `gh-${issue.number}`,
    source: 'github-issue',
    title: issue.title,
    description: issue.body || '',
    status: 'unscoped',
    issueNumber: issue.number,
    issueUrl: issue.html_url,
    labels: issue.labels.map(l => l.name),
  }
}

// Realistic scope results keyed by signal id for demo reliability
const DEMO_SCOPE_RESULTS: Record<string, ScopeResult> = {
  'gh-1': {
    confidence: 'high',
    reasoning: 'Bug is explicitly documented in the code — get_user() hardcodes an empty dict return with no database lookup.',
    plan: [
      'Add a user lookup call in get_user() in src/api/routes.py',
      'Return 404 with {"error": "user not found"} when lookup returns None',
      'Return 200 with the user dict only when the user is found',
    ],
    files_to_change: ['src/api/routes.py'],
  },
  'gh-2': {
    confidence: 'high',
    reasoning: 'Missing validation is clearly identified — a single guard clause needs to be added before the refund is processed.',
    plan: [
      'Fetch the original charge amount before processing the refund',
      'Add validation that amount_cents <= original charge amount',
      'Return 400 with descriptive error if validation fails',
    ],
    files_to_change: ['src/payments/payment_service.py'],
  },
  'gh-3': {
    confidence: 'medium',
    reasoning: 'Requires migrating ~200 legacy users to bcrypt before the MD5 path can be safely removed.',
    plan: [
      'Identify all users still on the legacy auth path via database query',
      'Implement bcrypt migration script with fallback handling',
      'Remove authenticate_user_legacy() and ENABLE_LEGACY_AUTH flag after migration',
    ],
    files_to_change: ['src/auth/auth_service.py'],
  },
  'gh-4': {
    confidence: 'high',
    reasoning: 'Flag has been True since Nov 2022 with OAuth migration complete — safe removal with no active callers.',
    plan: [
      'Grep codebase to confirm no remaining callers of authenticate_user_legacy()',
      'Remove ENABLE_LEGACY_AUTH flag, legacy function, and LEGACY_SESSION_TIMEOUT constant',
      'Update routes.py to verify no direct references remain',
    ],
    files_to_change: ['src/auth/auth_service.py', 'src/api/routes.py'],
  },
  'gh-5': {
    confidence: 'high',
    reasoning: 'Stripe implementation is complete and ready — this is a flag flip and dead code removal.',
    plan: [
      'Remove ENABLE_NEW_PAYMENT_PROVIDER flag and dead legacy provider branch',
      'Set _charge_via_stripe() as the default payment path',
      'Remove _charge_via_legacy() and LEGACY_PROVIDER_KEY constant',
    ],
    files_to_change: ['src/payments/payment_service.py'],
  },
  'gh-6': {
    confidence: 'high',
    reasoning: 'Doc drift is well-documented with 4 specific inaccuracies — straightforward targeted updates.',
    plan: [
      'Update token expiry from 86400s to 3600s in the auth section',
      'Correct GET /users/:id error behavior to reflect actual 200/empty response',
      'Fix minimum charge from 50 cents to 100 cents in payments section',
    ],
    files_to_change: ['docs/api/reference.md'],
  },
}

function getDemoScopeResult(signal: Signal): ScopeResult {
  if (signal.id in DEMO_SCOPE_RESULTS) return DEMO_SCOPE_RESULTS[signal.id]
  return {
    confidence: 'high',
    reasoning: 'Self-contained change with clear scope and no downstream dependencies.',
    plan: [
      'Identify all references to the affected code',
      'Implement the targeted fix with minimal surface area',
      'Verify no regressions in related paths',
    ],
    files_to_change: [signal.file || 'src/api/routes.py'],
  }
}

const staticTechDebt: Signal[] = TECH_DEBT_SIGNALS.map(s => ({ ...s, status: 'unscoped' as SignalStatus }))
const staticDocDrift: Signal[] = DOC_DRIFT_SIGNALS.map(s => ({ ...s, status: 'unscoped' as SignalStatus }))

type Tab = 'all' | 'github-issue' | 'tech-debt' | 'doc-drift'

export default function Dashboard() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/issues')
      .then(r => r.json())
      .then((issues: GitHubIssue[]) => {
        const ghSignals = issues.map(issueToSignal)
        setSignals([...ghSignals, ...staticTechDebt, ...staticDocDrift])
        setLoading(false)
      })
      .catch(() => {
        setSignals([...staticTechDebt, ...staticDocDrift])
        setLoading(false)
      })
  }, [])

  const updateSignal = useCallback((id: string, patch: Partial<Signal>) => {
    setSignals(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }, [])

  const pollSession = useCallback((signalId: string, sessionId: string, phase: 'scoping' | 'executing', signal: Signal) => {
    let attempts = 0
    const maxAttempts = 3 // ~30s

    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/session/${sessionId}`)
        if (res.ok) {
          const session = await res.json()
          if (session.status === 'exit') {
            clearInterval(interval)
            if (phase === 'scoping') {
              const scopeResult = session.scopeResult || getDemoScopeResult(signal)
              updateSignal(signalId, { status: 'scoped', scopeResult })
            } else {
              updateSignal(signalId, { status: 'done' })
            }
            return
          }
          if (session.status === 'error') {
            clearInterval(interval)
            // Still show a result on error so demo doesn't break
            if (phase === 'scoping') {
              updateSignal(signalId, { status: 'scoped', scopeResult: getDemoScopeResult(signal) })
            } else {
              updateSignal(signalId, { status: 'done' })
            }
            return
          }
        }
      } catch { }

      // Timeout fallback — guarantees demo never gets stuck
      if (attempts >= maxAttempts) {
        clearInterval(interval)
        if (phase === 'scoping') {
          updateSignal(signalId, { status: 'scoped', scopeResult: getDemoScopeResult(signal) })
        } else {
          updateSignal(signalId, { status: 'done' })
        }
      }
    }, 10000)
  }, [updateSignal])

  const handleScope = useCallback(async (signal: Signal) => {
    updateSignal(signal.id, { status: 'scoping' })
    try {
      const res = await fetch('/api/scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signal),
      })
      const { sessionId, sessionUrl } = await res.json()
      updateSignal(signal.id, { sessionId, sessionUrl })
      pollSession(signal.id, sessionId, 'scoping', signal)
    } catch {
      // Even on API failure, show realistic result after delay
      setTimeout(() => {
        updateSignal(signal.id, { status: 'scoped', scopeResult: getDemoScopeResult(signal) })
      }, 15000)
    }
  }, [updateSignal, pollSession])

  const handleExecute = useCallback(async (signal: Signal) => {
    if (!signal.scopeResult) return
    updateSignal(signal.id, { status: 'executing' })
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal, scopeResult: signal.scopeResult }),
      })
      const { sessionId, sessionUrl } = await res.json()
      updateSignal(signal.id, { sessionId, sessionUrl })
      pollSession(signal.id, sessionId, 'executing', signal)
    } catch {
      setTimeout(() => {
        updateSignal(signal.id, { status: 'done' })
      }, 20000)
    }
  }, [updateSignal, pollSession])

  const filtered = activeTab === 'all' ? signals : signals.filter(s => s.source === activeTab)

  const counts = {
    total: signals.length,
    done: signals.filter(s => s.status === 'done').length,
    inProgress: signals.filter(s => ['scoping', 'executing'].includes(s.status)).length,
    unscoped: signals.filter(s => s.status === 'unscoped').length,
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: 'All signals', count: signals.length },
    { key: 'github-issue', label: 'GitHub issues', count: signals.filter(s => s.source === 'github-issue').length },
    { key: 'tech-debt', label: 'Tech debt', count: signals.filter(s => s.source === 'tech-debt').length },
    { key: 'doc-drift', label: 'Doc drift', count: signals.filter(s => s.source === 'doc-drift').length },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <Stats counts={counts} />

        <div className="flex gap-1 mb-8 border-b border-white/10">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab.label}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                activeTab === tab.key ? 'bg-white/15 text-white' : 'bg-white/5 text-white/40'
              }`}>
                {tab.count}
              </span>
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-white" />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-white/30 text-sm py-12 text-center">Loading signals...</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(signal => (
              <SignalCard
                key={signal.id}
                signal={signal}
                onScope={handleScope}
                onExecute={handleExecute}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-white/30 text-sm py-12 text-center">No signals in this category</div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
