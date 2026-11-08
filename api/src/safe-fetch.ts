import { FetchPageError } from './errors.ts'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { isBlockedAddress } from './ip.ts'

const bareHost = (url: URL) => url.hostname.replace(/^\[|\]$/g, '')
)

export function parseUrl(raw: string, base?: URL): URL {
    let url: URL
    try {
        url = new URL(raw, base)
    } catch {
        throw new FetchPageError('That is not a valid URL', 400)
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new FetchPageError('Only http and https URLs are allowed', 400)
    }
    if (url.username || url.password) {
        throw new FetchPageError('URLs with a username or password are not allowed')
    }
    return url
}

export async function resolveAddress(url: URL): Promise<string> {
    const host = bareHost(url)

    let addresses: string[]
    if (isIP(host)) {
        addresses = [host]
    } else {
      try {
        addresses = (await lookup(host, { all: true })).map((found) => found.address)
      } catch {
        throw new FetchPageError('Could not find that host', 502)
      }
    }

    // one private address is enough to refuse; a name that mixes public and private ones is suspicious
    if (addresses.length === 0 || addresses.some((address) => isBlockedAddress(address))) {
        throw new FetchPageError('That address is not allowed', 403)
    }
    return addresses.find((address) => isIP(address) === 4) ?? addresses[0]
}

