/** Pure, dependency-free safety and report helpers; also exercised by node --test. */
export const MODEL_ID = 'onnx-community/SmolLM2-135M-Instruct-ONNX-MHA';
export const MODEL_RUNTIME = 'Transformers.js 3.8.1 · on-device ONNX · no API key';
export function normalizedEvidence(sources) {
  return sources.map((s,i)=>({id:'S'+(i+1),title:String(s.title||'Untitled').trim().slice(0,160),url:String(s.url||'').trim(),excerpt:String(s.excerpt||'').trim().slice(0,1600)})).filter(s=>s.excerpt.length>=15);
}
export function checkInputs(assumption, sources) {
  if (String(assumption||'').trim().length<20) return 'Write an assumption of at least 20 characters.';
  if (normalizedEvidence(sources).length===0) return 'Add at least one source with an excerpt of 15 or more characters.';
  return null;
}
export function buildPrompt({venture,assumption,customer,sources}) {
  const ledger=normalizedEvidence(sources).slice(0,4).map(s=>'['+s.id+'] '+s.title+'\n'+s.excerpt).join('\n\n');
  return 'You are a cautious critical-thinking assistant helping a founder. Use ONLY the source excerpts below; do not invent facts, percentages, competitors, or external citations. Never make a final business decision. Identify one reason the assumption might be wrong, one evidence gap, and three low-cost customer discovery questions. Cite supplied source IDs only when directly supported. Be concise and specific.\nVenture: '+String(venture||'Untitled').slice(0,100)+'\nTarget: '+String(customer||'Unknown').slice(0,120)+'\nFounder assumption: '+String(assumption).slice(0,800)+'\nSupplied excerpts (not independently verified):\n'+ledger+'\n\nRespond in plain English with headings: Risk:, Missing evidence:, Questions:. Nothing else.';
}
export function unwrapOutput(raw) {
  const value=raw?.[0]?.generated_text;
  if (typeof value==='string') return value.trim();
  if (Array.isArray(value)) return String(value.at(-1)?.content||'').trim();
  return '';
}
export function exportMarkdown({venture,assumption,customer,sources,critique,decision,notes,manualMinutes,runSeconds,modelId=MODEL_ID}) {
  if (!['approve','revise','reject'].includes(decision)) throw new Error('Human decision required');
  if (!String(notes).trim()) throw new Error('Human reasoning required');
  const ledger=normalizedEvidence(sources).map(s=>'- **['+s.id+'] '+s.title+'** '+(s.url?'('+s.url+')':'')+'\n  - User-provided excerpt: '+s.excerpt.replace(/\n/g,' ')).join('\n');
  const measured=Number.isFinite(runSeconds)?runSeconds.toFixed(1)+' seconds (this session, click to AI output; includes model initialization or download if needed; excludes human review and report export)':'not recorded';
  const baseline=Number(manualMinutes)>0?Number(manualMinutes)+' minutes (editable UI estimate, not independently measured)':'not supplied';
  return '# FounderLens AI — Founder-reviewed research briefing\n\nDate: '+new Date().toISOString()+'\n\n## Business question\n**Venture:** '+(venture||'Untitled')+'\n\n**Target customer:** '+(customer||'Not specified')+'\n\n**Assumption:** '+assumption+'\n\n## AI-generated exploratory critique (edited by founder if applicable)\n'+critique+'\n\n## Source ledger (supplied, NOT fact-checked by the application)\n'+ledger+'\n\n## Mandatory human judgment\n**Decision:** '+decision.toUpperCase()+'\n\n**Reasoning and next action:** '+notes+'\n\n## Time-saved measurement\n- Estimated manual baseline: '+baseline+'\n- Observed AI generation duration: '+measured+'\n- Verified minutes saved: NOT ESTABLISHED. Measure comparable manual and assisted runs before making a claim.\n\n## AI disclosure\n- Model: '+modelId+' (open weights, downloaded to browser via Hugging Face)\n- Framework: Transformers.js / ONNX Runtime Web\n- Execution: browser with no paid API or account; one generation per click; up to 170 new tokens per run\n\n## Responsible AI limitations\nSource-bound draft, not independent market research. Excerpts are unverified, may be biased or contain sensitive or copyrighted material. AI may hallucinate, misattribute claims or miss contradictions. Browser downloads model assets from Hugging Face/CDN. No external business action is performed. Founder must validate decisions.\n';
}