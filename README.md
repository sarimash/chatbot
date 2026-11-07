# Chatbot

A small chatt app that talks to a language model running on your own local machine through [LM Studio](https://lmstudio.ai)'s OpenAI-compatible API. Replies stream in token-by-token, and nothing leaves your computer.

## Features

- Streaming replies, with a Stop button that cancels the request
- Model picker (embedding models are hidden)
- Editable system prompt, sent with every request but kept out of the chat history
- Conversation, selected model and system prompt are remembered across reloads
- Clear messages when LM Studio is unreachable or has no model loaded

## How it works
```mermaid
flowchart LR
  browser["Browser (React app)"] -->|"localhost:8080"| nginx
  subgraph docker["Docker container"]
    nginx["nginx: serves the build, proxies /api/"]
  end
  nginx -->|"host.docker.internal:1234/v1/ (streamed)"| lms["LM Studio on the host"]
```

The browser only talks to nginx. nginx serves the built React and forwards `/api/*` to LM Studio's `/v1/*`, with `proxy_buffering off` so tokens reach the browser as they are generated.

- **Streaming:** `fetch` with `stream: true`, read through a `ReadableStream` reader. Lines are parsed in `src/sse.ts`, which hands back any half-received line to be joined with the next chunk.
- **Stop:** an `AbortController` cancels the request. Text that has already arrived is kept.
- **System prompt:** added to each request on the way out, never stored with the messages.

## Run it with Docker

1. Start LM Studio's server and load a model (see [Windows setup notes](#windows-setup-notes)).
2. From this folder:

  ```
  docker compose up --build
  ```
3. Open http://localhost:8080 .

## Run it for development
Needs Node 22.
```
npm install
npm run dev
```

Open http://localhost:5173 . The Vite dev server proxies `/api` to LM Studio on `127.0.0.1:1234`, the same way nginx does in Docker. 
`npm run build` type-checks and builds, and `npm run lint` fails on any warning.