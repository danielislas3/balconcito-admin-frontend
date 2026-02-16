import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { users } from '~~/server/database/schema'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
})

export default defineEventHandler(async (event) => {
  const body = await validateBody(event, loginSchema)
  const db = useDB()

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email))
    .limit(1)

  const user = rows[0]

  if (!user) {
    // Dummy verify to prevent timing side-channel
    const FAKE_HASH = '$2a$12$000000000000000000000uGbykMWzOkB4sOyD6sAyIFdOFx0ZsXXC'
    await verifyPassword(body.password, FAKE_HASH)
    throw createError({ statusCode: 401, message: 'Credenciales incorrectas' })
  }

  const valid = await verifyPassword(body.password, user.encryptedPassword)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Credenciales incorrectas' })
  }

  const authUser: AuthUser = {
    id: user.id.toString(),
    email: user.email,
    name: user.name,
    role: user.role ?? 'admin'
  }

  const { token } = await signJwt(authUser)
  setAuthCookie(event, token)

  return { user: authUser }
})
