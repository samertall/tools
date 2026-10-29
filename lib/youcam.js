/** Server-only YouCam API adapter. API key never leaves the server. */
export const API_HOST = 'https://yce-api-01.makeupar.com';
export const API_VERSION = 'v2.0';
export const ACTIONS = ['moisture','texture','redness','pore','acne','radiance','age_spot','oiliness'];
export function apiKey(){return process.env.YOUCAM_API_KEY || ''}
export function parseImage(image){
  if(typeof image!=='string')throw new Error('Image must be encoded as a data URL.');
  const match=/^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(image);
  if(!match)throw new Error('Only base64 JPEG and PNG images are supported.');
  const data=Buffer.from(match[2],'base64');
  if(data.length<1500||data.length>9*1024*1024)throw new Error('Image must be between 1.5 KB and 9 MB.');
  const jpeg=match[1]==='image/jpeg';
  if(jpeg && !(data[0]===0xff&&data[1]===0xd8))throw new Error('JPEG content is invalid.');
  if(!jpeg && !(data[0]===0x89&&data[1]===0x50&&data[2]===0x4e&&data[3]===0x47))throw new Error('PNG content is invalid.');
  return {data,mime:match[1],name:jpeg?'scan.jpg':'scan.png'};
}
export function normalizeSkinResult(body){
  if(!body || typeof body!=='object')return null;
  const root=body.results||body;
  const details=root.output||root.score_info||root.results||root;
  const rows=Array.isArray(details)?details:Array.isArray(details.output)?details.output:Object.entries(details).map(([type,v])=>({type,...(v&&typeof v==='object'?v:{score:v})}));
  const accepted=new Set(ACTIONS), concerns={};let overall=null;
  for(const item of rows){const name=String(item?.type||item?.name||item?.concern||item?.key||'').replace(/^hd_/,'').replace(/_v2$/,'');
    const ui=Number(item?.ui_score??item?.uiScore??item?.score??item?.raw_score);
    const raw=Number(item?.raw_score??item?.rawScore??item?.score??item?.ui_score);
    if(!Number.isFinite(ui))continue;
    if(name==='all'||name==='overall'){overall=Math.max(0,Math.min(100,ui));continue;}
    if(accepted.has(name)) concerns[name]={ui_score:Math.max(0,Math.min(100,ui)),raw_score:Number.isFinite(raw)?Math.max(0,Math.min(100,raw)):ui};
  }
  if(overall===null){const n=Number(root.all?.score??root.all??root.overall_score??root.skin_score);if(Number.isFinite(n))overall=Math.max(0,Math.min(100,n));}
  if(!Object.keys(concerns).length)return null;
  if(overall===null)overall=Math.round(Object.values(concerns).reduce((n,x)=>n+x.ui_score,0)/Object.keys(concerns).length);
  return {overall,concerns};
}
export async function callYouCam(path, init={}){
  const key=apiKey();if(!key)throw Object.assign(new Error('YOUCAM_API_KEY is not configured on the server.'),{status:503});
  const signal=AbortSignal.timeout(26000);
  const response=await fetch(`${API_HOST}/s2s/${API_VERSION}/${path}`,{...init,signal,headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json',...(init.headers||{})}});
  const json=await response.json().catch(()=>({}));
  if(!response.ok || (json.status && json.status>=400)){
    const message=json?.error?.message||json?.error||json?.message||JSON.stringify(json?.data||json).slice(0,260);
    throw Object.assign(new Error(`YouCam returned ${response.status}: ${String(message)}`),{status:response.status});
  }
  return json;
}
export function respondError(res,error){return res.status(error?.status&&Number.isInteger(error.status)?error.status:500).json({error:String(error?.message||'Unknown server error').slice(0,450)})}
