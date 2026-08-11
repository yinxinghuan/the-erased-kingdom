import { generateImageMedia } from '../src/shared/runtime/media'
import { randomUUID } from 'node:crypto'

const referenceUrl = process.argv[2]
if (!referenceUrl) throw new Error('Usage: tsx _qa/avatar-reference-ab.ts <public-avatar-url>')

const sessionId = '0a86a3a1-9328-406a-955f-8a2a8d7e704c'
const prompt = `Cinematic realistic fantasy adventure scene, vertical 4:5 composition. A lone royal archivist stands in a ruined stone library at blue hour, holding a glowing brass map cylinder while wind lifts loose blank pages around her. Show the protagonist clearly from the waist up, performing the action. The protagonist is exactly the same adult woman as the reference portrait: preserve her facial geometry, warm medium-brown skin, short asymmetrical curly black hair, narrow silver streak at the right temple, amber-brown eyes, round teal eyeglass frames, freckles, and tiny scar above the left eyebrow. Do not transfer her face to any other person. Exactly one visible human. Natural anatomy, cinematic lighting, no text, no letters, no signs, no watermark.`

for (const mode of ['edit', 'avatar'] as const) {
  const startedAt = Date.now()
  const task = await generateImageMedia({
    sessionId,
    requestId: randomUUID(),
    mode,
    prompt,
    referenceUrls: [referenceUrl],
    size: { width: 512, height: 640 },
  }, { pollIntervalMs: 8_000, timeoutMs: 240_000 })
  console.log(JSON.stringify({
    mode,
    elapsedMs: Date.now() - startedAt,
    url: task.media.url,
    width: task.media.width,
    height: task.media.height,
  }))
}
