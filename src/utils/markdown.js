import DOMPurify from 'dompurify'
import { marked } from 'marked'

marked.use({
  gfm: true,
  breaks: true,
})

export const renderMarkdown = (source = '') => {
  const html = marked.parse(source || '')
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  })
}
