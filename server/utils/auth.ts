import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'

// ── Types ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

export interface JwtPayloadExtended extends JWTPayload {
  sub: string
  email: string
  name: string
  role: string
  jti: string
}

// ── Cookie constants ───────────────────────────────────────────────────────

export const AUTH_COOKIE = 'auth_token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const JWT_EXPIRY = '7d'

// ── JWT ────────────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const config = useRuntimeConfig()
  const secret = config.jwtSecret
  if (!secret) {
    throw new Error('NUXT_JWT_SECRET is not configured')
  }
  return new TextEncoder().encode(secret)
}

export async function signJwt(user: AuthUser): Promise<{ token: string, jti: string }> {
  const jti = randomUUID()
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    jti
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecret())

  return { token, jti }
}

export async function verifyJwt(token: string): Promise<JwtPayloadExtended> {
  const { payload } = await jwtVerify(token, getSecret())
  return payload as JwtPayloadExtended
}

// ── Cookie helpers ─────────────────────────────────────────────────────────

export function setAuthCookie(event: H3Event, token: string): void {
  setCookie(event, AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: COOKIE_MAX_AGE
  })
}

export function clearAuthCookie(event: H3Event): void {
  deleteCookie(event, AUTH_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  })
}

export function getAuthCookie(event: H3Event): string | undefined {
  return getCookie(event, AUTH_COOKIE)
}

// ── Password verification ──────────────────────────────────────────────────

export async function verifyPassword(
  plaintext: string,
  encryptedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, encryptedPassword)
}
