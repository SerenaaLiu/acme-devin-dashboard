import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Acme Platform — Devin Autopilot',
  description: 'Continuous codebase health powered by Devin',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
