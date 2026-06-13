import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { LogoTile } from '../components/LogoTile'
import { Barcode } from '../components/Barcode'
import { useToast } from '../hooks/useToast'
import { ens, euro, fmtLabel, valeurTxt, CARTES, CODES } from '../lib/mockData'

export function BarcodePage() {
  const { type = '', id = '' } = useParams<{ type: string; id: string }>()
  const navigate = useNavigate()
  const flash = useToast()
  const [showUse, setShowUse] = useState(false)
  const [montant, setMontant] = useState('')
  const [note, setNote] = useState('')

  const item = type === 'carte' ? CARTES.find(c => c.id === id) : CODES.find(c => c.id === id)
  if (!item) return <Navigate to="/" replace />

  const e = ens(item.enseigneId)
  const is2d = item.format === 'QR' || item.format === 'AZTEC'

  const confirmUse = () => {
    setShowUse(false)
    flash('Utilisation enregistrée')
    navigate(-1)
  }

  return (
    <div className="barcode-screen">
      {/* header */}
      <div style={{ paddingTop: 'calc(var(--statusbar) + 4px)', padding: '0 18px', display: 'flex', alignItems: 'center', gap: 13, marginTop: 'var(--statusbar)' }}>
        <LogoTile enseigne={e} size={42} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#11151F', fontFamily: 'var(--font-display)' }}>{e.nom}</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#8A93A6' }}>{item.label}</div>
        </div>
        <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 999, border: 'none', cursor: 'pointer', background: '#EEF0F4', color: '#11151F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" size={22} />
        </button>
      </div>

      {/* brightness hint */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#FFF6E5', color: '#B8791A', padding: '7px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 700 }}>
          <Icon name="sun" size={15} color="#E0A020" /> Luminosité au maximum
        </div>
      </div>

      {/* barcode */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 30px' }}>
        <div style={{ width: '100%', maxWidth: is2d ? 230 : '100%' }}>
          <Barcode code={item.code} format={item.format} scale={4} height={is2d ? undefined : 34} />
        </div>
        <div className="num" style={{ marginTop: 22, color: '#11151F', fontSize: 18, fontWeight: 600, letterSpacing: '0.10em', textAlign: 'center', overflowWrap: 'anywhere' }}>{item.code}</div>
        <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: '#9AA3B5', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{fmtLabel[item.format]}</div>
        {'typeValeur' in item && (
          <div style={{ marginTop: 18, padding: '9px 16px', background: 'rgba(62,123,250,0.10)', color: '#2A5BD0', borderRadius: 12, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            {valeurTxt(item)} · {item.label}
          </div>
        )}
      </div>

      {/* action */}
      <div style={{ padding: '0 22px calc(34px + env(safe-area-inset-bottom))' }}>
        {'montantRestant' in item ? (
          <button onClick={() => setShowUse(true)} style={{ width: '100%', border: 'none', cursor: 'pointer', borderRadius: 'var(--r)', padding: '16px', fontFamily: 'var(--font)', fontWeight: 700, fontSize: 16, background: '#11151F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
            <Icon name="check" size={20} stroke={2.4} /> Marquer une utilisation
          </button>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 600, color: '#9AA3B5', paddingBottom: 8 }}>
            Présentez ce code en caisse 👆
          </div>
        )}
      </div>

      {/* use modal */}
      {showUse && 'montantRestant' in item && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 90, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(5,7,12,0.55)', backdropFilter: 'blur(3px)' }} onClick={() => setShowUse(false)}>
          <div onClick={ev => ev.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: '26px 26px 0 0', padding: '10px 22px calc(30px + env(safe-area-inset-bottom))', boxShadow: 'inset 0 1px 0 var(--border-strong)', animation: 'rise 0.3s var(--ease) both', color: 'var(--text)' }}>
            <div style={{ width: 40, height: 5, borderRadius: 99, background: 'var(--surface-3)', margin: '0 auto 18px' }} />
            <div className="h2" style={{ fontSize: 20, marginBottom: 4 }}>Marquer une utilisation</div>
            <div className="dim" style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 18 }}>Solde restant : {euro(item.montantRestant)}</div>
            <label className="label">Montant dépensé</label>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <input className="field num" type="number" autoFocus placeholder="0" value={montant} onChange={ev => setMontant(ev.target.value)} style={{ fontSize: 22, fontWeight: 700, paddingRight: 44 }} />
              <span className="num" style={{ position: 'absolute', right: 18, top: 16, fontSize: 20, fontWeight: 700, color: 'var(--dim)' }}>€</span>
            </div>
            <label className="label">Note (optionnel)</label>
            <input className="field" placeholder="Ex : Parfum…" value={note} onChange={ev => setNote(ev.target.value)} style={{ marginBottom: 20 }} />
            <button className="btn btn-primary" onClick={confirmUse}>
              Valider la dépense
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
