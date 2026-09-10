import {STAGES,buildEvidence,validateStage,schemas,prompts,commonPrompt,arr,clean} from '../latest/v360-contract.mjs';
const BASE=Deno.env.get('SUPABASE_URL')||'',SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const MODEL=Deno.env.get('YTINTEL_RESEARCH_MODEL')||'gpt-5.6-sol';
const VERSION='0.36.0';
const CORS={'access-control-allow-origin':'*','access-control-allow-headers':'content-type,authorization,apikey,x-ytintel-run-token','access-control-allow-methods':'GET,POST,OPTIONS','cache-control':'no-store','content-type':'application/json'};
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:CORS});
const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const err=(code,status=500)=>Object.assign(new Error(code),{code,status});
async function db(path,method='GET',body){
 const r=await fetch(`${BASE}/rest/v1/${path}`,{method,headers:{apikey:SERVICE,authorization:`Bearer ${SERVICE}`,'content-type':'application/json',prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 const data=await r.json().catch(()=>null);if(!r.ok)throw err('RESEARCH_STORAGE_UNAVAILABLE',503);return data;
}
async function key(){const k=Deno.env.get('OPENAI_API_KEY')||Deno.env.get('OPENAI_KEY');if(k)return k;try{const r=await db('rpc/ytintel_get_openai_key','POST',{});return typeof r==='string'?r:''}catch{return ''}}
async function user(req){const a=req.headers.get('authorization');if(!a)return null;const r=await fetch(`${BASE}/auth/v1/user`,{headers:{apikey:SERVICE,authorization:a},signal:AbortSignal.timeout(10000)}),d=await r.json().catch(()=>({}));if(!r.ok||!d.id)throw err('SESSION_EXPIRED',401);return d.id;}
async function begin(req,b){
 const evidence=buildEvidence(b.report);
 if(!/^[A-Za-z0-9_-]{11}$/.test(evidence.video.id||'')||evidence.segments.length<2)throw err('TRANSCRIPT_REQUIRED',422);
 if(evidence.segments.map(s=>s.text).join(' ').length>240000)throw err('SOURCE_TOO_LONG_FOR_THIS_PASS',413);
 const k=await key();if(!k)throw err('API_KEY_MISSING',503);
 const id=await user(req),ip=req.headers.get('x-forwarded-for')?.split(',')[0]||req.headers.get('cf-connecting-ip')||'unknown';
 const quota=await db('rpc/ytintel_ai_take_quota','POST',{p_bucket:'deep36:'+await digest(id||ip),p_per_ip:id?5:2,p_global:25});
 if(!quota?.ok)throw err('RESEARCH_DAILY_LIMIT',429);
 const token=crypto.randomUUID()+crypto.randomUUID();
 const profile={};for(const k of ['niche','subniche','target_audience','brand_rules','channel_name'])profile[k]=clean(b.profile?.[k]).slice(0,k==='brand_rules'?8000:500);
 const rows=await db('ytintel_research_runs','POST',{token_hash:await digest(token),user_id:id,source_video_id:evidence.video.id,evidence,profile});
 await db(`ytintel_research_runs?expires_at=lt.${encodeURIComponent(new Date(Date.now()-86400000).toISOString())}`,'DELETE').catch(()=>{});
 return json({ok:true,run_id:rows[0].id,token,model:MODEL,budget_seconds:600,stages:STAGES,version:VERSION,benchmark:'premium-single-link-v036',expires_at:rows[0].expires_at});
}
async function readRun(req,b){
 if(!/^[a-f0-9-]{36}$/i.test(b.run_id||''))throw err('RUN_NOT_FOUND',404);
 const token=req.headers.get('x-ytintel-run-token')||'';if(token.length<30)throw err('RUN_ACCESS_DENIED',401);
 const rows=await db(`ytintel_research_runs?id=eq.${encodeURIComponent(b.run_id)}&limit=1`),r=rows[0];
 if(!r||r.token_hash!==await digest(token)||Date.parse(r.expires_at)<Date.now())throw err('RUN_EXPIRED_OR_DENIED',401);
 return r;
}
async function outputs(id){const rows=await db(`ytintel_research_stages?run_id=eq.${id}&order=attempt.asc`);const out={};for(const r of rows)if(r.status==='done')out[r.stage]=r.result;return {rows,out};}
function safeSources(j){const out=new Set;for(const o of j.output||[]){for(const s of o.action?.sources||[])if(s.url)out.add(s.url);for(const c of o.content||[])for(const a of c.annotations||[])if(a.url)out.add(a.url)}return out;}
async function model(stage,run,previous){
 const k=await key();if(!k)throw err('API_KEY_MISSING',503);
 const input=[{role:'system',content:[{type:'input_text',text:commonPrompt+'\n'+prompts[stage]}]},{role:'user',content:[{type:'input_text',text:JSON.stringify({evidence:{...run.evidence,media_images:arr(run.evidence.media_images).map(({image_url,...meta})=>meta)},creator_profile:stage==='claims'?undefined:run.profile,lead_plan:previous.plan||null,specialist_outputs:['review','final_review','remake'].includes(stage)?previous:undefined,revision_feedback:previous.review||null,media_limitations:'Images, if supplied, are sampled stills. Acoustic waveform analysis and creator title experiments are not verified. Never imply exhaustive original-frame inspection.'})}]}];
 const maxTokens=stage==='plan'?7000:['review','final_review'].includes(stage)?14000:20000;
 const body={model:MODEL,store:false,reasoning:{effort:'max'},max_output_tokens:maxTokens,text:{format:{type:'json_schema',name:'ytintel_'+stage,schema:schemas[stage],strict:true}},input};
 if(stage==='media'){for(const im of arr(run.evidence.media_images)){input[1].content.push({type:'input_text',text:JSON.stringify({image_id:im.id,kind:im.kind,seconds:im.seconds})},{type:'input_image',image_url:im.image_url,detail:'high'});}}
 if(stage==='claims'){body.tools=[{type:'web_search'}];body.max_tool_calls=6;body.include=['web_search_call.action.sources'];input[0].content[0].text+=' Search only public factual claims from the video. Never search for or disclose private creator-profile fields.';}
 let r,j;
 try{r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{authorization:`Bearer ${k}`,'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(125000)});j=await r.json();}catch(x){throw err(x?.name==='TimeoutError'||x?.name==='AbortError'?'MODEL_TIMEOUT':'PROVIDER_NETWORK_ERROR',504);}
 if(!r.ok){const code=String(j.error?.code||j.error?.type||'PROVIDER_ERROR').replace(/[^a-z0-9_]/gi,'').toUpperCase();throw err(code||'PROVIDER_ERROR',r.status===429?429:502);}
 if(j.status==='incomplete')throw err('MODEL_OUTPUT_INCOMPLETE',502);
 let text='';for(const o of j.output||[])for(const c of o.content||[])if(c.type==='output_text')text+=c.text||'';
 let data;try{data=JSON.parse(text||j.output_text||'')}catch{throw err('MODEL_OUTPUT_INVALID',502)}
 const checks=validateStage(stage,data,run.evidence);
 if(stage==='takeaways'&&previous.plan?.declared_count!=null&&data.items.length!==previous.plan.declared_count)checks.push({code:'DECLARED_LIST_INCOMPLETE',detail:'Lead researcher and takeaway count disagree.'});
 if(stage==='claims'){
  const allowed=safeSources(j);
  for(const c of data.claims){c.sources=arr(c.sources).filter(s=>allowed.has(s.url));if(['verified','contradicted'].includes(c.assessment)&&!c.sources.length){c.assessment='uncertain';c.reason+=' Independent web-source verification was not established on this pass.';}}
 }
 return {data,checks,model:j.model||MODEL,response_id:j.id||null,usage:j.usage||null,source:'model',fallback:false};
}
async function execute(req,b){
 const run=await readRun(req,b),stage=b.stage,attempt=Number(b.attempt)||0;
 if(b.action!=='state'&&(!STAGES.includes(stage)||![0,1].includes(attempt)))throw err('INVALID_STAGE',400);
 const p=await outputs(run.id);
 if(b.action==='state')return json({ok:true,version:VERSION,stages:p.rows.map(({stage,attempt,status,error_code,started_at,finished_at})=>({stage,attempt,status,error_code,started_at,finished_at}))});
 const needs=stage==='plan'?[]:['summary','takeaways','mechanics','claims','media'].includes(stage)?['plan']:stage==='review'?['summary','takeaways','mechanics','claims',...(arr(run.evidence.media_images).length?['media']:[])]:stage==='remake'?['summary','takeaways','mechanics','claims','review']:['summary','takeaways','mechanics','claims','review','remake'];
 if(needs.some(n=>!p.out[n]))throw err('DEPENDENCY_NOT_READY',409);
 if(['remake','final_review'].includes(stage)&&['summary','takeaways','mechanics','claims','review'].some(k=>p.out[k]?.checks?.length))throw err('EDITOR_REVIEW_NOT_PASSED',422);
 if(stage==='final_review'&&p.out.remake?.checks?.length)throw err('REMAKE_NOT_PASSED',422);
 const old=p.rows.find(x=>x.stage===stage&&x.attempt===attempt);
 if(old?.status==='done')return json({ok:true,...old.result,cached:true});
 if(old?.status==='failed')throw err(old.error_code||'STAGE_FAILED',502);
 if(old?.status==='running')return json({ok:true,pending:true},202);
 const acquired=await db('rpc/ytintel_research_claim','POST',{p_run:run.id,p_stage:stage,p_attempt:attempt});if(!acquired)return json({ok:true,pending:true},202);
 const path=`ytintel_research_stages?run_id=eq.${run.id}&stage=eq.${stage}&attempt=eq.${attempt}`;
 try{
  const previous=Object.fromEntries(Object.entries(p.out).map(([k,v])=>[k,v.data]));
  const result=await model(stage,run,previous);
  await db(path,'PATCH',{status:'done',result,provider_model:result.model,response_id:result.response_id,finished_at:new Date().toISOString()});
  return json({ok:true,...result});
 }catch(x){await db(path,'PATCH',{status:'failed',error_code:x.code||'RESEARCH_STAGE_FAILED',finished_at:new Date().toISOString()}).catch(()=>{});throw x;}
}
export async function handleResearch(req){
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:CORS});
 try{
  const action=(new URL(req.url).searchParams.get('action')||'research-health').replace(/^research-/, '');
  if(action==='health')return json({ok:true,version:VERSION,configured:!!await key(),model:MODEL,reasoning_effort:'max',fallback:false,quality_contract:'18-screen premium single-link benchmark + synthesis/receipt/coverage gates',stages:STAGES});
  if(req.method!=='POST')throw err('POST_REQUIRED',405);
  const raw=await req.text();if(raw.length>3500000)throw err('REQUEST_TOO_LARGE',413);let b;try{b=JSON.parse(raw)}catch{throw err('INVALID_JSON',400)}
  if(action==='begin')return await begin(req,b);
  if(action==='stage'||action==='state')return await execute(req,{...b,action});
  throw err('UNKNOWN_ACTION',404);
 }catch(x){const code=x.code||'RESEARCH_UNAVAILABLE';return json({ok:false,error:code,code,fallback:false,model:MODEL,version:VERSION},x.status||500);}
}
