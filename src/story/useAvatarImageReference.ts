import { useEffect, useMemo, useState } from 'react'
import { useUpload } from '../shared/runtime/useUpload'

const CACHE_VERSION = 1
const inFlight = new Map<string, Promise<string>>()

export interface AvatarImageReference {
  ready: boolean
  refUrl?: string
  prepared: boolean
}

interface CachedReference {
  version: number
  sourceUrl: string
  width: number
  height: number
  refUrl: string
}

function publicHttpsUrl(value: string): string | undefined {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

function hash(value: string): string {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return (result >>> 0).toString(36)
}

function cacheKey(sourceUrl: string, width: number, height: number): string {
  return `cinematic-avatar-ref-v${CACHE_VERSION}-${hash(`${sourceUrl}|${width}x${height}`)}`
}

function readCachedReference(key: string, sourceUrl: string, width: number, height: number): string | undefined {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return undefined
    const cached = JSON.parse(raw) as CachedReference
    if (cached.version !== CACHE_VERSION || cached.sourceUrl !== sourceUrl || cached.width !== width || cached.height !== height) return undefined
    return publicHttpsUrl(cached.refUrl)
  } catch {
    return undefined
  }
}

function writeCachedReference(key: string, value: CachedReference) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* cache is optional */ }
}

async function decodeImage(blob: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(blob)
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() }
  }
  const objectUrl = URL.createObjectURL(blob)
  const image = new Image()
  image.src = objectUrl
  await image.decode()
  return { source: image, width: image.naturalWidth, height: image.naturalHeight, release: () => URL.revokeObjectURL(objectUrl) }
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => {
    if (blob) resolve(blob)
    else reject(new Error('avatar reference canvas export failed'))
  }, 'image/jpeg', 0.9))
}

async function cropAvatar(sourceUrl: string, width: number, height: number): Promise<Blob> {
  const response = await fetch(sourceUrl, { mode: 'cors', credentials: 'omit', cache: 'force-cache' })
  if (!response.ok) throw new Error(`avatar HTTP ${response.status}`)
  const received = await response.blob()
  const extension = new URL(sourceUrl).pathname.toLowerCase()
  const inferredType = extension.endsWith('.webp') ? 'image/webp'
    : extension.endsWith('.png') ? 'image/png'
      : extension.endsWith('.gif') ? 'image/gif'
        : 'image/jpeg'
  const readable = received.type.startsWith('image/') ? received : new Blob([received], { type: inferredType })
  const decoded = await decodeImage(readable)
  try {
    if (decoded.width < 1 || decoded.height < 1) throw new Error('avatar had no readable pixels')
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas 2D unavailable')

    const sourceRatio = decoded.width / decoded.height
    const targetRatio = width / height
    let sourceWidth = decoded.width
    let sourceHeight = decoded.height
    let sourceX = 0
    let sourceY = 0
    if (sourceRatio > targetRatio) {
      sourceWidth = decoded.height * targetRatio
      sourceX = (decoded.width - sourceWidth) / 2
    } else {
      sourceHeight = decoded.width / targetRatio
      const faceBiasedCenter = decoded.height * 0.44
      sourceY = Math.max(0, Math.min(decoded.height - sourceHeight, faceBiasedCenter - sourceHeight * 0.44))
    }
    context.drawImage(decoded.source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height)
    return await canvasBlob(canvas)
  } finally {
    decoded.release()
  }
}

export function useAvatarImageReference(sourceRefUrl: string | undefined, profileReady: boolean, width: number, height: number): AvatarImageReference {
  const sourceUrl = useMemo(() => sourceRefUrl ? publicHttpsUrl(sourceRefUrl) : undefined, [sourceRefUrl])
  const { upload } = useUpload()
  const [state, setState] = useState<AvatarImageReference>(() => ({ ready: !sourceUrl && profileReady, refUrl: sourceUrl, prepared: false }))

  useEffect(() => {
    if (!profileReady) {
      setState({ ready: false, refUrl: sourceUrl, prepared: false })
      return
    }
    if (!sourceUrl) {
      setState({ ready: true, prepared: false })
      return
    }

    const key = cacheKey(sourceUrl, width, height)
    const cached = readCachedReference(key, sourceUrl, width, height)
    if (cached) {
      setState({ ready: true, refUrl: cached, prepared: true })
      return
    }

    let cancelled = false
    setState({ ready: false, refUrl: sourceUrl, prepared: false })
    let task = inFlight.get(key)
    if (!task) {
      task = cropAvatar(sourceUrl, width, height)
        .then((blob) => upload(blob, `alteru-avatar-reference-${width}x${height}.jpg`))
        .then(({ url }) => {
          const refUrl = publicHttpsUrl(url)
          if (!refUrl) throw new Error('avatar reference upload did not return public HTTPS')
          writeCachedReference(key, { version: CACHE_VERSION, sourceUrl, width, height, refUrl })
          return refUrl
        })
        .finally(() => { inFlight.delete(key) })
      inFlight.set(key, task)
    }
    void task
      .then((refUrl) => { if (!cancelled) setState({ ready: true, refUrl, prepared: true }) })
      .catch((cause) => {
        console.warn('[avatar-reference] wide reference preparation failed; using the original avatar URL', cause)
        if (!cancelled) setState({ ready: true, refUrl: sourceUrl, prepared: false })
      })
    return () => { cancelled = true }
  }, [height, profileReady, sourceUrl, upload, width])

  return state
}
