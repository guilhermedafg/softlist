import { useState, useEffect, useCallback, useRef } from 'react'
import { notificacoesDb, calcularProximoDisparo } from '../db/notifications'
import type { NotificacaoAgendada } from '../db/notifications'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PermissaoNotificacao = 'default' | 'granted' | 'denied'

export interface ResultadoHook {
  permissao: PermissaoNotificacao
  suportado: boolean
  solicitarPermissao: () => Promise<PermissaoNotificacao>
  agendarParaItem: (params: AgendarParams) => Promise<void>
  cancelarParaItem: (itemId: string) => Promise<void>
  cancelarParaChecklist: (checklistId: string) => Promise<void>
}

export interface AgendarParams {
  checklistId: string
  itemId: string
  tituloChecklist: string
  tituloItem: string
  horario: string        // HH:MM
  diasSemana: string[]
}

// ─── Verificação de suporte ───────────────────────────────────────────────────

const suportado =
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator

// ─── Disparo de notificação via SW ou fallback ────────────────────────────────

async function dispararNotificacao(notif: NotificacaoAgendada): Promise<void> {
  const opts: NotificationOptions = {
    body: notif.tituloItem,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: `softlist-${notif.itemId}`,
    data: { url: `/checklists/${notif.checklistId}/executar` },
    requireInteraction: false,
    silent: false,
  }

  try {
    // Tenta via Service Worker (suporta deep link no click)
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification(notif.tituloChecklist, opts)
  } catch {
    // Fallback: Notification API direta
    if (Notification.permission === 'granted') {
      const n = new Notification(notif.tituloChecklist, opts)
      n.onclick = () => {
        window.focus()
        window.location.href = `/checklists/${notif.checklistId}/executar`
      }
    }
  }
}

// ─── Polling a cada 30s para checar se é hora de disparar ─────────────────────

const INTERVALO_POLL_MS = 30_000

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useNotifications(): ResultadoHook {
  const [permissao, setPermissao] = useState<PermissaoNotificacao>(
    suportado ? (Notification.permission as PermissaoNotificacao) : 'denied',
  )
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Polling para checar e disparar notificações ────────────────────────────

  const checarEDisparar = useCallback(async () => {
    if (!suportado || Notification.permission !== 'granted') return

    try {
      const ativas = await notificacoesDb.listarAtivas()
      const agora = Date.now()

      for (const notif of ativas) {
        const disparo = new Date(notif.proximoDisparo).getTime()

        // Janela de ±35s para evitar perder o disparo entre polls
        if (disparo <= agora + 5000 && disparo >= agora - 35_000) {
          await dispararNotificacao(notif)

          // Recalcula o próximo disparo (recorrência diária/semanal)
          const proximo = calcularProximoDisparo(notif.horario, notif.diasSemana)
          await notificacoesDb.atualizarProximoDisparo(notif.id, proximo.toISOString())
        }
      }
    } catch {
      // Silencioso — IndexedDB pode estar bloqueado
    }
  }, [])

  useEffect(() => {
    if (!suportado || Notification.permission !== 'granted') return

    checarEDisparar()
    pollingRef.current = setInterval(checarEDisparar, INTERVALO_POLL_MS)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [checarEDisparar, permissao])

  // ── Solicitar permissão ────────────────────────────────────────────────────

  const solicitarPermissao = useCallback(async (): Promise<PermissaoNotificacao> => {
    if (!suportado) return 'denied'
    if (Notification.permission === 'granted') {
      setPermissao('granted')
      return 'granted'
    }

    const resultado = await Notification.requestPermission()
    setPermissao(resultado as PermissaoNotificacao)
    return resultado as PermissaoNotificacao
  }, [])

  // ── Agendar notificação para um item ──────────────────────────────────────

  const agendarParaItem = useCallback(async (params: AgendarParams): Promise<void> => {
    if (!suportado || Notification.permission !== 'granted') return

    const proximo = calcularProximoDisparo(params.horario, params.diasSemana)

    // Remove notificação anterior do mesmo item (rescheduling)
    await notificacoesDb.removerPorItem(params.itemId)

    const nova: NotificacaoAgendada = {
      id: crypto.randomUUID(),
      checklistId: params.checklistId,
      itemId: params.itemId,
      tituloChecklist: params.tituloChecklist,
      tituloItem: params.tituloItem,
      horario: params.horario,
      diasSemana: params.diasSemana,
      proximoDisparo: proximo.toISOString(),
      ativa: true,
      criadaEm: new Date().toISOString(),
    }

    await notificacoesDb.salvar(nova)
  }, [])

  // ── Cancelar ──────────────────────────────────────────────────────────────

  const cancelarParaItem = useCallback(async (itemId: string): Promise<void> => {
    await notificacoesDb.removerPorItem(itemId)
  }, [])

  const cancelarParaChecklist = useCallback(async (checklistId: string): Promise<void> => {
    await notificacoesDb.removerPorChecklist(checklistId)
  }, [])

  return {
    permissao,
    suportado,
    solicitarPermissao,
    agendarParaItem,
    cancelarParaItem,
    cancelarParaChecklist,
  }
}
