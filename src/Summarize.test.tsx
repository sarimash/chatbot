import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import App from './App'

const encoder = new TextEncoder()
const chunk = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`

let pageRequests: { url: string }[]
let chatRequests: { model: string; messages: { role: string; content: string }[] }[]
let push: (text: string) => void
let finish: () => void

// stands in for the api service and LM Studio
function mockServers(pageResponse: () => Response) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      if (url === '/api/models') return Response.json({ data: [{ id: 'qwen-4b' }] })
      if (url === '/tools/fetch-page') {
        pageRequests.push(JSON.parse(init?.body as string))
        return pageResponse()
      }

      chatRequests.push(JSON.parse(init?.body as string))
      let controller!: ReadableStreamDefaultController<Uint8Array>
      const body = new ReadableStream<Uint8Array>({
        start(c) {
          controller = c
          init?.signal?.addEventListener('abort', () => c.error(new DOMException('Aborted', 'AbortError')))
        },
      })
      push = (text) => controller.enqueue(encoder.encode(text))
      finish = () => {
        push('data: [DONE]\n\n')
        controller.close()
      }
      return new Response(body)
    }),
  )
}

async function summarize(address: string) {
  const user = userEvent.setup()
  render(<App />)
  await screen.findByRole('option', { name: 'qwen-4b' })
  await user.click(screen.getByRole('button', { name: 'Summarize Page' }))
  await user.type(screen.getByPlaceholderText('https://example.com/article'), address)
  await user.click(screen.getByRole('button', { name: 'Summarize' }))
  return user
}

beforeEach(() => {
  pageRequests = []
  chatRequests = []
})

test('fetches the page, then streams a summary of its text', async () => {
  mockServers(() => Response.json({ title: 'Sea facts', text: 'The sea is salty.', truncated: false }))
  await summarize('https://example.com/sea')

  await waitFor(() => expect(chatRequests).toHaveLength(1))
  expect(pageRequests).toEqual([{ url: 'https://example.com/sea' }])
  expect(chatRequests[0].messages[0].role).toBe('system')
  expect(chatRequests[0].messages[1]).toEqual({ role: 'user', content: 'Sea facts\n\nThe sea is salty.' })

  push(chunk('The sea '))
  push(chunk('has salt.'))
  await screen.findByText('The sea has salt.')
  expect(screen.getByText('Sea facts')).toBeTruthy()
  finish()
  await screen.findByRole('button', { name: 'Summarize' })
})

test('says so when only the start of a long page was used', async () => {
  mockServers(() => Response.json({ title: 'Long', text: 'a'.repeat(50), truncated: true }))
  await summarize('https://example.com/long')
  await screen.findByText(/only the first part was summarized/)
})

test('shows the page fetcher\'s error and never calls the model', async () => {
  mockServers(() => Response.json({ error: 'That address is not allowed' }, { status: 403 }))
  await summarize('http://127.0.0.1/')

  await screen.findByText('That address is not allowed')
  expect(chatRequests).toHaveLength(0)
  await screen.findByRole('button', { name: 'Summarize' })
})

test('explains when the api service itself cannot be reached', async () => {
  mockServers(() => new Response('<html>502 Bad Gateway</html>', { status: 502 }))
  await summarize('https://example.com/')
  await screen.findByText("Can't reach the page fetcher. Is the api service running?")
})

test('Stop keeps the summary so far and shows no error', async () => {
  mockServers(() => Response.json({ title: 'T', text: 'body', truncated: false }))
  const user = await summarize('https://example.com/')
  await waitFor(() => expect(chatRequests).toHaveLength(1))
  push(chunk('Partial summary'))
  await screen.findByText('Partial summary')

  await user.click(screen.getByRole('button', { name: 'Stop' }))
  await screen.findByRole('button', { name: 'Summarize' })
  expect(screen.getByText('Partial summary')).toBeTruthy()
  expect(document.querySelector('.text-red-600')).toBeNull()
})
