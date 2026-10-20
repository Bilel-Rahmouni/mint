import { useEffect, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import './CareerCv.css'

function inline(text: string, key: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g
  let last = 0
  let index = 0
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > last) nodes.push(text.slice(last, start))
    if (match[1]) {
      nodes.push(<strong key={`${key}-b${index}`}>{match[1]}</strong>)
    } else {
      nodes.push(
        <a key={`${key}-a${index}`} href={match[3]} target="_blank" rel="noreferrer">
          {match[2]}
        </a>,
      )
    }
    last = start + match[0].length
    index += 1
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function blocks(markdown: string): ReactNode[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const nodes: ReactNode[] = []
  let paragraph: string[] = []
  let list: string[] = []
  let key = 0

  const flushParagraph = () => {
    if (!paragraph.length) return
    const text = paragraph.join(' ')
    paragraph = []
    nodes.push(<p key={`p${key}`}>{inline(text, `p${key}`)}</p>)
    key += 1
  }

  const flushList = () => {
    if (!list.length) return
    const items = list
    list = []
    nodes.push(
      <ul key={`l${key}`}>
        {items.map((item, itemIndex) => (
          <li key={itemIndex}>{inline(item, `l${key}-${itemIndex}`)}</li>
        ))}
      </ul>,
    )
    key += 1
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushParagraph()
      flushList()
      continue
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed)
    if (heading) {
      flushParagraph()
      flushList()
      const level = heading[1].length
      const Tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4'
      nodes.push(<Tag key={`h${key}`}>{inline(heading[2], `h${key}`)}</Tag>)
      key += 1
      continue
    }
    if (trimmed.startsWith('- ')) {
      flushParagraph()
      list.push(trimmed.slice(2))
      continue
    }
    flushList()
    paragraph.push(trimmed)
  }
  flushParagraph()
  flushList()
  return nodes
}

export function CareerCv() {
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .careerCv()
      .then(({ markdown: next }) => setMarkdown(next))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load the CV'))
  }, [])

  if (error) return <p className="career-cv__error">{error}</p>
  if (!markdown) return <p className="career-cv__wait">Loading</p>

  return <div className="career-cv">{blocks(markdown)}</div>
}
