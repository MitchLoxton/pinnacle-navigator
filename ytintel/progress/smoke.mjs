import fs from 'node:fs';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
const shared=fs.readFileSync(new URL('./shared.js',import.meta.url),'utf8');
const ids=['view-hq','sharedHQ','view-today','view-week','view-sprint','view-proof','xpBar','todayScore','nextTitle','outcomeRings','timerBig','proofFeed','copyStatus'];
for(const id of ids){if(!html.includes(`id="${id}"`))throw new Error(`Missing required UI id: ${id}`)}
const gameContracts=['LEVEL_SIZE=250','function award(','function renderToday(','function renderWeek(','function renderProof(','function finishSprint(','localStorage.getItem(STORE)'];
for(const token of gameContracts){if(!js.includes(token))throw new Error(`Missing gamification contract: ${token}`)}
const sharedContracts=['ytintel_ops_join_workspace','ytintel_ops_dashboard','ytintel_ops_team','ytintel_ops_tasks','ytintel_ops_events','POLL_MS=15000','LIVE TOOL SYNC'];
for(const token of sharedContracts){if(!shared.includes(token))throw new Error(`Missing shared HQ contract: ${token}`)}
if(!html.includes('shared.js?v=1')||!html.includes('app.js?v=2'))throw new Error('Shared or gamified app bundle is not wired');
if((html.match(/data-tab=/g)||[]).length<5)throw new Error('Expected HQ + Today + Week + Sprint + Proof navigation');
console.log('Progress HQ smoke PASS: shared founder HQ, live tool sync, 5-tab gamification and persistence contracts present.');