# backend/app.py
# Professional Voice AI Gateway with optimized VAD and turn-taking.

import asyncio
import json
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_headers=["*"])

_asr = None
def get_asr():
    global _asr
    if _asr is None:
        from asr.whisper_stream import WhisperASR
        _asr = WhisperASR("base.en")
    return _asr

@app.on_event("startup")
async def startup_event():
    """Pre-load models on start."""
    logger.info("⚡ Warming up ASR model (base.en)...")
    await asyncio.to_thread(get_asr)
    logger.info("✅ System ready.")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    audio_buffer = bytearray()
    history = []
    last_transcript = ""
    asr = get_asr()
    
    # Turn management
    PACKET_SIZE = 8000 # 0.25s chunks for ultra-responsive feel
    silence_packets = 0
    REQUIRED_SILENCE = 4 # 4 * 0.25s = 1.0s pause to trigger
    is_processing = False

    try:
        while True:
            data = await websocket.receive_bytes()
            if is_processing:
                audio_buffer.clear()
                continue
            
            audio_buffer.extend(data)

            if len(audio_buffer) >= PACKET_SIZE:
                # 1. Quick Energy Check
                import numpy as np
                packet = np.frombuffer(audio_buffer[-PACKET_SIZE:], dtype=np.int16).astype(np.float32) / 32768.0
                energy = np.sqrt(np.mean(packet**2))

                if energy > 0.012:
                    silence_packets = 0
                    # 2. Real-time Partial Transcription (Every 0.5s)
                    if len(audio_buffer) % (PACKET_SIZE * 2) == 0:
                        partial = await asyncio.to_thread(asr.transcribe, bytes(audio_buffer))
                        if partial:
                            await websocket.send_text(json.dumps({"type": "partial", "data": partial}))
                else:
                    silence_packets += 1

                # 3. Silence Trigger (End of speech)
                if silence_packets >= REQUIRED_SILENCE and len(audio_buffer) >= 24000:
                    segment = bytes(audio_buffer)
                    audio_buffer.clear()
                    silence_packets = 0

                    # Final accurate ASR pass
                    transcript = await asyncio.to_thread(asr.transcribe, segment)
                    if not transcript or len(transcript.strip()) < 3:
                        await websocket.send_text(json.dumps({"type": "state", "data": "listening"}))
                        continue

                    is_processing = True
                    await websocket.send_text(json.dumps({"type": "state", "data": "processing"}))
                    await websocket.send_text(json.dumps({"type": "transcript", "data": transcript}))
                    
                    logger.info(f"Final Transcript: {transcript}")
                    history.append({"role": "user", "content": transcript})
                    if len(history) > 20: history = history[-20:]

                    try:
                        from llm.response_generator import generate_response
                        response = await generate_response(transcript, history)
                        if not response:
                            is_processing = False
                            continue
                            
                        history.append({"role": "assistant", "content": response})
                        await websocket.send_text(json.dumps({"type": "response", "data": response}))

                        from tts.tts_service import generate_speech
                        audio, visemes = await generate_speech(response)
                        
                        await websocket.send_text(json.dumps({"type": "visemes", "data": visemes}))
                        await websocket.send_bytes(audio)

                        # Snappier playback wait
                        wait_time = max(len(response.split()) * 0.42, 1.8)
                        await asyncio.sleep(wait_time) 
                    except Exception as e:
                        logger.error(f"Turn error: {e}")
                    finally:
                        is_processing = False
                        audio_buffer.clear()
                        await websocket.send_text(json.dumps({"type": "state", "data": "listening"}))

    except WebSocketDisconnect: pass
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        is_processing = False
