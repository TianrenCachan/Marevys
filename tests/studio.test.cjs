'use strict';

// DOM integration tests, not browser/layout tests. Execute the emitted public
// runtime in jsdom and use real HTTP requests to the application's API handlers.
// The isolated API environment deliberately has no AI credentials or providers.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const http=require('node:http');
const {JSDOM,VirtualConsole}=require('jsdom');
const {buildWeb}=require('../scripts/build-web.cjs');
const {createHandler:createTarot}=require('../api/tarot.js');
const {createHandler:createReading}=require('../api/reading.js');
const {createHandler:createAstrology}=require('../api/astrology.js');
const locations=require('../api/locations.js');

let temp,dist,html,scripts,server,origin;
const windows=new Set();
const env={NODE_ENV:'test',SESSION_SECRET:'studio-dom-tests-only-secret-that-is-not-a-real-credential'};
const noExternalRequest=async()=>{throw new Error('DOM tests must never contact an AI or external provider');};
const routes={
  '/api/tarot':createTarot({env,fetchImpl:noExternalRequest}),
  '/api/reading':createReading({env,fetchImpl:noExternalRequest}),
  '/api/astrology':createAstrology(),
  '/api/locations':locations,
};

test.before(async()=>{
  temp=fs.mkdtempSync(path.join(os.tmpdir(),'marevys-studio-dom-'));
  dist=path.join(temp,'dist');buildWeb({outputDir:dist});
  html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
  scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g)].map(match=>fs.readFileSync(path.join(dist,match[1].replace(/^\//,'')),'utf8'));
  assert.equal(scripts.length,2,'Test the emitted runtime and full application bundle');
  server=http.createServer(async(req,res)=>{
    const handler=routes[new URL(req.url,'http://localhost').pathname];
    if(!handler){res.statusCode=404;res.end();return;}
    try{await handler(req,res);}catch(error){res.statusCode=500;res.end(JSON.stringify({error:{code:'TEST_HANDLER_FAILED'}}));}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(Number(process.env.STUDIO_TEST_PORT)||0,'127.0.0.1',resolve);});
  origin=`http://localhost:${server.address().port}`;
});
test.after(async()=>{
  for(const dom of windows)dom.window.close();
  if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  if(temp)fs.rmSync(temp,{recursive:true,force:true});
});

function page(seed={}){
  const errors=[],calls=[];
  const console=new VirtualConsole();
  console.on('jsdomError',error=>errors.push(error));
  const dom=new JSDOM(html,{url:origin+'/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:console,beforeParse(window){
    window.scrollTo=()=>{};window.HTMLElement.prototype.scrollTo=()=>{};window.HTMLElement.prototype.scrollIntoView=()=>{};
    window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
    window.confirm=()=>true;
    // Node fetch requires its own branded AbortSignal; cancellation still uses
    // the standard AbortController API exercised by the public bundle.
    window.AbortController=globalThis.AbortController;
    window.AbortSignal=globalThis.AbortSignal;
    window.fetch=async(url,options={})=>{
      const absolute=new URL(url,origin);assert.equal(absolute.origin,origin,'Public runtime may only call our isolated API');
      const request={path:absolute.pathname,payload:options.body?JSON.parse(options.body):null};calls.push(request);
      const response=await fetch(absolute,{...options,headers:{...options.headers,Origin:origin}});
      request.status=response.status;request.response=await response.clone().json();return response;
    };
    window.localStorage.setItem('marevys.language.v1',JSON.stringify('en'));
    for(const [key,value] of Object.entries(seed))window.localStorage.setItem(key,JSON.stringify(value));
  }});
  windows.add(dom);for(const source of scripts)dom.window.eval(source);
  const q=selector=>dom.window.document.querySelector(selector);
  const qa=selector=>[...dom.window.document.querySelectorAll(selector)];
  function fill(selector,value){const el=q(selector);assert(el,`Field ${selector} exists`);el.value=value;el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));el.dispatchEvent(new dom.window.Event('change',{bubbles:true}));return el;}
  function click(selector){const el=q(selector);assert(el,`Control ${selector} exists`);assert(!el.disabled,`Control ${selector} is enabled`);el.click();}
  function submit(selector){const el=q(selector);assert(el,`Form ${selector} exists`);assert(el.checkValidity(),`Form ${selector} contains valid input`);el.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));}
  function close(){assert.deepEqual(errors.map(e=>e.message),[],'No jsdom runtime errors');dom.window.MarevysStudio.pause();dom.window.close();windows.delete(dom);}
  return {dom,w:dom.window,q,qa,fill,click,submit,calls,errors,close};
}
async function until(predicate,label,timeout=6000){const start=Date.now();while(Date.now()-start<timeout){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,15));}assert.fail('Timed out: '+label);}
async function draw(p,count){
  p.w.startTarot();p.fill('#studioQuestion','What should I consider before changing my working routine?');p.submit('#studioQuestionForm');
  p.click(`input[name="spreadId"][value="${count===1?'one':count===5?'five':'three'}"]`);
  p.click('input[name="usesReversals"]');p.click('input[name="consent"]');p.submit('#studioDetailsForm');
  await until(()=>p.q('.view-draw'),'draw view');
  assert.equal(p.qa('.draw-positions span').length,count,'Radio choice reaches the real session API');
  p.click('[data-action="autoPick"]');p.click('[data-action="reveal"]');await until(()=>p.q('.view-reveal'),'reveal view');
  const revealed=p.calls.find(call=>call.path==='/api/tarot'&&call.payload?.action==='reveal').response;
  assert.equal(revealed.cards.length,count);assert.equal(new Set(revealed.cards.map(c=>c.id)).size,count);
  assert(revealed.cards.every(c=>c.orientation==='upright'),'Reversal opt-out is applied by the API');
  for(let i=0;i<count;i++)p.click('[data-action="flip"]');
  assert.equal(p.qa('.revealed-card.face-up').length,count);
  return revealed;
}

test('DOM integration: one-card radio, no reversals, honest AI failure, basic save and reopen',async()=>{
  const p=page();const revealed=await draw(p,1);p.click('[data-action="interpret"]');
  await until(()=>p.q('.view-result')&&p.q('.ai-notice')&&!p.q('.studio-loading'),'AI unavailable result');
  const ai=p.calls.find(call=>call.path==='/api/reading');assert.equal(ai.status,503);assert.equal(ai.response.error.code,'AI_NOT_CONFIGURED');
  assert(!p.q('.reading-origin').classList.contains('is-ai'),'Unavailable AI is never labelled AI');
  const original=p.q('.position-readings article p').textContent;assert(original.length>30,'Basic reference remains useful');
  p.fill('#studioNote','A synthetic integration-test note.');p.click('[data-action="save"]');
  const stored=JSON.parse(p.w.localStorage.getItem('marevys.readings.v2'));
  assert.equal(stored.length,1);assert.equal(stored[0].source,'basic');assert.equal(stored[0].cards[0].id,revealed.cards[0].id);
  p.click('[data-action="archive"]');p.click('[data-record="0"]');
  assert(p.q('.notebook-record').textContent.includes(original),'Saved basic text is preserved');
  assert(p.q('.notebook-record').textContent.includes('A synthetic integration-test note.'));
  p.close();
});

test('DOM integration: five-card radio survives form capture and reveals five unique upright cards',async()=>{
  const p=page();await draw(p,5);p.close();
});

test('DOM integration: a legacy I Ching object record opens with stored summary, action and notes',()=>{
  const legacy={id:123,date:'2025-01-01T12:00:00.000Z',schemaVersion:1,system:'ICHING',mode:'SIX-LINE CAST',question:'A previous I Ching question',reflection:'Original private reflection',symbols:{lines:[7,7,7,8,8,8],movingLines:[],primary:{number:11,name:'Peace'},related:null},interpretation:{headline:'An older reading',directAnswer:'The preserved original summary.',actionNow:'The preserved original action.',source:'local'},selectedProductIds:[]};
  const p=page({'marevys.oracleReadings.v1':[legacy]});p.w.openPath();p.click('[data-record="0"]');
  const text=p.q('.notebook-record').textContent;assert(text.includes('Peace'));assert(text.includes(legacy.interpretation.directAnswer));assert(text.includes(legacy.interpretation.actionNow));assert(text.includes(legacy.reflection));
  assert.deepEqual(JSON.parse(p.w.localStorage.getItem('marevys.oracleReadings.v1')),[legacy],'Viewing keeps legacy storage intact');p.close();
});

async function birth(p,unknown=false){
  p.w.startAstrology();p.fill('#astroDate','1990-07-16');p.fill('#astroTime','15:22');p.fill('#astroCity','Paris');p.click('[data-astro="search"]');
  await until(()=>p.q('[data-astro="location"]'),'location result');p.click('[data-astro="location"]');
  if(unknown)p.click('[name="timeUnknown"]');p.submit('[data-astro-form="birth"]');
  await until(()=>p.q('.astro-wheel'),'computed natal chart');
  return p.calls.find(call=>call.path==='/api/astrology').response.chart;
}
test('DOM integration: known-time astrology uses real calculation, consent gate and explicit local save',async()=>{
  const p=page();const chart=await birth(p);assert(chart.timeKnown);assert.equal(chart.planets.length,10);assert.equal(chart.houses.length,12);
  assert(p.q('.astro-wheel').textContent.includes('ASC'));assert.equal(p.w.localStorage.getItem('marevys.readings.v2'),null,'Birth data are not persisted on calculation');
  p.click('[data-astro="deepen"]');assert(p.q('.astro-error'));assert(!p.calls.some(c=>c.path==='/api/reading'),'No AI request without consent');
  p.click('[name="aiConsent"]');p.click('[data-astro="deepen"]');await until(()=>p.calls.some(c=>c.path==='/api/reading'&&c.status===503)&&p.q('.astro-error'),'explicit AI failure');
  assert(p.q('.astro-wheel'),'Original calculated chart remains visible');p.fill('#astroNote','A synthetic birth chart note.');p.click('[data-astro="save"]');
  await until(()=>p.w.localStorage.getItem('marevys.readings.v2'),'saved birth chart');
  const saved=JSON.parse(p.w.localStorage.getItem('marevys.readings.v2'))[0];assert.equal(saved.system,'ASTROLOGY');assert.equal(saved.source,'basic');assert.equal(saved.birth.time,'15:22');
  p.w.openPath();p.click('[data-record="0"]');assert(p.q('.astro-wheel'),'Saved chart can be viewed');assert(p.q('.notebook-record').textContent.includes('A synthetic birth chart note.'));p.close();
});

test('DOM integration: unknown birth time produces ranges without fabricated angles or precise planets',async()=>{
  const p=page();const chart=await birth(p,true);assert.equal(chart.timeKnown,false);assert.equal(chart.ascendant,null);assert.deepEqual(chart.houses,[]);assert.deepEqual(chart.aspects,[]);
  assert(chart.planets.every(planet=>planet.longitude===null&&planet.range));assert(!p.q('.astro-wheel').textContent.includes('ASC'));assert(p.q('.astro-time-note'));assert.equal(p.w.localStorage.getItem('marevys.readings.v2'),null);p.close();
});

test('DOM integration: language change preserves birth form and editing a city clears old coordinates',async()=>{
  const p=page();p.w.startAstrology();p.fill('#astroDate','1990-07-16');p.fill('#astroTime','15:22');p.fill('#astroQuestion','What helps me understand my own patterns?');
  p.w.MarevysStudio.applyLanguage('zh');assert.equal(p.q('#astroDate').value,'1990-07-16');assert.equal(p.q('#astroTime').value,'15:22');assert.equal(p.q('#astroQuestion').value,'What helps me understand my own patterns?');
  p.fill('#astroCity','Paris');p.click('[data-astro="search"]');await until(()=>p.q('[data-astro="location"]'),'city results');p.click('[data-astro="location"]');assert.equal(p.q('#astroTimezone').value,'Europe/Paris');
  p.fill('#astroCity','Lyon');assert.equal(p.q('#astroTimezone').value,'');assert.equal(p.q('#astroLatitude').value,'');assert.equal(p.q('#astroLongitude').value,'');p.close();
});

test('DOM integration: rotating deck browses all 78 hidden indices and preserves manual selection order',async()=>{
  const p=page();
  p.w.startTarot();p.fill('#studioQuestion','How can I make a little more space for a personal project?');p.submit('#studioQuestionForm');
  p.click('input[name="consent"]');p.submit('#studioDetailsForm');await until(()=>p.q('.view-draw'),'rotating draw');
  assert(p.q('#readingStudio').classList.contains('tarot-night'),'Tarot uses the midnight studio throughout');
  assert.equal(p.qa('.deck-card').length,11,'Only the visible arc is mounted initially');
  assert.equal(p.q('.deck-grid'),null,'The full-deck grid is absent');
  assert(p.qa('.deck-card img').every(img=>img.src===p.w.MAREVYS_ASSETS.tarotBack||img.getAttribute('src')===p.w.MAREVYS_ASSETS.tarotBack),'Every visible card stays face down');
  const started=p.calls.find(call=>call.path==='/api/tarot'&&call.payload?.action==='start');
  assert.equal(started.response.cards,undefined,'Server keeps all faces private before reveal');
  const keys=key=>p.q('.deck-viewport').dispatchEvent(new p.w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));
  const seen=new Set();for(let i=0;i<78;i++){seen.add(Number(p.q('.deck-card.at-center').dataset.pick));keys('ArrowRight');}
  assert.equal(seen.size,78,'Every shuffled server index is reachable using arrows');
  assert.equal(p.q('.deck-card.at-center').dataset.pick,'0','The deck wraps around');
  await until(()=>p.qa('.deck-card').length===11,'departing carousel cards are removed');
  p.click('.deck-card.at-center');keys('End');p.click('.deck-card.at-center');
  p.click('[data-remove="0"]');p.click('.deck-card.at-center');p.click('.deck-card.at-center');
  assert.equal(p.qa('.draw-slot.filled').length,3,'Removed card leaves its slot available for a new draw');
  p.click('[data-action="reveal"]');await until(()=>p.q('.view-reveal'),'manual reveal');
  const reveal=p.calls.find(call=>call.path==='/api/tarot'&&call.payload?.action==='reveal');
  assert.deepEqual(reveal.payload.indices,[77,0,1],'Choice order, including removal, is sent to the real server unchanged');
  assert.equal(new Set(reveal.response.cards.map(c=>c.id)).size,3);
  assert.equal(p.qa('.revealed-card.face-up').length,0,'Faces await the deliberate reveal interaction');
  p.click('[data-flip="0"]');assert.equal(p.qa('.revealed-card.face-up').length,1);
  assert.equal(p.q('[data-action="interpret"]'),null,'Reading waits until all cards are turned');
  p.close();
});

test('DOM integration: dragging the rotating deck does not accidentally select a card',async()=>{
  const p=page();p.w.startTarot();p.fill('#studioQuestion','What should I keep in mind about my next step?');p.submit('#studioQuestionForm');
  p.click('input[name="consent"]');p.submit('#studioDetailsForm');await until(()=>p.q('.view-draw'),'draw for drag');
  const viewport=p.q('.deck-viewport');
  const pointer=(type,x,y)=>{const event=new p.w.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0});Object.defineProperty(event,'pointerId',{value:1});viewport.dispatchEvent(event);};
  pointer('pointerdown',200,100);pointer('pointermove',97,102);pointer('pointerup',97,102);
  assert.equal(p.q('.deck-card.at-center').dataset.pick,'3','A horizontal swipe turns the deck');
  p.click('.deck-card.at-center');assert.equal(p.qa('.draw-slot.filled').length,0,'The click following a swipe is suppressed');
  pointer('pointerdown',180,100);pointer('pointermove',179,150);pointer('pointerup',179,150);
  assert.equal(p.q('.deck-card.at-center').dataset.pick,'3','Vertical page scrolling does not rotate the deck');
  p.close();
});
