# Real-Time Voice Avatar Architecture

## Architecture Diagram
```text
[ Browser (Next.js + React Three Fiber) ]
      | (1) Raw Audio Chunks (16kHz Int16)         ^ (4) Audio Chunks +
      | over WebSocket                             |     Timing JSON (Visemes)
      v                                            |
[ Backend Gateway (FastAPI WebSockets + Asyncio queues) ]
      |                                            ^
      v (2) Audio bytes                            | (3) Audio stream + Visemes
[ ASR Service (whisper.cpp/faster-whisper) ]       [ TTS Service (Kokoro/Bark) ]
      |                                            ^
      v Transcription partials & finals            | Text stream
      +------> [ LLM Service (vLLM / Ollama - Quantized LLaMA 3) ]
```

## Explanations
1. **Frontend**: Captures microphone audio using an `AudioWorklet`, downsamples to 16kHz, and streams binary frames over WebSockets. Renders a GLB model using React Three Fiber, applying ARKit blendshape weights dynamically based on incoming timing metadata.
2. **Backend Gateway**: FastAPI manages WebSockets, orchestrating the pipeline. It handles VAD (Voice Activity Detection) to avoid sending silence, enqueues audio to ASR, and pipes outputs back to the client. Keep it stateless using Redis for session mapping if scaling horizontally.
3. **ASR**: Uses `whisper.cpp` (CPU edge) or `faster-whisper` (GPU) for rapid, streaming partials to ensure the LLM starts generating while the user is still speaking their final words.
4. **LLM**: A quantized model (e.g., Llama 3 8B 4-bit) running in vLLM ensures token generation latency < 50ms.
5. **TTS**: Kokoro or Bark. Kokoro is preferred as it can generate accurate phoneme-level timings, allowing the backend to send JSON payloads (`{ "phoneme": "A", "durationSq": 0.1 }`) alongside audio buffers.
