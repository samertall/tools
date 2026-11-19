'use strict';
const {normalizeCoins,computeMarket,analyzeRwa}=require('../lib/analytics');
const ORIGIN='https://pro-api.coinmarketcap.com';
const PUBLIC=ORIGIN+'/public-api';
const LIMIT=16000;
const memory={};
const TTL=90*1000;
const publicRoutes={
  listings:'/v3/cryptocurrency/listings/latest?start=1&limit=100&convert=USD',
  global:'/v1/global-metrics/quotes/latest?convert=USD',
  sentiment:'/v3/fear-and-greed/latest',
  altcoin:'/v1/altcoin-season-index/latest',
  cmc100:'/v3/index/cmc100-latest'
};
function error(message,status=502,code='UPSTREAM_ERROR'){const e=new Error(message);e.status=status;e.code=code;return e;}
async function getCMC(path,key){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),LIMIT);
  try{
    const response=await fetch((key?ORIGIN:PUBLIC)+path,{
      headers:{accept:'application/json',...(key?{'X-CMC_PRO_API_KEY':key}:{})},
      signal:controller.signal
    });
    let payload;
    try {payload=await response.json();} catch {throw error('CoinMarketCap did not return JSON',502,'INVALID_JSON');}
    if(!response.ok||Number(payload?.status?.error_code||0)!==0){
      const code=response.status===429?'CMC_RATE_LIMIT':response.status===401?'CMC_AUTH_ERROR':'CMC_ERROR';
      throw error('CMC request failed ('+response.status+'): '+String(payload?.status?.error_message||'See CMC API documentation').slice(0,160),response.status,code);
    }
    return {data:payload.data,status:payload.status||{},httpStatus:response.status};
  }finally{clearTimeout(timeout);}
}
function buildProof(path,result){
  let excerpt=null;
  if(Array.isArray(result.data)) excerpt=result.data[0]||null;
  else if(Array.isArray(result.data?.rwa_assets)) excerpt=result.data.rwa_assets[0]||null;
  else if(result.data&&typeof result.data==='object') excerpt=result.data;
  const serialized=excerpt?JSON.stringify(excerpt):'';
  if(serialized.length>2400) excerpt={preview:serialized.slice(0,2400),truncated:true};
  return {endpoint:path.split('?')[0],query:path.includes('?')?path.split('?')[1]:'',httpStatus:result.httpStatus,cmcTimestamp:result.status.timestamp||null,creditCount:result.status.credit_count??null,apiErrorCode:result.status.error_code??0,returnedDataType:Array.isArray(result.data)?'array':typeof result.data,returnedItems:Array.isArray(result.data)?result.data.length:Array.isArray(result.data?.rwa_assets)?result.data.rwa_assets.length:null,responseExcerpt:excerpt};
}
async function overview(){
  if(memory.overview&&Date.now()-memory.overview.at<TTL)return {...memory.overview.value,cached:true};
  const settled=await Promise.allSettled(Object.entries(publicRoutes).map(async([name,path])=>({name,path,result:await getCMC(path)})));
  const data={},evidence=[],errors={};
  for(let i=0;i<settled.length;i++){
    const key=Object.keys(publicRoutes)[i],out=settled[i];
    if(out.status==='fulfilled'){data[key]=out.value.result.data;evidence.push(buildProof(out.value.path,out.value.result));}
    else errors[key]=String(out.reason?.message||'Fetch error');
  }
  if(!data.listings)throw error('Unable to retrieve live CMC listings: '+String(errors.listings||''),503,'LIVE_SOURCE_UNAVAILABLE');
  const coins=normalizeCoins(data.listings);
  if(!coins.length)throw error('CMC response contained no usable assets',502,'EMPTY_MARKET');
  const insight=computeMarket(coins,data.global||{},data.sentiment||{},data.altcoin||{});
  const value={mode:'live',source:'CoinMarketCap Keyless Public API',at:new Date().toISOString(),coins,insight,cmc100:data.cmc100||null,partialErrors:errors,evidence};
  memory.overview={at:Date.now(),value};return value;
}
async function rwa(){
  const key=process.env.CMC_API_KEY||process.env.CMC_PRO_API_KEY;
  if(!key)throw error('RWA feed requires the event Startup-tier CMC API key configured server-side as CMC_API_KEY.',503,'CMC_KEY_REQUIRED');
  if(memory.rwa&&Date.now()-memory.rwa.at<TTL)return {...memory.rwa.value,cached:true};
  const routes={
    rwa:'/v5/real-world-assets/assets/list?limit=100&sort=tokenized_market_cap&sort_dir=desc&convert=USD',
    issuers:'/v5/real-world-assets/issuers/list?limit=100'
  };
  const settled=await Promise.allSettled(Object.entries(routes).map(async([name,path])=>({name,path,result:await getCMC(path,key)})));
  const errors={},evidence=[],data={};
  for(let i=0;i<settled.length;i++){
    const name=Object.keys(routes)[i],out=settled[i];
    if(out.status==='fulfilled'){data[name]=out.value.result.data;evidence.push(buildProof(out.value.path,out.value.result));}
    else errors[name]=out.reason?.message||'Request failed';
  }
  if(!data.rwa)throw error('RWA request failed: '+(errors.rwa||''),503,'RWA_SOURCE_UNAVAILABLE');
  // Enrich list rows with token/issuer quotes in ONE batched CMC call.
  const listed=data.rwa?.rwa_assets||[];
  const ids=listed.filter(x=>Number.isInteger(x.rwa_id)).map(x=>x.rwa_id).slice(0,100).join(',');
  let enriched=new Map();
  if(ids){
    const detailPath='/v5/real-world-assets/quotes/latest?rwa_id='+ids+'&convert=USD';
    try{
      const detailed=await getCMC(detailPath,key);
      evidence.push(buildProof(detailPath,detailed));
      enriched=new Map((detailed.data?.rwa_assets||[]).map(x=>[x.rwa_id,x]));
    }catch(e){errors.quotes=e.message||'Quote details unavailable';}
  }
  const assets=listed.map(row=>{const combined={...row,...(enriched.get(row.rwa_id)||{})};return {...combined,analysis:analyzeRwa(combined)};});
  const value={mode:'live',at:new Date().toISOString(),assets,issuers:data.issuers?.issuers||[],evidence,partialErrors:errors,source:'CoinMarketCap authenticated RWA API'};
  memory.rwa={at:Date.now(),value};return value;
}
async function rwaDetail(id){
  const key=process.env.CMC_API_KEY||process.env.CMC_PRO_API_KEY;
  if(!key)throw error('CMC_API_KEY must be configured server-side',503,'CMC_KEY_REQUIRED');
  if(!/^\d{1,10}$/.test(id||''))throw error('Invalid RWA identifier',400,'INVALID_ID');
  const path='/v5/real-world-assets/quotes/latest?rwa_id='+id+'&convert=USD';
  const result=await getCMC(path,key);
  const row=result.data?.rwa_assets?.[0];
  if(!row)throw error('No asset returned by CMC',404,'RWA_NOT_FOUND');
  return {mode:'live',at:new Date().toISOString(),asset:{...row,analysis:analyzeRwa(row)},evidence:[buildProof(path,result)]};
}
module.exports=async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=30');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const view=Array.isArray(req.query?.view)?'invalid':req.query?.view||'overview';
  try{
    const value=view==='overview'?await overview():view==='rwa'?await rwa():view==='rwa-detail'?await rwaDetail(String(req.query?.id||'')):null;
    if(!value)return res.status(400).json({error:'Unknown view'});
    res.status(200).json(value);
  }catch(e){res.setHeader('Cache-Control','no-store');res.status(e.status||502).json({error:e.message||'Unexpected error',code:e.code||'UPSTREAM_ERROR',mode:'error',at:new Date().toISOString()});}
};
