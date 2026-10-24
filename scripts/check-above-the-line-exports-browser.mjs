import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import JSZip from 'jszip';
const {chromium}=await import(process.argv[2]||'playwright');
const base=process.argv[3]||'http://127.0.0.1:4412';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:1000}});
let releaseAudio;const audioGate=new Promise(resolve=>{releaseAudio=resolve;});const errors=[],external=[],failed=[],consoleErrors=[];const origin=new URL(base).origin;
await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin===origin&&url.pathname.includes('/samples/audio/'))await audioGate;if(url.origin===origin||['data:','blob:'].includes(url.protocol))return route.continue();external.push(url.hostname);return route.abort();});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});page.on('response',r=>{if(r.status()>=400)failed.push({status:r.status(),url:r.url()});});
const checks=[];
const sample=JSON.parse(readFileSync('samples/italian-poem-sample.json','utf8'));
const originalIds=sample.annotation.stanzas.flatMap((stanza,s)=>stanza.lines.map((_,l)=>`s${s}-l${l}`)).sort();
async function verifyRecordings(archive, missing=[]){
 const files=Object.values(archive.files).filter(file=>!file.dir&&file.name.startsWith('audio/'));
 assert.deepEqual(files.map(file=>file.name.slice(6)).sort(),originalIds.filter(id=>!missing.includes(id)));
 for(const file of files)assert.deepEqual(await file.async('nodebuffer'),readFileSync(`samples/italian-poem-sample/${file.name.slice(6)}`),`original bytes: ${file.name}`);
}
async function loadItalian(owner){
 await owner.getByRole('button',{name:/Samples$/}).click();
 await owner.getByText(sample.title,{exact:true}).locator('..').locator('..').locator('..').getByRole('button',{name:/Load$/}).click();
 await owner.getByRole('button',{name:'Save JSON',exact:true}).waitFor();
}

async function download(button, owner=page, timeout=15000){console.log('Checking download:',await button.getAttribute('title')||await button.innerText());const pending=owner.waitForEvent('download',{timeout});await button.click();let file;try{file=await pending;}catch(error){console.log(JSON.stringify({errors,failed,external,consoleErrors}));throw error;}return {name:file.suggestedFilename(),bytes:readFileSync(await file.path())};}
try{
 await page.goto(base);await page.getByText('AI settings ·',{exact:false}).waitFor();await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.evaluate(()=>document.fonts.check('24px "Material Symbols Outlined Variable"')),true);
 assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(249, 250, 251)');
 await loadItalian(page);await page.evaluate(()=>document.fonts.ready);
 const json=await download(page.getByRole('button',{name:'Save JSON',exact:true}));const record=JSON.parse(json.bytes);assert.deepEqual(record.annotation,sample.annotation);checks.push('sample renders with locally bundled styles and multilingual fonts; JSON export preserves annotation');
 let zipFinished=false;const pendingZip=download(page.getByRole('button',{name:/Export ZIP$/})).then(value=>{zipFinished=true;return value;});pendingZip.catch(()=>{});await new Promise(resolve=>setTimeout(resolve,200));assert.equal(zipFinished,false,'ZIP export must wait for delayed bundled recordings');releaseAudio();const zip=await pendingZip;const archive=await JSZip.loadAsync(zip.bytes);const packed=JSON.parse(await archive.file('annotation.json').async('string'));assert.deepEqual(packed.annotation,record.annotation);const audio=Object.values(archive.files).filter(file=>!file.dir&&file.name.startsWith('audio/'));assert.equal(audio.length,15);await verifyRecordings(archive);checks.push('delayed ZIP export waits for pending recordings and includes all 15 byte-identical originals');
 const pdf=await download(page.getByRole('button',{name:/Export PDF$/}));assert.match(pdf.bytes.subarray(0,8).toString(),/^%PDF-/);assert.ok(pdf.bytes.length>1000);assert.ok((pdf.bytes.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length>0);checks.push('PDF export uses bundled jsPDF and locally embedded fonts to produce a real PDF');
 const png=await download(page.getByRole('button',{name:'Export this stanza as PNG',exact:true}).first());assert.equal(png.bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');checks.push('stanza PNG export produces a real image without a CDN dependency');
 mkdirSync('docs/shots-above-the-line-release',{recursive:true});await page.screenshot({path:'docs/shots-above-the-line-release/annotation-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile page must not overflow horizontally');await page.screenshot({path:'docs/shots-above-the-line-release/annotation-mobile.png',fullPage:true});
 const fresh=await browser.newContext({acceptDownloads:true});await fresh.route('**/*',route=>{const url=new URL(route.request().url());return url.origin===origin&&!url.pathname.includes('/samples/audio/')?route.continue():route.abort();});const imported=await fresh.newPage();await imported.goto(base);await imported.getByRole('button',{name:/My Texts$/}).click();await imported.locator('input[type="file"]').setInputFiles({name:'annotation.zip',mimeType:'application/zip',buffer:zip.bytes});await imported.getByText(record.title,{exact:true}).waitFor();
 const importedAudio=await imported.evaluate(async id=>{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('AnnotationAudioDB',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  try{return await new Promise((resolve,reject)=>{const r=db.transaction('audioClips').objectStore('audioClips').index('annotationId').getAll(id);r.onsuccess=()=>resolve(r.result.map(clip=>({id:clip.audioId,bytes:Array.from(new Uint8Array(clip.data))})));r.onerror=()=>reject(r.error);});}finally{db.close();}
 },record.id);
 assert.deepEqual(importedAudio.map(clip=>clip.id).sort(),originalIds);
 for(const clip of importedAudio)assert.deepEqual(Buffer.from(clip.bytes),readFileSync(`samples/italian-poem-sample/${clip.id}`));
 checks.push('ZIP imports all 15 byte-identical recordings into a fresh keyless context with sample audio requests blocked');await fresh.close();
 const broken=await browser.newContext({acceptDownloads:true});let missingRequests=0;const brokenErrors=[];
 await broken.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.origin===origin&&url.pathname==='/samples/audio/italian-poem-sample/s0-l2.raw'){missingRequests++;return route.fulfill({status:404,body:'Missing recording fixture'});}
  return url.origin===origin||['blob:','data:'].includes(url.protocol)?route.continue():route.abort();
 });
 const brokenPage=await broken.newPage();brokenPage.on('pageerror',e=>brokenErrors.push(e.message));await brokenPage.goto(base);await loadItalian(brokenPage);
 const partial=await download(brokenPage.getByRole('button',{name:/Export ZIP$/}),brokenPage);
 await brokenPage.getByText('Exported, but 1 recording could not be loaded and is missing from the ZIP.',{exact:true}).waitFor();
 assert.equal(missingRequests,1);const partialArchive=await JSZip.loadAsync(partial.bytes);await verifyRecordings(partialArchive,['s0-l2']);assert.deepEqual(JSON.parse(await partialArchive.file('annotation.json').async('string')).annotation,sample.annotation);assert.deepEqual(brokenErrors,[]);
 checks.push('failed s0-l2 load produces a visible missing-recording warning and ZIP with 14 byte-identical originals');await broken.close();
 const textContext=await browser.newContext({acceptDownloads:true});let releaseTextAudio;const textGate=new Promise(resolve=>{releaseTextAudio=resolve;});let blockedTextAudio=0;
 try{
  await textContext.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin===origin&&url.pathname.includes('/samples/audio/')){blockedTextAudio++;await textGate;}return url.origin===origin||['blob:','data:'].includes(url.protocol)?route.continue():route.abort();});
  const textPage=await textContext.newPage();await textPage.goto(base);await textPage.getByRole('button',{name:/Samples$/}).click();await textPage.getByText(sample.title,{exact:true}).waitFor();assert.ok(blockedTextAudio>0);
  const example=JSON.parse(readFileSync('portable/example-above-the-line-result.json','utf8'));await textPage.getByRole('button',{name:/My Texts$/}).click();await textPage.locator('input[type="file"]').setInputFiles({name:'text-only.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(example))});await textPage.getByText(example.title,{exact:true}).locator('..').locator('..').locator('..').getByRole('button',{name:/Load$/}).click();
  const textZip=await download(textPage.getByRole('button',{name:/Export ZIP$/}),textPage,1500);const textArchive=await JSZip.loadAsync(textZip.bytes);assert.deepEqual(JSON.parse(await textArchive.file('annotation.json').async('string')).annotation,example.annotation);assert.equal(Object.values(textArchive.files).filter(file=>!file.dir&&file.name.startsWith('audio/')).length,0);
  checks.push('text-only ZIP downloads within 1500ms while unrelated sample audio remains blocked');
 }finally{releaseTextAudio();await textContext.close();}

 const bulkContext=await browser.newContext({acceptDownloads:true});let releaseBulk;const bulkGate=new Promise(resolve=>{releaseBulk=resolve;});
 try{
  await bulkContext.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin===origin&&url.pathname.includes('/samples/audio/'))await bulkGate;return url.origin===origin||['blob:','data:'].includes(url.protocol)?route.continue():route.abort();});
  const bulkPage=await bulkContext.newPage();await bulkPage.goto(base);await loadItalian(bulkPage);await bulkPage.getByTitle('Save or Update Annotation (u)').click();await bulkPage.getByRole('button',{name:/My Texts$/}).click();await bulkPage.getByText(sample.title,{exact:true}).first().waitFor();
  let bulkFinished=false;const pendingBulk=download(bulkPage.getByRole('button',{name:/Export All$/}),bulkPage).then(value=>{bulkFinished=true;return value;});pendingBulk.catch(()=>{});await new Promise(resolve=>setTimeout(resolve,400));assert.equal(bulkFinished,false,'Export All must wait for pending sample audio');releaseBulk();
  const bulkArchive=await JSZip.loadAsync((await pendingBulk).bytes);const bulkAudio=Object.values(bulkArchive.files).filter(file=>!file.dir&&/_audio\/[^/]+\.raw$/.test(file.name));
  assert.deepEqual(bulkAudio.map(file=>file.name.split('/').pop().replace(/\.raw$/,'')).sort(),originalIds);for(const file of bulkAudio)assert.deepEqual(await file.async('nodebuffer'),readFileSync(`samples/italian-poem-sample/${file.name.split('/').pop().replace(/\.raw$/,'')}`),`bulk original bytes: ${file.name}`);
  checks.push('Export All of a just-saved sample waits for pending recordings and nests all 15 byte-identical originals');
 }finally{releaseBulk();await bulkContext.close();}

 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);checks.push('normal export context has zero external requests, failing resources or page errors; desktop/mobile screenshots captured');
 const receipt={checkedAt:new Date().toISOString(),base,checks,downloads:{zipBytes:zip.bytes.length,pdfBytes:pdf.bytes.length,pngBytes:png.bytes.length},externalRequests:external,pageErrors:errors,failedResources:failed,faultInjection:{missingRecording:'s0-l2',httpStatus:404,requests:missingRequests,remainingOriginalRecordings:14},limits:['No live model call or audible speech check. YouTube media playback remains an external optional feature.']};writeFileSync('docs/evidence-above-the-line-exports-release.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
}finally{releaseAudio();await browser.close();}
