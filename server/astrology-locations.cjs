'use strict';

// A small curated set preserves familiar aliases and historical saved IDs.
// The searchable GeoNames gazetteer below adds 25,286 places and multilingual
// alternate names. Coordinates and IANA zones come from the source records,
// never from a longitude or current-offset approximation.
const rows = [
  ['paris','Paris','巴黎','FR',48.8566,2.3522,'Europe/Paris'],
  ['lyon','Lyon','里昂','FR',45.7640,4.8357,'Europe/Paris'],
  ['marseille','Marseille','马赛','FR',43.2965,5.3698,'Europe/Paris'],
  ['bordeaux','Bordeaux','波尔多','FR',44.8378,-0.5792,'Europe/Paris'],
  ['toulouse','Toulouse','图卢兹','FR',43.6047,1.4442,'Europe/Paris'],
  ['nantes','Nantes','南特','FR',47.2184,-1.5536,'Europe/Paris'],
  ['lille','Lille','里尔','FR',50.6292,3.0573,'Europe/Paris'],
  ['rennes','Rennes','雷恩','FR',48.1173,-1.6778,'Europe/Paris'],
  ['strasbourg','Strasbourg','斯特拉斯堡','FR',48.5734,7.7521,'Europe/Paris'],
  ['nice','Nice','尼斯','FR',43.7102,7.2620,'Europe/Paris'],
  ['montpellier','Montpellier','蒙彼利埃','FR',43.6108,3.8767,'Europe/Paris'],
  ['pointe-a-pitre','Pointe-à-Pitre','皮特尔角城','GP',16.2411,-61.5331,'America/Guadeloupe'],
  ['beijing','Beijing','北京','CN',39.9042,116.4074,'Asia/Shanghai'],
  ['shanghai','Shanghai','上海','CN',31.2304,121.4737,'Asia/Shanghai'],
  ['guangzhou','Guangzhou','广州','CN',23.1291,113.2644,'Asia/Shanghai'],
  ['shenzhen','Shenzhen','深圳','CN',22.5431,114.0579,'Asia/Shanghai'],
  ['chengdu','Chengdu','成都','CN',30.5728,104.0668,'Asia/Shanghai'],
  ['chongqing','Chongqing','重庆','CN',29.5630,106.5516,'Asia/Shanghai'],
  ['wuhan','Wuhan','武汉','CN',30.5928,114.3055,'Asia/Shanghai'],
  ['xian',"Xi'an",'西安','CN',34.3416,108.9398,'Asia/Shanghai'],
  ['hangzhou','Hangzhou','杭州','CN',30.2741,120.1551,'Asia/Shanghai'],
  ['nanjing','Nanjing','南京','CN',32.0603,118.7969,'Asia/Shanghai'],
  ['suzhou','Suzhou','苏州','CN',31.2989,120.5853,'Asia/Shanghai'],
  ['tianjin','Tianjin','天津','CN',39.3434,117.3616,'Asia/Shanghai'],
  ['qingdao','Qingdao','青岛','CN',36.0671,120.3826,'Asia/Shanghai'],
  ['wenzhou','Wenzhou','温州','CN',27.9938,120.6994,'Asia/Shanghai'],
  ['fuzhou','Fuzhou','福州','CN',26.0745,119.2965,'Asia/Shanghai'],
  ['xiamen','Xiamen','厦门','CN',24.4798,118.0894,'Asia/Shanghai'],
  ['urumqi','Urumqi (Beijing time)','乌鲁木齐（北京时间）','CN',43.8256,87.6168,'Asia/Shanghai'],
  ['hong-kong','Hong Kong','香港','HK',22.3193,114.1694,'Asia/Hong_Kong'],
  ['macau','Macau','澳门','MO',22.1987,113.5439,'Asia/Macau'],
  ['taipei','Taipei','台北','TW',25.0330,121.5654,'Asia/Taipei'],
  ['london','London','伦敦','GB',51.5074,-0.1278,'Europe/London'],
  ['brussels','Brussels','布鲁塞尔','BE',50.8503,4.3517,'Europe/Brussels'],
  ['geneva','Geneva','日内瓦','CH',46.2044,6.1432,'Europe/Zurich'],
  ['berlin','Berlin','柏林','DE',52.5200,13.4050,'Europe/Berlin'],
  ['madrid','Madrid','马德里','ES',40.4168,-3.7038,'Europe/Madrid'],
  ['rome','Rome','罗马','IT',41.9028,12.4964,'Europe/Rome'],
  ['lisbon','Lisbon','里斯本','PT',38.7223,-9.1393,'Europe/Lisbon'],
  ['warsaw','Warsaw','华沙','PL',52.2297,21.0122,'Europe/Warsaw'],
  ['new-york','New York','纽约','US',40.7128,-74.0060,'America/New_York'],
  ['los-angeles','Los Angeles','洛杉矶','US',34.0522,-118.2437,'America/Los_Angeles'],
  ['chicago','Chicago','芝加哥','US',41.8781,-87.6298,'America/Chicago'],
  ['toronto','Toronto','多伦多','CA',43.6532,-79.3832,'America/Toronto'],
  ['montreal','Montréal','蒙特利尔','CA',45.5017,-73.5673,'America/Toronto'],
  ['sao-paulo','São Paulo','圣保罗','BR',-23.5505,-46.6333,'America/Sao_Paulo'],
  ['mexico-city','Mexico City','墨西哥城','MX',19.4326,-99.1332,'America/Mexico_City'],
  ['tokyo','Tokyo','东京','JP',35.6762,139.6503,'Asia/Tokyo'],
  ['seoul','Seoul','首尔','KR',37.5665,126.9780,'Asia/Seoul'],
  ['singapore','Singapore','新加坡','SG',1.3521,103.8198,'Asia/Singapore'],
  ['bangkok','Bangkok','曼谷','TH',13.7563,100.5018,'Asia/Bangkok'],
  ['delhi','New Delhi','新德里','IN',28.6139,77.2090,'Asia/Kolkata'],
  ['dubai','Dubai','迪拜','AE',25.2048,55.2708,'Asia/Dubai'],
  ['casablanca','Casablanca','卡萨布兰卡','MA',33.5731,-7.5898,'Africa/Casablanca'],
  ['cairo','Cairo','开罗','EG',30.0444,31.2357,'Africa/Cairo'],
  ['johannesburg','Johannesburg','约翰内斯堡','ZA',-26.2041,28.0473,'Africa/Johannesburg'],
  ['sydney','Sydney','悉尼','AU',-33.8688,151.2093,'Australia/Sydney'],
  ['melbourne','Melbourne','墨尔本','AU',-37.8136,144.9631,'Australia/Melbourne'],
  ['auckland','Auckland','奥克兰','NZ',-36.8485,174.7633,'Pacific/Auckland'],
];
const LOCATIONS = Object.freeze(rows.map(([id,name,zh,country,latitude,longitude,timezone]) => Object.freeze({id,name,zh,country,latitude,longitude,timezone})));
const fs = require('node:fs');
const path = require('node:path');
const { gunzipSync } = require('node:zlib');
const adminNames = require('./data/locations-admin1.json');
const SOURCE = Object.freeze({
  name: 'GeoNames', url: 'https://www.geonames.org/',
  license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  snapshot: '2021-11-02', dataset: 'GeoNames cities15000 via geonamescache 1.3.0',
});
const MAX_RESULTS = 20;
const MAX_QUERY = 80;
const simplify = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const validLocale = value => ['zh','fr','en'].includes(value) ? value : 'fr';
const zoneCache = new Map();
const countryCache = new Map();
let catalogue;
const adminTranslations = {
  zh:{Anhui:'安徽',Beijing:'北京',Chongqing:'重庆',Fujian:'福建',Gansu:'甘肃',Guangdong:'广东',Guangxi:'广西',Guizhou:'贵州',Hainan:'海南',Hebei:'河北',Heilongjiang:'黑龙江',Henan:'河南',Hubei:'湖北',Hunan:'湖南',Jiangsu:'江苏',Jiangxi:'江西',Jilin:'吉林',Liaoning:'辽宁',Ningxia:'宁夏',Qinghai:'青海',Shaanxi:'陕西',Shandong:'山东',Shanghai:'上海',Shanxi:'山西',Sichuan:'四川',Tianjin:'天津',Tibet:'西藏',Xinjiang:'新疆',Yunnan:'云南',Zhejiang:'浙江','Inner Mongolia':'内蒙古'},
  fr:{Brittany:'Bretagne',Normandy:'Normandie',Corsica:'Corse','Grand Est':'Grand Est','Hauts-de-France':'Hauts-de-France','Île-de-France':'Île-de-France'},
};
const timeConventionLabels = {
  zh:{beijing:'北京时间','xinjiang-local':'新疆当地时间'},
  fr:{beijing:'heure de Pékin','xinjiang-local':'heure locale du Xinjiang'},
  en:{beijing:'Beijing time','xinjiang-local':'Xinjiang local time'},
};

function normalizeTimezone(value) {
  if (typeof value !== 'string' || !/^(?:UTC|[A-Za-z_+-]+(?:\/[A-Za-z0-9_+-]+)+)$/.test(value)) return null;
  if (!zoneCache.has(value)) {
    try { zoneCache.set(value, new Intl.DateTimeFormat('en', {timeZone: value}).resolvedOptions().timeZone); }
    catch { zoneCache.set(value, null); }
  }
  return zoneCache.get(value);
}

function countryName(code, locale) {
  const key = `${locale}:${code}`;
  if (!countryCache.has(key)) {
    try { countryCache.set(key, new Intl.DisplayNames([locale], {type:'region'}).of(code) || code); }
    catch { countryCache.set(key, code); }
  }
  return countryCache.get(key);
}

function validCoordinates(latitude, longitude) {
  return typeof latitude === 'number' && Number.isFinite(latitude) && latitude > -90 && latitude < 90
    && typeof longitude === 'number' && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

function loadCatalogue() {
  if (catalogue) return catalogue;
  const data = JSON.parse(gunzipSync(fs.readFileSync(path.join(__dirname, 'data', 'locations-geonames.json.gz'))));
  const byId = new Map();
  const entries = [];
  for (const row of data) {
    const [id,name,country,adminCode,latitude,longitude,timeZone,population,aliases] = row;
    const timezone = normalizeTimezone(timeZone);
    if (!Number.isSafeInteger(id) || !name || !/^[A-Z]{2}$/.test(country) || !timezone || !validCoordinates(latitude,longitude)) continue;
    const admin = adminNames[`${country}.${adminCode}`] || '';
    const allNames = [...new Set([name,...(Array.isArray(aliases) ? aliases : [])].filter(v=>typeof v==='string'))];
    const hasTwoClocks = timezone === 'Asia/Urumqi';
    const place = Object.freeze({id:`geonames:${id}`,name,country,admin,latitude,longitude,timezone,source:'geonames',
      ...(hasTwoClocks ? {timeConvention:'xinjiang-local'} : {})});
    const entry = {
      place, aliases:allNames, keys:[...new Set(allNames.map(simplify))], population:Number(population)||0,
      context:simplify([admin,adminCode,country,...['zh','fr','en'].map(l=>countryName(country,l))].join(' ')),
    };
    byId.set(place.id,entry);
    entries.push(entry);
    if (hasTwoClocks) {
      // Birth records in Xinjiang may use either clock convention. Keep the
      // source ID for Xinjiang local time and an explicit, trusted variant for
      // Beijing time. Historical UTC conversion still uses the chosen IANA zone.
      const beijing = {...entry,place:Object.freeze({...place,id:`geonames:${id}:beijing`,
        timezone:'Asia/Shanghai',timeConvention:'beijing'})};
      byId.set(beijing.place.id,beijing);
      entries.push(beijing);
    }
  }
  for (const place of LOCATIONS) {
    const keys = [place.id,place.name,place.zh].map(simplify);
    // Use the curated name/ID for nearby matching entries, avoiding duplicate
    // choices while retaining every old bookmarked/saved city ID.
    const related = entries.find(e=>e.place.country===place.country && e.place.timezone===normalizeTimezone(place.timezone) && Math.abs(e.place.latitude-place.latitude)<0.2
      && Math.abs(e.place.longitude-place.longitude)<0.2 && e.keys.some(k=>keys.includes(k)));
    const admin = related?.place.admin || '';
    const entry = {
      place:Object.freeze({...place,admin,source:'curated',
        ...(related?.place.timeConvention ? {timeConvention:related.place.timeConvention} : {}),
        ...(place.id==='urumqi' ? {name:'Urumqi',zh:'乌鲁木齐',timeConvention:'beijing'} : {})}),
      aliases:[place.name,place.zh,...(related?.aliases||[])],
      keys:[...new Set([...keys,...(related?.keys||[])])],
      context:related?.context || simplify([place.country,...['zh','fr','en'].map(l=>countryName(place.country,l))].join(' ')),
      population:related?.population||0, curated:true,
    };
    if (related) entries.splice(entries.indexOf(related),1);
    entries.push(entry);
    byId.set(place.id,entry);
  }
  catalogue = {entries,byId};
  return catalogue;
}

function displayLocation(entry, locale='fr') {
  const {zh,...place} = entry.place;
  // The source's alternate-name array has no language tags. Chinese-only
  // aliases are reliable for the Chinese UI; other names remain the sourced
  // spelling instead of pretending that a machine-generated translation is data.
  const chinese = zh || entry.aliases.find(v=>/^[\p{Script=Han}·・]+$/u.test(v));
  const admin = adminTranslations[locale]?.[place.admin] || place.admin;
  const baseName = locale==='zh' && chinese ? chinese : place.name;
  const clock = timeConventionLabels[locale]?.[place.timeConvention];
  const name = clock ? locale==='zh' ? `${baseName}（${clock}）` : `${baseName} (${clock})` : baseName;
  return {...place,name,admin,countryName:countryName(place.country,locale)};
}

function getLocationById(id, locale='fr') {
  if (typeof id !== 'string' || id.length > 64) return null;
  const entry = loadCatalogue().byId.get(id);
  return entry ? displayLocation(entry,validLocale(locale)) : null;
}

function findLocations(query='', locale='fr', limit=MAX_RESULTS) {
  locale = validLocale(locale);
  const text = String(query).trim().slice(0,MAX_QUERY);
  const q = simplify(text);
  const {entries,byId} = loadCatalogue();
  if (!q) return LOCATIONS.map(p=>displayLocation(byId.get(p.id),locale));
  const tokens = text.split(/[\s,，;；]+/u).map(simplify).filter(Boolean);
  const matches=[];
  for (const entry of entries) {
    let score=0;
    if (entry.keys.includes(q)) score=500;
    else if (entry.keys.some(k=>k.startsWith(q))) score=300;
    else if (entry.keys.some(k=>k.includes(q))) score=150;
    else if (tokens.length>1 && tokens.some(t=>entry.keys.some(k=>k.includes(t)))
      && tokens.every(t=>entry.context.includes(t)||entry.keys.some(k=>k.includes(t)))) score=100;
    if (score) matches.push({entry,score:score+(entry.curated?10:0)});
  }
  const count = Math.min(MAX_RESULTS,Math.max(1,Number.isFinite(limit)?Math.floor(limit):MAX_RESULTS));
  return matches.sort((a,b)=>b.score-a.score||b.entry.population-a.entry.population||a.entry.place.id.localeCompare(b.entry.place.id))
    .slice(0,count).map(({entry})=>displayLocation(entry,locale));
}

function searchLocations(query='',locale='fr') {
  const q=String(query).trim();
  const locations=findLocations(q,locale).slice(0,q ? MAX_RESULTS : 12);
  return {
    locations,status:!simplify(q)?'suggestions':locations.length?'ok':'no_results',
    // This worldwide snapshot covers larger towns and capitals, not every village.
    limited:true,total:loadCatalogue().entries.length,source:'geonames-offline',
    coverage:'cities15000',snapshot:SOURCE.snapshot,attribution:[SOURCE],
  };
}

module.exports = {LOCATIONS,findLocations,getLocationById,searchLocations,normalizeTimezone,validCoordinates,SOURCE,MAX_QUERY};
