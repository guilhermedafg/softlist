import clienteApi, { CHAVE_TOKEN } from './client'
import type { Usuario } from '../db/schema'

/** Payload de resposta ao fazer login */
interface RespostaLogin {
  token: string
  usuario: Usuario
}

/** Payload de resposta ao registrar */
interface RespostaRegistro {
  token: string
  usuario: Usuario
}

/**
 * Mock local: simula um banco de usuários em memória para desenvolvimento.
 * Em produção, remover e apontar para a API real.
 */
const bancoDados = {
  usuarios: JSON.parse(localStorage.getItem('softlist_usuarios') ?? '[]') as (Usuario & {
    senha: string
  })[],
  salvar() {
    localStorage.setItem('softlist_usuarios', JSON.stringify(this.usuarios))
  },
}

const autenticacao = {
  /**
   * Registra um novo usuário.
   * Mock: salva localmente; em produção usar POST /auth/register.
   */
  async registrar(email: string, senha: string, nome: string): Promise<RespostaRegistro> {
    // Simula latência de rede
    await new Promise((r) => setTimeout(r, 800))

    const jaExiste = bancoDados.usuarios.find((u) => u.email === email)
    if (jaExiste) {
      throw { response: { data: { mensagem: 'E-mail já cadastrado.' }, status: 409 } }
    }

    const novoUsuario: Usuario & { senha: string } = {
      id: crypto.randomUUID(),
      nome,
      email,
      senha,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    }

    bancoDados.usuarios.push(novoUsuario)
    bancoDados.salvar()

    const token = btoa(JSON.stringify({ id: novoUsuario.id, email }))
    const { senha: _, ...usuario } = novoUsuario

    return { token, usuario }
  },

  /**
   * Autentica um usuário existente.
   * Mock: verifica localmente; em produção usar POST /auth/login.
   */
  async login(email: string, senha: string): Promise<RespostaLogin> {
    await new Promise((r) => setTimeout(r, 800))

    const usuario = bancoDados.usuarios.find((u) => u.email === email && u.senha === senha)
    if (!usuario) {
      throw { response: { data: { mensagem: 'E-mail ou senha incorretos.' }, status: 401 } }
    }

    const token = btoa(JSON.stringify({ id: usuario.id, email }))
    const { senha: _, ...dadosUsuario } = usuario

    return { token, usuario: dadosUsuario }
  },

  /**
   * Faz logout removendo o token.
   */
  async logout(): Promise<void> {
    localStorage.removeItem(CHAVE_TOKEN)
    // Em produção: await clienteApi.post('/auth/logout')
  },

  /**
   * Busca dados do usuário autenticado via token.
   * Mock: decodifica o token local; em produção usar GET /auth/me.
   */
  async eu(): Promise<Usuario> {
    const token = localStorage.getItem(CHAVE_TOKEN)
    if (!token) throw new Error('Não autenticado')

    await new Promise((r) => setTimeout(r, 400))

    try {
      const payload = JSON.parse(atob(token)) as { id: string }
      const encontrado = bancoDados.usuarios.find((u) => u.id === payload.id)
      if (!encontrado) throw new Error('Usuário não encontrado')

      const { senha: _, ...usuario } = encontrado
      return usuario
    } catch {
      throw { response: { status: 401, data: { mensagem: 'Sessão inválida.' } } }
    }
  },
}

export { autenticacao }
export { clienteApi }
