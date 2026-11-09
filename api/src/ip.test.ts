import { expect, test } from 'vitest'
import { isBlockedAddress } from './ip'

test.each([
  '127.0.0.1', '169.254.169.254', '172.31.255.255', '192.168.65.254',
  '::1', 'fd12:3456::1', 'fe80::1',
  '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:a9fe:a9fe', '64:ff9b::7f00:1', '2002:7f00:1::',
  'not an ip', '',
  // ...the full list is in the reference file
])('blocks %s', (address) => {
  expect(isBlockedAddress(address)).toBe(true)
})

test.each([
  '8.8.8.8', '172.15.255.255', '172.32.0.1', '100.63.255.255', '169.253.255.255',
  '2606:4700:4700::1111', '::ffff:8.8.8.8',
])('allows the public address %s', (address) => {
  expect(isBlockedAddress(address)).toBe(false)
})