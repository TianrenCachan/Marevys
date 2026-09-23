'use strict';

const Astronomy = require('astronomy-engine');
const { Temporal } = require('@js-temporal/polyfill');
const { getLocationById } = require('./astrology-locations.cjs');
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
    const city=getLocationById(raw.locationId);
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

const EVERYDAY={
  zh:['先试试看，再根据结果调整','把节奏放稳，让事情有个着落','多聊一聊，听听不同的想法','熟悉的人和环境，以及被认真照顾的感觉','坦率表达自己，也希望自己的付出被看见','把问题拆小，找到一件能改进的事','先听双方的想法，再找到彼此能接受的办法','把话说深一点，确认彼此是否真诚','留出尝试新事物、看远一点的空间','说清责任，并一步一步把计划做完','保留自己的空间，也尊重与自己不同的想法','先感受气氛，再慢慢找到自己的表达'],
  fr:['essayer, puis ajuster en fonction du résultat','avancer à un rythme stable avec des repères clairs','échanger et entendre plusieurs points de vue','retrouver des personnes familières et une attention concrète','vous exprimer franchement et voir vos efforts reconnus','découper le problème et améliorer une petite chose','écouter les deux côtés et chercher un accord acceptable','aller au fond de la discussion et vérifier la sincérité','garder de la place pour découvrir et élargir vos possibilités','clarifier les responsabilités et avancer étape par étape','préserver votre espace et accueillir des avis différents','sentir l’ambiance avant de trouver vos mots'],
  en:['trying something first, then adjusting to the result','keeping a steady pace and knowing where things stand','talking things through and hearing different ideas','familiar people and practical signs of care','speaking openly and having your effort recognized','breaking a problem down and improving one small thing','hearing both sides and finding an acceptable agreement','talking honestly about what is underneath the surface','leaving room to try something new and see a wider picture','clarifying responsibilities and following through step by step','keeping your own space while respecting different ideas','noticing the atmosphere before finding your own words']
};
function basicReading(chart,locale='fr',context={}) {
  if(!['fr','zh','en'].includes(locale))locale='fr';
  const pick=value=>value[locale],question=String(context.question||''),topic=context.topic||'self';
  const boundaries=/拒绝|边界|讨好|说不|boundar|say no|limite|dire non/i.test(question);
  const change=/换工作|跳槽|辞职|转行|change.{0,15}(job|career)|quitter|reconversion/i.test(question);
  const core=boundaries?pick({zh:'如果你想学会表达边界，可以先从一件小事开始：说清自己能做什么、做到什么时候，以及哪些事需要别人承担。不必等到委屈积累很多，才一次性说出来。',en:'If you want to set clearer boundaries, start with one small request: say what you can do, by when, and what needs someone else’s help. You do not have to wait until frustration builds up.',fr:'Pour poser vos limites, commencez par une petite demande : ce que vous pouvez faire, dans quel délai et ce qui nécessite l’aide de quelqu’un d’autre. N’attendez pas d’être à bout pour le dire.'}):change?pick({zh:'如果你在考虑换工作，先把“想离开什么”和“想得到什么”分开写下来。再用一次谈话或一个小项目核实新方向，星盘可以帮助你反思偏好，不能替你判断一份工作的实际条件。',en:'If you are considering a job change, separate what you want to leave from what you want to move towards. Check the new direction through a conversation or small project; the chart cannot assess an offer’s real conditions.',fr:'Si vous envisagez de changer de travail, distinguez ce que vous voulez quitter de ce que vous souhaitez trouver. Vérifiez la nouvelle piste par un échange ou un petit projet ; le thème ne peut pas évaluer les conditions réelles d’un poste.'}):topic==='relations'?pick({zh:'在关系里，可以先看清自己希望怎样被对待，再观察对方有没有用行动回应。下面的线索帮助你把需要说具体，不替你猜测对方的想法。',en:'In a relationship, start with how you want to be treated and whether the other person responds through actions. The prompts below can help you name your needs; they do not reveal someone else’s thoughts.',fr:'Dans une relation, clarifiez comment vous souhaitez être traité·e, puis regardez les actes de l’autre. Les pistes ci-dessous aident à nommer vos besoins, pas à deviner ses pensées.'}):topic==='work'?pick({zh:'面对工作问题，可以先分清：你不喜欢的是任务本身，还是时间、沟通和分工。选一件能调整的小事，观察改变后自己有没有更轻松。',en:'For a work question, separate the task itself from the timing, communication and division of work. Choose one small change and see whether it makes your day easier.',fr:'Au travail, distinguez la tâche elle-même des délais, de la communication et du partage des responsabilités. Essayez un petit ajustement et voyez si votre journée devient plus simple.'}):pick({zh:'先不用急着给自己下定义。想一件最近让你舒服的事，再想一件让你很费力的事，看看它们的差别。下面几个角度可以帮助你把这种感受说清楚。',en:'You do not need to define yourself straight away. Think of one recent situation that felt comfortable and one that took effort. The prompts below can help you put the difference into words.',fr:'Pas besoin de vous définir tout de suite. Pensez à une situation récente où vous étiez à l’aise et à une autre plus difficile. Les pistes ci-dessous aident à mettre des mots sur cette différence.'});
  const roles=[
    {id:'Sun',title:{zh:'什么让你更有动力',en:'What gives you momentum',fr:'Ce qui vous donne de l’élan'},prompt:{zh:'回想最近一次让你觉得“这件事值得做”的经历：你是自己选的，还是因为别人期待你去做？',en:'Recall something that recently felt worth doing. Did you choose it yourself, or did someone else expect it of you?',fr:'Repensez à une chose récente qui valait l’effort. L’aviez-vous choisie, ou répondiez-vous à une attente ?'}},
    {id:'Moon',title:{zh:'累的时候，你需要什么',en:'What helps when you are tired',fr:'Ce qui vous aide quand vous êtes fatigué·e'},prompt:{zh:'想想压力大时，什么最能让你缓下来。把这个需要告诉身边的人，会比等他们猜到更容易得到支持。',en:'Notice what helps you settle when you feel under pressure. Naming that need makes support easier than waiting for someone to guess it.',fr:'Observez ce qui vous apaise sous pression. Nommer ce besoin facilite le soutien, plutôt que d’attendre que l’autre le devine.'}},
    {id:'Mercury',title:{zh:'怎样把想法说清楚',en:'Putting your thoughts into words',fr:'Trouver les mots justes'},prompt:{zh:'下一次重要对话，先说一件具体发生的事，再说你的感受和希望对方怎样回应。',en:'For your next important conversation, describe one concrete event, then how you felt and what response would help.',fr:'Lors du prochain échange important, décrivez un fait concret, puis votre ressenti et la réponse qui vous aiderait.'}},
    {id:topic==='relations'?'Venus':'Mars',title:{zh:topic==='relations'?'你喜欢怎样的相处':'下一步可以怎样做',en:topic==='relations'?'The connection you enjoy':'Taking the next step',fr:topic==='relations'?'Le lien qui vous fait du bien':'Faire le prochain pas'},prompt:{zh:topic==='relations'?'选一件你在关系中真正看重的小事，说给对方听，也问问对方最在意什么。':'挑一件今天就能开始的小事。做完以后再调整，不必先把所有结果想清楚。',en:topic==='relations'?'Name one small thing that matters to you in a relationship, and ask what matters to the other person.':'Choose one small thing you can begin today. Adjust after trying it; you do not need every answer first.',fr:topic==='relations'?'Nommez une petite chose qui compte pour vous dans le lien, puis demandez ce qui compte pour l’autre.':'Choisissez une petite chose à commencer aujourd’hui. Ajustez après l’essai, sans attendre toutes les réponses.'}}
  ];
  const sections=roles.map(role=>{
    const p=chart.planets.find(p=>p.id===role.id),signs=p.range?p.range.possibleSigns:[p.sign];
    if(signs.length!==1)return {title:pick(role.title),text:pick({zh:`${p.name}在这一天可能位于${signs.map(s=>s.name).join('或')}。时间不足以确定，所以这里不替你选一个。${pick(role.prompt)}`,en:`${p.name} could be in ${signs.map(s=>s.name).join(' or ')} on this date, so no single sign is assigned. ${pick(role.prompt)}`,fr:`${p.name} peut être en ${signs.map(s=>s.name).join(' ou ')} ce jour-là ; aucun signe unique n’est retenu. ${pick(role.prompt)}`})};
    const sign=signs[0],theme=EVERYDAY[locale][sign.index];
    return {title:pick(role.title),text:pick({zh:`${pick(role.prompt)}\n${p.name}在${sign.name}，在占星的象征语言里，会让人联想到“${theme}”。看看这是否贴近你的真实经历；不贴近的部分无需套在自己身上。`,en:`${pick(role.prompt)}\n${p.name} in ${sign.name} symbolically suggests ${theme}. Compare that with your experience and leave aside what does not fit.`,fr:`${pick(role.prompt)}\n${p.name} en ${sign.name} évoque symboliquement le fait de ${theme}. Comparez cette piste à votre vécu, sans retenir ce qui ne vous correspond pas.`})};
  });
  return {mode:'symbolic-basic',title:pick({zh:'从日常生活，慢慢认识自己',en:'Get to know yourself through everyday life',fr:'Mieux vous connaître au quotidien'}),coreAnswer:core,
    introduction:pick({zh:'以下为根据计算位置整理的基础参考，不是 AI 深入解读。',en:'These are basic prompts based on calculated positions, not a deep AI reading.',fr:'Ces premiers repères partent des positions calculées, sans lecture approfondie par IA.'}),sections,
    actions:[pick({zh:'把最贴近你的一点记下来，选一件小事试一试，再回来看它是否真的有帮助。',en:'Write down the point that fits best, try one small change, then return to see whether it helped.',fr:'Notez la piste la plus juste pour vous, essayez un petit changement, puis revenez voir s’il vous a aidé·e.'})],
    disclaimer:pick({zh:'占星是帮助反思的象征工具，不是经过科学验证的性格诊断或未来预测。',en:'Astrology is a symbolic tool for reflection, not a scientifically validated personality diagnosis or prediction.',fr:'L’astrologie est un support symbolique de réflexion, pas un diagnostic de personnalité ni une prédiction validée scientifiquement.'})};
}

module.exports={AstrologyError,normalizeInput,resolveBirth,calculateChart,calculateAngles,calculateAspects,basicReading,longitudeAt,motionAt};
