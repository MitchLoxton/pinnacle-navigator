(function(){
const WORKER='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/ytintel-v07-probe';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const btn=document.querySelector('#batchBtn');if(!btn)return;
btn.onclick=async()=>{
 const urls=document.querySelector('#batchUrls').value.split(/\n+/).map(x=>x.trim()).filter(Boolean);if(urls.length<5||urls.length>10){showErr('#batchError',new Error('Pattern Mine is for 5–10 near-identical videos.'));return}
 clearErr('#batchError');document.querySelector('#batchRoot').innerHTML='';const load=document.querySelector('#batchLoad');load.classList.add('show');const snaps=[],failed=[];
 try{
  for(let i=0;i<urls.length;i++){
   load.textContent=`Analysing video ${i+1}/${urls.length} — keeping extraction serial so YouTube is not hammered…`;
   let report=null,lastErr='';for(let attempt=0;attempt<2&&!report;attempt++){if(attempt){load.textContent=`Retrying video ${i+1}/${urls.length} once…`;await sleep(2200)}try{const d=await api('analyze',{url:urls[i]});report=d.report}catch(e){lastErr=e?.message||String(e)}}
   if(report){snaps.push({video:report.video,pacing:report.pacing,hook:report.hook_framework,heatmap:report.heatmap,items:(report.content_extraction?.items||[]).slice(0,5)})}else failed.push({url:urls[i],error:lastErr});
   if(i<urls.length-1)await sleep(1600);
  }
  if(snaps.length<5)throw new Error(`Only ${snaps.length}/${urls.length} videos completed after retry. Pattern Mine refuses to invent a result from an incomplete set.`);
  load.textContent=`${snaps.length} videos extracted. Grouping same facts by meaning…`;
  const r=await fetch(WORKER,{method:'POST',headers:{'content-type':'application/json','x-ytintel-pattern':'web-v102'},body:JSON.stringify({snapshots:snaps})}),d=await r.json().catch(()=>({}));if(!r.ok||d.ok===false)throw new Error(d.error||`Pattern worker HTTP ${r.status}`);
  const p=d.pattern_mine_v10;if(failed.length){p.failures=failed;p.requested_count=urls.length;p.guardrails=[...(p.guardrails||[]),`${failed.length} source video(s) failed after retry; output uses ${snaps.length}/${urls.length} completed analyses.`]}
  renderPatternMine(p);
 }catch(e){showErr('#batchError',e)}finally{load.classList.remove('show');load.textContent='Analysing each transcript serially, then clustering claims by meaning…'}
};
})();