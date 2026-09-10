import * as base from './v310-contract.mjs';

export const VERSION='0.36.0';
export const STAGES=base.STAGES;
export const buildEvidence=base.buildEvidence;
export const evidenceRef=base.evidenceRef;
export const stamp=base.stamp;
export const copyRatio=base.copyRatio;
export const clean=base.clean;
export const arr=base.arr;
export const norm=base.norm;

const clone=x=>JSON.parse(JSON.stringify(x));
export const schemas=clone(base.schemas);
schemas.claims.properties.claims.maxItems=20;
schemas.remake.properties.directions.items.properties.beat_sheet.minItems=5;

const wc=x=>clean(x).split(/\s+/).filter(Boolean).length;
export function validateStage(stage,data,e){
  const issues=[...base.validateStage(stage,data,e)];
  const add=(code,detail)=>issues.push({code,detail});
  if(stage==='summary'&&data){
    const n=wc(data.summary);
    if(n<130)add('PREMIUM_SUMMARY_TOO_SHORT',`Synopsis is ${n} words; premium target is at least 130.`);
    if(n>320)add('PREMIUM_SUMMARY_TOO_LONG',`Synopsis is ${n} words; keep the synopsis focused and put chronology in the beat map.`);
    for(const [i,b] of arr(data.beats).entries())if(wc(b.meaning)<22)add('PREMIUM_BEAT_TOO_THIN',`Summary beat ${i+1} needs more explanation of what changed and why it matters.`);
  }
  if(stage==='takeaways'&&data){
    for(const [i,x] of arr(data.items).entries()){
      if(wc(x.explanation)<40)add('PREMIUM_TAKEAWAY_TOO_THIN',`Takeaway ${i+1} needs mechanism/significance, not a caption paraphrase.`);
      if(wc(x.application)<12)add('PREMIUM_APPLICATION_TOO_THIN',`Takeaway ${i+1} needs a concrete way to use or test the lesson.`);
    }
  }
  if(stage==='mechanics'&&data){
    if(wc(data.hook?.why)<25)add('PREMIUM_HOOK_REASON_TOO_THIN','Explain why the opening works as a system, not just label the hook type.');
    for(const [i,x] of arr(data.rehooks).entries())if(wc(x.why)<18)add('PREMIUM_REHOOK_TOO_THIN',`Re-hook ${i+1} needs the new question/stakes/contrast it creates.`);
    for(const [i,x] of arr(data.payoffs).entries())if(wc(x.why)<18)add('PREMIUM_PAYOFF_TOO_THIN',`Payoff ${i+1} needs to state exactly which earlier promise it pays.`);
    if(arr(data.funnel?.selling_sections).length&&wc(data.funnel?.interpretation)<45)add('PREMIUM_FUNNEL_TOO_THIN','Commercial/funnel read must explain how teaching, proof and selling are sequenced.');
  }
  if(stage==='claims'&&data){
    for(const [i,x] of arr(data.claims).entries())if(wc(x.reason)<18)add('PREMIUM_CLAIM_REASON_TOO_THIN',`Claim ${i+1} needs a useful verdict explanation.`);
  }
  if(stage==='remake'&&data){
    for(const [i,x] of arr(data.directions).entries()){
      if(arr(x.beat_sheet).length<5)add('PREMIUM_REMAKE_BEATS_TOO_THIN',`Direction ${i+1} needs at least five executable beats.`);
      if(wc(x.steal)<25)add('PREMIUM_STEAL_TOO_THIN',`Direction ${i+1} must explain the transferable mechanism.`);
      if(wc(x.avoid)<18)add('PREMIUM_AVOID_TOO_THIN',`Direction ${i+1} must explain what not to copy.`);
    }
  }
  return issues;
}

export const commonPrompt=base.commonPrompt+`\n\nPREMIUM BENCHMARK STANDARD (v0.36): Match the depth and usefulness of the Blake Ryan benchmark analysis, but NEVER copy its facts, numbers, niche conclusions, GTA/Nooky recommendations or wording into another video. The benchmark is a quality bar only. The creator should be able to skip watching the source. Be chronological, specific and evidence-heavy. Long output is allowed when the source supports it; do not pad missing evidence. Every interpretation must stay separate from exact receipts. The full report follows an 18-screen contract: strip; summary; takeaways; hook; re-hooks; payoffs; Most Replayed; structure map; visuals; motion graphics; audio; packaging; numbers table; claims ledger; channel context; make it yours; vault entry; export/method+limits.`;

export const prompts={...base.prompts,
  plan:`Act as YTIntel's lead researcher. Read the entire transcript and build a source-specific plan for a premium watch-replacement report. Identify whether the source promises a numbered list and its exact declared count, otherwise null. Your questions must force the specialists to explain: the real thesis; chronological structure; proof/receipt moments; re-hooks/payoffs; commercial funnel; consequential claims; title-versus-delivery; and what can transfer into the user's own creator context. Never ask generic coaching questions.`,
  summary:`Write the premium Section 2 watch replacement. First write a 130-260 word synopsis that explains what the video actually is, the central thesis, the mechanism, the examples/proof, the outcome, contradictions/limits that materially change the read, and the sales agenda when relevant. Then give 10-15 chronological beat lines spanning the whole runtime. Each beat should normally be 22-60 words and explain what happens, why that beat exists and how the argument changes; anchor every beat to a real start_segment. This is analysis, not transcript sampling. Convert first-person narration into third-person explanation. End with one cautious performance verdict against the available channel baseline and upload age; if baseline/age is insufficient, say so. Do not assert causation from views.`,
  takeaways:`Write premium Section 3. Give 5-8 independent lessons, or every member of the source's declared list in source order. For facts/news videos, give the actual key facts plus significance rather than invented instructions. Each item needs: a concise lesson title; a 40-100 word mechanism/significance explanation; a 12-35 word practical application or test; and 1-4 exact source receipts. Heading, explanation, application and receipts must do different jobs. Remove transcript echo, biography and generic advice. Preserve uncertainty and do not invent missing list members.`,
  mechanics:`Analyse premium Sections 4-6 plus transferable mechanics for Section 16. Cover EVERY available caption segment whose start is inside the first 60 seconds and give each a precise job. Explain the overall hook system in at least 25 words, including the first promise and proof/receipt sequencing. Across the full runtime identify every distinct attention reset that materially changes the viewer's question, stakes, contrast, proof state or section; explain each in 18-60 words. List payoffs chronologically and state which earlier promise each pays. Distinguish promises, creator claims, arithmetic, visible proof and independent verification. Build a detailed funnel read: selling intervals, CTA receipts, first sell, demo/cross-promo periods and how proof is used to make the sale feel earned. Do not infer a dashboard or visual from speech alone.`,
  claims:`Write premium Section 14. Extract and assess up to 20 of the most consequential numerical or checkable factual claims, prioritising every meaningful number plus claims that change the viewer's decision. Use web search for current public facts and attach direct sources. Assess each as creator_claim, verified, contradicted, arithmetic_issue, uncertain or inference. Explain the verdict in at least 18 useful words. Private revenue/RPM/dashboard assertions remain creator_claim unless genuinely independently supported. Arithmetic can be checked separately from the premise feeding it. A title discrepancy is not proof of an A/B test. Do not use memory as verification.`,
  remake:`Write premium Section 16: 2-3 materially different original directions tailored to the supplied Creator DNA. This is the prescriptive endgame: the output is the video to make. Each direction needs one primary title plus 2-3 alternates, a fully spoken opening hook, a 5-10 beat executable plan, an executable thumbnail composition, 2-4 exact source receipts that justify the transferable mechanics, a 25-90 word “steal” explanation, an 18-70 word “do not copy” explanation, and 2-5 post-publish measurements. Make the directions genuinely different in angle/format, not title rewrites of the same idea. Never copy competitor wording, private numbers, personal story, unsupported claims or borrowed-IP assumptions. Separate public outcomes from creator-only Studio metrics.`,
  review:`You are the independent premium editor. Audit against the source and the v0.36 benchmark standard. Score summary, takeaway quality and source fidelity from 0-5. Pass only if all are at least 4, there are no blockers, the summary spans the whole runtime, takeaways are synthesized rather than echoed, first-minute mechanics coverage is complete, claims distinguish creator assertion from verification, funnel intent is not buried, and missing media stays explicitly missing. Also reject output that is technically valid but materially thinner than the benchmark where evidence exists. Give precise fixes, never praise.`,
  final_review:`Perform the final premium audit of source, summary, takeaways, mechanics, claims, remake and evidence limitations. Apply the same 0-5 gates. Especially reject: a short generic summary; thin takeaways; missing first-minute caption coverage; omitted consequential numbers; unsupported causal claims; copied titles/hooks; generic remake beat sheets; invented private metrics; fake title-test certainty; or visual/audio claims outside supplied evidence. Pass only when the report can credibly replace watching the source and the remake is executable inside Creator DNA.`
};

prompts.media=`Inspect ONLY supplied input images for the premium visual sections. Read the thumbnail composition, visible subjects, legible text, authority/attention props and implied promise. For every supplied storyboard/sample image, describe what is visibly on screen using the exact image_id and seconds. Record visible text overlays, B-roll candidates and composition-change candidates. Connect verified sampled visuals to replay peaks when their timestamps actually overlap. Stills cannot prove continuous zooms, transitions, cuts, music, silence, animation or anything between samples. State the sampling/coverage limit explicitly and never invent an unseen dashboard number or frame.`;
