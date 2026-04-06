"""
Generate voice narration segments for GradeMyWebsite video.
Each segment is timed to match the video.
"""
import asyncio
import edge_tts
import os

VOICE = "en-US-BrianNeural"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output", "voice")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Narration segments — energetic, build-in-public tone
SEGMENTS = [
    (1, "Paste any website URL."),
    (2, "Get an instant audit in seconds."),
    (3, "We're scanning performance, SEO, and accessibility."),
    (4, "Here's the breakdown."),
    (5, "Overall score: sixty-six out of a hundred."),
    (6, "Four categories, graded A to F."),
    (7, "Plus detailed findings with actionable tips."),
    (8, "Totally free. Built by Arcane Studio."),
]

async def generate():
    for i, (num, text) in enumerate(SEGMENTS):
        out = os.path.join(OUTPUT_DIR, f"seg_{num:02d}.mp3")
        communicate = edge_tts.Communicate(
            text,
            VOICE,
            rate="+8%",
            pitch="+2Hz"
        )
        await communicate.save(out)
        print(f"✅ Segment {num}: {text}")

asyncio.run(generate())
print(f"\n🎤 All {len(SEGMENTS)} segments generated in {OUTPUT_DIR}")
