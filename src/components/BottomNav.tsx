import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Accueil', icon: '🏪' },
  { to: '/famille', label: 'Famille', icon: '👨‍👩‍👧' },
  { to: '/cashback', label: 'Cashback', icon: '💰' },
  { to: '/archives', label: 'Archives', icon: '📦' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex">
      {links.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 text-xs transition-colors ${isActive ? 'text-violet-400' : 'text-slate-400'}`
          }
        >
          <span className="text-lg mb-0.5">{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
