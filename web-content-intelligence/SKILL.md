---
name: web-content-intelligence
description: 提取网页内容并生成结构化的视频号（Channels）制作素材，支持自动保存为 JSON 文件。
---

# Web Content Intelligence Skill

## 概述
输入一个 URL（如 Twitter, GitHub 或项目主页），该 Skill 会解析网页内容，利用 LLM 提取核心技术点，并自动生成适合视频号发布的全套素材（脚本、标题、介绍、封面提示词）。

## 参数
- `url` (必填): 网页、项目或论文的链接。
- `output_name` (可选): 指定保存的 JSON 文件名，默认使用时间戳。

## 工作流

### 1. 内容抓取 (Retrieval)
使用多层级策略获取网页内容：
- **通用/GitHub**：优先使用 `web_fetch` 读取 Markdown 或 `README.md`。
- **Twitter (X)**：采用 `scripts/twitter_extractor.cjs` 进行深度抓取：
    1. **FxTwitter 镜像**：通过 fxtwitter.com 绕过反爬，获取推文完整文本。
    2. **yt-dlp 引擎**：提取视频元数据、标题及描述，支持从浏览器（Chrome）自动同步 Cookie。
    3. **搜索回退**：若以上失败，自动切换至 Google 搜索模式。

### 2. 智能提取 (LLM Processing)
使用以下 Prompt 模板进行总结：

```text
基于 LLM 大模型对输入的 URL 网页进行内容提取和总结，主要需要提取的内容包含以下 JSON 格式：
{
    "main_content": "", // 核心内容与算法创新点
    "voiceover_script_chinese": "", // 适合视频号的口语化配音文案（含钩子）
    "video_title": "", // 视频标题
    "video_key_info": "", // 一句话核心卖点
    "intro_text": "", // 社交媒体发布文案（含标签）
    "cover_image_prompt": "" // 封面图生成提示词 (英文)
}
```

### 3. 数据持久化 (Persistence)
调用内置脚本将生成的 JSON 保存到本地，以便后续视频剪辑或封面生成 Skill 调用。

```bash
node scripts/save_assets.cjs '<LLM_JSON_OUTPUT>' 'my_project_assets.json'
```

## 示例产出
参考 `examples/dreamzero_assets.json`。

## 注意事项
- **Windows 编码**：在 PowerShell 中直接传递复杂 JSON 字符串可能触发编码错误。建议在 Skill 编排中直接使用 `write_file` 写入。
- **多语言**：配音文案默认为中文。