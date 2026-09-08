/** Monday Brief measurements. Missing data is null, never an invented zero. */
export const VERSION='0.33.0';
export const SECTIONS=['The strip','The summary','Key takeaways','Hook breakdown','Re-hooks','Payoffs','Most Replayed','What to reuse / avoid','Visuals','Motion graphics','Audio','Packaging','Channel context','Make it yours','Vault entry','Cross-check / Export','Full transcript'];
export const arr=x=>Array.isArray(x)?x:[];
export const clean=x=>String(x??'').replace(/\s+/g,' ').trim();
export const finite=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x));
export const norm=x=>clean(x).toLowerCase().replace(/[^\p{L}\p{N} ]/gu,'');
export const words=x=>clean(x).match(/[\p{L}\p{N}]+(?:['\u2019-][\p{L}\p{N}]+)*/gu)||[];
export function timestamp(x){const n=Math.max(0,Math.floor(Number(x)||0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}
export function dateMs(x){if(!x)return null;if(typeof x==='number')return x<1e12?x*1000:x;let s=String(x);if(/^\d{8}$/.test(s))s=s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8)+'T00:00:00Z';const n=Date.parse(s);return Number.isFinite(n)?n:null;}
export function median(xs){const a=xs.filter(finite).map(Number).sort((x,y)=>x-y);return a.length?(a[(a.length-1)>>1]+a[a.length>>1])/2:null;}
export function segments(r){const dur=Number(r?.video?.duration)||0;return arr(r?.transcript?.segments).map((s,i)=>({id:i,start:Number(s.start),end:finite(s.end)?Number(s.end):null,text:clean(s.text)})).filter(s=>s.text&&Number.isFinite(s.start)&&s.start>=0&&(!dur||s.start<dur)).sort((a,b)=>a.start-b.start);}
export function timedWords(r){
 const ss=segments(r),out=[],dur=Number(r?.video?.duration)||0;let prev=null;
 for(let i=0;i<ss.length;i++){
  const s=ss[i],tokens=words(s.text);let overlap=0;
  // Only rolling/overlapping caption windows can be de-duplicated. A later repeated sentence is speech, not a bug.
  if(prev&&prev.end!==null&&s.start<prev.end&&s.start-prev.start<45){
   for(let n=Math.min(300,out.length,tokens.length);n>=2;n--){if(tokens.slice(0,n).every((t,j)=>norm(t)===norm(out[out.length-n+j].text))){overlap=n;break;}}
  }
  const kept=tokens.slice(overlap),end=Math.min(dur||Infinity,s.end!==null&&s.end>s.start?s.end:ss[i+1]?.start>s.start?ss[i+1].start:s.start+Math.max(1,kept.length/3));
  const start=overlap&&prev?.end?s.start+(end-s.start)*overlap/Math.max(1,tokens.length):s.start;
  kept.forEach((text,j)=>out.push({text,time:start+(end-start)*(j+.5)/Math.max(1,kept.length),segment_id:s.id}));prev=s;
 }
 return out;
}
export function pace(r){
 const duration=Number(r?.video?.duration)||0,ws=timedWords(r),raw=duration>0?ws.length*60/duration:null;
 const bins=Array.from({length:Math.ceil(duration/60)},(_,i)=>({minute:i+1,start:i*60,seconds:Math.min(60,duration-i*60),words:0}));
 for(const w of ws){const b=bins[Math.min(bins.length-1,Math.floor(w.time/60))];if(b)b.words++;}
 const by_minute=bins.map(b=>({...b,wpm:Math.round(b.words*60/b.seconds*10)/10}));
 const suspect=raw!==null&&(raw>330||raw<20);
 return {word_count:ws.length,wpm:raw===null||suspect?null:Math.round(raw*10)/10,raw_wpm:raw,by_minute,duration,suspect,precision:'Caption-based estimate; words are allocated within each caption interval, not measured acoustic timing.'};
}
export function captionGap(r){const ss=segments(r);let best=null;for(let i=0;i<ss.length-1;i++){if(ss[i].end===null)continue;const gap=ss[i+1].start-ss[i].end;if(gap>0&&(!best||gap>best.seconds))best={start:ss[i].end,end:ss[i+1].start,seconds:gap};}return best;}
export function channelBaseline(r,channel,now=Date.now()){
 const target=r.video||{},seen=new Set(),rows=[];
 for(const x of arr(channel?.videos)){
  const id=x.video_id||x.id;if(!id||id===target.id||seen.has(id))continue;seen.add(id);
  const views=x.views??x.view_count??x.viewCount,uploaded=dateMs(x.upload_date||x.published_at||x.published),duration=x.duration??x.lengthSeconds;
  if(!finite(views)||Number(views)<0||x.is_short===true||(Number(target.duration)>=60&&finite(duration)&&Number(duration)<60))continue;
  if(uploaded!==null&&now-uploaded<48*3600000)continue;
  rows.push({...x,video_id:id,views:Number(views),uploaded});
 }
 rows.sort((a,b)=>(b.uploaded||0)-(a.uploaded||0));const sample=rows.slice(0,20),med=sample.length>=5?median(sample.map(x=>x.views)):null;
 const multiple=med>0&&finite(target.view_count)?Number(target.view_count)/med:null;
 return {median_views:med,multiple,sample_count:sample.length,videos:sample.map(x=>({...x,outlier_multiple:med>0?x.views/med:null})),method:'Up to 20 sampled uploads, excluding this video, known Shorts and known uploads younger than 48 hours.',age_matched:false,note:'Current cumulative views, not an age-matched growth comparison. Unknown upload ages remain flagged.',unknown_age_count:sample.filter(x=>x.uploaded===null).length};
}
export function enrich(r,iv,channel){
 const v=r.video||{},d=iv?.data||{};r.video=v;r.pulled_at=r.pulled_at||r.retrieved_at||new Date().toISOString();
 for(const [key,other] of [['channel_follower_count','subCount'],['like_count','likeCount'],['comment_count','commentCount'],['view_count','viewCount']]){if(!finite(v[key])&&finite(d[other]))v[key]=Number(d[other]);}
 if(!v.channel_id&&d.authorId)v.channel_id=d.authorId;if(d.author&&(!v.channel||v.channel.length<d.author.length))v.channel=d.author;
 r.title_observations=titleObservations(r,channel).observations;const b=channelBaseline(r,channel);r.brief_baseline=b;
 if(b.median_views!==null){v.outlier={...(v.outlier||{}),multiple:b.multiple,channel_median_views:b.median_views,quality:'sampled-current-views',sample_size:b.sample_count};channel.median_views=b.median_views;channel.videos=b.videos;}
 r.brief_pacing=pace(r);return r;
}
export function titleObservations(r,channel){
 const id=r?.video?.id,raw=[{title:r?.video?.title,source:'Video metadata',pulled_at:r.pulled_at||r.retrieved_at}];
 for(const x of arr(channel?.videos))if((x.video_id||x.id)===id)raw.push({title:x.title,source:'Channel listing',pulled_at:r.pulled_at||r.retrieved_at});
 raw.push(...arr(r.title_observations));const seen=new Set();const observations=raw.filter(x=>{const k=clean(x.title)+'|'+x.source;if(!clean(x.title)||seen.has(k))return false;seen.add(k);return true;});
 return {observations,variant_count:new Set(observations.map(x=>clean(x.title))).size,confirmed_test:false,explanation:'Different public titles can be an edit, cache lag or a test. Only creator-authorised experiment data can confirm a running title test.'};
}
export function replay(r){
 const hm=r.heatmap||{},raw=arr(hm.normalized_100),duration=Number(r?.video?.duration)||0;
 const points=raw.map((x,i)=>({time:finite(x?.time)?Number(x.time):duration*(i+.5)/Math.max(1,raw.length),value:typeof x==='number'?x:Number(x?.value??x?.intensity??x?.heat),index:i})).filter(x=>Number.isFinite(x.value)&&x.time>=0&&x.time<=duration);
 const extremum=kind=>{const hits=[];for(let i=1;i<points.length-1;i++){const a=points[i-1].value,b=points[i].value,c=points[i+1].value;if(kind==='peak'?(b>a&&b>=c):(b<a&&b<=c))hits.push(points[i]);}hits.sort((a,b)=>kind==='peak'?b.value-a.value:a.value-b.value);const chosen=[];for(const p of hits)if(chosen.every(x=>Math.abs(x.time-p.time)>=Math.max(5,duration*.04))){chosen.push(p);if(chosen.length===6)break;}return chosen.sort((a,b)=>a.time-b.time);};
 const supplied=arr(hm.top_peaks).filter(x=>finite(x.time)&&finite(x.value)).map(x=>({time:Number(x.time),value:Number(x.value)}));
 return {available:hm.available===true&&points.length>=3,points,peaks:supplied.length?supplied:extremum('peak'),troughs:extremum('trough'),reason:clean(hm.reason||hm.error)||'The public source did not return a usable curve. The precise reason was not exposed; no viewing threshold is assumed.'};
}
export function captionAt(r,t){const ss=segments(r);const x=ss.find(s=>s.start<=t&&(s.end??s.start+1)>t);if(x)return {...x,match:'covering caption interval'};const near=[...ss].sort((a,b)=>Math.abs(a.start-t)-Math.abs(b.start-t))[0];return near?{...near,match:'nearest caption; not an exact word-time match'}:null;}
export function mediaManifest(images,duration){
 const seen=new Set();return arr(images).filter(x=>{if(!x||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(x.image_url||'')||(x.image_url||'').length>220000)return false;if(x.kind!=='thumbnail'&&(!finite(x.seconds)||x.seconds<0||x.seconds>duration))return false;const id=clean(x.id);if(!id||seen.has(id))return false;seen.add(id);return true;}).slice(0,16).map(x=>({id:clean(x.id),kind:x.kind==='thumbnail'?'thumbnail':'storyboard',seconds:x.kind==='thumbnail'?null:Number(x.seconds),image_url:x.image_url}));
}
export function measurements(r){const p=pace(r),h=replay(r);return {pace:p,caption_gap:captionGap(r),replay:h,baseline:r.brief_baseline||null,pulled_at:r.pulled_at||r.retrieved_at||null};}
