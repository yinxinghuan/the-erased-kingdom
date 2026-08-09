# 《被删去的王国》技术文档

## 1. 技术栈

- React 18 + TypeScript 5 + Less + Vite 5。
- 叙事以结构化 `StorySave` 驱动，AI 只生成被协议允许的叙事与命令；数值、背包、伙伴、危险、事实与结局验证均由本地引擎执行。
- 运行时 AI 接入 Aigram `game-chat`；每回合场景图使用平台 `gen-image`，关键里程碑可使用 `gen-video`。
- 玩家身份通过 AlterU 用户资料接口取得；Civic 模式会把玩家头像一次性裁为 `512×640` 并上传缓存，玩家明确出镜的每个镜头都复用同一个 `ref_url`。
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
    protocol.ts                  # AI 文本协议解析
    reducer.ts                   # 权威状态变更、事实写入与见证页推导
    dangerDirector.ts            # warning → confrontation → resolution
    endingDirector.ts            # 终局能力、快照、验证、回退与确定性 ID
    endingAdapter.ts             # 调用 AI 生成结构化独特结局并修复非法结果
    worldContext.ts              # 事实快照与八章主线导演合同
  adapters/                      # demo / Aigram / remote 三种叙事来源
  useAvatarImageReference.ts     # 头像裁切、上传与一次性缓存
  audio/
    StorySynth.ts                # 八类地区声景、叙事动机、总线与 Web Audio 合成
    cueDirector.ts               # 每回合选择一个最高语义音效，避免反馈堆叠
    useStoryAudio.ts             # 手势解锁、静音与故事状态映射
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
```

## 3. 核心模块

### 状态管理与回合

`useStoryEngine.ts` 持有 `StorySave v7`。每次行动先产生本地即时反馈，再由 adapter 返回叙事协议；`reducer.ts` 统一写入地点、时间、目标、数值、物品、伙伴、关系、事实、危险和媒体块。AI 不直接拥有或修改存档。

第 0 场图片带 `promptVersion`、`source=opening` 与 `playerVisible=true`。仍停在第 0 场的旧存档若保存了早期“拉住玛拉”入口图，会在归一化时清除旧 URL、换入当前选择前 prompt 并重新排队；已经推进到后续场景的存档不重写历史画面。

Demo 模式现已提供贯穿八章的 `31` 回合中英文压缩战役，不再停在苹果谷或古林切片；钟市、红堡、灯塔海岸、归名之夜、页边、第二次失去苹果谷、白石王都、总册高塔与大修订均有可回归路径。Aigram 模式使用 `StoryDirector.chapters` 与 `storyDirectorContract()` 驱动 80–120 个有效决策的长篇版本：模型收到每章解锁、情绪目的、必经节拍和完成事实，可扩写而不能跳章或重启主线。

每轮可追踪事实进入 `facts`，已加入伙伴不会被新人物替换；本地人物的 `character_id` 与剧情物品的 `item_id` 由协议传入并跨语言、跨回合稳定保存。`reducer.ts` 从真实的 `*-witness-page` 事实推导 `witness-pages`、`witness-four` 和 `witness-all-six`，拒绝由模型直接伪造页数。

`adapters/mock.ts` 不再采用“第一个命中词立即返回”，而是按命中关键词数量和长度选择最具体的后续回合，避免“玛拉”“保护”等通用词把古林行动误送回苹果谷旧分支。

### 场景生图与人物身份

`imageDirector.ts` 以 `SCENE_IMAGE_PROMPT_VERSION=7` 重建待生成场景提示。AI 的 `image_subject` 只是建议：本地导演还会检查当前镜头语义和 cartridge 的 `playerImageAliases`；只要提示明确出现玩家、主角或信使，即使模型误标为 `environment / others`，仍将 `playerVisible` 设为真。`useStoryEngine.ts` 随后为每个玩家镜头传入同一张裁切头像，并追加不可替换主角的身份硬约束。

渲染提示不再拼接中文故事正文；含 CJK 的 AI 图片提议会被拒绝并由本地英文导演提示兜底。最终提示还要求路牌、书、地图、信件、标签、印章和纸面全部留白或只含非语言抽象标记，禁止汉字、拉丁字母、数字与伪文字。版本迁移只重建仍处于 queued / generating / failed 的旧提示，已经生成的历史图片不自动消耗额度重画。

### 屏幕适配

独立游戏默认 `civic`；查询参数 `?ui=living` 可切回对话流表现层做 A/B 比较。两种表现层都严格执行 `decision → submitting → result → next → decision`：`stageNarrative.ts` 选取首段结果与末段决策前提，结果阶段隐藏常驻字幕并由结果薄层承载首段结果，用户推进后才恢复末段决策字幕与下一组选项。320×568、390×844、1024×768 与 1440×900 已做运行截图和横向溢出检查。

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
- 改完整压缩战役的中英文节点：编辑 `src/story/cartridges/theErasedKingdomCampaign.ts`；增删节点后同步 `_qa/full-campaign.ts` 与浏览器终章路线。
- 改正式长篇主线骨架：编辑 cartridge 的 `director.chapters`，不要只改 prompt；每章必须保留完成事实和可见必经节拍。
- 扩展新地区时复用古林合同：每个本地人物显式传 `character_id`，每件可获得物品显式传 `item_id`，并为地区结算写入见证页、结算事实、地图后果和三项具体下一步；对应跨区测试放入 `_qa/`。
- 调数值、危险频率、DC 与代价：编辑同文件的 `statDefinitions` / `dangerDirector`，引擎一般无需修改。
- 新增终局能力或质量锚点：修改 cartridge 的 `endingDirector`，并同步 `doc/ending-grammar.json`；新能力必须声明获取条件、强制代价和互斥项。
- 改 Civic 布局与视觉：编辑 `StoryShell.tsx`、`story.less` 与 `doc/visual.md`；Living 分支仍保留，不能直接删除。
- 替换入口画面：替换 `src/story/img/worlds/the-erased-kingdom*.webp`，保持入口 4:5、无 UI、无可读文字。
- 改玩家出镜别名或生图身份规则：编辑 cartridge 的 `playerImageAliases`、`engine/imageDirector.ts` 与 `useStoryEngine.ts`；新增玩家职业称谓时必须同步回归测试。
- 接入异步多人：把权威世界查询结果转换为可选页边批注、公共物资与工程实体；不得直接写私人数值、背包、伙伴或终局能力。没有远端服务时保持单人模式。

## 发布适配

- `worker/index.js` 是 AIgram 自托管部署器要求的最小具名 `handleApi` 入口；部署器会把同一次 `npm run build` 产生的 `dist/` 封装为静态资源。
- `GET /api/health` 只用于发布健康检查。游戏存档、玩家资料、生图和视频仍由 `src/shared/` 的平台运行时适配器负责；该 worker 不创建第二套存储或共享世界。
- 正式主地址固定使用永久 UUID `0a86a3a1-9328-406a-955f-8a2a8d7e704c`，Pages 只作为同提交的前端镜像。
