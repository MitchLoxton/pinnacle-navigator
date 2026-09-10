import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const entry=read('latest/v360-entry.js');
const index=read('latest/index.html');
const manifest=JSON.parse(read('latest/manifest.webmanifest'));
const uploader=read('latest/v376-resumable-creator-assets.js');
const sw=read('latest/sw.js');

test('v0.37.6 resumable Creator Assets layer remains loaded in the current shell',()=>{
  assert.match(entry,/v376-resumable-creator-assets\.js\?v=0376/);
  assert.match(entry,/const RELEASE='0\.37\.9'/);
  assert.match(index,/v360-entry\.js\?v=0379/);
  assert.match(sw,/ytintel-shell-v0379-r1/);
  assert.match(sw,/v376-resumable-creator-assets\.js\?v=0376/);
});

test('large footage uses resumable TUS through the direct Storage hostname',()=>{
  assert.match(uploader,/storage\.supabase\.co\/storage\/v1\/upload\/resumable/);
  assert.match(uploader,/STANDARD_LIMIT=6\*1024\*1024/);
  assert.match(uploader,/CHUNK_SIZE=6\*1024\*1024/);
  assert.match(uploader,/chunkSize:CHUNK_SIZE/);
  assert.match(uploader,/findPreviousUploads\(\)/);
  assert.match(uploader,/resumeFromPreviousUpload/);
  assert.match(uploader,/retryDelays:\[0,3000,5000,10000,20000\]/);
  assert.match(uploader,/onProgress:progress/);
  assert.match(uploader,/uploadDataDuringCreation:true/);
});

test('large upload banks real media metadata and protects interrupted work',()=>{
  assert.match(uploader,/duration_seconds:probe\.duration_seconds/);
  assert.match(uploader,/width:probe\.width,height:probe\.height/);
  assert.match(uploader,/upload_protocol:'tus-resumable'/);
  assert.match(uploader,/event_type:'uploaded'/);
  assert.match(uploader,/beforeunload/);
  assert.match(uploader,/Pause/);
  assert.match(uploader,/Resume/);
});

test('Creator DNA is physically outside Analyse and Compare is absent from installed PWA surfaces',()=>{
  const analyseStart=index.indexOf('<section class="view active" id="analyse">');
  const competitorsStart=index.indexOf('<section class="view" id="competitors">');
  const vaultStart=index.indexOf('<section class="view" id="vault">');
  const creator=index.indexOf('id="creatorCard"');
  assert.ok(analyseStart>=0&&competitorsStart>analyseStart&&vaultStart>competitorsStart&&creator>vaultStart,'Creator DNA must live in Vault, not Analyse');
  assert.equal(index.includes('data-tab="compare"'),false);
  assert.equal(index.includes('data-dock="compare"'),false);
  const shortcutText=JSON.stringify(manifest.shortcuts||[]).toLowerCase();
  assert.equal(shortcutText.includes('compare'),false);
  assert.equal(manifest.start_url.includes('v=0379'),true);
});
