import test from 'node:test';
import assert from 'node:assert/strict';
import start from '../api/start.js';
import status from '../api/status.js';

function response(){
 return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.statusCode=n;return this},json(v){this.body=v;return this}};
}
function json(data,statusCode=200){return {ok:statusCode>=200&&statusCode<300,status:statusCode,async json(){return data}}}

test('integration: signed upload -> skin task -> result normalization (mocked provider)',async()=>{
 const oldKey=process.env.YOUCAM_API_KEY;
 const oldFetch=globalThis.fetch;
 process.env.YOUCAM_API_KEY='integration_test_secret';
 const calls=[];
 globalThis.fetch=async(url,init={})=>{
   calls.push({url:String(url),method:init.method||'GET',headers:init.headers,body:init.body});
   const path=String(url);
   if(path.endsWith('/file/skin-analysis'))return json({status:200,data:{files:[{file_id:'test-file-id',requests:[{method:'PUT',url:'https://signed-upload.test/upload',headers:{'Content-Type':'image/jpg','Content-Length':'1604'}}]}]}});
   if(path==='https://signed-upload.test/upload')return {ok:true,status:200};
   if(path.endsWith('/task/skin-analysis')&&init.method==='POST')return json({status:200,data:{task_id:'task_1234567890123'}});
   if(path.endsWith('/task/skin-analysis/task_1234567890123'))return json({status:200,data:{task_status:'success',results:{output:[{type:'moisture',ui_score:64,raw_score:63.4},{type:'pore',ui_score:89,raw_score:87.7}]}}});
   throw new Error('Unexpected provider request: '+path);
 };
 try{
   const data=Buffer.alloc(1604,0);data[0]=0xff;data[1]=0xd8;
   const startRes=response();
   await start({method:'POST',body:{image:'data:image/jpeg;base64,'+data.toString('base64')}},startRes);
   assert.equal(startRes.statusCode,200);
   assert.equal(startRes.body.taskId,'task_1234567890123');
   assert.equal(calls.length,3);
   assert.ok(calls[0].url.endsWith('/s2s/v2.0/file/skin-analysis'));
   assert.equal(calls[1].headers['Content-Type'],'image/jpg');
   assert.deepEqual(JSON.parse(calls[2].body).dst_actions,['moisture','texture','redness','pore','acne','radiance','age_spot','oiliness']);
   const statusRes=response();
   await status({method:'GET',query:{taskId:startRes.body.taskId}},statusRes);
   assert.equal(statusRes.body.status,'success');
   assert.equal(statusRes.body.normalized.concerns.moisture.ui_score,64);
   assert.equal(statusRes.body.normalized.concerns.pore.ui_score,89);
 }finally{
   globalThis.fetch=oldFetch;
   if(oldKey===undefined)delete process.env.YOUCAM_API_KEY;else process.env.YOUCAM_API_KEY=oldKey;
 }
});

test('start endpoint refuses an API call without a key',async()=>{
 const oldKey=process.env.YOUCAM_API_KEY;
 delete process.env.YOUCAM_API_KEY;
 const data=Buffer.alloc(1604,0);data[0]=0xff;data[1]=0xd8;
 try {
   const res=response();await start({method:'POST',body:{image:'data:image/jpeg;base64,'+data.toString('base64')}},res);
   assert.equal(res.statusCode,503);
   assert.match(res.body.error,/not configured/i);
 }finally {if(oldKey!==undefined)process.env.YOUCAM_API_KEY=oldKey}
});
