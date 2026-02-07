# -*- coding: utf-8 -*-
import os
import sys
import json
import subprocess
import re
import glob
import tempfile
import argparse

# --- Paths Configuration ---
FFMPEG_PATH = r"C:\ffmpeg\ffmpeg.exe"
FFPROBE_PATH = r"C:\ffmpeg\ffprobe.exe"
QWEN_TTS_PATH = r"F:\Works\WorldModel\Qwen3-TTS"
QWEN_MODEL_PATH = r"F:\Works\WorldModel\Qwen3-TTS\Qwen3-TTS-12Hz-1.7B-CustomVoice"

sys.path.append(QWEN_TTS_PATH)

def get_video_info(video_path):
    cmd = [FFPROBE_PATH, '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=s=x:p=0', video_path]
    res = subprocess.check_output(cmd).decode('utf-8').strip()
    # Handle cases like '720\r\n\r\n1280'
    res_clean = re.sub(r'[\r\n]+', 'x', res).strip('x')
    if 'x' in res_clean:
        parts = res_clean.split('x')
        w, h = int(parts[0]), int(parts[1])
    else:
        # Fallback for standard CSV output
        w, h = map(int, res.split('x'))
    return w, h

def get_audio_duration(audio_path):
    cmd = [FFPROBE_PATH, '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', audio_path]
    return float(subprocess.check_output(cmd).decode('utf-8').strip())

def robust_json_load(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    clean_content = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', content)
    try:
        return json.loads(clean_content)
    except:
        # Deep cleaning for common LLM JSON mishaps
        clean_content = clean_content.replace('\n', ' ').replace('\r', ' ')
        return json.loads(clean_content)

def split_to_lines(text, width=12):
    if not text: return []
    text = text.replace("\n", "").replace("\r", "").strip()
    return [text[i:i+width] for i in range(0, len(text), width)]

def generate_audio(full_text, output_path, speaker="Ryan", instruct="科技干货风,自然一些，语速稍快"):
    print(f"--- Calling Qwen-TTS: Single Inference ---")
    full_text_padded = full_text.strip() + "。。。。。。"
    temp_wav = output_path + ".raw.wav"
    try:
        from qwen_tts import Qwen3TTSModel
        import torch
        import soundfile as sf
        device = "cuda:0" if torch.cuda.is_available() else "cpu"
        model = Qwen3TTSModel.from_pretrained(QWEN_MODEL_PATH, device_map=device, trust_remote_code=True)
        wavs, sr = model.generate_custom_voice(text=full_text_padded, language="Chinese", speaker=speaker, instruct=instruct)
        sf.write(temp_wav, wavs[0], sr)
        subprocess.run([FFMPEG_PATH, '-y', '-i', temp_wav, '-af', 'apad=pad_dur=1.5', output_path], check=True, stderr=subprocess.PIPE)
        if os.path.exists(temp_wav): os.remove(temp_wav)
        return True
    except Exception as e:
        print(f"TTS Error: {e}")
        subprocess.run([FFMPEG_PATH, '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', '20', output_path, '-y'], stderr=subprocess.PIPE)
        return False

def render_final_video(video_list, audio_in, title, key_info, output_file):
    audio_dur = get_audio_duration(audio_in)
    target_w, target_h = 1080, 1440
    fps = 25
    
    current_video_dur = 0
    final_list = []
    while current_video_dur < audio_dur + 2:
        for v in video_list:
            dur_cmd = [FFPROBE_PATH, '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', v]
            d = float(subprocess.check_output(dur_cmd).decode('utf-8').strip())
            final_list.append(v)
            current_video_dur += d
            if current_video_dur >= audio_dur + 2: break

    ref_w, ref_h = get_video_info(video_list[0])
    scaled_h = int(target_w * (ref_h / ref_w))
    padding_h = (target_h - scaled_h) // 2

    input_cmds = []
    filter_chains = []
    for i, v_path in enumerate(final_list):
        # Added -analyzeduration and -probesize for TS/HLS streams
        input_cmds.extend(['-analyzeduration', '100M', '-probesize', '100M', '-i', v_path])
        vw, vh = get_video_info(v_path)
        vs_h = int(target_w * (vh / vw))
        vp_y = (target_h - vs_h) // 2
        filter_chains.append(f"[{i}:v]scale={target_w}:{vs_h},pad={target_w}:{target_h}:0:{vp_y}:black,setsar=1,fps={fps}[v{i}];")

    concat_v = "".join([f"[v{i}]" for i in range(len(final_list))])
    filter_chains.append(f"{concat_v}concat=n={len(final_list)}:v=1:a=0[v_full];")
    
    title_lines = split_to_lines(title, width=14)
    info_lines = split_to_lines(key_info, width=18)
    font_path = "C\\:/Windows/Fonts/msyhbd.ttc"
    green = "0x99CC33"
    
    title_fs, title_spacing = 80, 25
    title_block_h = len(title_lines) * title_fs + (len(title_lines)-1) * title_spacing
    title_start_y = (padding_h - title_block_h) // 2
    
    current_filter = "[v_full]"
    for idx, line in enumerate(title_lines):
        y = title_start_y + idx * (title_fs + title_spacing)
        safe_line = line.replace("'", "").replace(":", "\\:")
        next_tag = f"[v_t{idx}]"
        filter_chains.append(f"{current_filter}drawtext=text='{safe_line}':fontfile='{font_path}':fontcolor={green}:fontsize={title_fs}:borderw=4:bordercolor=black:x=(w-tw)/2:y={y}{next_tag};")
        current_filter = next_tag

    info_fs, info_spacing = 60, 20
    info_block_h = len(info_lines) * info_fs + (len(info_lines)-1) * info_spacing
    info_start_y = (target_h - padding_h) + (padding_h - info_block_h) // 2
    
    for idx, line in enumerate(info_lines):
        y = info_start_y + idx * (info_fs + info_spacing)
        safe_line = line.replace("'", "").replace(":", "\\:")
        next_tag = f"[v_out]" if (idx == len(info_lines)-1) else f"[v_b{idx}]"
        filter_chains.append(f"{current_filter}drawtext=text='{safe_line}':fontfile='{font_path}':fontcolor={green}:fontsize={info_fs}:borderw=4:bordercolor=black:x=(w-tw)/2:y={y}{next_tag};")
        current_filter = next_tag

    cmd = [FFMPEG_PATH, '-y'] + input_cmds + [
        '-i', audio_in,
        '-filter_complex', "".join(filter_chains),
        '-map', '[v_out]', '-map', f'{len(final_list)}:a',
        '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast',
        '-c:a', 'aac', '-b:a', '192k', '-t', str(audio_dur), output_file
    ]
    subprocess.run(cmd, check=True)

def main():
    parser = argparse.ArgumentParser(description='Video Production Architect')
    parser.add_argument('json_path', help='Path to the assets JSON file')
    parser.add_argument('video_input', help='Path to the video file or directory')
    parser.add_argument('--speaker', default='Ryan', help='TTS speaker name')
    parser.add_argument('--instruct', default='科技干货风,自然一些，语速稍快', help='TTS tone instruction')
    args = parser.parse_args()

    data = robust_json_load(args.json_path)
    v_in = args.video_input
    
    # SUPPORT FOR .TS, .MP4, .WEBM
    if os.path.isdir(v_in):
        video_list = []
        for ext in ["*.mp4", "*.ts", "*.webm", "*.mov"]:
            video_list.extend(glob.glob(os.path.join(v_in, ext)))
    else:
        video_list = [v_in]
    
    if not video_list:
        print(f"Error: No video assets found in {v_in}")
        return

    work_dir = os.path.dirname(os.path.abspath(args.json_path))
    audio_path = os.path.join(work_dir, "final_audio_buffered.wav")
    output_path = os.path.join(work_dir, "final_ready_for_publish.mp4")

    generate_audio(data['voiceover_script_chinese'], audio_path, speaker=args.speaker, instruct=args.instruct)
    render_final_video(video_list, audio_path, data['video_title'], data['video_key_info'], output_path)
    print(f"SUCCESS: {output_path}")

if __name__ == "__main__":
    main()
