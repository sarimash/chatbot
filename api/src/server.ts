import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { FetchPageError } from './errors.ts'
import { fetchPage } from './fetch-page.ts'

const PORT = Number(process.env.PORT ?? 3000)
const MAX_BODY_BYTES = 10_000

function send(res: ServerResponse, status: number, body: unknown) {
    res.writeHead(status, { 'Content-Type': 'application/json'})
    res.end(JSON.stringify(body))
}

async function readJson(req: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = []
    let size = 0
    for await (const chunk of req) {
        size += chunk.length
        if (size > MAX_BODY_BYTES) throw new FetchPageError('Request body is too large', 413)
        chunks.push(chunk)
    }
    try {
        return JSON.parse(Buffer.concat(chunks).toString())
    } catch {
        throw new FetchPageError('Request body must be JSON', 400)
    }
}

const server = createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/tools/fetch-page') {
        return send(res, 404, { error: 'Not found' })
    }

    try {
        const body = await readJson(req)
        const url = typeof body === 'object' && body !== null && 'url' in body ? body.url : undefined
        if (typeof url !== 'string') {
            throw new FetchPageError('Send a JSON body like {"url": "https://example.com"}', 400)
        }
        send(res, 200, await fetchPage(url))
    } catch (err) {
        if (err instanceof FetchPageError) return send(res, err.status, { error: err.message })
        console.error(err)
        send(res, 500, { error: 'Something went wrong' })
    }
})

server.listen(PORT, () => console.log(`api listening on ${PORT}`))