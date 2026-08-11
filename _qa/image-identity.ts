import { buildPlayerIdentityPrompt, MEDIA_PROMPT_CHARACTER_LIMIT } from '../src/story/engine/imageIdentity'
import { theErasedKingdom } from '../src/story/cartridges/theErasedKingdom'

const prompt = buildPlayerIdentityPrompt(theErasedKingdom.opening.imagePrompt.repeat(4), theErasedKingdom)
if (prompt.length > MEDIA_PROMPT_CHARACTER_LIMIT) {
  throw new Error(`identity prompt exceeds service contract: ${prompt.length}`)
}
for (const required of ['SUBJECT A', 'exact complete visible identity', 'sheet ghost', 'MUST NOT be invented', 'silhouette', 'costume', 'CURRENT SCENE']) {
  if (!prompt.includes(required)) throw new Error(`identity prompt lost required contract: ${required}`)
}
if (!prompt.startsWith('HARD FULL-VISUAL-IDENTITY CAST MAP')) throw new Error('identity contract is not front-loaded')
if (!prompt.includes('CURRENT SCENE: cinematic grounded high fantasy')) throw new Error('identity prompt lost the current scene')
if (/\b(?:border courier|courier)\b/i.test(prompt.slice(prompt.indexOf('CURRENT SCENE:')))) throw new Error('identity prompt retained a role-shaped player appearance')
if (prompt.length > 2_400) throw new Error(`identity prompt lost the short-provider contract: ${prompt.length}`)

console.log(`image identity contract passed (${prompt.length}/${MEDIA_PROMPT_CHARACTER_LIMIT} characters)`)
