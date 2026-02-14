
export interface GenerationResult {
  context: string;
  script: string;
  audioBase64?: string;
  voiceName?: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
}

export enum ProcessStatus {
  IDLE = 'IDLE',
  GENERATING_TEXT = 'GENERATING_TEXT',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export const AVAILABLE_VOICES: VoiceOption[] = [
  { id: 'Kore', name: 'Baronil & Serena', description: 'Voz profunda y calmada, ideal para reflexiones.' },
  { id: 'Charon', name: 'Sabiduría Ancestral', description: 'Tono grave y autoritario.' },
  { id: 'Fenrir', name: 'Fuerza & Misterio', description: 'Voz robusta y con carácter.' },
  { id: 'Zephyr', name: 'Aire & Claridad', description: 'Tono más suave y melódico.' },
];
