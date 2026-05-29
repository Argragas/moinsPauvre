import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { AccueilPage } from './pages/AccueilPage'
import { EnseignePage } from './pages/EnseignePage'
import { AjoutPage } from './pages/AjoutPage'
import { BarcodePage } from './pages/BarcodePage'
import { HistoriquePage } from './pages/HistoriquePage'
import { FamillePage } from './pages/FamillePage'
import { CashbackPage } from './pages/CashbackPage'
import { ArchivesPage } from './pages/ArchivesPage'
import { Layout } from './components/Layout'

function ProtectedRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<AccueilPage />} />
        <Route path="/enseigne/:id" element={<EnseignePage />} />
        <Route path="/ajout" element={<AjoutPage />} />
        <Route path="/barcode/:type/:id" element={<BarcodePage />} />
        <Route path="/historique/:carteId" element={<HistoriquePage />} />
        <Route path="/famille" element={<FamillePage />} />
        <Route path="/cashback" element={<CashbackPage />} />
        <Route path="/archives" element={<ArchivesPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}

export function App() {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-slate-900" />
  return (
    <BrowserRouter>
      {session ? <ProtectedRoutes /> : <LoginPage />}
    </BrowserRouter>
  )
}

export default App
