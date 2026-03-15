"use client";
import React, { useCallback, useRef, useState, useEffect } from "react";
import { AudioCapture, WSMessage } from "../audio/capture";
import AvatarScene from "../avatar/AvatarScene";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("Ready to chat");
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  const captureRef = useRef<AudioCapture | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  const updateVolume = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
      setVolume(average); 
    }
    animationFrameRef.current = requestAnimationFrame(updateVolume);
  }, []);

  const handleMessage = useCallback((msg: WSMessage) => {
    if (msg.type === "partial" || msg.type === "transcript") {
      setTranscript(msg.data);
      if (msg.type === "transcript") {
        setStatus("Thinking...");
      } else {
        setStatus("Listening...");
      }
    } else if (msg.type === "response") {
      setResponse(msg.data);
      setStatus("Speaking...");
    } else if (msg.type === "state") {
      if (msg.data === "processing") {
        setIsAvatarSpeaking(true);
      } else if (msg.data === "listening") {
        setIsAvatarSpeaking(false);
        setStatus("Listening...");
      }
    }
  }, []);

  const handleAudio = useCallback((blob: Blob) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      setStatus("Listening...");
      setIsAvatarSpeaking(false);
      audioRef.current = null;
    };
    audio.play().catch(console.error);
  }, []);

  useEffect(() => {
    if (captureRef.current) {
      captureRef.current.muted = isAvatarSpeaking;
    }
  }, [isAvatarSpeaking]);

  const toggleRecording = async () => {
    if (isRecording) {
      captureRef.current?.stop();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      analyserRef.current = null;
      setIsRecording(false);
      setVolume(0);
      setStatus("Ready to chat");
    } else {
      try {
        const wsUrl = `ws://${window.location.hostname}:8000/ws`;
        const cap = new AudioCapture(wsUrl, handleMessage, handleAudio);
        await cap.start();

        // Create analyzer for volume meter
        if (cap.stream && cap.context) {
            const source = cap.context.createMediaStreamSource(cap.stream);
            const analyser = cap.context.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;
            updateVolume();
        }

        captureRef.current = cap;
        setIsRecording(true);
        setStatus("Listening...");
      } catch (err) {
        setStatus("Connection Error");
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col items-center">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl font-black bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent mb-2">
            AVATAR AI
          </h1>
          
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
              <p className="text-gray-400 font-medium tracking-widest text-[10px] uppercase cursor-default">
                {status}
              </p>
            </div>

            {/* Volume Meter */}
            {isRecording && (
                <div className="flex gap-1 h-3 items-center">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ 
                                height: Math.min(4 + (volume * 0.5) * (1 - Math.abs(i-10)/10), 20),
                                backgroundColor: i < 7 ? '#4ade80' : i < 14 ? '#fbbf24' : '#ef4444'
                            }}
                            className="w-1 rounded-full opacity-60"
                        />
                    ))}
                </div>
            )}
          </div>
        </motion.div>

        {/* 3D Scene Container */}
        <div className="relative w-full aspect-video max-h-[600px] bg-[#0a0a0a] rounded-3xl border border-white/5 shadow-2xl overflow-hidden group">
          <AvatarScene />
          
          {/* Overlay Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleRecording}
              className={`px-10 py-4 rounded-2xl font-bold transition-all duration-500 shadow-xl ${
                isRecording 
                  ? 'bg-red-500/20 border border-red-500/50 text-red-500 animate-pulse' 
                  : 'bg-white text-black border border-white/20 hover:bg-gray-200'
              }`}
            >
              {isRecording ? "END SESSION" : "START CONVERSATION"}
            </motion.button>
          </div>
        </div>

        {/* Chat Bubbles */}
        <div className="w-full mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
          <AnimatePresence mode="wait">
            {transcript && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl"
              >
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-2 tracking-tighter">Recognition</p>
                <p className="text-lg leading-relaxed text-gray-200">{transcript}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {response && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 rounded-3xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-xl"
              >
                <p className="text-[10px] text-purple-400 font-bold uppercase mb-2 tracking-tighter">Avatar Response</p>
                <p className="text-lg leading-relaxed text-purple-50">{response}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
