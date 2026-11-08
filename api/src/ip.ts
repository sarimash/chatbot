import { BlockList, isIP } from 'node:net'

const blocked = new BlockList()

// IPv4. IPv4-mapped IPv6 addresses like :ffff:127.0.0.1 are checked against these, too
blocked.addSubnet('0.0.0.0', 8)
blocked.addSubnet('10.0.0.0', 8)
blocked.addSubnet('100.64.0.0', 10) // carrier-grade NAT
blocked.addSubnet('127.0.0.0', 8) // loopback
blocked.addSubnet('169.254.0.0', 16) // link-local, includes the cloud metadata address
blocked.addSubnet('172.16.0.0', 12)
blocked.addSubnet('192.0.0.0', 24)
blocked.addSubnet('192.168.0.0', 16)
blocked.addSubnet('198.18.0.0', 15) // benchmarking
blocked.addSubnet('224.0.0.0', 4) // multicast
blocked.addSubnet('240.0.0.0', 4) // reserved, includes broadcast

blocked.addAddress('::', 'ipv6')
blocked.addAddress('::1', 'ipv6') // loopback
blocked.addSubnet('fc00::', 7, 'ipv6') // unique local
blocked.addSubnet('fe80::', 10, 'ipv6') // link-local
blocked.addSubnet('ff00::', 8, 'ipv6') // multicast
blocked.addSubnet('64:ff9b::', 96, 'ipv6') // NAT64 and 6to4 wrap an IPv4 address inside an IPv6 one
blocked.addSubnet('2002::', 16, 'ipv6')

export function isBlockedAddress(address: string): boolean {
    const family = isIP(address)
    if (family === 0) return true
    return blocked.check(address, family === 6 ? 'ipv6' : 'ipv4')
}