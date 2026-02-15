export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const railsBase = config.railsApiUrl

  // Construir URL destino: /api/v1/expenses → http://rails:3001/api/v1/expenses
  const targetUrl = `${railsBase}${event.path}`

  return proxyRequest(event, targetUrl)
})
