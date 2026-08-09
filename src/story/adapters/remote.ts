import type { AdapterResult, StoryAdapter } from '../types'
import { t } from '../i18n'
import { extractSceneImagePrompt, extractSceneImageSubject } from '../engine/protocol'
import { buildWorldContext, partyContinuityContract, storyDirectorContract } from '../engine/worldContext'
import { dangerDirectiveContract } from '../engine/dangerDirector'

const endpoint = import.meta.env.VITE_STORY_API_ORIGIN || 'https://uu545921-zfkm-aec62664.westb.seetacloud.com:8443'

function decodeEvent(chunk: string): { event?: string; data?: unknown } | null {
  const lines = chunk.split('\n')
  const event = lines.find((line) => line.startsWith('event:'))?.slice(6).trim()
  const raw = lines.filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('\n')
  if (!raw) return null
  try { return { event, data: JSON.parse(raw) } } catch { return { event, data: raw } }
}

export const remoteAdapter: StoryAdapter = {
  id: 'remote',
  async send(action, context, onProgress): Promise<AdapterResult> {
    const chatId = context.save.remoteChatId || new URLSearchParams(window.location.search).get('chat_id')
    if (!chatId) throw new Error(t(context.locale, 'remoteMissing'))
    const sceneImageDirection = context.cartridge.sceneImageDirection ?? `${context.cartridge.theme.material} story-world editorial illustration`
    const sceneImageAvoid = context.cartridge.sceneImageAvoid?.trim()
    const imageTarget = context.cartridge.mediaDirector?.imageTarget ?? { width: 640, height: 360 }
    const imageFrame = imageTarget.height > imageTarget.width ? '4:5 portrait, center-safe for responsive full-bleed crop' : '16:9 widescreen'
    const imageFreshness = `Make it a fresh shot of the CURRENT visible event: current location first, then one dominant action, visible subjects, and a concrete camera scale or angle. Use at most two focal subjects and no montage. Never carry over the cover/opening composition, landmarks, foreground props, weather, vehicle, crossroads, room or skyline unless the current prose explicitly contains them.${sceneImageAvoid ? ` Opening residue to avoid unless explicitly present now: ${sceneImageAvoid}.` : ''}`
    const languageInstruction = context.locale === 'en'
      ? `\n\n[LANGUAGE AND FORMAT: Reply in English. Keep every protocol command tag and its syntax intact. End every response, including a genuine chapter checkpoint, with exactly three actions in this exact machine-readable form: [choices: "Action one"|"Action two"|"Action three"]. Button actions must match the decisions described in the prose. Inventory is transactional: whenever prose says the player obtains, stores, gives away, loses, discards, or consumes an item, emit the matching [inventory: action="add|remove" ...] command in the same response; merely seeing an item is not ownership. Record only durable, player-confirmed quest truths with [fact: id="stable-lowercase-id" value="true|false|number|short value"]. Reuse ids and never change a saved fact without a visible event. Use [true_ending: reason="..."] only after the player deliberately starts the final irreversible resolution; ordinary chapter pauses still use session_end. For a visually distinctive new place, discovery, relationship turn, major result, or checkpoint, propose one English scene prompt using [image_prompt: "cinematic visible scene, no text, no UI, ${imageFrame}"], immediately followed by [image_subject: "player|environment|others"]. Use player whenever the player protagonist is visible anywhere in the frame, including a wide shot, and always when they perform the dominant action; environment means no person, others means people without the player. Depict only visible established facts and follow this art direction: ${sceneImageDirection}. ${imageFreshness} Skip routine conversation.]`
      : `\n\n[语言与格式要求：请用简体中文回复，并保持所有协议命令标签及语法不变。每次回复（包括真正的章节节点）都必须在结尾用这一机器可读格式给出恰好三个行动：[choices: "行动一"|"行动二"|"行动三"]。按钮行动必须与正文描述的决定一致。物品状态必须与叙事同步：正文只要明确说玩家获得、收下、装入、交出、失去、丢弃或消耗了物品，同一回复就必须输出对应的 [inventory: action="add|remove" ...]；只看见或检查物品不等于归玩家所有。只有玩家已经确认的长期任务真相、承诺、见证页、身份发现或地区结算才用 [fact: id="稳定小写-id" value="true|false|数字|短值"] 记录；必须复用 id，不能无事件改写已有事实。只有玩家主动开始最终不可逆处理时才使用 [true_ending: reason="..."]；普通章节暂停仍使用 session_end。遇到具有明显视觉价值的新地点、发现、关系转折、重大结果或阶段节点时，用 [image_prompt: "English cinematic visible scene, no text, no UI, ${imageFrame}"] 提议一张场景图，并紧接着输出 [image_subject: "player|environment|others"]。画面任何位置出现玩家主角（包括远景）都必须用 player；玩家执行画面主动作时也必须用 player；environment 表示无人空镜，others 表示有人但玩家不在。只画正文已经公开的事实，并遵循这一画风：${sceneImageDirection}。${imageFreshness} 普通对话不要提议。]`
    const dangerContract = dangerDirectiveContract(context.dangerDirective)
    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        userMessage: `AUTHORITATIVE_WORLD_STATE_JSON:\n${JSON.stringify(buildWorldContext(context))}\n\n${partyContinuityContract}\n${storyDirectorContract(context.cartridge.director)}\n${dangerContract}\n\nPLAYER_ACTION:\n${action}${languageInstruction}`,
        streaming: false,
      }),
    })
    if (!response.ok || !response.body) throw new Error(t(context.locale, 'remoteUnavailableError', { n: response.status }))
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let finalContent = ''
    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })
      const chunks = buffer.split(/\n\n+/)
      buffer = chunks.pop() ?? ''
      chunks.forEach((chunk) => {
        const message = decodeEvent(chunk)
        if (!message || message.event === 'thinking') return
        const data = message.data as Record<string, unknown> | string
        if (message.event === 'progress') onProgress?.({ label: typeof data === 'string' ? data : String(data?.message ?? t(context.locale, 'worldResponding')) })
        if (message.event === 'message_saved' && typeof data === 'object') {
          const nested = data.message as Record<string, unknown> | undefined
          finalContent = String(data.content ?? nested?.content ?? '')
        }
      })
      if (done) break
    }
    if (!finalContent) throw new Error(t(context.locale, 'remoteEmpty'))
    return { content: finalContent, imagePrompt: extractSceneImagePrompt(finalContent), imageSubject: extractSceneImageSubject(finalContent) }
  },
}
