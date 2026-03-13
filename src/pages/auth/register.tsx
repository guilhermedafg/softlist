import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../store/auth'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

interface ErrosForm {
  nome?: string
  email?: string
  senha?: string
  confirmarSenha?: string
}

const validarForm = (
  nome: string,
  email: string,
  senha: string,
  confirmarSenha: string,
): ErrosForm => {
  const erros: ErrosForm = {}

  if (!nome.trim()) {
    erros.nome = 'Nome é obrigatório.'
  } else if (nome.trim().length < 2) {
    erros.nome = 'Nome deve ter ao menos 2 caracteres.'
  }

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

  if (!confirmarSenha) {
    erros.confirmarSenha = 'Confirme sua senha.'
  } else if (senha !== confirmarSenha) {
    erros.confirmarSenha = 'As senhas não coincidem.'
  }

  return erros
}

const PaginaRegistro: React.FC = () => {
  const navegar = useNavigate()
  const { registrar, estaCarregando, erro, limparErro } = useAuth()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [errosForm, setErrosForm] = useState<ErrosForm>({})
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    return () => { limparErro() }
  }, [limparErro])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const erros = validarForm(nome, email, senha, confirmarSenha)
    if (Object.keys(erros).length > 0) {
      setErrosForm(erros)
      return
    }
    setErrosForm({})
    try {
      await registrar(email, senha, nome)
      setSucesso(true)
      setTimeout(() => navegar('/login'), 1500)
    } catch {
      // erro gerenciado pelo store
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
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
          <p className="text-gray-500 mt-1 text-sm">Crie sua conta gratuitamente</p>
        </div>

        {/* Card do formulário */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-black mb-6">Criar nova conta</h2>

          {/* Feedback de sucesso */}
          {sucesso && (
            <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-success font-medium">
                Conta criada com sucesso! Redirecionando...
              </p>
            </div>
          )}

          {/* Erro do servidor */}
          {erro && !sucesso && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-error font-medium">{erro}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              nome="nome"
              label="Nome completo"
              tipo="text"
              placeholder="Seu nome"
              valor={nome}
              aoMudar={(e) => setNome(e.target.value)}
              erro={errosForm.nome}
              autoComplete="name"
            />

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
              placeholder="Mínimo 6 caracteres"
              valor={senha}
              aoMudar={(e) => setSenha(e.target.value)}
              erro={errosForm.senha}
              autoComplete="new-password"
            />

            <Input
              nome="confirmarSenha"
              label="Confirmar senha"
              tipo="password"
              placeholder="Repita a senha"
              valor={confirmarSenha}
              aoMudar={(e) => setConfirmarSenha(e.target.value)}
              erro={errosForm.confirmarSenha}
              autoComplete="new-password"
            />

            <div className="mt-2">
              <Button
                tipo="submit"
                variante="primario"
                larguraTotal
                carregando={estaCarregando}
                desabilitado={estaCarregando || sucesso}
              >
                {estaCarregando ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </div>
          </form>
        </div>

        {/* Link de login */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem uma conta?{' '}
          <Link
            to="/login"
            className="text-black font-semibold hover:underline underline-offset-2"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}

export default PaginaRegistro
