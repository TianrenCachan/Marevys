'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Astronomy=require('astronomy-engine');
const {calculateChart,normalizeInput,AstrologyError,basicReading}=require('../server/astrology.cjs');
const {findLocations,LOCATIONS}=require('../server/astrology-locations.cjs');
const handler=require('../api/astrology.js');
const base={date:'2000-01-01',time:'12:00',timeUnknown:false,latitude:51.4779,longitude:0,timezone:'UTC',locale:'en'};
const close=(actual,expected,tolerance)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} differs from ${expected}`);

test('J2000 solar longitude agrees with independent solar formula and planet regression fixture is stable',()=>{
  const chart=calculateChart(base);
  // Independent low-order solar formula at T=0 (Meeus/NOAA formulation):
  // mean longitude + equation of centre - aberration/nutation approximation.
  const rad=Math.PI/180,anomaly=357.52911*rad;
  const centre=1.914602*Math.sin(anomaly)+0.019993*Math.sin(2*anomaly)+0.000289*Math.sin(3*anomaly);
  const independentSun=280.46646+centre-0.00569-0.00478*Math.sin(125.04*rad);
  close(chart.planets.find(p=>p.id==='Sun').longitude,independentSun,0.02);
  // Rounded engine regression fixture also catches reference-frame, planet ID,
  // geocentric/heliocentric and accidental degree/radian changes.
  const reference={Sun:280.37,Moon:223.32,Mercury:271.89,Venus:241.57,Mars:327.96,Jupiter:25.25,Saturn:40.40,Uranus:314.81,Neptune:303.19,Pluto:251.45};
  assert.equal(chart.planets.length,10);
  for(const planet of chart.planets)close(planet.longitude,reference[planet.id],0.03);
  assert.equal(chart.planets.find(p=>p.id==='Sun').sign.id,'capricorn');
  assert.equal(chart.planets.find(p=>p.id==='Saturn').retrograde,true);
  assert.equal(chart.instantUtc,'2000-01-01T12:00:00.000Z');
});

test('Ascendant lies on the eastern geometric horizon and MC on upper meridian in both hemispheres',()=>{
  for(const params of [base,{...base,latitude:-33.8688,longitude:151.2093},{...base,latitude:69.6492,longitude:18.9553},{...base,date:'1988-08-08',latitude:39.9,longitude:116.4}]){
    const chart=calculateChart(params);
    const time=Astronomy.MakeTime(new Date(chart.instantUtc));
    const observer=new Astronomy.Observer(params.latitude,params.longitude,0);
    function equatorial(point){
      const r=point.longitude*Math.PI/180;
      const vector=Astronomy.RotateVector(Astronomy.Rotation_ECT_EQD(time),new Astronomy.Vector(Math.cos(r),Math.sin(r),0,time));
      return Astronomy.EquatorFromVector(vector);
    }
    const asc=equatorial(chart.ascendant);
    const horizon=Astronomy.Horizon(time,observer,asc.ra,asc.dec,null);
    close(horizon.altitude,0,0.00001);
    assert.ok(horizon.azimuth>0&&horizon.azimuth<180,`Asc must be east, got ${horizon.azimuth}`);
    const mc=equatorial(chart.midheaven);
    const lst=(Astronomy.SiderealTime(time)+params.longitude/15+24)%24;
    const difference=((mc.ra-lst+36)%24)-12;
    close(difference,0,0.00001);
  }
});

test('Whole Sign houses start at sign boundaries and MC is independent of house 10',()=>{
  const chart=calculateChart({...base,locationId:'paris'});
  assert.equal(chart.houseSystem,'whole-sign');
  assert.equal(chart.houses.length,12);
  assert.equal(chart.houses[0].sign.id,chart.ascendant.sign.id);
  for(const house of chart.houses)assert.equal(house.longitude%30,0);
  assert.notEqual(chart.houses[9].longitude,chart.midheaven.longitude);
  for(const p of chart.planets)assert.equal(chart.houses[p.house-1].sign.id,p.sign.id);
});

test('birth instant uses historical IANA DST, rejects ambiguous and nonexistent clock times',()=>{
  const winter=calculateChart({...base,date:'2024-01-15',locationId:'paris'});
  const summer=calculateChart({...base,date:'2024-07-15',locationId:'paris'});
  assert.equal(winter.instantUtc,'2024-01-15T11:00:00.000Z');
  assert.equal(summer.instantUtc,'2024-07-15T10:00:00.000Z');
  const historicalChina=calculateChart({...base,date:'1990-07-15',locationId:'beijing'});
  assert.equal(historicalChina.instantUtc,'1990-07-15T03:00:00.000Z');
  for(const [date,code] of [['2024-03-31','TIME_NONEXISTENT'],['2024-10-27','TIME_AMBIGUOUS']]){
    assert.throws(()=>calculateChart({...base,date,time:'02:30',locationId:'paris'}),error=>error instanceof AstrologyError&&error.code===code);
  }
});

test('unknown-time calculations show daily ranges, handle zodiac wrap, and omit precise angles/aspects',()=>{
  const chart=calculateChart({...base,date:'2024-03-20',timeUnknown:true});
  assert.equal(chart.instantUtc,null);assert.equal(chart.ascendant,null);assert.equal(chart.midheaven,null);
  assert.deepEqual(chart.houses,[]);assert.deepEqual(chart.aspects,[]);
  assert.ok(chart.planets.every(p=>p.longitude===null&&p.degreeInSign===null&&p.house===null));
  const sun=chart.planets.find(p=>p.id==='Sun');
  assert.equal(sun.sign,null);
  assert.deepEqual(sun.range.possibleSigns.map(s=>s.id),['pisces','aries']);
  assert.ok(sun.range.maxUnwrapped-sun.range.minUnwrapped<2);
  const summerDay=calculateChart({...base,date:'2024-03-31',timeUnknown:true,locationId:'paris'});
  assert.equal((Date.parse(summerDay.intervalUtc.endExclusive)-Date.parse(summerDay.intervalUtc.start))/3600000,23);
  const winterDay=calculateChart({...base,date:'2024-10-27',timeUnknown:true,locationId:'paris'});
  assert.equal((Date.parse(winterDay.intervalUtc.endExclusive)-Date.parse(winterDay.intervalUtc.start))/3600000,25);
});

test('retrograde is derived from motion, not a fixed planet flag',()=>{
  const retro=calculateChart({...base,date:'2024-04-10'}).planets.find(p=>p.id==='Mercury');
  const direct=calculateChart({...base,date:'2024-05-15'}).planets.find(p=>p.id==='Mercury');
  assert.ok(retro.speedDegreesPerDay<0);assert.equal(retro.retrograde,true);
  assert.ok(direct.speedDegreesPerDay>0);assert.equal(direct.retrograde,false);
});

test('validation bounds date/coordinates/timezone and canonicalizes selected cities',()=>{
  for(const edit of [{date:'2024-02-30'},{date:'1800-01-01'},{time:'25:00'},{latitude:90},{longitude:181},{latitude:'48'},{timezone:'Fake/Zone'},{timezone:'+02:00'},{topic:'x'.repeat(1001)}]){
    assert.throws(()=>calculateChart({...base,...edit}),AstrologyError);
  }
  const selected=normalizeInput({...base,locationId:'paris',latitude:0,longitude:0,timezone:'UTC'});
  assert.equal(selected.latitude,48.8566);assert.equal(selected.timezone,'Europe/Paris');
  assert.throws(()=>calculateChart({...base,date:'2011-12-30',timeUnknown:true,timezone:'Pacific/Apia'}),e=>e.code==='DATE_NONEXISTENT');
});

test('curated location search is multilingual and bounded; basic reading is transparently labelled',()=>{
  assert.equal(findLocations('巴黎','zh')[0].id,'paris');
  assert.equal(findLocations('Montreal','fr')[0].id,'montreal');
  assert.equal(findLocations('not-a-city').length,0);
  assert.equal(findLocations('').length,LOCATIONS.length);
  const reading=basicReading(calculateChart(base),'en');
  assert.equal(reading.mode,'symbolic-basic');assert.match(reading.introduction,/not a deep AI reading/);
  assert.ok(reading.sections.length>=4);
});

async function request(body,headers={}){
  const req={method:'POST',headers:{host:'localhost:3000',origin:'http://localhost:3000','content-type':'application/json',...headers},body};
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.value=JSON.parse(v);}};
  await handler(req,res);return res;
}
test('HTTP chart route succeeds, reports user-friendly time errors, and enforces JSON/origin/body bounds',async()=>{
  const success=await request(base);assert.equal(success.statusCode,200);assert.equal(success.value.ok,true);assert.equal(success.value.reading.mode,'symbolic-basic');
  const ambiguous=await request({...base,date:'2024-10-27',time:'02:30',locationId:'paris',locale:'zh'});
  assert.equal(ambiguous.statusCode,400);assert.equal(ambiguous.value.error.code,'TIME_AMBIGUOUS');assert.match(ambiguous.value.error.message,/两次/);
  assert.equal((await request(base,{origin:'https://elsewhere.example'})).statusCode,403);
  assert.equal((await request(base,{'content-type':'text/plain'})).statusCode,415);
  assert.equal((await request({...base,extra:'x'.repeat(9000)})).statusCode,413);
});
