import type { StoryCartridge } from '../types'

export const MEDIA_PROMPT_CHARACTER_LIMIT = 4_000
// The current image provider follows a short, front-loaded identity contract
// much more reliably than a near-limit cast bible appended after the scene.
// Keep this deliberately below the transport ceiling.
const IDENTITY_PROMPT_LIMIT = 2_400

function trimToBudget(value: string, budget: number): string {
  if (value.length <= budget) return value
  const sliced = value.slice(0, Math.max(0, budget))
  const sentence = sliced.match(/^([\s\S]*[.!?])(?:\s|$)/)?.[1]
  return (sentence && sentence.length >= budget * 0.6 ? sentence : sliced).trim()
}

export function buildPlayerIdentityPrompt(prompt: string, cartridge: StoryCartridge): string {
  const aliases = [...(cartridge.playerImageAliases ?? []), 'player-controlled protagonist', 'player protagonist', 'the protagonist']
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)
  const normalizedScene = aliases.reduce((scene, alias) => scene.replace(
    new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
    'SUBJECT A',
  ), prompt)
    .replace(/\b(?:the\s+)?player-controlled\s+SUBJECT A\b/gi, 'SUBJECT A')
    .replace(/\b(?:the\s+)?SUBJECT A\s+(?:is|as)\s+(?:a\s+)?SUBJECT A\b/gi, 'SUBJECT A')
    .replace(/\bthe\s+SUBJECT A\b/gi, 'SUBJECT A')
    .replace(/\b(?:ordinary|unnamed)\s+SUBJECT A\b/gi, 'SUBJECT A')
    .replace(/\b(?:lived-in medieval clothing|natural anatomy)\b,?\s*/gi, '')
  const contract = `HARD FULL-VISUAL-IDENTITY CAST MAP. REFERENCE IMAGE OVERRIDES ALL GENERIC CHARACTER WORDS. SUBJECT A MUST keep the exact complete visible identity of the main foreground subject in the reference—not merely its face. Preserve its silhouette, form or species, body proportions, material, head shape, face visibility, covering, mask, costume, colors, patterns and accessories. Never reinterpret a covering as clothing over a generic human body. Any face, skin, hair, hands, arms or legs not visible in the reference MUST remain hidden and MUST NOT be invented. If hands are absent, stage props beside or against SUBJECT A instead of exposing new hands; every action stays inside the original covering and silhouette. The story role can be performed by a nonhuman, masked, cloth-covered, creature-like or object-like subject, including a sheet ghost. Only pose, camera, background, lighting and rendering style may change. SUBJECT A performs the main action. Do not transfer reference traits to other people, animals or objects.`
  const scenePrefix = ' CURRENT SCENE: '
  const sceneBudget = IDENTITY_PROMPT_LIMIT - contract.length - scenePrefix.length
  return `${contract}${scenePrefix}${trimToBudget(normalizedScene.trim(), sceneBudget)}`.trim()
}
