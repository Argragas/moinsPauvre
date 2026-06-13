import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { LogoTile } from '../components/LogoTile'
import { Avatar } from '../components/Avatar'
import { useToast } from '../hooks/useToast'
import { ens, euro, valeurTxt, CARTES, CODES, FAMILLE, type CarteCadeauDisplay, type CodePromoDisplay } from '../lib/mockData'

type SharedItem = (CarteCadeauDisplay & { kind: 'carte' }) | (CodePromoDisplay & { kind: 'code' })

export function FamillePage() {
  const navigate = useNavigate()
  const flash = useToast()

  const shared: SharedItem[] = [
    ...CARTES.filter(c => c.visibility === 'family').map(c => ({ ...c, kind: 'carte' as const })),
    ...CODES.filter(c => c.visibility === 'family').map(c => ({ ...c, kind: 'code' as const })),
  ]

  return (
    <div className="screen scr-enter">
      <div className="scroll" style={{ paddingBottom: 'calc(var(--tabbar) + 14px)' }}>
        <div className="head" style={{ paddingTop: 'calc(var(--statusbar) - 30px)' }}>
          <div className="h1" style={{ fontSize: 30 }}>Ma famille</div>
        </div>

        {/* invite card */}
        <div className="pad">
          <div className="card" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{FAMILLE.nom}</div>
            <div className="dim" style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{FAMILLE.membres.length} membres · {shared.length} partages</div>

            {/* avatars */}
            <div style={{ display: 'flex', marginTop: 16 }}>
              {FAMILLE.membres.map((m, i) => (
                <div key={m.id} style={{ marginLeft: i ? -10 : 0, position: 'relative', zIndex: FAMILLE.membres.length - i }}>
                  <div style={{ borderRadius: 999, boxShadow: '0 0 0 3px var(--surface)' }}><Avatar member={m} size={42} /></div>
                </div>
              ))}
            </div>

            {/* invite code */}
            <div className="hr" style={{ margin: '18px 0' }} />
            <div className="dim" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Code d'invitation</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="num" style={{ flex: 1, fontSize: 30, fontWeight: 700, letterSpacing: '0.28em', background: 'var(--surface-2)', borderRadius: 14, padding: '12px 18px', textAlign: 'center', boxShadow: 'inset 0 0 0 1px var(--border)' }}>{FAMILLE.invite}</div>
              <button className="iconbtn" style={{ width: 50, height: 50 }} onClick={() => flash('Code copié !')}><Icon name="copy" size={22} /></button>
              <button className="iconbtn" style={{ width: 50, height: 50, background: 'var(--accent-soft)', color: 'var(--accent-2)' }} onClick={() => flash('Invitation partagée')}><Icon name="share" size={21} /></button>
            </div>
          </div>
        </div>

        {/* members list */}
        <div className="pad" style={{ marginTop: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Membres</div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {FAMILLE.membres.map(m => (
              <div key={m.id} className="row" style={{ cursor: 'default' }}>
                <Avatar member={m} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</div>
                  <div className="dim" style={{ fontSize: 12.5, fontWeight: 600 }}>{m.role === 'owner' ? 'Administrateur' : 'Membre'}</div>
                </div>
                {m.role === 'owner' && <span className="pill pill-blue">Admin</span>}
              </div>
            ))}
          </div>
        </div>

        {/* shared items */}
        <div className="pad" style={{ marginTop: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Codes &amp; cartes partagés</div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {shared.map(s => {
              const e = ens(s.enseigneId)
              return (
                <button key={s.id} className="row" onClick={() => navigate(`/enseigne/${s.enseigneId}`)}>
                  <LogoTile enseigne={e} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{s.label}</div>
                    <div className="dim" style={{ fontSize: 12.5, fontWeight: 600 }}>{e.nom} · {s.kind === 'carte' ? euro(s.montantRestant) : valeurTxt(s)}</div>
                  </div>
                  <Icon name="chev" size={18} color="var(--dim)" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
