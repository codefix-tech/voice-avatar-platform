# backend/asr/whisper_stream.py
# Real-time ASR using faster-whisper (runs on CPU)

import numpy as np
import logging

logger = logging.getLogger(__name__)


class WhisperASR:
    """Streaming ASR using faster-whisper with the tiny.en model on CPU."""

    def __init__(self, model_size: str = "base.en"):
        logger.info(f"Loading Whisper model '{model_size}'...")
        from faster_whisper import WhisperModel
        self.model = WhisperModel(model_size, device="cpu", compute_type="int8")
        logger.info("Whisper model loaded and ready!")

    def transcribe(self, raw_pcm_bytes: bytes, sample_rate: int = 16000) -> str:
        """
        Accepts raw Int16 PCM bytes at 16kHz.
        Returns the transcribed text string.
        """
        if len(raw_pcm_bytes) < 3200:
            return ""

        audio_np = np.frombuffer(raw_pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0

        # Check energy — Lower threshold to be more sensitive to speech
        energy = np.sqrt(np.mean(audio_np ** 2))
        if energy < 0.005: 
            return ""

        segments, _ = self.model.transcribe(
            audio_np,
            beam_size=1,
            language="en",
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=400),
        )

        text = " ".join(segment.text for segment in segments).strip()
        return text
