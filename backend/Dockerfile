FROM nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04

WORKDIR /srv

# Install Python and FFMpeg (for audio)
RUN apt-get update && apt-get install -y python3-pip ffmpeg && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Keep models baked into the image or mount via volume to avoid cold starts
COPY . .

# Pre-warm models (example script - typically you'd run python to download huggingface/faster-whisper models to cache)
# RUN python3 -c "from faster_whisper import WhisperModel; WhisperModel('base.en')"

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
