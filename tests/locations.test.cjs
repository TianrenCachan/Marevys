'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {findLocations,getLocationById,searchLocations,normalizeTimezone,validCoordinates,LOCATIONS}=require('../server/astrology-locations.cjs');
const handler=require('../api/locations.js');

function call(url,method='GET',route=handler) {
  const headers={}; let body='';
  const res={statusCode:0,setHeader:(key,value)=>{headers[key]=value;},end:value=>{body=value;}};
  route({url,method},res);
  return {status:res.statusCode,headers,body:JSON.parse(body)};
}

test('global catalogue finds cities beyond the old curated list in Chinese, French and English',()=>{
  assert.equal(LOCATIONS.length,59);
  const chinese=findLocations('合肥','zh')[0];
  assert.equal(chinese.id,'geonames:1808722');
  assert.equal(chinese.name,'合肥'); assert.equal(chinese.admin,'安徽');
  assert.equal(chinese.countryName,'中国'); assert.equal(chinese.timezone,'Asia/Shanghai');
  assert.equal(findLocations('Hefei','en')[0].id,chinese.id);
  assert.equal(findLocations('Londres','fr')[0].id,'london');
  const saintMalo=findLocations('Saint-Malo','fr')[0];
  assert.equal(saintMalo.name,'Saint-Malo'); assert.equal(saintMalo.admin,'Bretagne');
  assert.equal(saintMalo.timezone,'Europe/Paris');
  assert.ok(searchLocations('合肥').total>25000);
});

test('curated IDs, accents and multilingual aliases remain stable',()=>{
  assert.equal(findLocations('巴黎','zh')[0].id,'paris');
  assert.equal(findLocations('Montreal','fr')[0].id,'montreal');
  assert.equal(findLocations('MONTRÉAL','fr')[0].id,'montreal');
  assert.equal(findLocations('温州市','zh')[0].id,'wenzhou');
  assert.equal(getLocationById('paris').latitude,48.8566);
  assert.equal(findLocations('').length,LOCATIONS.length);
});

test('same-name cities expose their own region and timezone; qualifiers narrow results',()=>{
  const results=findLocations('Springfield','en');
  assert.ok(results.length>2);
  assert.ok(results.some(p=>p.admin==='Massachusetts'&&p.timezone==='America/New_York'));
  assert.ok(results.some(p=>p.admin==='Missouri'&&p.timezone==='America/Chicago'));
  assert.notEqual(results.find(p=>p.admin==='Massachusetts').id,results.find(p=>p.admin==='Missouri').id);
  const narrowed=findLocations('Springfield, Massachusetts','en');
  assert.ok(narrowed.length>0);
  assert.ok(narrowed.every(p=>p.admin==='Massachusetts'));
  assert.equal(findLocations('Paris, France','en')[0].id,'paris');
});

test('selected global IDs resolve to trusted server-side coordinates and IANA zones',()=>{
  const location=findLocations('Kathmandu','en')[0];
  const canonical=getLocationById(location.id,'en');
  assert.deepEqual(canonical,location);
  assert.equal(new Intl.DateTimeFormat('en',{timeZone:canonical.timezone,timeZoneName:'longOffset'}).resolvedOptions().timeZone,canonical.timezone);
  assert.ok(validCoordinates(canonical.latitude,canonical.longitude));
  assert.equal(getLocationById('geonames:does-not-exist'),null);
  assert.equal(getLocationById('__proto__'),null);
  assert.equal(getLocationById('x'.repeat(100)),null);
  for(const value of ['+02:00','UTC+2','Fake/Zone','',null])assert.equal(normalizeTimezone(value),null);
  assert.equal(normalizeTimezone('Europe/Paris'),'Europe/Paris');
  for(const point of [[NaN,0],[90,0],[0,181],['48',2],[0,Infinity]])assert.equal(validCoordinates(...point),false);
});

test('Xinjiang offers clearly labelled canonical choices for both birth-record clocks',()=>{
  const choices=findLocations('喀什','zh').filter(p=>p.country==='CN');
  const local=choices.find(p=>p.id==='geonames:1280849');
  const beijing=choices.find(p=>p.id==='geonames:1280849:beijing');
  assert.ok(local); assert.ok(beijing);
  assert.equal(local.name,'喀什（新疆当地时间）');
  assert.equal(beijing.name,'喀什（北京时间）');
  assert.equal(local.timeConvention,'xinjiang-local');
  assert.equal(beijing.timeConvention,'beijing');
  assert.equal(local.timezone,'Asia/Urumqi'); assert.equal(beijing.timezone,'Asia/Shanghai');
  assert.equal(local.latitude,beijing.latitude); assert.equal(local.longitude,beijing.longitude);
  assert.equal(getLocationById(local.id).timezone,'Asia/Urumqi');
  assert.equal(getLocationById(beijing.id).timezone,'Asia/Shanghai');
  assert.match(getLocationById(local.id,'fr').name,/heure locale du Xinjiang/);
  assert.match(getLocationById(beijing.id,'en').name,/Beijing time/);
  const urumqi=findLocations('乌鲁木齐','zh');
  assert.equal(urumqi.find(p=>p.id==='urumqi').timezone,'Asia/Shanghai');
  assert.equal(urumqi.find(p=>p.id==='urumqi').name,'乌鲁木齐（北京时间）');
  assert.ok(urumqi.some(p=>p.timezone==='Asia/Urumqi'&&p.name.includes('新疆当地时间')));
});

test('same recorded hour resolves to UTC+8 or UTC+6 according to trusted Xinjiang choice',()=>{
  const {calculateChart,normalizeInput}=require('../server/astrology.cjs');
  const birth={date:'2000-01-01',time:'12:00',locale:'zh',latitude:0,longitude:0,timezone:'UTC'};
  const beijing=calculateChart({...birth,locationId:'geonames:1280849:beijing'});
  const local=calculateChart({...birth,locationId:'geonames:1280849'});
  assert.equal(beijing.instantUtc,'2000-01-01T04:00:00.000Z');
  assert.equal(local.instantUtc,'2000-01-01T06:00:00.000Z');
  const trusted=normalizeInput({...birth,locationId:'geonames:1280849:beijing',timezone:'Asia/Urumqi'});
  assert.equal(trusted.timezone,'Asia/Shanghai');
  assert.equal(trusted.latitude,getLocationById('geonames:1280849:beijing').latitude);
  const sameInstant=calculateChart({...birth,time:'10:00',locationId:'geonames:1280849'});
  assert.equal(sameInstant.instantUtc,beijing.instantUtc);
});

test('API returns bounded useful suggestions and licence attribution without external requests',()=>{
  const r=call('/api/locations?q=Saint&locale=en');
  assert.equal(r.status,200);
  assert.ok(r.body.locations.length>0&&r.body.locations.length<=20);
  assert.equal(r.body.status,'ok');
  assert.equal(r.body.source,'geonames-offline');
  assert.equal(r.body.attribution[0].url,'https://www.geonames.org/');
  assert.equal(r.body.attribution[0].license,'CC BY 4.0');
  assert.equal(r.body.snapshot,'2021-11-02');
  assert.ok(r.body.locations.every(p=>p.name&&p.countryName&&p.timezone));
  const suggestions=call('/api/locations?locale=zh');
  assert.equal(suggestions.body.status,'suggestions');
  assert.equal(suggestions.body.locations.length,12);
});

test('no match and service failure are distinct, and invalid requests are rejected',()=>{
  const empty=call('/api/locations?q=zzzzzz-no-such-place');
  assert.equal(empty.status,200); assert.equal(empty.body.status,'no_results');
  assert.deepEqual(empty.body.locations,[]);
  const unavailable=call('/api/locations?q=Paris','GET',handler.createHandler(()=>{throw new Error('asset unavailable');}));
  assert.equal(unavailable.status,503); assert.equal(unavailable.body.status,'unavailable');
  assert.equal(unavailable.headers['Cache-Control'],'no-store');
  assert.equal(unavailable.body.error.code,'LOCATION_SEARCH_UNAVAILABLE');
  assert.equal(call(`/api/locations?q=${'x'.repeat(81)}`).status,400);
  assert.equal(call('/api/locations?q=Paris%00').status,400);
  assert.equal(call('/api/locations','POST').status,405);
});
