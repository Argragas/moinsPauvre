import { Icon } from './Icon'

export function FamilyBadge({ small }: { small?: boolean }) {
  return (
    <span className="badge-fam">
      <Icon name="users" size={small ? 11 : 12} stroke={2.2} />Famille
    </span>
  )
}
