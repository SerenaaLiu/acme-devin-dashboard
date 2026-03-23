'use client'

import { Signal } from '@/lib/types'

interface SignalCardProps {
  signal: Signal
  onFix: (signal: Signal) => void
}

const SOURCE_CONFIG = {
  'github-issue': { label: 'GitHub issue', color: 'bg-violet-500/15 text-violet-300 border-violet-500/20' },
  'tech-debt': { label: 'Tech debt', color: 'bg-amber-500/15 text-amber-300 border-amber-500/20' },
  'doc-drift': { label: 'Doc drift', color: 'bg-sky-500/15 text-sky-300 border-sky-500/20' },
}

export default function SignalCard({ signal, onFix }: SignalCardProps) {
  const source = SOURCE_CONFIG[signal.source]
  const isWorking = signal.status === 'executing'
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
              {signal.labels?.filter(l => !['bug','tech-debt','docs'].includes(l)).map(label => (
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
            {isWorking && (
              <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Devin working...
              </div>
            )}
            {isDone && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="#34d399" strokeWidth="1"/>
                  <path d="M3.5 6l2 2 3-3" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                PR opened
              </div>
            )}
            {!isWorking && !isDone && (
              <span className="text-white/30 text-xs">Unresolved</span>
            )}
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
      </div>

      {!isDone && (
        <div className="px-5 pb-4">
          {signal.status === 'unscoped' && (
            <button
              onClick={() => onFix(signal)}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-all font-medium"
            >
              Fix with Devin
            </button>
          )}

          {isWorking && (
            <div className="flex items-center gap-2 text-white/30 text-xs">
              <div className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full bg-amber-400/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              Analyzing, implementing, opening PR...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
