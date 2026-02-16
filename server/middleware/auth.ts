import { eq } from 'drizzle-orm'
import { jwtDenylists } from '~~/server/database/schema'

const PUBLIC_PATHS = [
  '/api/auth/login'
]

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Only protect /api/ routes
  if (!path.startsWith('/api/')) {
    return
  }

  // Allow public endpoints
  if (PUBLIC_PATHS.some(p => path.startsWith(p))) {
    return
  }

  const token = getAuthCookie(event)

  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'No autenticado: se requiere iniciar sesión'
    })
  }

  let payload
  try {
    payload = await verifyJwt(token)
  } catch {
    throw createError({
      statusCode: 401,
      message: 'Sesión inválida o expirada'
    })
  }

  // Check JWT denylist
  const db = useDB()
  const denied = await db
    .select({ id: jwtDenylists.id })
    .from(jwtDenylists)
    .where(eq(jwtDenylists.jti, payload.jti))
    .limit(1)

  if (denied.length > 0) {
    throw createError({
      statusCode: 401,
      message: 'Sesión revocada'
    })
  }

  event.context.user = {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role
  }
})
