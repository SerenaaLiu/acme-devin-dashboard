interface StatsProps {
  counts: {
    total: number
    done: number
    inProgress: number
    unscoped: number
  }
}

export default function Stats({ counts }: StatsProps) {
  const pct = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0

  return (
    <div className="mb-8">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="text-white text-xl font-medium tracking-tight">Codebase health</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {counts.unscoped} signals awaiting Devin · {counts.inProgress} in progress · {counts.done} resolved
          </p>
        </div>
        <span className="text-white/60 text-sm font-medium">{pct}% resolved</span>
      </div>

      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-400 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { label: 'Open signals', value: counts.total, color: 'text-white' },
          { label: 'In progress', value: counts.inProgress, color: 'text-amber-400' },
          { label: 'Resolved', value: counts.done, color: 'text-emerald-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 rounded-lg px-4 py-3 border border-white/5">
            <div className={`text-2xl font-medium ${stat.color}`}>{stat.value}</div>
            <div className="text-white/40 text-xs mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
