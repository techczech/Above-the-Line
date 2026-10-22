import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, cpSync, rmSync, existsSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { validateResult, validateResults, validateAnnotation } from '../portable/validate-above-the-line.mjs';
import { renderResultHTML } from '../portable/render-above-the-line.mjs';
import { renderResult } from '../portable/render-core-above-the-line.mjs';
import { configureProvider, clearProvider, getProviderConfig, restoreProviderConfig, requireProviderConfig, STORAGE_KEY, DEFAULT_MODELS } from '../services/providerConfig.ts';
import { generateText, generateAudio } from '../services/providerTransport.ts';
import { generateAnnotation, generateSpeech } from '../services/geminiService.ts';
const example = JSON.parse(readFileSync(new URL('../portable/example-above-the-line-result.json', import.meta.url)));
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; clearProvider(); });
const config = provider => ({provider, apiKey:'synthetic-test-key', ...DEFAULT_MODELS[provider]});
const storage = () => { const values = new Map(); return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; };

test('memory-only default, explicit persistence, opt-out and clear preserve unrelated data', () => {
  const store = storage(); store.setItem('saved-annotations', 'untouched');
  assert.throws(() => requireProviderConfig(), /Add your own API key/);
  configureProvider(config('openai'), false, store);
  assert.equal(getProviderConfig().apiKey, 'synthetic-test-key'); assert.equal(store.getItem(STORAGE_KEY), null);
  configureProvider(config('gemini'), true, store); clearProvider();
  assert.equal(restoreProviderConfig(store), true); assert.equal(getProviderConfig().provider, 'gemini');
  configureProvider(config('gemini'), false, store); assert.equal(store.getItem(STORAGE_KEY), null);
  configureProvider(config('openai'), true, store); clearProvider(store);
  assert.equal(getProviderConfig().apiKey, ''); assert.equal(store.getItem(STORAGE_KEY), null); assert.equal(store.getItem('saved-annotations'), 'untouched');
});
test('corrupt or blocked browser storage does not prevent keyless viewing', () => {
  const store = storage(); store.setItem(STORAGE_KEY, '{'); assert.equal(restoreProviderConfig(store), false);
  assert.equal(restoreProviderConfig({getItem() { throw new Error('blocked'); }}), false);
  assert.throws(() => configureProvider({...config('openai'),model:'https://attacker.invalid'},false,store), /model IDs/);
  assert.equal(getProviderConfig().apiKey, '');
});
test('missing key sends no network request', async () => {
  let calls = 0; globalThis.fetch = async () => { calls++; throw new Error('unexpected'); };
  await assert.rejects(generateText('hello'), /Add your own API key/); await assert.rejects(generateAudio('hello', 'Kore'), /Add your own API key/); assert.equal(calls, 0);
});
for (const provider of ['openai', 'gemini']) {
  test(`${provider} text goes only to official origin with key in headers, never URL/body`, async () => {
    configureProvider(config(provider), false);
    globalThis.fetch = async (url, init) => {
      assert.equal(new URL(url).hostname, provider === 'openai' ? 'api.openai.com' : 'generativelanguage.googleapis.com');
      assert.ok(!url.includes('synthetic-test-key')); assert.ok(!init.body.includes('synthetic-test-key'));
      assert.equal(init.headers[provider === 'openai' ? 'Authorization' : 'x-goog-api-key'], provider === 'openai' ? 'Bearer synthetic-test-key' : 'synthetic-test-key');
      const body = JSON.parse(init.body); assert.equal(body.model ?? DEFAULT_MODELS.gemini.model, DEFAULT_MODELS[provider].model);
      return Response.json(provider === 'openai' ? {choices:[{message:{content:'{"ok":true}'}}]} : {candidates:[{content:{parts:[{text:'{"ok":true}'}]}}]});
    };
    assert.equal(await generateText('Return JSON', {type:'OBJECT'}), '{"ok":true}');
  });
  test(`${provider} TTS retains 24 kHz PCM and provider voice mapping`, async () => {
    configureProvider(config(provider), false);
    globalThis.fetch = async (url, init) => {
      const body = JSON.parse(init.body);
      if (provider === 'openai') { assert.equal(body.response_format, 'pcm'); assert.equal(body.voice, 'coral'); return new Response(new Uint8Array([1,0,2,0])); }
      assert.equal(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Kore');
      assert.ok(url.includes(DEFAULT_MODELS.gemini.ttsModel));
      return Response.json({candidates:[{content:{parts:[{inlineData:{data:'AQACAA=='}}]}}]});
    };
    assert.equal(await generateAudio('Dobrý den', 'Kore'), 'AQACAA==');
  });
}
test('provider errors are actionable and never echo provider bodies or thrown secrets', async () => {
  configureProvider(config('openai'), false);
  for (const [status, expected] of [[401,/rejected the API key/],[403,/permissions/],[404,/model unavailable/],[429,/quota or rate limit/],[500,/HTTP 500/]]) {
    globalThis.fetch = async () => new Response('synthetic-test-key', {status});
    await assert.rejects(generateText('hello'), error => expected.test(error.message) && !error.message.includes('synthetic-test-key'));
  }
  globalThis.fetch = async () => new Response('synthetic-test-key', {status:200});
  await assert.rejects(generateText('hello'), error => /unreadable response/.test(error.message) && !error.message.includes('synthetic-test-key'));
  globalThis.fetch = async () => { throw new Error('synthetic-test-key'); };
  await assert.rejects(generateText('hello'), /Could not reach/);
  globalThis.fetch = async () => Response.json({choices:[{finish_reason:'length',message:{content:'truncated'}}]});
  await assert.rejects(generateText('hello'), /truncated/);
});
test('nested invalid generated/imported records are rejected atomically', () => {
  assert.deepEqual(validateResult(example), example);
  for (const mutate of [x => x.annotation.stanzas = [], x => x.annotation.stanzas[0].lines[0].words[0].grammar = 42, x => x.timestamp = 'bad', x => x.studyHistory = [{}], x => x.slideshowData = {youtubeUrl:'javascript:alert(1)',timecodes:[]}]) {
    const value = structuredClone(example); mutate(value); assert.throws(() => validateResult(value), /Invalid Above the Line result/);
    assert.throws(() => validateResults([example,value]));
  }
  assert.throws(() => validateAnnotation({stanzas:null,textType:'poem'}));
});
test('all existing shipped records remain valid, including study history and timecodes', () => {
  const files = readdirSync(new URL('../samples/', import.meta.url)).filter(name => name.endsWith('.json'));
  for (const file of files) assert.doesNotThrow(() => validateResult(JSON.parse(readFileSync(new URL('../samples/'+file, import.meta.url)))), file);
});
test('exports project allowed fields and discard key/config fields at every nesting level', () => {
  const value = structuredClone(example); value.apiKey = 'should-never-export'; value.providerConfig = config('openai');
  value.annotation.apiKey = 'should-never-export'; value.annotation.stanzas[0].lines[0].words[0].key = 'should-never-export';
  assert.deepEqual(validateResult(value), example);
  assert.ok(!renderResultHTML(value).includes('should-never-export'));
});
test('HTML treats model/import text as data and uses no external assets', () => {
  const value = structuredClone(example); value.title = '<img src=x onerror=alert(1)>'; value.annotation.stanzas[0].lines[0].words[0].original = '</script><script>alert(1)</script>';
  const html = renderResultHTML(value);
  assert.ok(html.includes('&lt;img')); assert.ok(html.includes('\\u003c/script>'));
  assert.ok(!html.includes('<script>alert(1)</script>')); assert.ok(!/<(?:script|link|img)[^>]+(?:src|href)=/i.test(html));
  assert.ok(html.includes("connect-src 'none'")); assert.ok(html.includes('id="show-grammar"')); assert.ok(html.includes('idiomatic'));
});
test('Markdown source edit drives the packaged interface', () => {
  const read = name => readFileSync(new URL('../portable/'+name, import.meta.url), 'utf8');
  const html = renderResult(example, {copy:read('copy-above-the-line-viewer.md').replace('Word translation','Edited translation label'),style:read('viewer-above-the-line.css'),script:read('viewer-above-the-line.js')});
  assert.ok(html.includes('Edited translation label'));
});
test('portable folder works independently and failed CLI validation writes no HTML', () => {
  const folder = mkdtempSync(resolve('tests', 'portable-check-'));
  try {
    cpSync('portable', resolve(folder,'portable'), {recursive:true});
    const cli = resolve(folder,'portable/render-above-the-line.mjs'); const output = resolve(folder,'result.html');
    execFileSync(process.execPath,[cli,resolve(folder,'portable/example-above-the-line-result.json'),output],{cwd:folder}); assert.ok(existsSync(output));
    const badOutput = resolve(folder,'invalid.html'); const response = spawnSync(process.execPath,[cli,resolve(folder,'portable/schema-above-the-line-result.json'),badOutput]);
    assert.equal(response.status,1); assert.equal(existsSync(badOutput),false);
  } finally { rmSync(folder,{recursive:true,force:true}); }
});

test('annotation service validates model output and speaker TTS reuses selected profiles', async () => {
  configureProvider(config('openai'), false);
  globalThis.fetch = async () => Response.json({choices:[{message:{content:JSON.stringify(example.annotation)}}]});
  assert.deepEqual(await generateAnnotation('Dobrý den!', 'Czech', 'English'), example.annotation);
  globalThis.fetch = async () => Response.json({choices:[{message:{content:'{"textType":"poem","stanzas":[]}'}}]});
  await assert.rejects(generateAnnotation('hello','English','Czech'), /invalid annotation/);
  const profiles = new Map([['Anna',{voice:'Kore',gender:'female',userOverride:'female'}]]);
  globalThis.fetch = async (url,init) => { assert.ok(url.endsWith('/audio/speech')); assert.equal(JSON.parse(init.body).voice,'coral'); return new Response(new Uint8Array([1,0,2,0])); };
  const speech = await generateSpeech('Dobrý den!','Anna','Czech',profiles);
  assert.equal(speech.base64Audio,'AQACAA=='); assert.deepEqual(speech.profileMap,profiles);
});
