import { FetchPageError } from './errors.ts'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { isBlockedAddress } from './ip.ts'
import { request as httpRequest, type IncomingMessage } from 'node:http'
import { request as httpsRequest, type RequestOptions } from 'node:https'

const TIMEOUT_MS = 10_000
const MAX_REDIRECTS = 3
const MAX_BYTES = 2 * 1024 * 1024

const bareHost = (url: URL) => url.hostname.replace(/^\[|\]$/g, '')

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
        throw new FetchPageError('URLs with a username or password are not allowed', 400)
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

// connect to the address we already checked, so a second DNS server can't swap in a private one
function get(url: URL, address: string, signal: AbortSignal): Promise<IncomingMessage> {
    const isHttps = url.protocol === 'https:'
    const options: RequestOptions = {
        host: address,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        headers: {
            Host: url.host,
            'User-Agent': 'chatbot-summarizer',
            Accept: 'text/html,text/plain;q=0.9',
            'Accept-Encoding': 'identity',
        },
        // The certificate is checked against the name in the URL, not the IP
        servername: isIP(bareHost(url)) ? undefined : bareHost(url),
        signal,
    }

    return new Promise((resolve, reject) => {
        const req = isHttps ? httpsRequest(options, resolve) : httpRequest(options, resolve)
        req.on('error', () => {
            if (signal.aborted) reject(new FetchPageError('The page took too long to respond', 504))
            else reject(new FetchPageError('Could not reach that address', 502))
        })
        req.end()
    })
}

const tooLarge = () => new FetchPageError('The page is larger than 2 MB', 413)

async function readText(res: IncomingMessage, signal: AbortSignal): Promise<string> {
    const type = (res.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase()
    if (type !== 'text/html' && type !== 'text/plain') {
        res.destroy()
        throw new FetchPageError('Only HTML and plain text pages are supported', 415)
    }

    const encoding = res.headers['content-encoding']
    if (encoding && encoding !== 'identity') {
        res.destroy()
        throw new FetchPageError('Compressed responses are not supported', 415)
    }

    if (Number(res.headers['content-length']) > MAX_BYTES) {
        res.destroy()
        throw tooLarge()
    }

    const chunks: Buffer[] = []
    let size = 0
    try {
        for await (const chunk of res) {
            size += chunk.length
            if (size > MAX_BYTES) {
                res.destroy()
                throw tooLarge()
            }
            chunks.push(chunk)
        }
    } catch (err) {
        if (err instanceof FetchPageError) throw err
        if (signal.aborted) throw new FetchPageError('The page took too long to respond', 504)
        throw new FetchPageError('The connection was cut off', 502)
    }
    return Buffer.concat(chunks).toString('utf-8')
}

export async function safeFetch(rawUrl: string): Promise<string> {
    const signal = AbortSignal.timeout(TIMEOUT_MS)
    const url = parseUrl(rawUrl)

    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
        // every redirect checked from scratch, so a bad url can't sneak in via redirect
        const address = await resolveAddress(url)
        const res = await get(url, address, signal)
        const status = res.statusCode ?? 0

        if (status >= 300 && status < 400 && res.headers.location) {
            res.resume()
            url = parseUrl(res.headers.location, url)
            continue
        }
        if (status < 200 || status >= 300) {
            res.resume()
            throw new FetchPageError(`The page returned ${status}`, 502)
        }
        return readText(res)
    }

    throw new FetchPageError('Too many redirects', 502)
}