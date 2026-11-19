'use strict';

// All inputs come from CMC. Pure, deterministic functions — no price forecasts.
const STABLE = new Set(['USDT','USDC','DAI','FDUSD','TUSD','USDD','PYUSD','USDE','USDS','FRAX','RLUSD']);
const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
const valid=n=>typeof n==='number'&&Number.isFinite(n);
const average=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
const round=(n,p=2)=>valid(n)?Number(n.toFixed(p)):null;

function normalizeCoins(raw){
  if(!Array.isArray(raw)) return [];
  return raw.map(c=>{
    const q=c?.quote?.USD || c?.quotes?.USD || {};
    return {
      id:Number(c.id)||0, rank:Number(c.cmc_rank)||null,
      name:String(c.name||''), symbol:String(c.symbol||''),
      price:valid(q.price)?q.price:null,
      cap:valid(q.market_cap)?q.market_cap:null,
      volume:valid(q.volume_24h)?q.volume_24h:null,
      change1h:valid(q.percent_change_1h)?q.percent_change_1h:null,
      change24h:valid(q.percent_change_24h)?q.percent_change_24h:null,
      change7d:valid(q.percent_change_7d)?q.percent_change_7d:null,
      lastUpdated:q.last_updated||c.last_updated||null,
      stablecoin:STABLE.has(String(c.symbol||'').toUpperCase()) || (c.tags||[]).some(t=>String(t).toLowerCase()==='stablecoin')
    };
  }).filter(c=>c.id&&c.name&&c.symbol);
}

function computeMarket(coins,global={},fear={},alt={}){
  const tradable=coins.filter(c=>!c.stablecoin&&valid(c.change24h)&&valid(c.cap)&&c.cap>0);
  const changes=tradable.map(c=>c.change24h);
  if(!changes.length) return {available:false,reason:'Insufficient quoted assets'};
  const winners=changes.filter(v=>v>0).length;
  const breadth=100*winners/changes.length;
  const equal=average(changes);
  const capSum=tradable.reduce((s,c)=>s+c.cap,0);
  const capWeighted=tradable.reduce((s,c)=>s+c.cap*c.change24h,0)/capSum;
  const sorted=[...changes].sort((a,b)=>a-b);
  const median=sorted.length%2 ? sorted[(sorted.length-1)/2] : (sorted[sorted.length/2-1]+sorted[sorted.length/2])/2;
  const variance=average(changes.map(x=>(x-equal)**2));
  const dispersion=Math.sqrt(variance);
  const f=valid(Number(fear?.value))?Number(fear.value):null;
  const a=valid(Number(alt?.altcoin_season_index))?Number(alt.altcoin_season_index):valid(Number(alt?.value))?Number(alt.value):null;
  const participation=clamp(100-Math.abs(capWeighted-equal)*10);
  const factors=[
    {key:'breadth',label:'Advancing breadth',value:round(breadth),weight:0.35,detail:`${winners} of ${changes.length} non-stablecoin assets gained over 24h`},
    {key:'sentiment',label:'CMC Fear & Greed',value:valid(f)?round(f):null,weight:0.25,detail:'CoinMarketCap proprietary sentiment index'},
    {key:'momentum',label:'Median 24h momentum',value:round(clamp(50+median*7)),weight:0.25,detail:`Median return ${round(median)}% across sampled assets`},
    {key:'alignment',label:'Breadth alignment',value:round(participation),weight:0.15,detail:`Equal vs cap-weighted return gap ${round(capWeighted-equal)} pp`}
  ];
  const included=factors.filter(f=>valid(f.value));
  const score=round(included.reduce((s,f)=>s+f.value*f.weight,0)/included.reduce((s,f)=>s+f.weight,0),0);
  const regime=score>=66?'Constructive':score<35?'Defensive':'Mixed';
  const flags=[];
  if(capWeighted-equal>2&&breadth<50)flags.push({title:'Narrow leadership',type:'warning',detail:'Large-cap performance exceeds the equal-weight basket while fewer than half of assets advance.'});
  if(breadth<35&&median<-2)flags.push({title:'Broad selling pressure',type:'risk',detail:'Low positive breadth and a negative median 24h return coincide.'});
  if(valid(f)&&f>=70&&breadth<45)flags.push({title:'Sentiment / price divergence',type:'warning',detail:'Elevated sentiment contrasts with weak observed 24h breadth.'});
  if(valid(f)&&f<25&&breadth>65)flags.push({title:'Fear / breadth divergence',type:'info',detail:'Broad positive breadth occurs despite very low CMC sentiment.'});
  if(!flags.length)flags.push({title:'No triggered anomalies',type:'info',detail:'No configured rule thresholds were triggered in this snapshot; this does not imply low risk.'});
  const top10=tradable.slice(0,10).reduce((s,c)=>s+c.cap,0)/capSum*100;
  return {
    available:true,score,regime,coverage:tradable.length,breadth:round(breadth),winners,
    equalReturn:round(equal),capReturn:round(capWeighted),medianReturn:round(median),
    dispersion:round(dispersion),topTenConcentration:round(top10),
    fear:valid(f)?f:null,altcoinIndex:valid(a)?a:null,
    btcDominance:valid(global?.btc_dominance)?global.btc_dominance:null,
    ethDominance:valid(global?.eth_dominance)?global.eth_dominance:null,
    marketCap:global?.quote?.USD?.total_market_cap??null,
    globalVolume24h:global?.quote?.USD?.total_volume_24h??null,
    factors,flags,
    methodology:'Heuristic descriptive indicator; NOT a prediction or investment recommendation. Universe: current CMC top 100, excluding a stablecoin list. Recomputed from each fetched snapshot.'
  };
}

function analyzeRwa(row){
  const tokens=Array.isArray(row?.tokens)?row.tokens:[];
  const prices=tokens.map(t=>t.price).filter(v=>valid(v)&&v>0);
  const base=valid(row?.average_tokenized_price)?row.average_tokenized_price:row?.quotes?.find(q=>q.symbol==='USD')?.average_tokenized_price;
  const gap=prices.length>=2 && valid(base)&&base>0 ? 100*(Math.max(...prices)-Math.min(...prices))/base : null;
  const deviations=tokens.map(t=>({...t,deltaPct:valid(t.price)&&valid(base)&&base>0?round((t.price/base-1)*100):null}));
  const byIssuer={}; for(const t of tokens){if(valid(t.market_cap)&&t.market_cap>0)byIssuer[t.issuer_name||'Unspecified']=(byIssuer[t.issuer_name||'Unspecified']||0)+t.market_cap;}
  const issuerCaps=Object.values(byIssuer);const sum=issuerCaps.reduce((s,v)=>s+v,0);
  const maxShare=sum>0?round(Math.max(...issuerCaps)/sum*100):null;
  const turnover=valid(row?.tokenized_volume_24h)&&valid(row?.tokenized_market_cap)&&row.tokenized_market_cap>0?round(row.tokenized_volume_24h/row.tokenized_market_cap*100):null;
  const risks=[];
  if(valid(gap)&&gap>=1)risks.push({title:'Token quote dispersion',detail:`${round(gap)}% spread against aggregate tokenized price`});
  if(valid(maxShare)&&maxShare>=70&&issuerCaps.length>=2)risks.push({title:'Issuer concentration',detail:`Largest disclosed issuer accounts for ${round(maxShare)}% of sampled token market cap`});
  if(tokens.length<2)risks.push({title:'Limited comparison',detail:'Fewer than two token quotes in the API response'});
  return {gapPct:round(gap),largestIssuerShare:maxShare,turnoverPct:turnover,tokens:deviations,risks,issuerCount:issuerCaps.length};
}
module.exports={normalizeCoins,computeMarket,analyzeRwa,round,clamp};
