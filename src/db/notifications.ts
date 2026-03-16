import { openDB, type IDBPDatabase } from 'idb'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface NotificacaoAgendada {
  id: string
  checklistId: string
  itemId: string
  tituloChecklist: string
  tituloItem: string
  /** ISO string com data+hora exata do próximo disparo */
  proximoDisparo: string
  /** HH:MM original configurado no item */
  horario: string
  /** Dias da semana ex: ['seg','ter'] */
  diasSemana: string[]
  ativa: boolean
  criadaEm: string
}

// ─── DB ───────────────────────────────────────────────────────────────────────

const DB_NOTIF = 'softlist-notifications'
const DB_VERSAO = 1

interface NotifSchema {
  notificacoes: {
    key: string
    value: NotificacaoAgendada
    indexes: { 'by-item': string; 'by-checklist': string }
  }
}

let dbPromise: Promise<IDBPDatabase<NotifSchema>> | null = null

function abrirDB(): Promise<IDBPDatabase<NotifSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<NotifSchema>(DB_NOTIF, DB_VERSAO, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('notificacoes')) {
          const s = db.createObjectStore('notificacoes', { keyPath: 'id' })
          s.createIndex('by-item', 'itemId')
          s.createIndex('by-checklist', 'checklistId')
        }
      },
    })
  }
  return dbPromise
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIAS_JS: Record<string, number> = {
  dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6,
}

/**
 * Calcula a data/hora do próximo disparo para um horário HH:MM
 * e uma lista de diasSemana.
 */
export function calcularProximoDisparo(horario: string, diasSemana: string[]): Date {
  const [hh, mm] = horario.split(':').map(Number)
  const agora = new Date()
  const diasNumericos = diasSemana.includes('todos')
    ? [0, 1, 2, 3, 4, 5, 6]
    : diasSemana.map((d) => DIAS_JS[d] ?? 0)

  // Tenta hoje e os próximos 7 dias
  for (let offset = 0; offset < 8; offset++) {
    const candidato = new Date(agora)
    candidato.setDate(agora.getDate() + offset)
    candidato.setHours(hh, mm, 0, 0)

    if (
      diasNumericos.includes(candidato.getDay()) &&
      candidato.getTime() > agora.getTime()
    ) {
      return candidato
    }
  }

  // Fallback: amanhã no mesmo horário
  const amanha = new Date(agora)
  amanha.setDate(agora.getDate() + 1)
  amanha.setHours(hh, mm, 0, 0)
  return amanha
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const notificacoesDb = {
  async salvar(n: NotificacaoAgendada): Promise<void> {
    const db = await abrirDB()
    await db.put('notificacoes', n)
  },

  async buscarPorItem(itemId: string): Promise<NotificacaoAgendada | undefined> {
    const db = await abrirDB()
    const todas = await db.getAllFromIndex('notificacoes', 'by-item', itemId)
    return todas[0]
  },

  async buscarPorChecklist(checklistId: string): Promise<NotificacaoAgendada[]> {
    const db = await abrirDB()
    return db.getAllFromIndex('notificacoes', 'by-checklist', checklistId)
  },

  async listarAtivas(): Promise<NotificacaoAgendada[]> {
    const db = await abrirDB()
    const todas = await db.getAll('notificacoes')
    return todas.filter((n) => n.ativa)
  },

  async remover(id: string): Promise<void> {
    const db = await abrirDB()
    await db.delete('notificacoes', id)
  },

  async removerPorItem(itemId: string): Promise<void> {
    const db = await abrirDB()
    const notifs = await db.getAllFromIndex('notificacoes', 'by-item', itemId)
    for (const n of notifs) await db.delete('notificacoes', n.id)
  },

  async removerPorChecklist(checklistId: string): Promise<void> {
    const db = await abrirDB()
    const notifs = await db.getAllFromIndex('notificacoes', 'by-checklist', checklistId)
    for (const n of notifs) await db.delete('notificacoes', n.id)
  },

  async atualizarProximoDisparo(id: string, proximoDisparo: string): Promise<void> {
    const db = await abrirDB()
    const notif = await db.get('notificacoes', id)
    if (notif) await db.put('notificacoes', { ...notif, proximoDisparo })
  },
}
