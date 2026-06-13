import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { LogoTile } from '../components/LogoTile'
import { ens, euro, CARTES, UTILISATIONS } from '../lib/mockData'

export function HistoriquePage() {
  const { carteId = '' } = useParams<{ carteId: string }>()
  const navigate = useNavigate()

  const carte = CARTES.find(c => c.id === carteId)
  if (!carte) return <Navigate to="/" replace />

  const e = ens(carte.enseigneId)
  const uses = UTILISATIONS[carte.id] || []
  const pct = carte.montantInitial ? (carte.montantRestant / carte.montantInitial) * 100 : 0
  const depense = carte.montantInitial - carte.montantRestant

  return (
    <div className="screen scr-enter">
      <div className="scroll" style={{ paddingBottom: 30 }}>
        <div className="topbar">
          <div className="head" style={{ paddingTop: 4, paddingBottom: 8 }}>
            <button className="iconbtn" onClick={() => navigate(-1)}><Icon name="back" size={22} /></button>
            <div className="h2" style={{ fontSize: 18, flex: 1 }}>Historique</div>
          </div>
        </div>

        {/* summary card */}
        <div className="pad">
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <LogoTile enseigne={e} size={44} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{carte.label}</div>
                <div className="dim" style={{ fontSize: 12.5, fontWeight: 600 }}>{e.nom}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 18 }}>
              <span className="num" style={{ fontSize: 36, fontWeight: 700 }}>{euro(carte.montantRestant)}</span>
              <span className="dim" style={{ fontSize: 15, fontWeight: 600 }}>restants</span>
            </div>
            <div className="bar" style={{ marginTop: 12, height: 9 }}><i style={{ width: Math.max(4, pct) + '%' }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12.5, fontWeight: 700 }}>
              <span className="dim">Dépensé {euro(depense)}</span>
              <span className="dim">Initial {euro(carte.montantInitial)}</span>
            </div>
          </div>
        </div>

        {/* uses */}
        <div className="pad" style={{ marginTop: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>{uses.length} utilisation{uses.length > 1 ? 's' : ''}</div>
          {uses.length > 0 ? (
            <div className="card" style={{ overflow: 'hidden' }}>
              {uses.map(u => (
                <div key={u.id} className="row" style={{ cursor: 'default' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="wallet" size={20} color="var(--muted)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{u.note || 'Dépense'}</div>
                    <div className="dim" style={{ fontSize: 12.5, fontWeight: 600 }}>{u.date}</div>
                  </div>
                  <span className="num" style={{ fontSize: 17, fontWeight: 700, color: 'var(--danger)' }}>−{euro(u.montant)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: '30px 20px', textAlign: 'center' }}>
              <div className="muted" style={{ fontWeight: 600, fontSize: 14 }}>Carte intacte. Pas encore touché 🤑</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px var(--pad) 30px', background: 'linear-gradient(0deg, var(--bg) 55%, rgba(9,12,19,0))' }}>
        <button className="btn btn-primary" onClick={() => navigate(`/barcode/carte/${carte.id}`)}>
          <Icon name="qr" size={20} /> Afficher le code
        </button>
      </div>
    </div>
  )
}
