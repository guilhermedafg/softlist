import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../../store/auth'
import useChecklists from '../../../store/checklists'
import AppShell from '../../../components/layout/AppShell'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'

interface ErrosForm {
  titulo?: string
  descricao?: string
}

const PaginaCriarChecklist: React.FC = () => {
  const navegar = useNavigate()
  const { usuario } = useAuth()
  const { criarChecklist, estaCarregando } = useChecklists()

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [erros, setErros] = useState<ErrosForm>({})
  const [erroServidor, setErroServidor] = useState('')

  const validar = (): boolean => {
    const novosErros: ErrosForm = {}
    if (!titulo.trim()) {
      novosErros.titulo = 'O título é obrigatório.'
    } else if (titulo.trim().length < 3) {
      novosErros.titulo = 'O título deve ter ao menos 3 caracteres.'
    } else if (titulo.trim().length > 100) {
      novosErros.titulo = 'O título deve ter no máximo 100 caracteres.'
    }
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validar() || !usuario?.id) return
    setErroServidor('')

    try {
      const novo = await criarChecklist({
        titulo,
        descricao: descricao.trim() || undefined,
        proprietarioId: usuario.id,
      })
      // Vai direto para o edit para adicionar itens
      navegar(`/checklists/${novo.id}/editar`, { replace: true })
    } catch (err) {
      setErroServidor(err instanceof Error ? err.message : 'Erro ao criar checklist.')
    }
  }

  const totalChars = titulo.length

  return (
    <AppShell titulo="Novo Checklist" rotaVoltar="/checklists" larguraMax="md">
      <div className="max-w-lg">
        {/* Intro */}
        <p className="text-sm text-gray-500 mb-8">
          Dê um nome ao seu checklist. Você poderá adicionar itens na próxima tela.
        </p>

        {erroServidor && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-error font-medium">{erroServidor}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div>
            <Input
              nome="titulo"
              label="Título *"
              placeholder="Ex: Limpeza da Cozinha, Abertura do Caixa..."
              valor={titulo}
              aoMudar={(e) => setTitulo(e.target.value)}
              erro={erros.titulo}
              autoComplete="off"
            />
            <p className="text-xs text-gray-300 mt-1 text-right">{totalChars}/100</p>
          </div>

          <Input
            nome="descricao"
            label="Descrição (opcional)"
            placeholder="Descreva brevemente o propósito deste checklist..."
            valor={descricao}
            aoMudar={(e) => setDescricao(e.target.value)}
            multiline
            linhas={3}
            erro={erros.descricao}
          />

          {/* Preview do nome */}
          {titulo.trim().length >= 3 && (
            <div className="bg-cream border border-gray-200 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 mb-1">Pré-visualização</p>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-success flex-shrink-0" />
                <p className="text-sm font-semibold text-black">{titulo.trim()}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variante="secundario"
              aoClicar={() => navegar('/checklists')}
              desabilitado={estaCarregando}
            >
              Cancelar
            </Button>
            <Button
              tipo="submit"
              variante="primario"
              larguraTotal
              carregando={estaCarregando}
              desabilitado={estaCarregando}
            >
              {estaCarregando ? 'Criando...' : 'Criar e adicionar itens →'}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}

export default PaginaCriarChecklist
