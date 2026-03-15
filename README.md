# Real-Time Voice Avatar Platform
Open-source stack for a low-latency 3D voice avatar.

## Quickstart
1. Download a sample GLB avatar with ARKit blendshapes (e.g., ReadyPlayerMe) to `frontend/public/avatar.glb`.
2. Start backend: `docker compose up -d` or `cd backend && pip install -r requirements.txt && uvicorn app:app --reload`
3. Start frontend: `cd frontend && npm install && npm run dev`
