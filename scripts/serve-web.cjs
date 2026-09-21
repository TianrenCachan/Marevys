'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const reading=require('../api/reading.js');
const handlers={'/api/reading':reading,'/api/tarot':require('../api/tarot.js'),'/api/astrology':require('../api/astrology.js'),'/api/locations':require('../api/locations.js')};
const root=path.resolve(__dirname,'../dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(Object.hasOwn(handlers,pathname)){
    res.status=n=>{res.statusCode=n;return res;};
    res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));return res;};
    try{await handlers[pathname](req,res);}catch{if(!res.writableEnded){res.statusCode=500;res.end('{"error":"internal_error"}');}}
    return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
  let decoded;try{decoded=decodeURIComponent(pathname);}catch{res.writeHead(400);res.end();return;}
  const file=path.resolve(root,'.'+(decoded==='/'?'/index.html':decoded));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  try{const stat=fs.statSync(file);if(!stat.isFile())throw new Error('not file');res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-store'});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);}catch{res.writeHead(404);res.end('Not found');}
});
server.listen(Number(process.env.PORT)||4173,'0.0.0.0',()=>console.log('MAREVYS local preview: http://localhost:'+(Number(process.env.PORT)||4173)));
