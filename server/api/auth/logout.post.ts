import { jwtDenylists } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const token = getAuthCookie(event)

  if (token) {
    try {
      const payload = await verifyJwt(token)
      const db = useDB()
      const now = new Date().toISOString()

      const expDate = payload.exp
        ? new Date(payload.exp * 1000).toISOString()
        : null

      await db.insert(jwtDenylists).values({
        jti: payload.jti,
        exp: expDate,
        createdAt: now,
        updatedAt: now
      }).onConflictDoNothing()
    } catch {
      // Token malformed or expired — still clear the cookie
    }
  }

  clearAuthCookie(event)
  return { ok: true }
})
