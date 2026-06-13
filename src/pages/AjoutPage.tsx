import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { LogoTile } from '../components/LogoTile'
import { Barcode } from '../components/Barcode'
import { useToast } from '../hooks/useToast'
import { ENSEIGNES, fmtLabel } from '../lib/mockData'
import type { BarcodeFormat, Visibility } from '../lib/types'

const FORMATS: BarcodeFormat[] = ['EAN13', 'CODE128', 'QR', 'AZTEC']

export function AjoutPage() {
  const navigate = useNavigate()
  const flash = useToast()
  const [params] = useSearchParams()
  const presetEnseigne = params.get('enseigne')

  const [type, setType] = useState<'carte' | 'code'>('carte')
  const [enseigne, setEnseigne] = useState(presetEnseigne || ENSEIGNES[0].id)
  const [code, setCode] = useState('')
  const [format, setFormat] = useState<BarcodeFormat>('CODE128')
  const [montant, setMontant] = useState('')
  const [vis, setVis] = useState<Visibility>('personal')

  const preview = code || (format === 'QR' || format === 'AZTEC' ? 'https://moinspauvre.app' : 'MOINSPAUVRE')

  const handleSave = () => {
    navigate(-1)
    flash('Enregistré !')
  }

  return (
    <div className="screen scr-enter">
      <div className="scroll" style={{ paddingBottom: 120 }}>
        <div className="topbar">
          <div className="head" style={{ paddingTop: 4, paddingBottom: 8, justifyContent: 'space-between' }}>
            <button className="iconbtn" onClick={() => navigate(-1)}><Icon name="close" size={22} /></button>
            <div className="h2" style={{ fontSize: 18 }}>Nouvel ajout</div>
            <div style={{ width: 42 }} />
          </div>
        </div>

        <div className="pad" style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 6 }}>
          {/* live preview */}
          <div style={{ background: '#FBFBFD', borderRadius: 'var(--r-lg)', padding: '22px 18px 18px', textAlign: 'center', boxShadow: 'inset 0 0 0 1px var(--border)' }}>
            <Barcode code={preview} format={format} scale={3} height={22} />
            <div className="num" style={{ marginTop: 12, color: '#11151F', fontSize: 15, fontWeight: 600, letterSpacing: '0.04em', overflowWrap: 'anywhere' }}>{preview}</div>
            <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700, color: '#9AA3B5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{fmtLabel[format]} · Aperçu</div>
          </div>

          {/* type */}
          <div className="seg">
            <button className={type === 'carte' ? 'on' : ''} onClick={() => setType('carte')}>🎁 Carte cadeau</button>
            <button className={type === 'code' ? 'on' : ''} onClick={() => setType('code')}>🏷️ Code promo</button>
          </div>

          {/* enseigne */}
          <div>
            <label className="label">Enseigne</label>
            <div style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 4, margin: '0 -2px' }}>
              {ENSEIGNES.map(en => (
                <button key={en.id} onClick={() => setEnseigne(en.id)} style={{
                  border: 'none', background: 'none', cursor: 'pointer', padding: 2, flexShrink: 0,
                  borderRadius: 16, boxShadow: enseigne === en.id ? '0 0 0 2.5px var(--accent)' : 'none',
                  transition: 'box-shadow 0.18s', opacity: enseigne === en.id ? 1 : 0.6,
                }}>
                  <LogoTile enseigne={en} size={46} />
                </button>
              ))}
            </div>
          </div>

          {/* code */}
          <div>
            <label className="label">Code</label>
            <input className="field num" placeholder="Saisir ou coller le code…" value={code} onChange={e => setCode(e.target.value)} style={{ letterSpacing: '0.03em' }} />
          </div>

          {/* format */}
          <div>
            <label className="label">Format du code-barres</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FORMATS.map(f => (
                <button key={f} className={'chip' + (format === f ? ' on' : '')} onClick={() => setFormat(f)}>{fmtLabel[f]}</button>
              ))}
            </div>
          </div>

          {/* montant (carte) */}
          {type === 'carte' && (
            <div className="rise">
              <label className="label">Montant initial</label>
              <div style={{ position: 'relative' }}>
                <input className="field num" type="number" placeholder="0" value={montant} onChange={e => setMontant(e.target.value)} style={{ fontSize: 22, fontWeight: 700, paddingRight: 44 }} />
                <span className="num" style={{ position: 'absolute', right: 18, top: 16, fontSize: 20, fontWeight: 700, color: 'var(--dim)' }}>€</span>
              </div>
            </div>
          )}

          {/* visibilité */}
          <div>
            <label className="label">Visibilité</label>
            <div className="seg">
              <button className={vis === 'personal' ? 'on' : ''} onClick={() => setVis('personal')}>🔒 Personnel</button>
              <button className={vis === 'family' ? 'on' : ''} onClick={() => setVis('family')}>👨‍👩‍👧 Famille</button>
            </div>
          </div>
        </div>
      </div>

      {/* save bar */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px var(--pad) 30px', background: 'linear-gradient(0deg, var(--bg) 55%, rgba(9,12,19,0))' }}>
        <button className="btn btn-primary" onClick={handleSave}>
          <Icon name="check" size={20} stroke={2.6} /> Enregistrer {type === 'carte' ? 'la carte' : 'le code'}
        </button>
      </div>
    </div>
  )
}
