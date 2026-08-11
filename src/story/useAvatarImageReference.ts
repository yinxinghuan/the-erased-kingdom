import { useMemo } from 'react'

export interface AvatarImageReference {
  ready: boolean
  refUrl?: string
  prepared: boolean
}

function publicHttpsUrl(value: string): string | undefined {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

/**
 * The Media Service owns the output canvas size. The source avatar is an
 * identity reference only, so keep its original pixels and aspect ratio.
 * Cropping/upscaling it into a scene-shaped plate loses facial evidence and
 * encourages the renderer to copy an artificial reference composition.
 */
export function useAvatarImageReference(
  sourceRefUrl: string | undefined,
  profileReady: boolean,
  _width: number,
  _height: number,
): AvatarImageReference {
  const sourceUrl = useMemo(
    () => sourceRefUrl ? publicHttpsUrl(sourceRefUrl) : undefined,
    [sourceRefUrl],
  )
  return {
    ready: profileReady,
    ...(profileReady && sourceUrl ? { refUrl: sourceUrl } : {}),
    prepared: false,
  }
}
