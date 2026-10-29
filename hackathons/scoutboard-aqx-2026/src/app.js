
/* ScoutBoard dashboard UI. Vanilla JS, no secret keys, no client dependencies. */
(function () {
  'use strict';
  const M = window.ScoutModel;
  const $ = id => document.getElementById(id);
  const number = (v,n=1) => v == null || !Number.isFinite(v) ? '—' : v.toFixed(n);
  const percentage = p => p == null || !Number.isFinite(p) ? '—' : `${Math.round(p*100)}%`;
  const esc = s => String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const short = s => String(s||'').replace(/ FC$/,'').replace(/ AFC$/,'').replace(/^AFC /,'').replace('Wolverhampton Wanderers','Wolves').replace('Brighton & Hove Albion','Brighton').replace('Tottenham Hotspur','Tottenham').replace('Manchester','Man').replace('Newcastle United','Newcastle').replace('Nottingham Forest','Nott’m Forest').replace('West Ham United','West Ham').replace('Leicester City','Leicester').replace('Leeds United','Leeds').replace('Ipswich Town','Ipswich').replace('Hull City','Hull').replace('Coventry City','Coventry').replace('Crystal Palace','Crystal Palace').replace('Sunderland','Sunderland');
  const seedLetters = name => short(name).split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const d = {matches:[], mode:'loading', chosenSeason:'2025-26', home:'Arsenal FC', away:'Liverpool FC', evaluation:null, currentSeason:'2026-27', loadErrors:[]};

  function setBanner(mode, message) {
    const el = $('dataBanner');
    el.className = 'data-banner ' + mode;
    el.innerHTML = `<span class="loading-spark"></span>${esc(message)}`;
  }

  function fallbackMatches() {
    const sample = window.SCOUT_SAMPLE || {};
    return Object.entries(sample).flatMap(([season,entries]) => {
      const raw = { matches: entries.map(([date,team1,team2,h,a],i) => ({
        date,team1,team2,round:`Verified subset ${i+1}`,score: h == null ? null : {ft:[h,a]}
      }))};
      return M.parseSeason(raw,season);
    });
  }

  async function fetchData() {
    setBanner('','Connecting to the public-domain Premier League dataset…');
    $('refreshData').disabled=true;
    const results=await Promise.allSettled(M.SEASON_KEYS.map(async season => {
      const url=`${M.SOURCE_ROOT}${season}/en.1.json`;
      const response=await fetch(url, {cache:'no-store',mode:'cors'});
      if (!response.ok) throw new Error(`${season}: HTTP ${response.status}`);
      return M.parseSeason(await response.json(),season);
    }));
    const successes=results.filter(x=>x.status==='fulfilled').map(x=>x.value);
    d.loadErrors=results.filter(x=>x.status==='rejected').map(x=>String(x.reason));
    if(successes.length===M.SEASON_KEYS.length){
      d.matches=successes.flat(); d.mode='full';
      setBanner('ready',`Source: OpenFootball · ${d.matches.length.toLocaleString()} published fixtures across ${successes.length} seasons · Refreshed ${new Date().toLocaleDateString()}`);
    } else if (successes.length > 0) {
      d.matches=successes.flat(); d.mode='partial';
      setBanner('warn',`Partial live data: ${successes.length} of ${M.SEASON_KEYS.length} seasons loaded. Results may be incomplete. Refresh to retry.`);
    } else {
      d.matches=fallbackMatches(); d.mode='sample';
      setBanner('warn',`Offline preview: ${d.matches.length} verified sample fixtures only. Connect to the internet for full results and reliable season statistics.`);
    }
    $('refreshData').disabled=false;
    setOptions(); render();
  }

  function setOptions() {
    const available=[...new Set(d.matches.map(m=>m.season))];
    const seasonSel=$('seasonSelect');
    [...seasonSel.options].forEach(o=>o.hidden=!available.includes(o.value));
    if(!available.includes(d.chosenSeason)) d.chosenSeason=available.includes('2026-27')?'2026-27':(available.at(-1)||'2025-26');
    seasonSel.value=d.chosenSeason;
    d.currentSeason=available.includes('2026-27')?'2026-27':(available.at(-1)||d.chosenSeason);
    // Team options reflect the most recent available competition cohort, not relegated clubs from earlier seasons.
    const current=d.matches.filter(m=>m.season===d.currentSeason);
    const teams=[...new Set(current.flatMap(m=>[m.home,m.away]))].sort();
    for (const select of [$('homeTeam'),$('awayTeam')]) {
      const old=select.value;
      select.innerHTML=teams.map(t=>`<option value="${esc(t)}">${esc(short(t))}</option>`).join('');
      select.value=teams.includes(old)?old:(select.id==='homeTeam'?(teams.includes('Arsenal FC')?'Arsenal FC':teams[0]):(teams.includes('Liverpool FC')?'Liverpool FC':teams[1]));
    }
    d.home=$('homeTeam').value; d.away=$('awayTeam').value;
    if(d.home===d.away && teams.length>1){d.away=teams.find(x=>x!==d.home);$('awayTeam').value=d.away;}
  }

  function render() {
    const limit=new Date().toISOString().slice(0,10);
    const ev=M.evaluate(d.matches,d.chosenSeason,limit); d.evaluation=ev;
    const seasonResults=ev.chosen;
    const played=seasonResults.length, goals=seasonResults.reduce((s,m)=>s+m.hg+m.ag,0);
    const homeWins=seasonResults.filter(m=>m.actual==='H').length;
    $('matchesMetric').textContent=played.toLocaleString();
    $('goalsMetric').textContent=played?number(goals/played,2):'—';
    $('homeRateMetric').textContent=played?percentage(homeWins/played):'—';
    $('modelMetric').textContent=ev.improvement==null?'—':`${ev.improvement>=0?'+':''}${number(ev.improvement*100,1)}%`;
    $('modelMetricCaption').textContent=ev.improvement==null?'Need observed results':ev.improvement>=0?'Less error than frequency baseline':'More error than frequency baseline';
    renderForecast(); renderStandings(); renderDiagnostics(); renderQueue();
  }

  function renderForecast(){
    if(!d.evaluation) return;
    if(d.home===d.away){return;}
    const boost=Number($('boostSlider').value)/100;
    const p=M.predict(d.evaluation.state,d.home,d.away,boost);
    const ps=[p.H,p.D,p.A], outputs=['homeProb','drawProb','awayProb'];
    outputs.forEach((id,i)=>$(id).textContent=percentage(ps[i]));
    const spans=$('probabilityStrip').querySelectorAll('span');
    ps.forEach((x,i)=>spans[i].style.width=`${(x*100).toFixed(3)}%`);
    $('homeXG').textContent=number(p.homeXG,2);
    $('awayXG').textContent=number(p.awayXG,2);
    $('homeGoalBar').style.width=`${Math.min(100,p.homeXG/4*100)}%`;
    $('awayGoalBar').style.width=`${Math.min(100,p.awayXG/4*100)}%`;
    $('boostOutput').textContent=`${Math.round(boost*100)}%`;
    $('scenarioLabel').textContent=boost===1?'STANDARD CONDITIONS':`${Math.round((boost-1)*100)}% HOME ATTACK SCENARIO`;
    const likely=p.likely[0];
    $('projectedScore').textContent=`Likeliest score: ${likely.home}–${likely.away} (${percentage(likely.p)})`;
    const uncertainty=p.uncertainty;
    const label=uncertainty>=.93?'High uncertainty':uncertainty>=.82?'Moderate uncertainty':'Lower uncertainty';
    $('riskLabel').textContent=label;
    $('riskIcon').textContent=uncertainty>=.93?'≈':uncertainty>=.82?'◇':'↗';
    $('riskMeter').style.left='0';
    $('riskMeter').style.marginLeft=`${Math.min(100,uncertainty*100)}%`;
    const favorite=p.H>p.A?d.home:d.away, favoritePct=Math.max(p.H,p.A);
    $('riskDescription').textContent=uncertainty>=.93?'The three outcomes are relatively balanced. Prioritise deeper opponent scouting and preparation for multiple match states.':uncertainty>=.82?'The projection finds an edge, but alternative results remain credible. Keep a contingency plan.':`The model leans toward ${short(favorite)} (${percentage(favoritePct)} for ${p.H>p.A?'a home':'an away'} win). Still plan for surprises.`;
    const gap=p.homeXG-p.awayXG;
    $('signal1').querySelector('p').textContent=`Expected goals: ${number(p.homeXG,2)} home vs ${number(p.awayXG,2)} away (${gap>=0?'+':''}${number(gap,2)} difference).`;
    $('signal2').querySelector('p').textContent=`Both sides scoring: ${percentage(p.btts)}; 3+ combined goals: ${percentage(p.over25)} under the model.`;
    $('signal3').querySelector('p').textContent=p.homeMatches<6||p.awayMatches<6?'Limited venue-specific samples for at least one team; priors strongly influence this forecast.':`Venue sample depth: ${p.homeMatches} historical home fixtures and ${p.awayMatches} historical away fixtures in the training window.`;
  }

  function renderStandings(){
    const state=d.evaluation.currentState;
    $('standingsTitle').textContent=`${d.chosenSeason.replace('-', '/')} league snapshot`;
    const query=$('standingsSearch').value.toLowerCase().trim();
    const rows=M.standings(state).filter(t=>t.name.toLowerCase().includes(query));
    const body=$('standingsRows');
    const fullRows=M.standings(state);
    body.innerHTML=rows.map(t=>{
      const position=fullRows.findIndex(x=>x.name===t.name)+1;
      return `<tr><td>${position.toString().padStart(2,'0')}</td><td><span class="club-mark">${esc(seedLetters(t.name))}</span>${esc(short(t.name))}</td><td>${t.played}</td><td>${t.won}</td><td>${t.drawn}</td><td>${t.lost}</td><td>${t.diff>0?'+':''}${t.diff}</td><td>${t.points}</td><td><span class="form">${t.form.map(x=>`<i class="${x}">${x}</i>`).join('')}</span></td></tr>`;
    }).join('')||'<tr><td colspan="9" class="empty-row">No matching teams in the selected results.</td></tr>';
  }

  function renderDiagnostics(){
    const ev=d.evaluation;
    const model=ev.modelBrier,base=ev.baselineBrier;
    $('brierModel').textContent=number(model,3);
    $('brierBase').textContent=number(base,3);
    $('brierModelText').textContent=number(model,3);
    $('brierBaseText').textContent=number(base,3);
    const max=Math.max(model||0,base||0,.3);
    $('modelBar').style.width=`${model==null?0:model/max*100}%`;
    $('baselineBar').style.width=`${base==null?0:base/max*100}%`;
    $('backtestReadout').textContent=ev.total<10?'Not enough matches to draw a stable conclusion. The calculations are provided for illustration only.':ev.improvement>=0?`On ${ev.total} completed fixtures, the model reduced Brier error by ${number(ev.improvement*100,1)}% relative to a rolling league-frequency baseline.`:`On ${ev.total} completed fixtures, the model had ${number(-ev.improvement*100,1)}% higher Brier error than the baseline. This is reported openly, not hidden.`;
    $('calibrationChart').innerHTML=ev.calibration.map(c=>{
      if(c.n<5) return `<div class="chart-col"><small>${esc(c.label)}<span>n=${c.n}</span></small></div>`;
      return `<div class="chart-col" title="${esc(c.label)}: predicted ${percentage(c.forecast)}, observed ${percentage(c.observed)} (${c.n} cases)"><i class="col-bar" style="height:${c.forecast*100}%"></i><i class="col-bar actual" style="height:${c.observed*100}%"></i><small>${esc(c.label)}<span>n=${c.n}</span></small></div>`;
    }).join('');
  }

  function renderQueue(){
    const current=d.matches.filter(m=>m.season===d.currentSeason);
    const q=M.priorities(current,d.evaluation.state,new Date().toISOString().slice(0,10)).slice(0,4);
    $('fixtureQueue').innerHTML=q.length?q.map(m=>{
      const p=m.prediction;
      const time=new Date(m.date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});
      return `<article class="queue-card"><div class="queue-head"><span>${esc(time)}</span><span>${percentage(p.uncertainty)} UNCERTAINTY</span></div><div class="queue-clubs"><div>${esc(short(m.home))}</div><div>${esc(short(m.away))}</div></div><div class="queue-line"><span class="queue-pill">REVIEW PRIORITY</span><span class="queue-prob">${percentage(p.H)} / ${percentage(p.D)} / ${percentage(p.A)}</span></div></article>`;
    }).join(''):'<div class="empty-queue">No upcoming unscored fixtures in the current data snapshot. Use Matchup studio above to simulate any pair of clubs.</div>';
    $('fixtureQueue').querySelectorAll('.queue-card').forEach((el,i)=>{
      el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',`Open forecast for ${q[i].home} vs ${q[i].away}`);
      const open=()=>{d.home=q[i].home;d.away=q[i].away;$('homeTeam').value=d.home;$('awayTeam').value=d.away;renderForecast();document.getElementById('matchup').scrollIntoView({behavior:'smooth'});};
      el.addEventListener('click',open);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    });
  }

  function updatePair(which){
    d.home=$('homeTeam').value;d.away=$('awayTeam').value;
    if(d.home===d.away){
      const alt=[...$('awayTeam').options].map(o=>o.value).find(x=>x!==d.home);
      if(which==='home') {$('awayTeam').value=alt;d.away=alt;} else {$('homeTeam').value=alt;d.home=alt;}
    }
    renderForecast();
  }

  function downloadCSV(){
    if(!d.evaluation) return;
    const content=M.csv(d.evaluation.chosen);
    const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=`scoutboard-backtest-${d.chosenSeason}.csv`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }

  function bind(){
    $('seasonSelect').addEventListener('change',e=>{d.chosenSeason=e.target.value;render();});
    $('homeTeam').addEventListener('change',()=>updatePair('home'));
    $('awayTeam').addEventListener('change',()=>updatePair('away'));
    $('swapTeams').addEventListener('click',()=>{const h=$('homeTeam').value;$('homeTeam').value=$('awayTeam').value;$('awayTeam').value=h;updatePair('home');});
    $('boostSlider').addEventListener('input',renderForecast);
    $('standingsSearch').addEventListener('input',renderStandings);
    $('downloadCSV').addEventListener('click',downloadCSV);
    $('refreshData').addEventListener('click',fetchData);
    $('copyForecast').addEventListener('click',async()=>{
      const text=`ScoutBoard / ${short(d.home)} vs ${short(d.away)}: Home ${$('homeProb').textContent}, Draw ${$('drawProb').textContent}, Away ${$('awayProb').textContent}; expected goals ${$('homeXG').textContent}–${$('awayXG').textContent}. Descriptive model, not betting advice. Source: OpenFootball.`;
      try{await navigator.clipboard.writeText(text);$('copyForecast').textContent='Copied ✓';setTimeout(()=>$('copyForecast').textContent='Copy insight ↗',1800);}catch(e){$('copyForecast').textContent='Copy unavailable';}
    });
    document.querySelectorAll('.nav-link').forEach(a=>a.addEventListener('click',()=>{document.querySelectorAll('.nav-link').forEach(x=>x.classList.remove('active'));a.classList.add('active');}));
  }

  bind();fetchData();
})();

