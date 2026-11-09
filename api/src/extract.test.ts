import { expect, test } from 'vitest'
import { extractText } from './extract.ts'

test('returns the title and the body text', () => {
  const page = extractText('<html><head><title>  My page </title></head><body><p>Hello</p></body></html>')
  expect(page).toEqual({ title: 'My page', text: 'Hello', truncated: false })
})

test('returns an empty title when there is none', () => {
  expect(extractText('<body><p>Hi</p></body>').title).toBe('')
})

test('drops scripts, styles, navigation and other page furniture', () => {
  const html = `
    <html><head><style>.x { color: red }</style><script>var secret = 1</script></head>
    <body>
      <nav>Home About</nav>
      <aside>Related links</aside>
      <noscript>Enable JavaScript</noscript>
      <svg><text>icon</text></svg>
      <iframe>frame</iframe>
      <p>The real content</p>
      <script>alert('x')</script>
      <footer>Copyright</footer>
    </body></html>`
  expect(extractText(html).text).toBe('The real content')
})

test('keeps blocks apart instead of gluing their text together', () => {
  const html = '<h1>Title</h1><p>First</p><p>Second</p><ul><li>one</li><li>two</li></ul>line<br>break'
  expect(extractText(html).text).toBe('Title\nFirst\nSecond\none\ntwo\nline\nbreak')
})

test('collapses runs of spaces and blank lines', () => {
  expect(extractText('<p>a    b\t\tc</p>\n\n\n<p>d</p>').text).toBe('a b c\nd')
})

test('passes plain text through', () => {
  expect(extractText('just some text').text).toBe('just some text')
})

test('cuts long text at the limit and says so', () => {
  const page = extractText(`<p>${'a'.repeat(50)}</p>`, 20)
  expect(page.text).toBe('a'.repeat(20))
  expect(page.truncated).toBe(true)
})

test('does not call text exactly at the limit truncated', () => {
  const page = extractText(`<p>${'a'.repeat(20)}</p>`, 20)
  expect(page.text).toHaveLength(20)
  expect(page.truncated).toBe(false)
})

test('uses a limit of 12000 characters by default', () => {
  const page = extractText(`<p>${'a'.repeat(13_000)}</p>`)
  expect(page.text).toHaveLength(12_000)
  expect(page.truncated).toBe(true)
})
