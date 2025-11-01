"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Check, X, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { transcribeAudio } from '@/services/assemblyAiService';
import { showError } from '@/utils/toast';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onRecordingCancel: () => void;
  isRecordingActive: boolean;
  setIsRecordingActive: (active: boolean) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptionComplete,
  onRecordingCancel,
  isRecordingActive,
  setIsRecordingActive,
}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0-100 for visual feedback
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // This useEffect manages the start and stop of the MediaRecorder based on isRecordingActive prop
  useEffect(() => {
    console.log("VoiceRecorder useEffect: isRecordingActive =", isRecordingActive);
    let currentRecorder: MediaRecorder | null = null;
    let currentStream: MediaStream | null = null;
    let currentAudioContext: AudioContext | null = null;
    let currentAnalyser: AnalyserNode | null = null;
    let currentAnimationFrame: number | null = null;

    const stopRecordingInternal = () => {
      if (currentRecorder && currentRecorder.state === "recording") {
        console.log("Stopping MediaRecorder (internal)...");
        currentRecorder.stop();
      }
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      if (currentAudioContext) {
        currentAudioContext.close();
      }
      if (currentAnimationFrame) {
        cancelAnimationFrame(currentAnimationFrame);
      }
      setAudioLevel(0);
      // Clear refs
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
      audioContextRef.current = null;
      analyserRef.current = null;
      animationFrameRef.current = null;
    };

    if (isRecordingActive) {
      const startRecording = async () => {
        console.log("Attempting to start recording...");
        try {
          currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = currentStream;
          console.log("Microphone access granted.");
          currentRecorder = new MediaRecorder(currentStream);
          mediaRecorderRef.current = currentRecorder;
          setAudioChunks([]);

          currentRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              setAudioChunks((prev) => [...prev, event.data]);
            }
          };

          currentRecorder.onstop = () => {
            console.log("MediaRecorder stopped by its own onstop event.");
            // The cleanup function will handle full teardown
          };

          currentRecorder.start();
          console.log("MediaRecorder started.");

          // Setup audio visualization
          currentAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = currentAudioContext;
          const source = currentAudioContext.createMediaStreamSource(currentStream);
          currentAnalyser = currentAudioContext.createAnalyser();
          analyserRef.current = currentAnalyser;
          source.connect(currentAnalyser);
          currentAnalyser.fftSize = 256;
          const bufferLength = currentAnalyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateAudioLevel = () => {
            if (currentAnalyser) {
              currentAnalyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const average = sum / bufferLength;
              setAudioLevel(Math.min(100, Math.max(0, Math.floor(average * 0.7)))); // Scale to 0-100
            }
            currentAnimationFrame = requestAnimationFrame(updateAudioLevel);
            animationFrameRef.current = currentAnimationFrame;
          };
          currentAnimationFrame = requestAnimationFrame(updateAudioLevel);

        } catch (err) {
          console.error("Error accessing microphone or starting recording:", err);
          showError("Failed to access microphone. Please check permissions and try again.");
          setIsRecordingActive(false); // Inform parent to stop trying to record
        }
      };
      startRecording();
    }

    return () => {
      console.log("VoiceRecorder cleanup function running.");
      stopRecordingInternal(); // Ensure cleanup on unmount or when isRecordingActive becomes false
    };
  }, [isRecordingActive, setIsRecordingActive]); // Dependencies: only re-run when these change

  // Memoized function to stop recording and initiate transcription
  const handleSend = useCallback(async () => {
    // Explicitly stop the internal recorder before processing
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    // Cleanup stream and context immediately
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);

    setIsTranscribing(true);
    setIsRecordingActive(false); // Immediately set recording to inactive in parent

    if (audioChunks.length === 0) {
      showError("No audio recorded.");
      setIsTranscribing(false);
      onRecordingCancel();
      return;
    }

    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    try {
      const transcribedText = await transcribeAudio(audioBlob);
      onTranscriptionComplete(transcribedText);
    } catch (error) {
      console.error("Transcription error:", error);
      showError(error instanceof Error ? error.message : "Failed to transcribe audio.");
      onRecordingCancel(); // Go back to normal input on error
    } finally {
      setIsTranscribing(false);
      setAudioChunks([]);
    }
  }, [audioChunks, onTranscriptionComplete, onRecordingCancel, setIsRecordingActive]);

  // Memoized function to cancel recording
  const handleCancel = useCallback(() => {
    // Explicitly stop the internal recorder before processing
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    // Cleanup stream and context immediately
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);

    setAudioChunks([]);
    setIsRecordingActive(false); // Immediately set recording to inactive in parent
    onRecordingCancel();
  }, [onRecordingCancel, setIsRecordingActive]);

  if (isTranscribing) {
    return (
      <div className="flex items-center justify-center w-full h-full px-2">
        <Square className="h-5 w-5 animate-spin mr-2 text-primary" />
        <span className="text-muted-foreground text-sm">Transcribing audio...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full h-full px-2">
      <Button variant="ghost" size="icon" onClick={handleCancel} aria-label="Discard recording">
        <X className="h-5 w-5 text-destructive" />
      </Button>
      <div className="flex items-center justify-center flex-1">
        <div
          className={cn(
            "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-100 ease-out",
            isRecordingActive ? "bg-red-500/20" : "bg-muted"
          )}
          style={{
            width: `${40 + audioLevel * 0.5}px`, // Scale size based on audio level
            height: `${40 + audioLevel * 0.5}px`,
          }}
        >
          <Mic className={cn("h-6 w-6", isRecordingActive ? "text-red-500" : "text-muted-foreground")} />
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={handleSend} disabled={audioChunks.length === 0} aria-label="Send recording">
        <Check className="h-5 w-5 text-primary" />
      </Button>
    </div>
  );
};

export default VoiceRecorder;