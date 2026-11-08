import { load } from 'cheerio'

const MAX_CHARS = 12_000

export function extractText(html: string, maxChars = MAX_CHARS) {
    const $ = load(html)
    const title = $('title').first().text().trim()

    $('script, style, noscript, nav, footer, aside, svg, iframe').remove()
    // text() glues neighboring elements together, so put a line break after each block
    $('p, div, li, h1, h2, h3, h4, h5, h6, tr, br').after('\n')
    const text = $('body')
      .text()
      .replace(/[ \t]+/g, ' ')
      .replace(/\s*\n\s*/g, '\n')
      .trim()
    
    if (text.length <= maxChars) return { title, text, truncated: false }
    return { title, text: text.slice(0, maxChars), truncated: true }
}