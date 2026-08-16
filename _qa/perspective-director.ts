import assert from 'node:assert/strict'
import { CARTRIDGES, CARTRIDGES_EN } from '../src/story/cartridges'
import { chooseSceneImage } from '../src/story/engine/imageDirector'
import { createInitialSave } from '../src/story/engine/reducer'
import type { ParsedScene, StoryCartridge } from '../src/story/types'

function narration(text = 'A concrete consequence is visible in the current place.'): ParsedScene {
  return { blocks: [{ id: 'beat', kind: 'narration', text }], commands: [], raw: text }
}

function audit(cartridge: StoryCartridge) {
  const initial = createInitialSave(cartridge)
  const counts = { first: 0, observer: 0 }
  for (let scene = 1; scene <= 20; scene += 1) {
    const next = { ...initial, scene }
    const decision = chooseSceneImage(initial, next, narration(), cartridge, undefined, 'others', 'Listen')
    if (decision.perspective === 'first-person') counts.first += 1
    if (decision.perspective === 'observer') counts.observer += 1
  }
  assert.equal(counts.first, 10, `${cartridge.id}/${cartridge.locale}: balanced ordinary first-person count`)
  assert.equal(counts.observer, 10, `${cartridge.id}/${cartridge.locale}: balanced ordinary observer count`)

  const dialogue: ParsedScene = {
    blocks: [{ id: 'line', kind: 'dialogue', speaker: 'Witness', text: 'This warning changes what we must do next.' }],
    commands: [],
    raw: '',
  }
  const dialogueShot = chooseSceneImage(initial, { ...initial, scene: 22 }, dialogue, cartridge, undefined, 'others', 'Listen')
  assert.equal(dialogueShot.perspective, 'first-person')
  assert.match(dialogueShot.prompt ?? '', /FIRST-PERSON PLAYER-EYE VIEW/)
  assert.equal(dialogueShot.playerVisible, false)

  const arrival: ParsedScene = {
    blocks: [{ id: 'arrival', kind: 'narration', text: 'The new platform opens ahead.' }],
    commands: [{ type: 'map_update', location: 'New Platform' }],
    raw: '',
  }
  const arrivalShot = chooseSceneImage(initial, { ...initial, scene: 24, location: 'New Platform' }, arrival, cartridge, undefined, 'environment', 'Arrive')
  assert.equal(arrivalShot.perspective, 'observer')
  assert.match(arrivalShot.prompt ?? '', /OBSERVER \/ THIRD-PERSON VIEW/)

  const playerShot = chooseSceneImage(initial, { ...initial, scene: 26 }, narration('The protagonist braces the damaged gate.'), cartridge, undefined, 'player', 'Brace the gate')
  assert.equal(playerShot.perspective, 'observer')
  assert.equal(playerShot.playerVisible, true)
}

for (const cartridge of [...Object.values(CARTRIDGES), ...Object.values(CARTRIDGES_EN)]) audit(cartridge)
console.log(JSON.stringify({ ok: true, games: Object.keys(CARTRIDGES), ordinaryImagesPerLocale: 20, split: '10/10' }))

