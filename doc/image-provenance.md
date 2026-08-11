# 制作期图像来源

- 接口：`POST https://chat.aiwaves.tech/aigram/api/gen-image`
- 请求 Origin：`https://aigram.app`
- 生成方式：平台 transit 文生图；未使用 ComfyUI、本地工作流、SVG、Canvas 或 UI 截图。
- 游戏内背景封面原图：https://cdn.aiwaves.tech/prod/telegram/avatar/0/1786292448365116.webp
- 入口原图：https://cdn.aiwaves.tech/prod/telegram/avatar/0/1786292466738431.webp
- 平台 img2img 修订封面：https://cdn.aiwaves.tech/prod/telegram/avatar/0/1786292544056645.webp
- 平台 img2img 修订入口：https://cdn.aiwaves.tech/prod/telegram/avatar/0/1786292563979883.webp
- 2026-08-10 开场时序修订入口：https://cdn.aiwaves.tech/prod/telegram/avatar/0/1786300288369959.webp
- 开场时序修订的 4:5 参考图：https://images.aiwaves.tech/uploads/1786300261780-qwdssm8a9j.webp
- 2026-08-10 正式平台海报：https://cdn.aiwaves.tech/prod/telegram/avatar/0/1786301034969675.webp
- 正式平台海报参考图：https://images.aiwaves.tech/uploads/1786300915645-n55ciwr35a9.png
- 第一批结果错误生成了标题、纸框与皇冠，已保存到 `_production/rejected/`，没有进入游戏；旧入口图预演了“拉住玛拉”的选择结果，也已移入 `_production/rejected/the-erased-kingdom-entry-choice-result.webp`。
- 最终图后处理：仅进行格式转换或等比缩放，不增加文字、徽章或程序化图形。正式平台海报输出 1024×1024 PNG，入口保持接近 4:5 的竖幅原图。

## 2026-08-10 运行时身份连续性抽样

- 测试人物参考图：https://images.aiwaves.tech/uploads/1786302814305-vh8aae7e4qq.jpg
- 同一人物 · 面包房盖章场景：https://cdn.aiwaves.tech/prod/telegram/avatar/0/1786302891473427.webp
- 同一人物 · 桥上战斗场景：https://cdn.aiwaves.tech/prod/telegram/avatar/0/1786302916771999.webp
- 两张场景都使用同一 `ref_url` 串行生成；人工检查确认短卷发、绿眼、右脸伤痕和脸型连续，且没有中文或其他可读文字。测试人物为制作期虚构身份，不是用户资料。

## 2026-08-11 运行时图片服务迁移

- 场景图与物品图默认通过 `https://game.aiwaves.tech/alteru-media/api/v1/images/generations` 生成；媒体服务统一适配底层提供商。
- 玩家头像直接使用平台原始公网 `head_url`，不再裁成 `512×640`；最终 4:5 尺寸由媒体服务独立控制。仅在 `image_subject=player` 时作为普通 image edit 的身份输入；玛拉与其他 NPC 不继承玩家面部。
- 旧 Aigram transit 保留为 `?media_backend=legacy` 的紧急回滚路径；正式海报的既有制作来源记录不变。

### 1:1 原始头像直引对照

- QA 头像由本次实验独立生成，是全新虚构身份，不来自游戏素材库、平台用户或真人资料；本地源文件为 `_qa/fixtures/generated-avatar-1x1.png`（1254×1254）。
- 原始头像上传 URL：https://images.aiwaves.tech/uploads/1786447871025-1a0f39ywtdl.png
- 普通 image edit，512×640：https://cdn.aiwaves.tech/prod/telegram/avatar/2401406586/1786447934781548.png（约 7.9 秒）
- avatar output，512×640：https://cdn.aiwaves.tech/prod/telegram/avatar/2401406586/1786447938207417.webp（约 3.3 秒）
- 两者均能在不预裁头像的情况下输出 4:5 场景；人工检查普通 edit 对动作执行、脸部细节和参考特征的综合保持更稳，因此剧情场景默认采用 edit。avatar 模式保留给头像类产物。

## Runtime cover prompt

```text
Square full-bleed cinematic grounded high-fantasy narrative scene with ordinary sharp image edges. A traveling courier and a young woman mapmaker stand at the edge of a warm orchard village being erased from physical reality: the left half remains richly colored with apple trees, stone bridge, bakery fire and villagers, while the right half becomes silent ivory spatial absence with missing roads and architecture, not torn paper. A distant armored royal knight rides toward them. One small unmarked brass hand seal glints in the courier's hand. Grounded medieval clothing, natural anatomy, expressive faces, tactile stone and wood, cobalt accents, one vermilion deletion trace, restrained brass light, adventurous and emotionally clear, premium editorial fantasy realism. Central subjects and village conflict remain readable at 160 by 160. Full bleed, sharp square corners. This is a real landscape and an unfolding rescue, never a poster or book cover. Absolutely no title, no letters, no words, no numbers, no Chinese characters, no pseudo-text, no crown, no crest, no logo, no UI, no border, no frame, no parchment, no page corners, no book, no paper collage.
```

## Formal poster prompt

```text
Premium square illustrated game poster. Exact title at the very top within the upper 20 percent: THE ERASED KINGDOM. English text only, absolutely no Chinese characters, no other words and no pseudo-text. Apple Vale is being erased from reality: a young courier with a satchel and map and Mara, a village archivist, stand separately as allies facing the crisis. Left side warm and alive with apple trees, stone bridge, bakery windows and villagers; right side dissolves into clean luminous ivory absence, buildings and road breaking into drifting paper-like fragments. Blank village sign with no lettering. They do not shake hands, touch or embrace. One tiny distant armored pursuer may appear. Sophisticated cinematic fantasy illustration, strong readable central silhouette, painterly realism, teal, apple red, parchment ivory and dusk blue, readable at 160x160. No decorative frame, border, parchment page, book cover, crown, coin, logo, UI, speech bubble or watermark.
```

## Entry prompt

```text
Create a fresh 4:5 portrait opening scene for a cinematic grounded high-fantasy RPG. This is the instant BEFORE the player makes any choice: at dusk on the village road of warm Apple Vale, a border courier has just turned back after delivering an ordinary sealed letter; nearby, the young cartographer Mara stands separately, gripping an old applewood ruler and urgently warning the courier. Behind them, the village road sign has suddenly become blank, distant orchard houses are losing colour and dissolving into silent clean ivory absence, and a confused wagon driver looks back from the road. A clerk opening the letter may be visible only as a small background figure in the registry-house doorway. The courier and Mara are the two readable focal subjects, with space between them. Show shock, uncertainty and the first onset of erasure. IMPORTANT temporal continuity: no handshake, no touching, no pulling, no rescue, no completed spell, no restored landmark, no royal seal being used, no battle, no knight. Natural anatomy, lived-in medieval clothing, broad readable environment, cobalt clothing accent and restrained vermilion deletion traces, cinematic dusk light, central 58 percent safe composition, no text, no readable letters, no title, no logo, no UI, no decorative frame.
```
