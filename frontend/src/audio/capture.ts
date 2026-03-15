// frontend/src/audio/capture.ts
// Handles microphone capture, downsampling, and WebSocket streaming.

export type WSMessage = {
  type: "transcript" | "response" | "visemes" | "state" | "partial";
  data: any;
};

export class AudioCapture {
  public context: AudioContext | null = null;
  public stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private onMessage: ((msg: WSMessage) => void) | null = null;
  private onAudio: ((audioBlob: Blob) => void) | null = null;
  
  public muted: boolean = false;

  constructor(
    wsUrl: string,
    onMessage?: (msg: WSMessage) => void,
    onAudio?: (audioBlob: Blob) => void
  ) {
    this.wsUrl = wsUrl;
    this.onMessage = onMessage || null;
    this.onAudio = onAudio || null;
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = async () => {
        try {
          this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Force 16kHz for ASR
          this.context = new window.AudioContext({ sampleRate: 16000 });
          const source = this.context.createMediaStreamSource(this.stream);

          // ScriptProcessor for PoC (replace with AudioWorklet in production)
          this.processor = this.context.createScriptProcessor(4096, 1, 1);
          source.connect(this.processor);
          this.processor.connect(this.context.destination);

          this.processor.onaudioprocess = (e) => {
            if (this.muted) return; // Don't send data if muted (avatar is speaking)

            const float32 = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(float32.length);
            for (let i = 0; i < float32.length; i++) {
              const s = Math.max(-1, Math.min(1, float32[i]));
              int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(int16.buffer);
            }
          };
          resolve();
        } catch (err) {
          reject(err);
        }
      };

      this.ws.onerror = (err) => reject(err);

      // Handle incoming messages from the server
      this.ws.onmessage = async (event) => {
        if (typeof event.data === "string") {
          try {
            const msg: WSMessage = JSON.parse(event.data);
            this.onMessage?.(msg);

            // Dispatch visemes as a custom event for AvatarScene
            if (msg.type === "visemes") {
              window.dispatchEvent(
                new CustomEvent("fake-tts-event", { detail: msg.data })
              );
            }
          } catch {
            // ignore malformed JSON
          }
        } else {
          // Binary data = MP3 audio from TTS
          const blob =
            event.data instanceof Blob
              ? event.data
              : new Blob([event.data], { type: "audio/mpeg" });
          this.onAudio?.(blob);
        }
      };
    });
  }

  stop() {
    this.processor?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.context?.close();
    this.ws?.close();
    this.processor = null;
    this.context = null;
    this.stream = null;
    this.ws = null;
  }
}
