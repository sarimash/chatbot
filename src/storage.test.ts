import { expect, test, vi } from 'vitest'
import { load, save } from './storage'

test('returns the fallback when nothing is stored', () => {
  expect(load('model', 'none')).toBe('none')
})

test('gives back what was saved', () => {
  const messages = [{ role: 'user', content: 'hi' }]
  save('messages', messages)
  expect(load('messages', [])).toEqual(messages)
})

test('returns the fallback when the stored text is not valid JSON', () => {
  localStorage.setItem('local-chat:model', '{nope')
  expect(load('model', 'none')).toBe('none')
})

test('returns the fallback when reading is blocked', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(load('model', 'none')).toBe('none')
})

test('does not throw when writing fails', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota exceeded')
  })
  expect(() => save('model', 'x')).not.toThrow()
})
