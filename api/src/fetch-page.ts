import { FetchPageError } from './errors.ts'
import { extractText } from './extract.ts'

export async function fetchPage(rawUrl: string) {
    let url: URL
    try {
        url = new URL(rawUrl)
    } catch {
        throw new FetchPageError('That is not a valid URL', 400)
    }

    let res: Response
    try {
        res = await fetch(url)
    } catch {
        throw new FetchPageError('Could not reach that address', 502)
    }
    if (!res.ok) throw new FetchPageError(`The page returned ${res.status}`, 502)

    const type = res.headers.get('content-type') ?? ''
    if (!type.includes('text/html') && !type.includes('text/plain')) {
        throw new FetchPageError('Only HTML and plain text pages are supported', 415)
    }

    return extractText(await res.text())
}