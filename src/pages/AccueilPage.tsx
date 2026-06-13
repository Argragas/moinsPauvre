import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { LogoTile } from '../components/LogoTile'
import { Avatar } from '../components/Avatar'
import { CashbackPill } from '../components/CashbackPill'
import { useToast } from '../hooks/useToast'
import { ME, ENSEIGNES, CARTES, CODES } from '../lib/mockData'

const SPARK = [40, 55, 38, 62, 48, 70, 90]

export function AccueilPage() {
  const navigate = useNavigate()
  const flash = useToast()
  const [q, setQ] = useState('')

  const greeting = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir'
  const list = ENSEIGNES.filter(e => e.nom.toLowerCase().includes(q.toLowerCase()))
  const countFor = (id: string) => ({
    cartes: CARTES.filter(c => c.enseigneId === id).length,
    codes: CODES.filter(c => c.enseigneId === id).length,
  })

  return (
    <div className="screen scr-enter">
      <div className="scroll" style={{ paddingBottom: 'calc(var(--tabbar) + 14px)' }}>
        {/* greeting */}
        <div className="head" style={{ justifyContent: 'space-between', paddingTop: 'calc(var(--statusbar) - 38px)' }}>
          <div>
            <div className="dim" style={{ fontSize: 13, fontWeight: 700 }}>{greeting} {ME.name}</div>
            <div className="h2" style={{ marginTop: 2 }}>Vos enseignes</div>
          </div>
          <button className="iconbtn" onClick={() => flash('Profil — bientôt')}>
            <Avatar member={ME} size={42} />
          </button>
        </div>

        {/* savings hero */}
        <div className="pad">
          <div className="rise" style={{
            background: 'var(--grad-hero)', borderRadius: 'var(--r-xl)', padding: '20px 22px',
            position: 'relative', overflow: 'hidden', boxShadow: '0 18px 40px -16px rgba(70,90,230,0.6)',
          }}>
            <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>Économisé cette année</div>
              <div className="num" style={{ fontSize: 44, fontWeight: 700, marginTop: 4, color: '#fff' }}>247,80 €</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 14, gap: 16 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', fontWeight: 600, lineHeight: 1.4 }}>
                  via cartes, codes<br />&amp; cashback
                </div>
                <div className="spark" style={{ width: 110 }}>
                  {SPARK.map((h, i) => <i key={i} className={i === SPARK.length - 1 ? 'hot' : ''} style={{ height: h + '%' }} />)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* search */}
        <div className="pad" style={{ marginTop: 18 }}>
          <div style={{ position: 'relative' }}>
            <Icon name="search" size={19} color="var(--dim)" style={{ position: 'absolute', left: 15, top: 15 }} />
            <input className="field" style={{ paddingLeft: 44 }} placeholder="Rechercher une enseigne…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </div>

        {/* enseignes list */}
        <div className="pad" style={{ marginTop: 16 }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            {list.map(e => {
              const c = countFor(e.id)
              return (
                <button key={e.id} className="row" onClick={() => navigate(`/enseigne/${e.id}`)}>
                  <LogoTile enseigne={e} size={46} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{e.nom}</div>
                    <div className="dim" style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                      {c.cartes > 0 && `${c.cartes} carte${c.cartes > 1 ? 's' : ''}`}
                      {c.cartes > 0 && c.codes > 0 && ' · '}
                      {c.codes > 0 && `${c.codes} code${c.codes > 1 ? 's' : ''}`}
                      {c.cartes === 0 && c.codes === 0 && 'Aucun code'}
                    </div>
                  </div>
                  <CashbackPill pct={e.cashbackPct} />
                  <Icon name="chev" size={18} color="var(--dim)" />
                </button>
              )
            })}
            {list.length === 0 && (
              <div style={{ padding: '34px 20px', textAlign: 'center' }}>
                <div className="muted" style={{ fontWeight: 600 }}>Aucune enseigne « {q} »</div>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={() => navigate('/ajout')}>
                  <Icon name="plus" size={16} /> L'ajouter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <button className="fab" onClick={() => navigate('/ajout')}><Icon name="plus" size={26} stroke={2.4} /></button>
    </div>
  )
}
