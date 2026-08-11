import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { callAigramAPI, isInAigramNow, getTelegramId, type AigramResponse } from '../shared/runtime/bridge'

interface ProfileData { name?: string; user_name?: string; head_url?: string }

export interface PlayerProfile {
  name: string
  avatarUrl: string
  imageRefUrl?: string
  loaded: boolean
  source: 'debug' | 'aigram' | 'default'
}

function publicHttpsUrl(value: string): string | undefined {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : undefined } catch { return undefined }
}

export function usePlayerProfile(): PlayerProfile {
  const query = useMemo(() => new URLSearchParams(window.location.search), [])
  const debugAvatar = query.get('avatar_url')?.trim() || ''
  const debugName = query.get('user_name')?.trim() || ''
  const fallbackAvatar = new URL('./alteru-default-avatar.jpg', document.baseURI).href
  const [profile, setProfile] = useState<PlayerProfile>(() => ({
    name: debugName || 'AlterU',
    avatarUrl: debugAvatar || fallbackAvatar,
    imageRefUrl: publicHttpsUrl(debugAvatar),
    // Give the host bridge a short bootstrap window. Marking the default
    // profile ready on the very first render can start the opening image before
    // Aigram has exposed the real player identity.
    loaded: Boolean(debugAvatar),
    source: debugAvatar || debugName ? 'debug' : 'default',
  }))
  const resolvedPlayerId = useRef<string | null>(null)
  const loadingPlayerId = useRef<string | null>(null)

  const refreshProfile = useCallback(async () => {
    if (!isInAigramNow()) return false
    const playerId = getTelegramId()
    if (!playerId || loadingPlayerId.current === playerId) return false
    if (resolvedPlayerId.current === playerId) return true
    loadingPlayerId.current = playerId
    setProfile((current) => ({ ...current, loaded: false }))
    try {
      const response = await callAigramAPI<AigramResponse<ProfileData>>(
        `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(playerId)}`,
        'GET',
      )
      const data = response?.data
      const platformAvatar = data?.head_url?.trim() || ''
      const chosenAvatar = debugAvatar || platformAvatar
      resolvedPlayerId.current = playerId
      setProfile({
        name: debugName || data?.name?.trim() || data?.user_name?.trim() || 'AlterU',
        avatarUrl: chosenAvatar || fallbackAvatar,
        imageRefUrl: publicHttpsUrl(chosenAvatar),
        loaded: true,
        source: debugAvatar || debugName ? 'debug' : platformAvatar ? 'aigram' : 'default',
      })
      return true
    } catch {
      setProfile((current) => ({ ...current, loaded: true }))
      return false
    } finally {
      if (loadingPlayerId.current === playerId) loadingPlayerId.current = null
    }
  }, [debugAvatar, debugName, fallbackAvatar])

  useEffect(() => {
    let cancelled = false
    let attempts = 0
    const check = () => {
      if (cancelled) return
      void refreshProfile()
    }

    check()
    const bootstrap = window.setInterval(() => {
      attempts += 1
      check()
      if (attempts >= 20 || resolvedPlayerId.current) window.clearInterval(bootstrap)
    }, 500)
    // External visitors must not wait indefinitely for a bridge that does not
    // exist. If Aigram appears later, message/focus listeners below still
    // replace the fallback before the next generated scene.
    const fallbackReady = window.setTimeout(() => {
      if (!cancelled && !isInAigramNow()) {
        setProfile((current) => ({ ...current, loaded: true }))
      }
    }, 10_500)
    const onVisibility = () => { if (!document.hidden) check() }
    window.addEventListener('message', check)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      window.clearInterval(bootstrap)
      window.clearTimeout(fallbackReady)
      window.removeEventListener('message', check)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refreshProfile])

  return profile
}
