# backend/tts/kokoro_service.py
# TTS Service returning audio and timing metadata

def generate_tts_mock(text: str):
    """
    Real implementation: 
    Run Kokoro or Bark inference. Extract phoneme alignment metadata generated
    by the model to calculate exact ms duration for each syllable.
    """
    # Create fake WAV header / simple noise for PoC audio mapping
    # Just 1 second of silence/filler bytes essentially to allow playing
    fake_audio_bytes = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\xbb\x00\x00\x80\xbb\x00\x00\x01\x00\x10\x00data\x00\x00\x00\x00"
    
    # Fake viseme timing mapping for the UI
    fake_timing = [
        {"viseme": "O", "durationMs": 200},
        {"viseme": "A", "durationMs": 300},
        {"viseme": "P", "durationMs": 150},
        {"viseme": "default", "durationMs": 500}
    ]
    
    return fake_audio_bytes, fake_timing
