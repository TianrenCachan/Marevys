'use strict';

// Deliberately bounded, offline city-centre catalogue. Manual coordinates remain
// available in the UI. Time zones are IANA IDs, never a current fixed UTC offset.
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
const simplify = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
function findLocations(query = '', locale = 'fr') {
  const q = simplify(String(query).slice(0,80));
  return LOCATIONS.filter(p => !q || simplify([p.id,p.name,p.zh,p.country].join(' ')).includes(q)).slice(0,60)
    .map(({zh,...p}) => ({...p,name:locale === 'zh' ? zh : p.name}));
}
module.exports = { LOCATIONS, findLocations };
