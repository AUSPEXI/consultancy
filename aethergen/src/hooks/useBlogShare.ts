import { useMemo } from 'react'

export type BlogHook = {
  title: string
  url: string
  short: string
  long: string
  hashtags?: string[]
}

export function useBlogShare(title: string, url: string, opts?: { hashtags?: string[]; context?: string }) {
  return useMemo<BlogHook>(() => {
    const hashtags = opts?.hashtags || []
    const short = `${title} — ${url}`
    const long = `${title}\n\n${opts?.context || ''}\n\nRead more: ${url}`.trim()
    return { title, url, short, long, hashtags }
  }, [title, url, opts?.hashtags, opts?.context])
}
