export interface VoiceAnalysis {
  pitch: string;
  speed: string;
  tone: string;
  accent: string;
  vibe: string;
  description: string;
  suggestedVoiceName: string;
  clonedPersonaPrompt: string;
}

export interface CustomVoice {
  id: string;
  name: string;
  type: "prebuilt" | "cloned";
  gender: "Male" | "Female" | "Neutral";
  suggestedVoiceName: string; // The baseline model voice Puck | Charon | Kore | Fenrir | Zephyr
  clonedPersonaPrompt?: string; // Prompt override for Gemini TTS
  analysis?: VoiceAnalysis;
  isCustom?: boolean;
}

export interface CustomConfig {
  pitch: string; // "Deep", "Medium", "Slightly high-pitched", etc.
  speed: string; // "Calm and measured", "Fast-paced", "Moderate", etc.
  tone: string;  // "Professional", "Friendly", "Authoritative", "Excited", etc.
  accent: string; // "North American", "Neutral professional", "British", etc.
  customStyle?: string; // Custom instructions like "with high energy"
}

export interface DialogueLine {
  id: string;
  speaker: string;
  text: string;
  voiceId: string; // references CustomVoice
  style: string;   // specific instruction for that turn
}

export interface PrebuiltVoiceOption {
  id: string;
  name: string;
  description: string;
  voiceName: string; // Puck, Charon, Kore, Fenrir, Zephyr
  gender: "Male" | "Female" | "Neutral";
  vibe: string;
}

export const PREBUILT_VOICES: PrebuiltVoiceOption[] = [
  {
    id: "zephyr",
    name: "Zephyr",
    description: "Soothing, warm, and highly articulate. Excellent for banking, customer care, and narrations.",
    voiceName: "Zephyr",
    gender: "Neutral",
    vibe: "Professional & Calming",
  },
  {
    id: "kore",
    name: "Kore",
    description: "Clear, cheerful, and enthusiastic. Great for general content creation, promos, and social clips.",
    voiceName: "Kore",
    gender: "Female",
    vibe: "Bright & Energetic",
  },
  {
    id: "puck",
    name: "Puck",
    description: "Light, crisp, and conversational. Ideal for social media narratives, podcast intros, and short videos.",
    voiceName: "Puck",
    gender: "Male",
    vibe: "Conversational & Fresh",
  },
  {
    id: "charon",
    name: "Charon",
    description: "Deep, resonant, mature, and authoritative. Perfect for formal presentations, alerts, and news.",
    voiceName: "Charon",
    gender: "Male",
    vibe: "Authoritative & Deep",
  },
  {
    id: "fenrir",
    name: "Fenrir",
    description: "Powerful, gravelly, and commanding. Outstanding for sports content, dramatic trailers, and bold voices.",
    voiceName: "Fenrir",
    gender: "Male",
    vibe: "Powerful & Commandive",
  }
];

export interface GeneratedClip {
  id: string;
  title: string;
  text: string;
  voiceName: string;
  audioUrl: string;
  createdAt: string;
  duration?: string;
  type: "single" | "dialogue";
}

export type PersonaCategory =
  | "Executive & Corporate"
  | "Broadcast & Media"
  | "Scientific & Tech"
  | "Narrative & Creative"
  | "Healthcare & Coaching"
  | "Security & Emergency";

export interface VoicePersona {
  id: string;
  name: string;
  category: PersonaCategory;
  ageRange: string;
  gender: "Male" | "Female" | "Neutral";
  accent: string;
  speakingStyle: string;
  professionalBackground: string;
  description: string;
  tags: string[];
  sampleQuote: string;
  defaultScript: string;
  avatarColor: string;
  voiceProfile: {
    suggestedVoiceName: "Zephyr" | "Charon" | "Kore" | "Puck" | "Fenrir";
    pitch: string;
    speed: string;
    tone: string;
    accent: string;
    vibe: string;
    textureSlider: number;
    customStyle: string;
    clonedPersonaPrompt: string;
  };
}

