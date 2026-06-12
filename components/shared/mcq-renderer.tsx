'use client'

import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import remarkMath from 'remark-math'
import remarkBreaks from 'remark-breaks'
import rehypeKatex from 'rehype-katex'

interface MCQRendererProps {
  text: string
}

// Admins embed question figures as base64 (`data:image/...`). react-markdown's
// default URL sanitizer strips `data:` URLs, so allow them through (other URLs
// keep the default sanitization). MCQ content is admin-authored and no raw HTML
// is rendered, so this is safe.
function urlTransform(url: string): string {
  return url.startsWith('data:image/') ? url : defaultUrlTransform(url)
}

export function MCQRenderer({ text }: MCQRendererProps) {
  return (
    <div className="mcq-content">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeKatex]}
        urlTransform={urlTransform}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
