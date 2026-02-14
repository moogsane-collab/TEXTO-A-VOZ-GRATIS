
import React, { useState, useRef } from 'react';
import { generateContentAndAudio, decode, decodeAudioData } from './services/geminiService';
import { encodeWAV } from './services/audioUtils';
import { ProcessStatus, GenerationResult, AVAILABLE_VOICES } from './types';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(AVAILABLE_VOICES[0].id);
  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    
    setStatus(ProcessStatus.GENERATING_TEXT);
    try {
      const data = await generateContentAndAudio(inputText, selectedVoice);
      setResult(data);
      setStatus(ProcessStatus.COMPLETED);
    } catch (error) {
      console.error(error);
      setStatus(ProcessStatus.ERROR);
    }
  };

  const playAudio = async () => {
    if (!result?.audioBase64) return;

    if (isPlaying) {
      audioSourceRef.current?.stop();
      setIsPlaying(false);
      return;
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const ctx = audioContextRef.current;
      const decodedBytes = decode(result.audioBase64);
      const audioBuffer = await decodeAudioData(decodedBytes, ctx, 24000, 1);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => setIsPlaying(false);
      
      source.start();
      audioSourceRef.current = source;
      setIsPlaying(true);
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  const downloadAudio = () => {
    if (!result?.audioBase64) return;
    
    const binary = decode(result.audioBase64);
    const int16Samples = new Int16Array(binary.buffer);
    
    // Codificamos a WAV (formato estándar de alta calidad solicitado)
    const wavBlob = encodeWAV(int16Samples, 24000);
    const url = URL.createObjectURL(wavBlob);
    
    const a = document.createElement('a');
    a.href = url;
    const voiceName = AVAILABLE_VOICES.find(v => v.id === result.voiceName)?.name || 'audio';
    a.download = `Sombras_Pensamiento_${voiceName.replace(/\s+/g, '_')}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 p-4 md:p-8 selection:bg-purple-900/40">
      <header className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 tracking-tight">
          Sombras del Pensamiento
        </h1>
        <p className="text-zinc-500 uppercase tracking-[0.2em] text-sm">
          Laboratorio de Percepción & Audio Estratégico
        </p>
      </header>

      <main className="max-w-4xl mx-auto space-y-8">
        {/* Input & Voice Selection Section */}
        <section className="bg-[#141414] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className="block text-zinc-400 text-sm font-semibold mb-3 uppercase tracking-wider">
                Texto del Manuscrito
              </label>
              <textarea
                className="w-full h-48 bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition-all resize-none"
                placeholder="Pega aquí el contenido del libro..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm font-semibold mb-3 uppercase tracking-wider">
                Seleccionar Voz
              </label>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {AVAILABLE_VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedVoice === voice.id 
                        ? 'bg-purple-900/20 border-purple-500/50 text-white' 
                        : 'bg-[#0a0a0a] border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-sm font-bold">{voice.name}</div>
                    <div className="text-[10px] leading-tight mt-1 opacity-70">{voice.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleProcess}
            disabled={status === ProcessStatus.GENERATING_TEXT || status === ProcessStatus.GENERATING_AUDIO || !inputText.trim()}
            className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
          >
            {status === ProcessStatus.GENERATING_TEXT || status === ProcessStatus.GENERATING_AUDIO ? (
              <>
                <i className="fa-solid fa-circle-notch animate-spin"></i>
                Procesando Sombras...
              </>
            ) : (
              <>
                <i className="fa-solid fa-bolt"></i>
                Generar Experiencia
              </>
            )}
          </button>
        </section>

        {/* Results Section */}
        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Context Card */}
            <div className="bg-[#141414] border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-serif font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-xs font-sans">01</span>
                Análisis de Contexto
              </h2>
              <div className="prose prose-invert max-w-none text-zinc-400 leading-relaxed space-y-4">
                {result.context.split('\n').map((line, i) => line && <p key={i}>{line}</p>)}
              </div>
            </div>

            {/* Audio Script Card */}
            <div className="bg-[#141414] border border-zinc-800 rounded-2xl p-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4">
                <i className="fa-solid fa-quote-right text-4xl text-zinc-800"></i>
              </div>
              <h2 className="text-2xl font-serif font-bold text-white mb-6 flex items-center gap-3">
                 <span className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-xs font-sans">02</span>
                Guion de 46 Segundos
              </h2>
              <div className="bg-[#0a0a0a] p-6 rounded-xl border border-zinc-800 italic text-zinc-400 leading-loose mb-8">
                "{result.script}"
              </div>
              
              {/* Audio Playback & Download Controls */}
              <div className="mt-8 flex flex-col items-center justify-center p-8 border-t border-zinc-800">
                <div className="flex items-center gap-8 mb-6">
                  <button
                    onClick={downloadAudio}
                    className="group relative w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-purple-500 hover:bg-purple-900/10 transition-all"
                    title="Descargar Audio (WAV)"
                  >
                    <i className="fa-solid fa-download"></i>
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Descargar WAV
                    </span>
                  </button>
                  
                  <button
                    onClick={playAudio}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                      isPlaying 
                        ? 'bg-red-600 hover:bg-red-700 scale-110 shadow-[0_0_30px_rgba(220,38,38,0.3)]' 
                        : 'bg-purple-600 hover:bg-purple-700 hover:scale-105 shadow-[0_0_30px_rgba(147,51,234,0.3)]'
                    }`}
                  >
                    <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-2xl text-white`}></i>
                  </button>
                  
                  <div className="w-12 h-12 flex items-center justify-center opacity-0 pointer-events-none">
                  </div>
                </div>

                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-bold text-center">
                  {isPlaying ? 'Escuchando Voz de Sabiduría' : 'Reproducir Audio de Alto Valor'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-zinc-600 uppercase tracking-widest bg-zinc-900 px-2 py-0.5 rounded">
                    Voz: {AVAILABLE_VOICES.find(v => v.id === result.voiceName)?.name}
                  </span>
                  <span className="text-[10px] text-purple-600 uppercase tracking-widest bg-purple-900/10 px-2 py-0.5 rounded border border-purple-900/30">
                    Formato: WAV
                  </span>
                </div>

                <div className="mt-6 w-full max-w-xs h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full bg-purple-500 transition-all duration-[46000ms] ease-linear ${isPlaying ? 'w-full' : 'w-0'}`}></div>
                </div>
              </div>
            </div>
            
            <div className="text-center p-12 bg-gradient-to-t from-purple-900/10 to-transparent rounded-3xl border border-purple-900/20">
              <h3 className="text-xl font-serif text-white mb-2">Estrategia Lista</h3>
              <p className="text-zinc-500 text-sm">El contenido ha sido optimizado para captar atención inmediata.</p>
            </div>
          </div>
        )}

        {status === ProcessStatus.ERROR && (
          <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <i className="fa-solid fa-triangle-exclamation"></i>
            Ocurrió un error al procesar las sombras del pensamiento. Intenta de nuevo.
          </div>
        )}
      </main>

      <footer className="max-w-4xl mx-auto mt-20 pb-8 border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center text-zinc-600 text-xs gap-4 uppercase tracking-widest">
        <p>&copy; 2024 J. Andres Molano Zuluaga - Reservados todos los derechos.</p>
        <div className="flex gap-6">
          <span className="hover:text-zinc-400 cursor-help transition-colors">Percepción</span>
          <span className="hover:text-zinc-400 cursor-help transition-colors">Propósito</span>
          <span className="hover:text-zinc-400 cursor-help transition-colors">Abundancia</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
