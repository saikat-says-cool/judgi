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
  const collectedAudioChunksRef = useRef<Blob[]>([]); // Use ref to collect chunks
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0-100 for visual feedback
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Function to clean up media resources
  const cleanupMedia = useCallback(() => {
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
    collectedAudioChunksRef.current = []; // Clear collected chunks
  }, []);

  // Function to process collected audio chunks for transcription
  const processTranscription = useCallback(async (chunks: Blob[]) => {
    setIsTranscribing(true);
    setIsRecordingActive(false); // Immediately set recording to inactive in parent
    cleanupMedia(); // Clean up media resources after chunks are collected

    if (chunks.length === 0) {
      showError("No audio recorded.");
      setIsTranscribing(false);
      onRecordingCancel();
      return;
    }

    const audioBlob = new Blob(chunks, { type: "audio/webm" });
    try {
      const transcribedText = await transcribeAudio(audioBlob);
      onTranscriptionComplete(transcribedText);
    } catch (error) {
      console.error("Transcription error:", error);
      showError(error instanceof Error ? error.message : "Failed to transcribe audio.");
      onRecordingCancel(); // Go back to normal input on error
    } finally {
      setIsTranscribing(false);
    }
  }, [onTranscriptionComplete, onRecordingCancel, setIsRecordingActive, cleanupMedia]);

  // This useEffect manages the start and stop of the MediaRecorder based on isRecordingActive prop
  useEffect(() => {
    console.log("VoiceRecorder useEffect: isRecordingActive =", isRecordingActive);
    let currentRecorder: MediaRecorder | null = null;
    let currentStream: MediaStream | null = null;

    if (isRecordingActive) {
      const startRecording = async () => {
        console.log("Attempting to start recording...");
        try {
          currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = currentStream;
          console.log("Microphone access granted.");
          currentRecorder = new MediaRecorder(currentStream);
          mediaRecorderRef.current = currentRecorder;
          collectedAudioChunksRef.current = []; // Reset chunks for new recording session

          currentRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              collectedAudioChunksRef.current.push(event.data);
            }
          };

          currentRecorder.onstop = () => {
            console.log("MediaRecorder stopped. Processing chunks...");
            processTranscription(collectedAudioChunksRef.current); // Trigger transcription here
          };

          currentRecorder.start();
          console.log("MediaRecorder started.");

          // Setup audio visualization
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioContextRef.current.createMediaStreamSource(currentStream);
          analyserRef.current = audioContextRef.current.createAnalyser();
          source.connect(analyserRef.current);
          analyserRef.current.fftSize = 256;
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateAudioLevel = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const average = sum / bufferLength;
              setAudioLevel(Math.min(100, Math.max(0, Math.floor(average * 0.7)))); // Scale to 0-100
            }
            animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);

        } catch (err) {
          console.error("Error accessing microphone or starting recording:", err);
          showError("Failed to access microphone. Please check permissions and try again.");
          setIsRecordingActive(false); // Inform parent to stop trying to record
          cleanupMedia(); // Ensure cleanup on error
        }
      };
      startRecording();
    }

    return () => {
      console.log("VoiceRecorder cleanup function running.");
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop(); // Stop recorder if still active
      }
      cleanupMedia(); // Ensure all media resources are cleaned up
      mediaRecorderRef.current = null;
    };
  }, [isRecordingActive, setIsRecordingActive, processTranscription, cleanupMedia]);

  // Memoized function to stop recording and initiate transcription
  const handleSend = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop(); // This will trigger onstop, which calls processTranscription
    } else {
      // If for some reason recorder is not active but user tries to send, cancel
      onRecordingCancel();
    }
  }, [onRecordingCancel]);

  // Memoized function to cancel recording
  const handleCancel = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop(); // This will trigger onstop, which calls processTranscription
    }
    cleanupMedia(); // Clean up immediately for cancel
    setIsRecordingActive(false);
    onRecordingCancel();
  }, [onRecordingCancel, setIsRecordingActive, cleanupMedia]);

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
      <Button variant="ghost" size="icon" onClick={handleSend} disabled={!isRecordingActive} aria-label="Send recording">
        <Check className="h-5 w-5 text-primary" />
      </Button>
    </div>
  );
};

export default VoiceRecorder;