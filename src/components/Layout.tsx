import { type ReactNode } from 'react'

export function Layout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-slate-900">{children}</div>
}
