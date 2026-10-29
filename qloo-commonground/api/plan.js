/* CommonGround: request-driven agent orchestrator.
 * Qloo is the only source of live candidates. No LLM hallucinations or fake affinities.
 * Demo mode is explicitly labeled synthetic and never represented as Qloo output.
 */
'use strict';
const BASE='https://hackathon.api.qloo.com';
const VALID_TYPES=new Set(['movie','artist','place','book','destination']);
const OPTIONS={
 movie:[['A Door to Tomorrow','A fictional cinematic story that balances adventure with emotional depth.'],['The Paper Moon Club','An imaginary film about finding beauty in the unexpected.'],['Parallel Roads','A fictional journey combining wonder and human connection.'],['After the Stars','An imagined evening-friendly story of discovery.']],
 artist:[['The Velvet Atlas','A fictional artist exploring atmospheric music and memorable hooks.'],['Juniper Echo','An imaginary act blending intimate songwriting with expansive sound.'],['North & Noon','A sample artist combining upbeat rhythm with reflective melodies.'],['Neon Letters','A fictional sound that travels between calm and energetic.']],
 place:[['The Lantern Room','An imaginary welcoming spot for music, conversation, and good company.'],['Kinship Coffee','A fictional neighborhood café balancing coziness and creative energy.'],['The Green Terrace','A sample gathering space with room to talk and explore.'],['Side Street Social','An imaginary laid-back venue for a memorable evening.']],
 book:[['The City of Small Wonders','A fictional novel of imagination, relationships, and discovery.'],['All the Ways We Wander','An imaginary story combining intriguing ideas and heartfelt characters.'],['Ordinary Magic','A fictional book about surprising connections.'],['The Last Postcard','An imagined character-led mystery with a warm heart.']],
 destination:[['Harbor of Stories','A fictional cultural escape with music, galleries, and quiet corners.'],['The Amber Quarter','An imaginary walkable district for food and discovery.'],['Juniper Coast','A sample destination mixing nature, art, and hidden finds.'],['Lantern Valley','A fictional getaway balancing energy and peaceful moments.']]
};
function pieces(x){return String(x||'').split(',').map(s=>s.trim()).filter(Boolean).slice(0,3)}
function normalized(x){return String(x||'').toLowerCase().replace(/[^a-z0-9 ]/g,'').trim()}
function parseSearch(json){
 const buckets=[json?.results?.entities,json?.results,json?.entities,json?.data?.results,json?.data?.entities];
 let list=buckets.find(Array.isArray)||[];
 if(!list.length && json?.results && !Array.isArray(json.results))list=Object.values(json.results).flatMap(x=>Array.isArray(x)?x:[]);
 return list.map(x=>x?.entity||x).filter(Boolean).map(x=>({id:x.entity_id||x.id||x.qloo_id||'',name:x.name||x.properties?.name||x.title||'',type:x.type||x.entity_type||''})).filter(x=>x.id&&x.name);
}
function parseInsights(json){let list=json?.results?.entities||json?.results||json?.entities||[];if(!Array.isArray(list))list=[];return list.map((x,i)=>{const q=x.query||{};const tags=(x.tags||x.properties?.tags||[]).slice?.(0,5)||[];return {id:String(x.entity_id||x.id||''),name:x.name||x.properties?.name||x.title||'',affinity:Number(q.affinity??x.affinity??0),tags:tags.map(t=>typeof t==='string'?t:(t.name||t.label||'')).filter(Boolean),explainability:q.explainability||null,rank:i}}).filter(x=>x.id&&x.name)}
async function qloo(path,params){
 const url=new URL(path,BASE);Object.entries(params).forEach(([key,value])=>{if(value!==undefined&&value!==null&&String(value).trim())url.searchParams.set(key,String(value))});
 const response=await fetch(url,{headers:{'X-Api-Key':process.env.QLOO_API_KEY,'Accept':'application/json'},signal:AbortSignal.timeout(9000)});
 if(!response.ok){if(response.status===401||response.status===403)throw Error('Qloo rejected the configured API credential or access scope.');if(response.status===429)throw Error('Qloo rate limit reached. Please try again later.');throw Error('Qloo request failed (HTTP '+response.status+').')}
 return response.json();
}
async function resolveSeeds(names){
 return Promise.all(names.map(async name=>{
 const data=await qloo('/search',{query:name,take:8});
 const hits=parseSearch(data);
 if(!hits.length)throw Error('Qloo could not resolve "'+name.slice(0,65)+'". Try a more specific artist, film, show, book, or brand.');
 let selected=hits.find(x=>normalized(x.name)===normalized(name))||hits[0];
 return selected;
 }));
}
function mapRanks(list){return new Map(list.map((e,i)=>[e.id,{...e,rank:i}]))}
function rankScore(record,total){if(!record)return 0;return Math.max(.06,1-record.rank/Math.max(total,1))}
function rerank(combo,left,right){
 const A=mapRanks(left),B=mapRanks(right),N=Math.max(left.length,right.length,14);
 return combo.map((c,i)=>{
 const a=rankScore(A.get(c.id),N),b=rankScore(B.get(c.id),N);
 const combined=rankScore({rank:i},Math.max(combo.length,1));
 const fairness=Math.min(a,b),balance=Math.round(100*(.25*combined+.52*fairness+.23*((a+b)/2)));
 const both=a>0&&b>0, tags=c.tags.slice(0,2);
 const why=both?'Qloo connects this pick with both taste profiles. '+(tags.length?'Shared cultural cues include '+tags.join(' and ')+'.':'It appears in both personalized result sets.'):
 'Qloo finds a cross-interest connection, with stronger affinity on one side. Explore the evidence before committing.';
 const detail='Derived from live Qloo /v2/insights results. Person A: '+(A.has(c.id)?'rank '+(A.get(c.id).rank+1):'outside top results')+'; Person B: '+(B.has(c.id)?'rank '+(B.get(c.id).rank+1):'outside top results')+'. Balance index is a transparent app-computed fairness metric, not a Qloo affinity percentage.';
 return {name:c.name,balance,why,detail,id:c.id,affinity:Number.isFinite(c.affinity)?c.affinity:null};
 }).sort((x,y)=>y.balance-x.balance).slice(0,6);
}
function demo({alice,bob,category,city}){
 const seeds=pieces(alice).concat(pieces(bob)).join('|').toLowerCase();
 let hash=0;for(let i=0;i<seeds.length;i++)hash=(hash*33+seeds.charCodeAt(i))>>>0;
 const src=OPTIONS[category];
 const rotation=hash%src.length;
 const items=Array.from({length:3},(_,i)=>{let choice=src[(i+rotation)%src.length];return {name:choice[0],balance:71+((hash+i*11)%25),why:choice[1],detail:'Illustrative only. This example is fictional and was not retrieved, ranked, or validated through the Qloo API.'}});
 return {mode:'preview',category,city,items,disclosure:'Preview data is deliberately fictional. These are not Qloo entities, real places, or validated affinity predictions. Configure QLOO_API_KEY on the server to activate real cultural discovery.',trace:[{title:'Read preferences',detail:'Collected '+pieces(alice).length+' and '+pieces(bob).length+' user-supplied interests.'},{title:'Preview workflow',detail:'Showing local synthetic examples. Qloo Search and Qloo Insights will run when server credentials are configured.'},{title:'Fairness explanation',detail:'The live workflow ranks shared candidates by each person’s individual Qloo result ranking, not just combined popularity.'}]};
}
async function livePlan({alice,bob,category,city}){
 const a=pieces(alice),b=pieces(bob);
 const [A,B]=await Promise.all([resolveSeeds(a),resolveSeeds(b)]);
 const idsA=[...new Set(A.map(x=>x.id))],idsB=[...new Set(B.map(x=>x.id))],all=[...new Set([...idsA,...idsB])];
 const filter={ 'filter.type':'urn:entity:'+category,'take':18,'feature.explainability':'true' };
 if((category==='place'||category==='destination')&&city)filter['filter.location.query']=city;
 const request=(ids)=>qloo('/v2/insights',{...filter,'signal.interests.entities':ids.join(','),'filter.exclude.entities':all.join(',')});
 const [rawA,rawB,rawBoth]=await Promise.all([request(idsA),request(idsB),request(all)]);
 const [resultA,resultB,resultBoth]=[rawA,rawB,rawBoth].map(parseInsights);
 if(!resultBoth.length)throw Error('No matches for that combination. Try different favorites, a broader city, or another discovery category.');
 return {mode:'live',category,city,items:rerank(resultBoth,resultA,resultB),disclosure:'Live Qloo evidence: entity names and candidate relevance come from Qloo Search and Insights. The balance index is calculated by CommonGround to avoid recommendations dominated by either person.',trace:[{title:'Resolve cultural signals',detail:'Qloo /search matched '+A.map(x=>x.name).join(', ')+' and '+B.map(x=>x.name).join(', ')+'.'},{title:'Cross-domain discovery',detail:'Three Qloo /v2/insights calls found '+resultBoth.length+' joint candidates in '+category+' and '+resultA.length+' / '+resultB.length+' individual candidates.'},{title:'Fairness reranking',detail:'Agent compared individual affinities and combined results, promoted balanced suggestions and produced evidence-backed explanations.'}]};
}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');
 if(req.method==='GET')return res.status(200).json({ok:true,live:Boolean(process.env.QLOO_API_KEY),service:'CommonGround',integrations:['GET /search','GET /v2/insights']});
 if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Method not allowed'})}
 let body=req.body||{};if(typeof body==='string'){try{body=JSON.parse(body)}catch(e){return res.status(400).json({error:'Invalid JSON'})}}
 const alice=String(body.alice||'').trim(),bob=String(body.bob||'').trim(),category=String(body.category||''),city=String(body.city||'').trim();
 if(!alice||!bob||alice.length>180||bob.length>180||city.length>70||!VALID_TYPES.has(category))return res.status(400).json({error:'Provide one to three interests for each person and select a valid category.'});
 try{const p={alice,bob,category,city};const result=process.env.QLOO_API_KEY?await livePlan(p):demo(p);return res.status(200).json(result)}
 catch(err){return res.status(502).json({error:err?.message||'Unable to reach Qloo. Please try again.'})}
};