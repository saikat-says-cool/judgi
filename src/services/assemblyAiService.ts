"use client";

import { AssemblyAI } from '@assemblyai/sdk';
import { getAssemblyAiApiKey, rotateAssemblyAiApiKey, getAssemblyAiApiKeyCount } from '@/utils/assemblyAiApiKeys';

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const maxRetries = getAssemblyAiApiKeyCount();

  for (let i = 0; i < maxRetries; i++) {
    const apiKey = getAssemblyAiApiKey();
    const client = new AssemblyAI({ apiKey });

    try {
      // Convert Blob to ArrayBuffer for the SDK
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      const transcript = await client.transcripts.transcribe({
        audio: audioBuffer,
      });

      if (transcript.status === 'completed') {
        return transcript.text || '';
      } else if (transcript.status === 'queued' || transcript.status === 'processing') {
        // For real-time or longer audio, you'd poll for status.
        // For short chat messages, we'll assume it completes quickly or fails.
        console.warn(`AssemblyAI transcript status: ${transcript.status}. This might take longer.`);
        // For this MVP, we'll wait a bit and then re-check or assume failure if not completed.
        // In a production app, you'd implement a polling mechanism.
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        // Re-fetch transcript status if needed, but for now, we'll just let it retry with a new key if it fails.
        throw new Error(`Transcription still ${transcript.status}.`);
      } else {
        throw new Error(`AssemblyAI transcription failed with status: ${transcript.status}. Error: ${transcript.error}`);
      }
    } catch (error: any) {
      console.error(`Error transcribing audio with AssemblyAI (Attempt ${i + 1}/${maxRetries}):`, error);

      // Check for rate limit or authentication errors
      if (error.response && error.response.status === 429) {
        console.warn("AssemblyAI API rate limit hit. Rotating key and retrying...");
        rotateAssemblyAiApiKey();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay before retry
        continue; // Try again with the new key
      } else if (error.response && error.response.status === 401) {
        throw new Error("Authentication failed with AssemblyAI API. Please check your API key.");
      } else {
        // Re-throw other errors
        throw new Error(`Failed to transcribe audio: ${error.message || 'Unknown error'}`);
      }
    }
  }
  throw new Error("All AssemblyAI API keys exhausted or persistent issues encountered. Please try again later.");
};