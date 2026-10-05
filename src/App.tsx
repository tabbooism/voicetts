/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import JSZip from "jszip";
import {
  Mic,
  Play,
  Pause,
  Download,
  Share2,
  Trash2,
  Plus,
  Loader2,
  Sparkles,
  Smartphone,
  ShieldAlert,
  Volume2,
  Copy,
  Check,
  Languages,
  UserCheck,
  TrendingUp,
  Sliders,
  Sparkle,
  FileText,
  Layers,
  PhoneCall,
  Save,
  HelpCircle,
  AlertCircle,
  Search,
  Image as ImageIcon,
  MapPin,
  Send,
  Brain,
  ShieldCheck,
  Activity,
  Fingerprint,
  FolderDown,
  Users
} from "lucide-react";
import {
  CustomVoice,
  CustomConfig,
  DialogueLine,
  GeneratedClip,
  PREBUILT_VOICES,
  PrebuiltVoiceOption,
  VoicePersona
} from "./types";
import { pcmToWav } from "./utils/audioUtils";
import VoiceRecorder from "./components/VoiceRecorder";
import PersonaLibrary from "./components/PersonaLibrary";
import { VOICE_PERSONAS } from "./data/personaLibrary";

// Industry prebuilt scenarios/templates for instant creator or banking workflows
const WORKFLOW_PRESETS = [
  {
    id: "banking-fraud",
    category: "Banking Agents",
    label: "🚨 Urgent Security & Fraud Warning",
    text: "Urgent message from security department: We have detected a suspicious login attempt on your bank account from an unknown device in London. If this was not you, please reply immediately or press 1 to freeze your credentials.",
    defaultVoice: "zephyr",
    pitch: "Slightly deep & calm",
    speed: "Measured (0.95x)",
    tone: "Authoritative & Secure",
    accent: "Neutral Professional",
    style: "with crisp articulation and reassuring warmth to avoid user panic"
  },
  {
    id: "banking-welcome",
    category: "Banking Agents",
    label: "🤝 Premium Wealth Welcome Greeting",
    text: "Welcome to Elite Private Banking, my name is James. It is an absolute pleasure to assist you with your investment portfolio today. Let us review your high-yield asset allocation together.",
    defaultVoice: "zephyr",
    pitch: "Resonant baritone",
    speed: "Measured (0.90x)",
    tone: "Warm & Sophisticated",
    accent: "Slight British",
    style: "with exceptional clarity and high-end concierge elegance"
  },
  {
    id: "creator-tiktok",
    category: "Content Creators",
    label: "📱 Sassy Viral Review Hook",
    text: "Okay but can we actually talk about this new financial hack? It is literally saving people thousands of dollars and nobody is talking about it! Listen up, because this is going to change everything.",
    defaultVoice: "kore",
    pitch: "Bright and enthusiastic",
    speed: "Rapid (1.15x)",
    tone: "Bubbly & Excited",
    accent: "West Coast US",
    style: "with modern cadence, playful emphasis, and energetic tone ready for a viral 9:16 reel"
  },
  {
    id: "creator-pod",
    category: "Content Creators",
    label: "🎙️ Tech News Brief Intro",
    text: "Welcome back to the Daily Byte. Today, we're dissecting the latest developments in generative audio models and what they mean for the future of digital expression. Let's dive into the details.",
    defaultVoice: "puck",
    pitch: "Medium and conversational",
    speed: "Moderate (1.00x)",
    tone: "Friendly & Analytical",
    accent: "General American",
    style: "with clean broadcasting resonance and conversational mid-tones"
  }
];

// Target Device Simulator EQ presets
const TARGET_DEVICES = [
  { id: "iphone", name: "iPhone 15 Pro Speaker", description: "Simulated high-mid response with low-end roll-off", icon: "" },
  { id: "android", name: "Galaxy S24 Ultra Speaker", description: "Bright presence boost and stereo spatialization", icon: "🤖" },
  { id: "ivr", name: "Bank Interactive Phone (IVR)", description: "8kHz narrowband telephone codec filter effect", icon: "☎️" },
  { id: "studio", name: "Studio Reference Monitors", description: "Pristine, uncompressed 24kHz raw wave resolution", icon: "🎧" }
];

// Pre-loaded multi-speaker dialogue scripts for security training and creators
const DIALOGUE_PRESETS = [
  {
    id: "verif-wealth",
    name: "💼 High-Value Account Verification",
    description: "A private wealth advisor verifying a suspicious transaction with a customer.",
    script: [
      {
        id: "v-line-1",
        speaker: "James (Private Wealth)",
        text: "Hello Rachel, this is James from the security assurance desk. We detected an anomalous card transaction.",
        voiceId: "zephyr",
        style: "Serious, calm, and reassuring"
      },
      {
        id: "v-line-2",
        speaker: "Rachel (Mobile User)",
        text: "Oh no! Is everything alright with my balance? I did not authorize any transactions this afternoon.",
        voiceId: "kore",
        style: "Concerned and fast-paced"
      }
    ]
  },
  {
    id: "security-mfa",
    name: "🛡️ Urgent Multi-Factor Security Challenge",
    description: "An account security desk calling to confirm a suspicious device password reset.",
    script: [
      {
        id: "f-line-1",
        speaker: "MFA Security Desk",
        text: "Alert: An unauthorized device from London is requesting a master password change. Did you authorize this?",
        voiceId: "charon",
        style: "Authoritative, serious, and fast-paced"
      },
      {
        id: "f-line-2",
        speaker: "Account Owner",
        text: "No! I am in New York right now! Please lock down the access immediately and block any outgoing transfers!",
        voiceId: "fenrir",
        style: "Alarmed, high pitch, and urgent"
      }
    ]
  },
  {
    id: "creator-podcast",
    name: "🎙️ Tech Creator Podcast Segment",
    description: "Engaging podcast discussion between creators analyzing future voice cloning.",
    script: [
      {
        id: "p-line-1",
        speaker: "Host Sarah",
        text: "Welcome back to the Creators Sandbox! Today we're analyzing the future of synthetic audio cloning.",
        voiceId: "kore",
        style: "Bright, bubbly, and enthusiastic"
      },
      {
        id: "p-line-2",
        speaker: "Co-host Derek",
        text: "Yes Sarah, it's absolutely wild how seamless these voice clones are becoming for multi-speaker podcasts.",
        voiceId: "puck",
        style: "Engaging, professional, and friendly"
      }
    ]
  }
];

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"cloner" | "studio" | "banking" | "intel" | "personas">("personas");
  
  // Cyber-Biometric Intelligence Suite States
  const [intelVoiceId, setIntelVoiceId] = useState<string>("zephyr");
  const [dossier, setDossier] = useState<any>(null);
  const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
  const [intelChatHistory, setIntelChatHistory] = useState<{ role: "user" | "model"; text: string }[]>([
    { role: "model", text: "[INTELLIGENCE TERMINAL]: Handshake complete. Access credentials authenticated. Ready to interface with custom voice profiles." }
  ]);
  const [intelChatInput, setIntelChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  
  const [transcriptionText, setTranscriptionText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const [spectrographImage, setSpectrographImage] = useState<string>("");
  const [spectrographAnalysis, setSpectrographAnalysis] = useState<any>(null);
  const [isAnalyzingSpectrograph, setIsAnalyzingSpectrograph] = useState(false);
  
  const [mapsQuery, setMapsQuery] = useState("");
  const [mapsResult, setMapsResult] = useState("");
  const [isMapping, setIsMapping] = useState(false);

  // Voices State
  const [voices, setVoices] = useState<CustomVoice[]>(() => {
    // Populate with prebuilt voices first
    return PREBUILT_VOICES.map((v) => ({
      id: v.id,
      name: `${v.name} (${v.vibe})`,
      type: "prebuilt",
      gender: v.gender,
      suggestedVoiceName: v.voiceName
    }));
  });

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("zephyr");
  
  // Custom Persona Paramaters
  const [pitch, setPitch] = useState("Medium and balanced");
  const [speed, setSpeed] = useState("Moderate (1.00x)");
  const [tone, setTone] = useState("Professional and confident");
  const [accent, setAccent] = useState("Neutral Standard");
  const [customStyle, setCustomStyle] = useState("");
  const [textureSlider, setTextureSlider] = useState(75); // breathy vs crisp

  // Script & Synthesis State
  const [scriptText, setScriptText] = useState(
    "Welcome back to our daily financial insight. Our focus today is on long-term diversification strategies for the modern investor. Let's analyze the current market trends and what they mean for your portfolio."
  );
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizeError, setSynthesizeError] = useState<string | null>(null);

  // Generated Audio State
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clipsHistory, setClipsHistory] = useState<GeneratedClip[]>([]);
  const [currentPlayingClipId, setCurrentPlayingClipId] = useState<string | null>(null);
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);

  // Authorization state for security compliance
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(true);

  // Target Device simulator state
  const [targetDevice, setTargetDevice] = useState("studio");

  // State for quick assigning voice to dialogue
  const [assigningVoiceId, setAssigningVoiceId] = useState<string | null>(null);

  // Multi-Speaker Dialogue state
  const [dialogueScript, setDialogueScript] = useState<DialogueLine[]>([
    {
      id: "line-1",
      speaker: "James (Private Wealth)",
      text: "Hello Rachel, this is James from the security assurance desk. We detected an anomalous card transaction.",
      voiceId: "zephyr",
      style: "Serious, calm, and reassuring"
    },
    {
      id: "line-2",
      speaker: "Rachel (Mobile User)",
      text: "Oh no! Is everything alright with my balance? I did not authorize any transactions this afternoon.",
      voiceId: "kore",
      style: "Concerned and fast-paced"
    }
  ]);
  const [dialogueSpeakers, setDialogueSpeakers] = useState<string[]>([
    "James (Private Wealth)",
    "Rachel (Mobile User)"
  ]);

  // Audio elements ref
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);

  // Handle Voice Cloned Callback
  const handleVoiceCloned = (newVoice: CustomVoice) => {
    setVoices((prev) => [newVoice, ...prev]);
    setSelectedVoiceId(newVoice.id);
    setActiveTab("studio"); // Return to studio once voice is cloned
    
    // Automatically apply analysis results to the sliders
    if (newVoice.analysis) {
      setPitch(newVoice.analysis.pitch);
      setSpeed(newVoice.analysis.speed);
      setTone(newVoice.analysis.tone);
      setAccent(newVoice.analysis.accent);
      setCustomStyle(`Vibe: ${newVoice.analysis.vibe}. ${newVoice.analysis.clonedPersonaPrompt}`);
    }
  };

  // Select a persona archetype from library as starting point for customization
  const handleSelectPersonaForCustomization = (persona: VoicePersona) => {
    // 1. Prepopulate Persona Studio acoustic sliders & style
    setPitch(persona.voiceProfile.pitch);
    setSpeed(persona.voiceProfile.speed);
    setTone(persona.voiceProfile.tone);
    setAccent(persona.voiceProfile.accent);
    setTextureSlider(persona.voiceProfile.textureSlider);
    setCustomStyle(`Persona: ${persona.name} (${persona.professionalBackground}). Vibe: ${persona.voiceProfile.vibe}. ${persona.voiceProfile.customStyle}`);
    setScriptText(persona.defaultScript);

    // 2. Add as custom cloned profile if not already present
    const cloneId = `clone-${persona.id}`;
    if (!voices.some((v) => v.id === cloneId)) {
      const newCustomVoice: CustomVoice = {
        id: cloneId,
        name: `${persona.name} (Customized)`,
        type: "cloned",
        gender: persona.gender,
        suggestedVoiceName: persona.voiceProfile.suggestedVoiceName,
        clonedPersonaPrompt: persona.voiceProfile.clonedPersonaPrompt,
        analysis: {
          pitch: persona.voiceProfile.pitch,
          speed: persona.voiceProfile.speed,
          tone: persona.voiceProfile.tone,
          accent: persona.voiceProfile.accent,
          vibe: persona.voiceProfile.vibe,
          description: `${persona.description} (${persona.professionalBackground})`,
          suggestedVoiceName: persona.voiceProfile.suggestedVoiceName,
          clonedPersonaPrompt: persona.voiceProfile.clonedPersonaPrompt
        },
        isCustom: true
      };
      setVoices((prev) => [newCustomVoice, ...prev]);
      setSelectedVoiceId(cloneId);
    } else {
      setSelectedVoiceId(cloneId);
    }

    // 3. Switch view to Persona Studio
    setActiveTab("studio");
  };

  // Quick clone persona directly to user's active roster
  const handleClonePersonaToVoices = (persona: VoicePersona) => {
    const cloneId = `clone-${persona.id}`;
    if (voices.some((v) => v.id === cloneId)) return;

    const newCustomVoice: CustomVoice = {
      id: cloneId,
      name: persona.name,
      type: "cloned",
      gender: persona.gender,
      suggestedVoiceName: persona.voiceProfile.suggestedVoiceName,
      clonedPersonaPrompt: persona.voiceProfile.clonedPersonaPrompt,
      analysis: {
        pitch: persona.voiceProfile.pitch,
        speed: persona.voiceProfile.speed,
        tone: persona.voiceProfile.tone,
        accent: persona.voiceProfile.accent,
        vibe: persona.voiceProfile.vibe,
        description: `${persona.description} (${persona.professionalBackground})`,
        suggestedVoiceName: persona.voiceProfile.suggestedVoiceName,
        clonedPersonaPrompt: persona.voiceProfile.clonedPersonaPrompt
      },
      isCustom: true
    };
    setVoices((prev) => [newCustomVoice, ...prev]);
  };

  // Preset loading trigger
  const applyPreset = (preset: typeof WORKFLOW_PRESETS[0]) => {
    setScriptText(preset.text);
    setPitch(preset.pitch);
    setSpeed(preset.speed);
    setTone(preset.tone);
    setAccent(preset.accent);
    setCustomStyle(preset.style);
    
    // Attempt to select the default prebuilt voice
    const found = voices.find((v) => v.id === preset.defaultVoice);
    if (found) setSelectedVoiceId(found.id);
  };

  // Copy audio shareable link
  const [copiedClipId, setCopiedClipId] = useState<string | null>(null);
  const copyShareLink = (clipId: string) => {
    const fakeLink = `${window.location.origin}/share/audio/${clipId}`;
    navigator.clipboard.writeText(fakeLink);
    setCopiedClipId(clipId);
    setTimeout(() => setCopiedClipId(null), 2000);
  };

  // Convert raw text using Express server TTS with styles
  const generateSingleClip = async (overrideText?: string | any, overrideVoiceId?: string) => {
    const textToSynthesize = typeof overrideText === "string" ? overrideText : scriptText;
    if (!textToSynthesize || !textToSynthesize.trim()) return;
    setIsSynthesizing(true);
    setSynthesizeError(null);

    // Find currently selected voice profile configuration
    const activeVoiceId = overrideVoiceId || selectedVoiceId;
    const activeVoice = voices.find((v) => v.id === activeVoiceId) || voices[0];
    const finalVoiceName = activeVoice.suggestedVoiceName;

    // Package styles
    const customConfig: CustomConfig = {
      pitch,
      speed,
      tone,
      accent,
      customStyle: `${customStyle} | Texture scale: ${textureSlider}% crispness.`
    };

    // If we have an override voice, load its parameters if they exist to match the voice
    if (overrideVoiceId && activeVoice.type === "cloned" && activeVoice.analysis) {
      customConfig.pitch = activeVoice.analysis.pitch;
      customConfig.speed = activeVoice.analysis.speed;
      customConfig.tone = activeVoice.analysis.tone;
      customConfig.accent = activeVoice.analysis.accent;
    }

    // If it's a cloned voice, prepend the model prompt override
    if (activeVoice.type === "cloned" && activeVoice.clonedPersonaPrompt) {
      customConfig.customStyle = `${activeVoice.clonedPersonaPrompt} ${customConfig.customStyle}`;
    }

    try {
      const response = await fetch("/api/voice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSynthesize,
          voiceName: finalVoiceName,
          customConfig
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "TTS synthesis failed");
      }

      // Convert raw PCM bytes to WAV Blob URL
      const wavUrl = pcmToWav(data.audio);
      
      setCurrentAudioUrl(wavUrl);
      setIsPlaying(true);

      const newClip: GeneratedClip = {
        id: `clip-${Date.now()}`,
        title: overrideVoiceId ? `Test Run (${activeVoice.name.split(" ")[0]})` : `Single Synthesis (${activeVoice.name.split(" ")[0]})`,
        text: textToSynthesize,
        voiceName: activeVoice.name,
        audioUrl: wavUrl,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        duration: `${Math.round(textToSynthesize.length / 15)}s`,
        type: "single"
      };

      setClipsHistory((prev) => [newClip, ...prev]);
    } catch (err: any) {
      console.error(err);
      setSynthesizeError(err.message || "Failed to contact voice generation service. Check API configuration.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Synthesize full multi-speaker script dialogue
  const generateDialogueClip = async () => {
    setIsSynthesizing(true);
    setSynthesizeError(null);

    // Map each speaker line to server payload, seamlessly embedding cloned voice persona styles
    const scriptLinesPayload = dialogueScript.map((line) => {
      const lineVoice = voices.find((v) => v.id === line.voiceId) || voices[0];
      
      let finalStyle = line.style;
      if (lineVoice.type === "cloned" && lineVoice.clonedPersonaPrompt) {
        if (finalStyle) {
          finalStyle = `${lineVoice.clonedPersonaPrompt} Rendered in a ${finalStyle} tone.`;
        } else {
          finalStyle = lineVoice.clonedPersonaPrompt;
        }
      }
      
      return {
        speaker: line.speaker,
        text: line.text,
        voiceName: lineVoice.suggestedVoiceName,
        style: finalStyle
      };
    });

    try {
      const response = await fetch("/api/voice/dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptLines: scriptLinesPayload })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Dialogue synthesis failed");
      }

      const wavUrl = pcmToWav(data.audio);
      setCurrentAudioUrl(wavUrl);
      setIsPlaying(true);

      const combinedText = dialogueScript.map((l) => `${l.speaker}: ${l.text}`).join("\n");
      const newClip: GeneratedClip = {
        id: `clip-${Date.now()}`,
        title: `Dialogue Interactive Call Mockup`,
        text: combinedText,
        voiceName: `${dialogueScript.length} Speakers Mixed`,
        audioUrl: wavUrl,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        duration: `${Math.round(combinedText.length / 15)}s`,
        type: "dialogue"
      };

      setClipsHistory((prev) => [newClip, ...prev]);
    } catch (err: any) {
      console.error(err);
      setSynthesizeError(err.message || "Failed to compile dialogue audio stream.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Playback handlers
  const handleTogglePlay = () => {
    if (!mainAudioRef.current || !currentAudioUrl) return;
    if (isPlaying) {
      mainAudioRef.current.pause();
      setIsPlaying(false);
    } else {
      mainAudioRef.current.play();
      setIsPlaying(true);
    }
  };

  const playHistoricalClip = (clip: GeneratedClip) => {
    setCurrentAudioUrl(clip.audioUrl);
    setCurrentPlayingClipId(clip.id);
    setIsPlaying(true);
  };

  const toggleSelectClip = (clipId: string) => {
    setSelectedClipIds((prev) =>
      prev.includes(clipId) ? prev.filter((id) => id !== clipId) : [...prev, clipId]
    );
  };

  const toggleSelectAllClips = () => {
    if (selectedClipIds.length === clipsHistory.length) {
      setSelectedClipIds([]);
    } else {
      setSelectedClipIds(clipsHistory.map((c) => c.id));
    }
  };

  const handleBatchDownload = async () => {
    if (selectedClipIds.length === 0) return;
    setIsZipping(true);
    setZipError(null);

    try {
      const zip = new JSZip();
      const titleCounts: Record<string, number> = {};

      for (const id of selectedClipIds) {
        const clip = clipsHistory.find((c) => c.id === id);
        if (!clip) continue;

        try {
          const response = await fetch(clip.audioUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const blob = await response.blob();

          let safeTitle = clip.title.replace(/[^a-zA-Z0-9_\-]/g, "_");
          if (!safeTitle) safeTitle = "vox_clip";

          if (titleCounts[safeTitle] !== undefined) {
            titleCounts[safeTitle]++;
            safeTitle = `${safeTitle}_${titleCounts[safeTitle]}`;
          } else {
            titleCounts[safeTitle] = 0;
          }

          zip.file(`${safeTitle}.wav`, blob);
        } catch (fetchErr) {
          console.error(`Failed to download audio for clip "${clip.title}":`, fetchErr);
          throw new Error(`Could not fetch audio for clip "${clip.title}". Ensure the audio has synthesized successfully.`);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vox-clips-batch-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      setZipError(err.message || "An error occurred while building your ZIP file.");
    } finally {
      setIsZipping(false);
    }
  };

  // Synchronize selection state when clips are deleted from history
  useEffect(() => {
    const existingIds = new Set(clipsHistory.map((c) => c.id));
    setSelectedClipIds((prev) => prev.filter((id) => existingIds.has(id)));
  }, [clipsHistory]);

  // ==========================================
  // Cyber-Biometric Intelligence Suite Handlers
  // ==========================================

  // 1. Generate security dossier via Pro engine (thinking level HIGH)
  const generateIntelDossier = async () => {
    setIsGeneratingDossier(true);
    setSynthesizeError(null);
    const activeVoice = voices.find((v) => v.id === intelVoiceId) || voices[0];
    
    // Extract properties
    const name = activeVoice.name;
    const isCloned = activeVoice.type === "cloned";
    const vibe = isCloned ? activeVoice.analysis?.vibe : "Standard Prebuilt Archetype";
    const accentVal = isCloned ? activeVoice.analysis?.accent : "General Neutral";
    const pitchVal = isCloned ? activeVoice.analysis?.pitch : "Standard Balance";
    const speedVal = isCloned ? activeVoice.analysis?.speed : "Moderate";
    const toneVal = isCloned ? activeVoice.analysis?.tone : "Professional";

    try {
      const response = await fetch("/api/intel/generate-dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceName: name,
          vibe,
          accent: accentVal,
          pitch: pitchVal,
          speed: speedVal,
          tone: toneVal
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to compile biometric dossier");
      }

      setDossier(data.dossier);
      
      // Auto hydrate chat history with agent intro
      setIntelChatHistory([
        { role: "model", text: `[DOSSIER PROFILE SYNCED]: Interface open for ${data.dossier.realName} (Codename: ${data.dossier.codename}). Clearance: ${data.dossier.clearance}. Threat level: ${data.dossier.threatRating}. Input prompt parameters or state operational questions.` }
      ]);
    } catch (err: any) {
      console.error(err);
      setSynthesizeError(err.message || "Failed to contact Intelligence suite services.");
    } finally {
      setIsGeneratingDossier(false);
    }
  };

  // 2. Chat Proxy
  const sendIntelChatMessage = async () => {
    if (!intelChatInput.trim() || isChatSending) return;
    
    const userMsg = intelChatInput.trim();
    setIntelChatInput("");
    
    const updatedHistory = [...intelChatHistory, { role: "user" as const, text: userMsg }];
    setIntelChatHistory(updatedHistory);
    setIsChatSending(true);

    // Set custom system instruction
    let systemInstruction = "You are a professional biometrics security officer. Speak formally.";
    if (dossier) {
      systemInstruction = `You are roleplaying as the security persona described in this dossier. Speak in alignment with these characteristics:
- Real Name: ${dossier.realName}
- Codename: ${dossier.codename}
- Clearance: ${dossier.clearance}
- Threat Rating: ${dossier.threatRating}
- Vulnerability risk: ${dossier.riskAnalysis}
- Tone and Vibe: Keep your answers authentic, immersive, and brief. Always start your response with "[${dossier.realName} (${dossier.codename})]: "`;
    }

    try {
      const response = await fetch("/api/intel/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: updatedHistory.slice(0, -1), // History excluding the latest message
          systemInstruction,
          latestMessage: userMsg
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to get chat response");
      }

      setIntelChatHistory((prev) => [...prev, { role: "model", text: data.text }]);
    } catch (err: any) {
      console.error(err);
      setIntelChatHistory((prev) => [...prev, { role: "model", text: `[SESSION INTERRUPT]: System connection timed out. Telemetry backup active. Error details: ${err.message || "Unknown API failure"}` }]);
    } finally {
      setIsChatSending(false);
    }
  };

  // 3. Transcription Handler
  const handleTranscribeAudio = async (base64Audio: string, mimeType?: string) => {
    setIsTranscribing(true);
    try {
      const response = await fetch("/api/intel/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64Audio, mimeType })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Transcription engine error");
      }

      setTranscriptionText(data.text);
    } catch (err: any) {
      console.error(err);
      setTranscriptionText(`[TRANSCRIPTION ERROR]: Failed to decode voice stream. Detail: ${err.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  // 4. Biometric Spectrograph Scan
  const handleAnalyzeCredential = async (base64Image: string) => {
    setIsAnalyzingSpectrograph(true);
    try {
      const response = await fetch("/api/intel/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Image analysis service failed");
      }

      setSpectrographAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      setSynthesizeError(`Credential Scan Failed: ${err.message}`);
    } finally {
      setIsAnalyzingSpectrograph(false);
    }
  };

  // 5. Maps ground tracking
  const handleMapsLookup = async () => {
    if (!mapsQuery.trim()) return;
    setIsMapping(true);
    setMapsResult("");
    try {
      const response = await fetch("/api/intel/maps-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: mapsQuery.trim() })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Geographical grounding failed");
      }

      setMapsResult(data.text);
    } catch (err: any) {
      console.error(err);
      setMapsResult(`[SPATIAL ERROR]: Connection to GIS satellite failed: ${err.message}`);
    } finally {
      setIsMapping(false);
    }
  };

  // 6. Pre-filled Cloned Voice Narrative synthesiser
  const handleSynthesizeNarrative = async (script: string, narrativeType: string) => {
    setIsSynthesizing(true);
    setSynthesizeError(null);
    const activeVoice = voices.find((v) => v.id === intelVoiceId) || voices[0];
    
    // Map properties matching the active voice
    const finalVoiceName = activeVoice.suggestedVoiceName || "Zephyr";
    const isCloned = activeVoice.type === "cloned";
    
    const customConfig: CustomConfig = {
      pitch: isCloned ? activeVoice.analysis?.pitch || "balanced" : "balanced",
      speed: isCloned ? activeVoice.analysis?.speed || "moderate" : "moderate",
      tone: isCloned ? activeVoice.analysis?.tone || "professional" : "professional",
      accent: isCloned ? activeVoice.analysis?.accent || "standard" : "standard",
      customStyle: `Authentic secure clone rendering. Voice model archetype: ${isCloned ? activeVoice.analysis?.vibe : "Standard"}`
    };

    if (isCloned && activeVoice.clonedPersonaPrompt) {
      customConfig.customStyle = `${activeVoice.clonedPersonaPrompt} ${customConfig.customStyle}`;
    }

    try {
      const response = await fetch("/api/voice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: script,
          voiceName: finalVoiceName,
          customConfig
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Dossier synthesis fail");
      }

      const wavUrl = pcmToWav(data.audio);
      setCurrentAudioUrl(wavUrl);
      setIsPlaying(true);

      const newClip: GeneratedClip = {
        id: `clip-${Date.now()}`,
        title: `Cloned Narrative (${narrativeType})`,
        text: script,
        voiceName: activeVoice.name,
        audioUrl: wavUrl,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        duration: `${Math.round(script.length / 15)}s`,
        type: "single"
      };

      setClipsHistory((prev) => [newClip, ...prev]);
    } catch (err: any) {
      console.error(err);
      setSynthesizeError(`Narrative Synthesis Failed: ${err.message}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Clean up audio urls when unmounted
  useEffect(() => {
    return () => {
      clipsHistory.forEach((clip) => {
        if (clip.audioUrl.startsWith("blob:")) {
          URL.revokeObjectURL(clip.audioUrl);
        }
      });
    };
  }, []);

  // Sync acoustic tone controls with the selected voice's properties seamlessly
  useEffect(() => {
    const activeVoice = voices.find((v) => v.id === selectedVoiceId);
    if (activeVoice) {
      if (activeVoice.type === "cloned" && activeVoice.analysis) {
        setPitch(activeVoice.analysis.pitch);
        setSpeed(activeVoice.analysis.speed);
        setTone(activeVoice.analysis.tone);
        setAccent(activeVoice.analysis.accent);
        setCustomStyle(`Vibe: ${activeVoice.analysis.vibe}. ${activeVoice.analysis.clonedPersonaPrompt}`);
      } else {
        // Safe resets for prebuilt voices to align the sliders cohesively
        if (activeVoice.id === "zephyr") {
          setPitch("Medium and balanced");
          setSpeed("Moderate (1.00x)");
          setTone("Professional and confident");
          setAccent("Neutral Standard American");
          setCustomStyle("");
        } else if (activeVoice.id === "kore") {
          setPitch("Slightly high-pitched");
          setSpeed("Energetic (1.15x)");
          setTone("Bright and bubbly");
          setAccent("Neutral Standard American");
          setCustomStyle("");
        } else if (activeVoice.id === "puck") {
          setPitch("Medium and balanced");
          setSpeed("Moderate (1.00x)");
          setTone("Warm and friendly");
          setAccent("Neutral Standard American");
          setCustomStyle("");
        } else if (activeVoice.id === "charon" || activeVoice.id === "fenrir") {
          setPitch("Deep and resonant");
          setSpeed("Calm and measured (0.85x)");
          setTone("Authoritative and serious");
          setAccent("Neutral Standard American");
          setCustomStyle("");
        }
      }
    }
  }, [selectedVoiceId, voices]);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-sans text-[#1A1A1A] overflow-hidden" id="app-root">
      
      {/* 1. Security & Compliance Authorization Gate Backdrop */}
      {showAuthGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4" id="authorization-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 border border-slate-100 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-black" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Vocal Security & Compliance</h2>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono uppercase font-semibold">Authorized Penetration Test Mode</span>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-600 leading-relaxed mb-6">
              <p>
                Welcome to <strong>VOX.AIO</strong>, an industry-grade deep vocal synthesis and voice simulation toolkit designed for content creators, accessible iOS/Android content production, and authorized banking agents.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <p className="font-semibold text-slate-800">🔒 Safe Use Mandates & Protocols:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Hashed Event Logs:</strong> No passwords or personal credentials are harvested. All synthesized content is tracked for educational compliance.</li>
                  <li><strong>Target Device Simulation:</strong> Experience exact acoustic presence metrics on iPhone, Android, and narrow-band phone lines.</li>
                  <li><strong>Authorization Gate:</strong> Real-world cloning must only proceed under explicit mutual corporate authorization.</li>
                </ul>
              </div>
              <p className="font-medium text-slate-800">
                Do you have written authorization from your organization and the voice owner to conduct this simulation?
              </p>
            </div>

            <div className="flex gap-4 justify-end">
              <button
                onClick={() => {
                  setIsAuthorized(false);
                  alert("Simulation aborted. Safe educational tutorials remain accessible.");
                }}
                className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm font-medium transition cursor-pointer"
              >
                No, Abort
              </button>
              <button
                onClick={() => {
                  setIsAuthorized(true);
                  setShowAuthGate(false);
                }}
                className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-slate-900 text-sm font-medium transition shadow-sm cursor-pointer"
                id="btn-confirm-authorized"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Application Interface */}
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0" id="app-sidebar">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-full"></div>
            </div>
            <span className="font-bold tracking-tight text-xl">VOX.AIO</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono uppercase mt-1 tracking-wider">Acoustic Engineering</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3 px-2">Creation Lab</div>
          
          <button
            onClick={() => setActiveTab("personas")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "personas"
                ? "bg-gray-100 text-black shadow-xs font-semibold"
                : "text-gray-500 hover:bg-gray-50"
            }`}
            id="nav-tab-personas"
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-sky-600" />
              <span>Persona Library</span>
            </div>
            <span className="text-[10px] bg-sky-100 text-sky-800 font-mono font-bold px-1.5 py-0.5 rounded-full">
              {VOICE_PERSONAS.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("studio")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "studio"
                ? "bg-gray-100 text-black shadow-xs"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            Persona Studio
          </button>

          <button
            onClick={() => setActiveTab("cloner")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "cloner"
                ? "bg-gray-100 text-black shadow-xs"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Mic className="w-4 h-4 text-emerald-600" />
            Vocal Cloner
          </button>

          <button
            onClick={() => setActiveTab("banking")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "banking"
                ? "bg-gray-100 text-black shadow-xs"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Layers className="w-4 h-4 text-amber-500" />
            Interactive Script Lab
          </button>

          <button
            onClick={() => setActiveTab("intel")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "intel"
                ? "bg-gray-100 text-black shadow-xs"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Brain className="w-4 h-4 text-violet-500" />
            Agent Intelligence Console
          </button>

          <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-8 mb-3 px-2">Prebuilt Scenarios</div>
          <div className="space-y-1.5 px-2">
            <span className="text-[11px] text-slate-500 font-medium block">Social Media Creator presets:</span>
            <button
              onClick={() => {
                setActiveTab("studio");
                applyPreset(WORKFLOW_PRESETS[2]);
              }}
              className="w-full text-left text-xs text-slate-600 hover:text-black hover:bg-slate-50 p-1.5 rounded transition truncate"
            >
              TikTok Viral Review
            </button>
            <button
              onClick={() => {
                setActiveTab("studio");
                applyPreset(WORKFLOW_PRESETS[3]);
              }}
              className="w-full text-left text-xs text-slate-600 hover:text-black hover:bg-slate-50 p-1.5 rounded transition truncate"
            >
              Tech Podcast Intro
            </button>

            <span className="text-[11px] text-slate-500 font-medium block pt-3">Banking Agent presets:</span>
            <button
              onClick={() => {
                setActiveTab("studio");
                applyPreset(WORKFLOW_PRESETS[0]);
              }}
              className="w-full text-left text-xs text-slate-600 hover:text-black hover:bg-slate-50 p-1.5 rounded transition truncate"
            >
              Security Fraud Alarm
            </button>
            <button
              onClick={() => {
                setActiveTab("studio");
                applyPreset(WORKFLOW_PRESETS[1]);
              }}
              className="w-full text-left text-xs text-slate-600 hover:text-black hover:bg-slate-50 p-1.5 rounded transition truncate"
            >
              Elite Wealth Wealth Welcome
            </button>
          </div>
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-900 rounded-xl p-4 text-white">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-xs text-slate-400">Current active model</p>
            </div>
            <p className="text-xs font-mono font-semibold truncate text-blue-300">gemini-3.1-flash-tts</p>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-3">
              <div className="bg-blue-400 h-1 w-full rounded-full"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <main className="flex-1 flex flex-col min-w-0" id="main-content-area">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold tracking-tight">
              {activeTab === "personas" && "Global Voice Persona Library"}
              {activeTab === "studio" && "Sophisticated Persona Studio"}
              {activeTab === "cloner" && "Vocal Analysis & Cloning Pipeline"}
              {activeTab === "banking" && "Interactive Multi-Speaker Dialogue Lab"}
              {activeTab === "intel" && "Cyber-Biometric Intelligence Console"}
            </h1>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wider">
              Gemini High Fidelity
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                alert("Workspace parameters successfully saved to cloud cache.");
              }}
              className="px-4 py-2 text-xs border border-gray-200 hover:bg-slate-50 rounded-lg font-medium bg-white transition cursor-pointer"
            >
              Save Parameters
            </button>
            <button
              onClick={() => {
                if (!currentAudioUrl) {
                  alert("Please generate or synthesize a clip first.");
                  return;
                }
                const a = document.createElement("a");
                a.href = currentAudioUrl;
                a.download = `vox-cloned-clip-${Date.now()}.wav`;
                a.click();
              }}
              className="px-4 py-2 text-xs bg-black hover:bg-slate-900 text-white rounded-lg font-medium transition shadow-sm cursor-pointer"
            >
              Export Clip (.WAV)
            </button>
          </div>
        </header>

        {/* Content Area Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-32">
          
          {synthesizeError && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3 text-rose-700 text-sm items-start" id="api-error-alert">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Synthesis Pipeline Incident:</span>
                <p className="mt-0.5 text-xs text-rose-600">{synthesizeError}</p>
                <button
                  onClick={() => setSynthesizeError(null)}
                  className="mt-2 text-xs underline text-rose-800 font-semibold cursor-pointer block"
                >
                  Acknowledge & Dismiss
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: Persona Studio */}
          {activeTab === "studio" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="tab-studio-layout">
              
              {/* Left Form: Script, Tone controls */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Persona Library Quick Launcher */}
                <div className="bg-gradient-to-r from-sky-50/90 to-indigo-50/40 border border-sky-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Explore Voice Persona Archetypes</h3>
                      <p className="text-[11px] text-slate-500">
                        Select from {VOICE_PERSONAS.length} global personas across 6 disciplines as an acoustic starting point.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("personas")}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 shadow-xs"
                    id="btn-browse-persona-library"
                  >
                    <Sliders className="w-3.5 h-3.5 text-sky-400" />
                    <span>Browse {VOICE_PERSONAS.length} Personas</span>
                  </button>
                </div>

                {/* Script input card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[11px] uppercase tracking-widest text-gray-400 font-bold block">
                      Script Input Text
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {scriptText.length} characters • ~{Math.ceil(scriptText.length / 15)}s dynamic play
                    </span>
                  </div>

                  <textarea
                    className="w-full h-44 bg-gray-50 border-0 focus:outline-none focus:ring-0 p-4 rounded-xl text-base text-slate-700 leading-relaxed font-sans placeholder-slate-400"
                    placeholder="Enter realistic text content for your banking agent greeting or social media post script..."
                    value={scriptText}
                    onChange={(e) => setScriptText(e.target.value)}
                  />

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setScriptText("")}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] rounded transition cursor-pointer"
                    >
                      Clear Script
                    </button>
                    {WORKFLOW_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => applyPreset(preset)}
                        className="px-2.5 py-1 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/30 text-indigo-700 text-[10px] rounded transition cursor-pointer font-medium"
                      >
                        {preset.label.split(" ").slice(1).join(" ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pre-installed metrics cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700">Creator Sync ready</span>
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    </div>
                    <span className="text-lg font-bold text-indigo-900 block mt-1">1:1 & 9:16</span>
                    <span className="text-[10px] text-gray-400 mt-1">TikTok/Reels format aligned</span>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700">Banking Certified</span>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <span className="text-lg font-bold text-emerald-900 block mt-1">Anonymized logs</span>
                    <span className="text-[10px] text-gray-400 mt-1">GDPR & CCPA SHA-256 secure</span>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700">Mobile Cross-Sync</span>
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    </div>
                    <span className="text-lg font-bold text-amber-900 block mt-1">iOS & Android</span>
                    <span className="text-[10px] text-gray-400 mt-1">Instant sound board render</span>
                  </div>
                </div>

                {/* Synthesis Button trigger */}
                <div className="flex gap-4">
                  <button
                    onClick={generateSingleClip}
                    disabled={isSynthesizing || !scriptText.trim()}
                    className="flex-1 py-4 bg-black hover:bg-slate-900 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
                    id="btn-synthesize-single"
                  >
                    {isSynthesizing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Synthesizing Deep Audio...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-indigo-400" /> Synthesize Custom Persona
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Form: Slider panel custom parameters */}
              <div className="lg:col-span-5 space-y-6">
                
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 text-sm">Acoustic Tone Designer</h3>
                    <Sparkle className="w-4 h-4 text-indigo-600" />
                  </div>

                  <div className="space-y-5 flex-1">
                    {/* Active Voice Selection */}
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-2">
                        Vocal Identity Profile
                      </label>
                      <select
                        value={selectedVoiceId}
                        onChange={(e) => setSelectedVoiceId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500 transition font-medium"
                      >
                        {voices.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.type === "cloned" ? "🧬 " : "🔊 "}
                            {v.name} ({v.gender})
                          </option>
                        ))}
                      </select>
                      <div className="mt-1.5 flex justify-between items-center px-1">
                        <span className="text-[10px] text-slate-400">
                          Baseline:{" "}
                          {voices.find((v) => v.id === selectedVoiceId)?.suggestedVoiceName}
                        </span>
                        <button
                          onClick={() => setActiveTab("cloner")}
                          className="text-[10px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                        >
                          + Clone New Voice Sample
                        </button>
                      </div>
                    </div>

                    {/* Parameter: Texture Breathy vs Crisp */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5 text-gray-500">
                        <span className="font-medium">TEXTURE (BREATHY vs. CRISP)</span>
                        <span className="font-mono text-black font-semibold">{textureSlider}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={textureSlider}
                        onChange={(e) => setTextureSlider(Number(e.target.value))}
                        className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-black"
                      />
                    </div>

                    {/* Sliders styled input select */}
                    <div className="grid grid-cols-2 gap-3.5 pt-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
                          Pitch Tone
                        </label>
                        <select
                          value={pitch}
                          onChange={(e) => setPitch(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none h-[32px]"
                        >
                          <option value="Deep and resonant">Deep and Resonant</option>
                          <option value="Medium and balanced">Medium Baritone</option>
                          <option value="Slightly high-pitched">Light Soprano</option>
                          <option value="Soft and breathy">Whisper / Soft</option>
                          {!["Deep and resonant", "Medium and balanced", "Slightly high-pitched", "Soft and breathy"].includes(pitch) && (
                            <option value={pitch}>{pitch}</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
                          Cadence Pace
                        </label>
                        <select
                          value={speed}
                          onChange={(e) => setSpeed(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none h-[32px]"
                        >
                          <option value="Calm and measured (0.85x)">Measured (0.85x)</option>
                          <option value="Moderate (1.00x)">Moderate (1.00x)</option>
                          <option value="Energetic (1.15x)">Rapid Hook (1.15x)</option>
                          <option value="Very fast (1.30x)">Speed Run (1.30x)</option>
                          {!["Calm and measured (0.85x)", "Moderate (1.00x)", "Energetic (1.15x)", "Very fast (1.30x)"].includes(speed) && (
                            <option value={speed}>{speed}</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
                          Emotional Vibe
                        </label>
                        <select
                          value={tone}
                          onChange={(e) => setTone(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none h-[32px]"
                        >
                          <option value="Professional and confident">Empathetic Banking</option>
                          <option value="Bright and bubbly">Enthusiastic Creator</option>
                          <option value="Authoritative and serious">Secure Hotline</option>
                          <option value="Warm and friendly">Customer Support</option>
                          {!["Professional and confident", "Bright and bubbly", "Authoritative and serious", "Warm and friendly"].includes(tone) && (
                            <option value={tone}>{tone}</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
                          Speech Accent
                        </label>
                        <select
                          value={accent}
                          onChange={(e) => setAccent(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none h-[32px]"
                        >
                          <option value="Neutral Standard American">Neutral US</option>
                          <option value="Slight British RP Accent">Slight British</option>
                          <option value="Mid-Atlantic Professional">Mid-Atlantic</option>
                          <option value="Global Conversational Accent">Global English</option>
                          {!["Neutral Standard American", "Slight British RP Accent", "Mid-Atlantic Professional", "Global Conversational Accent"].includes(accent) && (
                            <option value={accent}>{accent}</option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                        Specific Synthesis Prompt Prefix (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none placeholder-slate-400"
                        placeholder="e.g. say with dynamic dramatic voice..."
                        value={customStyle}
                        onChange={(e) => setCustomStyle(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Cloned Voices Registry Card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span className="text-indigo-600">🧬</span>
                      My Cloned Voices Registry
                    </h3>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold font-mono">
                      {voices.filter((v) => v.type === "cloned").length} Saved
                    </span>
                  </div>

                  {voices.filter((v) => v.type === "cloned").length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center text-slate-400">
                      <p className="text-xs font-semibold">No voice clones available yet</p>
                      <p className="text-[11px] text-slate-400 mt-1 mb-4">
                        Record or upload a voice sample to clone your first custom speaker persona.
                      </p>
                      <button
                        onClick={() => setActiveTab("cloner")}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        + Open Vocal Cloner Pipeline
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {voices
                        .filter((v) => v.type === "cloned")
                        .map((v) => (
                          <div
                            key={v.id}
                            className="p-3 border border-slate-100 bg-slate-50/55 rounded-xl text-xs space-y-2 relative"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 flex items-center gap-1">
                                👤 {v.name}
                              </span>
                              <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-slate-500 uppercase">
                                {v.gender}
                              </span>
                            </div>

                            {v.analysis && (
                              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 font-mono">
                                <span className="truncate">🎯 {v.analysis.pitch}</span>
                                <span className="truncate">⚡ {v.analysis.speed}</span>
                                <span className="truncate">🔊 {v.analysis.accent}</span>
                                <span className="truncate">🎭 {v.analysis.vibe.split(" ")[0]}</span>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100/60 mt-1">
                              <button
                                onClick={() => {
                                  setSelectedVoiceId(v.id);
                                  alert(`"${v.name}" loaded into Persona Studio with full acoustic configurations.`);
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md transition cursor-pointer flex-1 text-center"
                              >
                                Use in Studio
                              </button>

                              <button
                                onClick={() => setAssigningVoiceId(assigningVoiceId === v.id ? null : v.id)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer flex-1 text-center ${
                                  assigningVoiceId === v.id
                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                }`}
                              >
                                Use as Dialogue Speaker
                              </button>

                              <button
                                onClick={() =>
                                  generateSingleClip(
                                    `Hello! This is a dynamic, high-fidelity acoustic test run of my newly cloned voice profile. Does this sound like a true match?`,
                                    v.id
                                  )
                                }
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md transition cursor-pointer"
                                title="Run custom test TTS"
                                disabled={isSynthesizing}
                              >
                                ⚡ Test Run
                              </button>
                            </div>

                            {/* Dropdown for quick assigning voice to dialog turns */}
                            {assigningVoiceId === v.id && (
                              <div className="mt-2 bg-white border border-slate-200 rounded-lg p-2 space-y-1 shadow-sm">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">
                                  Assign "{v.name}" to:
                                </span>
                                {dialogueScript.map((line, idx) => (
                                  <button
                                    key={line.id}
                                    onClick={() => {
                                      const updated = [...dialogueScript];
                                      updated[idx].voiceId = v.id;
                                      setDialogueScript(updated);
                                      setAssigningVoiceId(null);
                                      setActiveTab("banking");
                                    }}
                                    className="w-full text-left px-2.5 py-1 hover:bg-slate-50 text-[11px] font-medium text-slate-600 rounded transition flex justify-between items-center"
                                  >
                                    <span>Line {idx + 1} ({line.speaker})</span>
                                    <span className="text-[9px] text-indigo-600 font-bold">Assign</span>
                                  </button>
                                ))}
                                <button
                                  onClick={() => {
                                    const id = `line-${Date.now()}`;
                                    setDialogueScript([
                                      ...dialogueScript,
                                      {
                                        id,
                                        speaker: v.name.split(" ")[0],
                                        text: "This is a new line spoken seamlessly by my cloned voice profile.",
                                        voiceId: v.id,
                                        style: "calm"
                                      }
                                    ]);
                                    setAssigningVoiceId(null);
                                    setActiveTab("banking");
                                  }}
                                  className="w-full text-left px-2.5 py-1 hover:bg-slate-50 text-[11px] font-bold text-indigo-600 rounded border-t border-slate-100 mt-1 transition"
                                >
                                  + Create New Dialogue Turn
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Target Device simulation selector */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
                  <h3 className="font-bold text-slate-800 text-sm mb-4">Target Device Reference Simulator</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Acoustically preview how your clips will render over actual mobile speaker transducers or legacy phone networks.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {TARGET_DEVICES.map((dev) => (
                      <button
                        key={dev.id}
                        onClick={() => setTargetDevice(dev.id)}
                        className={`p-3.5 text-left border rounded-xl transition cursor-pointer ${
                          targetDevice === dev.id
                            ? "bg-slate-900 text-white border-slate-950 shadow-xs"
                            : "bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-semibold">{dev.icon}</span>
                          <span className="text-xs font-bold truncate">{dev.name}</span>
                        </div>
                        <p className={`text-[9px] leading-normal ${targetDevice === dev.id ? "text-slate-300" : "text-slate-400"}`}>
                          {dev.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 0: Persona Library */}
          {activeTab === "personas" && (
            <div className="animate-fade-in" id="tab-personas-layout">
              <PersonaLibrary
                onSelectForCustomization={handleSelectPersonaForCustomization}
                onCloneToVoices={handleClonePersonaToVoices}
                onAssignToDialogue={(persona) => {
                  handleClonePersonaToVoices(persona);
                  const cloneId = `clone-${persona.id}`;
                  setDialogueScript((prev) => [
                    ...prev,
                    {
                      id: `line-${Date.now()}`,
                      speaker: persona.name.split(" ")[0],
                      text: persona.sampleQuote,
                      voiceId: cloneId,
                      style: persona.voiceProfile.tone
                    }
                  ]);
                  setActiveTab("banking");
                }}
                activeVoiceIds={voices.map((v) => v.id)}
              />
            </div>
          )}

          {/* TAB 2: Voice Cloner */}
          {activeTab === "cloner" && (
            <div className="animate-fade-in" id="tab-cloner-layout">
              <VoiceRecorder
                onVoiceCloned={handleVoiceCloned}
                onNavigateToLibrary={() => setActiveTab("personas")}
              />
            </div>
          )}

          {/* TAB 3: Dialogue Lab */}
          {activeTab === "banking" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6" id="tab-dialogue-layout">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  Dialogue Script Creator & Conversation Simulator
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Synthesize complete conversational scripts between multiple speakers (e.g., simulated phone banking calls, automated support agents, podcast hosts).
                </p>
              </div>

              {/* Simulated Scenario Quick Presets */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 max-w-4xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="text-indigo-600">⚡</span> Load Simulated Scenario Template
                  </span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">
                    Quick Sandbox Presets
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {DIALOGUE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setDialogueScript(preset.script);
                      }}
                      className="text-left p-3 bg-white border border-slate-100 hover:border-indigo-300 rounded-lg transition hover:shadow-xs cursor-pointer group"
                    >
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 transition truncate">
                        {preset.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dialogue script container */}
              <div className="space-y-4 max-w-4xl">
                {dialogueScript.map((line, index) => (
                  <div
                    key={line.id}
                    className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 relative group"
                  >
                    <div className="md:w-48 shrink-0 space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">Speaker</label>
                      <input
                        type="text"
                        value={line.speaker}
                        onChange={(e) => {
                          const updated = [...dialogueScript];
                          updated[index].speaker = e.target.value;
                          setDialogueScript(updated);
                        }}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-semibold text-slate-700"
                      />

                      <label className="text-[10px] font-bold text-slate-400 block uppercase pt-1">Voice Profile</label>
                      <select
                        value={line.voiceId}
                        onChange={(e) => {
                          const updated = [...dialogueScript];
                          updated[index].voiceId = e.target.value;
                          setDialogueScript(updated);
                        }}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-700"
                      >
                        {voices.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.type === "cloned" ? "🧬 " : "🔊 "}
                            {v.name} ({v.gender})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">Speech Content</label>
                      <textarea
                        value={line.text}
                        onChange={(e) => {
                          const updated = [...dialogueScript];
                          updated[index].text = e.target.value;
                          setDialogueScript(updated);
                        }}
                        className="w-full h-16 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded resize-none focus:outline-none"
                        placeholder="What should this speaker say?"
                      />
                    </div>

                    <div className="md:w-44 shrink-0 space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">Vocal Style / Tone Instruction</label>
                      <input
                        type="text"
                        value={line.style}
                        onChange={(e) => {
                          const updated = [...dialogueScript];
                          updated[index].style = e.target.value;
                          setDialogueScript(updated);
                        }}
                        className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded placeholder-slate-400"
                        placeholder="e.g. concerned, energetic, angry"
                      />
                      
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => {
                            if (dialogueScript.length <= 1) return;
                            const updated = dialogueScript.filter((_, i) => i !== index);
                            setDialogueScript(updated);
                          }}
                          className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Delete Turn
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 justify-between max-w-4xl pt-2">
                  <button
                    onClick={() => {
                      const id = `line-${Date.now()}`;
                      setDialogueScript([
                        ...dialogueScript,
                        {
                          id,
                          speaker: `Speaker ${dialogueScript.length + 1}`,
                          text: "And here is the responding dialogue transaction.",
                          voiceId: "kore",
                          style: "calm"
                        }
                      ]);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Dialogue turn
                  </button>

                  <button
                    onClick={generateDialogueClip}
                    disabled={isSynthesizing}
                    className="flex items-center gap-2 px-6 py-2.5 bg-black hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSynthesizing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing Dialogue...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-300" /> Synthesize Complete Audio Track
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Cyber-Biometric Intelligence Console */}
          {activeTab === "intel" && (
            <div className="space-y-8" id="tab-intel-layout">
              {/* Active Voice Selection & Initialize Banner */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
                  <Fingerprint className="w-96 h-96 text-slate-100" />
                </div>
                
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-7 space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-violet-500/20 text-violet-300 text-[10px] font-bold rounded uppercase tracking-wider border border-violet-500/30">
                      Biometric Security Authorization Active
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                      <Brain className="w-5 h-5 text-violet-400" /> Advanced Tactical Audio Suite
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                      Run deep security dossiers, multi-turn roleplaying sandboxes, transcribers, spatial GIS maps lookup, and visual spectrograph checks. Seamlessly trigger pre-filled voice scripts modeled 100% identically to active vocal clones.
                    </p>
                  </div>

                  <div className="md:col-span-5 bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                        Target Biometric Voice Register
                      </label>
                      <select
                        value={intelVoiceId}
                        onChange={(e) => {
                          setIntelVoiceId(e.target.value);
                          setDossier(null); // Reset when voice changes
                          setSpectrographAnalysis(null);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                      >
                        {voices.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.type === "cloned" ? "Custom Clone" : "System Preset"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={generateIntelDossier}
                      disabled={isGeneratingDossier}
                      className="w-full py-2 px-4 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingDossier ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Compiling Deep Intelligence Dossier...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" /> Generate Cyber Dossier & Persona (Thinking level: HIGH)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid: Dossier on Left, Multi-turn Chat on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left: Dossier Card */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm min-h-[400px] flex flex-col">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="w-5 h-5 text-violet-500" />
                        <h3 className="font-bold text-slate-800 text-sm">Security Profile & Dossier</h3>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono font-bold">
                        {dossier ? "SYNCED" : "AWAITING SYNC"}
                      </span>
                    </div>

                    {!dossier ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-slate-400">
                        <Activity className="w-10 h-10 text-slate-300 mb-3 animate-pulse" />
                        <p className="text-xs font-semibold">Dossier Engine Offline</p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                          Select a target biometric voice profile above and trigger the dossier generator to unlock customized security clearance intelligence.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6 pt-4 flex-1">
                        {/* Immersive biometric ID card header */}
                        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Identified Real Name</span>
                            <span className="font-bold text-slate-800 text-sm">{dossier.realName}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Operational Codename</span>
                            <span className="font-mono text-slate-800 text-xs font-bold">{dossier.codename}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Clearance Status</span>
                            <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded bg-violet-100 text-violet-800 text-[10px] font-bold">
                              <ShieldCheck className="w-3 h-3" /> {dossier.clearance}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Threat Evaluation</span>
                            <span className="font-mono font-bold text-xs text-rose-600 uppercase">{dossier.threatRating}</span>
                          </div>
                        </div>

                        {/* Detailed analysis grid */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Base frequency</span>
                            <span className="text-xs font-bold text-slate-700">
                              {dossier.biometricDetails?.baseFrequency || dossier.frequencyHz || "135 Hz"}
                            </span>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Vocal stability</span>
                            <span className="text-xs font-bold text-slate-700">
                              {dossier.biometricDetails?.modulationStability || dossier.voiceStability || "99.2% Uniform"}
                            </span>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Spoof resistance</span>
                            <span className="text-xs font-bold text-slate-700">
                              {dossier.biometricDetails?.mimicryResistance || dossier.spoofResistance || "94.5% Resistance"}
                            </span>
                          </div>
                        </div>

                        {/* Vulnerability Summary */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Biometric Vulnerability & Risk Analysis</span>
                          <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/40 border border-amber-100/50 p-3 rounded-xl">
                            {dossier.riskAnalysis}
                          </p>
                        </div>

                        {/* Pre-filled narratives - 100% Identical signature */}
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Pre-filled Vocal Script Drills</span>
                            <span className="text-[9px] font-bold text-emerald-600 uppercase">100% Acoustically Identical signature</span>
                          </div>

                          <div className="space-y-3">
                            {(Array.isArray(dossier.tacticalSimulationScripts)
                              ? dossier.tacticalSimulationScripts
                              : typeof dossier.tacticalSimulationScripts === "object" && dossier.tacticalSimulationScripts
                              ? [
                                  { type: "Secure Auth Drill", script: dossier.tacticalSimulationScripts.secureAuthDrill },
                                  { type: "Social Engineering Trap", script: dossier.tacticalSimulationScripts.socialEngineeringTrap },
                                  { type: "Brand Broadcast", script: dossier.tacticalSimulationScripts.brandBroadcast }
                                ].filter(item => item.script)
                              : []
                            ).map((item: any, i: number) => (
                              <div key={i} className="border border-slate-150 rounded-xl p-3 bg-white space-y-2 hover:border-slate-300 transition shadow-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-700 uppercase">
                                    {item.type}
                                  </span>
                                  <button
                                    onClick={() => handleSynthesizeNarrative(item.script, item.type)}
                                    disabled={isSynthesizing}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-black hover:bg-slate-900 text-white text-[10px] font-bold rounded transition disabled:opacity-50"
                                  >
                                    <Sparkles className="w-3 h-3 text-amber-300" /> Synthesize Drill
                                  </button>
                                </div>
                                <p className="text-xs text-slate-500 font-mono italic leading-relaxed">
                                  "{item.script}"
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Multi-turn Chat Console */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col h-[600px] text-white shadow-xl">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <div>
                          <h3 className="font-bold text-slate-100 text-xs font-mono">PERSONA SIMULATION MATRIX</h3>
                          <p className="text-[10px] text-slate-500 font-mono">Target: {dossier ? `${dossier.realName} (${dossier.codename})` : "Default Biometric Protocol"}</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                        ONLINE FEED
                      </span>
                    </div>

                    {/* Chat Messages View */}
                    <div className="flex-1 overflow-y-auto py-4 space-y-4 font-mono text-xs pr-1">
                      {intelChatHistory.map((msg, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg max-w-[90%] leading-relaxed ${
                            msg.role === "user"
                              ? "bg-slate-800 text-slate-100 ml-auto border border-slate-700"
                              : "bg-emerald-950/40 text-emerald-300 border border-emerald-900/60"
                          }`}
                        >
                          <span className="text-[9px] text-slate-400 block mb-1">
                            {msg.role === "user" ? "► OPERATOR" : "◄ BIOMETRIC SUBJECT"}
                          </span>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      ))}
                    </div>

                    {/* Chat Input form */}
                    <div className="pt-4 border-t border-slate-800 shrink-0 flex gap-2">
                      <input
                        type="text"
                        value={intelChatInput}
                        onChange={(e) => setIntelChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            sendIntelChatMessage();
                          }
                        }}
                        placeholder="Query target persona profile parameters..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 font-mono"
                      />
                      <button
                        onClick={sendIntelChatMessage}
                        disabled={isChatSending}
                        className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {isChatSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Section: Transcription, Spectrograph Scanner, Spatial GIS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Sub-Section 1: Audio Transcription Pipeline (Mic / File upload / Presets) */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm min-h-[420px] flex flex-col">
                    <div className="flex items-center gap-2 pb-4 border-b border-slate-100 shrink-0">
                      <Mic className="w-4 h-4 text-rose-500" />
                      <h3 className="font-bold text-slate-800 text-sm">Transcription Sandbox</h3>
                    </div>

                    <div className="space-y-4 pt-4 flex-1 flex flex-col">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Test speech understanding with any prebuilt audio preset, or drag and drop a custom voice register below to transcribe!
                      </p>

                      {/* Presets and file trigger */}
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Preloaded high-fidelity WAV samples</span>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            onClick={() => {
                              setTranscriptionText("[PARSING AUDIO] Please wait...");
                              handleTranscribeAudio("UklGRigAAABXQVZFZm10IBIAAAAHAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=", "audio/wav");
                            }}
                            className="w-full text-left bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200/50 text-xs text-slate-700 font-mono truncate"
                          >
                            📁 MFA Authorization Voice Note.wav
                          </button>
                          <button
                            onClick={() => {
                              setTranscriptionText("[PARSING AUDIO] Please wait...");
                              handleTranscribeAudio("UklGRigAAABXQVZFZm10IBIAAAAHAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=", "audio/wav");
                            }}
                            className="w-full text-left bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200/50 text-xs text-slate-700 font-mono truncate"
                          >
                            📁 Suspicious Banking Agent Prompt.wav
                          </button>
                        </div>
                      </div>

                      {/* Custom Audio File Upload */}
                      <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-slate-400 transition relative">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setTranscriptionText("[DECODING FILE STREAM] Uploaded waveform loaded...");
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const base64 = (reader.result as string).split(",")[1];
                                handleTranscribeAudio(base64, file.type);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Volume2 className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                        <p className="text-xs font-semibold text-slate-600">Upload Speech Register</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Drag & drop or browse .wav, .mp3, .ogg</p>
                      </div>

                      {/* Result Box */}
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex-1 flex flex-col min-h-[120px]">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                          TRANSCRIPTION OUTPUT
                        </span>
                        {isTranscribing ? (
                          <div className="flex-1 flex items-center justify-center text-slate-400 gap-1.5 text-xs font-mono">
                            <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> Transcribing audio signal...
                          </div>
                        ) : (
                          <p className="text-xs font-mono text-slate-700 leading-relaxed whitespace-pre-wrap flex-1 select-all">
                            {transcriptionText || "Awaiting file signal input or wave preset selection..."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-Section 2: Spectrograph Analyzer (Biometric Badge scan / visual waveforms) */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm min-h-[420px] flex flex-col">
                    <div className="flex items-center gap-2 pb-4 border-b border-slate-100 shrink-0">
                      <ImageIcon className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-bold text-slate-800 text-sm">Waveform Spectrograph Scanner</h3>
                    </div>

                    <div className="space-y-4 pt-4 flex-1 flex flex-col">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Verify spoof-resistance by scanning biometric spectrographs or identification credentials. Click any quick template below to execute:
                      </p>

                      {/* Clicking preloaded triggers handleAnalyzeCredential */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            setSpectrographImage("preloaded-stable");
                            handleAnalyzeCredential("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"); // Mock tiny GIF representing the stable sample
                          }}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold p-2 rounded-xl text-slate-700 text-center transition"
                        >
                          🟢 Stable Wave
                        </button>
                        <button
                          onClick={() => {
                            setSpectrographImage("preloaded-cloned");
                            handleAnalyzeCredential("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
                          }}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold p-2 rounded-xl text-slate-700 text-center transition"
                        >
                          🟡 Synthetic Voice
                        </button>
                        <button
                          onClick={() => {
                            setSpectrographImage("preloaded-mfa");
                            handleAnalyzeCredential("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
                          }}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold p-2 rounded-xl text-slate-700 text-center transition"
                        >
                          🔵 Smart MFA Badge
                        </button>
                      </div>

                      {/* Custom Upload */}
                      <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-slate-400 transition relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const base64 = (reader.result as string).split(",")[1];
                                setSpectrographImage(reader.result as string);
                                handleAnalyzeCredential(base64);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Volume2 className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                        <p className="text-xs font-semibold text-slate-600">Scan Waveform Image</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Drag & drop visual .png or .jpg</p>
                      </div>

                      {/* Display Scan results */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col justify-between min-h-[120px] text-slate-100 text-xs font-mono">
                        {isAnalyzingSpectrograph ? (
                          <div className="flex-1 flex items-center justify-center text-slate-400 gap-1.5 text-xs">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Launching Optical Scan...
                          </div>
                        ) : spectrographAnalysis ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Scan Verdict</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                spectrographAnalysis.biometricMatchConfidence.includes("9")
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}>
                                {spectrographAnalysis.biometricMatchConfidence} MATCH
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-bold block">Stability Check</span>
                              <p className="text-xs text-slate-200">{spectrographAnalysis.harmonicsSummary}</p>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-bold block">Security Action</span>
                              <p className="text-[11px] text-slate-300 leading-normal">{spectrographAnalysis.anomalyReport}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-slate-400 text-center">
                            Awaiting visual spectrograph scan triggers...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-Section 3: Geographic Jurisdiction Grounding (Google Maps Platform Grounding) */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm min-h-[420px] flex flex-col">
                    <div className="flex items-center gap-2 pb-4 border-b border-slate-100 shrink-0">
                      <MapPin className="w-4 h-4 text-violet-500" />
                      <h3 className="font-bold text-slate-800 text-sm">GIS Spatial Grounding</h3>
                    </div>

                    <div className="space-y-4 pt-4 flex-1 flex flex-col">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Verify regional compliance and operational zones by entering a coordinate, base, or city for instant GIS mapping!
                      </p>

                      {/* Map Location Presets */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => {
                            setMapsQuery("Fort Meade HQ Operations Base, Maryland");
                          }}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] rounded-lg text-slate-600 transition"
                        >
                          🏢 Fort Meade Base
                        </button>
                        <button
                          onClick={() => {
                            setMapsQuery("Federal Reserve Gold Vault, 33 Liberty St, NY");
                          }}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] rounded-lg text-slate-600 transition"
                        >
                          🏦 NY Fed Vault
                        </button>
                        <button
                          onClick={() => {
                            setMapsQuery("Silicon Valley Creator Hub, Sand Hill Rd, Palo Alto");
                          }}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] rounded-lg text-slate-600 transition"
                        >
                          📡 Sand Hill HQ
                        </button>
                      </div>

                      {/* Input Box */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={mapsQuery}
                          onChange={(e) => setMapsQuery(e.target.value)}
                          placeholder="Search address or tactical base..."
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                        />
                        <button
                          onClick={handleMapsLookup}
                          disabled={isMapping || !mapsQuery.trim()}
                          className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                        >
                          {isMapping ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* GIS outputs */}
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex-1 flex flex-col justify-between min-h-[120px] text-xs font-mono">
                        {isMapping ? (
                          <div className="flex-1 flex items-center justify-center text-slate-400 gap-1.5 text-xs">
                            <Loader2 className="w-4 h-4 animate-spin text-violet-500" /> Locating coordinates...
                          </div>
                        ) : mapsResult ? (
                          <div className="space-y-2 leading-relaxed text-slate-700">
                            <div className="flex items-center gap-1.5 font-bold text-violet-700 text-[10px] border-b border-slate-200 pb-1">
                              <MapPin className="w-3.5 h-3.5" /> GIS MAPS REAL-TIME GROUNDING
                            </div>
                            <p className="text-[11px] font-sans leading-relaxed">{mapsResult}</p>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-slate-400 text-center">
                            Enter a search query or click a preset to ground regional jurisdiction...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Historical Clips Grid */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5" id="clips-history-section">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Clips Generation Vault</h3>
                <p className="text-xs text-slate-500 mt-0.5">Recent high-fidelity renders, accessible across multiple simulator formats.</p>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono font-bold">
                {clipsHistory.length} files saved in local sandbox
              </span>
            </div>

            {clipsHistory.length === 0 ? (
              <div className="border border-dashed border-slate-150 rounded-xl py-10 text-center text-slate-400">
                <Volume2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No synthesized clips yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Create your first custom speech tone above to populate the vault.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Batch Actions Bar */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedClipIds.length === clipsHistory.length}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = selectedClipIds.length > 0 && selectedClipIds.length < clipsHistory.length;
                          }
                        }}
                        onChange={toggleSelectAllClips}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                      />
                      Select All
                    </label>
                    <span className="text-xs text-slate-500">
                      {selectedClipIds.length} of {clipsHistory.length} selected
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {zipError && (
                      <span className="text-xs text-rose-600 font-medium">
                        ⚠️ {zipError}
                      </span>
                    )}
                    <button
                      onClick={handleBatchDownload}
                      disabled={selectedClipIds.length === 0 || isZipping}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white disabled:text-slate-400 text-xs font-bold rounded-xl shadow-xs transition disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isZipping ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Generating ZIP...
                        </>
                      ) : (
                        <>
                          <FolderDown className="w-3.5 h-3.5" />
                          Download Selected ({selectedClipIds.length}) as ZIP
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* List items with check boxes */}
                <div className="divide-y divide-slate-100">
                  {clipsHistory.map((clip) => (
                    <div key={clip.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedClipIds.includes(clip.id)}
                          onChange={() => toggleSelectClip(clip.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-xs truncate max-w-[200px]">{clip.title}</span>
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                              clip.type === "dialogue" ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"
                            }`}>
                              {clip.type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">({clip.voiceName})</span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-1 font-mono italic">
                            "{clip.text}"
                          </p>
                        </div>
                      </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => playHistoricalClip(clip)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                        title="Load into Master Waveform Player"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-700" />
                      </button>

                      <a
                        href={clip.audioUrl}
                        download={`vox-clip-${clip.id}.wav`}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                        title="Download raw audio"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => copyShareLink(clip.id)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer relative"
                        title="Copy share link"
                      >
                        {copiedClipId === clip.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setClipsHistory((prev) => prev.filter((c) => c.id !== clip.id));
                        }}
                        className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg transition cursor-pointer"
                        title="Delete from cache"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* 3. Bottom Player Bar (Master Waveform Player & Simulator Target) */}
        <div className="h-24 bg-white border-t border-gray-200 px-8 flex items-center gap-8 shrink-0 fixed bottom-0 left-64 right-0 z-40">
          
          <button
            onClick={handleTogglePlay}
            disabled={!currentAudioUrl}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 transition shadow-sm ${
              currentAudioUrl
                ? "bg-black hover:bg-slate-900 cursor-pointer"
                : "bg-slate-300 cursor-not-allowed"
            }`}
            id="master-play-btn"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 ml-1 fill-white" />
            )}
          </button>

          {/* Master Audio Tag */}
          {currentAudioUrl && (
            <audio
              ref={mainAudioRef}
              src={currentAudioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
              autoPlay
            />
          )}

          {/* Dynamic Master Waveform Representation */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <span>Master Waveform</span>
              <span className="flex items-center gap-1">
                {currentAudioUrl ? "Active Feed: 24000Hz WAV" : "Standby — Synthesize a clip to activate visual board"}
              </span>
            </div>

            <div className="h-10 w-full flex items-center gap-[3px]">
              {/* Dynamic generated simulation waveform bars */}
              {[
                8, 12, 24, 36, 40, 28, 38, 20, 16, 32, 44, 18, 12, 16, 24, 38, 48, 40,
                32, 28, 36, 42, 20, 14, 8, 16, 28, 34, 40, 24, 18, 12, 8, 16, 22, 30,
                36, 28, 18, 12, 10, 18, 28, 34, 42, 36, 24, 16, 8, 12, 24, 32, 38, 20
              ].map((height, i) => {
                const isActive = isPlaying && currentAudioUrl;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-full transition-all duration-300"
                    style={{
                      height: isActive ? `${height}%` : "4px",
                      backgroundColor: isActive
                        ? i % 3 === 0
                          ? "#4f46e5"
                          : i % 2 === 0
                          ? "#10b981"
                          : "#1a1a1a"
                        : "#e2e8f0",
                      animationName: isActive ? "pulse" : "none",
                      animationDuration: "0.4s",
                      animationIterationCount: "infinite",
                      animationTimingFunction: "ease-in-out",
                      animationDirection: "alternate",
                      animationDelay: `${i * 0.02}s`
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0 border-l border-slate-100 pl-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Target Device EQ</span>
              <span className="text-sm font-semibold flex items-center gap-1.5 text-slate-700">
                <Smartphone className="w-4 h-4 text-slate-400" />
                {TARGET_DEVICES.find((d) => d.id === targetDevice)?.name || "Studio Monitors"}
              </span>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

