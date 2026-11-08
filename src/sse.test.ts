import { expect, test } from 'vitest'
import { parseSse } from './sse'

const chunk = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`

test('returns the tokens from complete lines', () => {
  const result = parseSse(chunk('Hel') + chunk('lo'))
  expect(result).toEqual({ tokens: ['Hel', 'lo'], rest: '', done: false })
})

test('hands back a half-received line instead of parsing it', () => {
  const result = parseSse(chunk('Hel') + 'data: {"choices":[{"delta":{"con')
  expect(result.tokens).toEqual(['Hel'])
  expect(result.rest).toBe('data: {"choices":[{"delta":{"con')
})

test('finishes a line that arrived in two pieces', () => {
  const first = parseSse('data: {"choices":[{"delta":{"con')
  const second = parseSse(first.rest + 'tent":"lo"}}]}\n\n')
  expect(second.tokens).toEqual(['lo'])
})

test('stops at [DONE] and ignores anything after it', () => {
  const result = parseSse(chunk('a') + 'data: [DONE]\n\n' + chunk('ignored'))
  expect(result.tokens).toEqual(['a'])
  expect(result.done).toBe(true)
})

test('skips lines that are not data and deltas without content', () => {
  const roleOnly = 'data: {"choices":[{"delta":{"role":"assistant"}}]}\n\n'
  const noChoices = 'data: {"choices":[]}\n\n'
  const result = parseSse(': keep-alive\n\n' + roleOnly + noChoices + chunk('x'))
  expect(result.tokens).toEqual(['x'])
})

test('copes with Windows line endings', () => {
  const result = parseSse('data: {"choices":[{"delta":{"content":"x"}}]}\r\n\r\n')
  expect(result.tokens).toEqual(['x'])
})
