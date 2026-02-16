import { describe, it, expect } from 'vitest'
import { randomInt, randomFrom } from '~/utils/index'

describe('randomInt', () => {
  it('devuelve un número dentro del rango', () => {
    for (let i = 0; i < 100; i++) {
      const result = randomInt(1, 10)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(10)
    }
  })

  it('devuelve un entero', () => {
    for (let i = 0; i < 50; i++) {
      const result = randomInt(1, 100)
      expect(Number.isInteger(result)).toBe(true)
    }
  })

  it('funciona cuando min === max', () => {
    expect(randomInt(5, 5)).toBe(5)
  })

  it('funciona con rango negativo', () => {
    for (let i = 0; i < 50; i++) {
      const result = randomInt(-10, -1)
      expect(result).toBeGreaterThanOrEqual(-10)
      expect(result).toBeLessThanOrEqual(-1)
    }
  })
})

describe('randomFrom', () => {
  it('devuelve un elemento del array', () => {
    const arr = ['a', 'b', 'c']
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(randomFrom(arr))
    }
  })

  it('funciona con array de un solo elemento', () => {
    expect(randomFrom([42])).toBe(42)
  })

  it('funciona con arrays de distintos tipos', () => {
    const nums = [1, 2, 3]
    expect(nums).toContain(randomFrom(nums))
  })
})
