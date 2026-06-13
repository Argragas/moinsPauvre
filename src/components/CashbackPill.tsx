import { Icon } from './Icon'

export function CashbackPill({ pct }: { pct: number | null }) {
  if (pct == null) return null
  return (
    <span className="pill pill-money">
      <Icon name="arrowup" size={12} stroke={2.6} />{pct}%
    </span>
  )
}
