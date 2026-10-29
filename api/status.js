import {callYouCam,normalizeSkinResult,respondError} from '../lib/youcam.js';
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  res.setHeader('Cache-Control','no-store');
  const taskId=String(req.query?.taskId||'');
  if(!/^[A-Za-z0-9_-]{12,180}$/.test(taskId))return res.status(400).json({error:'Invalid task identifier.'});
  try{
    const response=await callYouCam('task/skin-analysis/'+encodeURIComponent(taskId));
    const data=response?.data||{};const status=String(data.task_status||'running').toLowerCase();
    if(status==='error'||status==='failed')return res.status(200).json({status:'error',details:data.error||data});
    if(status!=='success')return res.status(200).json({status:'running'});
    const normalized=normalizeSkinResult(data.results||data);
    if(!normalized)return res.status(502).json({error:'YouCam completed, but no parseable JSON scores were returned. Confirm that format=json is supported by your key.'});
    return res.status(200).json({status:'success',normalized});
  }catch(error){return respondError(res,error)}
}
