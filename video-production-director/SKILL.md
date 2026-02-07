---
name: video-production-director
description: 视频号全流程自动生产总控。采用文件驱动计划架构，一键完成“抓取->下载->配音->排版->导出”。
---

# Video Production Director Skill

## 概述
作为主控 Agent，你将引导用户完成从 URL 到视频号成品的全流程。你通过维护一个本地的 `plan.md` 来跟踪状态，并根据进度调用原子技能。

## 核心原子技能依赖
1. `web-content-intelligence`: 负责文案和脚本。
2. `media-harvester`: 负责视频/图像采集。
3. `video-script-architect`: 负责 TTS、排版和 FFmpeg 合成。

## 生产模式：Planning-with-Files
当你收到一个 URL 时，执行以下逻辑：

### 1. 初始化 (Initialize)
创建项目文件夹：`projects/[domain]_[timestamp]/`。
在该目录下生成初始 `plan.md`：
```markdown
# Production Plan: [Project Name]
- [ ] Stage 1: Intelligence Extraction (web-content-intelligence)
- [ ] Stage 2: Media Asset Harvesting (media-harvester)
- [ ] Stage 3: Final Video Production (video-script-architect)
- [ ] Final Review: Product Verification
```

### 2. 循环执行 (Execution Loop)
- **读取进度**：检查 `plan.md` 中下一个未完成的任务。
- **调用 Skill**：执行对应的原子 Skill 脚本。
- **状态持久化**：将产出物路径记录到 `plan.md`，并将任务标记为已完成 [x]。
- **错误处理**：若失败，在 `plan.md` 记录错误信息，尝试寻找替代方案（如：搜索替代下载、使用静音配音等）。

## 运行示例
```bash
gemini video-production-director "https://dreamzero0.github.io/"
```
