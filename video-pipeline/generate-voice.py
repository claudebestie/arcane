"""
Generate voice narration for GradeMyWebsite video.
Shorter phrases, no overlap between segments.
"""
import asyncio
import edge_tts
import os

VOICE = "en-US-BrianNeural"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output", "voice")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Shorter, punchier narration — timed to not overlap
# Format: (segment_number, text, start_delay_ms)
SEGMENTS = [
    (1, "Paste any URL.", 500),
    (2, "Instant website audit.", 3000),
    (3, "Scanning your site right now.", 5500),
    (4, "Here are your results.", 9200),
    (5, "Score: sixty-six out of a hundred.", 11000),
    (6, "Graded A to F per category.", 14000),
    (7, "With clear, actionable tips.", 16500),
    (8, "Free. By Arcane Studio.", 18200),
]

async def generate():
    for num, text, delay in SEGMENTS:
        out = os.path.join(OUTPUT_DIR, f"seg_{num:02d}.mp3")
        communicate = edge_tts.Communicate(
            text,
            VOICE,
            rate="+15%",
            pitch="+0Hz"
        )
        await communicate.save(out)
        # Get duration
        import subprocess
        result = subprocess.run(
            ["python3", "-c", f"import mutagen.mp3; print(mutagen.mp3.MP3('{out}').info.length)"],
            capture_output=True, text=True
        )
        try:
            dur = float(result.stdout.strip())
        except:
            dur = 0
        print(f"  Seg {num}: \"{text}\" — {dur:.1f}s (starts at {delay/1000:.1f}s)")

asyncio.run(generate())

# Save timing info for ffmpeg
timing_file = os.path.join(OUTPUT_DIR, "timing.txt")
with open(timing_file, "w") as f:
    for num, text, delay in SEGMENTS:
        f.write(f"{num},{delay}\n")
print(f"\n✅ All segments generated. Timing saved to {timing_file}")
