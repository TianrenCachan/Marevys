'use strict';
const { randomUUID } = require('node:crypto');
const { AstrologyError,calculateChart,basicReading }=require('../server/astrology.cjs');

const {calculateSynastry,basicSynastryReading}=require('../server/synastry.cjs');
const MAX_BODY=8*1024;
async function readBody(req) {
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||'')) throw Object.assign(new Error(),{status:415,code:'JSON_REQUIRED'});
  if(Number(req.headers['content-length']||0)>MAX_BODY) throw Object.assign(new Error(),{status:413,code:'BODY_TOO_LARGE'});
  let raw=req.body;
  if(raw===undefined) {
    let length=0;const chunks=[];
    for await(const chunk of req) {
      const bytes=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);length+=bytes.length;
      if(length>MAX_BODY) throw Object.assign(new Error(),{status:413,code:'BODY_TOO_LARGE'});
      chunks.push(bytes);
    }
    raw=Buffer.concat(chunks).toString('utf8');
  }
  if(Buffer.isBuffer(raw)) raw=raw.toString('utf8');
  if(typeof raw!=='string') raw=JSON.stringify(raw);
  if(typeof raw!=='string'||Buffer.byteLength(raw)>MAX_BODY) throw Object.assign(new Error(),{status:413,code:'BODY_TOO_LARGE'});
  try{return JSON.parse(raw);}catch{throw Object.assign(new Error(),{status:400,code:'INVALID_JSON'});}
}
function originAllowed(req) {
  if(req.headers['sec-fetch-site']==='cross-site') return false;
  if(!req.headers.origin) return false;
  try {
    const url=new URL(req.headers.origin);
    return url.origin===req.headers.origin && url.host===req.headers.host && (url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)));
  }catch{return false;}
}
function createHandler() {
  return async function astrology(req,res) {
    const requestId=randomUUID();
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('X-Request-Id',requestId);
    const send=(status,value)=>{res.statusCode=status;res.end(JSON.stringify(value));};
    try {
      if(req.method!=='POST'){res.setHeader('Allow','POST');return send(405,{error:{code:'METHOD_NOT_ALLOWED'},requestId});}
      if(!originAllowed(req))return send(403,{error:{code:'ORIGIN_DENIED'},requestId});
      const body=await readBody(req);
      if(body?.mode!==undefined&&!['natal','synastry'].includes(body.mode))throw new AstrologyError(400,'INVALID_INPUT',body.locale);
      const synastry=body?.mode==='synastry';
      const chart=synastry?calculateSynastry(body):calculateChart(body?.birth?{...body.birth,locale:body.locale,topic:body.topic}:body);
      return send(200,{ok:true,chart,reading:synastry?basicSynastryReading(chart,body.locale,body):basicReading(chart,body.locale,body),requestId});
    }catch(error){
      if(error instanceof AstrologyError)return send(error.status,{error:{code:error.code,message:error.message},requestId});
      const allowed=['JSON_REQUIRED','BODY_TOO_LARGE','INVALID_JSON'];
      return send(allowed.includes(error.code)?error.status:500,{error:{code:allowed.includes(error.code)?error.code:'CHART_UNAVAILABLE'},requestId});
    }
  };
}
module.exports=createHandler();
module.exports.createHandler=createHandler;
