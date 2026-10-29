import {callYouCam,parseImage,respondError,ACTIONS} from '../lib/youcam.js';
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  res.setHeader('Cache-Control','no-store');
  try{
    const {data,mime,name}=parseImage(req.body?.image);
    const providerMime = mime === 'image/jpeg' ? 'image/jpg' : mime;
    const info=await callYouCam('file/skin-analysis',{method:'POST',body:JSON.stringify({files:[{content_type:providerMime,file_name:name,file_size:data.length}]})});
    const file=info?.data?.files?.[0],upload=file?.requests?.find(r=>r.method==='PUT')||file?.requests?.[0];
    if(!file?.file_id||!upload?.url)throw new Error('YouCam File API did not return an upload destination.');
    // The signed upload URL is provided by YouCam. Never log it or return it to the client.
    const uploaded=await fetch(upload.url,{method:'PUT',body:data,headers:{'Content-Type':providerMime,'Content-Length':String(data.length),...(upload.headers||{})},signal:AbortSignal.timeout(26000)});
    if(!uploaded.ok)throw new Error(`YouCam file upload failed (${uploaded.status}).`);
    const task=await callYouCam('task/skin-analysis',{method:'POST',body:JSON.stringify({src_file_id:file.file_id,dst_actions:ACTIONS,format:'json'})});
    const taskId=task?.data?.task_id;
    if(!taskId)throw new Error('YouCam did not return an analysis task ID.');
    return res.status(200).json({taskId});
  }catch(error){return respondError(res,error)}
}
