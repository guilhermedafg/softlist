import { create } from 'zustand'
import { execucoesApi } from '../api/execucoes-endpoints'
import type { ExecucaoLocal, RespostaItemLocal } from '../api/execucoes-endpoints'
import type { StatusItem } from '../db/schema'

// ─── Debounce helper ─────────────────────────────────────────────────────────

type TimerMap = Map<string, ReturnType<typeof setTimeout>>
const timersNota: TimerMap = new Map()

const debounceNota = (chave: string, fn: () => void, ms = 800) => {
  const anterior = timersNota.get(chave)
  if (anterior) clearTimeout(anterior)
  timersNota.set(chave, setTimeout(() => { fn(); timersNota.delete(chave) }, ms))
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface EstadoExecucoes {
  /** Execução atualmente em andamento (carregada em memória) */
  execucaoAtiva: ExecucaoLocal | null
  /** Histórico de execuções do checklist em foco */
  historico: ExecucaoLocal[]
  estaCarregando: boolean
  erro: string | null
}

interface AcoesExecucoes {
  /** Inicia nova execução ou retoma a existente em_andamento */
  iniciarOuRetomar: (checklistId: string, executorId: string) => Promise<ExecucaoLocal>
  /** Marca/desmarca um item como concluído */
  marcarStatus: (itemId: string, novoStatus: StatusItem) => Promise<void>
  /** Atualiza a nota de um item (com debounce de 800ms) */
  atualizarNota: (itemId: string, nota: string) => void
  /** Finaliza a execução (100% ou força) */
  finalizar: () => Promise<void>
  /** Cancela e descarta a execução ativa */
  cancelar: () => Promise<void>
  /** Carrega histórico do checklist */
  buscarHistorico: (checklistId: string) => Promise<void>
  /** Limpa a execução ativa da memória */
  limparAtiva: () => void
  limparErro: () => void
}

type StoreExecucoes = EstadoExecucoes & AcoesExecucoes

const useExecucoes = create<StoreExecucoes>((set, get) => ({
  execucaoAtiva: null,
  historico: [],
  estaCarregando: false,
  erro: null,

  iniciarOuRetomar: async (checklistId, executorId) => {
    set({ estaCarregando: true, erro: null })
    try {
      // Tenta retomar execução em andamento
      let execucao = await execucoesApi.buscarAtiva(checklistId, executorId)
      if (!execucao) {
        execucao = await execucoesApi.iniciar(checklistId, executorId)
      }
      set({ execucaoAtiva: execucao, estaCarregando: false })
      return execucao
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao iniciar execução.'
      set({ erro: mensagem, estaCarregando: false })
      throw erro
    }
  },

  marcarStatus: async (itemId, novoStatus) => {
    const { execucaoAtiva } = get()
    if (!execucaoAtiva) return

    const respostaAtual = execucaoAtiva.respostas[itemId]
    const observacaoAtual = respostaAtual?.observacao ?? ''

    // Otimistic update — reflete na UI imediatamente
    set((s) => ({
      execucaoAtiva: s.execucaoAtiva
        ? {
            ...s.execucaoAtiva,
            respostas: {
              ...s.execucaoAtiva.respostas,
              [itemId]: {
                status: novoStatus,
                observacao: observacaoAtual,
                atualizadoEm: new Date().toISOString(),
              },
            },
          }
        : null,
    }))

    try {
      const atualizada = await execucoesApi.salvarResposta(
        execucaoAtiva.id,
        itemId,
        novoStatus,
        observacaoAtual,
      )
      set({ execucaoAtiva: atualizada })
    } catch (erro) {
      // Reverte em caso de erro
      set((s) => ({
        execucaoAtiva: s.execucaoAtiva
          ? {
              ...s.execucaoAtiva,
              respostas: {
                ...s.execucaoAtiva.respostas,
                [itemId]: respostaAtual ?? { status: 'pendente', observacao: '', atualizadoEm: '' },
              },
            }
          : null,
        erro: 'Erro ao salvar. Tente novamente.',
      }))
    }
  },

  atualizarNota: (itemId, nota) => {
    const { execucaoAtiva } = get()
    if (!execucaoAtiva) return

    const respostaAtual = execucaoAtiva.respostas[itemId]
    const statusAtual: StatusItem = respostaAtual?.status ?? 'pendente'

    // Atualiza na UI imediatamente (sem delay)
    set((s) => ({
      execucaoAtiva: s.execucaoAtiva
        ? {
            ...s.execucaoAtiva,
            respostas: {
              ...s.execucaoAtiva.respostas,
              [itemId]: {
                status: statusAtual,
                observacao: nota,
                atualizadoEm: new Date().toISOString(),
              } satisfies RespostaItemLocal,
            },
          }
        : null,
    }))

    // Persiste após debounce
    const chaveDebounce = `${execucaoAtiva.id}:${itemId}`
    debounceNota(chaveDebounce, async () => {
      const { execucaoAtiva: atual } = get()
      if (!atual) return
      await execucoesApi.salvarResposta(atual.id, itemId, statusAtual, nota).catch(() => {
        // Silencioso — nota será salva na próxima ação
      })
    })
  },

  finalizar: async () => {
    const { execucaoAtiva } = get()
    if (!execucaoAtiva) return

    set({ estaCarregando: true })
    try {
      const finalizada = await execucoesApi.finalizar(execucaoAtiva.id)
      set({ execucaoAtiva: finalizada, estaCarregando: false })
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao finalizar.'
      set({ erro: mensagem, estaCarregando: false })
    }
  },

  cancelar: async () => {
    const { execucaoAtiva } = get()
    if (!execucaoAtiva) return

    try {
      await execucoesApi.cancelar(execucaoAtiva.id)
    } finally {
      set({ execucaoAtiva: null })
    }
  },

  buscarHistorico: async (checklistId) => {
    try {
      const historico = await execucoesApi.listarPorChecklist(checklistId)
      set({ historico })
    } catch {
      // Silencioso
    }
  },

  limparAtiva: () => set({ execucaoAtiva: null }),
  limparErro: () => set({ erro: null }),
}))

export default useExecucoes
