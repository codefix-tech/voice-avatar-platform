# scripts/latency_profiler.py
import time
def mock_pipeline():
    start = time.time()
    # ASR Step
    time.sleep(0.12) 
    asr_time = time.time()
    # LLM Step (Time To First Token)
    time.sleep(0.08)
    llm_time = time.time()
    # TTS Step
    time.sleep(0.15)
    tts_time = time.time()
    
    print(f"ASR Latency: {(asr_time - start)*1000:.0f}ms")
    print(f"LLM TTFT: {(llm_time - asr_time)*1000:.0f}ms")
    print(f"TTS Chunk Latency: {(tts_time - llm_time)*1000:.0f}ms")
    print(f"Total E2E: {(tts_time - start)*1000:.0f}ms") # Goal: <500ms

if __name__ == "__main__":
    print("Running theoretical latency test...")
    mock_pipeline()
