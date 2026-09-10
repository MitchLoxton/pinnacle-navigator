import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(path,'utf8');

test('v0.37.7 wires the automatic scene index through the shipped shell',async()=>{
  const [entry,index,sw,manifest,scene]=await Promise.all([
    read('ytintel/latest/v360-entry.js'),
    read('ytintel/latest/index.html'),
    read('ytintel/latest/sw.js'),
    read('ytintel/latest/manifest.webmanifest'),
    read('ytintel/latest/v377-scene-indexer.js')
  ]);
  assert.match(entry,/v377-scene-indexer\.js\?v=0377/);
  assert.match(entry,/const RELEASE='0\.37\.7'/);
  assert.match(index,/v0\.37\.7/);
  assert.match(index,/v360-entry\.js\?v=0377/);
  assert.match(sw,/ytintel-shell-v0377-r1/);
  assert.match(sw,/v377-scene-indexer\.js\?v=0377/);
  assert.match(manifest,/\?source=pwa&v=0377/);
  assert.doesNotMatch(manifest,/Compare Winners/i);
  assert.match(scene,/const VERSION='0\.37\.7'/);
});

test('scene indexer provides practical long-footage ingestion + searchable virtual clips',async()=>{
  const scene=await read('ytintel/latest/v377-scene-indexer.js');
  for(const marker of [
    'Automatic Scene Index',
    'MAX_SAMPLES=480',
    'MAX_VIRTUAL_SCENE=75',
    'MIN_VIRTUAL_SCENE=10',
    'rgb-histogram-adaptive-v1',
    'private scene thumbnails',
    'Find footage from a commentary script',
    'Use current Analyse',
    'Copy clip recipe',
    'uploaded and banked',
    'ytintel_creator_scenes',
    'localAI.analyzeFrame',
    'window.YTIntelSceneIndex'
  ]) assert.match(scene,new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),`missing ${marker}`);
});

test('scene index schema is private per user and indexed for search',async()=>{
  const sql=await read('ytintel/backend/migrations/20260910_creator_scene_index.sql');
  assert.match(sql,/create table if not exists public\.ytintel_creator_scenes/i);
  assert.match(sql,/enable row level security/i);
  assert.match(sql,/auth\.uid\(\) = user_id/i);
  assert.match(sql,/unique\(user_id, asset_id, scene_index\)/i);
  assert.match(sql,/using gin\(tags\)/i);
  assert.match(sql,/to_tsvector\('english', search_text\)/i);
});
