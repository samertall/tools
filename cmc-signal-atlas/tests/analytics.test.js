'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {normalizeCoins,computeMarket,analyzeRwa}=require('../lib/analytics');

function coin(symbol,change,cap=100){
  return {id:symbol==='BTC'?1:100+symbol.length,name:symbol,symbol,cmc_rank:1,quote:[{id:2781,symbol:'USD',price:100,market_cap:cap,volume_24h:10,percent_change_24h:change,percent_change_7d:4}]};
}
test('normalizes response and excludes stablecoins from market breadth',()=>{
  const list=normalizeCoins([coin('BTC',3,1000),coin('ALT',-2,100),coin('USDT',0,300)]);
  assert.equal(list.length,3);assert.equal(list[2].stablecoin,true);
  const result=computeMarket(list,{btc_dominance:58,quote:{USD:{total_market_cap:3000}}},{value:62},{value:31});
  assert.equal(result.available,true);assert.equal(result.coverage,2);assert.equal(result.breadth,50);assert.equal(result.btcDominance,58);
  assert.equal(result.factors.reduce((sum,f)=>sum+f.weight,0),1);
});
test('handles missing sentiment by renormalizing only available factors',()=>{
 const result=computeMarket(normalizeCoins([coin('BTC',2),coin('ALT',1)]));
 assert.equal(result.available,true);
 assert.equal(result.factors[1].value,null);
 assert.ok(result.score>=0&&result.score<=100);
});
test('detects broad selling pressure without predicting future prices',()=>{
 const result=computeMarket(normalizeCoins([coin('BTC',-5),coin('ETH',-6),coin('SOL',-3)]),{},{value:10});
 assert.ok(result.flags.some(flag=>flag.title==='Broad selling pressure'));
 assert.equal(result.regime,'Defensive');
});
test('unknown assets never produce misleading zero metrics',()=>{
 const result=computeMarket([]);
 assert.equal(result.available,false);
});
test('computes wrapper dispersion from aggregate tokenized basket, not spot',()=>{
 const a=analyzeRwa({average_tokenized_price:100,tokenized_market_cap:1000,tokenized_volume_24h:100,tokens:[
  {symbol:'A',issuer_name:'I1',price:101,market_cap:80},
  {symbol:'B',issuer_name:'I2',price:99,market_cap:20}
 ]});
 assert.equal(a.gapPct,2);
 assert.equal(a.largestIssuerShare,80);
 assert.equal(a.turnoverPct,10);
 assert.equal(a.tokens[0].deltaPct,1);
 assert.ok(a.risks.length>=1);
});
test('reports missing wrapper comparisons as N/A rather than inventing zero spread',()=>{
 const a=analyzeRwa({average_tokenized_price:200,tokens:[{symbol:'A',price:201}]});
 assert.equal(a.gapPct,null);
 assert.equal(a.largestIssuerShare,null);
});

test('supports CMC v3 quote array and legacy object shape',()=>{
  const array=normalizeCoins([coin('BTC',4)])[0];
  assert.equal(array.price,100);
  assert.equal(array.change24h,4);
  const legacy=normalizeCoins([{id:11,name:'Legacy',symbol:'LEG',quote:{USD:{price:30,market_cap:50,percent_change_24h:-4}}}])[0];
  assert.equal(legacy.price,30);
  assert.equal(legacy.change24h,-4);
});
