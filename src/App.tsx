import React, { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuth from './store/auth'
import NotificationBanner from './components/common/NotificationBanner'

// Auth (carregamento imediato — pequenas)
import PaginaLogin from './pages/auth/login'
import PaginaRegistro from './pages/auth/register'

// App — carregamento lazy para code splitting automático
const PaginaHome              = lazy(() => import('./pages/app/index'))
const PaginaListaChecklists   = lazy(() => import('./pages/app/checklists/index'))
const PaginaCriarChecklist    = lazy(() => import('./pages/app/checklists/criar'))
const PaginaDetalheChecklist  = lazy(() => import('./pages/app/checklists/detalhe'))
const PaginaEditarChecklist   = lazy(() => import('./pages/app/checklists/editar'))
const PaginaExecutar          = lazy(() => import('./pages/app/checklists/executar'))
const PaginaHistorico         = lazy(() => import('./pages/app/checklists/historico'))
const PaginaGaleria           = lazy(() => import('./pages/app/checklists/galeria'))

/** Spinner centralizado exibido durante verificação de autenticação */
const CarregandoGlobal: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Carregando...</p>
    </div>
  </div>
)

/** Rota protegida — redireciona para /login se não autenticado */
const RotaProtegida: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { estaAutenticado, estaCarregando } = useAuth()
  if (estaCarregando) return <CarregandoGlobal />
  if (!estaAutenticado) return <Navigate to="/login" replace />
  return <>{children}</>
}

const App: React.FC = () => {
  const { verificarAuth } = useAuth()

  useEffect(() => {
    verificarAuth()
  }, [verificarAuth])

  return (
    <BrowserRouter>
      <NotificationBanner />
      <Suspense fallback={<CarregandoGlobal />}>
      <Routes>
        {/* ── Rotas públicas ── */}
        <Route path="/login" element={<PaginaLogin />} />
        <Route path="/register" element={<PaginaRegistro />} />

        {/* ── Rotas protegidas ── */}
        <Route
          path="/"
          element={<RotaProtegida><PaginaHome /></RotaProtegida>}
        />
        <Route
          path="/checklists"
          element={<RotaProtegida><PaginaListaChecklists /></RotaProtegida>}
        />
        <Route
          path="/checklists/criar"
          element={<RotaProtegida><PaginaCriarChecklist /></RotaProtegida>}
        />
        <Route
          path="/checklists/:id"
          element={<RotaProtegida><PaginaDetalheChecklist /></RotaProtegida>}
        />
        <Route
          path="/checklists/:id/editar"
          element={<RotaProtegida><PaginaEditarChecklist /></RotaProtegida>}
        />
        <Route
          path="/checklists/:id/executar"
          element={<RotaProtegida><PaginaExecutar /></RotaProtegida>}
        />
        <Route
          path="/checklists/:id/historico"
          element={<RotaProtegida><PaginaHistorico /></RotaProtegida>}
        />
        <Route
          path="/checklists/:id/galeria"
          element={<RotaProtegida><PaginaGaleria /></RotaProtegida>}
        />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
