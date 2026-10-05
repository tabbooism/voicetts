/**
 * Helper utility to convert raw 16-bit PCM little-endian audio bytes (base64)
 * into a standard playable WAV file URL using the browser's Blob structure.
 */
export function pcmToWav(base64Pcm: string, sampleRate = 24000): string {
  const binaryString = atob(base64Pcm);
  const len = binaryString.length;
  const buffer = new ArrayBuffer(44 + len);
  const view = new DataView(buffer);

  // Write RIFF Header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + len, true); // ChunkSize
  writeString(view, 8, "WAVE");

  // Write FMT subchunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for uncompressed PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // Write Data subchunk
  writeString(view, 36, "data");
  view.setUint32(40, len, true); // Subchunk2Size

  // Write PCM audio samples
  for (let i = 0; i < len; i++) {
    view.setUint8(44 + i, binaryString.charCodeAt(i));
  }

  const blob = new Blob([buffer], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

/**
 * Creates dummy PCM audio in case the client needs to fallback gracefully (e.g. 1 second tone)
 */
export function generateTestPcmTone(frequency = 440, durationSeconds = 1, sampleRate = 24000): string {
  const numSamples = sampleRate * durationSeconds;
  const buffer = new ArrayBuffer(numSamples * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t);
    // Convert float to 16-bit signed integer
    const intSample = Math.floor(sample * 32767);
    view.setInt16(i * 2, intSample, true);
  }

  // Convert buffer to binary string
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

/**
 * Clean up object URLs to prevent memory leaks
 */
export function revokeAudioUrl(url: string) {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
