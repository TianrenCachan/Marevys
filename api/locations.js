'use strict';
const { LOCATIONS,findLocations }=require('../server/astrology-locations.cjs');
module.exports=function locations(req,res) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){res.setHeader('Allow','GET');res.statusCode=405;return res.end(JSON.stringify({error:{code:'METHOD_NOT_ALLOWED'}}));}
  const params=new URL(req.url,'https://marevys.invalid').searchParams;
  const query=params.get('q')||'';
  if(query.length>80){res.statusCode=400;return res.end(JSON.stringify({error:{code:'QUERY_TOO_LONG'}}));}
  res.setHeader('Cache-Control','public, max-age=86400');
  res.statusCode=200;
  return res.end(JSON.stringify({locations:findLocations(query,params.get('locale')||'fr'),limited:true,total:LOCATIONS.length}));
};
