import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../store/auth'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

interface ErrosForm {
  email?: string
  senha?: string
}

const validarForm = (email: string, senha: string): ErrosForm => {
  const erros: ErrosForm = {}
  if (!email.trim()) {
    erros.email = 'E-mail é obrigatório.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    erros.email = 'Informe um e-mail válido.'
  }
  if (!senha) {
    erros.senha = 'Senha é obrigatória.'
  } else if (senha.length < 6) {
    erros.senha = 'A senha deve ter no mínimo 6 caracteres.'
  }
  return erros
}

const PaginaLogin: React.FC = () => {
  const navegar = useNavigate()
  const { login, estaCarregando, erro, limparErro, estaAutenticado } = useAuth()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [errosForm, setErrosForm] = useState<ErrosForm>({})

  useEffect(() => {
    if (estaAutenticado) navegar('/', { replace: true })
  }, [estaAutenticado, navegar])

  useEffect(() => {
    return () => { limparErro() }
  }, [limparErro])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const erros = validarForm(email, senha)
    if (Object.keys(erros).length > 0) {
      setErrosForm(erros)
      return
    }
    setErrosForm({})
    try {
      await login(email, senha)
    } catch {
      // erro gerenciado pelo store
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Marca */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-black rounded-xl mb-4">
            <svg
              className="w-8 h-8 text-white"
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
          <h1 className="text-3xl font-bold text-black tracking-tight">SoftList</h1>
          <p className="text-gray-500 mt-1 text-sm">Gerencie seus checklists com facilidade</p>
        </div>

        {/* Card do formulário */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-black mb-6">Entrar na conta</h2>

          {/* Erro do servidor */}
          {erro && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-error font-medium">{erro}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              nome="email"
              label="E-mail"
              tipo="email"
              placeholder="seu@email.com"
              valor={email}
              aoMudar={(e) => setEmail(e.target.value)}
              erro={errosForm.email}
              autoComplete="email"
            />

            <Input
              nome="senha"
              label="Senha"
              tipo="password"
              placeholder="••••••••"
              valor={senha}
              aoMudar={(e) => setSenha(e.target.value)}
              erro={errosForm.senha}
              autoComplete="current-password"
            />

            <div className="mt-2">
              <Button
                tipo="submit"
                variante="primario"
                larguraTotal
                carregando={estaCarregando}
                desabilitado={estaCarregando}
              >
                {estaCarregando ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </form>
        </div>

        {/* Link de registro */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Não tem uma conta?{' '}
          <Link
            to="/register"
            className="text-black font-semibold hover:underline underline-offset-2"
          >
            Crie uma conta
          </Link>
        </p>
      </div>
    </div>
  )
}

export default PaginaLogin
