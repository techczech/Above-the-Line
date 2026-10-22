export type Provider = 'openai' | 'gemini';
export interface ProviderConfig { provider: Provider; apiKey: string; model: string; ttsModel: string; }
export const DEFAULT_MODELS = {
  openai: { model: 'gpt-4.1-mini', ttsModel: 'gpt-4o-mini-tts' },
  gemini: { model: 'gemini-2.5-flash', ttsModel: 'gemini-2.5-pro-preview-tts' },
};
export const STORAGE_KEY = 'above-the-line-provider';
let current: ProviderConfig = { provider: 'openai', apiKey: '', ...DEFAULT_MODELS.openai };

export function getProviderConfig(): ProviderConfig { return { ...current }; }
export function restoreProviderConfig(storage?: Pick<Storage, 'getItem'>): boolean {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return false;
    const value = JSON.parse(raw);
    if (!['openai', 'gemini'].includes(value.provider) || typeof value.apiKey !== 'string' ||
        typeof value.model !== 'string' || typeof value.ttsModel !== 'string') return false;
    current = { provider: value.provider, apiKey: value.apiKey, model: value.model, ttsModel: value.ttsModel };
    return true;
  } catch { return false; }
}
export function configureProvider(value: ProviderConfig, persist: boolean, storage?: Pick<Storage, 'setItem' | 'removeItem'>): void {
  if (!['openai', 'gemini'].includes(value.provider)) throw new Error('Choose Gemini or OpenAI.');
  if (![value.model, value.ttsModel].every(model => /^[a-zA-Z0-9._-]+$/.test(model))) throw new Error('Enter valid text and speech model IDs.');
  const next = { provider: value.provider, apiKey: value.apiKey.trim(), model: value.model, ttsModel: value.ttsModel };
  if (persist) {
    if (!storage) throw new Error('Browser storage is unavailable. Turn off Remember on this device.');
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  } else storage?.removeItem(STORAGE_KEY);
  current = next;
}
export function clearProvider(storage?: Pick<Storage, 'removeItem'>): void {
  current = { provider: 'openai', apiKey: '', ...DEFAULT_MODELS.openai };
  storage?.removeItem(STORAGE_KEY);
}
export function requireProviderConfig(): ProviderConfig {
  const value = getProviderConfig();
  if (!value.apiKey) throw new Error('Add your own API key in AI settings to generate text or audio. Saved texts need no key.');
  return value;
}
