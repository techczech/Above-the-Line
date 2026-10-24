// Mocked-provider probe: a generated recording whose IndexedDB write is held must still reach the single ZIP. No real provider key or call.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import JSZip from 'jszip';
const {chromium}=await import(process.argv[2]);const base=process.argv[3];const origin=new URL(base).origin;
const example=JSON.parse(readFileSync('portable/example-above-the-line-result.json','utf8'));
const browser=await chromium.launch({headless:true});
const out={};
try{
{
 const ctx=await browser.newContext({acceptDownloads:true});const apiCalls=[];
 await ctx.addInitScript(()=>{
  const orig=IDBDatabase.prototype.transaction;let release;window.__gate=new Promise(r=>window.__release=release=r);window.__hold=false;window.__held=0;
  IDBDatabase.prototype.transaction=function(store,mode,...rest){
   if(window.__hold&&mode==='readwrite'){const db=this;const fake={oncomplete:null,onerror:null,onabort:null,objectStore(){return{put(v){window.__held++;window.__gate.then(()=>{const t=orig.call(db,store,mode);t.objectStore(store).put(v);t.oncomplete=e=>fake.oncomplete&&fake.oncomplete(e);t.onerror=e=>fake.onerror&&fake.onerror(e);});}};}};return fake;}
   return orig.call(this,store,mode,...rest);};
 });
 await ctx.route('**/*',async route=>{const u=new URL(route.request().url());
  if(['api.openai.com','generativelanguage.googleapis.com'].includes(u.hostname)){apiCalls.push(u.hostname+u.pathname);
   if(u.pathname.endsWith('/audio/speech'))return route.fulfill({contentType:'application/octet-stream',body:Buffer.from([1,0,2,0])});
   const body=route.request().postDataJSON();const structured=body.response_format||body.generationConfig?.responseMimeType;const text=structured?JSON.stringify(example.annotation):example.title;
   return route.fulfill({json:{choices:[{message:{content:text}}]}});}
  return u.origin===origin||['data:','blob:'].includes(u.protocol)?route.continue():route.abort();});
 const p=await ctx.newPage();await p.goto(base);
 await p.getByRole('button',{name:/Annotate Text$/}).click();
 await p.getByLabel('Text to Annotate',{exact:true}).fill('Dobrý den!');
 if(!(await p.getByLabel('AI provider',{exact:true}).isVisible()))await p.locator('summary').filter({hasText:'AI settings'}).click();
 await p.getByLabel('AI provider',{exact:true}).selectOption('openai');await p.getByLabel('API key',{exact:true}).fill('synthetic-browser-key');await p.getByRole('button',{name:'Apply settings',exact:true}).click();
 await p.getByRole('button',{name:/Generate Annotation$/}).click();await p.getByRole('button',{name:'Save JSON',exact:true}).waitFor();
 await p.getByRole('button',{name:/Slideshow$/}).click();await p.getByRole('button',{name:/Add Audio$/}).click();await p.getByText('Audio ready.',{exact:true}).waitFor();
 await p.getByRole('button',{name:/Save & Exit$/}).click();
 await p.getByRole('button',{name:'Save JSON',exact:true}).waitFor();
 await p.evaluate(()=>{window.__hold=true;});
 await p.getByTitle('Save or Update Annotation (u)').click();
 const held=await p.evaluate(()=>window.__held);assert.ok(held>0,'generated audio writes must be held');
 const clipsDuringHold=await p.evaluate(async()=>{window.__hold=false;const db=await new Promise(r=>{const q=indexedDB.open('AnnotationAudioDB',1);q.onsuccess=()=>r(q.result);});const n=await new Promise(r=>{const q=db.transaction('audioClips').objectStore('audioClips').count();q.onsuccess=()=>r(q.result);});db.close();return n;});
 assert.equal(clipsDuringHold,0,'cache must be empty while writes are held');
 let done=false;const pend=p.waitForEvent('download',{timeout:20000});await p.getByRole('button',{name:/Export ZIP$/}).click();pend.then(()=>done=true);
 await new Promise(r=>setTimeout(r,500));assert.equal(done,false,'ZIP export must wait for held generated-audio save');
 await p.evaluate(()=>window.__release());const dl=await pend;const z=await JSZip.loadAsync(readFileSync(await dl.path()));
 const audio=Object.keys(z.files).filter(n=>n.startsWith('audio/')&&!z.files[n].dir);assert.equal(audio.length,held);
 for(const n of audio)assert.deepEqual([...await z.files[n].async('nodebuffer')],[1,0,2,0]);
 out.generated={heldWrites:held,cacheCountWhileHeld:clipsDuringHold,zipAudioEntries:audio.length,apiCalls:apiCalls.length,apiHosts:[...new Set(apiCalls)]};
 await ctx.close();
}
console.log(JSON.stringify(out,null,1));
}finally{await browser.close();}
