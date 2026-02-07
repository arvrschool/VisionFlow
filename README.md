  VisionFlow: AI-Driven Tech-to-Video Pipeline

  VisionFlow is an automated end-to-end production pipeline designed to transform any technical project URL (Twitter,
  GitHub, or Research Pages) into a professional, social-media-ready short video (optimized for WeChat Channels, TikTok,
  and Reels).

  🚀 About
  In the era of rapid AI research, sharing technical breakthroughs effectively is key. VisionFlow automates the tedious
  process of content summarization, media asset gathering, and video editing. By simply providing a URL, the system
  generates a structured publishing package including an intelligent script, high-definition demonstration videos,
  professional AI voiceovers, and a cinematic 3:4 layout.


  ✨ Key Features
   - 🧠 Content Intelligence: Automatically extracts core algorithmic innovations and transforms technical jargon into
     engaging, oral scripts using advanced LLMs.
   - 🔍 Universal Media Harvester: A powerful sniffing engine that captures MP4, WebM, and HLS (m3u8) streams even from
     complex modern web architectures (Next.js, React). It can even clone GitHub repositories to find raw assets.
   - 🎙️ Consistent AI Voiceover: Deep integration with Qwen-TTS featuring single-call long-form inference to ensure
     consistent timbre and eliminate end-of-text truncation.
   - 🎨 Precision Layout Architect: Implements a professional 3:4 (1080x1440) visual style with multi-line,
     pixel-perfect centered text overlays and automated video concatenation/looping.
   - 📋 Planning-with-Files: Built on a robust orchestrator that maintains a real-time plan.md for error-tolerant,
     resumable, and transparent workflow execution.


  🛠️ Technical Stack
   - Orchestration: Node.js (File-based Planning)
   - Logic: Python (Conda dap environment)
   - Media Engine: FFmpeg & FFprobe
   - Voiceover: Qwen-TTS
   - Retrieval: yt-dlp & Deep Static Sniffing

  📖 Quick Start

   Simply run the director with your target URL\
   `gemini video-production-director "https://dreamzero0.github.io/"`
   <video src=".\assets\final_ready_for_publish.mp4" controls width="800"></video>


