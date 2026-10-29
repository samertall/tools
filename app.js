/* ProofSkin | Accessible, privacy-conscious cosmetic shopping prototype */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const sample = {
    overall: 78,
    concerns: { moisture: {ui_score: 62, raw_score: 63.1}, texture: {ui_score: 82, raw_score: 83.5}, redness: {ui_score: 71, raw_score: 70.4}, pore: {ui_score: 76, raw_score: 75.8}, acne: {ui_score: 91, raw_score: 90.3}, radiance: {ui_score: 79, raw_score: 80.1}, age_spot: {ui_score: 87, raw_score: 86.7}, oiliness: {ui_score: 84, raw_score: 84.2} }
  };
  const catalog = {
    cleanser: {id:'cleanser', title:'Gentle daily cleanser', sub:'Low-fragrance, non-stripping formula', price:9, symbol:'◒', color:'blue', evidence:'Core care'},
    moisturizer: {id:'moisturizer', title:'Barrier-support moisturizer', sub:'Ceramides + humectants for daily comfort', price:11, symbol:'◉', color:'warm', evidence:'Core care'},
    spf: {id:'spf', title:'Broad-spectrum SPF 30+', sub:'Daily sun protection; choose a formula you enjoy', price:12, symbol:'☼', color:'', evidence:'Core care'},
    moisture: {id:'moisture', title:'Hydrating serum', sub:'Look for glycerin or hyaluronic acid', price:18, symbol:'♧', color:'blue', evidence:'Hydration priority'},
    acne: {id:'acne', title:'Blemish-care treatment', sub:'Consider gentle salicylic acid; patch test', price:17, symbol:'✳', color:'warm', evidence:'Acne appearance priority'},
    redness: {id:'redness', title:'Soothing barrier serum', sub:'Panthenol or fragrance-free calming care', price:16, symbol:'❋', color:'warm', evidence:'Redness appearance priority'},
    pore: {id:'pore', title:'Balancing serum', sub:'Niacinamide can support the look of pores', price:15, symbol:'◈', color:'', evidence:'Pore appearance priority'},
    texture: {id:'texture', title:'Texture-support treatment', sub:'Consider gentle exfoliation, not daily overuse', price:17, symbol:'✣', color:'blue', evidence:'Texture priority'},
    age_spot: {id:'age_spot', title:'Tone-evening serum', sub:'Consider vitamin C with consistent SPF', price:19, symbol:'❂', color:'warm', evidence:'Uneven-tone priority'},
    radiance: {id:'radiance', title:'Brightening antioxidant', sub:'Vitamin C category; introduce gradually', price:19, symbol:'✧', color:'warm', evidence:'Radiance priority'},
    oiliness: {id:'oiliness', title:'Lightweight niacinamide serum', sub:'A simple balancing option', price:15, symbol:'◍', color:'', evidence:'Oiliness priority'}
  };
  const labels = {moisture:'Hydration',texture:'Texture',redness:'Redness',pore:'Pores',acne:'Acne appearance',radiance:'Radiance',age_spot:'Uneven tone',oiliness:'Oiliness'};
  const advice = {moisture:'Support the skin barrier first.',texture:'Aim for a gentle, consistent routine.',redness:'Prioritize comfort and low-irritation care.',pore:'Keep cleansing gentle; avoid over-exfoliating.',acne:'Use gradual, non-aggressive blemish care.',radiance:'Daily SPF supports a simple brightening plan.',age_spot:'Start with sun protection before active products.',oiliness:'Look for lightweight, balanced hydration.'};
  const state = {source:'none', current:null, file:null, budget:60, busy:false};
  const storageKey = 'proofskin_local_scores_v1';
  const safeNumber=(x)=>Number.isFinite(Number(x))?Math.min(100,Math.max(0,Number(x))):null;
  const escapeHTML=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function extractScores(body) {
    if(!body || typeof body!=='object') throw new Error('The YouCam response was empty.');
    const root = body.results || body;
    const details = root.output || root.score_info || root.results || root;
    const candidates = Array.isArray(details) ? details : (Array.isArray(details.output) ? details.output : Object.entries(details).map(([type,v])=>({type,...(v&&typeof v==='object'?v:{score:v})})));
    const concerns={};let overall=null;
    for(const item of candidates){if(!item || typeof item!=='object')continue;
      const type=String(item.type||item.name||item.concern||item.key||'').toLowerCase().replace(/^hd_/,'').replace(/_v2$/,'');
      let ui=safeNumber(item.ui_score??item.uiScore??item.score??item.raw_score);
      let raw=safeNumber(item.raw_score??item.rawScore??item.score??item.ui_score);
      if(type==='all'||type==='overall'||type==='skin_score'){overall=ui;continue;}
      if(labels[type] && ui!==null){concerns[type]={ui_score:ui,raw_score:raw??ui};}
    }
    if(overall===null)overall=safeNumber(root.all?.score??root.all??root.score??root.overall_score??root.skin_score);
    if(overall===null && Object.keys(concerns).length)overall=Math.round(Object.values(concerns).reduce((n,v)=>n+v.ui_score,0)/Object.keys(concerns).length);
    if(!Object.keys(concerns).length)throw new Error('YouCam completed the task but returned no supported concern scores. Check its output schema and selected actions.');
    return {overall,concerns};
  }
  function setStatus(message,type=''){const el=$('#capture-status');el.textContent=message;el.className='capture-status '+type;}
  function setMode(mode){const e=$('#mode-badge');e.className='sample-badge '+(mode==='sample'?'demo':mode==='live'?'live':'');e.textContent=mode==='sample'?'ILLUSTRATIVE SAMPLE · NOT YOUCAM RESULTS':mode==='live'?'LIVE YOUCAM RESULTS':'NO ANALYSIS YET';}
  function getPriorities(){if(!state.current)return [];return Object.entries(state.current.concerns).filter(([key])=>labels[key]).sort((a,b)=>a[1].ui_score-b[1].ui_score).slice(0,4);}
  function renderResults(){const data=state.current;if(!data)return;
    const score=Math.round(data.overall??0);$('#overall-score').textContent=score;$('#hero-score').innerHTML=score+' <small>/ 100</small>';
    $('#score-ring').style.background=`conic-gradient(#79a883 ${score}%,#ecf0eb ${score}%)`;
    $('#score-tag').textContent=state.source==='sample'?'ILLUSTRATIVE SAMPLE SCORE':'YOUCAM API · REAL SCORE';
    $('#score-title').textContent=score>=85?'A promising baseline':score>=70?'A balanced starting point':'A few areas worth exploring';
    $('#score-description').textContent='A cosmetic snapshot, not a diagnosis. Your lowest available scores guide the product categories below.';
    $('#result-caveat').textContent=state.source==='sample'?'Demo scores are illustrative, not generated by YouCam. Run a live scan to obtain real measurements.':'Higher scores mean better assessed skin condition. Results can vary with lighting and image quality.';
    $('#metric-grid').innerHTML=['moisture','texture','redness','pore'].map(key=>{const score=data.concerns[key]?.ui_score;return `<div class="metric"><span>${labels[key]}</span><strong>${score!==undefined?Math.round(score):'--'}</strong><div class="metric-track"><i style="width:${score??0}%"></i></div></div>`}).join('');
    const priorities=getPriorities();$('#priority-list').innerHTML=priorities.length?priorities.map(([key,v],i)=>`<div class="priority-item"><div class="priority-rank">0${i+1}</div><div class="priority-copy"><b>${escapeHTML(labels[key])}</b><span>${escapeHTML(advice[key])}</span></div><div class="priority-score">${Math.round(v.ui_score)} <small>/100</small></div></div>`).join(''):'<div class="empty-mini">No supported concern scores in this response.</div>';
    renderRoutine();setMode(state.source);$('#save-snapshot').disabled=state.source!=='live';
  }
  function renderRoutine(){if(!state.current)return;const priorities=getPriorities();const base=[catalog.cleanser,catalog.moisturizer,catalog.spf];let chosen=[...base];let amount=base.reduce((n,x)=>n+x.price,0);
    for(const [key,score] of priorities){const item=catalog[key];if(item && !chosen.some(x=>x.id===item.id) && score.ui_score<85 && amount+item.price<=state.budget){chosen.push(item);amount+=item.price;}}
    $('#routine-count').textContent=chosen.length+' ITEMS';$('#routine-list').innerHTML=chosen.map(p=>`<div class="routine-item"><div class="product-symbol ${p.color}">${p.symbol}</div><div class="product-meta"><b>${escapeHTML(p.title)}</b><span>${escapeHTML(p.sub)}</span></div><div class="product-price">$${p.price}<small>${escapeHTML(p.evidence)}</small></div></div>`).join('');
    $('#basket-total').textContent='$'+amount;$('#budget-note').textContent=amount>state.budget?'Core illustrative basket exceeds this budget. Consider longer product replacement cycles; do not skip essential care based on a score.':'Within your basket budget. These are example category prices, not shopping listings or personalized clinical prescriptions.';
  }
  function setAnalysis(data,source){state.current=data;state.source=source;renderResults();}
  function loadJournal(){try{const x=JSON.parse(localStorage.getItem(storageKey)||'[]');return Array.isArray(x)?x.filter(a=>a&&typeof a.date==='string'&&Number.isFinite(a.overall)).slice(-12):[];}catch{return[];}}
  function renderJournal(){const entries=loadJournal();const visual=$('#history-visual');if(!entries.length){visual.innerHTML='<div class="history-line"><span></span><span></span><span></span></div><p>No saved scans yet. Your history stays on this browser.</p>';$('#history-insight').innerHTML='<span class="mini-eyebrow">COMPARE, DON\'T GUESS</span><strong>A thoughtful routine is a journey.</strong><p>Compare similar lighting and conditions. Photo variation can influence scores.</p>';return;}
    visual.innerHTML=`<table class="history-table"><thead><tr><th>Date</th><th>Overall</th><th>Hydration</th><th>Texture</th></tr></thead><tbody>${entries.slice().reverse().map(e=>`<tr><td>${escapeHTML(new Date(e.date).toLocaleDateString())}</td><td><strong>${Math.round(e.overall)}</strong>/100</td><td>${e.concerns.moisture?Math.round(e.concerns.moisture.raw_score):'--'}</td><td>${e.concerns.texture?Math.round(e.concerns.texture.raw_score):'--'}</td></tr>`).join('')}</tbody></table>`;
    if(entries.length>1){const first=entries[0],last=entries[entries.length-1],delta=last.overall-first.overall;$('#history-insight').innerHTML=`<span class="mini-eyebrow">OBSERVATIONAL TREND</span><strong>${delta>0?'+':''}${Math.round(delta)} points since your first saved scan</strong><p>This comparison is not proof of product efficacy. Lighting, timing and model variability can change results.</p>`;}else{$('#history-insight').innerHTML='<span class="mini-eyebrow">BASELINE SAVED</span><strong>One point in your journey.</strong><p>Try another real analysis under comparable lighting before interpreting any trend.</p>';}
  }
  async function checkConnection(){try{const res=await fetch('/api/health',{cache:'no-store'});const json=await res.json();$('#connection-text').textContent=json.configured?'YouCam API ready':'API key required';$('.status-pill').classList.add(json.configured?'connected':'offline');}catch{$('#connection-text').textContent='Preview mode';$('.status-pill').classList.add('offline');}}
  function previewFile(file){if(!file)return;if(!['image/png','image/jpeg'].includes(file.type)){setStatus('Please choose a JPEG or PNG image.','error');return;}if(file.size>10*1024*1024){setStatus('Choose an image below 10 MB.','error');return;}state.file=file;const preview=$('#preview');if(preview.dataset.objectUrl)URL.revokeObjectURL(preview.dataset.objectUrl);const url=URL.createObjectURL(file);preview.src=url;preview.dataset.objectUrl=url;$('#preview-wrap').hidden=false;$('#run-live').disabled=!$('#image-consent').checked;setStatus('Photo ready. Confirm consent, then run live YouCam analysis.');}
  async function toDataUrl(file){const img=await createImageBitmap(file);const max=1500;const ratio=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*ratio);c.height=Math.round(img.height*ratio);c.getContext('2d').drawImage(img,0,0,c.width,c.height);img.close();const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.88));if(!blob)throw new Error('Unable to prepare your image.');return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});}
  async function jsonFetch(url,options={}){const response=await fetch(url,options);let json;try{json=await response.json();}catch{throw new Error('Unexpected response from the analysis service.');}if(!response.ok||json.error)throw new Error(json.error||'Analysis request failed.');return json;}
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  const errorCopy=(raw)=>{const s=String(raw);if(/error_src_face_too_small/i.test(s))return 'Face too small. Use a closer portrait with your face taking up most of the frame.';if(/error_lighting_dark/i.test(s))return 'The photo appears too dark. Try bright, even frontal lighting.';if(/error_src_face_out_of_bound/i.test(s))return 'Center your full face in the frame; look straight ahead.';if(/error_below_min_image_size/i.test(s))return 'Image resolution is too low. Use a sharper, closer photo.';if(/error_exceed_max_image_size/i.test(s))return 'Image is too large. Please choose a file below 10 MB.';return s;};
  async function runLive(){if(state.busy || !state.file || !$('#image-consent').checked)return;state.busy=true;$('#run-live').disabled=true;$('#run-live').textContent='Working...';try{
      setStatus('Preparing photo securely for YouCam...');const base64=await toDataUrl(state.file);
      const start=await jsonFetch('/api/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:base64})});
      setStatus('YouCam accepted the image. Processing cosmetic analysis...');let completed=false;
      for(let i=0;i<24;i++){await sleep(4000);const response=await jsonFetch('/api/status?taskId='+encodeURIComponent(start.taskId));if(response.status==='success'){
          const normalized=response.normalized||extractScores(response.results);setAnalysis(normalized,'live');setStatus('Real YouCam results loaded. You can save numerical scores on this device if you wish.','success');completed=true;break;
        }if(response.status==='error')throw new Error(JSON.stringify(response.details||'YouCam could not analyze this image.'));}
      if(!completed)throw new Error('The analysis is still processing. Try again with a clear selfie, or inspect the YouCam task status.');
    }catch(e){setStatus(errorCopy(e?.message||e),'error');}finally{state.busy=false;$('#run-live').disabled=!state.file||!$('#image-consent').checked;$('#run-live').innerHTML='Analyze with YouCam <span>→</span>';}}
  function init(){const now=new Date();$('#today-label').textContent=now.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}).toUpperCase();checkConnection();renderJournal();
    $('#image-input').addEventListener('change',e=>previewFile(e.target.files[0]));$('#image-consent').addEventListener('change',()=>{$('#run-live').disabled=!state.file||!$('#image-consent').checked||state.busy;});
    const drop=$('#upload-zone');drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragging');});drop.addEventListener('dragleave',()=>drop.classList.remove('dragging'));drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragging');previewFile(e.dataTransfer.files[0]);});
    $('#run-live').addEventListener('click',runLive);$('#run-demo').addEventListener('click',()=>{setAnalysis(sample,'sample');setStatus('You are viewing an illustrative sample. These are NOT real YouCam measurements.','success');$('#routine').scrollIntoView({behavior:'smooth',block:'start'});});
    $('#budget-slider').addEventListener('input',e=>{state.budget=Number(e.target.value);$('#budget-value').textContent='$'+state.budget;renderRoutine();});
    $('#save-snapshot').addEventListener('click',()=>{if(state.source!=='live'||!state.current)return;const entries=loadJournal();entries.push({date:new Date().toISOString(),overall:state.current.overall,concerns:state.current.concerns});localStorage.setItem(storageKey,JSON.stringify(entries.slice(-12)));renderJournal();$('#history').scrollIntoView({behavior:'smooth'});});
    $('#clear-history').addEventListener('click',()=>{if(!loadJournal().length)return;if(confirm('Delete all locally saved numerical skin snapshots from this browser?')){localStorage.removeItem(storageKey);renderJournal();}});
    for(const id of ['hero-start','new-scan-top'])$('#'+id).addEventListener('click',()=>{$('#scan').scrollIntoView({behavior:'smooth'});$('#image-input').click();});
    const links=[...document.querySelectorAll('.nav-item')];links.forEach(el=>el.addEventListener('click',()=>{links.forEach(x=>x.classList.remove('active'));el.classList.add('active');}));
  }
  document.addEventListener('DOMContentLoaded',init);
})();
