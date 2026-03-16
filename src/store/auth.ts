import { create } from 'zustand'
import { autenticacao } from '../api/endpoints'
import { CHAVE_TOKEN } from '../api/client'
import type { Usuario } from '../db/schema'

interface EstadoAuth {
  usuario: Usuario | null
  estaCarregando: boolean
  erro: string | null
  estaAutenticado: boolean
}

interface AcoesAuth {
  registrar: (email: string, senha: string, nome: string) => Promise<void>
  login: (email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
  verificarAuth: () => Promise<void>
  limparErro: () => void
}

type StoreAuth = EstadoAuth & AcoesAuth

const extrairMensagemErro = (erro: unknown): string => {
  if (
    erro !== null &&
    typeof erro === 'object' &&
    'response' in erro &&
    erro.response !== null &&
    typeof erro.response === 'object' &&
    'data' in erro.response &&
    erro.response.data !== null &&
    typeof erro.response.data === 'object' &&
    'mensagem' in erro.response.data &&
    typeof erro.response.data.mensagem === 'string'
  ) {
    return erro.response.data.mensagem
  }
  if (erro instanceof Error) return erro.message
  return 'Ocorreu um erro inesperado. Tente novamente.'
}

const useAuth = create<StoreAuth>((set) => ({
  usuario: null,
  estaCarregando: false,
  erro: null,
  estaAutenticado: false,

  registrar: async (email, senha, nome) => {
    set({ estaCarregando: true, erro: null })
    try {
      const { token, usuario } = await autenticacao.registrar(email, senha, nome)
      localStorage.setItem(CHAVE_TOKEN, token)
      set({ usuario, estaAutenticado: true, estaCarregando: false })
    } catch (erro) {
      set({
        erro: extrairMensagemErro(erro),
        estaCarregando: false,
        estaAutenticado: false,
      })
      throw erro
    }
  },

  login: async (email, senha) => {
    set({ estaCarregando: true, erro: null })
    try {
      const { token, usuario } = await autenticacao.login(email, senha)
      localStorage.setItem(CHAVE_TOKEN, token)
      set({ usuario, estaAutenticado: true, estaCarregando: false })
    } catch (erro) {
      set({
        erro: extrairMensagemErro(erro),
        estaCarregando: false,
        estaAutenticado: false,
      })
      throw erro
    }
  },

  logout: async () => {
    set({ estaCarregando: true })
    try {
      await autenticacao.logout()
    } finally {
      set({ usuario: null, estaAutenticado: false, estaCarregando: false, erro: null })
    }
  },

  verificarAuth: async () => {
    const token = localStorage.getItem(CHAVE_TOKEN)
    if (!token) {
      set({ estaAutenticado: false, estaCarregando: false })
      return
    }

    set({ estaCarregando: true })
    try {
      const usuario = await autenticacao.eu()
      set({ usuario, estaAutenticado: true, estaCarregando: false })
    } catch {
      localStorage.removeItem(CHAVE_TOKEN)
      set({ usuario: null, estaAutenticado: false, estaCarregando: false })
    }
  },

  limparErro: () => set({ erro: null }),
}))

export default useAuth
