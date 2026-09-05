(function(){
'use strict';
if(document.documentElement.dataset.yt280Focus==='1')return;
document.documentElement.dataset.yt280Focus='1';
const $=s=>document.querySelector(s);
const isYT=s=>/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)/i.test(String(s||''));
function clickTab(name){const b=$(`.tabs [data-tab="${name}"]`);if(b){b.click();return true}return false}
function setInput(sel,v){const i=$(sel);if(!i)return false;i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));return true}
function runVideo(url){let n=0,t=setInterval(()=>{n++;if($('#v27Form')&&clickTab('viral')){clearInterval(t);setTimeout(()=>{setInput('#v27Url',url);$('#v27Form')?.requestSubmit?.()},70)}else if(n>50){clearInterval(t);clickTab('analyse');setTimeout(()=>{setInput('#videoUrl',url);$('#analyseForm')?.requestSubmit?.()},80)}},80)}
function runTopic(q){clickTab('sprint');setTimeout(()=>{setInput('#sprintTopic',q);$('#sprintGo')?.click()},120)}
function patch(){const launch=$('#v21PublicLaunch');if(!launch||launch.dataset.v28Focus==='1')return false;launch.dataset.v28Focus='1';const eyebrow=launch.querySelector('.eyebrow'),h=launch.querySelector('h2'),p=launch.querySelector('.v21-public-top p'),input=$('#v21PublicInput'),go=$('#v21PublicGo');if(eyebrow)eyebrow.textContent='ONE INPUT · VIRAL VIDEO OR NICHE';if(h)h.textContent='Paste what is popping off. Build your version from the evidence.';if(p)p.textContent='Paste a breakout YouTube video to open Viral Forensics, or type your niche/topic to research what is working. The goal is a better next video, not another dashboard.';if(input)input.placeholder='Paste a breakout YouTube URL or type your niche';if(go)go.textContent='Research it →';const run=()=>{const q=input?.value.trim()||'';if(!q){input?.focus();return}if(isYT(q))runVideo(q);else runTopic(q)};if(go)go.onclick=run;if(input){input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();run()}},true)}const trust=launch.querySelector('.v21-trust');if(trust)trust.innerHTML='<span><b>Rewind moments</b><small>Public Most Replayed timestamps when YouTube exposes them.</small></span><span><b>Script DNA</b><small>Hook, re-hooks, WPM, payoffs and repeatable mechanics.</small></span><span><b>Niche Style Banks</b><small>Winner research compounds instead of disappearing.</small></span><span><b>Production handoff</b><small>Research becomes the next script blueprint and test.</small></span>';return true}
function init(){let n=0,t=setInterval(()=>{n++;if(patch()||n>60)clearInterval(t)},100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
