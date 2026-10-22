import { requireProviderConfig, type ProviderConfig } from './providerConfig.ts';

async function post(config: ProviderConfig, path: string, body: unknown): Promise<Response> {
  const origin = config.provider === 'openai' ? 'https://api.openai.com/v1/' : 'https://generativelanguage.googleapis.com/v1beta/';
  let response: Response;
  try {
    response = await fetch(origin + path, {
      method: 'POST', headers: {
        'Content-Type': 'application/json',
        ...(config.provider === 'openai' ? { Authorization: `Bearer ${config.apiKey}` } : { 'x-goog-api-key': config.apiKey }),
      }, body: JSON.stringify(body), signal: AbortSignal.timeout(120_000), credentials: 'omit', referrerPolicy: 'no-referrer',
    });
  } catch {
    throw new Error('Could not reach the selected AI provider. Check your connection, browser restrictions and model settings, then retry.');
  }
  if (!response.ok) {
    // Provider bodies can echo request data. Never surface them or log keys.
    const label = config.provider === 'openai' ? 'OpenAI' : 'Gemini';
    if ([401, 403].includes(response.status)) throw new Error(`${label} rejected the API key or its permissions. Check AI settings.`);
    if (response.status === 429) throw new Error(`${label} quota or rate limit reached. Check your account or wait before retrying.`);
    if (response.status === 404) throw new Error(`${label} model unavailable. Check the model ID and account access in AI settings.`);
    throw new Error(`${label} request failed (HTTP ${response.status}). Check the selected model and try again.`);
  }
  return response;
}

async function readJSON(response: Response): Promise<any> {
  try { return await response.json(); }
  catch { throw new Error('The provider returned an unreadable response. Try again.'); }
}

export async function generateText(prompt: string, schema?: unknown, config = requireProviderConfig()): Promise<string> {
  let text: string | undefined;
  if (config.provider === 'openai') {
    const response = await post(config, 'chat/completions', {
      model: config.model, messages: [
        ...(schema ? [{ role: 'system', content: `Return only JSON matching this record format: ${JSON.stringify(schema)}` }] : []),
        { role: 'user', content: prompt },
      ], ...(schema ? { response_format: { type: 'json_object' } } : {}),
    });
    const data = await readJSON(response);
    if (data.choices?.[0]?.finish_reason === 'length') throw new Error('The response was truncated. Try a shorter text.');
    text = data.choices?.[0]?.message?.content;
  } else {
    const response = await post(config, `models/${encodeURIComponent(config.model)}:generateContent`, {
      contents: [{ parts: [{ text: prompt }] }],
      ...(schema ? { generationConfig: { responseMimeType: 'application/json', responseSchema: schema } } : {}),
    });
    const data = await readJSON(response);
    if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') throw new Error('The response was truncated. Try a shorter text.');
    text = data.candidates?.[0]?.content?.parts?.map((part: {text?: string}) => part.text || '').join('');
  }
  if (typeof text !== 'string' || !text.trim()) throw new Error('The provider returned no text. The request may have been blocked. Try a different input.');
  return text.trim();
}

const OPENAI_VOICE: Record<string, string> = { Kore: 'coral', Zephyr: 'nova', Puck: 'echo', Charon: 'onyx', Fenrir: 'fable' };
export async function generateAudio(text: string, voice: string, config = requireProviderConfig()): Promise<string> {
  if (config.provider === 'openai') {
    const response = await post(config, 'audio/speech', {
      model: config.ttsModel, voice: OPENAI_VOICE[voice] || 'coral', input: text, response_format: 'pcm',
    });
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.length || bytes.length % 2) throw new Error('The provider returned invalid PCM audio.');
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
  }
  const response = await post(config, `models/${encodeURIComponent(config.ttsModel)}:generateContent`, {
    contents: [{ parts: [{ text: `Read the following text aloud exactly as it is written. Do not add any extra words, sounds, or introductory phrases. The text is: "${text}"` }] }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
  });
  const data = await readJSON(response);
  const audio = data.candidates?.[0]?.content?.parts?.find((part: {inlineData?: {data?: string}}) => part.inlineData?.data)?.inlineData?.data;
  if (!audio) throw new Error('The provider returned no audio. Check the speech model and input.');
  return audio;
}
