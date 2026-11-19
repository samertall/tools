'use strict';
// Zero-dependency local preview for the production Vercel handler.
// Run with node >=18: npm run dev
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const handler=require('./api/market');
const port=Number(process.env.PORT)||3000;
http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://localhost:'+port);
  res.status=function(n){res.statusCode=n;return res;};
  res.json=function(value){res.end(JSON.stringify(value));return res;};
  if(u.pathname==='/api/market'){
    req.query=Object.fromEntries(u.searchParams);
    await handler(req,res);
    return;
  }
  if(u.pathname==='/'||u.pathname==='/index.html'){
    res.setHeader('Content-Type','text/html; charset=utf-8');
    fs.createReadStream(path.join(__dirname,'index.html')).pipe(res);
    return;
  }
  res.statusCode=404;res.end('Not found');
}).listen(port,'127.0.0.1',()=>console.log('Signal Atlas at http://127.0.0.1:'+port));