import { useCallback, useState } from 'react'

const endpoint = 'https://chat.aiwaves.tech/aigram/api/upload'

export interface UploadResult {
  url: string
  pathname: string
  contentType: string
}

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const upload = useCallback(async (file: Blob, filename = 'upload.bin'): Promise<UploadResult> => {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file, filename)
      const response = await fetch(endpoint, { method: 'POST', body: form })
      if (!response.ok) throw new Error(`upload HTTP ${response.status}`)
      const body = await response.json() as UploadResult
      if (!body.url) throw new Error('upload response had no url')
      return body
    } catch (cause) {
      const next = cause instanceof Error ? cause : new Error(String(cause))
      setError(next)
      throw next
    } finally {
      setUploading(false)
    }
  }, [])

  return { upload, uploading, error }
}
