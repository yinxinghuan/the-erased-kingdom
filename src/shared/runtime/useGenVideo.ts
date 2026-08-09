import { useCallback, useState } from 'react'

const submitEndpoint = 'https://u545921-b746-8a491f44.westc.seetacloud.com:8443/video'
const pollEndpoint = 'https://u545921-b746-8a491f44.westc.seetacloud.com:8443/video_task'

interface VideoPayload {
  status?: string
  url?: string
  task_id?: string
  data?: { status?: string; url?: string; task_id?: string }
}

export interface GenVideoRequest {
  firstFrameUrl: string
  lastFrameUrl: string
  prompt: string
  duration?: 5 | 10
  taskId?: string
}

export interface GenVideoResult { url: string; taskId: string }

function readTaskId(payload: VideoPayload): string { return payload.task_id ?? payload.data?.task_id ?? '' }
function readStatus(payload: VideoPayload): string { return payload.status ?? payload.data?.status ?? '' }
function readUrl(payload: VideoPayload): string { return payload.url ?? payload.data?.url ?? '' }

async function post(url: string, params: Record<string, unknown>, signal: AbortSignal): Promise<VideoPayload> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '', params }),
    signal,
  })
  if (!response.ok) throw new Error(`video HTTP ${response.status}`)
  return response.json() as Promise<VideoPayload>
}

export function useGenVideo() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const generate = useCallback(async ({ firstFrameUrl, lastFrameUrl, prompt, duration = 5, taskId: existingTaskId }: GenVideoRequest): Promise<GenVideoResult> => {
    setLoading(true)
    setError(null)
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 30 * 60 * 1000)
    try {
      let taskId = existingTaskId ?? ''
      if (!taskId) {
        const submitted = await post(submitEndpoint, {
          image_url: firstFrameUrl,
          end_image_url: lastFrameUrl,
          prompt,
          env: 'prod',
          target_image_ratio: '4x3',
          video_time: duration,
        }, controller.signal)
        taskId = readTaskId(submitted)
        if (!taskId) throw new Error('video response had no task id')
      }
      const deadline = Date.now() + 30 * 60 * 1000
      while (Date.now() < deadline) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, 10_000))
        const result = await post(pollEndpoint, { task_id: taskId }, controller.signal)
        const status = readStatus(result)
        if (status === 'success') {
          const url = readUrl(result)
          if (!url) throw new Error('video completed without a url')
          return { url, taskId }
        }
        if (status === 'failed') throw new Error('video generation failed')
      }
      throw new Error('video generation timed out')
    } catch (cause) {
      const next = cause instanceof Error ? cause : new Error(String(cause))
      setError(next)
      throw next
    } finally {
      window.clearTimeout(timeout)
      setLoading(false)
    }
  }, [])
  return { generate, loading, error }
}
