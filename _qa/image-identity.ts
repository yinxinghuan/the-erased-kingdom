import { buildPlayerIdentityPrompt, MEDIA_PROMPT_CHARACTER_LIMIT } from '../src/story/engine/imageIdentity'
import { theErasedKingdom } from '../src/story/cartridges/theErasedKingdom'

const prompt = buildPlayerIdentityPrompt(theErasedKingdom.opening.imagePrompt.repeat(4), theErasedKingdom)
if (prompt.length > MEDIA_PROMPT_CHARACTER_LIMIT) {
  throw new Error(`identity prompt exceeds service contract: ${prompt.length}`)
}
for (const required of ['PERSON A', 'reference face belongs ONLY', 'Mara', 'identity only']) {
  if (!prompt.includes(required)) throw new Error(`identity prompt lost required contract: ${required}`)
}
if (!prompt.startsWith(theErasedKingdom.opening.imagePrompt.slice(0, 80))) {
  throw new Error('identity prompt lost the current scene before the cast contract')
}

console.log(`image identity contract passed (${prompt.length}/${MEDIA_PROMPT_CHARACTER_LIMIT} characters)`)
