import React from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../../store/auth'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'

const PaginaHome: React.FC = () => {
  const { usuario, logout, estaCarregando } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-black">SoftList</span>
          </div>

          <Button
            variante="secundario"
            aoClicar={handleLogout}
            carregando={estaCarregando}
            desabilitado={estaCarregando}
          >
            Sair
          </Button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Saudação */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-black">
            Bem-vindo,{' '}
            <span className="text-caramel">{usuario?.nome?.split(' ')[0] ?? 'Usuário'}</span>!
          </h1>
          <p className="text-gray-500 mt-2">O que você vai verificar hoje?</p>
        </div>

        {/* Cards de ação rápida */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link to="/checklists" className="block">
            <Card aoClicar={() => {}}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-black">Meus Checklists</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Crie, edite e execute seus checklists
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Card>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-black">Relatórios</h2>
                <p className="text-sm text-gray-500 mt-1">Em breve — Fase 2</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Informações da conta */}
        <div className="bg-cream border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Sua conta
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Nome</span>
              <span className="text-sm font-medium text-black">{usuario?.nome}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">E-mail</span>
              <span className="text-sm font-medium text-black">{usuario?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Membro desde</span>
              <span className="text-sm font-medium text-black">
                {usuario?.criadoEm
                  ? new Date(usuario.criadoEm).toLocaleDateString('pt-BR')
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PaginaHome
