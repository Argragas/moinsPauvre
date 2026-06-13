import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { BrandMark } from '../components/BrandMark'
import { Icon } from '../components/Icon'

export function LoginPage() {
  const { login, register, loginWithApple } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const fn = mode === 'login' ? login : register
    const { error } = await fn(email, password)
    setSubmitting(false)
    if (error) setError(error.message)
  }

  return (
    <div className="screen" style={{ background: 'radial-gradient(130% 70% at 50% 0%, #16203A 0%, var(--bg) 58%)' }}>
      <div className="scroll" style={{ paddingTop: 'calc(var(--statusbar) + 22px)' }}>
        <div className="pad" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', paddingBottom: 34 }}>
          {/* hero */}
          <div className="rise" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 30 }}>
            <BrandMark size={58} />
            <h1 className="h1" style={{ fontSize: 40, marginTop: 26, marginBottom: 0 }}>
              moins<span style={{ color: 'var(--accent-2)' }}>pauvre</span>
            </h1>
            <p className="muted" style={{ fontSize: 17, lineHeight: 1.45, marginTop: 14, maxWidth: 290 }}>
              Vos cartes cadeaux, codes promo et cashback. Tout au même endroit — prêts à scanner en caisse.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, fontSize: 13.5, fontWeight: 700, color: 'var(--money)' }}>
              <Icon name="spark" size={15} color="var(--money)" /> Déjà 247 € économisés cette année
            </div>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} className="rise" style={{ animationDelay: '0.08s', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 30 }}>
            <input
              className="field"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              className="field"
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && (
              <p style={{ color: 'var(--danger)', fontSize: 13.5, fontWeight: 600, margin: 0 }}>{error}</p>
            )}
            <button className="btn btn-primary" type="submit" style={{ marginTop: 4 }} disabled={submitting}>
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => { void loginWithApple() }}>
              <Icon name="apple" size={19} /> Continuer avec Apple
            </button>
            <button
              type="button"
              onClick={() => setMode(m => (m === 'login' ? 'register' : 'login'))}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, fontWeight: 600, marginTop: 8, cursor: 'pointer', fontFamily: 'var(--font)' }}
            >
              {mode === 'login' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
