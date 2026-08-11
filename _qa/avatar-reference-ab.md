# 原始 1:1 头像参考 A/B

- 样本：`fixtures/generated-avatar-1x1.png`，本次独立生成的 1254×1254 虚构真人头像，不来自项目素材库或真实用户。
- 测试：同一英文场景、同一原始头像 URL、同一 512×640 输出尺寸，分别调用 `edit` 与 `avatar`。
- 结果：`output/avatar-edit-512x640.png` 与 `output/avatar-avatar-512x640.webp`。
- 结论：输出比例不要求参考头像预先裁成相同比例。剧情场景采用 `edit`，因为它对动作、构图和身份特征的综合保持更稳定；`avatar` 更快，但只作为头像类产物候选。
- 复跑：`npx tsx _qa/avatar-reference-ab.ts <public-avatar-url>`。
