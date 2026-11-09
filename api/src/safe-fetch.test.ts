import { beforeEach, expect, test, vi } from 'vitest'
import { FetchPageError } from './errors.ts'
import { parseUrl, resolveAddress } from './safe-fetch.ts'

const { lookupMock } = vi.hoisted(() => ({ lookupMock: vi.fn() }))
vi.mock('node:dns/promises', () => ({ lookup: lookupMock }))

// makes the next DNS lookup answer with these addresses
function dnsAnswers(...addresses: string[]) {
  lookupMock.mockResolvedValue(
    addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 })),
  )
}

beforeEach(() => {
  lookupMock.mockReset()
})

async function failureOf(attempt: () => unknown) {
  try {
    await attempt()
  } catch (err) {
    if (err instanceof FetchPageError) return { status: err.status, message: err.message }
    throw err
  }
  throw new Error('expected it to fail')
}

test.each(['http://example.com/page', 'https://example.com/page?q=1#top'])('accepts %s', (raw) => {
  expect(parseUrl(raw).href).toBe(new URL(raw).href)
})

test.each([
  'ftp://example.com/',
  'file:///etc/passwd',
  'gopher://example.com/',
  'javascript:alert(1)',
  'data:text/html,<p>hi</p>',
])('rejects the scheme in %s', async (raw) => {
  expect(await failureOf(() => parseUrl(raw))).toEqual({
    status: 400,
    message: 'Only http and https URLs are allowed',
  })
})

test.each(['http://user@example.com/', 'http://user:secret@example.com/'])('rejects credentials in %s', async (raw) => {
  expect((await failureOf(() => parseUrl(raw))).status).toBe(400)
})

test.each(['', 'not a url', 'http://', '//example.com'])('rejects the invalid URL %j', async (raw) => {
  expect(await failureOf(() => parseUrl(raw))).toEqual({ status: 400, message: 'That is not a valid URL' })
})

test('resolves a relative redirect against the page it came from', () => {
  const base = new URL('https://example.com/a/b')
  expect(parseUrl('/c', base).href).toBe('https://example.com/c')
  expect(parseUrl('c', base).href).toBe('https://example.com/a/c')
})

test('still checks the scheme and credentials of a redirect target', async () => {
  const base = new URL('https://example.com/')
  expect((await failureOf(() => parseUrl('file:///etc/passwd', base))).status).toBe(400)
  expect((await failureOf(() => parseUrl('https://user:pw@evil.test/', base))).status).toBe(400)
})

test.each([
  ['http://2130706433/', '127.0.0.1'],
  ['http://0x7f.1/', '127.0.0.1'],
  ['http://127.1/', '127.0.0.1'],
  ['http://0177.0.0.1/', '127.0.0.1'],
])('turns the disguised address in %s into %s', (raw, expected) => {
  expect(parseUrl(raw).hostname).toBe(expected)
})

test.each([
  'http://127.0.0.1/',
  'http://2130706433/',
  'http://0x7f.1/',
  'http://[::1]/',
  'http://[::ffff:127.0.0.1]/',
  'http://[::ffff:7f00:1]/',
  'http://169.254.169.254/latest/meta-data/',
  'http://10.0.0.5:8080/',
  'http://192.168.1.1/',
  'http://[fd00::1]/',
])('refuses to resolve the address in %s', async (raw) => {
  expect(await failureOf(() => resolveAddress(parseUrl(raw)))).toEqual({
    status: 403,
    message: 'That address is not allowed',
  })
})

test('gives back a public IPv4 address as it is', async () => {
  expect(await resolveAddress(parseUrl('http://8.8.8.8/'))).toBe('8.8.8.8')
})

test('gives back a public IPv6 address without the brackets', async () => {
  expect(await resolveAddress(parseUrl('http://[2606:4700:4700::1111]/'))).toBe('2606:4700:4700::1111')
})

test('does not ask DNS about an address that is already an IP', async () => {
  await resolveAddress(parseUrl('http://8.8.8.8/'))
  expect(lookupMock).not.toHaveBeenCalled()
})

test('refuses a name that resolves to a private address', async () => {
  dnsAnswers('10.0.0.5')
  expect(await failureOf(() => resolveAddress(parseUrl('http://intranet.example/')))).toEqual({
    status: 403,
    message: 'That address is not allowed',
  })
})

test('refuses localhost and the Docker host name, which resolve to private addresses', async () => {
  dnsAnswers('127.0.0.1', '::1')
  expect((await failureOf(() => resolveAddress(parseUrl('http://localhost:1234/v1/models')))).status).toBe(403)
  dnsAnswers('192.168.65.254')
  expect((await failureOf(() => resolveAddress(parseUrl('http://host.docker.internal:1234/')))).status).toBe(403)
})

test('refuses a name that mixes a public and a private address, whichever comes first', async () => {
  dnsAnswers('93.184.216.34', '10.0.0.5')
  expect((await failureOf(() => resolveAddress(parseUrl('http://mixed.example/')))).status).toBe(403)
  dnsAnswers('10.0.0.5', '93.184.216.34')
  expect((await failureOf(() => resolveAddress(parseUrl('http://mixed.example/')))).status).toBe(403)
})

test('refuses a name with an IPv4-mapped loopback address hidden among the answers', async () => {
  dnsAnswers('93.184.216.34', '::ffff:127.0.0.1')
  expect((await failureOf(() => resolveAddress(parseUrl('http://sneaky.example/')))).status).toBe(403)
})

test('gives back the public address of a name, preferring IPv4', async () => {
  dnsAnswers('2606:2800:220:1::1', '93.184.216.34')
  expect(await resolveAddress(parseUrl('http://example.com/'))).toBe('93.184.216.34')
  dnsAnswers('2606:2800:220:1::1')
  expect(await resolveAddress(parseUrl('http://example.com/'))).toBe('2606:2800:220:1::1')
})

test('reports a name that does not exist', async () => {
  lookupMock.mockRejectedValue(new Error('ENOTFOUND'))
  expect(await failureOf(() => resolveAddress(parseUrl('http://nope.invalid/')))).toEqual({
    status: 502,
    message: 'Could not find that host',
  })
})

test('refuses a name that resolves to nothing', async () => {
  dnsAnswers()
  expect((await failureOf(() => resolveAddress(parseUrl('http://empty.example/')))).status).toBe(403)
})
