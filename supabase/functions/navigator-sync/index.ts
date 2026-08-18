import { createClient } from 'npm:@supabase/supabase-js@2.95.0'

const PROJECT_ID='mundi-pos1'
const PEOPLE=['me','ronan','colin'] as const
const corsHeaders={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type, apikey','Access-Control-Allow-Methods':'POST, OPTIONS'}
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store'}})}
async function sha256(value:string){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('')}
function adminClient(){const secretKeys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');const secretKey=secretKeys['default']||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(!secretKey)throw new Error('Server configuration error');return createClient(Deno.env.get('SUPABASE_URL')!,secretKey,{auth:{persistSession:false,autoRefreshToken:false}})}
function isTaskId(v:unknown){return v===null||(typeof v==='string'&&/^T(?:0[1-9]|1[0-9]|2[0-9])$/.test(v))}
function validatePersonMap(v:unknown){if(!v||typeof v!=='object'||Array.isArray(v))return false;const x=v as Record<string,unknown>;return PEOPLE.every(p=>isTaskId(x[p]))}
function validateState(v:unknown){
  if(!v||typeof v!=='object'||Array.isArray(v))return 'State must be an object'
  let encoded='';try{encoded=JSON.stringify(v)}catch{return 'State is not serializable'}
  if(encoded.length>300_000)return 'State payload is too large'
  const s=v as Record<string,any>
  for(const key of ['done','skipped']){if(!Array.isArray(s[key])||s[key].some((x:any)=>!isTaskId(x)||x===null))return `Invalid ${key}`;if(new Set(s[key]).size!==s[key].length)return `Duplicate ${key}`}
  const done=new Set<string>(s.done||[]),skipped=new Set<string>(s.skipped||[]),closed=new Set<string>([...done,...skipped])
  for(const id of done)if(skipped.has(id))return 'A task cannot be both done and skipped'
  for(const key of ['assignments','startedByPerson','lastTaskByPerson'])if(!validatePersonMap(s[key]))return `Invalid ${key}`
  if(s.activeTaskId!==undefined&&!isTaskId(s.activeTaskId))return 'Invalid activeTaskId'
  if(s.autoTeamFlow!==undefined&&typeof s.autoTeamFlow!=='boolean')return 'Invalid autoTeamFlow'
  if(!s.holds||typeof s.holds!=='object'||Array.isArray(s.holds))return 'Invalid holds'
  for(const [id,hold] of Object.entries(s.holds)){if(!isTaskId(id))return 'Invalid hold task';if(closed.has(id))return 'A closed task cannot also be blocked';if(hold&&typeof hold==='object'&&String((hold as any).reason||'').length>500)return 'Hold reason is too long'}
  for(const p of PEOPLE){const assigned=s.assignments[p] as string|null,started=s.startedByPerson[p] as string|null;if(started&&assigned!==started)return `Started task must remain assigned to ${p}`;if(assigned&&closed.has(assigned))return `Closed task cannot remain assigned to ${p}`;if(started&&closed.has(started))return `Closed task cannot remain started by ${p}`;if(assigned&&s.holds[assigned])return `Blocked task cannot remain assigned to ${p}`;if(started&&s.holds[started])return `Blocked task cannot remain started by ${p}`}
  const a=s.assignments;if(a.colin&&(a.colin===a.me||a.colin===a.ronan))return 'Colin cannot share a worker task assignment'
  if(s.activity!==undefined&&(!Array.isArray(s.activity)||s.activity.length>1000))return 'Invalid activity'
  if(s.history!==undefined&&(!Array.isArray(s.history)||s.history.length>1000))return 'Invalid history'
  if(s.legacyWork!==undefined&&(!Array.isArray(s.legacyWork)||s.legacyWork.length>250))return 'Invalid legacyWork'
  if(s.pairAssignments!==undefined&&(!s.pairAssignments||typeof s.pairAssignments!=='object'||Array.isArray(s.pairAssignments)))return 'Invalid pairAssignments'
  return null
}
function sameState(a:unknown,b:unknown){try{return JSON.stringify(a)===JSON.stringify(b)}catch{return false}}
async function checkPin(admin:ReturnType<typeof adminClient>,projectId:string,pin:string){if(projectId!==PROJECT_ID||!/^\d{6}$/.test(pin)){await new Promise(r=>setTimeout(r,550));return false}const pinHash=await sha256(pin);const{data,error}=await admin.from('navigator_access').select('project_id').eq('project_id',projectId).eq('pin_hash',pinHash).maybeSingle();if(error)throw error;if(!data)await new Promise(r=>setTimeout(r,550));return!!data}
async function snapshot(admin:ReturnType<typeof adminClient>,projectId:string,data:any){try{await admin.from('navigator_state_snapshots').upsert({project_id:projectId,version:data.version,state:data.state,updated_by:data.updated_by||null,created_at:data.updated_at||new Date().toISOString()},{onConflict:'project_id,version'})}catch(error){console.warn('snapshot_failed',error)}}
async function validSnapshotFallback(admin:ReturnType<typeof adminClient>,projectId:string){const{data,error}=await admin.from('navigator_state_snapshots').select('state,version,updated_by,created_at').eq('project_id',projectId).order('version',{ascending:false}).limit(50);if(error||!data)return null;for(const row of data)if(!validateState(row.state))return row;return null}
async function repairInvalidLiveState(admin:ReturnType<typeof adminClient>,projectId:string,current:any,reason:string){
  const fallback=await validSnapshotFallback(admin,projectId);if(!fallback)return null
  const now=new Date().toISOString();const nextVersion=Number(current.version)+1
  const{data,error}=await admin.from('navigator_project_state').update({state:fallback.state,version:nextVersion,updated_by:'Navigator recovery',updated_at:now}).eq('project_id',projectId).eq('version',current.version).select('state,version,updated_by,updated_at').maybeSingle()
  if(error){console.error('state_repair_failed',error);return null}
  if(data){console.warn('state_repaired',{reason,from_version:current.version,snapshot_version:fallback.version,to_version:data.version});await snapshot(admin,projectId,data);return data}
  const{data:latest,error:latestError}=await admin.from('navigator_project_state').select('state,version,updated_by,updated_at').eq('project_id',projectId).single();if(latestError||validateState(latest.state))return null;return latest
}
function perthDate(){const f=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Perth',year:'numeric',month:'2-digit',day:'2-digit'}),p:any={};for(const x of f.formatToParts(new Date()))if(x.type!=='literal')p[x.type]=x.value;return `${p.year}-${p.month}-${p.day}`}
function actorKey(updatedBy:string){const x=String(updatedBy||'').trim().toLowerCase();if(x==='mitchell'||x==='me')return 'me';if(x==='ronan')return 'ronan';if(x==='colin')return 'colin';return ''}
async function completionPreflightViolation(admin:ReturnType<typeof adminClient>,projectId:string,currentState:any,taskIds:string[],updatedBy:string){
  const unique=[...new Set(taskIds.filter((x:string)=>/^T(?:0[1-9]|1[0-9]|2[0-9])$/.test(x)))]
  if(!unique.length)return null
  const[{data:rule,error:ruleErr},{data:doc,error:docErr}]=await Promise.all([
    admin.from('navigator_workshop_rules').select('rule_config,is_active,rule_version').eq('project_id',projectId).maybeSingle(),
    admin.from('navigator_project_document_status').select('plan_source_id,current_revision').eq('project_id',projectId).maybeSingle()
  ])
  if(ruleErr)throw ruleErr;if(docErr)throw docErr
  if(!rule?.is_active)return null
  const config:any=rule.rule_config||{},fabrication:string[]=Array.isArray(config.fabrication_tasks)?config.fabrication_tasks:[],requiredPeople:string[]=Array.isArray(config.required_for_people)?config.required_for_people:['me','ronan']
  const gated=unique.filter(id=>fabrication.includes(id));if(!gated.length)return null
  const workDate=perthDate(),sourceId=String(doc?.plan_source_id||''),{data:checks,error:checkErr}=await admin.from('navigator_preflight_checks').select('person_key,task_id,status,source_id,confirmed_at').eq('project_id',projectId).eq('work_date',workDate).in('task_id',gated).in('person_key',requiredPeople)
  if(checkErr)throw checkErr
  const passed=(taskId:string,p:string)=>!!(checks||[]).find((c:any)=>String(c.task_id)===taskId&&String(c.person_key)===p&&c.status==='passed'&&(!sourceId||String(c.source_id||'')===sourceId))
  const fallbackActor=actorKey(updatedBy)
  for(const taskId of gated){
    let involved=requiredPeople.filter(p=>String(currentState?.assignments?.[p]||'')===taskId||String(currentState?.startedByPerson?.[p]||'')===taskId)
    if(!involved.length&&requiredPeople.includes(fallbackActor))involved=[fallbackActor]
    if(involved.length){const missing=involved.filter(p=>!passed(taskId,p));if(missing.length)return{taskId,missing,involved,workDate,sourceId,revision:String(doc?.current_revision||'current IFC'),ruleVersion:String(rule.rule_version||'')}}
    else if(!requiredPeople.some(p=>passed(taskId,p)))return{taskId,missing:requiredPeople,involved:[],workDate,sourceId,revision:String(doc?.current_revision||'current IFC'),ruleVersion:String(rule.rule_version||'')}
  }
  return null
}
function completionError(v:any){const names=(v.missing||[]).map((p:string)=>p==='me'?'Mitchell':p==='ronan'?'Ronan':p).join(' + ');return `STOP — ${v.taskId} cannot be marked DONE yet. ${names||'A worker'} must pass today's CHECK SETUP against ${v.revision||'the current IFC'} first. Reopen ${v.taskId}, complete CHECK SETUP, then confirm the whole task is complete.`}
Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});if(req.method!=='POST')return json({error:'Method not allowed'},405)
  try{
    const raw=await req.text();if(raw.length>350_000)return json({error:'Request too large'},413)
    let body:any;try{body=JSON.parse(raw)}catch{return json({error:'Invalid JSON'},400)}
    const projectId=String(body.projectId||''),pin=String(body.pin||''),operation=String(body.operation||'');const admin=adminClient();if(!(await checkPin(admin,projectId,pin)))return json({error:'Incorrect crew PIN'},401)
    if(operation==='get'){
      const{data,error}=await admin.from('navigator_project_state').select('state,version,updated_by,updated_at').eq('project_id',projectId).single();if(error)return json({error:'Could not load shared state'},500)
      const stateError=validateState(data.state);if(!stateError)return json({ok:true,...data})
      console.error('invalid_live_state',stateError);const repaired=await repairInvalidLiveState(admin,projectId,data,stateError);if(!repaired)return json({error:'Shared state failed integrity check; recovery snapshot unavailable'},500)
      return json({ok:true,...repaired,recovered:true})
    }
    if(operation==='validate_completion'){
      const taskId=String(body.taskId||''),updatedBy=String(body.updatedBy||'Unknown').replace(/[<>]/g,'').slice(0,40);if(!/^T(?:0[1-9]|1[0-9]|2[0-9])$/.test(taskId))return json({error:'Invalid task'},400)
      const{data:current,error}=await admin.from('navigator_project_state').select('state,version').eq('project_id',projectId).single();if(error)return json({error:'Could not load current shared state'},500)
      const violation=await completionPreflightViolation(admin,projectId,current.state,[taskId],updatedBy);if(violation)return json({error:completionError(violation),code:'preflight_required',taskId:violation.taskId,missingPeople:violation.missing,workDate:violation.workDate,sourceId:violation.sourceId},409)
      return json({ok:true,allowed:true,taskId,version:current.version})
    }
    if(operation==='save'){
      const expectedVersion=Number(body.version),updatedBy=String(body.updatedBy||'Unknown').replace(/[<>]/g,'').slice(0,40),nextState=body.state
      if(!Number.isInteger(expectedVersion)||expectedVersion<1)return json({error:'Invalid save version'},400)
      const stateError=validateState(nextState);if(stateError){console.warn('invalid_client_state',{updatedBy,stateError});return json({error:stateError},400)}
      const{data:current,error:readError}=await admin.from('navigator_project_state').select('state,version,updated_by,updated_at').eq('project_id',projectId).single();if(readError)return json({error:'Could not load current shared state'},500)
      const currentStateError=validateState(current.state)
      if(currentStateError){const repaired=await repairInvalidLiveState(admin,projectId,current,currentStateError);if(!repaired)return json({error:'Shared state integrity check failed and automatic recovery was unavailable'},500);return json({error:'version_conflict',state:repaired.state,version:repaired.version,updated_by:repaired.updated_by,updated_at:repaired.updated_at,recovered:true},409)}
      if(current.version!==expectedVersion){
        if(sameState(current.state,nextState))return json({ok:true,...current,unchanged:true,conflict_avoided:true})
        return json({error:'version_conflict',state:current.state,version:current.version,updated_by:current.updated_by,updated_at:current.updated_at},409)
      }
      if(sameState(current.state,nextState))return json({ok:true,...current,unchanged:true})
      const beforeDone=new Set<string>(Array.isArray(current.state?.done)?current.state.done:[]),addedDone=(Array.isArray(nextState?.done)?nextState.done:[]).filter((id:string)=>!beforeDone.has(id))
      if(addedDone.length){const violation=await completionPreflightViolation(admin,projectId,current.state,addedDone,updatedBy);if(violation){console.warn('completion_blocked_preflight',{updatedBy,taskId:violation.taskId,missing:violation.missing,workDate:violation.workDate,sourceId:violation.sourceId});return json({error:completionError(violation),code:'preflight_required',taskId:violation.taskId,missingPeople:violation.missing,workDate:violation.workDate,sourceId:violation.sourceId},409)}}
      const now=new Date().toISOString();const{data,error}=await admin.from('navigator_project_state').update({state:nextState,version:expectedVersion+1,updated_by:updatedBy,updated_at:now}).eq('project_id',projectId).eq('version',expectedVersion).select('state,version,updated_by,updated_at').maybeSingle();if(error)return json({error:'Could not save shared state'},500)
      if(!data){const{data:latest,error:latestError}=await admin.from('navigator_project_state').select('state,version,updated_by,updated_at').eq('project_id',projectId).single();if(latestError)return json({error:'Version conflict'},409);if(sameState(latest.state,nextState))return json({ok:true,...latest,unchanged:true,conflict_avoided:true});return json({error:'version_conflict',...latest},409)}
      await snapshot(admin,projectId,data);return json({ok:true,...data})
    }
    return json({error:'Unknown operation'},400)
  }catch(error){console.error('navigator-sync',error);return json({error:'Navigator server error'},500)}
})