/** LumenChoice's deterministic, dependency-free decision engine. */
export const clamp = (value, min, max) => Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));
export const DEFAULT_DECISION = {
  title: 'Choose my next learning path',
  context: 'Find the best route to new skills without overlooking cost, time, or long-term impact.',
  criteria: [
    { id: 'impact', name: 'Career impact', weight: 30, description: 'Long-term relevance and opportunity' },
    { id: 'cost', name: 'Affordability', weight: 25, description: 'Fit with the available budget' },
    { id: 'flex', name: 'Flexibility', weight: 20, description: 'Control over schedule and pace' },
    { id: 'speed', name: 'Time to value', weight: 15, description: 'How quickly benefits appear' },
    { id: 'community', name: 'Community', weight: 10, description: 'Mentorship, peers and support' }
  ],
  options: [
    { id: 'bootcamp', name: 'Design bootcamp', description: 'Structured, mentor-led learning', color: '#bbf47b', scores: { impact: 9, cost: 5, flex: 6, speed: 8, community: 9 } },
    { id: 'selfstudy', name: 'Self-paced learning', description: 'Build an independent curriculum', color: '#a8b7ff', scores: { impact: 7, cost: 10, flex: 10, speed: 7, community: 4 } },
    { id: 'certificate', name: 'University certificate', description: 'Formal, recognized credential', color: '#ffcf96', scores: { impact: 9, cost: 6, flex: 7, speed: 5, community: 8 } },
    { id: 'mentorship', name: 'Mentorship program', description: 'Learn directly from practitioners', color: '#f4a4db', scores: { impact: 8, cost: 7, flex: 8, speed: 8, community: 10 } }
  ]
};
export function normalizeWeights(criteria) {
  const total = criteria.reduce((sum, item) => sum + clamp(item.weight, 0, 1000), 0);
  return criteria.map(item => ({ ...item, normalized: total ? clamp(item.weight, 0, 1000) / total : 1 / Math.max(1, criteria.length) }));
}
export function scoreOption(option, criteria) {
  const weights = normalizeWeights(criteria);
  return weights.reduce((sum, item) => sum + (clamp(option.scores[item.id] ?? 5, 0, 10) / 10) * item.normalized * 100, 0);
}
export function rankOptions(options, criteria) {
  return options.map(option => ({ ...option, score: scoreOption(option, criteria) }))
    .sort((a,b) => b.score - a.score || a.name.localeCompare(b.name));
}
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
/** Weight perturbation around current preferences, plus bounded score uncertainty.
 *  Monte Carlo probabilities are conditional on the selected perturbation model,
 *  not claims about real-world outcomes. Seeded for reproducibility. */
export function stressTest(options, criteria, volatility = 25, runs = 900, seed = 2026) {
  if (!options.length || !criteria.length) return { wins: [], stability: 0, runs: 0, volatility };
  const random = rng(seed); const v = clamp(volatility, 0, 75)/100;
  const wins = Object.fromEntries(options.map(option => [option.id,0]));
  const origin = rankOptions(options,criteria)[0]?.id;
  for (let run=0; run<runs; run++) {
    const weights = criteria.map(c => ({...c,weight:Math.max(0.1, clamp(c.weight,0,1000) * (1 + (random()*2-1)*v))}));
    const ranked = options.map(option => ({ id:option.id, score:normalizeWeights(weights).reduce((sum,c) => {
      const rating = clamp(option.scores[c.id] ?? 5,0,10);
      const uncertain = clamp(rating + (random()*2-1)*v*2,0,10);
      return sum + uncertain*c.normalized*10;
    },0)})).sort((a,b) => b.score-a.score || a.id.localeCompare(b.id));
    wins[ranked[0].id]++;
  }
  return { wins:options.map(option=>({id:option.id, name:option.name, count:wins[option.id], percentage:Math.round(wins[option.id]/runs*100)})), stability:Math.round((wins[origin]||0)/runs*100), runs, volatility };
}
export function explainWinner(options, criteria) {
  const ranked=rankOptions(options,criteria); const winner=ranked[0], runner=ranked[1];
  if (!winner) return null;
  const weighted=normalizeWeights(criteria).map(c => ({id:c.id,name:c.name,weight:c.normalized*100, rating:clamp(winner.scores[c.id]??5,0,10),contribution:clamp(winner.scores[c.id]??5,0,10)*c.normalized*10}));
  const strengths=[...weighted].sort((a,b)=>b.contribution-a.contribution);
  const gaps= runner? normalizeWeights(criteria).map(c=>({name:c.name,delta:((winner.scores[c.id]??5)-(runner.scores[c.id]??5))*c.normalized*10})).sort((a,b)=>b.delta-a.delta):[];
  return {winner,runner,margin:runner?winner.score-runner.score:null, strengths, keyStrength:strengths[0],advantage:gaps.find(g=>g.delta>0.01)||null};
}
export function validateDecision(raw) {
  if (!raw || typeof raw!=='object' || !Array.isArray(raw.criteria) || !Array.isArray(raw.options)) throw Error('Not a LumenChoice decision file.');
  if (!raw.criteria.length || raw.criteria.length>10 || raw.options.length>12) throw Error('Use 1–10 criteria and at most 12 options.');
  const criteria=raw.criteria.map((c,i)=>({id:String(c.id??`criterion-${i}`).slice(0,60), name:String(c.name??'Criterion').slice(0,60), weight:clamp(c.weight??10,0,100), description:String(c.description??'').slice(0,200)}));
  if (new Set(criteria.map(c=>c.id)).size!==criteria.length) throw Error('Criteria IDs must be unique.');
  const options=raw.options.map((o,i)=>({id:String(o.id??`option-${i}`).slice(0,60),name:String(o.name??`Option ${i+1}`).slice(0,80),description:String(o.description??'').slice(0,160),color:/^#[0-9a-fA-F]{6}$/.test(o.color)?o.color:'#bbf47b',scores:Object.fromEntries(criteria.map(c=>[c.id,clamp(o.scores?.[c.id]??5,0,10)]))}));
  if (new Set(options.map(o=>o.id)).size!==options.length) throw Error('Option IDs must be unique.');
  return {title:String(raw.title??'Untitled decision').slice(0,120),context:String(raw.context??'').slice(0,400),criteria,options};
}