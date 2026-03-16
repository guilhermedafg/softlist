import axios from 'axios'

const CHAVE_TOKEN = 'softlist_token'

const clienteApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/** Interceptor de requisição: injeta o JWT do localStorage */
clienteApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(CHAVE_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (erro) => Promise.reject(erro),
)

/** Interceptor de resposta: trata 401 fazendo logout e redirecionando */
clienteApi.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    if (erro.response?.status === 401) {
      localStorage.removeItem(CHAVE_TOKEN)
      window.location.href = '/login'
    }
    return Promise.reject(erro)
  },
)

export { CHAVE_TOKEN }
export default clienteApi
