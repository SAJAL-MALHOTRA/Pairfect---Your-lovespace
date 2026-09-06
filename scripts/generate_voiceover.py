import asyncio
import edge_tts
import subprocess
import os

ffmpeg_exe = r"C:\Users\2006s\.gemini\antigravity\scratch\hoedex\node_modules\ffmpeg-static\ffmpeg.exe"

segments = [
    # (text, pause_after_seconds)
    ("Your relationship has a thousand little moments.", 1.5),
    ("The conversations you had.", 1.0),
    ("The things you never want to forget.", 1.2),
    ("The games you played just to make each other laugh.", 1.5),
    ("Pairfect brings them all into one private space — just for the two of you.", 1.8),
    ("Ask something deeper.", 1.4),
    ("Leave them a letter.", 1.4),
    ("Challenge each other.", 1.4),
    ("Keep the moments that became your story.", 1.8),
    ("Because your relationship isn't just something you live.", 1.2),
    ("It's something worth keeping.", 2.2),
    ("Pairfect. Conversations that connect.", 3.0)
]

async def generate():
    os.makedirs("temp_audio", exist_ok=True)
    file_list = []
    
    for i, (text, pause) in enumerate(segments):
        seg_file = f"temp_audio/seg_{i}.mp3"
        comm = edge_tts.Communicate(text, "en-US-AvaNeural", rate="-12%", pitch="-1Hz")
        await comm.save(seg_file)
        
        # Add pause using ffmpeg
        with_pause = f"temp_audio/seg_pause_{i}.wav"
        filter_str = f"apad=pad_dur={pause}"
        subprocess.run([ffmpeg_exe, "-y", "-i", seg_file, "-af", filter_str, with_pause], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        file_list.append(with_pause)
    
    # Concatenate all wav files
    concat_list_file = "temp_audio/concat_list.txt"
    with open(concat_list_file, "w") as f:
        for fpath in file_list:
            abs_path = os.path.abspath(fpath).replace("\\", "/")
            f.write(f"file '{abs_path}'\n")
            
    subprocess.run([
        ffmpeg_exe, "-y", "-f", "concat", "-safe", "0",
        "-i", concat_list_file,
        "-c:a", "libmp3lame", "-b:a", "192k",
        "voiceover_paced.mp3"
    ], check=True)
    
    print("Voiceover paced successfully created!")

asyncio.run(generate())
