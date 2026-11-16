import {MODEL_ID, MODEL_RUNTIME, normalizedEvidence, checkInputs, buildPrompt, unwrapOutput, exportMarkdown} from './analysis.js';
const $ = id=>document.getElementById(id);
const evidenceEl=$('evidence-list');
const sources=[{title:'',url:'',excerpt:''},{title:'',url:'',excerpt:''}];
let generation=null, startedAt=null, activeModel=null;
function setStatus(s){$('status').textContent=s;$('engine-status').textContent=s;}
function step(n){document.querySelectorAll('.step').forEach((el,i)=>{el.classList.toggle('active',i===n-1);el.classList.toggle('done',i<n-1);});}
function renderSources(){
  evidenceEl.replaceChildren();
  sources.forEach((source,i)=>{
    const card=document.createElement('div');card.className='evidence-card';
    const top=document.createElement('div');top.className='evidence-title';
    const tag=document.createElement('span');tag.textContent='SOURCE '+(i+1)+' · USER SUPPLIED';top.append(tag);
    if(sources.length>1){const del=document.createElement('button');del.className='remove';del.type='button';del.textContent='Remove';del.setAttribute('aria-label','Remove source '+(i+1));del.addEventListener('click',()=>{sources.splice(i,1);renderSources();});top.append(del);}
    card.append(top);
    const fields=document.createElement('div');fields.className='evidence-fields';
    function field(labelText,name,placeholder,kind='text'){
      const l=document.createElement('label');l.textContent=labelText;
      const inp=kind==='textarea'?document.createElement('textarea'):document.createElement('input');
      if(kind!=='textarea') inp.type=kind;
      inp.placeholder=placeholder;inp.maxLength=name==='excerpt'?1600:name==='url'?600:160;
      inp.value=source[name];inp.addEventListener('input',()=>{source[name]=inp.value;});l.append(inp);
      if(name==='excerpt')l.style.gridColumn='1/-1';fields.append(l);
    }
    field('Source title','title','Interview, market note, report title…');
    field('Reference URL (optional)','url','https://…','url');
    field('Relevant excerpt','excerpt','Short source excerpt or interview note…','textarea');
    card.append(fields);evidenceEl.append(card);
  });
}
$('add-evidence').addEventListener('click',()=>{if(sources.length>=4){setStatus('Up to four source cards per run.');return;}sources.push({title:'',url:'',excerpt:''});renderSources();});
$('sample').addEventListener('click',()=>{
  $('venture').value='CaféPulse (synthetic case)';
  $('customer').value='Independent café owners';
  $('assumption').value='Independent cafés will pay a monthly fee for a lightweight digital loyalty solution because paper stamp cards are inconvenient.';
  sources.splice(0,sources.length,
    {title:'Synthetic interview note A — fictional',url:'',excerpt:'An imagined café owner says customers forget paper stamp cards, but the owner worries about subscription fees and staff training.'},
    {title:'Synthetic interview note B — fictional',url:'',excerpt:'In a fictional customer interview, a regular guest says she already uses many loyalty apps and would prefer not to install another.'},
    {title:'Synthetic competitor note — fictional',url:'',excerpt:'An illustrative competitor offers a free starter plan. No actual pricing or market-share data has been checked.'});
  renderSources();setStatus('Synthetic sample loaded; replace it before making research claims.');
});
function collect(){return{venture:$('venture').value.trim(),customer:$('customer').value.trim(),assumption:$('assumption').value.trim(),manualMinutes:Number($('manual').value),sources:structuredClone(sources)};}
async function getModel(){
  if(activeModel)return activeModel;
  setStatus('Downloading public model weights (~140 MB). First use may take several minutes…');
  const mod=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
  activeModel=await mod.pipeline('text-generation',MODEL_ID,{device:'wasm',dtype:'q8',progress_callback:p=>{if(p.status==='progress'&&p.total)setStatus('Loading model '+Math.floor(p.progress||0)+'% · '+(p.file||'weights'));}});
  setStatus('Local open-weight model ready');return activeModel;
}
function showReview(data,critique){
  $('results-panel').classList.remove('hidden');$('decision-panel').classList.remove('hidden');$('critique').value=critique;
  const ledger=$('source-ledger');ledger.replaceChildren();
  normalizedEvidence(data.sources).forEach(s=>{
    const node=document.createElement('div');node.className='ledger-item';
    const title=document.createElement('b');title.textContent='['+s.id+'] '+s.title;node.append(title);
    if(s.url&&/^https?:\/\//i.test(s.url)){const link=document.createElement('a');link.href=s.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=s.url;node.append(link);}
    const excerpt=document.createElement('div');excerpt.textContent=s.excerpt;node.append(excerpt);ledger.append(node);
  });
  $('notes').value='';$('ack').checked=false;document.querySelectorAll('[name=decision]').forEach(r=>r.checked=false);toggleExport();step(3);$('results-panel').scrollIntoView({behavior:'smooth',block:'start'});
}
$('run').addEventListener('click',async()=>{
  if(generation?.running)return;
  const data=collect(),error=checkInputs(data.assumption,data.sources);
  if(error){setStatus(error);return;}
  generation={data,running:true};startedAt=performance.now();$('run').disabled=true;
  try{
    step(2);const model=await getModel();setStatus('Generating critique locally — no paid API…');
    const response=await model([{role:'system',content:'You are a critical-thinking assistant. Do not invent or decide.'},{role:'user',content:buildPrompt(data)}],{max_new_tokens:170,do_sample:false,return_full_text:false});
    const text=unwrapOutput(response).replace(/^assistant\s*:?/i,'').trim();
    if(!text)throw new Error('The model returned no text.');
    generation={data,critique:text,durationSeconds:(performance.now()-startedAt)/1000};
    setStatus('AI completed in '+generation.durationSeconds.toFixed(1)+' sec; human judgment required.');showReview(data,text);
  }catch(err){setStatus('AI could not run: '+String(err?.message||err).slice(0,190)+'; try a supported desktop browser.');generation=null;step(1);}
  finally{$('run').disabled=false;}
});
function toggleExport(){
  const choice=document.querySelector('[name=decision]:checked')?.value;
  $('export').disabled=!(generation&&!generation.running&&choice&&$('notes').value.trim().length>=12&&$('ack').checked);
  $('export-status').textContent=$('export').disabled?'Choose a decision, explain why (12+ characters), and acknowledge limitations.':'Ready — human checkpoint satisfied.';
}
$('notes').addEventListener('input',toggleExport);$('ack').addEventListener('change',toggleExport);
document.querySelectorAll('[name=decision]').forEach(r=>r.addEventListener('change',toggleExport));
$('export').addEventListener('click',()=>{
  if($('export').disabled||!generation)return;
  const data=generation.data;
  const markdown=exportMarkdown({...data,critique:$('critique').value,decision:document.querySelector('[name=decision]:checked').value,notes:$('notes').value.trim(),runSeconds:generation.durationSeconds});
  const blob=new Blob([markdown],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='FounderLens-AI-founder-reviewed-report.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('export-status').textContent='Report downloaded locally. No external action was taken.';step(4);
});
renderSources();setStatus('Ready for evidence · '+MODEL_RUNTIME);
