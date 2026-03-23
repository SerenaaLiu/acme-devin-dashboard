'use client'

import { useState, useEffect, useCallback } from 'react'
import { Signal, SignalStatus, TECH_DEBT_SIGNALS, DOC_DRIFT_SIGNALS } from '@/lib/types'
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

  const pollSession = useCallback((signalId: string, sessionId: string) => {
    let attempts = 0
    const maxAttempts = 30 // 5 minutes

    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/session/${sessionId}`)
        if (res.ok) {
          const session = await res.json()
          if (session.status === 'exit' || session.status === 'error') {
            clearInterval(interval)
            updateSignal(signalId, { status: 'done' })
            return
          }
        }
      } catch { }

      if (attempts >= maxAttempts) {
        clearInterval(interval)
        updateSignal(signalId, { status: 'done' })
      }
    }, 10000)
  }, [updateSignal])

  const handleFix = useCallback(async (signal: Signal) => {
    updateSignal(signal.id, { status: 'executing' })
    try {
      const res = await fetch('/api/scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signal),
      })
      const { sessionId, sessionUrl } = await res.json()
      updateSignal(signal.id, { sessionId, sessionUrl })
      pollSession(signal.id, sessionId)
    } catch {
      setTimeout(() => {
        updateSignal(signal.id, { status: 'done' })
      }, 30000)
    }
  }, [updateSignal, pollSession])

  const filtered = activeTab === 'all' ? signals : signals.filter(s => s.source === activeTab)

  const counts = {
    total: signals.length,
    done: signals.filter(s => s.status === 'done').length,
    inProgress: signals.filter(s => s.status === 'executing').length,
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
                onFix={handleFix}
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
