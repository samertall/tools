import { DEFAULT_DECISION, normalizeWeights, rankOptions, stressTest, explainWinner, validateDecision, clamp } from './engine.mjs';
const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value??'').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const key = 'lumenchoice-v1';
let decision;
try { decision=validateDecision(JSON.parse(localStorage.getItem(key))) } catch { decision=structuredClone(DEFAULT_DECISION) }
let volatility=25;let currentModal=null;let activePreset='balanced';let toastHandle;
const colors=['#bbf47b','#a8b7ff','#ffcf96','#f4a4db','#93e9e4','#edd8a0','#b4c8db','#e6ae9c'];
const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random()*10000).toString(36)}`;
function save(){try{localStorage.setItem(key,JSON.stringify(decision))}catch{notify('Local storage is unavailable. Export a copy instead.')}}
function notify(message){const toast=$('#toast');toast.textContent=message;toast.hidden=false;clearTimeout(toastHandle);toastHandle=setTimeout(()=>{toast.hidden=true},3200)}
function renderCriteria(){
 const list=$('#criteria-list');list.innerHTML='';
 decision.criteria.forEach(c=>{
  const row=document.createElement('div');row.className='criterion';row.innerHTML=`<div class="criterion-top"><label for="weight-${escapeHTML(c.id)}">${escapeHTML(c.name)}</label><span class="criterion-value" id="val-${escapeHTML(c.id)}">${c.weight}</span><button class="criterion-edit" data-edit-criterion="${escapeHTML(c.id)}" aria-label="Edit ${escapeHTML(c.name)}">✎</button></div><input class="weight-slider" id="weight-${escapeHTML(c.id)}" type="range" min="0" max="100" step="1" value="${c.weight}" data-weight="${escapeHTML(c.id)}" aria-label="Weight for ${escapeHTML(c.name)}"/>`;
  list.appendChild(row)
 });
 $('#weight-total').textContent=`${Math.round(normalizeWeights(decision.criteria).reduce((s,c)=>s+c.normalized,0)*100)}%`;
 updatePreset();
}
function updatePreset(){document.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('active',b.dataset.preset===activePreset))}
function renderDashboard(){
 const ranked=rankOptions(decision.options,decision.criteria), explanation=explainWinner(decision.options,decision.criteria), simulation=stressTest(decision.options,decision.criteria,volatility,900,2026);
 $('#side-title').textContent=decision.title;
 $('#side-context').textContent=decision.context;
 $('#metric-leader').textContent=ranked[0]?.name||'No options yet';
 $('#metric-margin').textContent=ranked.length>1?`${(ranked[0].score-ranked[1].score).toFixed(1)} point lead over runner-up`:'Add a second choice to compare';
 $('#metric-robustness').innerHTML=ranked.length?`${simulation.stability}<small>% of scenarios</small>`:'—';
 $('#metric-robustness-caption').textContent=`${simulation.runs.toLocaleString()} reproducible simulations`;
 $('#metric-count').innerHTML=`${decision.options.length} <small>choices</small>`;
 $('#metric-criteria-count').textContent=`${decision.criteria.length} criteria in the model`;
 $('#ranking-list').innerHTML=ranked.length?ranked.map((o,i)=>`<div class="rank-row ${i===0?'is-top':''}"><span class="rank-num">${String(i+1).padStart(2,'0')}</span><div class="rank-name-wrap"><div class="rank-name">${escapeHTML(o.name)}${i===0?'<span class="rank-top-tag">✦ TOP PICK</span>':''}</div><div class="rank-desc">${escapeHTML(o.description)}</div></div><div class="rank-track" aria-label="${escapeHTML(o.score.toFixed(1))} of 100"><div class="rank-fill" style="width:${o.score.toFixed(2)}%;background:${o.color}"></div></div><div class="rank-score">${o.score.toFixed(1)} <small>/100</small></div><button class="edit-rank" data-edit-option="${escapeHTML(o.id)}" title="Edit ${escapeHTML(o.name)}" aria-label="Edit ${escapeHTML(o.name)}">↗</button></div>`).join(''):'<div class="empty">No options yet. Add one to begin a transparent comparison.</div>';
 const heading=decision.criteria.map(c=>`<th scope="col" title="${escapeHTML(c.description)}">${escapeHTML(c.name)}<br><span style="color:#647f82;font-weight:500">${Math.round(normalizeWeights(decision.criteria).find(w=>w.id===c.id)?.normalized*100||0)}%</span></th>`).join('');
 $('#matrix-container').innerHTML=`<table class="matrix"><thead><tr><th scope="col">OPTION</th>${heading}<th scope="col">TOTAL</th></tr></thead><tbody>${ranked.map(o=>`<tr><th scope="row" class="opt-cell"><button data-edit-option="${escapeHTML(o.id)}">${escapeHTML(o.name)}</button></th>${decision.criteria.map(c=>{const score=clamp(o.scores[c.id]??5,0,10);const klass=score>=8?'strong':score>=5?'medium':'weak';return `<td><span class="cell-score ${klass}" aria-label="${score} out of 10">${score}</span></td>`}).join('')}<td><strong>${o.score.toFixed(1)}</strong></td></tr>`).join('')}</tbody></table>`;
 if (!explanation){$('#explanation').innerHTML='<p class="empty">Add an option to see a clear explanation.</p>'}else{
  const keyC=explanation.advantage;
  $('#explanation').innerHTML=`<div class="winner-name">${escapeHTML(explanation.winner.name)}</div><p class="winner-sentence">Leads with <strong style="color:#d5e6dd">${explanation.winner.score.toFixed(1)}/100</strong>${explanation.runner?`, ahead of ${escapeHTML(explanation.runner.name)} by ${explanation.margin.toFixed(1)} points`:''}. ${keyC?`Its biggest weighted edge is <strong style="color:#c5efb6">${escapeHTML(keyC.name)}</strong>.`:''}</p><div class="insight-tag">WHERE THE SCORE COMES FROM</div>${explanation.strengths.slice(0,3).map(c=>`<div class="contribution-row"><div class="contribution-info"><span>${escapeHTML(c.name)}</span><strong>+${c.contribution.toFixed(1)} pts</strong></div><div class="contrib-track"><div class="contrib-fill" style="width:${c.contribution/Math.max(1,explanation.strengths[0].contribution)*100}%"></div></div></div>`).join('')}`
 }
 $('#stress-results').innerHTML=ranked.length?`<div class="stress-card"><div class="stress-big">${simulation.stability}<small>%</small></div><div class="stress-heading">of scenarios keep your top pick</div><div class="stress-description">${simulation.stability>=85?'Strong result under the selected uncertainty.':simulation.stability>=60?'Promising, but some plausible changes could alter the ranking.':'Sensitive decision. Small preference changes may produce a different winner.'}</div></div><div class="stress-bars">${simulation.wins.sort((a,b)=>b.count-a.count).map(w=>{const item=decision.options.find(o=>o.id===w.id);return `<div class="stress-row"><span title="${escapeHTML(w.name)}">${escapeHTML(w.name)}</span><div class="stress-track"><div class="stress-fill" style="width:${w.percentage}%;background:${item?.color||'#bbf47b'}"></div></div><strong>${w.percentage}%</strong></div>`}).join('')}</div>`:'<div class="empty">Add an option to start testing.</div>';
 $('#volatility-value').textContent=volatility+'%';
}
function refresh(){save();renderCriteria();renderDashboard()}
function openModal(type,id){
 currentModal={type,id};const dialog=$('#editor-dialog'),fields=$('#editor-fields');fields.innerHTML='';$('#delete-entry-btn').hidden=true;
 const field=(label,name,value,max=100,multiline=false)=>`<div class="editor-field"><label for="edit-${name}">${escapeHTML(label)}</label>${multiline?`<textarea id="edit-${name}" name="${name}" maxlength="${max}" rows="3">${escapeHTML(value)}</textarea>`:`<input id="edit-${name}" name="${name}" value="${escapeHTML(value)}" maxlength="${max}" required>`}</div>`;
 if(type==='decision'){
  $('#dialog-title').textContent='Your decision';$('#dialog-description').textContent='A clear question makes every tradeoff more meaningful.';
  fields.innerHTML=field('What are you deciding?','title',decision.title,120)+field('What is the context?','context',decision.context,400,true)
 }else if(type==='option'){
  const option=decision.options.find(o=>o.id===id),editing=Boolean(option);
  $('#dialog-title').textContent=editing?'Edit an option':'Add an option';$('#dialog-description').textContent='Score each criterion based on your own evidence, from 0 (poor fit) to 10 (excellent fit).';
  if(editing)$('#delete-entry-btn').hidden=false;
  fields.innerHTML=field('Option name','name',option?.name||'',80)+field('Short description','description',option?.description||'',160,true)+decision.criteria.map(c=>{const score=clamp(option?.scores[c.id]??5,0,10);return `<div class="editor-field"><div class="score-label"><label for="score-${escapeHTML(c.id)}">${escapeHTML(c.name)}</label><output id="score-value-${escapeHTML(c.id)}">${score}/10</output></div><input type="range" min="0" max="10" step="1" id="score-${escapeHTML(c.id)}" data-score-editor="${escapeHTML(c.id)}" value="${score}" /></div>`}).join('')
 }else if(type==='criterion'){
  const criterion=decision.criteria.find(c=>c.id===id);$('#dialog-title').textContent=criterion?'Edit criterion':'New criterion';$('#dialog-description').textContent='What else matters to this decision?';
  if(criterion&&decision.criteria.length>1)$('#delete-entry-btn').hidden=false;
  fields.innerHTML=field('Criterion name','name',criterion?.name||'',60)+field('What does it mean?','description',criterion?.description||'',200,true)+`<div class="editor-field"><label for="edit-weight">Importance (0–100)</label><input id="edit-weight" name="weight" type="number" min="0" max="100" value="${criterion?.weight??10}" required /></div>`
 }
 dialog.showModal();fields.querySelector('input,textarea')?.focus()
}
function closeModal(){ $('#editor-dialog').close();currentModal=null }
$('#editor-form').addEventListener('submit',e=>{
 e.preventDefault();if(!currentModal)return;
 const {type,id}=currentModal,form=new FormData(e.currentTarget),read=name=>String(form.get(name)??'').trim();
 if(type==='decision'){decision.title=read('title').slice(0,120)||'Untitled decision';decision.context=read('context').slice(0,400)}
 if(type==='option'){
  const name=read('name');if(!name)return;
  const old=decision.options.find(o=>o.id===id),scores=Object.fromEntries(decision.criteria.map(c=>[c.id,Number($(`#score-${CSS.escape(c.id)}`).value)]));
  if(old)Object.assign(old,{name,description:read('description'),scores});
  else if(decision.options.length<12)decision.options.push({id:uid('option'),name,description:read('description'),scores,color:colors[decision.options.length%colors.length]});
 }
 if(type==='criterion'){
  const name=read('name');if(!name)return;
  const old=decision.criteria.find(c=>c.id===id);
  if(old)Object.assign(old,{name,description:read('description'),weight:clamp(Number(read('weight')),0,100)});
  else if(decision.criteria.length<10){const newCriterion={id:uid('criterion'),name,description:read('description'),weight:clamp(Number(read('weight')),0,100)};decision.criteria.push(newCriterion);decision.options.forEach(o=>o.scores[newCriterion.id]=5)};
  activePreset='custom';
 }
 closeModal();refresh();notify('Changes saved in this browser.');
});
$('#editor-fields').addEventListener('input',e=>{const id=e.target.dataset.scoreEditor;if(id){const label=document.getElementById(`score-value-${id}`);if(label)label.textContent=e.target.value+'/10'}});
$('#delete-entry-btn').addEventListener('click',()=>{if(!currentModal)return;const {type,id}=currentModal;if(type==='option')decision.options=decision.options.filter(o=>o.id!==id);if(type==='criterion'&&decision.criteria.length>1){decision.criteria=decision.criteria.filter(c=>c.id!==id);decision.options.forEach(o=>delete o.scores[id])}closeModal();refresh();notify('Entry removed.')});
$('#close-dialog-btn').addEventListener('click',closeModal);$('#cancel-dialog-btn').addEventListener('click',closeModal);$('#editor-dialog').addEventListener('click',e=>{if(e.target.id==='editor-dialog')closeModal()});
$('#edit-decision-btn').addEventListener('click',()=>openModal('decision'));
$('#add-criterion-btn').addEventListener('click',()=>decision.criteria.length>=10?notify('Maximum 10 criteria.'):openModal('criterion'));
$('#add-option-btn').addEventListener('click',()=>decision.options.length>=12?notify('Maximum 12 options.'):openModal('option'));
document.addEventListener('click',e=>{
 const option=e.target.closest('[data-edit-option]');if(option)openModal('option',option.dataset.editOption);
 const criterion=e.target.closest('[data-edit-criterion]');if(criterion)openModal('criterion',criterion.dataset.editCriterion);
 const preset=e.target.closest('[data-preset]');if(preset){
  const name=preset.dataset.preset,base=name==='budget'?{'cost':45,'flex':23,'impact':16,'speed':10,'community':6}:name==='career'?{'impact':48,'community':20,'speed':15,'flex':10,'cost':7}:null;
  const weights=base&&decision.criteria.every(c=>Object.hasOwn(base,c.id))?base:null;
  decision.criteria.forEach((c,i)=>{c.weight=weights?weights[c.id]:name==='balanced'&&decision.criteria.length===5&&['impact','cost','flex','speed','community'].includes(c.id)?{impact:30,cost:25,flex:20,speed:15,community:10}[c.id]:Math.round(100/decision.criteria.length)});
  activePreset=name;refresh();notify('Priorities updated.');
 }
});
$('#criteria-list').addEventListener('input',e=>{const id=e.target.dataset.weight;if(!id)return;const item=decision.criteria.find(c=>c.id===id);if(!item)return;item.weight=Number(e.target.value);$(`#val-${CSS.escape(id)}`).textContent=String(item.weight);activePreset='custom';updatePreset();save();renderDashboard()});
$('#volatility').addEventListener('input',e=>{volatility=Number(e.target.value);renderDashboard()});
function download(name,text,mime){const blob=new Blob([text],{type:mime});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=name;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('#export-json-btn').addEventListener('click',()=>{download('lumenchoice-decision.json',JSON.stringify({format:'lumenchoice-v1',...decision},null,2),'application/json');notify('Decision file exported.')});
$('#export-csv-btn').addEventListener('click',()=>{
 const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';const rows=[['Option',...decision.criteria.map(c=>c.name),'Weighted Score'],...rankOptions(decision.options,decision.criteria).map(o=>[o.name,...decision.criteria.map(c=>o.scores[c.id]??5),o.score.toFixed(2)])];download('lumenchoice-comparison.csv','\ufeff'+rows.map(r=>r.map(quote).join(',')).join('\r\n'),'text/csv;charset=utf-8');notify('Comparison CSV exported.')
});
$('#import-btn').addEventListener('click',()=>$('#file-input').click());
$('#file-input').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>200000)throw Error('The selected file is too large.');decision=validateDecision(JSON.parse(await file.text()));activePreset='custom';refresh();notify('Your decision was imported successfully.')}catch(error){notify('Could not import: '+error.message)}e.target.value=''});
function summary(){const ranks=rankOptions(decision.options,decision.criteria);const robust=stressTest(decision.options,decision.criteria,volatility);return `${decision.title}\n${decision.context}\n\nRecommendation: ${ranks[0]?.name||'No options'} (${ranks[0]?.score.toFixed(1)||'—'}/100)\nRobustness under ±${volatility}% scenario assumptions: ${robust.stability}%\n\nRanking:\n${ranks.map((o,i)=>`${i+1}. ${o.name}: ${o.score.toFixed(1)}/100`).join('\n')}\n\nBuilt in LumenChoice — transparent, local-first decision intelligence.`}
$('#copy-summary-btn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(summary());notify('Decision summary copied.')}catch{download('lumenchoice-summary.txt',summary(),'text/plain');notify('Summary downloaded instead.')}});
function fresh(){decision=structuredClone(DEFAULT_DECISION);activePreset='balanced';volatility=25;$('#volatility').value='25';refresh();notify('Demo decision restored.')}
$('#reset-btn').addEventListener('click',()=>{if(confirm('Reset this browser to the original sample decision?'))fresh()});$('#new-decision-btn').addEventListener('click',()=>{if(confirm('Start a new decision? Your current data will be replaced. Export it first if needed.')){decision={title:'My next decision',context:'What outcome matters most?',criteria:[{id:'quality',name:'Quality',weight:40,description:'How well the option meets my needs'},{id:'cost',name:'Affordability',weight:35,description:'Fit with my budget'},{id:'ease',name:'Ease of use',weight:25,description:'How easy this will be to adopt'}],options:[]};activePreset='custom';refresh();openModal('option')}});
document.querySelectorAll('[data-view-link]').forEach(link=>link.addEventListener('click',()=>{document.querySelectorAll('[data-view-link]').forEach(a=>a.classList.remove('active'));link.classList.add('active')}));
renderCriteria();renderDashboard();