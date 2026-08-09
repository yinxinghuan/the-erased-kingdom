import { useCallback, useState } from 'react'

const endpoint = 'https://chat.aiwaves.tech/aigram/api/gen-image'

export interface GenImageRequest {
  prompt: string
  ref_url?: string
  requestedSize?: { width: number; height: number }
  profile?: 'fast-small' | 'standard'
}

export function useGenImage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const generate = useCallback(async ({ prompt, ref_url, requestedSize, profile }: GenImageRequest) => {
    setLoading(true); setError(null)
    try {
      // The legacy transit endpoint documents prompt/ref_url only. Keep the
      // desired fast-small contract here so the new model can enable it without
      // changing the story engine. `media_hints=1` is an integration switch.
      const supportsMediaHints = new URLSearchParams(window.location.search).get('media_hints') === '1'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          ...(ref_url ? { ref_url } : {}),
          ...(supportsMediaHints && requestedSize ? { width: requestedSize.width, height: requestedSize.height } : {}),
          ...(supportsMediaHints && profile ? { profile } : {}),
        }),
      })
      if (!response.ok) throw new Error(`image HTTP ${response.status}`)
      const body = await response.json() as { url?: string }
      if (!body.url) throw new Error('image response had no url')
      return body.url
    } catch (cause) {
      const next = cause instanceof Error ? cause : new Error(String(cause)); setError(next); throw next
    } finally { setLoading(false) }
  }, [])
  return { generate, loading, error }
}
