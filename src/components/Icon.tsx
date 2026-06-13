export type IconName =
  | 'search' | 'plus' | 'close' | 'back' | 'chev' | 'home' | 'users' | 'percent'
  | 'archive' | 'gift' | 'tag' | 'share' | 'copy' | 'check' | 'sun' | 'dots'
  | 'restore' | 'wallet' | 'spark' | 'arrowup' | 'apple' | 'bolt' | 'settings' | 'qr'

interface IconProps {
  name: IconName
  size?: number
  stroke?: number
  color?: string
  style?: React.CSSProperties
}

export function Icon({ name, size = 22, stroke = 2, color = 'currentColor', style }: IconProps) {
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  let content: React.ReactNode
  switch (name) {
    case 'search':
      content = <><circle cx="11" cy="11" r="7" {...p} /><line x1="16.5" y1="16.5" x2="21" y2="21" {...p} /></>
      break
    case 'plus':
      content = <><line x1="12" y1="5" x2="12" y2="19" {...p} /><line x1="5" y1="12" x2="19" y2="12" {...p} /></>
      break
    case 'close':
      content = <><line x1="6" y1="6" x2="18" y2="18" {...p} /><line x1="18" y1="6" x2="6" y2="18" {...p} /></>
      break
    case 'back':
      content = <polyline points="15 5 8 12 15 19" {...p} />
      break
    case 'chev':
      content = <polyline points="9 5 16 12 9 19" {...p} />
      break
    case 'home':
      content = <><path d="M4 11l8-7 8 7" {...p} /><path d="M6 10v9h12v-9" {...p} /></>
      break
    case 'users':
      content = <><circle cx="9" cy="8" r="3.4" {...p} /><path d="M3.5 19c0-3 2.6-5 5.5-5s5.5 2 5.5 5" {...p} /><path d="M16 5.2a3.4 3.4 0 010 6M17.5 14c2.3.3 4 2.2 4 5" {...p} /></>
      break
    case 'percent':
      content = <><circle cx="8" cy="8" r="2.2" {...p} /><circle cx="16" cy="16" r="2.2" {...p} /><line x1="18" y1="6" x2="6" y2="18" {...p} /></>
      break
    case 'archive':
      content = <><rect x="3.5" y="5" width="17" height="4" rx="1.3" {...p} /><path d="M5 9v8.5a1.5 1.5 0 001.5 1.5h11a1.5 1.5 0 001.5-1.5V9" {...p} /><line x1="10" y1="13" x2="14" y2="13" {...p} /></>
      break
    case 'gift':
      content = <><rect x="4" y="11" width="16" height="9" rx="1.5" {...p} /><path d="M3 8h18v3H3z" {...p} /><line x1="12" y1="8" x2="12" y2="20" {...p} /><path d="M12 8S11 4 8.5 4 6 7 9 8M12 8s1-4 3.5-4S18 7 15 8" {...p} /></>
      break
    case 'tag':
      content = <><path d="M4 4h7l9 9-7 7-9-9V4z" {...p} /><circle cx="8.5" cy="8.5" r="1.4" fill={color} stroke="none" /></>
      break
    case 'share':
      content = <><circle cx="6" cy="12" r="2.5" {...p} /><circle cx="17" cy="6" r="2.5" {...p} /><circle cx="17" cy="18" r="2.5" {...p} /><line x1="8.2" y1="10.9" x2="14.8" y2="7.1" {...p} /><line x1="8.2" y1="13.1" x2="14.8" y2="16.9" {...p} /></>
      break
    case 'copy':
      content = <><rect x="9" y="9" width="11" height="11" rx="2.2" {...p} /><path d="M5 15V6a2 2 0 012-2h9" {...p} /></>
      break
    case 'check':
      content = <polyline points="5 12.5 10 17.5 19 6.5" {...p} />
      break
    case 'sun':
      content = <><circle cx="12" cy="12" r="4" {...p} /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" {...p} /></>
      break
    case 'dots':
      content = <><circle cx="5" cy="12" r="1.6" fill={color} stroke="none" /><circle cx="12" cy="12" r="1.6" fill={color} stroke="none" /><circle cx="19" cy="12" r="1.6" fill={color} stroke="none" /></>
      break
    case 'restore':
      content = <><path d="M4 9a8 8 0 1 1-1 4" {...p} /><polyline points="3 4 3 9 8 9" {...p} /></>
      break
    case 'wallet':
      content = <><path d="M3 8a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" {...p} /><path d="M16 12.5h4.5v-3H16a1.5 1.5 0 000 3z" {...p} /></>
      break
    case 'spark':
      content = <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" {...p} />
      break
    case 'arrowup':
      content = <><line x1="12" y1="19" x2="12" y2="6" {...p} /><polyline points="6 11 12 5 18 11" {...p} /></>
      break
    case 'apple':
      content = <path d="M16 13c0 3 2.5 4 2.5 4-.5 1.4-1.7 3-2.9 3-1 0-1.4-.6-2.6-.6s-1.7.6-2.6.6c-1.3 0-2.8-1.8-3.6-3.6C5 16 5.5 11.5 8 10c1-.6 2-.4 2.8-.1.7.3 1 .3 1.7 0 .8-.3 1.8-.6 2.9.1-2 1.2-2.4 3.5-1.4 3z M14.2 6.5c.6-.8.5-1.9.5-2-1 .1-2 .7-2.5 1.4-.5.6-.7 1.6-.6 2 1 .1 1.9-.6 2.6-1.4z" fill={color} stroke="none" />
      break
    case 'bolt':
      content = <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" {...p} />
      break
    case 'settings':
      content = <><circle cx="12" cy="12" r="3" {...p} /><path d="M12 2v3M12 19v3M22 12h-3M5 12H2M19 5l-2 2M7 17l-2 2M19 19l-2-2M7 7L5 5" {...p} /></>
      break
    case 'qr':
      content = <><rect x="4" y="4" width="6" height="6" rx="1" {...p} /><rect x="14" y="4" width="6" height="6" rx="1" {...p} /><rect x="4" y="14" width="6" height="6" rx="1" {...p} /><path d="M14 14h2v2M20 14v6M14 20h6M18 17v0" {...p} /></>
      break
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      {content}
    </svg>
  )
}
