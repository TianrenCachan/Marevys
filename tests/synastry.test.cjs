'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const {calculateChart,basicReading}=require('../server/astrology.cjs');
const {calculateSynastry,calculateCrossAspects,basicSynastryReading}=require('../server/synastry.cjs');
const handler=require('../api/astrology.js');
const base={date:'1990-07-16',time:'15:22',timeUnknown:false,locationId:'paris'};
const partner={date:'1988-02-12',time:'09:10',timeUnknown:false,locationId:'shanghai'};
const payload={mode:'synastry',birth:base,partnerBirth:partner,locale:'zh',relationshipType:'romantic',relationshipStage:'together',question:'我们总因为回复消息吵架，可以怎么沟通？'};
const separation=(a,b)=>Math.abs(((a-b+540)%360)-180);

test('synastry computes each birth independently and every cross aspect matches actual planetary positions',()=>{
  const chart=calculateSynastry(payload);
  assert.equal(chart.mode,'synastry');assert.equal(chart.method.type,'synastry');assert.equal(chart.method.compatibilityScore,null);
  assert.deepEqual(chart.personA,calculateChart({...base,locale:'zh'}));assert.deepEqual(chart.personB,calculateChart({...partner,locale:'zh'}));
  assert(chart.crossAspects.length>0);
  const keys=new Set();
  for(const aspect of chart.crossAspects){
    const a=chart.personA.planets.find(p=>p.id===aspect.planet1),b=chart.personB.planets.find(p=>p.id===aspect.planet2);
    assert(Math.abs(Math.abs(separation(a.longitude,b.longitude)-aspect.angle)-aspect.orb)<0.000001);
    assert(aspect.orb<=aspect.allowedOrb);assert.equal(aspect.person1,'A');assert.equal(aspect.person2,'B');
    const key=aspect.planet1+'-'+aspect.planet2+'-'+aspect.type;assert(!keys.has(key));keys.add(key);
  }
});

test('cross-chart aspects handle the Aries seam, opposing positions and strict orb boundaries',()=>{
  const a={timeKnown:true,planets:[{id:'Sun',longitude:359}]};
  const b={timeKnown:true,planets:[{id:'Moon',longitude:1},{id:'Venus',longitude:179},{id:'Mercury',longitude:305},{id:'Mars',longitude:305.01}]};
  const aspects=calculateCrossAspects(a,b);
  assert.equal(aspects.find(a=>a.planet2==='Moon').orb,2);assert.equal(aspects.find(a=>a.planet2==='Venus').type,'opposition');
  // 54° is outside the 4° sextile orb, and never coerced to a sextile.
  assert(!aspects.some(a=>['Mercury','Mars'].includes(a.planet2)));
  const boundary=calculateCrossAspects({timeKnown:true,planets:[{id:'Sun',longitude:0}]},{timeKnown:true,planets:[{id:'Moon',longitude:56},{id:'Mars',longitude:55.999}]});
  assert.equal(boundary.length,1);assert.equal(boundary[0].orb,4);
});

test('unknown time on either side withholds exact cross aspects without fabricating a Moon or angles',()=>{
  for(const key of ['birth','partnerBirth']){
    const chart=calculateSynastry({...payload,[key]:{...payload[key],timeUnknown:true,time:null}});
    assert.equal(chart.timeKnown,false);assert.deepEqual(chart.crossAspects,[]);
    const unknown=key==='birth'?chart.personA:chart.personB,known=key==='birth'?chart.personB:chart.personA;
    assert.equal(unknown.instantUtc,null);assert.equal(unknown.ascendant,null);assert.deepEqual(unknown.houses,[]);
    assert(unknown.planets.every(p=>p.longitude===null&&p.range));assert(known.planets.every(p=>Number.isFinite(p.longitude)));
    assert(chart.warnings.some(w=>w.code==='CROSS_ASPECTS_WITHHELD'));
    assert(basicSynastryReading(chart,'zh',payload).sections.every(section=>section.evidence===null));
  }
});

test('basic synastry explains actual evidence, responds to question intent, and never gives a compatibility score',()=>{
  const chart=calculateSynastry(payload),communication=basicSynastryReading(chart,'zh',payload);
  const reconnect=basicSynastryReading(chart,'zh',{...payload,question:'我们分开了，还有可能复合吗？'});
  assert.match(communication.coreAnswer,/沟通/);assert.match(reconnect.coreAnswer,/重新靠近/);assert.notEqual(communication.coreAnswer,reconnect.coreAnswer);
  for(const section of communication.sections)if(section.evidence)assert(chart.crossAspects.some(a=>a.planet1===section.evidence.planet1&&a.planet2===section.evidence.planet2&&a.type===section.evidence.type));
  assert(!/\d+\s*[%％]/.test(JSON.stringify(communication)));assert.equal(communication.mode,'symbolic-basic');
  const boundary=basicReading(chart.personA,'zh',{topic:'work',question:'我总不敢拒绝同事，怎么表达边界？'});
  assert.match(boundary.coreAnswer,/能做什么/);assert(boundary.sections.length>=4);
});

async function request(body){
  const req={method:'POST',headers:{host:'localhost:3000',origin:'http://localhost:3000','content-type':'application/json'},body};
  const res={setHeader(){},end(value){this.value=JSON.parse(value);}};await handler(req,res);return res;
}
test('HTTP synastry contract accepts separate births, rejects missing partners and invalid relationship metadata',async()=>{
  const res=await request(payload);assert.equal(res.statusCode,200);assert.equal(res.value.chart.mode,'synastry');
  for(const edit of [{partnerBirth:null},{relationshipType:'destined-soulmate'},{relationshipStage:'invalid'},{mode:'composite'},{question:'x'.repeat(1601)}])assert.equal((await request({...payload,...edit})).statusCode,400);
  const natal=await request({mode:'natal',birth:base,locale:'en',topic:'work'});assert.equal(natal.statusCode,200);assert.equal(natal.value.chart.planets.length,10);
  const serverRecalculated=await request({...payload,crossAspects:[{type:'fake'}],birth:{...base,planets:[{id:'Sun',longitude:0}]}});assert(!JSON.stringify(serverRecalculated.value.chart.crossAspects).includes('fake'));
});

function ui(api){
  const dom=new JSDOM('<main id="root"></main>',{runScripts:'outside-only',url:'http://localhost'});const w=dom.window,root=w.document.getElementById('root'),state={},calls=[],saved=[];
  w.eval(fs.readFileSync(require.resolve('../src/astrology-studio.js'),'utf8'));
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ctx={lang:'zh',state,escape,api:async(path,body)=>{calls.push({path,body});return api(path,body);},render:()=>w.MarevysAstrologyStudio.render(root,ctx),save:async record=>{saved.push(record);return true;}};ctx.render();
  const find=selector=>root.querySelector(selector),click=selector=>{const node=find(selector);assert(node,selector);node.click();},fill=(selector,value)=>{const node=find(selector);assert(node,selector);node.value=value;node.dispatchEvent(new w.Event('input',{bubbles:true}));node.dispatchEvent(new w.Event('change',{bubbles:true}));};
  return {dom,w,root,state,ctx,calls,saved,find,click,fill,close:()=>w.close()};
}
const paris={id:'paris',name:'Paris',admin:'Île-de-France',countryName:'France',latitude:48.8566,longitude:2.3522,timezone:'Europe/Paris'};
const shanghai={id:'shanghai',name:'上海',countryName:'中国',latitude:31.2304,longitude:121.4737,timezone:'Asia/Shanghai'};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function chooseCity(p,person,query){const id=person==='birth'?'astro':'astroPartner';p.fill('#'+id+'City',query);p.click(`[data-astro="search"][data-person="${person}"]`);await tick();p.click(`[data-astro="location"][data-person="${person}"]`);}

test('DOM: independent births, city selection, real chart request, AI consent contract, save and archived dual wheels',async()=>{
  const p=ui(async(path,body)=>{
    if(path.startsWith('/api/locations'))return {locations:[path.includes('Paris')?paris:shanghai],status:'ok',attribution:[{name:'GeoNames'}]};
    if(path==='/api/astrology')return (await request(body)).value;
    if(path==='/api/reading')return {source:'ai',readingId:'test-reading',reading:{headline:'一次说清楚',coreAnswer:'先聊聊你们各自期待的回复时间。',sections:[],actions:[]}};
  });
  try{
    p.click('[data-astro="mode"][data-mode="synastry"]');p.fill('#astroDate',base.date);p.fill('#astroTime',base.time);p.fill('#astroPartnerDate',partner.date);p.fill('#astroPartnerTime',partner.time);p.fill('#astroQuestion',payload.question);
    await chooseCity(p,'birth','Paris');await chooseCity(p,'partnerBirth','Shanghai');
    assert.equal(p.state.birth.timezone,'Europe/Paris');assert.equal(p.state.partnerBirth.timezone,'Asia/Shanghai');assert.equal(p.find('input[name="latitude"]').type,'hidden');
    assert(p.find('.astro-location-attribution a').href==='https://www.geonames.org/');
    const form=p.find('[data-astro-form="birth"]');assert(form.checkValidity());form.dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await tick();
    assert.equal(p.calls.find(c=>c.path==='/api/astrology').body.partnerBirth.locationId,'shanghai');
    assert.equal(p.root.querySelectorAll('.astro-wheel').length,2);assert.equal(p.find('.astro-positions').open,false);
    assert(p.find('.astro-reading').compareDocumentPosition(p.find('.astro-positions'))&p.w.Node.DOCUMENT_POSITION_FOLLOWING);
    p.click('[data-astro="deepen"]');assert.equal(p.calls.filter(c=>c.path==='/api/reading').length,0);
    p.click('[name="aiConsent"]');p.click('[data-astro="deepen"]');await tick();
    const ai=p.calls.find(c=>c.path==='/api/reading').body;assert.equal(ai.system,'ASTROLOGY');assert.equal(ai.mode,'synastry');assert.equal(ai.consent,true);assert.equal(ai.partnerBirth.time,'09:10');assert.equal(ai.question,payload.question);
    p.click('[data-astro="save"]');await tick();assert.equal(p.saved[0].mode,'synastry');assert.equal(p.saved[0].partnerBirth.city,'上海');assert.equal(p.saved[0].source,'ai');
    const html=p.w.MarevysAstrologyStudio.renderChart(p.saved[0].chart,'zh',p.ctx.escape);assert.equal((html.match(/class="astro-wheel"/g)||[]).length,2);assert(html.includes('astroWheelTitle-personA'));assert(html.includes('astroWheelTitle-personB'));
  }finally{p.close();}
});

test('DOM: stale city responses cannot select old coordinates; new query preserves dates and reports retry',async()=>{
  let resolveParis,resolveLyon;
  const p=ui(path=>new Promise(resolve=>{if(path.includes('Paris'))resolveParis=resolve;else resolveLyon=resolve;}));
  try{
    p.fill('#astroDate',base.date);p.fill('#astroCity','Paris');p.click('[data-astro="search"]');p.fill('#astroCity','Lyon');p.click('[data-astro="search"]');
    resolveParis({locations:[paris],status:'ok'});await tick();assert.equal(p.root.querySelectorAll('[data-astro="location"]').length,0);
    resolveLyon({locations:[],status:'unavailable'});await tick();assert.equal(p.find('#astroDate').value,base.date);assert.equal(p.find('#astroLatitude').value,'');assert.match(p.find('.astro-location-status').textContent,/重试/);
  }finally{p.close();}
});

for(const outcome of ['basic','failed-ai','successful-ai'])test(`DOM: edited question is saved with its matching answer only after generation (${outcome})`,async()=>{
  const revisedQuestion='我们分开了，还有可能复合吗？';
  const p=ui(async(path,body)=>{
    if(path.startsWith('/api/locations'))return {locations:[path.includes('Paris')?paris:shanghai],status:'ok'};
    if(path==='/api/astrology')return (await request(body)).value;
    if(path==='/api/reading'){
      if(outcome==='failed-ai')throw new Error('AI unavailable');
      return {source:'ai',readingId:'revised-reading',reading:{headline:'关于重新靠近',coreAnswer:'先确认彼此是否愿意重新联系。',sections:[],actions:[]}};
    }
  });
  try{
    p.click('[data-astro="mode"][data-mode="synastry"]');p.fill('#astroDate',base.date);p.fill('#astroTime',base.time);p.fill('#astroPartnerDate',partner.date);p.fill('#astroPartnerTime',partner.time);p.fill('#astroQuestion',payload.question);
    await chooseCity(p,'birth','Paris');await chooseCity(p,'partnerBirth','Shanghai');
    p.find('[data-astro-form="birth"]').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await tick();
    const originalAnswer=p.find('.astro-core').textContent;assert.equal(p.state.resultQuestion,payload.question);
    p.fill('#astroResultQuestion',revisedQuestion);
    if(outcome!=='basic'){
      p.click('[name="aiConsent"]');p.click('[data-astro="deepen"]');await tick();
      assert.equal(p.calls.find(c=>c.path==='/api/reading').body.question,revisedQuestion);
    }
    const answeredQuestion=outcome==='successful-ai'?revisedQuestion:payload.question;
    const answer=outcome==='successful-ai'?'先确认彼此是否愿意重新联系。':originalAnswer;
    p.click('[data-astro="save"]');await tick();
    assert.equal(p.saved[0].question,answeredQuestion);assert.equal(p.saved[0].reading.coreAnswer,answer);assert.equal(p.state.resultQuestion,answeredQuestion);
    assert.equal(p.find('.astro-question-quote').lastChild.textContent,answeredQuestion);assert.equal(p.find('.astro-core').textContent,answer);
    if(outcome!=='successful-ai')assert.equal(p.find('#astroResultQuestion').value,revisedQuestion,'Unanswered draft remains available without relabelling the existing answer');
    assert.equal(p.saved[0].source,outcome==='successful-ai'?'ai':'basic');
  }finally{p.close();}
});
