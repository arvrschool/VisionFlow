---
name: media-harvester
description: 自动嗅探并下载网页中的高清视频（mp4）和图像（png/jpg）素材。
---

# Media Harvester Skill

## 概述
给定一个 URL，该 Skill 会尝试提取并下载所有相关的多媒体素材。它专门针对 3D/AI 项目网页进行了优化，能够识别 Demo 视频和高质量渲染图。

## 参数
- `url` (必填): 目标链接。
- `type` (可选): `video`, `image`, 或 `all` (默认)。

## 工作流

### 1. 平台识别
判断是否为 Twitter, YouTube, Bilibili 等已知视频平台。如果是，调用 `yt-dlp` 获取最高清流。

### 2. 静态嗅探 (Static Sniffing)
解析 HTML，提取所有 `<video>`, `<source>`, `<img>` 标签。
- **视频过滤**：全面支持 `.mp4`, `.webm`, `.mov`, `.ogg` 等格式。
- **图像过滤**：排除小于 200px 的图标，优先下载大尺寸渲染图。

### 3. 动态嗅探 (Dynamic / Headless)
对于某些通过 JS 加载视频的页面（如 NVIDIA Research），尝试根据 URL 规律生成可能的媒体路径。

### 4. 下载管理
将素材保存到 `./downloads/[domain]_[timestamp]/` 目录下。

## 运行示例
```bash
gemini media-harvester "https://waymo.com/blog/..."
```
