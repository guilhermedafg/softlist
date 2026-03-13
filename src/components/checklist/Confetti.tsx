import React, { useMemo } from 'react'

interface PropsConfetti {
  ativo: boolean
}

interface Particula {
  id: number
  cor: string
  esquerda: string
  delay: string
  duracao: string
  largura: string
  altura: string
  borderRadius: string
}

// Paleta de confetti alinhada ao tema
const CORES_CONFETTI = [
  '#000000', // preto
  '#D4A574', // caramelo
  '#4CAF50', // sucesso
  '#F8F4E6', // creme
  '#333333', // cinza escuro
  '#D0D0D0', // cinza claro
  '#F44336', // vermelho
  '#F59E0B', // âmbar
]

const gerarParticulas = (qtd: number): Particula[] =>
  Array.from({ length: qtd }, (_, i) => ({
    id: i,
    cor: CORES_CONFETTI[i % CORES_CONFETTI.length],
    esquerda: `${(Math.random() * 96 + 2).toFixed(1)}%`,
    delay: `${(Math.random() * 1.2).toFixed(2)}s`,
    duracao: `${(0.9 + Math.random() * 1.4).toFixed(2)}s`,
    largura: `${6 + Math.floor(Math.random() * 8)}px`,
    altura: `${4 + Math.floor(Math.random() * 10)}px`,
    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
  }))

const Confetti: React.FC<PropsConfetti> = ({ ativo }) => {
  // Gera uma vez (memo) para evitar re-renders caros
  const particulas = useMemo(() => gerarParticulas(72), [])

  if (!ativo) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {particulas.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-12px',
            left: p.esquerda,
            width: p.largura,
            height: p.altura,
            backgroundColor: p.cor,
            borderRadius: p.borderRadius,
            animationName: 'confetti-cair, confetti-balanco',
            animationDuration: `${p.duracao}, ${(parseFloat(p.duracao) * 0.6).toFixed(2)}s`,
            animationDelay: p.delay,
            animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94), ease-in-out',
            animationFillMode: 'forwards',
            animationIterationCount: '1, infinite',
          }}
        />
      ))}
    </div>
  )
}

export default Confetti
