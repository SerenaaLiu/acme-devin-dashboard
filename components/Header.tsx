export default function Header() {
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
        <div className="flex items-center gap-2">
          <span className="text-white/30 text-xs">Powered by</span>
          <span className="text-white/60 text-xs font-medium">Devin</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>
    </header>
  )
}
