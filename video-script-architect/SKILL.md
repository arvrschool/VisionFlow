---
name: video-script-architect
description: 精准后期合成 Skill。支持长文本分句 TTS 合成、多行文本水平/垂直双中心对齐、多视频素材自动循环拼接。
---

# Video Script Architect Skill

## 概述
这是视频号生产线的“总装车间”。它能处理复杂的排版需求，并解决长文本 TTS 被截断的物理难题。

## 参数
- `json_path` (必填): 结构化素材路径（含 `voiceover_script_chinese`, `video_title`, `video_key_info`）。
- `video_input` (必填): 原始视频路径或包含多个 MP4 的文件夹。

## 核心工作流

### 1. 分句 TTS 合成 (Segmented Synthesis)
- 自动按标点符号将长文案拆分为短句。
- 逐句调用 Qwen-TTS 推理，彻底解决长文本末尾“吃字”问题。
- 合并分片音频并追加 1.5 秒静音缓冲。

### 2. 视频流标准化 (Video Looping & Scaling)
- 自动计算配音总时长。
- 若视频素材不足，自动按列表循环拼接。
- 强制所有素材统一为 1080x1440 (3:4)，统一帧率 25fps，统一像素比。

### 3. 精准视觉排版 (Precision Layout)
- **逐行渲染**：每一行文字独立水平居中 (`x=(w-tw)/2`)。
- **垂直对齐**：自动计算文字块总高度，确保其在顶部/底部黑色区域内物理居中。
- **样式规范**：统一草绿色配色 (`#99CC33`)，带黑边立体效果。

## 运行示例
```bash
conda run -n dap python scripts/render_video.py "assets.json" "videos_dir/"
```