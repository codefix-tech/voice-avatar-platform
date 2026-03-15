# Professional Voice AI Avatar Platform

A high-performance, real-time conversational AI avatar platform built with modern web technologies. This project features ultra-low latency speech recognition, intelligent natural language understanding, and human-like neural text-to-speech.

## 🚀 Features
- **Real-time Conversation**: Natural turn-taking with intelligent pause detection.
- **Live Transcription**: Watch the AI hear you in real-time as you speak.
- **Premium Neural Voice**: Uses Microsoft's high-end `AvaNeural` voice for human-like replies.
- **Dynamic UI**: Modern glassmorphism design with real-time volume visualization.
- **Deployment Ready**: Fully containerized with Docker and Kubernetes support.

## 🛠️ Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, Web Audio API
- **Backend**: FastAPI (Python), WebSockets
- **AI Models**: 
  - **ASR**: Faster-Whisper (base.en)
  - **LLM**: Pollinations AI (GPT-4o level intelligence)
  - **TTS**: Edge-TTS (Microsoft Neural)

## 📦 Quick Start (Self-Hosting)

### Using Docker (Simplest)
1. Clone the repo:
   ```bash
   git clone https://github.com/codefix-tech/voice-avatar-platform.git
   cd voice-avatar-platform
   ```
2. Start the platform:
   ```bash
   docker-compose -f infra/docker-compose.yml up --build
   ```
3. Open `http://localhost:3000` in your browser.

### Manual Setup
- **Backend**: Run `pip install -r requirements.txt` and `python app.py` inside the `backend` folder.
- **Frontend**: Run `npm install` and `npm run dev` inside the `frontend` folder.

## 📄 License
MIT
