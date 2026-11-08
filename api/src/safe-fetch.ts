import { FetchPageError } from './errors.ts'

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