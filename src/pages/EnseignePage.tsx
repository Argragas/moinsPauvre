import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { LogoTile } from '../components/LogoTile'
import { FamilyBadge } from '../components/FamilyBadge'
import { ens, euro, fmtLabel, valeurTxt, sourceLabel, giftcardOffres, CARTES, CODES } from '../lib/mockData'

export function EnseignePage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const e = ens(id)
  const cartes = CARTES.filter(c => c.enseigneId === id)
  const codes = CODES.filter(c => c.enseigneId === id)
  const offres = giftcardOffres(id)

  return (
    <div className="screen scr-enter">
      <div className="scroll" style={{ paddingBottom: 30 }}>
        {/* topbar */}
        <div className="topbar">
          <div className="head" style={{ paddingTop: 4, paddingBottom: 8 }}>
            <button className="iconbtn" onClick={() => navigate(-1)}><Icon name="back" size={22} /></button>
            <div style={{ flex: 1 }} />
            <button className="iconbtn"><Icon name="dots" size={22} /></button>
          </div>
        </div>

        {/* enseigne header */}
        <div className="pad" style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
          <LogoTile enseigne={e} size={64} radius={20} />
          <div>
            <div className="h1" style={{ fontSize: 28 }}>{e.nom}</div>
            <div className="dim" style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>
              {cartes.length} carte{cartes.length > 1 ? 's' : ''} · {codes.length} code{codes.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* cashback banner */}
        {e.cashbackPct != null && (
          <div className="pad" style={{ marginTop: 18 }}>
            <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--money-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="percent" size={22} color="var(--money)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Cashback actif</div>
                <div className="dim" style={{ fontSize: 13, fontWeight: 600, marginTop: 1 }}>via {e.cashbackSource ? sourceLabel[e.cashbackSource] : '—'}</div>
                {e.cashbackConditions && <div className="dim" style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{e.cashbackConditions}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="num" style={{ fontSize: 26, fontWeight: 700, color: 'var(--money)' }}>{e.cashbackPct}%</div>
                {e.cashbackUpdatedAt && <div className="dim" style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>maj {e.cashbackUpdatedAt}</div>}
              </div>
            </div>
          </div>
        )}

        {/* cartes cadeaux à prix réduit */}
        {offres.length > 0 && (
          <div className="pad" style={{ marginTop: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="spark" size={15} color="var(--dim)" /> Cartes cadeaux à prix réduit
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {offres.map(o => (
                <div key={o.id} className="row" style={{ cursor: 'default' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--money-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--money)' }}>−{o.remisePct}%</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Carte cadeau {sourceLabel[o.source]}</div>
                    <div className="dim" style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>
                      {o.montants.map(euro).join(', ')}{o.conditions ? ` · ${o.conditions}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* cartes cadeaux */}
        {cartes.length > 0 && (
          <div className="pad" style={{ marginTop: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="gift" size={15} color="var(--dim)" /> Cartes cadeaux
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cartes.map(c => {
                const pct = c.montantInitial ? Math.max(4, (c.montantRestant / c.montantInitial) * 100) : 0
                return (
                  <button key={c.id} className="card" style={{ padding: 16, textAlign: 'left', cursor: 'pointer', border: 'none', display: 'block', width: '100%', fontFamily: 'var(--font)', color: 'var(--text)' }} onClick={() => navigate(`/barcode/carte/${c.id}`)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{c.label}</div>
                        <div className="dim" style={{ fontSize: 12.5, fontWeight: 600, marginTop: 3 }}>{fmtLabel[c.format]} · {c.code.length > 16 ? c.code.slice(0, 16) + '…' : c.code}</div>
                      </div>
                      {c.visibility === 'family' && <FamilyBadge small />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 14 }}>
                      <span className="num" style={{ fontSize: 24, fontWeight: 700 }}>{euro(c.montantRestant)}</span>
                      <span className="dim" style={{ fontSize: 13, fontWeight: 600 }}>/ {euro(c.montantInitial)}</span>
                    </div>
                    <div className="bar" style={{ marginTop: 10 }}><i style={{ width: pct + '%' }} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 700, color: 'var(--accent-2)' }}>
                        <Icon name="qr" size={15} color="var(--accent-2)" /> Afficher le code
                      </span>
                      <span
                        onClick={ev => { ev.stopPropagation(); navigate(`/historique/${c.id}`) }}
                        style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      >
                        Historique <Icon name="chev" size={14} color="var(--muted)" />
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* codes promo */}
        {codes.length > 0 && (
          <div className="pad" style={{ marginTop: 26 }}>
            <div className="eyebrow" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="tag" size={15} color="var(--dim)" /> Codes promo
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {codes.map(c => (
                <button key={c.id} className="row" onClick={() => navigate(`/barcode/code/${c.id}`)}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="num" style={{ fontSize: c.typeValeur === 'pct' ? 15 : 13, fontWeight: 700, color: 'var(--accent-2)' }}>{valeurTxt(c)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{c.label}</div>
                    <div className="dim" style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2, fontFamily: 'var(--font-display)' }}>{c.code}</div>
                  </div>
                  {c.visibility === 'family' && <FamilyBadge small />}
                  <Icon name="chev" size={18} color="var(--dim)" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* add */}
        <div className="pad" style={{ marginTop: 22 }}>
          <button className="btn btn-ghost" onClick={() => navigate(`/ajout?enseigne=${id}`)}>
            <Icon name="plus" size={19} /> Ajouter une carte ou un code
          </button>
        </div>
      </div>
    </div>
  )
}
