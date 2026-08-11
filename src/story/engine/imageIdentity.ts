import type { StoryCartridge } from '../types'

export const MEDIA_PROMPT_CHARACTER_LIMIT = 4_000
const SAFE_PROMPT_LIMIT = 3_850

function trimToBudget(value: string, budget: number): string {
  if (value.length <= budget) return value
  const sliced = value.slice(0, Math.max(0, budget))
  const sentence = sliced.match(/^([\s\S]*[.!?])(?:\s|$)/)?.[1]
  return (sentence && sentence.length >= budget * 0.6 ? sentence : sliced).trim()
}

export function buildPlayerIdentityPrompt(prompt: string, cartridge: StoryCartridge): string {
  const role = cartridge.playerImageRole?.trim()
    || 'the player protagonist performing the dominant visible action'
  const exclusions = (cartridge.playerImageExclusions ?? []).filter(Boolean).join('; ')
  const contract = `HARD IDENTITY CAST MAP. PERSON A is the one and only player protagonist: ${role}. The supplied reference face belongs ONLY to PERSON A. Preserve PERSON A's recognizable facial geometry, age presentation, skin tone, hairstyle, facial hair, eyewear and distinctive features. PERSON A is the dominant foreground or midground human performing the main action, with the face naturally readable. Every companion, named NPC, background person, reflection, drawing, statue, mask and creature is a separate identity and must not inherit, resemble, blend with, duplicate or swap with PERSON A.${exclusions ? ` Non-player cast: ${exclusions}.` : ''} Never place the referenced human face on Mara, Oren, Toma, a horse, deer, wolf, beast or other animal. Preserve normal anatomy. Use the reference for identity only: ignore its background, crop, pose, clothing and composition. Adapt wardrobe, action, lighting and camera to the current fictional scene without turning it into a selfie.`
  const sceneBudget = SAFE_PROMPT_LIMIT - contract.length - 2
  return `${trimToBudget(prompt.trim(), sceneBudget)}. ${contract}`.trim()
}
