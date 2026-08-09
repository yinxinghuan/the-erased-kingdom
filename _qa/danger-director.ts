import assert from 'node:assert/strict'
import { resolveCartridge } from '../src/story/cartridges'
import { buildDangerDirective } from '../src/story/engine/dangerDirector'
import { createInitialSave } from '../src/story/engine/reducer'

const cartridge = resolveCartridge(undefined, 'en')
assert(cartridge.dangerDirector)
const save = createInitialSave(cartridge)
save.danger.safeTurns = cartridge.dangerDirector.maxSafeTurns + 1
const warning = buildDangerDirective(save, cartridge, 'inspect the road')
assert.equal(warning?.phase, 'warning')

save.danger = { ...save.danger, phase: 'warning', currentThreat: warning?.threat, severity: warning?.severity ?? 2 }
const confrontation = buildDangerDirective(save, cartridge, 'protect the witness')
assert.equal(confrontation?.phase, 'confrontation')

save.danger = { ...save.danger, phase: 'confrontation', currentThreat: confrontation?.threat, severity: confrontation?.severity ?? 2 }
const resolution = buildDangerDirective(save, cartridge, 'use the map')
assert.equal(resolution?.phase, 'resolution')
assert(resolution?.check)

console.log(JSON.stringify({ ok: true, threat: warning?.threat, outcome: resolution?.check?.outcome }))
