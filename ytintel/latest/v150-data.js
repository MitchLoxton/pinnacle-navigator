(function(){
'use strict';
const VERSION='0.16.0';
const KEYS=['ytintel-v120-radar-history','ytintel-v140-market-memory','ytintel-v09-history','ytintel-v121-package-history','ytintel-v140-watchlist','ytintel-v140-active-query','ytintel-v150-experiments','ytintel-v160-smart-history','ytintel-draft-video','ytintel-draft-similar','ytintel-draft-channel','ytintel-draft-batch','ytintel-draft-radar','ytintel-draft-package'];
function toast(s){if(typeof window.YTIntelToast==='function')window.YTIntelToast(s)}
function exportAll(){const data={schema:'ytintel-research-os-backup',version:VERSION,exported_at:new Date().toISOString(),stores:{}};for(const k of KEYS)data.stores[k]=localStorage.getItem(k);const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=`ytintel-full-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);toast('Full YTIntel backup exported.')}
async function importAll(file){try{const data=JSON.parse(await file.text());if(data?.schema!=='ytintel-research-os-backup'||!data?.stores)throw Error('Not a YTIntel Research OS backup.');let restored=0;for(const [k,v] of Object.entries(data.stores)){if(v!=null&&KEYS.includes(k)){localStorage.setItem(k,String(v));restored++}}toast(`Restored ${restored} YTIntel data stores.`);setTimeout(()=>location.reload(),500)}catch(e){toast(e?.message||String(e))}}
document.addEventListener('click',e=>{const b=e.target.closest?.('#osExport');if(!b)return;e.preventDefault();e.stopImmediatePropagation();exportAll()},true);
document.addEventListener('change',e=>{const i=e.target.closest?.('#osImport');if(!i)return;e.preventDefault();e.stopImmediatePropagation();const f=i.files?.[0];if(f)importAll(f)},true);
})();
