import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from './Icon'

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Accueil', icon: 'home' },
  { to: '/famille', label: 'Famille', icon: 'users' },
  { to: '/cashback', label: 'Cashback', icon: 'percent' },
  { to: '/archives', label: 'Archives', icon: 'archive' },
]

export function TabBar() {
  return (
    <div className="tabbar">
      {TABS.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.to === '/'}
          className={({ isActive }) => 'tab' + (isActive ? ' on' : '')}
        >
          {({ isActive }) => (
            <>
              <Icon name={t.icon} size={24} stroke={isActive ? 2.4 : 2} />
              <span>{t.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}
