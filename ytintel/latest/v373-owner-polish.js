(()=>{'use strict';
const $=s=>document.querySelector(s);let queued=false;
const nativeDispatch=window.dispatchEvent.bind(window);
window.dispatchEvent=function(event){if(event?.type==='ytintel:v363-premium-ready'&&event?.detail?.version==='0.38.0')return true;return nativeDispatch(event)};
function setText(el,value){if(el&&el.textContent!==value)el.textContent=value}
function patch(){queued=false;
 const hero=$('#analyse .hero');if(hero){setText(hero.querySelector('.eyebrow'),'YTINTEL · VIDEO INTELLIGENCE');setText(hero.querySelector('p'),'One winning video in. A source-backed watch replacement, retention breakdown, packaging read, channel context and a Creator-DNA blueprint out.');const b=hero.querySelector('.v360-media-banner');if(b){setText(b.querySelector('strong'),'YTIntel evidence engine');setText(b.querySelector('p'),'Public source evidence runs first. Recoverable storyboard and audio assets use the media-rescue path; optional on-device vision/audio can deepen them when your browser supports it.');const badges=b.querySelectorAll('.v360-badge');setText(badges[0],'17 sections');setText(badges[1],'real replay or labelled hypothesis');setText(badges[2],'rescued storyboard/audio');setText(badges[3],'optional local multimodal AI')}}
 const s2=$('#report [data-section="2"]');if(s2){for(const b of s2.querySelectorAll('b'))if(/What the argument actually comes down to/i.test(b.textContent||''))setText(b,'What appears to matter')}
 const creator=$('#creator');if(creator){const card=creator.querySelector('#creatorCard'),sign=creator.querySelector('#v361-signin-dna');if(card){card.hidden=false;card.style.removeProperty('display')}if(sign){sign.hidden=false;sign.style.removeProperty('display')}}
 const transcript=$('#v363-transcript'),s17=$('#report [data-section="17"]');if(transcript&&s17&&transcript.parentElement!==s17)s17.append(transcript);
}
function queue(){if(queued)return;queued=true;queueMicrotask(patch)}
function start(){const style=document.createElement('style');style.id='v373-owner-style';style.textContent='#creator #creatorCard,#creator #v361-signin-dna{display:block!important}#analyse #creatorCard,#analyse #v361-signin-dna{display:none!important}';document.head.append(style);new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true});patch();window.YTIntelOwnerPolish={version:'0.38.0',patch}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
