import React, { useState, useRef } from "react";
import {
  Users,
  Search,
  Sliders,
  Sparkles,
  Play,
  Pause,
  Loader2,
  Check,
  Plus,
  Volume2,
  Globe,
  Briefcase,
  Layers,
  Info,
  X,
  Tag,
  ArrowRight,
  ShieldCheck,
  Mic
} from "lucide-react";
import { VoicePersona, PersonaCategory, CustomVoice, CustomConfig } from "../types";
import { VOICE_PERSONAS, PERSONA_CATEGORIES } from "../data/personaLibrary";
import { pcmToWav } from "../utils/audioUtils";

interface PersonaLibraryProps {
  onSelectForCustomization: (persona: VoicePersona) => void;
  onCloneToVoices: (persona: VoicePersona) => void;
  onAssignToDialogue?: (persona: VoicePersona) => void;
  activeVoiceIds: string[];
}

export default function PersonaLibrary({
  onSelectForCustomization,
  onCloneToVoices,
  onAssignToDialogue,
  activeVoiceIds
}: PersonaLibraryProps) {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedGender, setSelectedGender] = useState<string>("All");
  const [selectedModelAnchor, setSelectedModelAnchor] = useState<string>("All");

  // Detailed inspect modal state
  const [inspectingPersona, setInspectingPersona] = useState<VoicePersona | null>(null);

  // Quick audio preview player state
  const [playingPersonaId, setPlayingPersonaId] = useState<string | null>(null);
  const [isSynthesizingPreview, setIsSynthesizingPreview] = useState<string | null>(null);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Notification / toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered personas
  const filteredPersonas = VOICE_PERSONAS.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.accent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.professionalBackground.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.speakingStyle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesGender = selectedGender === "All" || p.gender === selectedGender;
    const matchesAnchor = selectedModelAnchor === "All" || p.voiceProfile.suggestedVoiceName === selectedModelAnchor;

    return matchesSearch && matchesCategory && matchesGender && matchesAnchor;
  });

  // Play / Preview Persona Voice using Express TTS endpoint
  const handleTogglePlayPreview = async (persona: VoicePersona) => {
    setPreviewError(null);

    // If already playing this persona, pause it
    if (playingPersonaId === persona.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPlayingPersonaId(null);
      return;
    }

    // If audio already cached for this persona, play directly
    if (audioCache[persona.id]) {
      if (previewAudioRef.current) {
        previewAudioRef.current.src = audioCache[persona.id];
        previewAudioRef.current.play();
        setPlayingPersonaId(persona.id);
      }
      return;
    }

    // Otherwise synthesize via API
    setIsSynthesizingPreview(persona.id);

    try {
      const response = await fetch("/api/voice/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: persona.sampleQuote,
          voiceName: persona.voiceProfile.suggestedVoiceName,
          customConfig: {
            pitch: persona.voiceProfile.pitch,
            speed: persona.voiceProfile.speed,
            tone: persona.voiceProfile.tone,
            accent: persona.voiceProfile.accent,
            customStyle: `${persona.voiceProfile.customStyle} | Texture: ${persona.voiceProfile.textureSlider}% crispness.`
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to preview persona voice");
      }

      const url = pcmToWav(data.audio, data.sampleRate || 24000);

      // Save to cache
      setAudioCache((prev) => ({ ...prev, [persona.id]: url }));

      if (previewAudioRef.current) {
        previewAudioRef.current.src = url;
        previewAudioRef.current.play();
        setPlayingPersonaId(persona.id);
      }
    } catch (err: any) {
      console.error("Preview voice failed:", err);
      setPreviewError(`Preview unavailable for ${persona.name}: ${err.message || "Synthesizer offline"}`);
    } finally {
      setIsSynthesizingPreview(null);
    }
  };

  const handleCloneClick = (persona: VoicePersona) => {
    onCloneToVoices(persona);
    showToast(`"${persona.name}" cloned and added to your active voice roster!`);
  };

  return (
    <div className="space-y-6" id="persona-library-container">
      {/* Hidden Audio Tag for Previews */}
      <audio
        ref={previewAudioRef}
        onEnded={() => setPlayingPersonaId(null)}
        onError={() => setPlayingPersonaId(null)}
        className="hidden"
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Banner / Introduction Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-sky-50 text-sky-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-sky-100">
              <Users className="w-3.5 h-3.5" /> High-Fidelity Persona Library
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Comprehensive Voice Persona Archetypes
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Explore diverse global voices crafted across professional disciplines, accents, age ranges, and acoustic timbres.
              Select any persona as an instant starting point to customize pitch, speed, cadence, or clone straight into your production workflow.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-center">
              <span className="text-xs text-slate-400 font-mono block uppercase text-[10px]">Total Personas</span>
              <span className="text-lg font-bold text-slate-800">{VOICE_PERSONAS.length} Archetypes</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-center">
              <span className="text-xs text-slate-400 font-mono block uppercase text-[10px]">Active Filters</span>
              <span className="text-lg font-bold text-sky-600">{filteredPersonas.length} Available</span>
            </div>
          </div>
        </div>

        {previewError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-center justify-between">
            <span>{previewError}</span>
            <button
              onClick={() => setPreviewError(null)}
              className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, accent, profession, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Gender & Anchor dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Gender:</span>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Neutral">Neutral</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Base Anchor:</span>
              <select
                value={selectedModelAnchor}
                onChange={(e) => setSelectedModelAnchor(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Models</option>
                <option value="Zephyr">Zephyr (Warm & Articulate)</option>
                <option value="Charon">Charon (Deep & Authoritative)</option>
                <option value="Kore">Kore (Bright & Energetic)</option>
                <option value="Puck">Puck (Crisp & Conversational)</option>
                <option value="Fenrir">Fenrir (Powerful & Gravelly)</option>
              </select>
            </div>

            {(searchQuery || selectedCategory !== "All" || selectedGender !== "All" || selectedModelAnchor !== "All") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedGender("All");
                  setSelectedModelAnchor("All");
                }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition font-medium cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedCategory === "All"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Categories ({VOICE_PERSONAS.length})
          </button>
          {PERSONA_CATEGORIES.map((cat) => {
            const count = VOICE_PERSONAS.filter((p) => p.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/25 text-white" : "bg-slate-200/60 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Personas Grid */}
      {filteredPersonas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-slate-400 space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-700">No voice personas match your filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try resetting your search query or selecting a different category to view more personas.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
              setSelectedGender("All");
              setSelectedModelAnchor("All");
            }}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPersonas.map((persona) => {
            const isPlaying = playingPersonaId === persona.id;
            const isSynthesizing = isSynthesizingPreview === persona.id;
            const isAlreadyCloned = activeVoiceIds.includes(`clone-${persona.id}`) || activeVoiceIds.includes(persona.id);

            return (
              <div
                key={persona.id}
                className="bg-white rounded-2xl border border-gray-100 hover:border-sky-200 hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between group relative"
              >
                <div>
                  {/* Top Row: Avatar, Name, Age, Gender */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${persona.avatarColor} text-white font-bold flex items-center justify-center text-base shadow-sm shrink-0`}
                    >
                      {persona.name
                        .split(" ")
                        .filter((w) => !w.includes("."))
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-sky-700 transition">
                          {persona.name}
                        </h3>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase shrink-0">
                          {persona.gender}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 text-xs">
                        <span className="text-[11px] font-medium text-slate-500">Age {persona.ageRange}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] text-sky-700 bg-sky-50 font-semibold px-1.5 py-0.2 rounded truncate">
                          {persona.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Professional Background */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{persona.professionalBackground}</span>
                  </div>

                  {/* Accent / Region */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium truncate">{persona.accent}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">
                    {persona.description}
                  </p>

                  {/* Typical Speaking Style highlight box */}
                  <div className="bg-slate-50/75 border border-slate-100 rounded-xl p-3 mb-4 space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Volume2 className="w-3 h-3 text-sky-600" /> Typical Speaking Style
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-snug">
                      {persona.speakingStyle}
                    </p>
                  </div>

                  {/* Acoustic Profile Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 text-center mb-4">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Anchor</span>
                      <span className="text-xs font-bold text-indigo-600 block mt-0.5">{persona.voiceProfile.suggestedVoiceName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Pitch</span>
                      <span className="text-xs font-semibold text-slate-700 block mt-0.5 truncate">{persona.voiceProfile.pitch.split(" ")[0]}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Speed</span>
                      <span className="text-xs font-semibold text-slate-700 block mt-0.5">{persona.voiceProfile.speed.split(" ")[0]}</span>
                    </div>
                  </div>

                  {/* Sample Quote Callout */}
                  <div className="p-3 bg-sky-50/40 border-l-2 border-sky-500 rounded-r-xl text-xs text-slate-700 italic mb-4">
                    "{persona.sampleQuote}"
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {persona.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-slate-100/80 text-slate-600 text-[10px] font-medium rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
                  {/* Primary CTA: Select as Starting Point for Customization */}
                  <button
                    onClick={() => onSelectForCustomization(persona)}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer group/btn"
                    id={`btn-select-persona-${persona.id}`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-sky-400 group-hover/btn:rotate-45 transition-transform" />
                    <span>Select as Starting Point</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-auto group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Secondary Actions: Preview & Quick Clone & Details */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Audio Preview */}
                    <button
                      onClick={() => handleTogglePlayPreview(persona)}
                      disabled={isSynthesizing}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                        isPlaying
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                      title="Listen to persona voice preview"
                    >
                      {isSynthesizing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                      ) : isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 text-rose-600" />
                          <span className="text-[11px]">Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-sky-600" />
                          <span className="text-[11px]">Preview</span>
                        </>
                      )}
                    </button>

                    {/* Clone to active list */}
                    <button
                      onClick={() => handleCloneClick(persona)}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                        isAlreadyCloned
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                      title="Clone voice directly into active roster"
                    >
                      {isAlreadyCloned ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[11px]">Cloned</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-[11px]">Clone</span>
                        </>
                      )}
                    </button>

                    {/* Inspect details modal */}
                    <button
                      onClick={() => setInspectingPersona(persona)}
                      className="py-2 px-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition flex items-center justify-center gap-1 cursor-pointer"
                      title="View complete acoustic profile & prompt specs"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px]">Profile</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Persona Acoustic Modal */}
      {inspectingPersona && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 md:p-8 border border-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setInspectingPersona(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${inspectingPersona.avatarColor} text-white font-bold flex items-center justify-center text-xl shadow-md`}
              >
                {inspectingPersona.name
                  .split(" ")
                  .filter((w) => !w.includes("."))
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">{inspectingPersona.name}</h3>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono font-semibold text-slate-600">
                    {inspectingPersona.gender} • Age {inspectingPersona.ageRange}
                  </span>
                </div>
                <p className="text-xs text-sky-700 font-semibold mt-0.5">{inspectingPersona.professionalBackground}</p>
              </div>
            </div>

            {/* Characteristics Grid */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                    Accent & Dialect
                  </span>
                  <p className="font-semibold text-slate-800">{inspectingPersona.accent}</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                    Typical Speaking Style
                  </span>
                  <p className="font-semibold text-slate-800">{inspectingPersona.speakingStyle}</p>
                </div>
              </div>

              {/* Acoustic Profile Specs */}
              <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Acoustic Voice Profile Blueprint
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    Model: {inspectingPersona.voiceProfile.suggestedVoiceName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Pitch Register</span>
                    <span className="text-xs font-semibold text-slate-200">{inspectingPersona.voiceProfile.pitch}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Speed Cadence</span>
                    <span className="text-xs font-semibold text-slate-200">{inspectingPersona.voiceProfile.speed}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Emotional Tone</span>
                    <span className="text-xs font-semibold text-slate-200">{inspectingPersona.voiceProfile.tone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Texture Crispness</span>
                    <span className="text-xs font-semibold text-slate-200">{inspectingPersona.voiceProfile.textureSlider}% High Definition</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Gemini TTS Synthesis Prompt</span>
                  <p className="text-[11px] font-mono text-emerald-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                    "{inspectingPersona.voiceProfile.clonedPersonaPrompt}"
                  </p>
                </div>
              </div>

              {/* Sample Domain Script */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Domain-Tailored Demonstration Script
                </span>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "{inspectingPersona.defaultScript}"
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end border-t border-slate-100 pt-4">
              <button
                onClick={() => handleTogglePlayPreview(inspectingPersona)}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {playingPersonaId === inspectingPersona.id ? (
                  <>
                    <Pause className="w-4 h-4 text-rose-600" /> Stop Preview
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-sky-600" /> Preview Sample Quote
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  handleCloneClick(inspectingPersona);
                  setInspectingPersona(null);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add to Cloned Voices
              </button>

              <button
                onClick={() => {
                  const p = inspectingPersona;
                  setInspectingPersona(null);
                  onSelectForCustomization(p);
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Sliders className="w-4 h-4 text-sky-400" />
                Customize in Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
