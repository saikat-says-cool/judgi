"use client";

import { getAssemblyAiApiKey, rotateAssemblyAiApiKey, getAssemblyAiApiKeyCount } from '@/utils/assemblyAiApiKeys';
import { showError } from '@/utils/toast';

const ASSEMBLYAI_BASE_URL = "https://api.assemblyai.com/v2";

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const maxRetries = getAssemblyAiApiKeyCount();

  for (let i = 0; i < maxRetries; i++) {
    const apiKey = getAssemblyAiApiKey();
    const headers = {
      'Authorization': apiKey,
      'Content-Type': 'application/octet-stream',
    };

    try {
      // Step 1: Upload the audio file
      const uploadResponse = await fetch(`${ASSEMBLYAI_BASE_URL}/upload`, {
        method: 'POST',
        headers: headers,
        body: audioBlob,
      });

      if (uploadResponse.status === 429) {
        console.warn("AssemblyAI API rate limit hit during upload. Rotating key and retrying...");
        rotateAssemblyAiApiKey();
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(`AssemblyAI upload failed: ${uploadResponse.statusText} - ${errorData.error || 'Unknown error'}`);
      }

      const uploadResult = await uploadResponse.json();
      const uploadUrl = uploadResult.upload_url;

      // Step 2: Submit for transcription
      const transcriptHeaders = {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      };
      const transcriptBody = JSON.stringify({ audio_url: uploadUrl });

      const submitResponse = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript`, {
        method: 'POST',
        headers: transcriptHeaders,
        body: transcriptBody,
      });

      if (submitResponse.status === 429) {
        console.warn("AssemblyAI API rate limit hit during transcription submission. Rotating key and retrying...");
        rotateAssemblyAiApiKey();
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(`AssemblyAI transcription submission failed: ${submitResponse.statusText} - ${errorData.error || 'Unknown error'}`);
      }

      const submitResult = await submitResponse.json();
      const transcriptId = submitResult.id;

      // Step 3: Poll for transcript completion
      const pollingEndpoint = `${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}`;
      while (true) {
        const pollingResponse = await fetch(pollingEndpoint, { headers: { 'Authorization': apiKey } });

        if (pollingResponse.status === 429) {
          console.warn("AssemblyAI API rate limit hit during polling. Rotating key and retrying...");
          rotateAssemblyAiApiKey();
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        if (!pollingResponse.ok) {
          const errorData = await pollingResponse.json();
          throw new Error(`AssemblyAI polling failed: ${pollingResponse.statusText} - ${errorData.error || 'Unknown error'}`);
        }

        const transcriptionResult = await pollingResponse.json();

        if (transcriptionResult.status === 'completed') {
          return transcriptionResult.text || '';
        } else if (transcriptionResult.status === 'error') {
          throw new Error(`AssemblyAI transcription failed: ${transcriptionResult.error}`);
        } else {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Poll every 3 seconds
        }
      }
    } catch (error: any) {
      console.error(`Error transcribing audio with AssemblyAI (Attempt ${i + 1}/${maxRetries}):`, error);
      if (error.message.includes("Authentication failed")) {
        throw new Error("Authentication failed with AssemblyAI API. Please check your API key.");
      }
      // If it's a network error or other non-429 API error, re-throw immediately
      if (i === maxRetries - 1 || !error.message.includes("rate limit hit")) {
        throw new Error(`Failed to transcribe audio: ${error.message || 'Unknown error'}`);
      }
      // If it was a rate limit, the loop will continue to the next key
    }
  }
  throw new Error("All AssemblyAI API keys exhausted or persistent issues encountered. Please try again later.");
};