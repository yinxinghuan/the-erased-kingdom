# 《被删去的王国》技术文档

## 1. 技术栈

- React 18 + TypeScript 5 + Less + Vite 5。
- 叙事以结构化 `StorySave` 驱动，AI 只生成被协议允许的叙事与命令；数值、背包、伙伴、危险、事实与结局验证均由本地引擎执行。
- 运行时 AI 接入 Aigram `game-chat`；每回合场景图默认使用独立 AlterU Media Service，关键里程碑仍使用既有 `gen-video`。紧急回滚可在游戏 URL 添加 `?media_backend=legacy`，让图片改回 Aigram transit。
- 玩家身份通过 AlterU 用户资料接口取得；运行时保留原始公网 `head_url` 的像素与 1:1 比例，玩家明确出镜的每个镜头都把同一个原图 URL 作为身份参考。`512×640` 只定义最终场景画布，不再先把头像裁成场景比例。
- 持久化使用 `useGameSave`，命名空间为 `the-erased-kingdom`；平台外调试同时有本地旧存档兼容读取。

## 2. 目录结构

```text
src/story/
  StoryShell.tsx                 # Civic/Living 两套外壳、状态页、结局界面
  story.less                     # 全画幅 Civic 与对话流 Living 样式
  types.ts                       # 存档、cartridge、危险和结局类型
  useStoryEngine.ts              # 回合、生成队列、持久化与终局生成
  cartridges/
    theErasedKingdom.ts          # 世界规则、八章导演、人物、序章和结局锚点
    theErasedKingdomCampaign.ts  # 31 回合中英文完整压缩战役
  engine/
    domainRules.ts               # 领域意图、前置条件、原子 effects 与派生状态
    protocol.ts                  # AI 文本协议解析与不完整图片元数据清理
  stageNarrative.ts            # 条件情境字幕与冗余选择提示过滤
    reducer.ts                   # 权威状态变更、事实写入与见证页推导
    dangerDirector.ts            # warning → confrontation → resolution
    endingDirector.ts            # 终局能力、快照、验证、回退与确定性 ID
    endingAdapter.ts             # 调用 AI 生成结构化独特结局并修复非法结果
    worldContext.ts              # 事实快照与八章主线导演合同
  adapters/                      # demo / Aigram / remote 三种叙事来源
  usePlayerProfile.ts            # 延迟宿主身份同步与真实头像读取
  useAvatarImageReference.ts     # 原始公网头像 URL 校验与直传
src/shared/runtime/
  media.ts                       # 独立媒体服务客户端、尺寸适配与任务轮询
  useGenImage.ts                 # 新服务默认路由与旧 transit 回滚开关
src/story/audio/
  StorySynth.ts                  # 八类地区声景、叙事动机、总线与 Web Audio 合成
  cueDirector.ts                 # 每回合选择一个最高语义音效，避免反馈堆叠
  useStoryAudio.ts               # 手势解锁、静音与故事状态映射
doc/
  requirements.md               # 完整玩法需求
  visual.md                     # Civic 视觉与信息状态流
  story.md                      # 长篇故事圣经
  ending-grammar.json           # 开放式结局能力语法
_qa/
  protocol.ts                   # 协议测试
  danger-director.ts            # 危险循环测试
  ending-director.ts            # 结局快照、约束与回退测试
  oldwood-chapter.ts             # 跨区域伙伴、人物、物品、见证页与章节节点测试
  full-campaign.ts               # 中英文 31 回合、八章与终章状态测试
  audio-director.ts              # 9 类语义音效优先级与 8 类地区声景映射
  runtime-suite.mjs              # 存档、真实音频图解锁、头像、重开、双语和浏览器全流程
  ui/                            # 320、390、1024、1440 真实运行截图
  opening-contract.ts / opening-sequence.mjs # 六拍开场内容合同与双尺寸浏览器回归
```

## 3. 核心模块

### 状态管理与回合

`useStoryEngine.ts` 持有 `StorySave v7`。每次行动先产生本地即时反馈，再由 adapter 返回叙事协议；`reducer.ts` 统一写入地点、时间、目标、数值、物品、伙伴、关系、事实、危险和媒体块。AI 不直接拥有或修改存档。

被治理行动在危险调度前由 `resolveDomainAction()` 判定。若规则命中，完全跳过 adapter，以本地 authored text、effects 和三选项一次性提交；拒绝不消耗物品、不改变数值/事实/地点，也不推进危险 cadence。当前治理进入页的“亲手交付最后公文”、苹果谷三项首次抢救与三项互斥地标写回。

`StoryShell.tsx` 对前 3 幕执行逐页阅读门禁：进入动作的结果先可见，玩家推进到该幕最后一页后才出现下一组行动。第 4 幕起回到普通长篇节奏，门禁不改变 80–120 个有效决策的章节结构。

未来固定人物使用 `hiddenUntilIntroduced`。`createInitialSave()` 不预载奥伦、塞拉、伊莱和维尔；可见正文合法介绍后，稳定 `character_update` 才从 cartridge 定义创建。`normalizeCharacterState()` 只清理从未真正出现的旧存档预载，已经在正文、队伍或关系中留下证据的人物继续保留。

浏览器侧持久化通过 `public/alteru-storage-scope.js` 在游戏模块加载前安装的 `alteruLocalStorage` / `alteruSessionStorage` 访问，真实 key 统一加上 `alteru:<当前部署 UUID>:` 前缀。自托管、GitHub Pages 和 Remix 因而不会在共享 origin 上串用剧情存档、语言、字号或音频偏好；旧的未加前缀 key 只由明确的兼容读取路径处理。

第 0 场图片带 `promptVersion`、`source=opening` 与 `playerVisible=true`。仍停在第 0 场的旧存档若保存了早期“拉住玛拉”入口图，会在归一化时清除旧 URL、换入当前选择前 prompt 并重新排队；已经推进到后续场景的存档不重写历史画面。

Demo 模式现已提供贯穿八章的 `31` 回合中英文压缩战役，不再停在苹果谷或古林切片；钟市、红堡、灯塔海岸、归名之夜、页边、第二次失去苹果谷、白石王都、总册高塔与大修订均有可回归路径。Aigram 模式使用 `StoryDirector.chapters` 与 `storyDirectorContract()` 驱动 80–120 个有效决策的长篇版本：模型收到每章解锁、情绪目的、必经节拍和完成事实，可扩写而不能跳章或重启主线。

每轮可追踪事实进入 `facts`，已加入伙伴不会被新人物替换；本地人物的 `character_id` 与剧情物品的 `item_id` 由协议传入并跨语言、跨回合稳定保存。`reducer.ts` 从真实的 `*-witness-page` 事实推导 `witness-pages`、`witness-four` 和 `witness-all-six`，拒绝由模型直接伪造页数。

`adapters/mock.ts` 不再采用“第一个命中词立即返回”，而是按命中关键词数量和长度选择最具体的后续回合，避免“玛拉”“保护”等通用词把古林行动误送回苹果谷旧分支。

### 场景生图与人物身份

`imageDirector.ts` 以 `SCENE_IMAGE_PROMPT_VERSION=8` 重建待生成场景提示。`image_subject` 是头像归属提议而非不可质疑的真源：`player` 直接启用头像，`environment` 直接禁用；当 AI 错把明确玩家主动作标成 `others` 时，本地导演会依据玩家刚提交的动作与镜头演员纠正。委托/旁观行动仍尊重 `others`，避免玛拉或其他 NPC 主导镜头继承玩家身份。`useStoryEngine.ts` 为玩家主导镜头直传同一张原始头像，以普通 image edit 模式生成 `512×640` 场景。`imageIdentity.ts` 把短合同放在提示开头并限制为 `2400` 字符，将 courier 等玩家职业别名改写成 `SUBJECT A`，移除会把非人头像强制套进人类身体的服装/人体描述。参考图拥有脸（若可见）、轮廓、形态、身体比例、遮盖、面具、服装、材质、颜色和配件；参考图未出现的脸、皮肤、手脚禁止被补出。

`usePlayerProfile.ts` 不再把首帧读取时的 shell 状态当成永久结论：外部宿主有 `10.5s` 注入窗口；一旦确认处于平台，即使资料桥第一次超时也继续重试到 `30.5s`。玩家主导的第一张图不会在这个平台重试窗口中途释放，避免先把默认信使固化成主角。

每张玩家主导场景成功生成后会写入 `PLAYER_IMAGE_REFERENCE_VERSION=2`。已有存档中最早两张明确属于玩家行动、但版本更旧的历史图片，会在真实头像到达时各自动重做一次；重做后写入版本，后续打开不会重复消耗额度。委托、旁观、环境和 NPC 主导镜头不会进入这项迁移。

场景图和背包物品图共用同一个串行媒体 worker，但身份门禁只冻结玩家场景：开场等待头像时，已排队的物品图可以先生成，避免身份解析阻塞背包显影。

`src/shared/runtime/media.ts` 以永久游戏 UUID 作为 `session_id`，统一处理图片尺寸网格、任务轮询、超时、结构化错误和 request UUID。网络结果不明确时保留同一 request UUID 供重试恢复，收到结构化失败后才生成新请求，避免重复生成与重复计费。场景重试读取服务返回的 `retryable` 与 `retry_after_seconds`：永久错误立即停止，限流错误等待服务指定窗口，禁止按固定 3/8 秒连续撞限流。视频暂不迁移：当前里程碑仍按旧接口 `4:3` 调用，而独立媒体服务的实验视频合同只接受 `9:16`，必须先制作专用竖屏首尾帧。

渲染提示不再拼接中文故事正文；含 CJK 的 AI 图片提议会被拒绝并由本地英文导演提示兜底。最终提示还要求路牌、书、地图、信件、标签、印章和纸面全部留白或只含非语言抽象标记，禁止汉字、拉丁字母、数字与伪文字。普通提示版本迁移只重建仍处于 queued / generating / failed 的旧提示；唯一例外是缺少身份版本戳、且确定属于玩家的前两张旧图，它们按上一段的一次性规则重做。

### 屏幕适配

独立游戏默认 `civic`；查询参数 `?ui=living` 可切回对话流表现层做 A/B 比较。第 0 场先由 `stageNarrativeBlocks()` 取出六个作者节拍并单向分页，`openingReady` 在末拍前同时拦截 Composer 与数字键；末拍移除页控件并同步开放行动。普通回合继续严格执行 `decision → submitting → result → next → decision`：`stageNarrative.ts` 选取首段结果与末段决策前提，结果阶段隐藏常驻字幕并由结果薄层承载首段结果，用户推进后才恢复末段决策字幕与下一组选项。320×568、390×844、1024×768 与 1440×900 已做运行截图和横向溢出检查。

### 危险与失败

`dangerDirector.ts` 在 2–4 个安全回合后安排警告，随后升级为对峙和本地固定 d20 结算；刷新不会重掷。失败若没有合法成本，本地按配置扣除体力。数值归零不删档，而是保留后果并退到最近已命名地点。

### 音频与多语言

音频由 `useStoryAudio` 在首次玩家手势后解锁 Web Audio；`StoryAudioTheme.regions` 根据本地化地点名选择苹果谷、古林、钟市、红堡、灯塔海岸、页边、王都或总册塔的音阶、速度、稀疏节拍与环境材质。地点变化只重启声音节点并做 `130 ms` 淡出、`180 ms` 淡入，不重建 `AudioContext`。

`cueDirector.ts` 每回合只从新增 block 中选一个最高语义事件：终章 > 见证页 > 危险 > 伙伴 > 传奇物品 > 检定 > 删除/王印 > 地点 > 普通变化。`StorySynth` 用 cartridge 配置的 `erase / restore / witness / companion / finale / location` 半音动机合成反馈，并限制最多 `8` 个瞬态声部；图片完成只有轻提示，不覆盖剧情里程碑。标签页隐藏时暂停，恢复可见后再继续；失败或不支持 Web Audio 时剧情照常运行。

所有游戏文案、世界数据、人物、物品和八个结局锚点均有中文/英文 paired cartridge；语言跟随系统或 `game_locale`。

### 开放式结局

终章先把存档冻结成确定性 `StoryEndingSnapshot`，计算玩家真正拥有的终局能力，再调用 `endingAdapter.ts` 生成标题、4–6 个终局场景、人物尾声、地区尾声和最终画面提示。验证器拒绝未获得能力、遗漏强制代价、互斥能力、遗漏伙伴或不足三个地区的结果，并最多修复两次；仍失败时回退到最接近的人工锚点。同一快照 ID 只保存一个结局，刷新不会重抽。

## 4. 扩展点

- 改世界观、人物、开场、区域、物品或 Demo：编辑 `src/story/cartridges/theErasedKingdom.ts`。
- 新增有限王印次数、互斥写回、一次性救援、消耗或入队条件：在 cartridge 的 `domainRules` 中声明完整事务，并同步 `npm run test:domain`；不要依赖 demo 内容或 prompt 中的命令充当裁判。
- 改完整压缩战役的中英文节点：编辑 `src/story/cartridges/theErasedKingdomCampaign.ts`；增删节点后同步 `_qa/full-campaign.ts` 与浏览器终章路线。
- 改正式长篇主线骨架：编辑 cartridge 的 `director.chapters`，不要只改 prompt；每章必须保留完成事实和可见必经节拍。
- 扩展新地区时复用古林合同：每个本地人物显式传 `character_id`，每件可获得物品显式传 `item_id`，并为地区结算写入见证页、结算事实、地图后果和三项具体下一步；对应跨区测试放入 `_qa/`。
- 调数值、危险频率、DC 与代价：编辑同文件的 `statDefinitions` / `dangerDirector`，引擎一般无需修改。
- 新增终局能力或质量锚点：修改 cartridge 的 `endingDirector`，并同步 `doc/ending-grammar.json`；新能力必须声明获取条件、强制代价和互斥项。
- 改 Civic 布局与视觉：编辑 `StoryShell.tsx`、`story.less` 与 `doc/visual.md`；改字幕价值判断编辑 `engine/stageNarrative.ts` 并运行 `npm run test:stage-narrative`；改开场必须同步 `npm run test:opening` 与 `_qa/opening-sequence.mjs`。Living 分支仍保留，不能直接删除。
- 替换入口画面：替换 `src/story/img/worlds/the-erased-kingdom*.webp`，保持入口 4:5、无 UI、无可读文字。
- 改玩家出镜别名或生图身份规则：编辑 cartridge 的 `playerImageAliases`、`engine/imageDirector.ts` 与 `useStoryEngine.ts`；新增玩家职业称谓时必须同步回归测试。
- 改媒体服务合同：编辑 `src/shared/runtime/media.ts`；临时回滚旧图片链路：在 URL 增加 `media_backend=legacy`。图片内容、头像归属与媒体传输层保持分离。
- 接入异步多人：把权威世界查询结果转换为可选页边批注、公共物资与工程实体；不得直接写私人数值、背包、伙伴或终局能力。没有远端服务时保持单人模式。

## 发布适配

- `worker/index.js` 是 AIgram 自托管部署器要求的最小具名 `handleApi` 入口；部署器会把同一次 `npm run build` 产生的 `dist/` 封装为静态资源。
- `GET /api/health` 只用于发布健康检查。游戏存档、玩家资料、生图和视频仍由 `src/shared/` 的平台运行时适配器负责；该 worker 不创建第二套存储或共享世界。
- 正式主地址固定使用永久 UUID `0a86a3a1-9328-406a-955f-8a2a8d7e704c`，Pages 只作为同提交的前端镜像。

## 连续性守门（2026-08-13）

- Cartridge 通过 `transitionAnchor` 声明“玛拉的边境图册”；`src/story/engine/continuity.ts` 生成地点桥接、压缩 `decisionContext` 并核验选项名词是否已有可见依据。
- `reducer.ts` 在 `map_update` 与受管辖地图事务提交前插入桥接，并在选择落入 UI 前执行 grounded-choice 检查；旧存档升级到 StorySave v8 时从现有目标补齐 `decisionContext`。
- `filterGroundedChoices()` 逐条保留合法选项；一条成立也直接展示。平静态零条成立时快捷选项保持为空，由自由输入继续，不再生成会反复出现的通用兜底；危险态才恢复绑定同一威胁的确定性应对。`_qa/continuity-gate.ts` 同时覆盖全坏与部分合法两组输入。
- `protocol.ts` 先按 `|` 分段再剥每段首尾成对引号，`Mira's recording` 一类单词内部撇号不会再破坏英文选项协议；`_qa/protocol.ts` 固定回归该输入。

## 镜头导演与迁移（2026-08-17）

- StoryImageDirector.perspective 分别配置普通镜头、重要对话和新地点；当前产品使用 balanced / first-person / observer。
- engine/imageDirector.ts 在每次图片决策中写入 perspective，第一人称自动取消 playerVisible 与头像参考；玩家主导动作强制 observer。SCENE_IMAGE_PROMPT_VERSION=11 只重写尚未完成的旧图片任务，不批量重画历史成图。
- _qa/perspective-director.ts 对中英文各运行 20 张普通镜头，并覆盖重要对话、新地点和玩家主导动作。运行 npm run test:perspective 后再构建。

## 行动权威影子审计（2026-08-20）

- `engine/authorityShadow.ts` 只观察当前 cinematic 阶段已显示的选择，以现有确定性 `domainRules` 分类 `accepted / rejected / open`，并排除尚未进入游戏的开场空 tray 误报。
- 结果只留在页面内存最近 100 条，不改推荐、不改阶段、不写存档或上传；`?authority_shadow=0` 可关闭，`npm run test:authority-shadow` 验证零改写。
## 2026-08-23 混合音频升级

本作保留原有按 region/motif/记忆压力变化的自适应合成层，并加入专属室内民谣主题与遗迹环境声。两层共享手势解锁、静音、后台暂停和自然回放间隔；生成音频失败时自适应合成层仍独立工作，不影响剧情与数值。
