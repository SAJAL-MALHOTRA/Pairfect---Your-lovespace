import asyncio
import edge_tts
import subprocess
import os

ffmpeg_exe = r"C:\Users\2006s\.gemini\antigravity\scratch\hoedex\node_modules\ffmpeg-static\ffmpeg.exe"

segments = [
    # (text, target pause after in seconds)
    ("Our most important relationships are trapped in everyday noise.", 0.8),
    ("Love deserves better than a chat history.", 1.0),
    ("Welcome to Pairfect. Where date night indecision becomes a game, and spontaneous moments become keepsakes you keep forever.", 1.0),
    ("No feeds. No followers. Just a private room built for you both.", 1.2),
    ("Pairfect. Start your room at pairfect dot site.", 2.0)
]

async def generate():
    os.makedirs("temp_audio_30s", exist_ok=True)
    file_list = []
    
    for i, (text, pause) in enumerate(segments):
        seg_file = f"temp_audio_30s/seg_{i}.mp3"
        # en-US-AvaNeural is warm, clear, and cinematic
        comm = edge_tts.Communicate(text, "en-US-AvaNeural", rate="-4%", pitch="-1Hz")
        await comm.save(seg_file)
        
        with_pause = f"temp_audio_30s/seg_pause_{i}.wav"
        filter_str = f"apad=pad_dur={pause}"
        subprocess.run([ffmpeg_exe, "-y", "-i", seg_file, "-af", filter_str, with_pause], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        file_list.append(with_pause)
    
    concat_list_file = "temp_audio_30s/concat_list.txt"
    with open(concat_list_file, "w") as f:
        for fpath in file_list:
            abs_path = os.path.abspath(fpath).replace("\\", "/")
            f.write(f"file '{abs_path}'\n")
            
    output_voiceover = "temp_audio_30s/voiceover_30s.wav"
    subprocess.run([
        ffmpeg_exe, "-y", "-f", "concat", "-safe", "0",
        "-i", concat_list_file,
        "-c:a", "pcm_s16le",
        output_voiceover
    ], check=True)
    
    # Get total duration
    probe_cmd = [
        ffmpeg_exe, "-i", output_voiceover
    ]
    res = subprocess.run(probe_cmd, stderr=subprocess.PIPE, text=True)
    print("Voiceover generated successfully!")
    for line in res.stderr.split("\n"):
        if "Duration" in line:
            print("Voiceover stats:", line.strip())

asyncio.run(generate())
