'use strict';

const Astronomy = require('astronomy-engine');
const { Temporal } = require('@js-temporal/polyfill');
const { LOCATIONS } = require('./astrology-locations.cjs');
const DAY = 86400000;
const RAD = Math.PI / 180;
const BODIES = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const SIGN_IDS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const SIGNS = {
  fr:['Bélier','Taureau','Gémeaux','Cancer','Lion','Vierge','Balance','Scorpion','Sagittaire','Capricorne','Verseau','Poissons'],
  zh:['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'],
  en:['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'],
};
const NAMES = {
  fr:['Soleil','Lune','Mercure','Vénus','Mars','Jupiter','Saturne','Uranus','Neptune','Pluton'],
  zh:['太阳','月亮','水星','金星','火星','木星','土星','天王星','海王星','冥王星'],
  en:BODIES,
};
const ERROR_MESSAGES = {
  INVALID_INPUT: ['Vérifiez les informations de naissance.','请检查出生信息。','Check the birth details.'],
  INVALID_DATE: ['Choisissez une date réelle entre 1900 et 2100.','请输入1900至2100年之间的有效日期。','Choose a valid date between 1900 and 2100.'],
  INVALID_TIME: ['Saisissez une heure au format 24 h, ou choisissez « heure inconnue ».','请填写24小时制时间，或选择“不知道出生时间”。','Enter a 24-hour time, or choose “time unknown”.'],
  INVALID_LOCATION: ['Choisissez une ville ou vérifiez les coordonnées géographiques.','请选择城市，或检查经纬度。','Select a city or check the geographic coordinates.'],
  INVALID_TIMEZONE: ['Utilisez un fuseau IANA, par exemple Europe/Paris ou Asia/Shanghai.','请使用IANA时区，例如Europe/Paris或Asia/Shanghai。','Use an IANA time zone such as Europe/Paris or Asia/Shanghai.'],
  TIME_AMBIGUOUS: ['Cette heure a eu lieu deux fois lors du changement d’heure. Vérifiez l’heure UTC sur votre document, ou choisissez « heure inconnue ».','夏令时切换使这个当地时间出现了两次。请核实出生记录对应的UTC时间，或选择“不知道出生时间”。','This local time occurred twice during a clock change. Verify the UTC birth time, or choose “time unknown”.'],
  TIME_NONEXISTENT: ['Cette heure locale n’existait pas lors du changement d’heure. Vérifiez votre document ou choisissez « heure inconnue ».','夏令时切换时这个当地时间不存在。请核实出生记录，或选择“不知道出生时间”。','This local time did not exist during a clock change. Check the birth record, or choose “time unknown”.'],
  DATE_NONEXISTENT: ['Cette date a été sautée dans ce fuseau. Vérifiez le lieu et la date.','所选时区跳过了这个日期，请核实出生地点和日期。','This date was skipped in this time zone. Check the place and date.'],
};
class AstrologyError extends Error {
  constructor(status,code,locale='fr') {
    const index = locale === 'zh' ? 1 : locale === 'en' ? 2 : 0;
    super((ERROR_MESSAGES[code] || ERROR_MESSAGES.INVALID_INPUT)[index]);
    this.name='AstrologyError'; this.status=status; this.code=code;
  }
}
const mod = value => ((value % 360) + 360) % 360;
const delta = (a,b) => ((a-b+540)%360)-180;
const round = value => Number(value.toFixed(6));
const signAt = (longitude,locale) => {
  const index = Math.floor(mod(longitude)/30);
  return {id:SIGN_IDS[index],index,name:SIGNS[locale][index]};
};
const pointAt = (longitude,locale) => ({longitude:round(mod(longitude)),sign:signAt(longitude,locale),degreeInSign:round(mod(longitude)%30)});

function normalizeInput(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new AstrologyError(400,'INVALID_INPUT');
  const locale = ['fr','zh','en'].includes(raw.locale) ? raw.locale : 'fr';
  const fail = code => {throw new AstrologyError(400,code,locale);};
  if (typeof raw.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) fail('INVALID_DATE');
  let date;
  try { date=Temporal.PlainDate.from(raw.date,{overflow:'reject'}); } catch {fail('INVALID_DATE');}
  if (date.year<1900 || date.year>2100) fail('INVALID_DATE');
  if (raw.timeUnknown !== undefined && typeof raw.timeUnknown !== 'boolean') fail('INVALID_INPUT');
  const timeUnknown = raw.timeUnknown === true;
  if (!timeUnknown && (typeof raw.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(raw.time))) fail('INVALID_TIME');
  let {latitude,longitude,timezone}=raw;
  let locationId = null;
  if (raw.locationId !== undefined && raw.locationId !== null && raw.locationId !== '') {
    const city=LOCATIONS.find(p=>p.id===raw.locationId);
    if (!city) fail('INVALID_LOCATION');
    ({latitude,longitude,timezone}=city); locationId=city.id;
  }
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || Math.abs(latitude)>89 || typeof longitude !== 'number' || !Number.isFinite(longitude) || Math.abs(longitude)>180) fail('INVALID_LOCATION');
  if (typeof timezone !== 'string' || timezone.length>64 || !/^(UTC|[A-Za-z_]+\/[A-Za-z0-9_+/-]+)$/.test(timezone)) fail('INVALID_TIMEZONE');
  try { new Intl.DateTimeFormat('en',{timeZone:timezone}).format(new Date(0)); } catch {fail('INVALID_TIMEZONE');}
  const topic = raw.topic === undefined ? '' : raw.topic;
  if (typeof topic !== 'string' || topic.length>1000) fail('INVALID_INPUT');
  return {date:date.toString(),time:timeUnknown ? null:raw.time,timeUnknown,latitude,longitude,timezone,locationId,locale,topic:topic.trim()};
}

function resolveBirth(input) {
  const date=Temporal.PlainDate.from(input.date);
  if (input.timeUnknown) {
    const start=date.toZonedDateTime(input.timezone);
    if (start.toPlainDate().toString() !== input.date) throw new AstrologyError(400,'DATE_NONEXISTENT',input.locale);
    const end=date.add({days:1}).toZonedDateTime(input.timezone);
    return {startMs:Number(start.epochMilliseconds),endMs:Number(end.epochMilliseconds)};
  }
  const plain=Temporal.PlainDateTime.from(`${input.date}T${input.time}`);
  let zoned;
  try {zoned=plain.toZonedDateTime(input.timezone,{disambiguation:'reject'});} catch {
    const earlier=plain.toZonedDateTime(input.timezone,{disambiguation:'earlier'});
    const matches=earlier.toPlainDateTime().equals(plain);
    throw new AstrologyError(400,matches?'TIME_AMBIGUOUS':'TIME_NONEXISTENT',input.locale);
  }
  return {instantMs:Number(zoned.epochMilliseconds),utcOffset:zoned.offset};
}

function longitudeAt(body,ms) {
  return Astronomy.Ecliptic(Astronomy.GeoVector(body,new Date(ms),true)).elon;
}
function motionAt(body,ms) {
  // Centred half-day interval, correctly unwrapped at 0 degrees Aries.
  return delta(longitudeAt(body,ms+DAY/4),longitudeAt(body,ms-DAY/4))*2;
}

function calculateAngles(ms,latitude,longitude,locale='fr') {
  const time=Astronomy.MakeTime(new Date(ms));
  const lst=mod(Astronomy.SiderealTime(time)*15+longitude)*RAD;
  const lat=latitude*RAD;
  const rotate=vec=>Astronomy.RotateVector(Astronomy.Rotation_EQD_ECT(time),new Astronomy.Vector(...vec,time));
  const zenith=rotate([Math.cos(lat)*Math.cos(lst),Math.cos(lat)*Math.sin(lst),Math.sin(lat)]);
  const east=rotate([-Math.sin(lst),Math.cos(lst),0]);
  const meridian=rotate([Math.cos(lst),Math.sin(lst),0]);
  if (Math.hypot(zenith.x,zenith.y)<1e-9) return null;
  // Intersect the true ecliptic plane with the geometric horizon, selecting
  // its eastern intersection. Refraction is deliberately not part of natal angles.
  let asc=Math.atan2(-zenith.x,zenith.y);
  if (Math.cos(asc)*east.x+Math.sin(asc)*east.y<0) asc+=Math.PI;
  // MC is the ecliptic intersection whose right ascension equals local
  // apparent sidereal time (the upper meridian, not the opposite IC).
  let mc=Math.atan2(-east.x,east.y);
  if (Math.cos(mc)*meridian.x+Math.sin(mc)*meridian.y<0) mc+=Math.PI;
  return {ascendant:pointAt(asc/RAD,locale),midheaven:pointAt(mc/RAD,locale)};
}

function dailyPlanet(body,startMs,endMs,locale) {
  // Hourly samples plus endpoints span the real civil day (23/24/25 hours).
  // A small guard around the extrema makes potential sign changes conservative
  // near a station and acknowledges the engine's stated arcminute accuracy.
  const samples=[];
  const steps=Math.ceil((endMs-startMs)/3600000);
  let previous;
  for(let i=0;i<=steps;i++) {
    const longitude=longitudeAt(body,startMs+(endMs-startMs)*i/steps);
    const unwrapped=previous===undefined ? longitude : previous+delta(longitude,mod(previous));
    samples.push(unwrapped); previous=unwrapped;
  }
  const lower=Math.min(...samples),upper=Math.max(...samples);
  const guard=1/60;
  const possibleSigns=[];
  for(let n=Math.floor((lower-guard)/30);n<=Math.floor((upper+guard)/30);n++) {
    const sign=signAt(n*30+0.01,locale);
    if (!possibleSigns.some(s=>s.id===sign.id)) possibleSigns.push(sign);
  }
  const a=motionAt(body,startMs),b=motionAt(body,endMs);
  const threshold=0.001;
  const sameMotion=Math.abs(a)>threshold && Math.abs(b)>threshold && Math.sign(a)===Math.sign(b);
  return {id:body,name:NAMES[locale][BODIES.indexOf(body)],longitude:null,degreeInSign:null,sign:possibleSigns.length===1?possibleSigns[0]:null,
    retrograde:sameMotion?a<0:null,stationary:!sameMotion,house:null,
    range:{startLongitude:round(mod(samples[0])),endLongitude:round(mod(samples[samples.length-1])),minUnwrapped:round(lower-guard),maxUnwrapped:round(upper+guard),possibleSigns,sampleIntervalMinutes:60,boundaryGuardDegrees:guard}};
}

function calculateAspects(planets) {
  const types=[['conjunction',0,6],['sextile',60,4],['square',90,6],['trine',120,6],['opposition',180,6]];
  const aspects=[];
  for(let i=0;i<planets.length;i++) for(let j=i+1;j<planets.length;j++) {
    const separation=Math.abs(delta(planets[i].longitude,planets[j].longitude));
    for(const [type,angle,allowedOrb] of types) {
      const orb=Math.abs(separation-angle);
      if (orb<=allowedOrb) aspects.push({planet1:planets[i].id,planet2:planets[j].id,type,angle,orb:round(orb),allowedOrb});
    }
  }
  return aspects.sort((a,b)=>a.orb-b.orb);
}

function calculateChart(raw) {
  const input=normalizeInput(raw);
  const birth=resolveBirth(input);
  const {locale,topic,...publicBirth}=input;
  const warnings=[];
  let planets,ascendant=null,midheaven=null,houses=[],aspects=[];
  if(input.timeUnknown) {
    planets=BODIES.map(body=>dailyPlanet(body,birth.startMs,birth.endMs,locale));
    warnings.push({code:'BIRTH_TIME_UNKNOWN',message:locale==='zh'?'出生时间未知：仅列出当地出生日期内的行星范围；上升、中天、宫位和精确相位不予显示。':locale==='en'?'Birth time unknown: positions span the local birth date. Ascendant, MC, houses and exact aspects are omitted.':'Heure inconnue : les positions couvrent la journée locale. Ascendant, milieu du ciel, maisons et aspects précis ne sont pas affichés.'});
  } else {
    const angles=calculateAngles(birth.instantMs,input.latitude,input.longitude,locale);
    if(angles) {
      ({ascendant,midheaven}=angles);
      houses=Array.from({length:12},(_,index)=>({number:index+1,...pointAt(ascendant.sign.index*30+index*30,locale)}));
    } else warnings.push({code:'ANGLES_UNDEFINED',message:locale==='zh'?'该地点和时间的地平线与黄道交点不稳定，已隐藏上升与宫位。':locale==='en'?'The horizon–ecliptic intersection is unstable at this place and time. Angles and houses are omitted.':'L’intersection horizon–écliptique est instable à ce lieu et à cette heure. Les angles et maisons sont masqués.'});
    planets=BODIES.map(body=>{
      const longitude=longitudeAt(body,birth.instantMs);
      const speed=motionAt(body,birth.instantMs);
      const sign=signAt(longitude,locale);
      return {id:body,name:NAMES[locale][BODIES.indexOf(body)],...pointAt(longitude,locale),speedDegreesPerDay:round(speed),retrograde:speed<0,stationary:Math.abs(speed)<0.001,
        house:ascendant?((sign.index-ascendant.sign.index+12)%12)+1:null};
    });
    aspects=calculateAspects(planets);
  }
  return {version:1,zodiac:'tropical',houseSystem:'whole-sign',timeKnown:!input.timeUnknown,
    instantUtc:input.timeUnknown?null:new Date(birth.instantMs).toISOString(),utcOffset:birth.utcOffset||null,
    intervalUtc:input.timeUnknown?{start:new Date(birth.startMs).toISOString(),endExclusive:new Date(birth.endMs).toISOString()}:null,
    birth:publicBirth,planets,ascendant,midheaven,houses,aspects,warnings,
    method:{engine:'Astronomy Engine',engineVersion:'2.1.19',referenceFrame:'geocentric apparent true ecliptic of date',zodiac:'tropical',houseSystem:'whole-sign',angles:'geometric eastern horizon / upper meridian',
      accuracyNote:'Engine position target: approximately one arcminute; input time and location may contribute larger uncertainty.',
      timeZoneDatabase:'IANA via runtime Intl / Temporal',aspects:'Conjunction, square, trine, opposition: 6°; sextile: 4°',
      source:'https://github.com/cosinekitty/astronomy',license:'MIT'}};
}

const THEMES={
  fr:['initiative et autonomie','stabilité et continuité','curiosité et échange','protection et appartenance','expression et reconnaissance','discernement et amélioration','réciprocité et équilibre','intensité et transformation','exploration et sens','responsabilité et construction','indépendance et collectif','sensibilité et imagination'],
  zh:['主动性与自主决定','稳定感与持续投入','好奇心与交流','保护感与归属','表达与被看见','分辨与改善','互惠与平衡','深入与转变','探索与意义','责任与长期建设','独立与群体','敏感度与想象'],
  en:['initiative and autonomy','stability and continuity','curiosity and exchange','protection and belonging','expression and recognition','discernment and improvement','reciprocity and balance','intensity and transformation','exploration and meaning','responsibility and building','independence and community','sensitivity and imagination'],
};
function basicReading(chart,locale='fr') {
  if(!['fr','zh','en'].includes(locale)) locale='fr';
  const descriptors={
    fr:{Sun:['Votre direction','le sentiment de direction'],Moon:['Votre vie intérieure','les besoins de réconfort'],Venus:['Vos liens','la manière de créer du lien'],Mars:['Votre élan','la manière de prendre une initiative']},
    zh:{Sun:['你关注的方向','方向感'],Moon:['内在需要','获得安定的方式'],Venus:['关系与价值','建立联系的方式'],Mars:['行动与边界','采取行动的方式']},
    en:{Sun:['Your direction','a sense of direction'],Moon:['Inner needs','the need for comfort'],Venus:['Connection and values','how connection is built'],Mars:['Action and boundaries','how initiative is taken']},
  };
  const sections=['Sun','Moon','Venus','Mars'].map(id=>{
    const p=chart.planets.find(p=>p.id===id); const [title,role]=descriptors[locale][id];
    const signs=p.range?p.range.possibleSigns:[p.sign];
    if(signs.length>1) return {title,text:locale==='zh'?`${p.name}当天可能位于${signs.map(s=>s.name).join('或')}。出生时间不足以确定，因此这里不选择单一星座来描述你。`:locale==='en'?`${p.name} may be in ${signs.map(s=>s.name).join(' or ')} on this date. Without a birth time, a single sign is not assigned to you.`:`${p.name} peut se trouver en ${signs.map(s=>s.name).join(' ou ')} ce jour-là. Sans heure de naissance, aucun signe unique ne vous est attribué.`};
    const sign=signs[0],theme=THEMES[locale][sign.index];
    return {title,text:locale==='zh'?`${p.name}位于${sign.name}。在占星象征中，${role}可以从“${theme}”这个角度探索。这不是对你的定论：回想一个你觉得自然、又一个需要努力的具体场景，看看这个主题是否贴近真实经历。`:locale==='en'?`${p.name} is in ${sign.name}. In astrological symbolism, ${role} can be explored through ${theme}. This is a prompt, not a conclusion about you: compare a situation that feels natural with one that takes effort, and see whether this theme fits your experience.`:`${p.name} se trouve en ${sign.name}. Dans le langage symbolique de l’astrologie, ${role} peut se lire à travers ${theme}. C’est une piste, pas une conclusion sur vous : comparez une situation fluide et une situation qui demande un effort pour voir si ce thème correspond à votre vécu.`};
  });
  if(chart.ascendant) sections.push({title:locale==='zh'?'上升与宫位':locale==='en'?'Ascendant and houses':'Ascendant et maisons',text:locale==='zh'?`上升为${chart.ascendant.sign.name}，${chart.ascendant.degreeInSign.toFixed(2)}°。本盘采用整宫制：上升所在星座整体为第一宫，每个后续星座对应下一宫；中天保留为独立角点，不强制等于第十宫起点。`:locale==='en'?`The Ascendant is ${chart.ascendant.sign.name}, ${chart.ascendant.degreeInSign.toFixed(2)}°. Whole Sign houses place the entire rising sign in house 1. The MC is an independent angle and does not have to begin house 10.`:`L’Ascendant est en ${chart.ascendant.sign.name}, à ${chart.ascendant.degreeInSign.toFixed(2)}°. Les maisons en signes entiers placent tout le signe ascendant dans la maison 1. Le milieu du ciel reste un angle indépendant, sans être imposé au début de la maison 10.`});
  return {mode:'symbolic-basic',title:locale==='zh'?'你的本命盘 · 基础象征解读':locale==='en'?'Your natal chart · basic symbolic reading':'Votre thème natal · lecture symbolique de base',
    introduction:locale==='zh'?'行星位置由天文程序计算。以下文字是明确标注的基础象征参考，不是AI深度解读。':locale==='en'?'Planet positions are calculated by astronomy software. The text below is a labelled basic symbolic guide, not a deep AI reading.':'Les positions sont calculées par un moteur astronomique. Le texte ci-dessous est un repère symbolique de base, clairement identifié, et non une lecture approfondie par IA.',sections,
    disclaimer:locale==='zh'?'占星是自我探索的象征工具，不是经过科学验证的性格诊断或未来预测。':locale==='en'?'Astrology is a symbolic tool for reflection, not a scientifically validated personality diagnosis or prediction.':'L’astrologie est un support symbolique de réflexion, pas un diagnostic de personnalité ni une prédiction validée scientifiquement.'};
}

module.exports={AstrologyError,normalizeInput,resolveBirth,calculateChart,calculateAngles,calculateAspects,basicReading,longitudeAt,motionAt};
