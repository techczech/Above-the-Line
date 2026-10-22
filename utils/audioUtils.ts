// From @google/genai guidelines

export function decode(base64: string): Uint8Array {
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
  // Keep original/cache bytes intact, including any incomplete final sample in legacy clips.
  const frameCount = Math.floor(data.byteLength / (2 * numChannels));
  const samples = new DataView(data.buffer, data.byteOffset, frameCount * numChannels * 2);
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = samples.getInt16((i * numChannels + channel) * 2, true) / 32768.0;
    }
  }
  return buffer;
}
