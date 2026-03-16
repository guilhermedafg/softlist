import React from 'react'

interface PropsCard {
  children: React.ReactNode
  className?: string
  aoClicar?: () => void
}

const Card: React.FC<PropsCard> = ({ children, className = '', aoClicar }) => {
  const estaClicavel = Boolean(aoClicar)

  return (
    <div
      onClick={aoClicar}
      role={estaClicavel ? 'button' : undefined}
      tabIndex={estaClicavel ? 0 : undefined}
      onKeyDown={
        estaClicavel
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') aoClicar?.()
            }
          : undefined
      }
      className={[
        'bg-white border border-gray-200 rounded-lg p-6',
        'transition-shadow duration-150 ease-in-out',
        estaClicavel ? 'cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

export default Card
