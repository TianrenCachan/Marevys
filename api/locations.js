'use strict';
const {searchLocations,MAX_QUERY}=require('../server/astrology-locations.cjs');
function createHandler(search=searchLocations) { return function locations(req,res) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){res.setHeader('Allow','GET');res.statusCode=405;return res.end(JSON.stringify({error:{code:'METHOD_NOT_ALLOWED'}}));}
  let params;
  try { params=new URL(req.url,'https://marevys.invalid').searchParams; }
  catch {res.statusCode=400;return res.end(JSON.stringify({error:{code:'INVALID_QUERY'}}));}
  const query=params.get('q')||'';
  if(query.length>MAX_QUERY){res.statusCode=400;return res.end(JSON.stringify({error:{code:'QUERY_TOO_LONG'}}));}
  if(/[\u0000-\u001f\u007f]/.test(query)){res.statusCode=400;return res.end(JSON.stringify({error:{code:'INVALID_QUERY'}}));}
  try {
    const result=search(query,params.get('locale')||'fr');
    res.setHeader('Cache-Control','public, max-age=3600, s-maxage=86400');
    res.statusCode=200;
    return res.end(JSON.stringify(result));
  } catch {
    // A missing/corrupt deployment asset is an unavailable search, not evidence
    // that the requested city does not exist. Never cache failures at the CDN.
    res.setHeader('Cache-Control','no-store');
    res.statusCode=503;
    return res.end(JSON.stringify({locations:[],status:'unavailable',error:{code:'LOCATION_SEARCH_UNAVAILABLE'}}));
  }
}; }
module.exports=createHandler();
module.exports.createHandler=createHandler;
