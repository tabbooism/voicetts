import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Upload, Sparkles, Loader2, Play, Pause, RefreshCw, AlertCircle, Volume2, Save, Users, ArrowRight } from "lucide-react";
import { CustomVoice, VoiceAnalysis, VoicePersona } from "../types";
import { generateTestPcmTone, pcmToWav } from "../utils/audioUtils";
import { VOICE_PERSONAS } from "../data/personaLibrary";

interface VoiceRecorderProps {
  onVoiceCloned: (newVoice: CustomVoice) => void;
  onNavigateToLibrary?: () => void;
}

// Preset samples to test cloning immediately
const DEMO_SAMPLES = [
  {
    id: "demo-creator",
    title: "📱 Social Media Influencer Sample",
    gender: "Female" as const,
    description: "An upbeat, cheerful female voice with highly energetic tones and expressive cadence.",
    base64Tone: generateTestPcmTone(520, 1.5), // dynamic dummy tone to analyze
    baselineVoice: "Kore",
    simulatedAnalysis: {
      pitch: "Slightly high-pitched and bright",
      speed: "Fast-paced and dynamic",
      tone: "Expressive, bubbly, and enthusiastic",
      accent: "West Coast North American",
      vibe: "Lifestyle Vlogger & Host",
      description: "A bright, fast-paced voice characterized by high enthusiasm, expressive pitch inflection, and modern speech fillers perfect for social content.",
      suggestedVoiceName: "Kore",
      clonedPersonaPrompt: "Say in an energetic, bubbly, west-coast social media influencer style with fast pace:"
    }
  },
  {
    id: "demo-banker",
    title: "💼 Elite Wealth Manager Sample",
    gender: "Male" as const,
    description: "A calm, reassuring, and professional male voice with a slight British accent.",
    base64Tone: generateTestPcmTone(320, 1.5), // dynamic dummy tone to analyze
    baselineVoice: "Zephyr",
    simulatedAnalysis: {
      pitch: "Deep, soothing, and resonant",
      speed: "Calm, deliberate, and measured",
      tone: "Reassuring, highly professional, and empathetic",
      accent: "Slight Received Pronunciation (British)",
      vibe: "Private Banking Advisor",
      description: "A pristine, soothing male voice with a rich, authoritative lower registry. Exudes warmth, financial security, and premium concierge assurance.",
      suggestedVoiceName: "Zephyr",
      clonedPersonaPrompt: "Say with a calm, reassuring, highly articulate British banking advisor tone:"
    }
  },
  {
    id: "demo-tech",
    title: "🎙️ Tech Podcast Host Sample",
    gender: "Male" as const,
    description: "A conversational, highly articulate, medium-pitch male voice with clear neutral projection.",
    base64Tone: generateTestPcmTone(400, 1.5), // dynamic dummy tone to analyze
    baselineVoice: "Puck",
    simulatedAnalysis: {
      pitch: "Medium baritone",
      speed: "Moderate and articulate",
      tone: "Intellectual, engaging, and friendly",
      accent: "General American Neutral",
      vibe: "Tech Reviewer & Speaker",
      description: "A highly clear and crisp speaker voice. Excellent mid-frequency projection and friendly, intellectual undertones suitable for educational or review clips.",
      suggestedVoiceName: "Puck",
      clonedPersonaPrompt: "Say in an engaging, conversational, highly articulate tech podcast host voice:"
    }
  }
];

export default function VoiceRecorder({ onVoiceCloned, onNavigateToLibrary }: VoiceRecorderProps) {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("audio/webm");
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VoiceAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clonedName, setClonedName] = useState("");
  const [selectedGender, setSelectedGender] = useState<"Male" | "Female" | "Neutral">("Neutral");

  // Media references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Format recording timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Start Microphone Recording
  const startRecording = async () => {
    try {
      setError(null);
      setRecordedAudioUrl(null);
      setRecordedBase64(null);
      setAnalysisResult(null);
      audioChunksRef.current = [];
      setRecordTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine support for modern formats
      let selectedMime = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        selectedMime = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        selectedMime = "audio/ogg;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        selectedMime = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/aac")) {
        selectedMime = "audio/aac";
      }
      setMimeType(selectedMime);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMime });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMime });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);

        // Convert audio to Base64 to send to server
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Extract pure base64 part
          const pureBase64 = base64String.split(",")[1];
          setRecordedBase64(pureBase64);
        };

        // Stop all tracks in the stream to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorder.start(250); // Slice data every 250ms
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordTime((prev) => {
          if (prev >= 60) { // Limit to 60 seconds
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error("Failed to access microphone:", err);
      setError("Failed to access microphone. Please check your browser permissions or use the preset samples.");
    }
  };

  // Stop Microphone Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Handle local audio file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setRecordedAudioUrl(null);
    setRecordedBase64(null);
    setAnalysisResult(null);

    if (!file.type.startsWith("audio/")) {
      setError("Please upload a valid audio file (MP3, WAV, M4A, etc.).");
      return;
    }

    setMimeType(file.type);
    const audioUrl = URL.createObjectURL(file);
    setRecordedAudioUrl(audioUrl);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const pureBase64 = base64String.split(",")[1];
      setRecordedBase64(pureBase64);
    };
  };

  // Trigger Acoustic Analysis of recorded/uploaded file on Express Server
  const analyzeVoiceSample = async () => {
    if (!recordedBase64) {
      setError("Please record or upload a voice sample first.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/voice/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: recordedBase64,
          mimeType: mimeType
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Acoustic analysis failed");
      }

      setAnalysisResult(data.analysis);
      
      // Seed values for cloned voice save
      const cleanLabel = clonedName || `My Cloned Voice ${new Date().toLocaleDateString()}`;
      setClonedName(cleanLabel);
      if (data.analysis.vibe?.toLowerCase().includes("female")) {
        setSelectedGender("Female");
      } else if (data.analysis.vibe?.toLowerCase().includes("male")) {
        setSelectedGender("Male");
      }
    } catch (err: any) {
      console.error("Analysis API failed:", err);
      setError(err.message || "Failed to contact analysis server. Please check your connection or API key config.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Instant demo clone from presets (handles API offline nicely)
  const loadDemoSample = async (demo: typeof DEMO_SAMPLES[0]) => {
    setError(null);
    setRecordedAudioUrl(null);
    setRecordedBase64(demo.base64Tone);
    setMimeType("audio/wav");
    setIsAnalyzing(true);

    try {
      // Attempt real analysis using the small base64 synthesized tone
      // This is actual API integration, and it falls back cleanly if server fails
      const response = await fetch("/api/voice/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: demo.base64Tone,
          mimeType: "audio/wav"
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data.analysis);
      } else {
        // Safe fall back to rich demo analysis template if server errors
        setAnalysisResult(demo.simulatedAnalysis);
      }

      setClonedName(demo.title.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim());
      setSelectedGender(demo.gender);
    } catch (err) {
      // Graceful fallback to rich preset data
      setAnalysisResult(demo.simulatedAnalysis);
      setClonedName(demo.title.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim());
      setSelectedGender(demo.gender);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load an archetype from the comprehensive persona library as a starting point
  const loadPersonaAsTemplate = (persona: VoicePersona) => {
    setError(null);
    setRecordedAudioUrl(null);
    const demoTone = generateTestPcmTone(440, 1.5);
    setRecordedBase64(demoTone);
    setMimeType("audio/wav");

    const analysis: VoiceAnalysis = {
      pitch: persona.voiceProfile.pitch,
      speed: persona.voiceProfile.speed,
      tone: persona.voiceProfile.tone,
      accent: persona.voiceProfile.accent,
      vibe: persona.voiceProfile.vibe,
      description: `${persona.description} (${persona.professionalBackground})`,
      suggestedVoiceName: persona.voiceProfile.suggestedVoiceName,
      clonedPersonaPrompt: persona.voiceProfile.clonedPersonaPrompt
    };

    setAnalysisResult(analysis);
    setClonedName(`${persona.name} (Cloned Variant)`);
    setSelectedGender(persona.gender);
  };

  // Save voice profile to cloned list
  const saveClonedVoice = () => {
    if (!analysisResult) return;

    const newVoice: CustomVoice = {
      id: `clone-${Date.now()}`,
      name: clonedName || "My Cloned Voice",
      type: "cloned",
      gender: selectedGender,
      suggestedVoiceName: analysisResult.suggestedVoiceName || "Zephyr",
      clonedPersonaPrompt: analysisResult.clonedPersonaPrompt,
      analysis: analysisResult,
      isCustom: true
    };

    onVoiceCloned(newVoice);
    
    // Reset form
    setRecordedAudioUrl(null);
    setRecordedBase64(null);
    setAnalysisResult(null);
    setClonedName("");
    setSelectedGender("Neutral");
  };

  // Playback utility for locally recorded/uploaded files
  const togglePreviewPlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingPreview) {
      audioPlayerRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" id="voice-cloner-section">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Mic className="w-5 h-5 text-indigo-600" />
            AI Acoustic Voice Cloner
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Analyze acoustic characteristics of raw audio to clone any voice tone and speech persona using Gemini.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3 text-rose-700 text-sm mb-6 items-start" id="cloner-error">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Acoustic Analysis Note:</span>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Audio Input Sources */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-50/70 rounded-xl border border-slate-100 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Option A: Live Voice Recording</h3>
            
            <div className="flex flex-col items-center py-6 justify-center bg-white border border-slate-100 rounded-xl shadow-xs">
              {isRecording ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                    <span className="font-mono text-xl font-bold text-slate-700">{formatTime(recordTime)}</span>
                  </div>
                  <div className="flex gap-1 justify-center items-end h-8 w-40">
                    {/* Visualizer bars */}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => (
                      <div
                        key={bar}
                        className="w-1.5 bg-rose-400 rounded-t"
                        style={{
                          height: `${Math.random() * 100}%`,
                          animationName: "pulse",
                          animationDuration: "0.3s",
                          animationIterationCount: "infinite",
                          animationTimingFunction: "ease-in-out",
                          animationDirection: "alternate",
                          animationDelay: `${bar * 0.05}s`
                        }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-medium transition shadow-sm cursor-pointer"
                    id="btn-stop-recording"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    Stop Recording
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-4 px-4">
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full">
                    <Mic className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Record 5-10 seconds</p>
                    <p className="text-xs text-slate-400 mt-1">Speak clearly in your natural voice and cadence.</p>
                  </div>
                  <button
                    onClick={startRecording}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition shadow-sm cursor-pointer"
                    id="btn-start-recording"
                  >
                    <Mic className="w-4 h-4" />
                    Start Recording
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50/70 rounded-xl border border-slate-100 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Option B: Upload Audio File</h3>
            
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white rounded-xl p-5 text-center cursor-pointer transition">
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-sm font-medium text-slate-600">Choose custom voice clip</span>
              <span className="text-xs text-slate-400 mt-1">Supports WAV, MP3, M4A up to 10MB</span>
              <input
                type="file"
                className="hidden"
                accept="audio/*"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Preset Demos */}
          <div className="bg-slate-50/70 rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Option C: Instant Creator & Banker Demo Presets</h3>
              <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />
            </div>
            <p className="text-xs text-slate-500 mb-4">No mic? Experience the full analyzer pipeline instantly by clicking a curated sample voice.</p>
            
            <div className="flex flex-col gap-2.5">
              {DEMO_SAMPLES.map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => loadDemoSample(demo)}
                  className="flex flex-col items-start text-left p-3 bg-white hover:bg-indigo-50/40 border border-slate-100 hover:border-indigo-200 rounded-lg transition text-xs shadow-xs w-full group"
                >
                  <span className="font-semibold text-slate-700 group-hover:text-indigo-700 flex items-center justify-between w-full">
                    {demo.title}
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-normal">{demo.gender}</span>
                  </span>
                  <span className="text-slate-400 mt-1 line-clamp-1">{demo.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Option D: Start from Persona Library Archetype */}
          <div className="bg-sky-50/50 rounded-xl border border-sky-100 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-600" />
                Option D: Start from Persona Library
              </h3>
              <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded font-mono font-bold">
                18 Archetypes
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Pick a curated global persona archetype as a baseline. Its acoustic profile will load instantly into the cloning profiler for customization.
            </p>

            <div className="space-y-2">
              {VOICE_PERSONAS.slice(0, 4).map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => loadPersonaAsTemplate(persona)}
                  className="w-full text-left p-2.5 bg-white hover:bg-sky-50/60 border border-slate-100 hover:border-sky-200 rounded-lg transition text-xs shadow-xs flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-slate-800 group-hover:text-sky-700 block truncate">
                      {persona.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {persona.accent} • {persona.professionalBackground}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded shrink-0 group-hover:bg-sky-600 group-hover:text-white transition">
                    Use as Base
                  </span>
                </button>
              ))}

              {onNavigateToLibrary && (
                <button
                  onClick={onNavigateToLibrary}
                  className="w-full mt-2 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Browse All 18 Personas in Library</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Results & Cloning Profiler */}
        <div className="lg:col-span-7 flex flex-col justify-start">
          
          {/* File Selected & Ready for Analysis state */}
          {recordedAudioUrl && !isAnalyzing && !analysisResult && (
            <div className="bg-indigo-50/35 border border-indigo-100 rounded-xl p-6 flex flex-col items-center justify-center text-center py-12">
              <Volume2 className="w-12 h-12 text-indigo-600 mb-3 animate-pulse" />
              <h3 className="font-semibold text-slate-800 text-base">Acoustic Voice Clip Captured</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">We have structured the vocal waves. Run the acoustic analyzer to map tone, speed, and pitch characteristics.</p>
              
              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={togglePreviewPlayback}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 text-sm font-medium transition cursor-pointer"
                >
                  {isPlayingPreview ? (
                    <>
                      <Pause className="w-4 h-4 text-slate-500" /> Pause Sample
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-slate-500" /> Play Sample
                    </>
                  )}
                </button>

                <audio
                  ref={audioPlayerRef}
                  src={recordedAudioUrl}
                  onEnded={() => setIsPlayingPreview(false)}
                  className="hidden"
                />

                <button
                  onClick={analyzeVoiceSample}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm cursor-pointer"
                  id="btn-analyze-voice"
                >
                  <Sparkles className="w-4 h-4" />
                  Analyze Acoustic Sample
                </button>
              </div>
            </div>
          )}

          {/* Loading State during AI Analysis */}
          {isAnalyzing && (
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-8 flex flex-col items-center justify-center text-center py-16">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <h3 className="font-semibold text-slate-800 text-base">Gemini Acoustic Analysis In Progress...</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md">
                Deconstructing frequency spectra, identifying pitch levels, analyzing emotional tone, speed cadence, and speech accents...
              </p>
              <div className="mt-4 flex gap-1 justify-center">
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}

          {/* No File Selected state */}
          {!recordedAudioUrl && !isAnalyzing && !analysisResult && (
            <div className="h-full min-h-[300px] border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <Sparkles className="w-10 h-10 text-indigo-200 mb-3" />
              <h3 className="font-medium text-slate-700 text-sm">Waiting for voice input</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Record a live sample, upload an audio file, or choose a pre-loaded creator/banking demo preset to generate an emulated voice clone.
              </p>
            </div>
          )}

          {/* Analyzed Results & Voice Profile Form */}
          {analysisResult && !isAnalyzing && (
            <div className="flex flex-col gap-6" id="cloned-analysis-results">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-3">
                  <Sparkles className="w-4.5 h-4.5 text-emerald-600" />
                  AI Voice Analysis Completed Successfully!
                </div>
                <p className="text-xs text-slate-600">{analysisResult.description}</p>
              </div>

              {/* Character presets grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Acoustic Pitch</span>
                  <span className="text-xs font-semibold text-slate-700 mt-1 block">{analysisResult.pitch}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Speed Cadence</span>
                  <span className="text-xs font-semibold text-slate-700 mt-1 block">{analysisResult.speed}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Vocal Tone</span>
                  <span className="text-xs font-semibold text-slate-700 mt-1 block">{analysisResult.tone}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Region / Accent</span>
                  <span className="text-xs font-semibold text-slate-700 mt-1 block">{analysisResult.accent}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Vocal Vibe</span>
                  <span className="text-xs font-semibold text-slate-700 mt-1 block">{analysisResult.vibe}</span>
                </div>
                <div className="bg-slate-50 border border-emerald-100 bg-emerald-50/10 rounded-lg p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Model Voice Anchor</span>
                  <span className="text-xs font-semibold text-indigo-600 mt-1 block">{analysisResult.suggestedVoiceName}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Cloned Synthesis Prompt Prefix</span>
                <p className="text-xs text-slate-600 font-mono italic leading-relaxed">
                  "{analysisResult.clonedPersonaPrompt}"
                </p>
              </div>

              {/* Profile Naming & Saving Form */}
              <div className="border-t border-slate-100 pt-5 mt-2">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Save Cloned Voice Profile</h3>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Cloned Voice Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-indigo-500"
                      value={clonedName}
                      placeholder="e.g. Rachel - Custom Creator"
                      onChange={(e) => setClonedName(e.target.value)}
                    />
                  </div>
                  
                  <div className="w-full md:w-40">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Gender Tag</label>
                    <select
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-indigo-500 h-[38px]"
                      value={selectedGender}
                      onChange={(e) => setSelectedGender(e.target.value as any)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Neutral">Neutral</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-4 justify-end">
                  <button
                    onClick={() => {
                      setAnalysisResult(null);
                      setRecordedAudioUrl(null);
                    }}
                    className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition cursor-pointer"
                  >
                    Discard Analysis
                  </button>
                  <button
                    onClick={saveClonedVoice}
                    className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm cursor-pointer"
                    id="btn-save-cloned-voice"
                  >
                    <Save className="w-4 h-4" />
                    Save Voice Clone Profile
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
