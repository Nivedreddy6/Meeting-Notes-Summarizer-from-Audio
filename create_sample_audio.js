// Generates a clean 5-second PCM 16-bit 44.1kHz WAV audio file with gentle meeting chime notes
const fs = require('fs');
const path = require('path');

function createSampleWav(filepath, durationSeconds = 4) {
  const sampleRate = 44100;
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit PCM
  const totalSamples = sampleRate * durationSeconds;
  const dataSize = totalSamples * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // "fmt " sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // ByteRate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // "data" sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate pleasant harmonic chord tones (meeting chime pattern)
  const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const noteIndex = Math.floor(t * 1.5) % notes.length;
    const freq = notes[noteIndex];
    const envelope = Math.exp(-((t % (1 / 1.5)) * 3)); // Decay envelope
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.4 * envelope;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, buffer);
  console.log(`Generated sample WAV file: ${filepath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

createSampleWav(path.join(__dirname, 'public', 'samples', 'sample_meeting_clip.wav'), 6);
