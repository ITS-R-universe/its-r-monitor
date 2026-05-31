import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title: 'ITS-R Monitor — Uptime & Status', description: 'Real-time uptime monitoring for all ITS-R Universe services' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
