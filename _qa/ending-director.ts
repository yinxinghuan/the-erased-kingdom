import assert from 'node:assert/strict'
import { applyParsedScene, createInitialSave } from '../src/story/engine/reducer'
import { buildEndingSnapshot, fallbackEndingCandidate, validateEndingCandidate } from '../src/story/engine/endingDirector'
import { parseStoryProtocol } from '../src/story/engine/protocol'
import type { StoryCartridge, StoryEndingCandidate } from '../src/story/types'

const cartridge: StoryCartridge = {
  schemaVersion: 1,
  id: 'ending-test',
  locale: 'en',
  coverImage: './cover.webp',
  copy: {
    title: 'Ending Test', subtitle: 'Test', promise: 'Test persistent endings', enter: 'Enter', continue: 'Continue', customAction: 'Act',
    itemImagingTitle: 'Items', itemImagingBody: 'Items take shape.',
  },
  theme: { outer: '#000', surface: '#111', paper: '#fff', ink: '#111', muted: '#777', accent: '#26c', danger: '#d32', gold: '#b83', material: 'wayfarer' },
  audioTheme: { material: 'wayfarer', bpm: 60, rootHz: 110, scale: [0, 3, 7], levels: { music: .2, ambient: .2, sfx: .4, master: .5 }, tension: [] },
  statDefinitions: [
    { id: 'vitality', label: 'Vitality', min: 0, max: 100, initial: 80, maxDelta: 20 },
    { id: 'supplies', label: 'Supplies', min: 0, max: 12, initial: 7, maxDelta: 3 },
    { id: 'recognition', label: 'Recognition', min: 0, max: 100, initial: 80, maxDelta: 18 },
  ],
  drawerLabels: { party: 'Party', map: 'Map', inventory: 'Pack', log: 'Log' },
  opening: {
    location: 'Vale', time: 'Day 1', objective: 'Reach the ledger', imagePrompt: 'empty vale, no text',
    blocks: [{ id: 'open', kind: 'narration', text: 'The vale waits.' }],
    choices: [{ id: 'a', label: 'Act' }, { id: 'b', label: 'Inspect' }, { id: 'c', label: 'Speak' }],
  },
  characters: [{ id: 'mara', name: 'Mara', role: 'Cartographer', vitality: 90, stress: 10, skills: [], initialStatus: 'companion' }],
  initialPartyMemberIds: ['mara'],
  initialMap: [
    { id: 'vale', label: 'Vale', current: true, visited: true },
    { id: 'wood', label: 'Wood', visited: true },
    { id: 'capital', label: 'Capital', visited: true },
  ],
  initialInventory: [{ id: 'seal', label: 'Blank seal', count: 1 }],
  initialFacts: { 'ledger-access': false },
  endingDirector: {
    startRequirements: [{ type: 'fact', id: 'witness-four', equals: true }, { type: 'fact', id: 'ledger-access', equals: true }],
    capabilities: [
      { id: 'amend', label: 'Amend', meaning: 'Reform the ledger', requires: [{ type: 'fact', id: 'ledger-access', equals: true }], mandatoryCosts: ['unproven-remain'] },
      { id: 'claim', label: 'Claim', meaning: 'Claim the ledger', requires: [{ type: 'stat', id: 'recognition', min: 75 }], mandatoryCosts: ['isolation'], incompatibleWith: ['amend'] },
    ],
    anchors: [{
      id: 'unique-dawn', title: 'Unique Dawn', thesis: 'The ledger remains, bounded by evidence.', capabilityIds: ['amend'], irreversibleCosts: ['unproven-remain'],
      preserved: ['the roads'], lost: ['unproven names'], unresolved: ['who judges evidence'],
      finaleScenes: ['The seal touches the ledger.', 'The roads return.', 'Mara reads the missing names.', 'Dawn reaches the vale.'],
      finalImagePrompt: 'cinematic restored vale at dawn, one cartographer holding a map, no text, no UI, 4:5 portrait',
    }],
    requiredCharacterIds: ['mara'], minRegionalEpilogues: 3, maxRepairAttempts: 1,
  },
  demoTurns: [],
}

const initial = createInitialSave(cartridge)
const parsed = parseStoryProtocol(`[fact: id="vale-witness-page" value="true"]
[fact: id="wood-witness-page" value="true"]
[fact: id="market-witness-page" value="true"]
[fact: id="coast-witness-page" value="true"]
[fact: id="ledger-access" value="true"]
[true_ending: reason="The final revision begins"]`, 'en')
const ready = applyParsedScene(initial, parsed, cartridge, 'Begin the final revision')
assert.equal(ready.facts['witness-pages'], 4)
assert.equal(ready.facts['witness-four'], true)
assert.equal(ready.facts['ledger-access'], true)
assert.equal(ready.finale.status, 'ready')
assert.equal(ready.sessionEnded, true)

const snapshot = buildEndingSnapshot(ready, cartridge)
assert.equal(snapshot.id, buildEndingSnapshot(ready, cartridge).id, 'same finale state must hash to the same id')
assert.deepEqual(snapshot.availableCapabilities.sort(), ['amend', 'claim'])

const invalid: StoryEndingCandidate = {
  anchorFamily: 'bad', title: 'Bad', thesis: 'No cost.', capabilitiesUsed: ['amend', 'claim'], irreversibleCosts: [],
  preserved: [], lost: [], unresolved: [], finaleScenes: ['Only one'], characterEpilogues: [], regionalEpilogues: [], finalImagePrompt: '',
}
const errors = validateEndingCandidate(invalid, snapshot, cartridge)
assert(errors.some((error) => error.includes('incompatible capabilities')))
assert(errors.some((error) => error.includes('missing mandatory cost')))
assert(errors.some((error) => error.includes('missing character epilogue')))

const fallback = fallbackEndingCandidate(snapshot, cartridge)
assert.equal(fallback.anchorFamily, 'unique-dawn')
assert.deepEqual(validateEndingCandidate(fallback, snapshot, cartridge), [])

console.log(JSON.stringify({ ok: true, snapshotId: snapshot.id, capabilities: snapshot.availableCapabilities, invalidErrors: errors.length }))
