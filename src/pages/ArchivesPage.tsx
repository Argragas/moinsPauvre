import { useState } from 'react'
import { Icon } from '../components/Icon'
import { LogoTile } from '../components/LogoTile'
import { useToast } from '../hooks/useToast'
import { ens, ARCHIVES } from '../lib/mockData'

export function ArchivesPage() {
  const flash = useToast()
  const [items, setItems] = useState(ARCHIVES)

  const restore = (id: string) => {
    setItems(x => x.filter(i => i.id !== id))
    flash('Restauré')
  }

  return (
    <div className="screen scr-enter">
      <div className="scroll" style={{ paddingBottom: 'calc(var(--tabbar) + 14px)' }}>
        <div className="head" style={{ paddingTop: 'calc(var(--statusbar) - 30px)' }}>
          <div>
            <div className="h1" style={{ fontSize: 30 }}>Archives</div>
            <div className="dim" style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>Rien ne se perd, tout se restaure</div>
          </div>
        </div>

        <div className="pad" style={{ marginTop: 8 }}>
          {items.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map(a => {
                const e = ens(a.enseigneId)
                return (
                  <div key={a.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, opacity: 0.92 }}>
                    <div style={{ filter: 'grayscale(0.5)', opacity: 0.8 }}><LogoTile enseigne={e} size={46} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{a.label}</div>
                      <div className="dim" style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>
                        {a.sub} · {a.date} · par {a.by}
                      </div>
                    </div>
                    <button className="chip on" onClick={() => restore(a.id)}>
                      <Icon name="restore" size={15} color="var(--accent-2)" /> Restaurer
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card" style={{ padding: '46px 24px', textAlign: 'center', marginTop: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 17, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon name="archive" size={26} color="var(--dim)" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Tout est restauré</div>
              <div className="muted" style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>Vos archives sont vides. La classe.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
