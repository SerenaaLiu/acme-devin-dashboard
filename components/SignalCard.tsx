'use client'

import { Signal } from '@/lib/types'

interface SignalCardProps {
  signal: Signal
  onScope: (signal: Signal) => void
  onExecute: (signal: Signal) => void
}

const SOURCE_CONFIG = {
  'github-issue': { label: 'GitHub issue', color: 'bg-violet-500/15 text-violet-300 border-violet-500/20' },
  'tech-debt': { label: 'Tech debt', color: 'bg-amber-500/15 text-amber-300 border-amber-500/20' },
  'doc-drift': { label: 'Doc drift', color: 'bg-sky-500/15 text-sky-300 border-sky-500/20' },
}

const CONFIDENCE_CONFIG = {
  high: { label: 'High confidence', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  medium: { label: 'Medium confidence', color: 'text-amber-400', dot: 'bg-amber-400' },
  low: { label: 'Low confidence', color: 'text-red-400', dot: 'bg-red-400' },
}

const STATUS_CONFIG = {
  unscoped: { label: 'Unscoped', color: 'text-white/30' },
  scoping: { label: 'Devin scoping...', color: 'text-amber-400' },
  scoped: { label: 'Scoped', color: 'text-white/60' },
  executing: { label: 'Devin executing...', color: 'text-amber-400' },
  done: { label: 'Resolved', color: 'text-emerald-400' },
  error: { label: 'Error', color: 'text-red-400' },
}

export default function SignalCard({ signal, onScope, onExecute }: SignalCardProps) {
  const source = SOURCE_CONFIG[signal.source]
  const status = STATUS_CONFIG[signal.status]
  const isWorking = signal.status === 'scoping' || signal.status === 'executing'
  const isDone = signal.status === 'done'

  return (
    <div className={`rounded-xl border transition-all duration-300 ${
      isDone
        ? 'bg-white/3 border-white/5 opacity-60'
        : isWorking
        ? 'bg-white/7 border-white/15'
        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/7'
    }`}>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${source.color}`}>
                {source.label}
              </span>
              {signal.issueNumber && (
                <span className="text-white/30 text-xs">#{signal.issueNumber}</span>
              )}
              {signal.labels?.filter(l => l !== 'bug' && l !== 'tech-debt' && l !== 'docs').map(label => (
                <span key={label} className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/30 border border-white/5">
                  {label}
                </span>
              ))}
            </div>

            <h3 className={`text-sm font-medium leading-snug ${isDone ? 'line-through text-white/40' : 'text-white'}`}>
              {signal.title}
            </h3>

            <p className="text-white/40 text-xs mt-1.5 leading-relaxed line-clamp-2">
              {signal.description}
            </p>

            {signal.file && (
              <div className="mt-2 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-white/20">
                  <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1"/>
                  <path d="M3 4h6M3 6h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                </svg>
                <code className="text-white/30 text-xs font-mono">{signal.file}</code>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className={`text-xs flex items-center gap-1.5 ${status.color}`}>
              {isWorking && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
              {isDone && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="#34d399" strokeWidth="1"/>
                  <path d="M3.5 6l2 2 3-3" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {status.label}
            </div>

            {signal.sessionUrl && (
              <a
                href={signal.sessionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/30 hover:text-white/60 text-xs transition-colors"
              >
                View session →
              </a>
            )}
          </div>
        </div>

        {signal.scopeResult && (
          <div className="mt-4 pt-4 border-t border-white/8">
            <div className="flex items-center gap-2 mb-3">
              {(() => {
                const conf = CONFIDENCE_CONFIG[signal.scopeResult.confidence]
                return (
                  <>
                    <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                    <span className={`text-xs font-medium ${conf.color}`}>{conf.label}</span>
                    <span className="text-white/20 text-xs">·</span>
                    <span className="text-white/30 text-xs">{signal.scopeResult.reasoning}</span>
                  </>
                )
              })()}
            </div>

            <div className="space-y-1.5 mb-3">
              {signal.scopeResult.plan.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-white/20 text-xs mt-0.5 w-3 shrink-0">{i + 1}.</span>
                  <span className="text-white/50 text-xs leading-relaxed">{step}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {signal.scopeResult.files_to_change.map(f => (
                <code key={f} className="text-white/30 text-xs bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">
                  {f}
                </code>
              ))}
            </div>
          </div>
        )}

        {signal.prUrl && (
          <div className="mt-3 pt-3 border-t border-white/8">
            <a
              href={signal.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 text-xs transition-colors flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="3" cy="3" r="1.5" stroke="currentColor" strokeWidth="1"/>
                <circle cx="9" cy="9" r="1.5" stroke="currentColor" strokeWidth="1"/>
                <circle cx="9" cy="3" r="1.5" stroke="currentColor" strokeWidth="1"/>
                <path d="M3 4.5V7a1.5 1.5 0 001.5 1.5H7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                <path d="M9 4.5v3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              View pull request →
            </a>
          </div>
        )}
      </div>

      {!isDone && (
        <div className="px-5 pb-4 flex items-center gap-2">
          {signal.status === 'unscoped' && (
            <button
              onClick={() => onScope(signal)}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-all font-medium"
            >
              Scope with Devin
            </button>
          )}

          {signal.status === 'scoped' && (
            <>
              <button
                onClick={() => onExecute(signal)}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 transition-all font-medium"
              >
                Execute fix
              </button>
              <button
                onClick={() => onScope(signal)}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/60 border border-white/8 transition-all"
              >
                Re-scope
              </button>
            </>
          )}

          {isWorking && (
            <div className="flex items-center gap-2 text-white/30 text-xs">
              <div className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full bg-amber-400/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              Devin is working...
            </div>
          )}

          {signal.status === 'error' && (
            <button
              onClick={() => onScope(signal)}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 transition-all"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  )
}
