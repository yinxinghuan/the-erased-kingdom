# 条件情境字幕视觉 QA

## Context

- Game/build：《被抹去的王国》，本地候选构建。
- Review target：Civic 决策态中央情境字幕。
- Viewports：390×844、320×568，platform-layout；沿用 `_qa/ui/cinematic-entry-external-guest-390x844.png` 做 external-guest 扩展检查。
- Evidence：`_qa/ui/caption-visibility/`。

## Executive assessment

- Decision：Pass。
- P0 / P1 / P2：0 / 0 / 0（协议泄漏与冗余选择提示两项 P1 已修复）。

## Scorecard

| Category | Score |
|---|---:|
| Hierarchy | 5 |
| Coherence | 5 |
| Readability | 5 |
| Game feel | 4 |
| Asset quality | 4 |
| Responsive UX | 5 |
| Polish | 5 |

平均 `4.7 / 5`，无低于 3 的类别。

## Fix and verification

- 协议解析清除完整或缺括号的 `image_prompt / image_subject`，存档恢复同步清理旧残留。
- 泛化选择提示不生成字幕卡；真正的新局面继续显示，并统一使用“此刻”。
- 无字幕与有意义字幕两个状态在 390×844、320×568 均无横向溢出。
- 无功能 Emoji；SVG 家族、触控范围、键盘与自由输入合同未变。

## Evidence

- `01-caption-absent-platform-layout-390x844.png`
- `01-caption-absent-platform-layout-320x568.png`
- `02-context-caption-platform-layout-390x844.png`
- `02-context-caption-platform-layout-320x568.png`
