# backend/tts/tts_service.py
# Professional TTS using edge-tts with premium neural voices.

import edge_tts
import io
import logging
from typing import Tuple, List

logger = logging.getLogger(__name__)

# ARKit Viseme Mapping (Simplified)
# Maps phoneme hints to Apple ARKit blendshapes
VOWEL_TO_VISEME = {
    "a": "A", "e": "E", "i": "E", "o": "O", "u": "U",
}

def _word_to_viseme(word: str) -> str:
    word = word.lower()
    for ch in word:
        if ch in VOWEL_TO_VISEME: return VOWEL_TO_VISEME[ch]
    return "P"

async def generate_speech(
    text: str,
    voice: str = "en-US-AvaNeural", # Ava is highly professional/human-like
) -> Tuple[bytes, List[dict]]:
    """
    Generate premium MP3 audio and synchronous viseme data.
    """
    communicate = edge_tts.Communicate(text, voice, rate="+5%", pitch="+0Hz")

    audio_buffer = io.BytesIO()
    viseme_timings: List[dict] = []

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_buffer.write(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            word = chunk.get("text", "")
            duration_ms = chunk.get("duration", 0) / 10000 # Convert to ms
            viseme_key = _word_to_viseme(word)
            
            # Create a more fluid transition
            viseme_timings.append({
                "viseme": viseme_key,
                "durationMs": max(duration_ms * 0.8, 100),
            })
            # Add micro-breath/transition
            viseme_timings.append({
                "viseme": "default",
                "durationMs": 30,
            })

    audio_bytes = audio_buffer.getvalue()
    # Add a final silence for safety
    viseme_timings.append({"viseme": "default", "durationMs": 500})
    
    return audio_bytes, viseme_timings
