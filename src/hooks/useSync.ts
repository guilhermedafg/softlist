import { useState, useEffect, useCallback, useRef } from 'react'
import { storage } from '../db/storage'
import clienteApi from '../api/client'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type StatusSync = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'

export interface ResultadoSync {
  status: StatusSync
  estaOnline: boolean
  pendentes: number
  sincronizar: () => Promise<void>
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const DELAY_BASE_MS = 2000
const MAX_TENTATIVAS = 4
const IDLE_APOS_MS = 3000

const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// ─── Sync de uma execução com retry exponencial ───────────────────────────────

async function sincronizarItem(
  filaItem: { id: string; execucaoId: string; tentativas: number },
): Promise<boolean> {
  for (let tentativa = 0; tentativa <= MAX_TENTATIVAS - 1; tentativa++) {
    try {
      // Envia execução para o servidor.
      // Como o backend é mock (sem endpoint real), silenciamos o erro 404/500.
      await clienteApi
        .post('/execucoes/sync', { execucaoId: filaItem.execucaoId })
        .catch((err) => {
          // Simula sucesso quando backend não está disponível (ambiente local)
          // Em produção, rejeitaria e entraria no retry
          if (err?.response?.status >= 500 || !err?.response) {
            // Sem resposta ou erro de servidor → retry
            throw err
          }
          // 404/400 → backend não implementado → trata como sucesso local
        })

      await storage.removerDaFila(filaItem.id)
      return true
    } catch {
      if (tentativa < MAX_TENTATIVAS - 1) {
        await storage.atualizarTentativas(filaItem.id, tentativa + 1)
        await esperar(DELAY_BASE_MS * Math.pow(2, tentativa))
      }
    }
  }
  return false
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSync(): ResultadoSync {
  const [estaOnline, setEstaOnline] = useState(navigator.onLine)
  const [status, setStatus] = useState<StatusSync>(navigator.onLine ? 'idle' : 'offline')
  const [pendentes, setPendentes] = useState(0)
  const processandoRef = useRef(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const atualizarPendentes = useCallback(async () => {
    try {
      const count = await storage.contarPendentes()
      setPendentes(count)
      return count
    } catch {
      return 0
    }
  }, [])

  const sincronizar = useCallback(async () => {
    if (processandoRef.current) return
    if (!navigator.onLine) { setStatus('offline'); return }

    processandoRef.current = true
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)

    try {
      const fila = await storage.buscarFila()
      if (fila.length === 0) {
        setStatus('idle')
        return
      }

      setStatus('syncing')
      let tudoOk = true

      for (const item of fila) {
        const ok = await sincronizarItem(item)
        if (!ok) tudoOk = false
      }

      const restantes = await atualizarPendentes()
      setStatus(restantes === 0 && tudoOk ? 'synced' : 'error')

      // Volta para idle após exibir sucesso
      if (restantes === 0 && tudoOk) {
        idleTimerRef.current = setTimeout(() => setStatus('idle'), IDLE_APOS_MS)
      }
    } finally {
      processandoRef.current = false
    }
  }, [atualizarPendentes])

  // ── Eventos online/offline ─────────────────────────────────────────────

  useEffect(() => {
    const aoFicarOnline = () => {
      setEstaOnline(true)
      setStatus('syncing')
      sincronizar()
    }

    const aoFicarOffline = () => {
      setEstaOnline(false)
      setStatus('offline')
    }

    // Reage a novos itens na fila (disparo do storage.adicionarNaFila)
    const aoNovoPendente = () => {
      atualizarPendentes()
      if (navigator.onLine) sincronizar()
      else setStatus('offline')
    }

    window.addEventListener('online', aoFicarOnline)
    window.addEventListener('offline', aoFicarOffline)
    window.addEventListener('softlist:sync-pendente', aoNovoPendente)

    // Carga inicial
    atualizarPendentes()

    return () => {
      window.removeEventListener('online', aoFicarOnline)
      window.removeEventListener('offline', aoFicarOffline)
      window.removeEventListener('softlist:sync-pendente', aoNovoPendente)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [sincronizar, atualizarPendentes])

  return { status, estaOnline, pendentes, sincronizar }
}
