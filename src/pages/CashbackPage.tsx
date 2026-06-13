import { Icon } from '../components/Icon'
import { LogoTile } from '../components/LogoTile'
import { useToast } from '../hooks/useToast'
import { ENSEIGNES, SOURCES } from '../lib/mockData'
import type { CashbackSource } from '../lib/types'

const SRC_NAME: Record<CashbackSource, string> = { igraal: 'iGraal', widilo: 'Widilo', manual: 'Manuel' }

export function CashbackPage() {
  const flash = useToast()
  const withCb = ENSEIGNES
    .filter(e => e.cashbackPct != null)
    .sort((a, b) => (b.cashbackPct ?? 0) - (a.cashbackPct ?? 0))

  return (
    <div className="screen scr-enter">
      <div className="scroll" style={{ paddingBottom: 'calc(var(--tabbar) + 14px)' }}>
        <div className="head" style={{ paddingTop: 'calc(var(--statusbar) - 30px)' }}>
          <div className="h1" style={{ fontSize: 30 }}>Cashback</div>
        </div>

        {/* sources */}
        <div className="pad">
          <div className="eyebrow" style={{ marginBottom: 12 }}>Sources connectées</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SOURCES.map(s => (
              <div key={s.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: s.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={s.id === 'manual' ? 'settings' : 'bolt'} size={21} color={s.color === '#5A6479' ? 'var(--muted)' : s.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{s.nom}</div>
                  <div className="dim" style={{ fontSize: 12.5, fontWeight: 600 }}>{s.enseignes} enseignes · maj {s.maj}</div>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--money)' }}>
                  <span className="dot" style={{ background: 'var(--money)', boxShadow: '0 0 8px var(--money)' }} /> Connecté
                </span>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => flash('Source ajoutée')}>
            <Icon name="plus" size={18} /> Saisir un taux manuel
          </button>
        </div>

        {/* rates */}
        <div className="pad" style={{ marginTop: 26 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Taux par enseigne</div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {withCb.map(e => (
              <div key={e.id} className="row" style={{ cursor: 'default' }}>
                <LogoTile enseigne={e} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{e.nom}</div>
                  <div className="dim" style={{ fontSize: 12, fontWeight: 600 }}>via {e.cashbackSource ? SRC_NAME[e.cashbackSource] : '—'}</div>
                </div>
                <span className="num" style={{ fontSize: 20, fontWeight: 700, color: 'var(--money)' }}>{e.cashbackPct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
