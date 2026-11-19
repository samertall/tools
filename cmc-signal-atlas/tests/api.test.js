'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
// All external calls in this test are FAKE fixtures. See docs for real response evidence.
const handler=require('../api/market');
function res(){
 return {headers:{},code:200,setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(v){this.body=v;return this;}};
}
test('keyless CMC backend supplies provider evidence, no secret header',async()=>{
 const saved=global.fetch;const calls=[];
 global.fetch=async(url,opts)=>{
   calls.push({url,headers:opts.headers});
   const data=url.includes('listings')?[{id:1,name:'Bitcoin',symbol:'BTC',cmc_rank:1,quote:[{id:2781,symbol:'USD',price:10,market_cap:100,volume_24h:25,percent_change_24h:3}]}]:
    url.includes('global-metrics')?{btc_dominance:44,quote:{USD:{total_market_cap:1000,total_volume_24h:200}}}:
    url.includes('fear')?{value:55}:url.includes('altcoin')?{value:45}:{value:700};
   return {ok:true,status:200,json:async()=>({status:{timestamp:'2026-11-19T00:00:00Z',error_code:0,credit_count:0},data})};
 };
 try{
  const output=res();await handler({method:'GET',query:{view:'overview'}},output);
  assert.equal(output.code,200);assert.equal(output.body.mode,'live');
  assert.equal(output.body.coins.length,1);
  assert.equal(output.body.coins[0].price,10);
  assert.equal(output.body.insight.available,true);
  assert.ok(Number.isFinite(output.body.insight.score));
  assert.equal(output.body.evidence.length,5);
  assert.equal(output.body.evidence[0].httpStatus,200);
  assert.ok(calls.every(c=>c.url.includes('/public-api/')));
  assert.ok(calls.every(c=>!c.headers['X-CMC_PRO_API_KEY']));
 }finally{global.fetch=saved;}
});
test('rejects unsupported mutation requests',async()=>{
 const output=res();await handler({method:'POST',query:{view:'overview'}},output);
 assert.equal(output.code,405);
});