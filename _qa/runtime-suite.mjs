import { chromium } from '/Users/yin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import { mkdirSync } from 'node:fs'

const testCase = process.argv[2] || 'persistence'
const baseUrl = process.env.STORY_QA_URL || 'http://127.0.0.1:4184/'
const avatarUrl = 'https://qa.invalid/player-avatar.jpg'
const transparentGif = 'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'zh-CN' })
await context.addInitScript(() => {
  const NativeAudioContext = window.AudioContext || window.webkitAudioContext
  window.__audioQa = { created: 0, oscillatorStarts: 0, bufferStarts: 0 }
  if (!NativeAudioContext) return
  class TrackedAudioContext extends NativeAudioContext {
    constructor(...args) { super(...args); window.__audioQa.created += 1 }
    createOscillator() {
      const node = super.createOscillator(); const start = node.start.bind(node)
      node.start = (...args) => { window.__audioQa.oscillatorStarts += 1; return start(...args) }
      return node
    }
    createBufferSource() {
      const node = super.createBufferSource(); const start = node.start.bind(node)
      node.start = (...args) => { window.__audioQa.bufferStarts += 1; return start(...args) }
      return node
    }
  }
  Object.defineProperty(window, 'AudioContext', { configurable: true, value: TrackedAudioContext })
  Object.defineProperty(window, 'webkitAudioContext', { configurable: true, value: TrackedAudioContext })
})
if (testCase === 'avatar-late-profile') {
  await context.addInitScript(({ avatarUrl }) => {
    window.addEventListener('message', (event) => {
      if (typeof event.data !== 'string' || !event.data.startsWith('callAPI-')) return
      try {
        const request = JSON.parse(decodeURIComponent(escape(atob(event.data.slice(8)))))
        if (!String(request.url).includes('/note/telegram/user/get/info/by/telegram_id')) return
        const callback = window[`__aigram_cb_${String(request.request_id).replace(/-/g, '_')}`]
        callback?.(JSON.stringify({
          request_id: request.request_id,
          success: true,
          data: { retcode: 0, msg: 'ok', data: { name: 'Late Bridge Player', head_url: avatarUrl } },
        }))
      } catch { /* the production bridge timeout will surface a regression */ }
    })
    window.setTimeout(() => {
      window.Aigram = { isInAigram: true, telegramId: 'late-player-42' }
      window.postMessage('qa-shell-identity-ready', '*')
    }, 4_200)
  }, { avatarUrl })
}

const page = await context.newPage()
const imageRequests = []
await page.route('https://images.aiwaves.tech/alteru/guest-shell.js', (route) => route.fulfill({ contentType: 'application/javascript', body: '' }))
await page.route(avatarUrl, (route) => route.fulfill({ contentType: 'image/gif', body: Buffer.from(transparentGif, 'base64') }))
await page.route('https://game.aiwaves.tech/alteru-media/api/v1/images/generations', async (route) => {
  const payload = route.request().postDataJSON()
  imageRequests.push({ ...payload, ref_url: payload.reference_urls?.[0] })
  if (testCase === 'opening-coherence') return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
  if (testCase === 'item-images' && String(payload.prompt || '').includes('inventory artifact plate')) {
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  const now = Date.now()
  return route.fulfill({ contentType: 'application/json', body: JSON.stringify({
    request_id: payload.request_id,
    task_id: `qa-image-${imageRequests.length}`,
    type: 'image',
    status: 'succeeded',
    media: { type: 'image', url: `data:image/gif;base64,${transparentGif}`, width: payload.size.width, height: payload.size.height, format: 'png' },
    created_at: now,
    updated_at: now,
  }) })
})
await page.route('https://chat.aiwaves.tech/aigram/api/gen-image', (route) => {
  imageRequests.push(route.request().postDataJSON())
  if (testCase === 'opening-coherence') return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
  return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ url: `data:image/gif;base64,${transparentGif}` }) })
})
await page.route('https://chat.aiwaves.tech/aigram/api/gen-video', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }))
await page.route('https://chat.aiwaves.tech/aigram/api/game-chat', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }))

async function fresh(lang = 'zh', avatar = false) {
  const query = new URLSearchParams({ story_mode: 'demo', lang })
  if (avatar) { query.set('avatar_url', avatarUrl); query.set('user_name', 'Alexandria Fieldnotes') }
  await page.goto(`${baseUrl}?${query}`, { waitUntil: 'networkidle' })
  await page.evaluate(() => window.alteruLocalStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
}

async function enter(label = '走进正在消失的苹果谷') {
  await page.getByRole('button', { name: label }).click()
  await page.locator('.st-shell').waitFor({ state: 'visible' })
}

async function chooseFirst() {
  const choice = page.locator('.st-quick-replies button').first()
  await choice.waitFor({ state: 'visible' })
  await choice.click()
  await page.locator('.ct-turn-next').waitFor({ state: 'visible', timeout: 10000 })
}

if (testCase === 'persistence') {
  await fresh(); await enter(); await chooseFirst()
  const saved = await page.evaluate(() => JSON.parse(window.alteruLocalStorage.getItem('the-erased-kingdom-save') || '{}').worlds?.['the-erased-kingdom'])
  if (!saved || saved.scene !== 1 || saved.choices.length !== 3) throw new Error(`turn was not persisted: ${JSON.stringify(saved)}`)
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('dialog').waitFor()
  await page.getByRole('button', { name: '继续游戏' }).click()
  if (await page.locator('.st-quick-replies button').count() !== 3) throw new Error('resume did not restore three choices')
} else if (testCase === 'choice-recovery') {
  await fresh(); await enter(); await chooseFirst()
  await page.evaluate(() => {
    const key = 'the-erased-kingdom-save'; const archive = JSON.parse(window.alteruLocalStorage.getItem(key) || '{}')
    archive.worlds['the-erased-kingdom'].choices = []; window.alteruLocalStorage.setItem(key, JSON.stringify(archive))
  })
  await page.reload({ waitUntil: 'networkidle' }); await page.getByRole('button', { name: '继续游戏' }).click()
  const choices = await page.locator('.st-quick-replies button').allTextContents()
  if (choices.length !== 3 || choices.some((label) => /继续送完这封信/.test(label))) throw new Error(`choice recovery failed: ${JSON.stringify(choices)}`)
} else if (testCase === 'item-images') {
  await fresh(); await enter()
  await page.getByRole('button', { name: '世界' }).click(); await page.getByRole('button', { name: '信使包' }).click()
  await page.locator('.st-inventory-reveal').waitFor({ state: 'visible' })
  await page.waitForFunction(() => {
    const archive = JSON.parse(window.alteruLocalStorage.getItem('the-erased-kingdom-save') || '{}')
    return archive.worlds?.['the-erased-kingdom']?.inventory?.some((item) => item.imageStatus === 'ready')
  }, null, { timeout: 9000 })
  const itemPrompt = imageRequests.map((request) => String(request.prompt || '')).find((prompt) => prompt.includes('inventory artifact plate'))
  if (!itemPrompt || !itemPrompt.includes('Do not borrow any location, landmark, character, composition, or prop')) throw new Error('inventory art direction was not isolated from the cover')
} else if (testCase === 'audio') {
  await fresh()
  const before = await page.evaluate(() => window.__audioQa)
  if (before.created !== 0) throw new Error('audio started before a gesture')
  await enter()
  const after = await page.evaluate(() => window.__audioQa)
  if (after.created !== 1 || after.oscillatorStarts < 1 || after.bufferStarts < 1) throw new Error(`gesture did not unlock audible graph: ${JSON.stringify(after)}`)
} else if (testCase === 'opening-coherence') {
  mkdirSync('_qa/ui', { recursive: true })
  await fresh(); await page.addStyleTag({ content: '#alteru-guest-banner{display:none!important}' }); await enter()
  const opening = await page.evaluate(() => {
    const archive = JSON.parse(window.alteruLocalStorage.getItem('the-erased-kingdom-save') || '{}')
    return archive.worlds?.['the-erased-kingdom']?.blocks?.find((block) => block.id === 'image-0')
  })
  if (opening?.data?.playerVisible !== 'true' || !String(opening?.data?.prompt).includes('BEFORE the player chooses')) throw new Error(`opening image contract missing: ${JSON.stringify(opening)}`)
  await page.locator('.ct-stage__media img').waitFor({ state: 'visible' })
  const caption = await page.locator('.ct-stage__caption p').textContent()
  if (!caption?.includes('村书记拆开信封')) throw new Error(`opening caption does not match the pictured crisis: ${caption}`)
  await page.screenshot({ path: '_qa/ui/cinematic-civic-opening-coherence-platform-layout-390x844.png' })
  await page.setViewportSize({ width: 320, height: 568 })
  await page.screenshot({ path: '_qa/ui/cinematic-civic-opening-coherence-platform-layout-320x568.png' })
} else if (testCase === 'restart') {
  await fresh(); await enter(); await chooseFirst(); await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: '重新开始' }).click(); await page.getByRole('button', { name: '确认从头开始' }).click()
  await page.getByRole('button', { name: '走进正在消失的苹果谷' }).waitFor()
  const reset = await page.evaluate(() => JSON.parse(window.alteruLocalStorage.getItem('the-erased-kingdom-save') || '{}').worlds?.['the-erased-kingdom'])
  if (reset.scene !== 0 || reset.entered !== false) throw new Error('restart did not isolate and reset this world')
} else if (testCase === 'status-drawer') {
  await fresh(); await enter()
  if (await page.locator('.st-chat-stat').count() !== 3) throw new Error('header must expose exactly three stats')
  await page.locator('.st-chat-stat').first().click(); await page.locator('.st-player-detail').waitFor()
  if (await page.locator('.st-player-status-card').count() !== 3) throw new Error('player detail omitted a stat')
  if (await page.locator('.st-world-detail__links button').count() !== 3) throw new Error('player detail does not link to world sections')
} else if (testCase === 'i18n') {
  await fresh('en')
  await page.getByRole('heading', { name: 'THE ERASED KINGDOM' }).waitFor()
  await enter('Enter the vanishing Apple Vale')
  await page.getByRole('button', { name: 'World' }).waitFor()
  const labels = await page.locator('.st-quick-replies button').allTextContents()
  if (labels.length !== 3 || labels.some((label) => /[\u3400-\u9fff]/.test(label))) throw new Error(`English choices contain Chinese: ${JSON.stringify(labels)}`)
} else if (testCase === 'avatar') {
  await fresh('zh', true); await enter()
  await page.getByRole('button', { name: '世界' }).click()
  const player = page.locator('.st-roster__player')
  await player.getByText('Alexandria Fieldnotes', { exact: true }).waitFor()
  const displayedAvatar = await player.locator('img').getAttribute('src')
  if (displayedAvatar !== avatarUrl) throw new Error(`player record did not use the supplied avatar: ${displayedAvatar}; url=${page.url()}`)
  await page.getByRole('button', { name: '关闭', exact: true }).click(); await chooseFirst()
  await page.waitForFunction(() => {
    const archive = JSON.parse(window.alteruLocalStorage.getItem('the-erased-kingdom-save') || '{}')
    return archive.worlds?.['the-erased-kingdom']?.blocks?.some((block) => block.kind === 'image' && block.id !== 'image-0' && block.data?.status === 'ready')
  }, null, { timeout: 9000 })
  const openingCharacterRequest = imageRequests.find((request) => request.ref_url && String(request.prompt).includes('BEFORE the player chooses'))
  if (!openingCharacterRequest || openingCharacterRequest.ref_url !== avatarUrl) throw new Error(`original avatar reference was not used for the opening player: ${JSON.stringify(imageRequests)}`)
  const actionCharacterRequest = imageRequests.find((request) => request !== openingCharacterRequest && request.ref_url && String(request.prompt).includes('HARD FULL-VISUAL-IDENTITY CAST MAP'))
  if (!actionCharacterRequest) throw new Error('identity action contract missing from the first chosen action prompt')
  await page.locator('.ct-turn-next').click()
  await page.getByRole('button', { name: '写回桥梁，保住离村道路' }).click()
  await page.waitForFunction(() => {
    const archive = JSON.parse(window.alteruLocalStorage.getItem('the-erased-kingdom-save') || '{}')
    return archive.worlds?.['the-erased-kingdom']?.blocks?.find((block) => block.id === 'image-2')?.data?.status === 'ready'
  }, null, { timeout: 12000 })
  const protagonistRequests = imageRequests.filter((request) => request.ref_url)
  if (protagonistRequests.length < 3) throw new Error(`consecutive protagonist scenes lost the avatar reference: ${JSON.stringify(imageRequests)}`)
  if (protagonistRequests.some((request) => request.ref_url !== avatarUrl)) throw new Error(`player reference changed between scenes: ${JSON.stringify(protagonistRequests)}`)
  if (protagonistRequests.some((request) => request.mode !== 'edit')) throw new Error(`player scene did not use the identity-detail edit endpoint: ${JSON.stringify(protagonistRequests)}`)
  if (protagonistRequests.some((request) => String(request.prompt).length > 4000)) throw new Error(`player prompt exceeded the Media Service contract: ${JSON.stringify(protagonistRequests.map((request) => String(request.prompt).length))}`)
  if (protagonistRequests.some((request) => !String(request.prompt).includes('HARD FULL-VISUAL-IDENTITY CAST MAP'))) throw new Error(`a player scene omitted the full visual identity cast map: ${JSON.stringify(protagonistRequests)}`)
  if (protagonistRequests.some((request) => !String(request.prompt).includes('MUST NOT be invented'))) throw new Error(`a player scene omitted absent-body protection: ${JSON.stringify(protagonistRequests)}`)
  if (protagonistRequests.some((request) => /[\u3400-\u9fff]/.test(String(request.prompt)))) throw new Error('a renderer prompt leaked Chinese characters')
  const identityVersions = await page.evaluate(() => {
    const archive = JSON.parse(window.alteruLocalStorage.getItem('the-erased-kingdom-save') || '{}')
    return archive.worlds?.['the-erased-kingdom']?.blocks
      ?.filter((block) => block.kind === 'image' && block.data?.playerVisible === 'true')
      ?.map((block) => block.data?.identityRefVersion)
  })
  if (!identityVersions?.length || identityVersions.some((version) => version !== 2)) throw new Error(`player images were not stamped with the identity renderer version: ${JSON.stringify(identityVersions)}`)
} else if (testCase === 'avatar-late-profile') {
  await fresh(); await enter()
  await page.waitForFunction(() => {
    const archive = JSON.parse(window.alteruLocalStorage.getItem('the-erased-kingdom-save') || '{}')
    return archive.worlds?.['the-erased-kingdom']?.blocks?.find((block) => block.id === 'image-0')?.data?.status === 'ready'
  }, null, { timeout: 12000 })
  const openingRequest = imageRequests.find((request) => String(request.prompt).includes('BEFORE the player chooses'))
  if (openingRequest?.ref_url !== avatarUrl || openingRequest?.mode !== 'edit') {
    throw new Error(`opening image started before the late player identity was ready: ${JSON.stringify(imageRequests)}`)
  }
  await page.getByRole('button', { name: '世界' }).click()
  const latePlayer = page.locator('.st-roster__player')
  await latePlayer.getByText('Late Bridge Player', { exact: true }).waitFor()
  if (await latePlayer.locator('img').getAttribute('src') !== avatarUrl) throw new Error('late shell avatar was not reflected in the player record')
} else if (testCase === 'avatar-saved-opening-repair') {
  await fresh('zh', true); await enter(); await chooseFirst()
  await page.waitForFunction(() => {
    const archive = JSON.parse(window.alteruLocalStorage.getItem('the-erased-kingdom-save') || '{}')
    return archive.worlds?.['the-erased-kingdom']?.blocks?.find((block) => block.id === 'image-1')?.data?.status === 'ready'
  }, null, { timeout: 12000 })
  await page.evaluate(() => {
    const key = 'the-erased-kingdom-save'
    const archive = JSON.parse(window.alteruLocalStorage.getItem(key) || '{}')
    archive.worlds['the-erased-kingdom'].blocks = archive.worlds['the-erased-kingdom'].blocks.map((block) => {
      if (block.id !== 'image-0' && block.id !== 'image-1') return block
      const data = { ...block.data, status: 'ready', url: `https://qa.invalid/legacy-${block.id}.png`, playerVisible: 'true' }
      delete data.identityRefVersion
      return { ...block, data }
    })
    window.alteruLocalStorage.setItem(key, JSON.stringify(archive))
  })
  const beforeRepair = imageRequests.length
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForFunction(() => {
    const archive = JSON.parse(window.alteruLocalStorage.getItem('the-erased-kingdom-save') || '{}')
    const early = archive.worlds?.['the-erased-kingdom']?.blocks?.filter((block) => block.id === 'image-0' || block.id === 'image-1') ?? []
    return early.length === 2 && early.every((block) => block.data?.status === 'ready' && block.data?.identityRefVersion === 2)
  }, null, { timeout: 15000 })
  const repairedRequests = imageRequests.slice(beforeRepair)
  if (repairedRequests.length !== 2 || repairedRequests.some((request) => request.ref_url !== avatarUrl)) {
    throw new Error(`saved opening images were not repaired with the player reference: ${JSON.stringify(repairedRequests)}`)
  }
} else if (testCase === 'finale-flow') {
  const route = [
    '拉住正在褪色的玛拉', '写回面包房，保住补给和村民', '检查它是否只追逐文字', '让奥伦亲自检查量尺',
    '前往古林寻找被删旧路', '让玛拉用量尺找出循环接缝', '帮托玛补好磨穿的左靴并听他讲路', '用量尺和树影定位真正的交点',
    '用溪水、量尺和树影找出折叠接缝', '当面展示两村正在交换的盐和药', '建立两村共同维护的多路图',
    '前往钟市追查被删摊主', '检查只记债务的铜钟', '把摊主名字写入社区共同保管册',
    '前往红堡调查两段战争历史', '要求奥伦亲自走过两段历史', '公开纵火证据并保留救援者姓名',
    '去灯塔海岸寻找不存在的岛', '沿船身磨痕反推旧航线', '让渡船与乘客共同维护记忆航线',
    '回苹果谷参加归名之夜', '帮助归来者自己决定留下或返回', '带伙伴穿过潮门进入页边',
    '要求伊莱解释为什么替你决定人生', '收下证据，不替伊莱解除责任', '立刻沿潮门赶回苹果谷',
    '先保住具体的人和他们的新家庭', '带六张见证页前往白石王都', '在登记大厅公开提交六页证词',
    '承认维尔的恐惧，再质问他为何替所有人选择', '用六页见证约束总册，并恢复自己的名字',
  ]
  await fresh(); await enter()
  mkdirSync('_qa/ui', { recursive: true })
  for (let index = 0; index < route.length; index += 1) {
    const action = page.locator('.st-quick-replies button').filter({ hasText: route[index] }).first()
    await action.waitFor({ state: 'visible', timeout: 10000 })
    await action.click()
    if (index === route.length - 1) break
    await page.locator('.ct-turn-next').waitFor({ state: 'visible', timeout: 10000 })
    if (index === 13 || index === 24) {
      await page.addStyleTag({ content: '#alteru-guest-banner{display:none!important}' })
      await page.screenshot({ path: `_qa/ui/cinematic-civic-campaign-${index === 13 ? 'bell-market' : 'margins'}-platform-layout-390x844.png` })
    }
    await page.locator('.ct-turn-next').click()
  }
  await page.locator('.st-ending-gate').waitFor({ state: 'visible', timeout: 10000 })
  const save = await page.evaluate(() => JSON.parse(window.alteruLocalStorage.getItem('the-erased-kingdom-save') || '{}').worlds?.['the-erased-kingdom'])
  if (save.scene !== 31 || save.facts['witness-pages'] !== 6 || save.partyMemberIds.length !== 3) throw new Error(`full browser campaign state mismatch: ${JSON.stringify({ scene: save.scene, facts: save.facts, party: save.partyMemberIds })}`)
  if (save.blocks.filter((block) => block.kind === 'image').length !== 32) throw new Error('every campaign step did not receive exactly one image block')
  await page.screenshot({ path: '_qa/ui/cinematic-civic-finale-gate-platform-layout-390x844.png' })
  await page.locator('.st-ending-gate button').click()
  await page.locator('.st-ending').waitFor({ state: 'visible', timeout: 10000 })
  await page.screenshot({ path: '_qa/ui/cinematic-civic-ending-platform-layout-390x844.png' })
  const ending = await page.locator('.st-ending h1').textContent()
  if (!ending?.trim()) throw new Error('fallback ending did not render a title')
} else if (testCase === 'responsive') {
  mkdirSync('_qa/ui', { recursive: true })
  for (const [width, height] of [[320, 568], [390, 844], [1024, 768], [1440, 900]]) {
    await page.setViewportSize({ width, height })
    await fresh(); await page.addStyleTag({ content: '#alteru-guest-banner{display:none!important}' })
    const entryOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    if (entryOverflow > 1) throw new Error(`entry overflows ${width}x${height} by ${entryOverflow}px`)
    await page.screenshot({ path: `_qa/ui/cinematic-civic-entry-platform-layout-${width}x${height}.png` })
    await enter()
    const stageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    if (stageOverflow > 1) throw new Error(`stage overflows ${width}x${height} by ${stageOverflow}px`)
    const boxes = await page.locator('.st-quick-replies button').evaluateAll((nodes) => nodes.map((node) => {
      const box = node.getBoundingClientRect(); return { width: box.width, height: box.height }
    }))
    if (boxes.some((box) => box.width < 44 || box.height < 44)) throw new Error(`choice target below 44px at ${width}x${height}: ${JSON.stringify(boxes)}`)
    await page.screenshot({ path: `_qa/ui/cinematic-civic-decision-platform-layout-${width}x${height}.png` })
  }
} else {
  throw new Error(`Unknown runtime case: ${testCase}`)
}

console.log(JSON.stringify({ ok: true, case: testCase, imageRequests: imageRequests.length }))
await browser.close()
