import { type ReactNode } from 'react'
import { BottomNav } from './BottomNav'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
