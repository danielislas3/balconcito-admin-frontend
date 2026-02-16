import { describe, it, expect, vi, beforeAll } from 'vitest'
import { signJwt, verifyJwt, verifyPassword } from '~~/server/utils/auth'

// Mock useRuntimeConfig para que getSecret() funcione
vi.stubGlobal('useRuntimeConfig', () => ({
  jwtSecret: 'test-secret-key-at-least-32-chars!'
}))

describe('signJwt + verifyJwt', () => {
  const testUser = {
    id: 'user-1',
    email: 'daniel@balconcito.com',
    name: 'Daniel',
    role: 'admin'
  }

  it('firma y verifica un JWT correctamente', async () => {
    const { token, jti } = await signJwt(testUser)

    expect(token).toBeTruthy()
    expect(typeof token).toBe('string')
    expect(jti).toBeTruthy()

    const payload = await verifyJwt(token)

    expect(payload.sub).toBe('user-1')
    expect(payload.email).toBe('daniel@balconcito.com')
    expect(payload.name).toBe('Daniel')
    expect(payload.role).toBe('admin')
    expect(payload.jti).toBe(jti)
  })

  it('genera un jti único por cada llamada', async () => {
    const result1 = await signJwt(testUser)
    const result2 = await signJwt(testUser)

    expect(result1.jti).not.toBe(result2.jti)
    expect(result1.token).not.toBe(result2.token)
  })

  it('rechaza un token inválido', async () => {
    await expect(verifyJwt('invalid-token')).rejects.toThrow()
  })

  it('rechaza un token con firma incorrecta', async () => {
    // Token firmado con otra clave
    const { token } = await signJwt(testUser)
    const tampered = token.slice(0, -5) + 'xxxxx'

    await expect(verifyJwt(tampered)).rejects.toThrow()
  })

  it('el payload incluye exp e iat', async () => {
    const { token } = await signJwt(testUser)
    const payload = await verifyJwt(token)

    expect(payload.iat).toBeDefined()
    expect(payload.exp).toBeDefined()
    expect(payload.exp!).toBeGreaterThan(payload.iat!)
  })
})

describe('verifyPassword', () => {
  // Pre-computed bcrypt hash for "password123" with cost 10
  const knownHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

  it('verifica password correcto contra hash conocido', async () => {
    // Generamos un hash fresco para evitar dependencia del hash hardcodeado
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('miPassword123', 10)
    const result = await verifyPassword('miPassword123', hash)

    expect(result).toBe(true)
  })

  it('rechaza password incorrecto', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('correctPassword', 10)
    const result = await verifyPassword('wrongPassword', hash)

    expect(result).toBe(false)
  })

  it('maneja strings vacíos sin crashear', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('algo', 10)
    const result = await verifyPassword('', hash)

    expect(result).toBe(false)
  })
})
