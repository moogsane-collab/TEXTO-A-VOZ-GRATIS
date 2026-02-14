
import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export const generateContentAndAudio = async (inputText: string, voiceName: string = 'Kore') => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // 1. Generate Context and Script
  const textResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Actúa como un experto en marketing digital y psicología profunda. 
      A partir del siguiente texto literario/filosófico titulado "Sombras del Pensamiento", realiza dos tareas:
      
      TAREA 1: Genera un "Contexto" breve y poderoso (máximo 3 párrafos) que resuma la esencia del libro, sus temas de biodescodificación, percepción y búsqueda de propósito.
      
      TAREA 2: Escribe un guion para un audio promocional de exactamente 46 segundos (aprox. 85-95 palabras en español). El guion debe:
      - Empezar con un gancho que cuestione la realidad del oyente.
      - Mencionar la "trampa de la percepción" y el "caos interno".
      - Ser inspirador pero directo.
      - Terminar obligatoriamente con el CTA: "Escribe al DM para más información sobre este libro de alto valor. Se entregará solo a las personas más interesadas."
      
      Texto base: ${inputText.substring(0, 15000)}
    `,
    config: {
      temperature: 0.7,
      topP: 0.95,
    }
  });

  const fullText = textResponse.text || "";
  const parts = fullText.split(/TAREA 2:|GUION:|GUIÓN:/i);
  const context = parts[0].replace(/TAREA 1:|CONTEXTO:/i, "").trim();
  const script = parts[1] ? parts[1].trim() : "Error generando guion.";

  // 2. Generate Audio (TTS)
  const audioResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Lee con una voz que encaje con el estilo solicitado (${voiceName}), de forma pausada, reflexiva y misteriosa el siguiente guion: ${script}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName as any },
        },
      },
    },
  });

  const audioBase64 = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  return { context, script, audioBase64, voiceName };
};

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
