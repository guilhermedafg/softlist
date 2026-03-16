import { openDB, type IDBPDatabase } from 'idb'

const DB_NOME = 'softlist-db'
const DB_VERSAO = 1

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface FotoArmazenada {
  id: string
  execucaoId: string
  itemId: string
  dataUrl: string        // base64 JPEG comprimida
  tamanhoBytes: number
  capturadaEm: string
}

export interface FilaSyncItem {
  id: string
  execucaoId: string
  tentativas: number
  criadoEm: string
}

// ─── Tipos do banco ──────────────────────────────────────────────────────────

interface SoftlistSchema {
  fotos: {
    key: string
    value: FotoArmazenada
    indexes: { 'by-execucao': string; 'by-item': string }
  }
  'fila-sync': {
    key: string
    value: FilaSyncItem
    indexes: { 'by-execucao': string }
  }
}

// ─── Abertura do banco ───────────────────────────────────────────────────────

let dbPromise: Promise<IDBPDatabase<SoftlistSchema>> | null = null

function abrirBanco(): Promise<IDBPDatabase<SoftlistSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<SoftlistSchema>(DB_NOME, DB_VERSAO, {
      upgrade(db) {
        // Store de fotos
        if (!db.objectStoreNames.contains('fotos')) {
          const storeFotos = db.createObjectStore('fotos', { keyPath: 'id' })
          storeFotos.createIndex('by-execucao', 'execucaoId')
          storeFotos.createIndex('by-item', 'itemId')
        }
        // Store de fila de sincronização
        if (!db.objectStoreNames.contains('fila-sync')) {
          const storeSync = db.createObjectStore('fila-sync', { keyPath: 'id' })
          storeSync.createIndex('by-execucao', 'execucaoId')
        }
      },
    })
  }
  return dbPromise
}

// ─── API de storage ──────────────────────────────────────────────────────────

export const storage = {
  // ── Fotos ────────────────────────────────────────────────────────────────

  async salvarFoto(foto: FotoArmazenada): Promise<void> {
    const db = await abrirBanco()
    await db.put('fotos', foto)
  },

  async buscarFoto(id: string): Promise<FotoArmazenada | undefined> {
    const db = await abrirBanco()
    return db.get('fotos', id)
  },

  async buscarFotosPorExecucaoEItem(
    execucaoId: string,
    itemId: string,
  ): Promise<FotoArmazenada[]> {
    const db = await abrirBanco()
    const todas = await db.getAllFromIndex('fotos', 'by-execucao', execucaoId)
    return todas.filter((f) => f.itemId === itemId)
  },

  async buscarFotosPorExecucao(execucaoId: string): Promise<FotoArmazenada[]> {
    const db = await abrirBanco()
    return db.getAllFromIndex('fotos', 'by-execucao', execucaoId)
  },

  async removerFoto(id: string): Promise<void> {
    const db = await abrirBanco()
    await db.delete('fotos', id)
  },

  // ── Fila de sync ─────────────────────────────────────────────────────────

  async adicionarNaFila(execucaoId: string): Promise<void> {
    const db = await abrirBanco()
    // Evita duplicatas: verifica se já existe para essa execução
    const existentes = await db.getAllFromIndex('fila-sync', 'by-execucao', execucaoId)
    if (existentes.length === 0) {
      await db.put('fila-sync', {
        id: crypto.randomUUID(),
        execucaoId,
        tentativas: 0,
        criadoEm: new Date().toISOString(),
      })
    }
    // Dispara evento para o hook de sync reagir imediatamente
    window.dispatchEvent(new CustomEvent('softlist:sync-pendente', { detail: { execucaoId } }))
  },

  async buscarFila(): Promise<FilaSyncItem[]> {
    const db = await abrirBanco()
    return db.getAll('fila-sync')
  },

  async removerDaFila(id: string): Promise<void> {
    const db = await abrirBanco()
    await db.delete('fila-sync', id)
  },

  async atualizarTentativas(id: string, tentativas: number): Promise<void> {
    const db = await abrirBanco()
    const item = await db.get('fila-sync', id)
    if (item) await db.put('fila-sync', { ...item, tentativas })
  },

  async contarPendentes(): Promise<number> {
    const db = await abrirBanco()
    return db.count('fila-sync')
  },
}
