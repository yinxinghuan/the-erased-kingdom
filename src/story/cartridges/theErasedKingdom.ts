import type {
  Locale, StoryCartridge, StoryDangerDirector, StoryEndingAnchor, StoryEndingCapability,
  StoryEndingDirector, StoryImageDirector,
} from '../types'
import { buildErasedKingdomCampaign } from './theErasedKingdomCampaign'

const coverImage = new URL('../img/worlds/the-erased-kingdom.webp', import.meta.url).href
const entryImage = new URL('../img/worlds/the-erased-kingdom-entry.webp', import.meta.url).href

function build(locale: Locale): StoryCartridge {
  const zh = locale === 'zh'
  const s = (cn: string, en: string) => zh ? cn : en

  const capabilities: StoryEndingCapability[] = [
    {
      id: 'amend-single-ledger', label: s('约束唯一总册', 'Bind the Single Ledger'),
      meaning: s('保留一个中央总册，但让公开证据与申诉能够约束它。', 'Keep one central Ledger, bound by public evidence and appeal.'),
      requires: [{ type: 'fact', id: 'witness-four', equals: true }, { type: 'fact', id: 'ledger-access', equals: true }],
      mandatoryCosts: ['some_unproven_people_remain_in_margins'], incompatibleWith: ['dismantle-ledger'],
    },
    {
      id: 'dismantle-ledger', label: s('拆毁总册权力', 'Dismantle the Ledger'),
      meaning: s('毁掉让一份记录独占现实的权力。', 'Destroy the authority that lets one record monopolize reality.'),
      requires: [{ type: 'fact', id: 'ledger-access', equals: true }, { type: 'item', id: 'blank-seal' }],
      mandatoryCosts: ['roads_and_claims_destabilize'], incompatibleWith: ['amend-single-ledger'],
    },
    {
      id: 'distribute-witnessing', label: s('建立众人图册', 'Create the Common Atlas'),
      meaning: s('让各地独立见证者互相核验永久事实。', 'Let independent local witnesses cross-check permanent facts.'),
      requires: [{ type: 'fact', id: 'witness-all-six', equals: true }, { type: 'fact', id: 'companions-reconciled', equals: true }, { type: 'fact', id: 'regional-sources-four', equals: true }],
      mandatoryCosts: ['restoration_becomes_slow_and_disputed'],
    },
    {
      id: 'hold-margin-passage', label: s('守住页边通道', 'Hold the Margin Passage'),
      meaning: s('在日常世界与页边之间保留一条稳定道路。', 'Keep one stable route between ordinary reality and the Margins.'),
      requires: [{ type: 'fact', id: 'margin-witness-page', equals: true }, { type: 'fact', id: 'player-unregistered', equals: true }, { type: 'item', id: 'blank-seal' }],
      mandatoryCosts: ['a_named_keeper_must_be_bound_to_the_passage'], incompatibleWith: ['restore-player-registration'],
    },
    {
      id: 'permit-bounded-overlap', label: s('允许有限重页', 'Permit Bounded Overlap'),
      meaning: s('让证据充分却彼此冲突的历史，在有限地区共同存在。', 'Allow well-supported conflicting histories to coexist in bounded regions.'),
      requires: [{ type: 'fact', id: 'witness-all-six', equals: true }, { type: 'fact', id: 'paired-conflicts-three', equals: true }, { type: 'fact', id: 'no-false-evidence', equals: true }],
      mandatoryCosts: ['some_people_face_alternate_lives', 'geography_remains_strange'],
    },
    {
      id: 'claim-ledger-authority', label: s('接管总册', 'Claim the Ledger'),
      meaning: s('由玩家亲自掌握现实登记权。', 'Place the reality registry under the player’s direct authority.'),
      requires: [{ type: 'fact', id: 'ledger-access', equals: true }, { type: 'stat', id: 'recognition', min: 75 }],
      mandatoryCosts: ['companions_question_free_will', 'player_becomes_isolated_by_power'], incompatibleWith: ['evacuate-and-refuse-rule'],
    },
    {
      id: 'negotiate-limited-revision', label: s('有限修订', 'Limited Revision'),
      meaning: s('与维尔共同保护一份已证明名单，同时维持道路稳定。', 'Work with Veyr to protect a proven list while preserving stability.'),
      requires: [{ type: 'character', id: 'veyr-regent' }, { type: 'fact', id: 'veyr-dialogue-completed', equals: true }, { type: 'fact', id: 'witness-four', equals: true }],
      mandatoryCosts: ['unlisted_people_are_lost'],
    },
    {
      id: 'evacuate-and-refuse-rule', label: s('救人后拒绝统治', 'Evacuate and Refuse Rule'),
      meaning: s('先救下能抵达的人，再拒绝替王国制定永久答案。', 'Save everyone reachable, then refuse to impose a permanent answer.'),
      requires: [{ type: 'fact', id: 'safe-routes-three', equals: true }, { type: 'fact', id: 'communities-warned-two', equals: true }, { type: 'item', id: 'blank-seal' }],
      mandatoryCosts: ['kingdom_question_remains_unresolved'], incompatibleWith: ['claim-ledger-authority'],
    },
    {
      id: 'restore-player-registration', label: s('写回自己的名字', 'Restore Your Name'),
      meaning: s('让道路、亲友与机构稳定地认出玩家。', 'Make roads, loved ones and institutions recognize the player reliably.'),
      requires: [{ type: 'fact', id: 'eli-truth-known', equals: true }, { type: 'fact', id: 'player-birth-evidence', equals: true }],
      mandatoryCosts: ['player_loses_unrestricted_margin_crossing'], incompatibleWith: ['surrender-player-name', 'hold-margin-passage'],
    },
    {
      id: 'surrender-player-name', label: s('交出自己的名字', 'Surrender Your Name'),
      meaning: s('用玩家的公共身份稳定一个人、地方或通道。', 'Spend the player’s public identity to stabilize a person, place or passage.'),
      requires: [{ type: 'fact', id: 'player-unregistered', equals: true }, { type: 'item', id: 'blank-seal' }],
      mandatoryCosts: ['public_memory_of_player_fades'], incompatibleWith: ['restore-player-registration'],
    },
  ]

  const anchor = (
    id: string, titleCn: string, titleEn: string, thesisCn: string, thesisEn: string,
    capabilityIds: string[], irreversibleCosts: string[], preserved: string[], lost: string[], unresolved: string[],
    finaleCn: string[], finaleEn: string[], finalImagePrompt: string,
  ): StoryEndingAnchor => ({
    id, title: s(titleCn, titleEn), thesis: s(thesisCn, thesisEn), capabilityIds, irreversibleCosts,
    preserved, lost, unresolved, finaleScenes: zh ? finaleCn : finaleEn, finalImagePrompt,
  })

  const anchors: StoryEndingAnchor[] = [
    anchor('unique-dawn', '唯一黎明', 'The Singular Dawn', '你保留共同道路，却让任何名字都能公开申诉。', 'You keep shared roads while making every name open to public appeal.',
      ['amend-single-ledger', 'restore-player-registration'], ['some_unproven_people_remain_in_margins', 'player_loses_unrestricted_margin_crossing'],
      ['registered roads', 'public appeals', 'the player name'], ['unproven people beyond the final list'], ['who judges evidence after the witnesses are gone'],
      ['你在总册最后一页写回自己的名字。', '玛拉把第一张可公开改正的地图挂在塔门外。', '奥伦护送第一批页边归来者通过登记大厅。', '多年后，一排仍无法读出的空名字提醒人们胜利并不完整。'],
      ['You restore your name on the Ledger’s final page.', 'Mara hangs the first publicly correctable map outside the tower.', 'Oren escorts the first returnees from the Margins through registration.', 'Years later, a row of unreadable names keeps the victory from feeling complete.'],
      'cinematic high fantasy dawn over a reopened white-stone city gate, courier and cartographer among returning families, one distant row of blank memorial stones, emotional grounded realism, no text, no UI'),
    anchor('open-roads', '无册之路', 'Roads Without an Owner', '你拆毁总册，让现实回到人的照料与争论中。', 'You break the Ledger and return reality to human care and argument.',
      ['dismantle-ledger'], ['roads_and_claims_destabilize'], ['freedom from erasure', 'the blank seal’s last honest act'], ['stable royal routes'], ['how conflicting claims will be settled'],
      ['空白王印在总册书脊上留下最后一道裂痕。', '王都笔直的道路第一次分出许多未经批准的小路。', '塞拉把无主物品逐件送回仍记得它们的人。', '远方的商队一边争路一边重新画图，没人再能把整座村庄一笔删去。'],
      ['The blank seal leaves one final fracture in the Ledger’s spine.', 'The capital’s straight roads branch into unapproved paths.', 'Sera returns unclaimed objects to those who still remember them.', 'Caravans argue and redraw the road, but no one can erase a village with one stroke again.'],
      'cinematic grounded fantasy, monumental ledger tower opening into many winding roads across a living kingdom, travelers rebuilding signposts together, no text, no UI'),
    anchor('common-atlas', '众人图册', 'The Common Atlas', '你让互相独立的见证者共同承担真实。', 'You make independent witnesses share responsibility for what becomes real.',
      ['distribute-witnessing'], ['restoration_becomes_slow_and_disputed'], ['regional voices', 'all six witness pages'], ['instant restoration'], ['whether consensus can survive fear'],
      ['六张见证页在空中没有合成一本书，而是飞向六个方向。', '玛拉拒绝画一张永不改变的最终地图。', '各地第一次为同一个名字举行公开核验。', '许多年后，争论仍然漫长，但被争论的人始终在场。'],
      ['The six witness pages do not bind into one book; they fly in six directions.', 'Mara refuses to draw a final map that can never change.', 'Every region holds a public verification for the same disputed name.', 'Years later, arguments remain slow, but the people being argued about remain present.'],
      'six luminous map pages traveling from a high tower toward forests markets forts coast and villages, companions watching at sunrise, grounded high fantasy, no text, no UI'),
    anchor('margin-keeper', '页边守望者', 'Keeper of the Margins', '你用自己的公共名字，换来两个世界之间不再关闭的门。', 'You spend your public name to keep a door between two worlds from closing.',
      ['hold-margin-passage', 'surrender-player-name'], ['a_named_keeper_must_be_bound_to_the_passage', 'public_memory_of_player_fades'],
      ['the Margin passage', 'families divided by erasure'], ['public memory of the player'], ['who will replace the keeper'],
      ['伊莱叫出你的名字，王印却把声音留在门的另一边。', '页边的灯一盏接一盏通向苹果谷。', '玛拉记得一位同行者，却再也无法把那张脸画完整。', '后来，每个穿门的人都会向无名守望者留下一件小物。'],
      ['Eli says your name, but the seal leaves the sound beyond the door.', 'Margin lamps lead one by one toward Apple Vale.', 'Mara remembers a companion but can no longer finish the face on her map.', 'Afterward, everyone crossing the passage leaves one small object for its nameless keeper.'],
      'emotional high fantasy passage of warm lamps between a vivid village and an ivory margin, solitary courier silhouette holding the door while families cross, no text, no UI'),
    anchor('crown-of-names', '万名之冠', 'The Crown of Names', '你接管总册并恢复自己的名字，成为再也无法轻易离开的裁决者。', 'You claim the Ledger and your name, becoming the judge who cannot easily leave.',
      ['claim-ledger-authority', 'restore-player-registration'], ['companions_question_free_will', 'player_becomes_isolated_by_power', 'player_loses_unrestricted_margin_crossing'],
      ['stable institutions', 'the player’s recognized identity'], ['the freedom of being unregistered'], ['whether benevolent power can stay benevolent'],
      ['维尔把总册钥匙放在你面前，却没有跪下。', '你的名字第一次在整座王都被同时读出。', '伙伴们在塔门外等待你做第一项裁决。', '多年后，塔顶每晚亮着一扇窗，而旧朋友很少再来。'],
      ['Veyr places the Ledger key before you without kneeling.', 'Your name is spoken across the capital at once.', 'Your companions wait outside for your first ruling.', 'Years later, one tower window burns nightly while old friends visit less and less.'],
      'lonely crowned registry keeper at the summit of a vast white stone archive, old companions small at the open doorway below, restrained tragic dawn, no text, no UI'),
    anchor('double-dawn', '两次黎明', 'The Double Dawn', '你让彼此冲突却真实的历史有限共存，并重新获得自己的名字。', 'You let conflicting truths coexist within bounds and reclaim your own name.',
      ['permit-bounded-overlap', 'restore-player-registration'], ['some_people_face_alternate_lives', 'geography_remains_strange', 'player_loses_unrestricted_margin_crossing'],
      ['conflicting witnesses', 'the player name'], ['one simple national story'], ['how alternate families share a life'],
      ['红堡的同一座桥在晨雾里通向两个村庄。', '诺娅的两段人生在维尔面前各自说完。', '你写回自己的名字，却再也无法独自穿过页边。', '人们学会先问“你从哪一段黎明而来”。'],
      ['The same Red Bastion bridge reaches two villages through morning mist.', 'Noa’s two lives each finish speaking before Veyr.', 'You restore your name and lose the ability to cross the Margins alone.', 'People learn to ask, “Which dawn did you come from?”'],
      'surreal but grounded high fantasy bridge dividing toward two equally vivid dawn villages, companions meeting alternate families, natural anatomy, no text, no UI'),
    anchor('merciful-revision', '仁慈大修订', 'The Merciful Revision', '你承认维尔的恐惧，却逼他用公开证据限制最后一次修订。', 'You acknowledge Veyr’s fear and force the final revision to obey public evidence.',
      ['negotiate-limited-revision', 'amend-single-ledger'], ['unlisted_people_are_lost', 'some_unproven_people_remain_in_margins'],
      ['the proven list', 'stable shared roads'], ['everyone outside the list'], ['whether mercy can excuse a boundary'],
      ['你与维尔在崩塌的塔中逐个核对名字。', '奥伦把剑放在名单与士兵之间。', '大修订停下时，门外仍有人没有被读到。', '维尔余生都在公开大厅里听失去亲人的人说完。'],
      ['You and Veyr verify names one by one inside the failing tower.', 'Oren lays his sword between the list and the soldiers.', 'When the Revision stops, some outside the door remain unread.', 'Veyr spends the rest of his life listening in public hall to those who lost someone.'],
      'two exhausted rivals reading evidence together in a collapsing luminous archive while a knight holds back soldiers and families wait outside, no text, no UI'),
    anchor('last-delivery', '最后一封信', 'The Last Delivery', '你先把人送出灾难，再用自己的名字为他们留下回程。', 'You carry people out of disaster, then spend your name to leave them a road home.',
      ['evacuate-and-refuse-rule', 'surrender-player-name'], ['kingdom_question_remains_unresolved', 'public_memory_of_player_fades'],
      ['evacuated communities', 'three safe roads'], ['a permanent national answer', 'public memory of the player'], ['who one day chooses the next rule'],
      ['你把最后一封信送给每个仍在路上的人。', '三条安全道路在总册崩落前同时亮起。', '伊莱在终点接过已经没有署名的信袋。', '后来，孩子们把那条路叫作“有人送我们回来的路”。'],
      ['You deliver one final letter to everyone still on the road.', 'Three safe routes light before the Ledger falls.', 'Eli receives the now-unsigned courier bag at the end.', 'Children later call it “the road someone used to bring us home.”'],
      'wide emotional high fantasy evacuation at twilight, three glowing roads carrying villagers out as a nameless courier delivers the final letter, no text, no UI'),
  ]

  const endingDirector: StoryEndingDirector = {
    startRequirements: [{ type: 'fact', id: 'ledger-access', equals: true }, { type: 'fact', id: 'witness-four', equals: true }, { type: 'scene', min: 18 }],
    capabilities, anchors,
    requiredCharacterIds: ['mara-cartographer', 'oren-knight', 'sera-peddler', 'eli-courier', 'veyr-regent'],
    minRegionalEpilogues: 3,
    maxRepairAttempts: 2,
  }

  const dangerDirector: StoryDangerDirector = {
    minSafeTurns: 2, maxSafeTurns: 4, cooldownTurns: 2,
    escalationStats: ['vitality', 'supplies', 'recognition'],
    threatPalette: zh ? [
      '皇家猎手循着空白王印的新鲜痕迹逼近', '被删去的道路正在坍入页边，而旅人仍在桥上',
      '由划掉姓名形成的总册猎兽正在追踪见证人', '饥饿逃兵占据公共补给点并要求用身份交换食物',
      '两段被恢复的历史让同一处出现相互冲突的人群', '官方记录否认一位伙伴，使其身体开始褪色',
    ] : [
      'royal hunters follow the fresh signature of the blank seal', 'an erased road collapses into the Margins while travellers still cross',
      'a ledger beast made from crossed-out names stalks a witness', 'hungry deserters seize a public supply cache and demand identity for food',
      'two restored histories place conflicting groups in one location', 'an official denial makes a companion begin to fade',
    ],
    methods: zh ? ['挺身保护、战斗或直接突破', '观察地形与删除规则，寻找弱点或安全路线', '依靠伙伴、交涉或付出王印代价'] : ['protect, fight, or break through', 'read terrain and erasure rules for a weakness or safe route', 'rely on a companion, negotiate, or pay a seal cost'],
    physicalCombat: 'occasional',
    resolution: { skill: s('见证者应变', 'Witnesscraft'), modifier: 2, dcBySeverity: [7, 10, 13, 16, 19], fallbackCosts: [{ statId: 'vitality', operation: 'remove', amount: 14 }] },
  }

  return {
    schemaVersion: 1, id: 'the-erased-kingdom', locale, coverImage, entryImage,
    copy: {
      title: s('被删去的王国', 'THE ERASED KINGDOM'),
      subtitle: s('有人把一座村庄从世界里划掉了', 'Someone crossed a village out of the world'),
      promise: s('在辽阔王国中自由探险，寻找证人与遗物，把被删去的人和道路写回来。', 'Explore a vast kingdom, find witnesses and relics, and write erased people and roads back into the world.'),
      enter: s('走进正在消失的苹果谷', 'Enter the vanishing Apple Vale'),
      continue: s('继续送完这封信', 'Continue the last delivery'),
      customAction: s('也可以写下任何想做的事', 'Or write anything you want to do'),
      itemImagingTitle: s('见证图谱正在显影', 'The witness plates are developing'),
      itemImagingBody: s('空白王印掠过每件物品，来源、用途与旧痕正依次显露。其余图谱会在旅途中静静完成。', 'The blank seal passes over each object as its source, use and scars emerge. The remaining plates will finish quietly during the journey.'),
    },
    theme: { outer: '#11161b', surface: '#172129', paper: '#ebe8dd', ink: '#111a22', muted: '#6d7476', accent: '#2f63d8', danger: '#e34e38', gold: '#b68a4b', material: 'wayfarer' },
    audioTheme: {
      material: 'wayfarer', bpm: 58, rootHz: 146.83, scale: [0, 2, 5, 7, 9],
      levels: { music: .12, ambient: .13, sfx: .44, master: .48 },
      tension: [{ statId: 'vitality', direction: 'low', weight: .4 }, { statId: 'supplies', direction: 'low', weight: .25 }, { statId: 'recognition', direction: 'low', weight: .35 }],
      motifs: {
        erase: [12, 6, 0], restore: [0, 7, 12], witness: [0, 5, 7, 12],
        companion: [0, 3, 7], finale: [0, 5, 7, 12, 14], location: [0, 7],
      },
      regions: [
        { id: 'apple-vale', match: ['苹果谷', 'Apple Vale'], texture: 'orchard', pattern: [0, null, 7, null, 5, null, 9, null] },
        { id: 'oldwood', match: ['古林', 'Oldwood'], texture: 'oldwood', rootOffset: -5, bpmOffset: -4, pattern: [0, null, null, 5, 0, null, 2, null] },
        { id: 'bell-market', match: ['钟市', 'Bell Market'], texture: 'market', rootOffset: 2, bpmOffset: 4, pattern: [0, 7, null, 5, 2, null, 7, null] },
        { id: 'red-bastion', match: ['红堡', 'Red Bastion'], texture: 'bastion', rootOffset: -2, bpmOffset: 8, scale: [0, 1, 5, 7, 8], pattern: [0, null, 1, null, 5, 1, null, 0] },
        { id: 'lantern-coast', match: ['灯塔海岸', 'Lantern Coast'], texture: 'coast', rootOffset: 5, bpmOffset: -6, pattern: [0, null, 7, null, 12, null, 9, null] },
        { id: 'margins', match: ['页边', 'Margin'], texture: 'margins', rootOffset: -7, bpmOffset: -10, scale: [0, 1, 5, 6, 10], pattern: [12, null, null, 6, null, null, 0, null] },
        { id: 'capital', match: ['白石王都', 'Whitestone', '王都', 'Capital'], texture: 'capital', rootOffset: 0, bpmOffset: 6, pattern: [0, null, 2, 7, null, 5, null, 2] },
        { id: 'ledger', match: ['总册高塔', 'Ledger Tower', '总册', 'Ledger'], texture: 'ledger', rootOffset: -12, bpmOffset: 10, scale: [0, 1, 5, 6, 7], pattern: [0, 1, null, 0, 5, 1, null, 6] },
      ],
    },
    itemImageDirection: 'museum-quality grounded high-fantasy artifact study on dark cloth and pale registry paper, restrained brass and vermilion details, object only, no people, no readable text',
    sceneImageDirection: 'cinematic grounded high fantasy under spatial erasure, broad readable landscapes, lived-in medieval clothing, natural anatomy, saturated tactile places interrupted by silent ivory absence, cobalt action accents, vermilion deletion traces, 4:5 portrait master, one decisive event',
    sceneImageAvoid: 'the Apple Vale entry composition, a courier merely standing before a fading orchard village, decorative paper collage, giant book foreground, title lettering, border frame, or UI',
    playerImageAliases: ['border courier', 'royal courier', 'the courier', 'courier', '边境信使', '皇家信使', '信使'],
    playerImageRole: 'the unnamed player-controlled border courier; the supplied reference is authoritative for the courier’s entire visible form, covering, costume and face visibility, while the blank brass seal and courier satchel are story props; this subject is never Mara and never a mounted knight',
    playerImageExclusions: [
      'Mara is a young female cartographer carrying an applewood ruler and must keep her own different complete appearance',
      'Oren is an armored royal knight with his own different complete appearance',
      'Toma is an older roadkeeper with his own different complete appearance',
      'horses, deer, wolves and ledger beasts can never inherit the player reference’s face, covering, costume, silhouette, colors or body traits',
    ],
    imageDirector: { maxQuietTurns: 1, softCooldownTurns: 0, guaranteedTriggers: ['new-location', 'rare-item', 'party-change', 'chapter-checkpoint', 'relationship-change', 'objective-change', 'skill-outcome'], softTriggers: [] } satisfies StoryImageDirector,
    mediaDirector: { imageProfile: 'fast-small', imageTarget: { width: 512, height: 640 }, videoEnabled: true, videoDuration: 5, minVideoGapTurns: 8 },
    director: {
      mode: 'open-world', maxActiveThreads: 3,
      mainQuest: s(
        '保护仍记得苹果谷的人，收集六张地区见证页，在大修订前进入皇家总册，并用一路真实保存的人、物与承诺决定王国此后如何记住事实。',
        'Protect those who still remember Apple Vale, secure six regional witness pages, enter the Royal Ledger before the Great Revision, and use the people, objects and promises truly preserved along the journey to decide how the kingdom remembers facts.',
      ),
      chapters: [
        {
          id: 'apple-vale-prologue', title: s('序章：不存在的苹果谷', 'Prologue: Apple Vale Does Not Exist'), unlock: s('开局立即进行', 'Available immediately'),
          emotionalPurpose: s('先让玩家爱上一个普通地方，再亲手救回其中一小部分。', 'Let the player care about an ordinary home, then personally restore one small part of it.'),
          beats: s('认识玛拉；村庄开始消失；抢救一项证据；写回一处地标；解决猎兽；奥伦核验后开放道路', 'Meet Mara; the village vanishes; rescue evidence; restore one landmark; survive the ledger beast; Oren verifies the event and the roads open').split(zh ? '；' : ';'),
          completionFacts: ['oren-witnessed-apple-vale'],
        },
        {
          id: 'regional-witnesses', title: s('第一幕：每条路都有人在等', 'Act I: Someone Waits on Every Road'), unlock: s('苹果谷序章完成后，古林、钟市、红堡和灯塔海岸自由选择', 'After Apple Vale, choose Oldwood, Bell Market, Red Bastion or Lantern Coast freely'),
          emotionalPurpose: s('用探索、同伴与地方生活建立依恋；每区必须先认识具体的人，再决定一种有代价的恢复方式。', 'Build attachment through exploration, companions and local life; meet specific people before choosing a costly restoration in each region.'),
          beats: s('完成至少四个地区的见证链；每区都包含证人、实物、真实叙述、危险或阻力、地区结算；保留伙伴与物品连续性', 'Complete at least four regional witness chains; each needs a witness, object, truthful account, danger or resistance, and a regional settlement; preserve companions and inventory').split(zh ? '；' : ';'),
          completionFacts: ['witness-four', 'regional-sources-four'],
        },
        {
          id: 'homecoming-night', title: s('幕间：归名之夜', 'Interlude: The Night of Returned Names'), unlock: s('witness-four=true', 'witness-four=true'),
          emotionalPurpose: s('先给一次真正温暖的重逢，再揭示被删去的人已经继续生活，恢复原样同样会伤人。', 'Offer a genuinely warm reunion, then reveal that erased people kept living and that restoring the past can also hurt.'),
          beats: s('被删者短暂归来；玛拉见到母亲的新生活；玩家看见伊莱；天亮前只能留下有限的人或物；伙伴公开分歧', 'Erased people briefly return; Mara meets her mother’s new life; the player glimpses Eli; only limited people or objects can remain at dawn; companions openly disagree').split(zh ? '；' : ';'),
          completionFacts: ['homecoming-night-complete'],
        },
        {
          id: 'the-margins', title: s('第五章：写在页边的人', 'Chapter V: People Written in the Margins'), unlock: s('归名之夜完成后', 'After the Night of Returned Names'),
          emotionalPurpose: s('让玩家面对伊莱的爱与越界：他救了玩家，也未经同意决定了玩家的无名人生。', 'Confront Eli’s love and violation: he saved the player while deciding their nameless life without consent.'),
          beats: s('进入由记忆物件连接的页边聚落；找到伊莱；得知未登记真相；取得出生证据与最后一封信；决定原谅、追责或拒绝继承', 'Enter Margin settlements joined by remembered objects; find Eli; learn the unregistered truth; obtain birth evidence and the last letter; forgive, demand accountability or refuse the inheritance').split(zh ? '；' : ';'),
          completionFacts: ['margin-witness-page', 'eli-truth-known', 'player-birth-evidence'],
        },
        {
          id: 'apple-vale-loss', title: s('第六章：第二次失去苹果谷', 'Chapter VI: Losing Apple Vale Again'), unlock: s('页边章节完成且大修订临近', 'After the Margins as the Great Revision nears'),
          emotionalPurpose: s('把最熟悉的家变成最低点；玩家不能全救，但失去必须来自此前选择，而不是随机惩罚。', 'Turn the most familiar home into the low point; not everything can be saved, and the loss must grow from prior choices rather than randomness.'),
          beats: s('维尔切断恢复源头；返回苹果谷；在具体的人、可生活地点与关键证据间承担取舍；一项事物不可逆改变；取得第六张见证页', 'Veyr severs the source of restoration; return to Apple Vale; choose among people, livable places and key evidence; one thing changes irreversibly; secure the sixth witness page').split(zh ? '；' : ';'),
          completionFacts: ['apple-vale-witness-page', 'witness-all-six'],
        },
        {
          id: 'capital-approach', title: s('第三幕：知道你名字的猎手', 'Act III: The Hunter Who Knows Your Name'), unlock: s('witness-all-six=true', 'witness-all-six=true'),
          emotionalPurpose: s('让伙伴根据一路行为作出最终立场，并要求玩家在进入王都前兑现或拒绝具体承诺。', 'Let companions take final positions based on the journey and ask the player to accept or refuse concrete promises before the capital.'),
          beats: s('奥伦选择逮捕、决斗、护送或作证；玛拉决定画旧家还是变化后的家；塞拉决定物品归属；玩家决定是否恢复自己的名字；打开一条王都路径', 'Oren chooses arrest, duel, escort or testimony; Mara chooses an old or changed home map; Sera settles custody; the player considers restoring their name; one capital route opens').split(zh ? '；' : ';'),
          completionFacts: ['companions-reconciled', 'safe-routes-three'],
        },
        {
          id: 'ledger-tower', title: s('第四幕：王都不记得国王', 'Act IV: The Capital Does Not Remember Its King'), unlock: s('拥有六页见证并完成伙伴承诺', 'Six witness pages and companion commitments complete'),
          emotionalPurpose: s('承认维尔恐惧的灾难真实存在，同时证明他无权替所有人选择唯一版本。', 'Acknowledge that Veyr’s feared disaster is real while proving he cannot choose the sole version for everyone.'),
          beats: s('经公开申诉、骑士通道、页边或海路进入；获得总册权限；听完诺娅的两段人生；与维尔完成不可跳过的对话；进入连续终局行动', 'Enter through public appeal, knight route, Margins or coast; gain Ledger access; hear both of Noa’s lives; complete the unskippable Veyr dialogue; enter consecutive finale actions').split(zh ? '；' : ';'),
          completionFacts: ['ledger-access', 'veyr-dialogue-completed'],
        },
        {
          id: 'great-revision', title: s('终章：大修订', 'Finale: The Great Revision'), unlock: s('ledger-access=true 且 witness-four=true', 'ledger-access=true and witness-four=true'),
          emotionalPurpose: s('把制度选择变成对人物、名字、物品和道路的连续行动，并以不可撤销的代价换取有情绪重量的结局。', 'Turn institutional choices into actions involving people, names, objects and roads, paying an irreversible cost for an emotionally grounded ending.'),
          beats: s('让具体人物作证；交出或保留关键物；决定自己的名字；决定页边通道；处理维尔；冻结终局能力清单后生成并验证尾声', 'Choose concrete witnesses; give up or retain key objects; decide the player name; decide the Margin passage; deal with Veyr; freeze the ending capability list and generate a validated epilogue').split(zh ? '；' : ';'),
          completionFacts: ['true-ending-started'],
        },
      ],
      finaleRule: s(
        '只有玩家明确开始不可逆的大修订处理，且 ledger-access 与 witness-four 已存在时，才能发出 true_ending；此前任何章节结束都只能 session_end。',
        'Emit true_ending only after the player explicitly begins the irreversible Great Revision and ledger-access plus witness-four already exist; every earlier chapter boundary must use session_end.',
      ),
      choiceIntents: zh ? ['直接行动、保护或战斗', '调查地图、物品与环境规则', '依靠伙伴、说服证人或付出王印代价'] : ['act, protect, or fight', 'inspect a map, object, or environmental rule', 'rely on a companion, persuade a witness, or pay a seal cost'],
      fixedWorldRules: zh ? [
        '只有皇家总册与空白王印能改变登记事实；普通书写没有魔法。',
        '删除先影响记录和道路，再影响记忆与形体；被删去的人进入页边，而不是无声死亡。',
        '永久恢复需要活人见证、有来源且仍有用途的实物，以及真实叙述三者相容。王印只能把已证明的一项事实暂时写回到本章结束。',
        '伙伴身份、物品归属、伤势、承诺、已恢复地点和玩家后果跨场景与存档保持。',
        '大修订由主线承诺推进，不按回合数或现实时间结束。',
        '其他玩家只能留下可忽略的笔记、援助和公共工程，不得覆盖私人任务、伙伴、背包或结局。',
      ] : [
        'Only the Royal Ledger and blank seal can change registered reality; ordinary writing has no magic.',
        'Erasure takes records and roads first, then memory and form. Erased people enter the Margins rather than silently dying.',
        'Permanent restoration needs a living witness, a useful object with provenance and a truthful account. The seal restores one proven fact only until the chapter closes.',
        'Companions, ownership, injuries, promises, restored places and consequences persist across scenes and saves.',
        'The Great Revision advances through main-quest commitments, never a turn count or real timer.',
        'Other players may leave optional notes, aid and public works but cannot overwrite private quests, companions, inventory or endings.',
      ],
      generationRules: zh ? [
        '可生成当地居民、传闻、小遗迹、工作、宝物、天气与冲突，但不能发明第二本总册、第二枚王印、新统治者或替代主反派。',
        '每轮至少改变一项可追踪事实；正文中的即时选择必须与三个按钮完全一致，禁止用泛化“继续”代替。',
        '主要人物使用稳定身份，只知道亲历、听说或合理推断的事实；新团体不能替换当前队伍。',
        '每件稀有物品必须先说明能力、限制与来源，再真实进入背包。失败产生伤势、损失、分离、追捕或路线变化，不删除存档。',
        '结局只能组合存档已证明的能力与代价；必须写到所有伙伴与至少三个地区，不能生成零代价完美胜利。',
      ] : [
        'Create local residents, rumors, ruins, jobs, treasure, weather and conflict, but never a second Ledger, second blank seal, new ruler or replacement antagonist.',
        'Every turn changes a tracked fact. Visible alternatives and the three buttons must describe the same immediate decision; never replace them with generic Continue.',
        'Main characters keep stable identities and know only what they witnessed, heard or reasonably inferred. New groups never replace the current party.',
        'Before adding rare items, show ability, limitation and provenance. Failure causes injury, loss, separation, pursuit or route change, never save deletion.',
        'Endings combine only proven capabilities and costs, address every companion and at least three regions, and cannot be cost-free perfection.',
      ],
    },
    dangerDirector,
    endingDirector,
    initialFacts: {
      'player-unregistered': true, 'blank-seal-owned': true, 'no-false-evidence': true,
      'witness-pages': 0, 'ledger-access': false, 'apple-vale-erasure-confirmed': true,
    },
    statDefinitions: [
      { id: 'vitality', label: s('体力', 'Vitality'), min: 0, max: 100, initial: 82, inverse: true, display: 'bar', warningAt: 30, dangerAt: 0, maxDelta: 22 },
      { id: 'supplies', label: s('补给', 'Supplies'), min: 0, max: 12, initial: 7, inverse: true, display: 'number', warningAt: 2, dangerAt: 0, maxDelta: 3 },
      { id: 'recognition', label: s('被记得', 'Recognition'), min: 0, max: 100, initial: 48, inverse: true, display: 'bar', warningAt: 25, dangerAt: 5, maxDelta: 18 },
    ],
    drawerLabels: { party: s('同行者', 'Companions'), map: s('王国地图', 'Kingdom'), inventory: s('信使包', 'Courier Bag'), log: s('见证录', 'Witness Log') },
    opening: {
      location: s('苹果谷 · 村口', 'Apple Vale · Village Road'), time: s('修订前第 9 天 · 18:10', 'Nine days before Revision · 18:10'),
      objective: s('保护玛拉，并在天黑前写回一处安全地标', 'Protect Mara and restore one safe landmark before dark'),
      imagePrompt: 'cinematic grounded high fantasy, SUBJECT A stands separately from young cartographer Mara on the village road of warm Apple Vale at dusk, preserving the complete visible identity and silhouette from the supplied player reference; an ordinary sealed letter rests on a registry-house ledge near SUBJECT A instead of being held; Mara grips an old applewood ruler and urgently warns SUBJECT A while a blank road sign and distant orchard houses lose colour and dissolve into silent clean ivory absence; a confused wagon driver looks back from the road and the registry clerk remains only a small background figure in the doorway; this is the instant BEFORE the player chooses what to save, with visible space between SUBJECT A and Mara, shock and uncertainty, two readable focal subjects, restrained vermilion deletion traces, 4:5 portrait, central 58 percent safe composition; do not invent hands, limbs, face, skin, hair, anatomy, clothing or a human body that is not visible in the player reference; no handshake, no touching, no pulling, no rescue, no completed spell, no restored landmark, no royal seal being used, no battle, no knight, no text, no readable letters, no title, no logo, no UI, no frame',
      blocks: [
        { id: 'ek0', kind: 'narration', text: s('你刚把最后一封普通公文送进苹果谷，村书记拆开信封，路牌上的村名便先一步变成空白。远处的房屋正在失去颜色，护送你的车夫已经问这里为什么没有村庄。', 'You have just delivered an ordinary letter to Apple Vale. When the clerk opens it, the village name vanishes from the road sign. Distant houses lose their color, and your driver asks why there is no village here.'), data: { stageOverlay: 'true' } },
        { id: 'ek1', kind: 'dialogue', speaker: s('玛拉', 'Mara'), tone: s('抓住母亲的旧量尺', 'gripping her mother’s old ruler'), text: s('村子正在消失。别转身——你刚才看见这里了。请告诉我，你还记得。', 'The village is disappearing. Do not turn away—you saw this place. Tell me you still remember.') },
        { id: 'ek2', kind: 'event', text: s('书记桌上只剩一页被朱红线划掉的登记纸，以及藏在信封夹层里的空白王印。你只能先保住一处。', 'Only a registry page crossed in vermilion and a blank royal seal remain on the clerk’s desk. You can save one thing first.') },
      ],
      choices: [
        { id: 'save-mara', label: s('拉住正在褪色的玛拉', 'Hold on to the fading Mara') },
        { id: 'save-page', label: s('抢救书记桌上的登记页', 'Rescue the registry page') },
        { id: 'save-bridge', label: s('冲到桥头阻止道路消失', 'Run to keep the bridge road from vanishing') },
      ],
    },
    characters: [
      { id: 'mara-cartographer', name: s('玛拉', 'Mara'), role: s('苹果谷制图学徒', 'Apple Vale cartographer'), vitality: 74, stress: 48, initialStatus: 'known', skills: [{ id: 'mapping', label: s('制图', 'Mapping'), value: 4 }, { id: 'witness', label: s('作证', 'Witnessing'), value: 3 }], detail: s('紧握母亲的旧量尺，拒绝让家乡变成昨天不存在的地方。', 'She grips her mother’s old ruler and refuses to let home become a place that never existed.'), lore: s('她将逐渐明白，记住家乡不等于把所有人恢复成离开前的样子。', 'She will learn that remembering home is not the same as restoring everyone to who they were before.') },
      { id: 'oren-knight', name: s('奥伦', 'Oren'), role: s('皇家骑士', 'Royal knight'), vitality: 92, stress: 24, initialStatus: 'known', skills: [{ id: 'guard', label: s('守护', 'Guarding'), value: 4 }, { id: 'command', label: s('统率', 'Command'), value: 3 }], detail: s('正在循王印痕迹赶来。他相信自己是在阻止第二次灾难。', 'He is following the seal’s trace and believes he is preventing a second catastrophe.'), lore: s('他的忠诚会记录玩家是否伤害士兵、保护平民与伪造事实。', 'His loyalty remembers whether the player harms soldiers, protects civilians or falsifies evidence.') },
      { id: 'sera-peddler', name: s('塞拉', 'Sera'), role: s('被删物品商人', 'Dealer in erased objects'), vitality: 70, stress: 33, initialStatus: 'known', skills: [{ id: 'provenance', label: s('溯源', 'Provenance'), value: 4 }, { id: 'trade', label: s('交易', 'Trade'), value: 4 }], detail: s('在钟市保存无主物品的来历，并把保管与占有分得很清楚。', 'In Bell Market she preserves the provenance of ownerless things and distinguishes custody from possession.'), lore: s('她能让背包里的每件物品成为一个世界故事，而不是无来源的拾取列表。', 'She turns every item into world history rather than an ownerless pickup list.') },
      { id: 'eli-courier', name: s('伊莱', 'Eli'), role: s('被删去的皇家信使', 'Erased royal courier'), vitality: 61, stress: 65, initialStatus: 'known', skills: [{ id: 'routes', label: s('秘路', 'Hidden routes'), value: 5 }, { id: 'letters', label: s('信使誓言', 'Courier oath'), value: 4 }], detail: s('玩家失踪多年的导师，也是把王印藏进最后一封信的人。', 'The player’s long-missing mentor, who hid the seal inside the last letter.'), lore: s('他为了保护玩家，未经同意删去了玩家的正式登记。', 'To protect the player, he erased their registration without consent.') },
      { id: 'veyr-regent', name: s('维尔', 'Veyr'), role: s('白石摄政官', 'Regent of Whitestone'), vitality: 66, stress: 76, initialStatus: 'known', skills: [{ id: 'ledger', label: s('总册', 'Ledgercraft'), value: 5 }, { id: 'resolve', label: s('决断', 'Resolve'), value: 5 }], detail: s('关闭地方见证，只允许一个版本的现实存在。', 'He shut down local witnessing and permits only one version of reality.'), lore: s('他曾在两段同样真实的历史里失去女儿诺娅，因此恐惧并非虚构，权力却越过了所有人的选择。', 'He lost his daughter Noa across two equally real histories. His fear is genuine; his power denies everyone else a choice.') },
    ],
    initialMap: [
      { id: 'apple-vale', label: s('苹果谷', 'Apple Vale'), current: true, visited: true, detail: s('果园村庄正在从道路、记忆与远处房屋开始褪色。', 'An orchard village fading first from roads, memory and distant buildings.'), lore: s('一个普通村庄的生活，正是它值得存在的证据。', 'Its ordinary life is precisely why it deserves to exist.'), facts: [s('玛拉仍记得村庄', 'Mara still remembers it'), s('空白王印已被发现', 'The blank seal has been found')] },
      { id: 'oldwood', label: s('古林', 'Oldwood'), connectedTo: s('苹果谷', 'Apple Vale'), detail: s('被空白截断的溪流与旧驿道穿过巨木。', 'Old post roads and streams interrupted by ivory absence cross giant trees.'), lore: s('一条路是否会因王室不用而从未存在？', 'Does a road cease to have existed when the crown no longer uses it?') },
      { id: 'bell-market', label: s('钟市', 'Bell Market'), connectedTo: s('苹果谷', 'Apple Vale'), detail: s('欠债者消失，债务却仍被钟楼记录的层叠市场。', 'A layered market where debtors disappear while their debts remain recorded.'), lore: s('法律登记债务，却没有登记一个人对社区的价值。', 'The law records debt but not a person’s value to a community.') },
      { id: 'red-bastion', label: s('红堡边境', 'Red Bastion'), connectedTo: s('苹果谷', 'Apple Vale'), detail: s('同一座桥被两段战争历史撕向不同方向。', 'One bridge is pulled apart by two histories of the same war.'), lore: s('英雄与纵火者可能是同一批人。', 'The heroes and the arsonists may be the same soldiers.') },
      { id: 'lantern-coast', label: s('灯塔海岸', 'Lantern Coast'), connectedTo: s('苹果谷', 'Apple Vale'), detail: s('渡船仍记得一座被删除的岛，乘客却会忘记为何出发。', 'Ferries remember an erased island while passengers forget why they left.'), lore: s('没有合法名字的家，仍有人每天试图回去。', 'People try to return every day to a home with no legal name.') },
      { id: 'margins', label: s('页边', 'The Margins'), detail: s('被删去的人用仍被记得的物件连接起聚落。', 'Erased people connect settlements with objects that are still remembered.'), lore: s('这里不是死亡，而是一种随记忆变薄的生活。', 'This is not death, but a life thinned by memory.') },
      { id: 'capital', label: s('白石王都', 'Whitestone Capital'), detail: s('越接近总册塔，城市越像只允许一个版本的模型。', 'The closer to the Ledger Tower, the more the city resembles a model permitting one version only.'), lore: s('秩序保护了很多人，也决定了谁可以被删除。', 'Order protects many people while deciding who may be erased.') },
    ],
    initialInventory: [
      { id: 'blank-seal', label: s('空白王印', 'Blank Royal Seal'), count: 1, rarity: 'legendary', detail: s('没有刻字的黄铜王印，边缘留有三道装填见证墨的细槽。', 'An unengraved brass royal seal with three channels for witness ink.'), effect: s('把一项已经由证人、实物或现场证明的事实暂时写回；不能创造未知事实。每章三次，使用会暴露位置。', 'Temporarily restores one fact supported by a witness, object or scene. It cannot create unknown facts. Three uses per chapter reveal your position.'), lore: s('死去国王为灾难中的桥梁、避难所与失踪者下令制作，由伊莱藏进最后一封信。', 'The late king commissioned it for bridges, shelters and missing people; Eli hid it in the last letter.'), metrics: [{ label: s('见证墨', 'Witness ink'), value: '3 / 3' }, { label: s('追踪风险', 'Trace risk'), value: s('低', 'Low') }], imagePrompt: 'single unengraved brass royal seal with three fine vermilion ink channels, pale registry paper and dark courier cloth, museum-quality grounded fantasy artifact, no hands, no readable text, square' },
      { id: 'mara-ruler', label: s('玛拉母亲的旧量尺', 'Mara’s Mother’s Ruler'), count: 1, rarity: 'rare', detail: s('苹果木量尺仍刻着村桥的真实长度，空白无法改变刻痕间的距离。', 'An applewood ruler still marked with the true bridge length; absence cannot change the distance between cuts.'), effect: s('证明道路或建筑曾有具体尺寸，并能测出肉眼看不见的旧路边缘。', 'Proves a road or building had measurable dimensions and reveals the edge of an invisible route.'), lore: s('玛拉的母亲用它画完新桥后，把它留给女儿。', 'Mara’s mother left it to her after measuring the new bridge.'), metrics: [{ label: s('桥长刻度', 'Bridge mark'), value: '37.4 m' }, { label: s('所有者', 'Owner'), value: s('玛拉家族', 'Mara’s family') }], imagePrompt: 'single worn applewood survey ruler with hand-cut bridge measurements and brass hinge, grounded fantasy artifact study, no readable text, square' },
      { id: 'temporary-pass', label: s('边境临时通行证', 'Temporary Border Pass'), count: 1, detail: s('每个关口都承认它的印章，却很难稳定读出持有者姓名。', 'Every gate accepts its mark, but the bearer’s name is never read consistently.'), effect: s('通过普通边境关卡；低“被记得”时守卫可能再次盘问。', 'Passes ordinary border gates; at low Recognition, guards may question the bearer again.'), lore: s('它维持了玩家多年的信使生活，也暴露了未登记身份的裂缝。', 'It sustained the player’s courier life and reveals the fracture in their unregistered identity.'), metrics: [{ label: s('有效期', 'Validity'), value: s('大修订前', 'Until Revision') }], imagePrompt: 'single worn medieval courier transit pass with wax seal but no readable letters, dark cloth and pale paper, object only, square' },
    ],
    demoTurns: [...(zh ? demoZh : demoEn), ...buildErasedKingdomCampaign(locale)],
  }
}

const demoZh = [
  { match: ['玛拉', '拉住', '褪色'], imageSubject: 'player' as const, imagePrompt: 'border courier pulling a fading young cartographer out of expanding ivory absence in an orchard village, her applewood ruler between them, urgent physical action, grounded high fantasy, 4:5 portrait, no text, no UI', content: `你抓住玛拉的手腕。她的指尖已经透出身后的白色天空，旧量尺却沉得像一块锚。
[skill_check: skill="抓紧见证人" dc="10" rolls="12" modifier="2" total="14" result="success"]
[party_change: character_id="mara-cartographer" character="玛拉" change="add" role="苹果谷制图学徒" detail="被你从褪色边缘拉回，仍紧握母亲的旧量尺" lore="唯一持续记得苹果谷全貌的人" vitality="70" stress="58" skills="制图: 4|作证: 3"]
[fact: id="first-rescue" value="mara"]
[reputation: npc="玛拉" action="protected"]
[widget: recognition, add: 6]
玛拉指向桥、面包房与山坡钟楼。三处都还有见证，但王印只能先救一处。
[state: value="选择苹果谷第一个安全地标"]
[choices: "写回桥梁，保住离村道路"|"写回面包房，保住补给和村民"|"写回钟楼，获得危险预警"]` },
  { match: ['登记页', '书记', '纸'], imageSubject: 'player' as const, imagePrompt: 'courier diving across a village clerk desk to seize a vermilion-crossed registry page as the room turns into silent ivory absence, young cartographer reaching from doorway, 4:5 cinematic high fantasy, no readable text, no UI', content: `你扑到书记桌前。纸页边缘已经透明，朱红划线却仍然刺眼。你用空白王印压住纸角，房间短暂恢复重量。
[inventory: action="add" item="苹果谷登记残页" count="1" rarity="rare" detail="被朱红线划掉的原始村庄登记页，保住了收成与桥梁账的一角" effect="可证明苹果谷曾被皇家总册正式承认；单独不足以永久恢复村庄" lore="村书记在消失前用墨迹按住了最后一行普通生活记录" metrics="完整度: 38%|来源: 苹果谷书记处" image_prompt="single torn village registry page crossed by vermilion line, brass seal weight and drying ink, no readable text, object only, square"]
[fact: id="first-rescue" value="registry-page"]
[fact: id="apple-page-saved" value="true"]
门外，玛拉正在用母亲的量尺测一条肉眼看不见的路。你必须立刻决定先让哪里重新存在。
[choices: "写回桥梁，保住离村道路"|"写回面包房，保住补给和村民"|"写回钟楼，获得危险预警"]` },
  { match: ['桥头', '道路', '阻止'], imageSubject: 'player' as const, imagePrompt: 'courier sprinting onto a village stone bridge as its far half disappears into ivory void, cart and villagers stranded, young cartographer marking the true span, grounded fantasy action, 4:5 portrait, no text, no UI', content: `你在桥面完全变白前踏上最后一块有颜色的石头。玛拉隔岸喊出母亲量过的长度：三十七米四。
[skill_check: skill="判断道路" dc="11" rolls="13" modifier="2" total="15" result="success"]
[fact: id="first-rescue" value="bridge"]
[fact: id="bridge-length-witnessed" value="true"]
[widget: vitality, remove: 5]
量尺、你的脚步和桥下仍在流动的水互相印证。空白王印可以把桥写回，也可以把这次机会留给村里另一处。
[choices: "立刻写回桥梁"|"带证据回去写回面包房"|"登上山坡写回钟楼"]` },
  { match: ['写回桥', '桥梁'], imageSubject: 'player' as const, imagePrompt: 'milestone fantasy restoration, ivory absence growing back into a complete stone orchard bridge under a blank brass seal glow, villagers and courier crossing, young cartographer crying with relief, vermilion trace, 4:5 portrait, no text, no UI', content: `王印落下，空白里先长出桥墩，再长出潮湿石缝与车轮声。玛拉蹲下触摸母亲量过的第三十七米。
[fact: id="apple-anchor" value="bridge"]
[fact: id="apple-safe-route" value="true"]
[map_update: new_location="苹果谷石桥" connected_to="苹果谷" detail="被王印暂时写回的离村道路，石缝仍带朱红余光" lore="玛拉母亲的量尺、活人脚步与河水共同证明它存在" facts="可安全撤离|本章结束前保持存在"]
[widget: supplies, remove: 1]
[clock: value="修订前第 9 天 · 18:42"]
桥下响起刮纸般的喘息。姓名被划掉后形成的猎兽，正沿朱红痕迹爬来。
[encounter: phase="warning" kind="总册猎兽" severity="2"]
[choices: "挡在桥头保护撤离的人"|"观察猎兽如何追踪文字"|"让玛拉用地图把它引向假路"]` },
  { match: ['面包房', '补给'], imageSubject: 'player' as const, imagePrompt: 'milestone fantasy restoration, warm village bakery materializing from ivory absence around glowing ovens and flour-covered families, courier pressing blank seal to threshold, young cartographer witnessing, 4:5 portrait, no text, no UI', content: `王印落下，面包香气比墙壁更早回来。炉火照出三名原本已经被忘记的村民，他们立刻把食物分给正在撤离的人。
[fact: id="apple-anchor" value="bakery"]
[fact: id="apple-supply-source" value="true"]
[widget: supplies, add: 3]
[clock: value="修订前第 9 天 · 18:42"]
屋顶响起刮纸般的爪声。姓名被划掉后形成的猎兽，正沿王印痕迹逼近。
[encounter: phase="warning" kind="总册猎兽" severity="2"]
[choices: "守住门口让村民撤离"|"检查它是否只追逐文字"|"让玛拉画一条通向空屋的假路"]` },
  { match: ['钟楼', '预警', '山坡'], imageSubject: 'player' as const, imagePrompt: 'milestone fantasy restoration, hilltop bell tower reappearing from ivory absence as warm bronze bell rings over fading orchard village, courier and cartographer beneath, distant armored rider, 4:5 portrait, no text, no UI', content: `王印落下，钟声从不存在的地方撞回山谷。每一声都让褪色的村民多出一口逃离的时间，也照出远方一名骑士的轮廓。
[fact: id="apple-anchor" value="bell-tower"]
[fact: id="apple-warning-system" value="true"]
[widget: recognition, add: 8]
[clock: value="修订前第 9 天 · 18:42"]
钟影里，姓名被划掉后形成的猎兽，正沿王印痕迹爬上山坡。
[encounter: phase="warning" kind="总册猎兽" severity="2"]
[choices: "在台阶上迎击猎兽"|"观察钟影为何能阻挡它"|"让玛拉改画钟楼入口诱开它"]` },
  { match: ['保护', '迎击', '挡在', '守住'], imageSubject: 'player' as const, imagePrompt: 'border courier defending villagers from a pale beast made of crossed-out names, blank brass seal and short blade in decisive action, young cartographer pulling a child to safety, grounded high fantasy, natural anatomy, 4:5 portrait, no readable text, no UI', content: `你在猎兽越过人群前撞上它。短刀切不开那层空白，但王印碰到它胸口时，里面一串被删掉的名字突然重新发出声音。
[skill_check: skill="正面守护" dc="13" rolls="12" modifier="2" total="14" result="costly-success"]
[widget: vitality, remove: 12]
[fact: id="first-danger-method" value="direct"]
[encounter: phase="resolution" kind="总册猎兽" severity="2" outcome="costly-success"]
猎兽退回果园边缘。皇家骑士奥伦在余光里勒住马，要求你交出王印；他同时命令士兵先救人。
[choices: "把受伤的手给他看并拒绝交印"|"请他亲自核验玛拉的证物"|"带玛拉从已恢复路线撤离"]` },
  { match: ['观察', '文字', '钟影'], imageSubject: 'player' as const, imagePrompt: 'the same player protagonist border courier in the foreground studying where a pale ledger beast steps along abstract vermilion traces, face naturally visible, Mara secondary in side profile holding her ruler, villagers escaping behind, cinematic grounded fantasy, 4:5 portrait, no text, no UI', content: `你没有追着猎兽跑，而是看它落脚。它只踩有朱红痕迹的地面，碰到玛拉母亲那把没有官方文字的量尺时反而迟疑。
[skill_check: skill="识破规则" dc="12" rolls="15" modifier="2" total="17" result="success"]
[fact: id="first-danger-method" value="inspect"]
[encounter: phase="resolution" kind="总册猎兽" severity="2" outcome="success"]
玛拉擦掉一段线，猎兽失去道路。皇家骑士奥伦在村口勒马，要求核验王印；他显然也看见你保护了人群。
[choices: "让奥伦亲自检查量尺"|"问他是谁下令删除苹果谷"|"趁猎兽迷失，带玛拉撤离"]` },
  { match: ['玛拉', '假路', '引向', '诱开', '改画'], imageSubject: 'others' as const, imagePrompt: 'Mara the young cartographer rapidly drawing a false abstract vermilion route with an applewood ruler, pale ledger beast charging onto the empty orchard track, her own distinct face visible, grounded cinematic fantasy, 4:5 portrait, no readable text, no UI', content: `玛拉用量尺压住纸角，画出一条不存在却尺寸完整的路。你用最后一点见证墨让它维持十息。猎兽扑上假路，和那条路一起折进白色果园。
[skill_check: skill="伙伴协作" dc="13" rolls="14" modifier="2" total="16" result="success"]
[fact: id="first-danger-method" value="companion"]
[reputation: npc="玛拉" action="trusted-her-map"]
[encounter: phase="resolution" kind="总册猎兽" severity="2" outcome="success"]
远处，皇家骑士奥伦勒住马。他要求你交出王印，却先命令部下救起跌倒的村民。
[choices: "让奥伦核验玛拉的地图"|"拒绝交印并质问删除命令"|"带玛拉从安全路线撤离"]` },
  { match: ['奥伦', '核验', '命令', '拒绝', '撤离'], imageSubject: 'others' as const, imagePrompt: 'Oren the armored royal knight dismounted at dusk, verifying an applewood ruler and blank brass seal traces beside Mara while rescued villagers cross behind, tense reluctant respect, grounded high fantasy, 4:5 portrait, no text, no UI', content: `奥伦没有拔剑。他逐一看过量尺、王印留下的痕迹和仍在撤离的村民。
[奥伦] [main] [压低声音]: “我见过两段历史同时把一座桥撕开。把它交给我，我能阻止灾难；不交，我就必须记住你接下来做的每一件事。”
[character_update: character_id="oren-knight" character="奥伦" role="皇家骑士" detail="在苹果谷第一次核验玩家的证据，没有立刻逮捕" lore="相信唯一记录能阻止重页灾难，但已看见苹果谷确实存在" vitality="92" stress="38" skills="守护: 4|统率: 3"]
[fact: id="oren-witnessed-apple-vale" value="true"]
[fact: id="apple-vale-prologue-complete" value="true"]
[clock: value="修订前第 9 天 · 19:20"]
[state: value="离开苹果谷，寻找能让村庄永久存在的三种证据"]
玛拉把王国地图铺在已恢复的地面上。古林的道路正在断裂；钟市有人连同摊位一起被删除；红堡同一座桥出现两支军队；灯塔海岸的船仍驶向一座不存在的岛。
[session_end: reason="苹果谷序章完成。四个开放地区都可成为下一站，玛拉与此前选择会继续保留。"]
[choices: "前往古林寻找被删旧路"|"去钟市追查消失的摊主"|"选择红堡、灯塔海岸或任何自己的路线"]` },
  { match: ['前往古林寻找被删旧路', '进入古林'], imageSubject: 'player' as const, imagePrompt: 'the same player protagonist border courier leading into Oldwood under colossal trees, recognizable face visible in three-quarter view, Mara following at a smaller scale with her ruler, the lightning-split oak repeating as the road folds, grounded cinematic high fantasy, 4:5 portrait, no text, no UI', content: `你和玛拉沿北路离开苹果谷。半个时辰后，那棵被雷劈成两半的巨树第二次出现在前方；连树根旁同一只红色甲虫都没有挪动。
[map_update: new_location="古林" connected_to="苹果谷" detail="巨木之间的旧驿道被空白折成循环，溪流在断口两侧向相反方向流动" lore="王室停用旧路后，总册把仍被居民、守林人和动物使用的道路判作从未存在" facts="道路正在循环|玛拉仍同行"]
[fact: id="oldwood-entered" value="true"]
[clock: value="修订前第 8 天 · 09:10"]
[state: value="打破回声岔路，找到仍在使用旧路的人"]
玛拉把母亲的量尺贴在路石上。两次经过的刻痕完全重合：不是你们走错了，是这条路把尽头折回了起点。
[玛拉] [main] [困惑而专注]: “地图没有撒谎。有人把‘没人需要这条路’写成了事实。”
[choices: "让玛拉用量尺找出循环接缝"|"跟随仍能穿过白区的鹿群"|"你们分走两端，用呼喊确认方向"]` },
  { match: ['让玛拉用量尺找出循环接缝'], imageSubject: 'others' as const, imagePrompt: 'Mara kneeling beside an impossible repeated road stone in Oldwood, applewood ruler revealing a hairline ivory seam while a one-boot-worn roadkeeper watches under giant roots, grounded fantasy discovery, 4:5 portrait, no text, no UI', content: `玛拉沿每块路石量了七次，在第三十一步发现一道只有量尺能碰到的接缝。她把粉笔线越过接缝，线的另一头却从你身后出现。
[skill_check: skill="测出折路接缝" dc="10" rolls="14" modifier="2" total="16" result="success"]
[fact: id="oldwood-route-proof" value="measured-seam"]
一名背着路标锤的老人正坐在树根上换鞋：左靴磨穿，右靴还沾着昨天的干泥。
[character_update: character_id="toma-roadkeeper" character="托玛" role="古林守路人" detail="每天试图从东村走到西村，却总被折路送回原处；左靴磨穿而右靴仍干净" lore="由两村共同雇用，记得旧驿道的每个交点，却没有皇家资格证明它仍有价值" vitality="68" stress="43" skills="守路: 4|辨迹: 3"]
[choices: "帮托玛补好磨穿的左靴并听他讲路"|"请托玛带你们去空白溪流的交点"|"拿临时通行证与旧路标逐项核对"]` },
  { match: ['跟随仍能穿过白区的鹿群'], imageSubject: 'others' as const, imagePrompt: 'Mara and an old roadkeeper watching a red deer herd cross an ivory gap in a forest road, hoofprints continuing where official stones vanish, giant trees and broken stream, grounded cinematic fantasy, 4:5 portrait, no text, no UI', content: `鹿群没有走驿道，而是踩着一条侧坡旧径穿过空白。每头鹿都在同一处跃起，落地时蹄上带着另一条溪的黑泥。
[skill_check: skill="读取迁徙痕迹" dc="10" rolls="12" modifier="2" total="14" result="success"]
[fact: id="oldwood-route-proof" value="living-migration"]
鹿群尽头，一名守路老人正在换鞋：左靴磨穿，右靴仍干净。他自称托玛，说自己每天都从东村出发，却从没能抵达等待药材的西村。
[character_update: character_id="toma-roadkeeper" character="托玛" role="古林守路人" detail="每天试图从东村走到西村，却总被折路送回原处；左靴磨穿而右靴仍干净" lore="由两村共同雇用，记得旧驿道的每个交点，却没有皇家资格证明它仍有价值" vitality="68" stress="43" skills="守路: 4|辨迹: 3"]
[choices: "帮托玛补好磨穿的左靴并听他讲路"|"请托玛带你们去空白溪流的交点"|"拿临时通行证与旧路标逐项核对"]` },
  { match: ['你们分走两端，用呼喊确认方向'], imageSubject: 'player' as const, imagePrompt: 'courier and Mara walking opposite directions from a forest fork yet facing each other again through folded space, old roadkeeper between them with mismatched worn boots, colossal trees and ivory road gaps, grounded high fantasy, 4:5 portrait, no text, no UI', content: `你向东，玛拉向西。你们背对背走了五十步，下一声呼喊却从彼此前方传来。一个坐在树根上的老人抬起两只不同磨损的靴子：“欢迎来到一条只有起点的路。”
[skill_check: skill="双端作证" dc="10" rolls="11" modifier="2" total="13" result="success"]
[fact: id="oldwood-route-proof" value="two-ended-witness"]
[character_update: character_id="toma-roadkeeper" character="托玛" role="古林守路人" detail="每天试图从东村走到西村，却总被折路送回原处；左靴磨穿而右靴仍干净" lore="由两村共同雇用，记得旧驿道的每个交点，却没有皇家资格证明它仍有价值" vitality="68" stress="43" skills="守路: 4|辨迹: 3"]
托玛说东村缺盐，西村缺退烧药，而总册把两地之间的等待一起删掉了。
[choices: "帮托玛补好磨穿的左靴并听他讲路"|"请托玛带你们去空白溪流的交点"|"拿临时通行证与旧路标逐项核对"]` },
  { match: ['帮托玛补好磨穿的左靴并听他讲路', '请托玛带你们去空白溪流的交点', '拿临时通行证与旧路标逐项核对'], imageSubject: 'others' as const, imagePrompt: 'Mara and roadkeeper Toma at a broken stream junction beneath giant roots, uncovering a double-headed brass mile nail embedded between two road stones, practical trust and discovery, grounded high fantasy, 4:5 portrait, no text, no UI', content: `托玛没有先谈王室。他先说东村的孩子怎样数送药车的铃声，西村的面包师怎样把第一炉面包留给守路人。随后，他带你们来到一条被空白截断的溪流。
[reputation: npc="托玛" action="earned-roadkeeper-trust"]
[fact: id="toma-provenance-shared" value="true"]
两块旧路石之间露出一枚黄铜双头路钉。托玛认得它：两村共同出钱，旧邮驿铸造，一头指向盐仓，一头指向药房。它不是王室赏赐，而是两边都在等对方的证据。
[state: value="从折叠溪流中取出双向里程钉，并核对它的两个终点"]
[choices: "系绳涉过空白溪流取出路钉"|"用量尺和树影定位真正的交点"|"让玛拉与托玛在两岸同时叫出目的地"]` },
  { match: ['系绳涉过空白溪流取出路钉', '用量尺和树影定位真正的交点', '让玛拉与托玛在两岸同时叫出目的地'], imageSubject: 'player' as const, imagePrompt: 'courier retrieving a double-headed brass mile nail from a stream broken by ivory absence while Mara and Toma anchor a rope from opposite banks, immediate physical action, grounded cinematic high fantasy, 4:5 portrait, no text, no UI', content: `你踏进空白时，水声先消失，脚下的冷意却还在。玛拉用量尺固定这一岸，托玛在另一岸喊出药房的名字；两道声音重合时，路钉忽然变得沉重。
[skill_check: skill="固定双端交点" dc="13" rolls="13" modifier="2" total="15" result="success"]
[inventory: action="add" item_id="oldwood-two-way-mile-nail" item="双向里程钉" count="1" rarity="rare" detail="两头分别指向东村盐仓与西村药房的黄铜路钉，表面留着两村共同出资的不同锤痕" effect="在两端都有活人记得目的地、且已核对旧路交点时，可让一段被删道路短暂保持同一方向；不能制造新路" lore="由古林东西两村共同出资、旧邮驿铸造，托玛在玩家帮助取回并核对两端后交给玩家保管" metrics="稳定端点: 2|可锚定交点: 1" image_prompt="single double-headed brass milestone nail with two differently worn hammer faces, damp moss and dark courier cloth, grounded high fantasy artifact study, no people, no hands, no readable text, square"]
[fact: id="oldwood-mile-nail-owned" value="true"]
[widget: supplies, remove: 1]
托玛把路钉装进你的信使包。就在扣带合上时，断枝向树干倒飞，脚印从前方回到你脚下——一只把道路折回原处的折路兽沿新显出的交点扑来，远处也响起皇家测路猎手的号角。
[encounter: phase="warning" kind="折路兽" severity="3"]
[choices: "挡住折路兽，让两岸居民先通过"|"用溪水、量尺和树影找出折叠接缝"|"让玛拉和托玛从两端钉住同一地点"]` },
  { match: ['挡住折路兽，让两岸居民先通过'], imageSubject: 'player' as const, imagePrompt: 'courier bracing against a wolf-like route-folding beast at a broken forest stream while villagers cross a newly fixed path, Mara and Toma anchoring the route behind, grounded action fantasy, natural anatomy, 4:5 portrait, no text, no UI', content: `你把绳索缠上手臂，迎着折路兽撞去。它每次扑击都让你退回同一块石头；你索性守住那块石头，直到最后一名送药人越过溪流。
[skill_check: skill="守住交点" dc="13" rolls="11" modifier="2" total="13" result="costly-success"]
[widget: vitality, remove: 14]
[fact: id="oldwood-danger-method" value="direct"]
[encounter: phase="resolution" kind="折路兽" severity="3" outcome="costly-success"]
折路兽被双向路钉卡在两个方向之间。皇家测路猎手赶到，声称这条“无收益道路”必须重新封闭。
[choices: "当面展示两村正在交换的盐和药"|"抹去王印痕迹，把猎手引向循环旧路"|"请托玛作证，并把消息送给奥伦"]` },
  { match: ['用溪水、量尺和树影找出折叠接缝'], imageSubject: 'others' as const, imagePrompt: 'Mara aligning an applewood ruler with stream reflections and tree shadows to expose the seam of folded space, route-folding beast trapped between mismatched forest paths, Toma holding the mile nail, grounded fantasy, 4:5 portrait, no text, no UI', content: `你观察到树影向西，溪面倒影却向东。玛拉把量尺卡进两种方向之间，托玛一锤将路钉敲进那条不可见的缝。
[skill_check: skill="识破折叠规则" dc="13" rolls="16" modifier="2" total="18" result="success"]
[fact: id="oldwood-danger-method" value="terrain"]
[encounter: phase="resolution" kind="折路兽" severity="3" outcome="success"]
折路兽被自己的回头路卷进空白。皇家测路猎手赶到，声称这条“无收益道路”必须重新封闭。
[choices: "当面展示两村正在交换的盐和药"|"抹去王印痕迹，把猎手引向循环旧路"|"请托玛作证，并把消息送给奥伦"]` },
  { match: ['让玛拉和托玛从两端钉住同一地点'], imageSubject: 'others' as const, imagePrompt: 'Mara and roadkeeper Toma hammering opposite ends of one brass mile nail from two separated forest banks as folded space straightens, route beast suspended between routes, grounded cinematic high fantasy, 4:5 portrait, no text, no UI', content: `玛拉在东岸画下真实距离，托玛在西岸报出每个旧交点。你在中间举起路钉；当他们同时敲下，折路兽失去让道路只剩一个起点的力量。
[skill_check: skill="双端协作" dc="13" rolls="15" modifier="2" total="17" result="success"]
[reputation: npc="玛拉" action="accepted-changing-map"]
[reputation: npc="托玛" action="trusted-shared-road"]
[fact: id="oldwood-danger-method" value="companions"]
[encounter: phase="resolution" kind="折路兽" severity="3" outcome="success"]
折路兽散成两串相反的脚印。皇家测路猎手赶到，声称这条“无收益道路”必须重新封闭。
[choices: "当面展示两村正在交换的盐和药"|"抹去王印痕迹，把猎手引向循环旧路"|"请托玛作证，并把消息送给奥伦"]` },
  { match: ['当面展示两村正在交换的盐和药', '抹去王印痕迹，把猎手引向循环旧路', '请托玛作证，并把消息送给奥伦'], imageSubject: 'others' as const, imagePrompt: 'Oldwood villagers carrying salt and medicine meet across a restored stream crossing while royal survey hunters hesitate, Mara holds a revised map and Toma raises a road hammer, social standoff in grounded high fantasy, 4:5 portrait, no text, no UI', content: `猎手看见盐包与药箱在溪边交换，却仍坚持只有登记的皇家直路才算道路。托玛问他：“如果一条路每天有人等，它究竟是没价值，还是没给王室赚钱？”
[fact: id="oldwood-hunters-confronted" value="true"]
[clock: value="修订前第 8 天 · 16:40"]
[state: value="决定古林今后由哪一种道路秩序连接"]
玛拉摊开旧图。写回皇家直路最快，但会压掉采药小径和鹿道；把所有支路画进共同图册最公平，却需要两村长期维护；只锚定三处过河点能保住迁徙带，但货车仍要绕行。
[choices: "恢复皇家直路，换取最快补给通道"|"建立两村共同维护的多路图"|"只锚定过河点，保留动物迁徙带"]` },
  { match: ['恢复皇家直路，换取最快补给通道'], imageSubject: 'environment' as const, imagePrompt: 'a straight royal post road restored through Oldwood with medicine carts moving quickly, smaller herbal paths fading at its edges, Mara and Toma watching with mixed relief and concern, grounded cinematic fantasy, 4:5 portrait, no text, no UI', content: `空白王印沿旧驿道压出一条笔直道路。第一辆药车在天黑前抵达，代价是两条采药小径和一段鹿道再次变淡。
[fact: id="oldwood-resolution" value="royal-road"]
[fact: id="oldwood-witness-page" value="true"]
[fact: id="witness-pages" value="1"]
[fact: id="regional-sources-one" value="true"]
[map_update: new_location="古林皇家驿道" connected_to="古林" detail="补给最快的直路已经恢复，支路与迁徙带受到挤压" lore="托玛、双向里程钉与两村交换的盐药证明这条路今天仍被需要" facts="见证页已取得|皇家测路猎手暂时退让|采药支路变薄"]
[widget: supplies, add: 2]
[reputation: npc="托玛" action="accepted-fast-road-with-cost"]
玛拉没有把消失的小径擦掉，而是用虚线留在图上：“地图也该记得我们没能保住什么。”
[session_end: reason="古林见证页完成。皇家直路恢复，但支路与迁徙带的代价会继续存在。"]
[choices: "前往钟市追查被删摊主"|"去红堡调查两段战争历史"|"前往灯塔海岸，或返回古林处理支路"]` },
  { match: ['建立两村共同维护的多路图'], imageSubject: 'others' as const, imagePrompt: 'villagers from two forest settlements placing many modest trail markers across Oldwood while Mara draws a living multi-route map and Toma teaches children to maintain it, hopeful grounded high fantasy, 4:5 portrait, no text, no UI', content: `你没有让王印替所有人选一条路。两村居民从两端走来，每人确认一段仍在使用的小径；玛拉把重合部分画成第一张可以公开修改的多路图。
[fact: id="oldwood-resolution" value="common-atlas"]
[fact: id="oldwood-witness-page" value="true"]
[fact: id="witness-pages" value="1"]
[fact: id="regional-sources-one" value="true"]
[fact: id="common-atlas-seed" value="true"]
[map_update: new_location="古林众路图" connected_to="古林" detail="两村共同维护的多条生活道路，通行较慢但任何一条不会因王室停用而独自消失" lore="托玛、双向里程钉与两端居民每天的用途共同构成见证" facts="见证页已取得|多路维护启动|皇家猎手仍会复查"]
[reputation: npc="玛拉" action="chose-living-map"]
[reputation: npc="托玛" action="shared-roadkeeping"]
托玛把路标锤交给一个孩子，让他先画自己每天去取水的路。玛拉低声说：“地图不是命令。原来它也可以是一场持续的作证。”
[session_end: reason="古林见证页完成。众路图开始运转，但它需要居民长期维护。"]
[choices: "前往钟市追查被删摊主"|"去红堡调查两段战争历史"|"前往灯塔海岸，或返回古林帮助维护"]` },
  { match: ['只锚定过河点，保留动物迁徙带'], imageSubject: 'environment' as const, imagePrompt: 'three modest anchored stream crossings glowing through a wild Oldwood migration corridor, deer and people sharing the landscape while carts take a longer path, Mara and Toma at the nearest crossing, grounded high fantasy, 4:5 portrait, no text, no UI', content: `你把王印只用在三处过河点，让道路之间的森林保持未登记。鹿群先穿过，随后是背着药箱的人；货车必须绕行，生命却没有再被迫服从一条直线。
[fact: id="oldwood-resolution" value="wild-corridor"]
[fact: id="oldwood-witness-page" value="true"]
[fact: id="witness-pages" value="1"]
[fact: id="regional-sources-one" value="true"]
[fact: id="safe-crossings-one" value="true"]
[map_update: new_location="古林三处渡点" connected_to="古林" detail="三处交点被稳定，迁徙带完整保留，居民步行可通但货运仍困难" lore="双向里程钉证明目的地，活人脚步与动物迁徙共同证明路径" facts="见证页已取得|迁徙带保留|货运绕行"]
[widget: supplies, remove: 1]
[reputation: npc="托玛" action="protected-migration-and-crossings"]
玛拉把空白留在地图中央，却第一次没有把它画成缺失：“这里不是没人用。这里是我们决定不占有。”
[session_end: reason="古林见证页完成。迁徙带被保留，三处渡点可通，但补给路线仍然艰难。"]
[choices: "前往钟市追查被删摊主"|"去红堡调查两段战争历史"|"前往灯塔海岸，或返回古林护送补给"]` },
]

const demoEn = [
  { match: ['mara', 'hold', 'fading'], imageSubject: 'player' as const, imagePrompt: 'border courier pulling a fading young cartographer out of expanding ivory absence in an orchard village, her applewood ruler between them, urgent physical action, grounded high fantasy, 4:5 portrait, no text, no UI', content: `You seize Mara's wrist. Her fingertips show the white sky behind them, but the old ruler weighs like an anchor.
[skill_check: skill="Hold the witness" dc="10" rolls="12" modifier="2" total="14" result="success"]
[party_change: character_id="mara-cartographer" character="Mara" change="add" role="Apple Vale cartographer" detail="Pulled back from the fading edge, still holding her mother's ruler" lore="The only person who continuously remembers all of Apple Vale" vitality="70" stress="58" skills="Mapping: 4|Witnessing: 3"]
[fact: id="first-rescue" value="mara"]
[reputation: npc="Mara" action="protected"]
[widget: recognition, add: 6]
Mara points to the bridge, bakery and hill bell. Each still has a person or object that remembers it, but the blank seal can restore only one first.
[state: value="Choose Apple Vale's first safe landmark"]
[choices: "Restore the bridge and keep an escape road"|"Restore the bakery and save supplies"|"Restore the bell tower for warning"]` },
  { match: ['page', 'registry', 'desk'], imageSubject: 'player' as const, imagePrompt: 'courier diving across a village clerk desk to seize a vermilion-crossed registry page as the room turns into silent ivory absence, young cartographer reaching from doorway, 4:5 cinematic high fantasy, no readable text, no UI', content: `You dive across the clerk's desk. The page edge is already transparent, but its vermilion line remains vivid. The blank seal gives the room weight for one breath.
[inventory: action="add" item="Apple Vale Registry Fragment" count="1" rarity="rare" detail="Original village registry crossed in vermilion, preserving part of its harvest and bridge account" effect="Proves Apple Vale was formally registered, but cannot restore it alone" lore="The clerk held down one ordinary line of village life before disappearing" metrics="Integrity: 38%|Source: Apple Vale clerk's office" image_prompt="single torn village registry page crossed by vermilion line, brass seal weight and drying ink, no readable text, object only, square"]
[fact: id="first-rescue" value="registry-page"]
[fact: id="apple-page-saved" value="true"]
Outside, Mara measures an invisible road with her mother's ruler. You must decide what becomes real first.
[choices: "Restore the bridge and keep an escape road"|"Restore the bakery and save supplies"|"Restore the bell tower for warning"]` },
  { match: ['bridge', 'road', 'run'], imageSubject: 'player' as const, imagePrompt: 'courier sprinting onto a village stone bridge as its far half disappears into ivory void, cart and villagers stranded, young cartographer marking the true span, grounded fantasy action, 4:5 portrait, no text, no UI', content: `You step onto the last colored stone before the bridge turns white. Across the gap, Mara calls the length her mother measured: thirty-seven point four meters.
[skill_check: skill="Read the road" dc="11" rolls="13" modifier="2" total="15" result="success"]
[fact: id="first-rescue" value="bridge"]
[fact: id="bridge-length-witnessed" value="true"]
[widget: vitality, remove: 5]
The ruler, your footsteps and the moving river agree. The seal can restore the bridge, or you can carry the proof to another landmark.
[choices: "Restore the bridge now"|"Carry the proof to the bakery"|"Climb to restore the hill bell"]` },
  { match: ['restore the bridge', 'escape road'], imageSubject: 'player' as const, imagePrompt: 'milestone fantasy restoration, ivory absence growing back into a complete stone orchard bridge under a blank brass seal glow, villagers and courier crossing, young cartographer crying with relief, vermilion trace, 4:5 portrait, no text, no UI', content: `The seal falls. Piers grow first, then wet mortar and wheel noise. Mara touches the thirty-seventh meter her mother once measured.
[fact: id="apple-anchor" value="bridge"]
[fact: id="apple-safe-route" value="true"]
[map_update: new_location="Apple Vale Stone Bridge" connected_to="Apple Vale" detail="An escape road temporarily restored by the seal" lore="Mara's ruler, living footsteps and the river jointly prove it" facts="Safe evacuation|Persists until chapter end"]
[widget: supplies, remove: 1]
[clock: value="Nine days before Revision · 18:42"]
Below, breathing like scraped paper, a beast made from crossed-out names climbs the seal's vermilion trace.
[encounter: phase="warning" kind="Ledger beast" severity="2"]
[choices: "Hold the bridge while people escape"|"Study how the beast follows writing"|"Let Mara lure it onto a false map road"]` },
  { match: ['bakery', 'supplies'], imageSubject: 'player' as const, imagePrompt: 'milestone fantasy restoration, warm village bakery materializing from ivory absence around glowing ovens and flour-covered families, courier pressing blank seal to threshold, young cartographer witnessing, 4:5 portrait, no text, no UI', content: `The smell of bread returns before the walls. Three forgotten villagers appear in the firelight and begin sharing food with evacuees.
[fact: id="apple-anchor" value="bakery"]
[fact: id="apple-supply-source" value="true"]
[widget: supplies, add: 3]
[clock: value="Nine days before Revision · 18:42"]
Claws scrape the roof. A beast made from crossed-out names follows the seal's trace.
[encounter: phase="warning" kind="Ledger beast" severity="2"]
[choices: "Guard the door while villagers escape"|"Check whether it can only follow writing"|"Let Mara draw a false road toward an empty house"]` },
  { match: ['bell', 'warning', 'hill'], imageSubject: 'player' as const, imagePrompt: 'milestone fantasy restoration, hilltop bell tower reappearing from ivory absence as warm bronze bell rings over fading orchard village, courier and cartographer beneath, distant armored rider, 4:5 portrait, no text, no UI', content: `The seal falls and a bell strikes from a place that did not exist. Each note gives the fading villagers one more breath to flee and reveals a rider in the distance.
[fact: id="apple-anchor" value="bell-tower"]
[fact: id="apple-warning-system" value="true"]
[widget: recognition, add: 8]
[clock: value="Nine days before Revision · 18:42"]
A beast made from crossed-out names crawls uphill along the seal's trace.
[encounter: phase="warning" kind="Ledger beast" severity="2"]
[choices: "Meet the beast on the stair"|"Study why the bell's shadow stops it"|"Let Mara redraw the entrance to lure it away"]` },
  { match: ['guard', 'hold', 'meet', 'protect'], imageSubject: 'player' as const, imagePrompt: 'border courier defending villagers from a pale beast made of crossed-out names, blank brass seal and short blade in decisive action, young cartographer pulling a child to safety, grounded high fantasy, natural anatomy, 4:5 portrait, no readable text, no UI', content: `You hit the beast before it reaches the crowd. Steel cannot cut the white hide, but when the seal touches its chest, erased names speak from inside it.
[skill_check: skill="Stand guard" dc="13" rolls="12" modifier="2" total="14" result="costly-success"]
[widget: vitality, remove: 12]
[fact: id="first-danger-method" value="direct"]
[encounter: phase="resolution" kind="Ledger beast" severity="2" outcome="costly-success"]
The beast retreats. Royal knight Oren reins in and demands the seal—while ordering his soldiers to help the villagers first.
[choices: "Show your wound and refuse"|"Ask him to verify Mara's proof"|"Leave with Mara by the restored route"]` },
  { match: ['study', 'writing', 'shadow', 'check'], imageSubject: 'player' as const, imagePrompt: 'the same player protagonist border courier in the foreground studying where a pale ledger beast steps along abstract vermilion traces, face naturally visible, Mara secondary in side profile holding her ruler, villagers escaping behind, cinematic grounded fantasy, 4:5 portrait, no text, no UI', content: `You watch where it steps. It can only travel on vermilion traces and hesitates at Mara's ruler, which carries no official writing.
[skill_check: skill="Expose the rule" dc="12" rolls="15" modifier="2" total="17" result="success"]
[fact: id="first-danger-method" value="inspect"]
[encounter: phase="resolution" kind="Ledger beast" severity="2" outcome="success"]
Mara wipes away one line and the beast loses its road. Royal knight Oren arrives, demanding to verify the seal—and having clearly seen you protect the villagers.
[choices: "Let Oren examine the ruler"|"Ask who ordered Apple Vale erased"|"Leave with Mara while the beast is lost"]` },
  { match: ['mara', 'false', 'lure', 'redraw'], imageSubject: 'others' as const, imagePrompt: 'Mara the young cartographer rapidly drawing a false abstract vermilion route with an applewood ruler, pale ledger beast charging onto the empty orchard track, her own distinct face visible, grounded cinematic fantasy, 4:5 portrait, no readable text, no UI', content: `Mara pins the page with her ruler and draws a complete road that never existed. You spend a trace of witness ink to hold it for ten breaths. The beast charges and folds into the white orchard with the false path.
[skill_check: skill="Companion teamwork" dc="13" rolls="14" modifier="2" total="16" result="success"]
[fact: id="first-danger-method" value="companion"]
[reputation: npc="Mara" action="trusted-her-map"]
[encounter: phase="resolution" kind="Ledger beast" severity="2" outcome="success"]
Royal knight Oren reins in. He demands the seal but first orders his soldiers to lift a fallen villager.
[choices: "Let Oren verify Mara's map"|"Refuse and question the erasure order"|"Take Mara out by the safe route"]` },
  { match: ['oren', 'verify', 'order', 'refuse', 'leave'], imageSubject: 'others' as const, imagePrompt: 'Oren the armored royal knight dismounted at dusk, verifying an applewood ruler and blank brass seal traces beside Mara while rescued villagers cross behind, tense reluctant respect, grounded high fantasy, 4:5 portrait, no text, no UI', content: `Oren does not draw his sword. He examines the ruler, the seal's trace and the people still escaping.
[Oren] [main] [quietly]: "I have seen two histories tear one bridge apart. Give me that seal and I can prevent another disaster. Refuse, and I must remember everything you do next."
[character_update: character_id="oren-knight" character="Oren" role="Royal knight" detail="Verified the player's evidence at Apple Vale without making an arrest" lore="Believes one record prevents overlap, but now knows Apple Vale existed" vitality="92" stress="38" skills="Guarding: 4|Command: 3"]
[fact: id="oren-witnessed-apple-vale" value="true"]
[fact: id="apple-vale-prologue-complete" value="true"]
[clock: value="Nine days before Revision · 19:20"]
[state: value="Leave Apple Vale and find the three kinds of proof needed to restore it permanently"]
Mara opens the kingdom map. Oldwood's road is breaking; Bell Market is losing people with their stalls; one Red Bastion bridge carries two armies; Lantern Coast ferries still seek an island that does not exist.
[session_end: reason="Apple Vale prologue complete. All four regions are open, and Mara and every earlier choice persist."]
[choices: "Enter Oldwood and find the erased road"|"Go to Bell Market after the missing vendors"|"Choose Red Bastion, Lantern Coast, or any route of your own"]` },
  { match: ['Enter Oldwood and find the erased road', 'enter Oldwood'], imageSubject: 'player' as const, imagePrompt: 'the same player protagonist border courier leading into Oldwood under colossal trees, recognizable face visible in three-quarter view, Mara following at a smaller scale with her ruler, the lightning-split oak repeating as the road folds, grounded cinematic high fantasy, 4:5 portrait, no text, no UI', content: `You and Mara take the north road out of Apple Vale. Half an hour later, the lightning-split oak appears ahead for a second time. Even the red beetle beside its root has not moved.
[map_update: new_location="Oldwood" connected_to="Apple Vale" detail="The old post road loops beneath giant trees while a stream flows in opposite directions across an ivory break" lore="After the crown retired the road, the Ledger declared a route still used by villagers, keepers and animals to have never existed" facts="Road loops back on itself|Mara remains in the party"]
[fact: id="oldwood-entered" value="true"]
[clock: value="Eight days before Revision · 09:10"]
[state: value="Break the Echo Fork and find the people who still use the old road"]
Mara lays her mother's ruler against a road stone. The cuts from both passes overlap exactly. You are not lost; the road has folded its destination back onto its beginning.
[Mara] [main] [puzzled but intent]: "The map did not lie. Someone turned 'the crown no longer needs this road' into a fact."
[choices: "Let Mara measure the seam in the loop"|"Follow the deer that still cross the ivory gap"|"Walk opposite directions and call to confirm the ends"]` },
  { match: ['Let Mara measure the seam in the loop'], imageSubject: 'others' as const, imagePrompt: 'Mara kneeling beside an impossible repeated road stone in Oldwood, applewood ruler revealing a hairline ivory seam while a one-boot-worn roadkeeper watches under giant roots, grounded fantasy discovery, 4:5 portrait, no text, no UI', content: `Mara measures every stone seven times. At step thirty-one, she finds a seam only the ruler can touch. Her chalk line crosses it and reappears behind you.
[skill_check: skill="Measure the folded seam" dc="10" rolls="14" modifier="2" total="16" result="success"]
[fact: id="oldwood-route-proof" value="measured-seam"]
An old man with a road hammer sits on a root changing boots: the left sole is worn through; yesterday's dry mud still clings to the right.
[character_update: character_id="toma-roadkeeper" character="Toma" role="Oldwood roadkeeper" detail="He tries to walk from East Village to West Village every day, but the folded road returns him to the start; his left boot is worn through while the right stays clean" lore="Employed jointly by both villages, he remembers every old junction but has no royal standing to prove the road remains useful" vitality="68" stress="43" skills="Roadkeeping: 4|Tracking: 3"]
[choices: "Help mend Toma's worn boot and hear the road's history"|"Ask Toma to lead you to the broken stream junction"|"Compare your temporary pass with each old road marker"]` },
  { match: ['Follow the deer that still cross the ivory gap'], imageSubject: 'others' as const, imagePrompt: 'Mara and an old roadkeeper watching a red deer herd cross an ivory gap in a forest road, hoofprints continuing where official stones vanish, giant trees and broken stream, grounded cinematic fantasy, 4:5 portrait, no text, no UI', content: `The deer ignore the post road and take a hillside trail through the white gap. Every animal leaps at the same point and lands with black mud from another stream on its hooves.
[skill_check: skill="Read the migration trail" dc="10" rolls="12" modifier="2" total="14" result="success"]
[fact: id="oldwood-route-proof" value="living-migration"]
At the trail's end, an old roadkeeper changes his boots: the left is worn through; the right remains clean. Toma says he leaves East Village every morning and never reaches the medicine waiting in West Village.
[character_update: character_id="toma-roadkeeper" character="Toma" role="Oldwood roadkeeper" detail="He tries to walk from East Village to West Village every day, but the folded road returns him to the start; his left boot is worn through while the right stays clean" lore="Employed jointly by both villages, he remembers every old junction but has no royal standing to prove the road remains useful" vitality="68" stress="43" skills="Roadkeeping: 4|Tracking: 3"]
[choices: "Help mend Toma's worn boot and hear the road's history"|"Ask Toma to lead you to the broken stream junction"|"Compare your temporary pass with each old road marker"]` },
  { match: ['Walk opposite directions and call to confirm the ends'], imageSubject: 'player' as const, imagePrompt: 'courier and Mara walking opposite directions from a forest fork yet facing each other again through folded space, old roadkeeper between them with mismatched worn boots, colossal trees and ivory road gaps, grounded high fantasy, 4:5 portrait, no text, no UI', content: `You walk east while Mara walks west. After fifty steps with your backs turned, her next call comes from directly ahead. A man on a root raises two differently worn boots. "Welcome to a road with nothing but a beginning."
[skill_check: skill="Witness both ends" dc="10" rolls="11" modifier="2" total="13" result="success"]
[fact: id="oldwood-route-proof" value="two-ended-witness"]
[character_update: character_id="toma-roadkeeper" character="Toma" role="Oldwood roadkeeper" detail="He tries to walk from East Village to West Village every day, but the folded road returns him to the start; his left boot is worn through while the right stays clean" lore="Employed jointly by both villages, he remembers every old junction but has no royal standing to prove the road remains useful" vitality="68" stress="43" skills="Roadkeeping: 4|Tracking: 3"]
Toma says East Village has no salt, West Village has no fever medicine, and the Ledger erased the fact that each is still waiting for the other.
[choices: "Help mend Toma's worn boot and hear the road's history"|"Ask Toma to lead you to the broken stream junction"|"Compare your temporary pass with each old road marker"]` },
  { match: ["Help mend Toma's worn boot and hear the road's history", 'Ask Toma to lead you to the broken stream junction', 'Compare your temporary pass with each old road marker'], imageSubject: 'others' as const, imagePrompt: 'Mara and roadkeeper Toma at a broken stream junction beneath giant roots, uncovering a double-headed brass mile nail embedded between two road stones, practical trust and discovery, grounded high fantasy, 4:5 portrait, no text, no UI', content: `Toma does not begin with the crown. He tells you how children in East Village counted the medicine cart's bells, and how the West Village baker saved the first loaf for the roadkeeper. Then he leads you to a stream broken by ivory absence.
[reputation: npc="Toma" action="earned-roadkeeper-trust"]
[fact: id="toma-provenance-shared" value="true"]
A double-headed brass mile nail shows between two road stones. Toma knows it: both villages paid for it, the old courier post cast it, one head pointed to the salt store and the other to the infirmary. It was never a royal gift. It proves both ends were waiting.
[state: value="Retrieve the two-way mile nail and verify both destinations"]
[choices: "Cross the blank stream on a rope and pull the nail free"|"Use the ruler and tree shadows to locate the true junction"|"Have Mara and Toma call both destinations from opposite banks"]` },
  { match: ['Cross the blank stream on a rope and pull the nail free', 'Use the ruler and tree shadows to locate the true junction', 'Have Mara and Toma call both destinations from opposite banks'], imageSubject: 'player' as const, imagePrompt: 'courier retrieving a double-headed brass mile nail from a stream broken by ivory absence while Mara and Toma anchor a rope from opposite banks, immediate physical action, grounded cinematic high fantasy, 4:5 portrait, no text, no UI', content: `When you step into the blank, the sound of water vanishes but its cold remains. Mara fixes this bank with the ruler. Toma calls the infirmary from the other. When the two voices meet, the mile nail suddenly gains weight.
[skill_check: skill="Fix the two-ended junction" dc="13" rolls="13" modifier="2" total="15" result="success"]
[inventory: action="add" item_id="oldwood-two-way-mile-nail" item="Two-way Mile Nail" count="1" rarity="rare" detail="A double-headed brass road nail pointing toward East Village's salt store and West Village's infirmary, bearing different hammer marks from both communities" effect="Where living people remember both destinations and the old junction has been verified, it can briefly hold an erased route in one direction; it cannot create a new road" lore="Funded by both Oldwood villages and cast by the old courier post, then entrusted to the player by Toma after its two ends were recovered and verified" metrics="Stable endpoints: 2|Junctions anchored: 1" image_prompt="single double-headed brass milestone nail with two differently worn hammer faces, damp moss and dark courier cloth, grounded high fantasy artifact study, no people, no hands, no readable text, square"]
[fact: id="oldwood-mile-nail-owned" value="true"]
[widget: supplies, remove: 1]
Toma places the nail in your courier bag. As the clasp shuts, broken branches fly backward into trunks and footprints return beneath your boots. A route-folding beast follows the revealed junction, while the horns of royal survey hunters sound in the distance.
[encounter: phase="warning" kind="Route-folding beast" severity="3"]
[choices: "Hold off the beast while people cross"|"Use the stream, ruler and shadows to expose the fold"|"Let Mara and Toma pin the same place from both ends"]` },
  { match: ['Hold off the beast while people cross'], imageSubject: 'player' as const, imagePrompt: 'courier bracing against a wolf-like route-folding beast at a broken forest stream while villagers cross a newly fixed path, Mara and Toma anchoring the route behind, grounded action fantasy, natural anatomy, 4:5 portrait, no text, no UI', content: `You wrap the rope around your arm and meet the beast. Each lunge returns you to the same stone, so you defend that stone until the last medicine carrier crosses.
[skill_check: skill="Hold the junction" dc="13" rolls="11" modifier="2" total="13" result="costly-success"]
[widget: vitality, remove: 14]
[fact: id="oldwood-danger-method" value="direct"]
[encounter: phase="resolution" kind="Route-folding beast" severity="3" outcome="costly-success"]
The two-way nail traps the beast between directions. Royal survey hunters arrive and insist this "unprofitable road" must be sealed again.
[choices: "Show them the salt and medicine changing hands"|"Erase the seal trace and lure them into the loop"|"Ask Toma to testify and send word to Oren"]` },
  { match: ['Use the stream, ruler and shadows to expose the fold'], imageSubject: 'others' as const, imagePrompt: 'Mara aligning an applewood ruler with stream reflections and tree shadows to expose the seam of folded space, route-folding beast trapped between mismatched forest paths, Toma holding the mile nail, grounded fantasy, 4:5 portrait, no text, no UI', content: `Tree shadows point west while their reflections point east. Mara wedges the ruler between those directions, and Toma drives the nail into the invisible seam.
[skill_check: skill="Expose the folding rule" dc="13" rolls="16" modifier="2" total="18" result="success"]
[fact: id="oldwood-danger-method" value="terrain"]
[encounter: phase="resolution" kind="Route-folding beast" severity="3" outcome="success"]
The beast rolls into its own returning path. Royal survey hunters arrive and insist this "unprofitable road" must be sealed again.
[choices: "Show them the salt and medicine changing hands"|"Erase the seal trace and lure them into the loop"|"Ask Toma to testify and send word to Oren"]` },
  { match: ['Let Mara and Toma pin the same place from both ends'], imageSubject: 'others' as const, imagePrompt: 'Mara and roadkeeper Toma hammering opposite ends of one brass mile nail from two separated forest banks as folded space straightens, route beast suspended between routes, grounded cinematic high fantasy, 4:5 portrait, no text, no UI', content: `Mara marks the true distance from the east bank while Toma names every junction from the west. You hold the nail between them. Their hammers fall together, and the beast loses the power to leave a road with only one beginning.
[skill_check: skill="Two-ended teamwork" dc="13" rolls="15" modifier="2" total="17" result="success"]
[reputation: npc="Mara" action="accepted-changing-map"]
[reputation: npc="Toma" action="trusted-shared-road"]
[fact: id="oldwood-danger-method" value="companions"]
[encounter: phase="resolution" kind="Route-folding beast" severity="3" outcome="success"]
The beast scatters into two trails of opposing prints. Royal survey hunters arrive and insist this "unprofitable road" must be sealed again.
[choices: "Show them the salt and medicine changing hands"|"Erase the seal trace and lure them into the loop"|"Ask Toma to testify and send word to Oren"]` },
  { match: ['Show them the salt and medicine changing hands', 'Erase the seal trace and lure them into the loop', 'Ask Toma to testify and send word to Oren'], imageSubject: 'others' as const, imagePrompt: 'Oldwood villagers carrying salt and medicine meet across a restored stream crossing while royal survey hunters hesitate, Mara holds a revised map and Toma raises a road hammer, social standoff in grounded high fantasy, 4:5 portrait, no text, no UI', content: `The hunters see salt sacks and medicine cases change hands beside the stream, yet insist only a registered royal road counts. Toma asks, "If someone waits for a road every day, is it worthless—or merely unprofitable to the crown?"
[fact: id="oldwood-hunters-confronted" value="true"]
[clock: value="Eight days before Revision · 16:40"]
[state: value="Decide what kind of road order will connect Oldwood"]
Mara opens the old map. Restoring the royal line is fastest but suppresses herb paths and deer trails. A shared atlas preserves every lived route but needs continual care. Anchoring only three crossings protects migration, but carts must still make a long detour.
[choices: "Restore the royal road for the fastest supply route"|"Create a multi-route atlas maintained by both villages"|"Anchor only the crossings and preserve the migration corridor"]` },
  { match: ['Restore the royal road for the fastest supply route'], imageSubject: 'environment' as const, imagePrompt: 'a straight royal post road restored through Oldwood with medicine carts moving quickly, smaller herbal paths fading at its edges, Mara and Toma watching with mixed relief and concern, grounded cinematic fantasy, 4:5 portrait, no text, no UI', content: `The blank seal presses a straight road through the old post line. The first medicine cart arrives before dark, while two herb paths and part of the deer trail fade at its edges.
[fact: id="oldwood-resolution" value="royal-road"]
[fact: id="oldwood-witness-page" value="true"]
[fact: id="witness-pages" value="1"]
[fact: id="regional-sources-one" value="true"]
[map_update: new_location="Oldwood Royal Post Road" connected_to="Oldwood" detail="The fastest supply line is restored, but side paths and migration routes are thinning" lore="Toma, the two-way mile nail and today's exchange of salt and medicine prove the road remains needed" facts="Witness page secured|Survey hunters withdrew for now|Herb paths thinning"]
[widget: supplies, add: 2]
[reputation: npc="Toma" action="accepted-fast-road-with-cost"]
Mara does not erase the paths you failed to save. She keeps them as dotted lines. "A map should remember what our choice cost."
[session_end: reason="Oldwood witness page complete. The royal road is restored, and the cost to side paths and migration will persist."]
[choices: "Go to Bell Market after the erased vendors"|"Travel to Red Bastion and investigate its two war histories"|"Head for Lantern Coast, or return to Oldwood's side paths"]` },
  { match: ['Create a multi-route atlas maintained by both villages'], imageSubject: 'others' as const, imagePrompt: 'villagers from two forest settlements placing many modest trail markers across Oldwood while Mara draws a living multi-route map and Toma teaches children to maintain it, hopeful grounded high fantasy, 4:5 portrait, no text, no UI', content: `You do not let the seal choose one road for everyone. Villagers walk from both ends and verify each path they still use. Mara draws the overlaps into the first map designed to remain publicly correctable.
[fact: id="oldwood-resolution" value="common-atlas"]
[fact: id="oldwood-witness-page" value="true"]
[fact: id="witness-pages" value="1"]
[fact: id="regional-sources-one" value="true"]
[fact: id="common-atlas-seed" value="true"]
[map_update: new_location="Oldwood Common Routes" connected_to="Oldwood" detail="Multiple lived paths maintained by both villages; travel is slower, but no route vanishes solely because the crown retires it" lore="Toma, the two-way mile nail and daily use from both ends form the witness" facts="Witness page secured|Shared maintenance begun|Royal review remains possible"]
[reputation: npc="Mara" action="chose-living-map"]
[reputation: npc="Toma" action="shared-roadkeeping"]
Toma hands his road hammer to a child and asks him to mark the path he takes for water. Mara says, "A map is not an order. It can be a continuing act of witness."
[session_end: reason="Oldwood witness page complete. The common routes now work, but they require lasting community care."]
[choices: "Go to Bell Market after the erased vendors"|"Travel to Red Bastion and investigate its two war histories"|"Head for Lantern Coast, or return to help maintain Oldwood"]` },
  { match: ['Anchor only the crossings and preserve the migration corridor'], imageSubject: 'environment' as const, imagePrompt: 'three modest anchored stream crossings glowing through a wild Oldwood migration corridor, deer and people sharing the landscape while carts take a longer path, Mara and Toma at the nearest crossing, grounded high fantasy, 4:5 portrait, no text, no UI', content: `You use the seal only at three stream crossings and leave the forest between them unregistered. Deer pass first, then medicine carriers. Carts must detour, but living movement is no longer forced into one line.
[fact: id="oldwood-resolution" value="wild-corridor"]
[fact: id="oldwood-witness-page" value="true"]
[fact: id="witness-pages" value="1"]
[fact: id="regional-sources-one" value="true"]
[fact: id="safe-crossings-one" value="true"]
[map_update: new_location="Oldwood Three Crossings" connected_to="Oldwood" detail="Three junctions are stable and the migration corridor remains whole; people can walk through, but freight stays difficult" lore="The two-way mile nail proves destinations, while living footsteps and animal migration prove the routes" facts="Witness page secured|Migration corridor preserved|Freight detours"]
[widget: supplies, remove: 1]
[reputation: npc="Toma" action="protected-migration-and-crossings"]
Mara leaves the center blank, but for the first time does not mark it as missing. "This is not unused. It is something we chose not to own."
[session_end: reason="Oldwood witness page complete. The migration corridor remains and three crossings work, but supplies still travel slowly."]
[choices: "Go to Bell Market after the erased vendors"|"Travel to Red Bastion and investigate its two war histories"|"Head for Lantern Coast, or return to escort supplies through Oldwood"]` },
]

export const theErasedKingdom = build('zh')
export const theErasedKingdomEn = build('en')
