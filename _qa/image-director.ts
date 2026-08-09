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
assert.equal(shouldUsePlayerImageReference(String(playerImage?.data?.prompt)), true)
assert.match(String(playerImage?.data?.prompt), /same person performing the dominant player action/i)

const environment = applyParsedScene(initial, parseStoryProtocol(`无人灯塔第一次从雾中显露。
[map_update: new_location="灯塔海岸" connected_to="苹果谷 · 村口"]
[choices: "进入灯塔"|"观察潮线"|"等待雾散"]`, 'zh'), theErasedKingdom, '观察海岸', 'empty lighthouse coast in fog, environment-only wide shot', 'environment')
const environmentImage = latestImage(environment)
assert.equal(environmentImage?.data?.playerVisible, 'false')
assert.equal(shouldUsePlayerImageReference(String(environmentImage?.data?.prompt)), false)

const staleOpening = applyParsedScene(initial, parseStoryProtocol(`你已进入红堡的双重战场。
[map_update: new_location="红堡边境" connected_to="苹果谷 · 村口"]
[choices: "检查军牌"|"援助伤者"|"询问奥伦"]`, 'zh'), theErasedKingdom, '进入红堡', theErasedKingdom.opening.imagePrompt, 'others')
const stalePrompt = String(latestImage(staleOpening)?.data?.prompt)
assert.doesNotMatch(stalePrompt, /苹果谷村口.*桥.*面包房/s)
assert.match(stalePrompt, /Ignore all cover art and opening-scene imagery/)
assert.match(stalePrompt, /Current location hint: 红堡边境/)

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
assert.match(String(upgradedImage?.data?.prompt), /Latest visible story beat.*玛拉/s)
assert.doesNotMatch(String(upgradedImage?.data?.prompt), /Primary shot brief:.*面包房/s)

console.log(JSON.stringify({ ok: true, playerRef: true, environmentRef: false, promptVersion: SCENE_IMAGE_PROMPT_VERSION }))
