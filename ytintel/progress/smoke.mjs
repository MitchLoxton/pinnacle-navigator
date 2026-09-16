import fs from 'node:fs';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
const ids=['view-today','view-week','view-sprint','view-proof','xpBar','todayScore','nextTitle','outcomeRings','timerBig','proofFeed','copyStatus'];
for(const id of ids){if(!html.includes(`id="${id}"`))throw new Error(`Missing required UI id: ${id}`)}
const contracts=['LEVEL_SIZE=250','function award(','function renderToday(','function renderWeek(','function renderProof(','function finishSprint(','localStorage.getItem(STORE)'];
for(const token of contracts){if(!js.includes(token))throw new Error(`Missing gamification contract: ${token}`)}
if(!html.includes('app.js?v=2'))throw new Error('Gamified app bundle is not wired');
console.log('Progress HQ smoke PASS: 4 tabs, XP, score, sprint, proof and persistence contracts present.');