import React from 'react'
import type { DiaSemana } from '../../db/schema'
import { LABEL_DIA } from '../../db/schema'

const DIAS_ORDENADOS: DiaSemana[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']

interface PropsDayOfWeekSelector {
  valor: DiaSemana[]
  aoMudar: (dias: DiaSemana[]) => void
  erro?: string
}

const DayOfWeekSelector: React.FC<PropsDayOfWeekSelector> = ({ valor, aoMudar, erro }) => {
  const todosSelecionados =
    valor.includes('todos') ||
    DIAS_ORDENADOS.every((d) => valor.includes(d))

  const toggleTodos = () => {
    aoMudar(todosSelecionados ? [] : ['todos'])
  }

  const toggleDia = (dia: DiaSemana) => {
    // Se "todos" está selecionado, expandir para dias individuais e remover o clicado
    if (valor.includes('todos')) {
      aoMudar(DIAS_ORDENADOS.filter((d) => d !== dia))
      return
    }

    const novoValor = valor.includes(dia)
      ? valor.filter((d) => d !== dia)
      : [...valor, dia]

    // Se todos os individuais estiverem selecionados, colapsar para 'todos'
    if (DIAS_ORDENADOS.every((d) => novoValor.includes(d))) {
      aoMudar(['todos'])
    } else {
      aoMudar(novoValor)
    }
  }

  const isDiaSelecionado = (dia: DiaSemana) =>
    todosSelecionados || valor.includes(dia)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-700">
        Dias da semana
      </label>

      <div className="flex flex-wrap gap-1.5">
        {/* Botão Todos */}
        <button
          type="button"
          onClick={toggleTodos}
          className={[
            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-100',
            'border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-black',
            todosSelecionados
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400',
          ].join(' ')}
        >
          Todos
        </button>

        {/* Dias individuais */}
        {DIAS_ORDENADOS.map((dia) => (
          <button
            key={dia}
            type="button"
            onClick={() => toggleDia(dia)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-100',
              'border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-black',
              isDiaSelecionado(dia)
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400',
            ].join(' ')}
          >
            {LABEL_DIA[dia]}
          </button>
        ))}
      </div>

      {erro && <p className="text-xs text-error font-medium">! {erro}</p>}
    </div>
  )
}

export default DayOfWeekSelector
