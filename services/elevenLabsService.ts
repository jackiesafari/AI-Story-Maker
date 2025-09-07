// This service assumes you have ELEVENLABS_API_KEY set in your .env file

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// A good, gentle storytelling voice. You can find more voice IDs on the ElevenLabs website.
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; 

const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

/**
 * Generates narration audio from text using the ElevenLabs API.
 * @param text The text to convert to speech.
 * @returns A promise that resolves to an audio Blob.
 */
export const generateNarration = async (text: string): Promise<Blob> => {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ElevenLabs API key is not configured.");
  }
  
  if(!text.trim()) {
    return new Blob(); // Return empty blob if text is empty
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("ElevenLabs API Error:", errorData);
    throw new Error(`Failed to generate narration: ${errorData.detail?.message || response.statusText}`);
  }

  const audioBlob = await response.blob();
  return audioBlob;
};
