# The Erased Kingdom / 被删去的王国

一款完整的双语竖屏叙事角色扮演游戏。玩家扮演边境信使，在苹果谷开始从现实中消失的那一刻，与制图师玛拉踏上一段跨越八章的旅程：寻找被删除的道路、人物与历史，并决定“被记住”究竟应该由谁来掌控。

## 游戏结构

- 31 个连续行动回合，覆盖 8 个章节与完整终章。
- 自由行动、检定、危险、物品、伙伴关系与持续存档。
- 8 个作者锚定结局，并允许大语言模型在结局语法与玩家历史范围内生成更多变体。
- 每一步以竖幅场景图为主，文字、人物对话、行动结果与选择按时间顺序出现。
- 中文 / 英文自动切换；支持移动端、桌面端与 AlterU 平台容器。
- 运行时场景图可引用玩家头像，并用本地导演规则保持人物、地点和事件连续性。

## 本地运行

```bash
npm install
npm run dev
```

演示模式：`?story_mode=demo`。时间管理局式界面为默认正式方向。

## 构建与测试

```bash
npm run build
npm run test:protocol
npm run test:campaign
npm run test:decision-context
```

完整回归项目见 `package.json`。构建产物位于 `dist/`，Vite `base` 固定为 `./`，可部署到任意子路径。

## 发布

- AIgram 正式主站：`https://game.aiwaves.tech/0a86a3a1-9328-406a-955f-8a2a8d7e704c/`
- GitHub Pages 镜像：`https://yinxinghuan.github.io/the-erased-kingdom/`

两份前端来自同一个 Git 提交；平台存档、身份和运行时生成仍使用 AIgram 接口。正式平台海报与制作期图像均通过 Aigram transit 生图接口生成，来源与提示词记录在 `doc/image-provenance.md`。

## 文档

- `doc/requirements.md`：玩法与验收需求
- `doc/visual.md`：视觉方向、界面系统与素材规则
- `doc/technical.md`：最终技术结构与扩展点
- `doc/story.md`：世界观、章节与情绪结构
- `doc/release-handoff.json`：发布锚点与测试清单

第三方许可证说明随源码与构建产物发布于 `public/THIRD_PARTY_NOTICES.txt`。
