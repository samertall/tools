/* Local dev server: serves static files and exercises the same API handlers as Vercel. */
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import health from './api/health.js';import start from './api/start.js';import status from './api/status.js';
const root=path.dirname(fileURLToPath(import.meta.url));const port=Number(process.env.PORT||4173);
const handlers={'/api/health':health,'/api/start':start,'/api/status':status};
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
http.createServer(async(req,res)=>{
  const url=new URL(req.url||'/',`http://localhost:${port}`);res.status=(n)=>{res.statusCode=n;return res};res.json=(obj)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(obj));return res};
  if(handlers[url.pathname]){res.query=Object.fromEntries(url.searchParams);if(req.method==='POST'){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>13_000_000){res.status(413).json({error:'Payload too large'});return}}try{req.body=JSON.parse(raw||'{}')}catch{res.status(400).json({error:'Invalid JSON'});return}}await handlers[url.pathname](req,res);return}
  let pathname=url.pathname==='/'?'/index.html':url.pathname;const target=path.resolve(root,'.'+pathname);if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return}try{const stat=fs.statSync(target);if(!stat.isFile())throw 0;res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');fs.createReadStream(target).pipe(res)}catch{res.writeHead(404);res.end('Not found')}
}).listen(port,()=>console.log(`ProofSkin running on http://127.0.0.1:${port}`));
