import React, { useState } from 'react';
import { configureProvider, clearProvider, getProviderConfig, restoreProviderConfig, DEFAULT_MODELS, type Provider } from '../services/providerConfig';

export default function ProviderSettings() {
  const [initial] = useState(() => { let storage; try { storage = localStorage; } catch {} const persisted = restoreProviderConfig(storage); return { persisted, config: getProviderConfig() }; });
  const [config, setConfig] = useState(initial.config);
  const [persist, setPersist] = useState(initial.persisted);
  const [message, setMessage] = useState('');
  const [activeProvider, setActiveProvider] = useState(initial.config.provider);
  const [ready, setReady] = useState(Boolean(initial.config.apiKey));
  const apply = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      let storage; try { storage = localStorage; } catch { if (persist) throw new Error('Browser storage is unavailable. Turn off Remember on this device.'); }
      configureProvider(config, persist, storage);
      setReady(Boolean(config.apiKey.trim()));
      setActiveProvider(config.provider);
      setMessage(persist ? 'Settings applied. Your key is saved on this device.' : 'Settings applied. Your key stays in memory until you reload or clear it.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save settings.'); }
  };
  return <details className="mb-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
    <summary className="cursor-pointer font-medium">AI settings · {ready ? activeProvider === 'openai' ? 'OpenAI' : 'Gemini' : 'Add your own key'}</summary>
    <form onSubmit={apply} className="mt-4 space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-300">Generate text and speech with your own account. Requests go directly to your selected provider and may incur charges. Saved texts, imports and result exports need no key. Read-aloud audio is AI-generated.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm">Provider<select aria-label="AI provider" value={config.provider} onChange={event => { const provider = event.target.value as Provider; setConfig({ provider, apiKey: '', ...DEFAULT_MODELS[provider] }); }} className="block w-full mt-1 rounded border p-2 dark:bg-gray-900"><option value="openai">OpenAI</option><option value="gemini">Gemini</option></select></label>
        <label className="text-sm">API key<input aria-label="API key" type="password" autoComplete="off" value={config.apiKey} onChange={event => setConfig({ ...config, apiKey: event.target.value })} className="block w-full mt-1 rounded border p-2 dark:bg-gray-900" /></label>
        <label className="text-sm">Text model<input aria-label="Text model" value={config.model} onChange={event => setConfig({ ...config, model: event.target.value })} className="block w-full mt-1 rounded border p-2 dark:bg-gray-900" /></label>
        <label className="text-sm">Speech model<input aria-label="Speech model" value={config.ttsModel} onChange={event => setConfig({ ...config, ttsModel: event.target.value })} className="block w-full mt-1 rounded border p-2 dark:bg-gray-900" /></label>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={persist} onChange={event => setPersist(event.target.checked)} />Remember on this device (stores the key in browser storage; use only on a trusted device).</label>
      <div className="flex gap-3"><button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded">Apply settings</button><button type="button" className="px-3 py-2 border rounded" onClick={() => { try { clearProvider(localStorage); setMessage('Key cleared from memory and browser storage.'); } catch { clearProvider(); setMessage('Key cleared from memory. Browser storage could not be accessed.'); } setConfig(getProviderConfig()); setPersist(false); setReady(false); }}>Clear key and reset settings</button></div>
      {message && <p role="status" className="text-sm">{message}</p>}
    </form>
  </details>;
}
