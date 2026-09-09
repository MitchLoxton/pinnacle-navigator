import assert from 'node:assert/strict';
const API='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/ytintel-v091';
const headers={'content-type':'application/json','x-ytintel-client':'web-v360'};
const health=await fetch(`${API}?action=health`);const h=await health.json();assert.equal(health.status,200);assert.equal(h.ok,true);assert.match(String(h.version),/^0\.36/);
const r=await fetch(`${API}?action=media`,{method:'POST',headers,body:JSON.stringify({url:'https://www.youtube.com/watch?v=GzhT10i4vag'})});const d=await r.json();
assert([200,502].includes(r.status),JSON.stringify(d));
if(r.status===200){assert.equal(d.ok,true);assert.equal(d.media.video_id,'GzhT10i4vag');assert(Array.isArray(d.media.replay_markers));assert(Array.isArray(d.media.streams?.audio));if(d.media.storyboards?.available){assert(Number(d.media.storyboards?.best?.count)>10);assert.notEqual(d.media.storyboard_probe?.ok,false,JSON.stringify(d.media.storyboard_probe))}}
else{assert.equal(d.ok,false);assert.match(String(d.error||''),/player|youtube|media|unavailable/i);assert(!d.media,'A failed player fetch must not fabricate media evidence')}
console.log(JSON.stringify({pass:true,version:h.version,media_status:r.status,storyboards:d.media?.storyboards?.available||false,storyboard_count:d.media?.storyboards?.best?.count||0,audio_streams:d.media?.streams?.audio?.length||0,replay_markers:d.media?.replay_markers?.length||0,limited:r.status!==200,error:d.error||null},null,2));
