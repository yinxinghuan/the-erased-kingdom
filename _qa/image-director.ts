import assert from 'node:assert/strict'
import { theErasedKingdom } from '../src/story/cartridges/theErasedKingdom'
import { parseStoryProtocol } from '../src/story/engine/protocol'
import { applyParsedScene, createInitialSave } from '../src/story/engine/reducer'
import { shouldUsePlayerImageReference, upgradePendingSceneImagePrompts } from '../src/story/engine/imageDirector'
import { SCENE_IMAGE_PROMPT_VERSION } from '../src/story/types'

const latestImage = (save: ReturnType<typeof createInitialSave>) => [...save.blocks].reverse().find((block) => block.kind === 'image')
const initial = createInitialSave(theErasedKingdom)

const playerScene = applyParsedScene(initial, parseStoryProtocol(`你抓住正在褪色的玛拉，把她拉离断路。
[map_update: new_location="古林入口" connected_to="苹果谷 · 村口"]
[choices: "检查她的地图"|"追踪删痕"|"返回村口"]`, 'zh'), theErasedKingdom, '拉住玛拉', 'wide shot of the player protagonist pulling Mara away from a collapsing road in Oldwood', 'player')
const playerImage = latestImage(playerScene)
assert.equal(playerImage?.data?.source, 'ai')
assert.equal(playerImage?.data?.playerVisible, 'true')
assert.equal(shouldUsePlayerImageReference(String(playerImage?.data?.prompt), theErasedKingdom.playerImageAliases), true)
assert.match(String(playerImage?.data?.prompt), /same person performing the dominant player action/i)
assert.match(String(playerImage?.data?.prompt), /ABSOLUTELY NO VISIBLE WRITING OR LANGUAGE/i)
assert.doesNotMatch(String(playerImage?.data?.prompt), /[\u3400-\u9fff]/)

const environment = applyParsedScene(initial, parseStoryProtocol(`无人灯塔第一次从雾中显露。
[map_update: new_location="灯塔海岸" connected_to="苹果谷 · 村口"]
[choices: "进入灯塔"|"观察潮线"|"等待雾散"]`, 'zh'), theErasedKingdom, '观察海岸', 'empty lighthouse coast in fog, environment-only wide shot', 'environment')
const environmentImage = latestImage(environment)
assert.equal(environmentImage?.data?.playerVisible, 'false')
assert.equal(shouldUsePlayerImageReference(String(environmentImage?.data?.prompt)), false)

const mislabeledCourier = applyParsedScene(initial, parseStoryProtocol(`王印落下，桥梁重新出现。
[choices: "穿过桥梁"|"帮助村民"|"观察王印"]`, 'zh'), theErasedKingdom, '写回桥梁', 'wide shot of villagers and the courier crossing a restored stone bridge, blank signs, no text', 'environment')
const mislabeledImage = latestImage(mislabeledCourier)
assert.equal(mislabeledImage?.data?.playerVisible, 'true')
assert.equal(shouldUsePlayerImageReference(String(mislabeledImage?.data?.prompt), theErasedKingdom.playerImageAliases), true)
assert.doesNotMatch(String(mislabeledImage?.data?.prompt), /[\u3400-\u9fff]/)

const unsafeChineseProposal = applyParsedScene(initial, parseStoryProtocol(`你在总册塔内展开地图。
[choices: "封住入口"|"寻找玛拉"|"检查地图"]`, 'zh'), theErasedKingdom, '检查地图', '主角信使在写满中文的地图前行动', 'player')
const safePrompt = String(latestImage(unsafeChineseProposal)?.data?.prompt)
assert.doesNotMatch(safePrompt, /[\u3400-\u9fff]/)
assert.doesNotMatch(safePrompt, /写满中文/)
assert.match(safePrompt, /No Chinese, Hanzi, CJK glyphs/)

const staleOpening = applyParsedScene(initial, parseStoryProtocol(`你已进入红堡的双重战场。
[map_update: new_location="红堡边境" connected_to="苹果谷 · 村口"]
[choices: "检查军牌"|"援助伤者"|"询问奥伦"]`, 'zh'), theErasedKingdom, '进入红堡', theErasedKingdom.opening.imagePrompt, 'others')
const stalePrompt = String(latestImage(staleOpening)?.data?.prompt)
assert.doesNotMatch(stalePrompt, /苹果谷村口.*桥.*面包房/s)
assert.match(stalePrompt, /Ignore all cover art and opening-scene imagery/)
assert.match(stalePrompt, /Current location hint: red bastion/)

const legacy = {
  ...playerScene,
  blocks: playerScene.blocks.map((block) => block.kind === 'image' && block.id !== 'image-0'
    ? { ...block, data: { ...block.data, promptVersion: 0, status: 'generating' as const, prompt: theErasedKingdom.opening.imagePrompt } }
    : block),
}
const upgraded = upgradePendingSceneImagePrompts(legacy, theErasedKingdom)
const upgradedImage = latestImage(upgraded)
assert.equal(Number(upgradedImage?.data?.promptVersion), SCENE_IMAGE_PROMPT_VERSION)
assert.equal(upgradedImage?.data?.status, 'queued')
assert.match(String(upgradedImage?.data?.prompt), /Source-language prose is intentionally omitted/)
assert.doesNotMatch(String(upgradedImage?.data?.prompt), /[\u3400-\u9fff]/)
assert.doesNotMatch(String(upgradedImage?.data?.prompt), /Primary shot brief:.*面包房/s)

console.log(JSON.stringify({ ok: true, playerRef: true, environmentRef: false, promptVersion: SCENE_IMAGE_PROMPT_VERSION }))
