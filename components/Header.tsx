'use client'

import { useState } from 'react'

interface HeaderProps {
  onScanComplete?: () => void
}

export default function Header({ onScanComplete }: HeaderProps) {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ issued: number; issues: { title: string; url: string; number: number }[] } | null>(null)

  const runScan = async () => {
    setScanning(true)
    setResult(null)
    try {
      const res = await fetch('/api/scan', { method: 'POST' })
      const data = await res.json()
      setResult(data)
      onScanComplete?.()
    } catch {
      // fail silently
    } finally {
      setScanning(false)
    }
  }

  return (
    <header className="border-b border-white/10 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" fill="white" fillOpacity="0.9"/>
              <circle cx="8" cy="8" r="6.5" stroke="white" strokeOpacity="0.3" strokeWidth="1"/>
            </svg>
          </div>
          <div>
            <span className="text-white font-medium text-sm tracking-tight">acme-platform</span>
            <span className="text-white/30 text-xs ml-2">Devin Autopilot</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {result && (
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-xs">{result.issued} issues filed</span>
              {result.issues.map(i => (
                <a
                  key={i.number}
                  href={i.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/30 hover:text-white/60 text-xs transition-colors"
                >
                  #{i.number}
                </a>
              ))}
            </div>
          )}

          <button
            onClick={runScan}
            disabled={scanning}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
              scanning
                ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                : 'bg-white/8 hover:bg-white/15 text-white/70 hover:text-white border-white/10 hover:border-white/20'
            }`}
          >
            {scanning ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                Scanning...
              </span>
            ) : 'Run Devin scan'}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-white/30 text-xs">Powered by</span>
            <span className="text-white/60 text-xs font-medium">Devin</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>
    </header>
  )
}
