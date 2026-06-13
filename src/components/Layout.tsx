import { type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { TabBar } from './TabBar'

const TAB_ROUTES = ['/', '/famille', '/cashback', '/archives']

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <>
      {children}
      {TAB_ROUTES.includes(pathname) && <TabBar />}
    </>
  )
}
