/**
 * Paleta de cores do SoftList.
 * Usada como referência. Os estilos principais são aplicados via Tailwind CSS.
 */
export const CORES = {
  PRETO: '#000000',
  BRANCO: '#FFFFFF',
  CINZA_50: '#F9F9F9',
  CINZA_100: '#F5F5F5',
  CINZA_200: '#E8E8E8',
  CINZA_300: '#D0D0D0',
  CINZA_500: '#666666',
  CINZA_700: '#333333',
  CREME: '#F8F4E6',
  CARAMELO: '#D4A574',
  SUCESSO: '#4CAF50',
  ERRO: '#F44336',
} as const

export type CorChave = keyof typeof CORES
export type CorValor = (typeof CORES)[CorChave]
