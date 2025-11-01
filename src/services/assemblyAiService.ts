"use client";

import { AssemblyAI } from '@assemblyai/sdk';
import { getAssemblyAiApiKey, rotateAssemblyAiApiKey, getAssemblyAiApiKeyCount } from '@/utils/assemblyAiApiKeys';

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const maxRetries = getAssemblyAiApiKeyCount();

  for (let i = 0; i < maxRetries; i++) {
    const apiKey = getAssemblyAiApiKey();
    const client = new AssemblyAI({ apiKey });

    try {
      // Pass the Blob directly to the transcribe method
      const transcript = await client.transcripts.transcribe({
        audio: audioBlob, // Changed from audioBuffer to audioBlob
      });

      if (transcript.status === 'completed') {
        return transcript.text || '';
      } else if (transcript.status === 'queued' || transcript.status === 'processing') {
        console.warn(`AssemblyAI transcript status: ${transcript.status}. This might take longer.`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        throw new Error(`Transcription still ${transcript.status}.`);
      } else {
        throw new Error(`AssemblyAI transcription failed with status: ${transcript.status}. Error: ${transcript.error}`);
      }
    } catch (error: any) {
      console.error(`Error transcribing audio with AssemblyAI (Attempt ${i + 1}/${maxRetries}):`, error);

      if (error.response && error.response.status === 429) {
        console.warn("AssemblyAI API rate limit hit. Rotating key and retrying...");
        rotateAssemblyAiApiKey();
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      } else if (error.response && error.response.status === 401) {
        throw new Error("Authentication failed with AssemblyAI API. Please check your API key.");
      } else {
        throw new Error(`Failed to transcribe audio: ${error.message || 'Unknown error'}`);
      }
    }
  }
  throw new Error("All AssemblyAI API keys exhausted or persistent issues encountered. Please try again later.");
};