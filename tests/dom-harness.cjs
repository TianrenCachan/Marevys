/* Purpose-built DOM doubles for offline application tests, NOT a browser or layout engine.
 * The actual delivered inline script runs against this tree. Only selectors/APIs used
 * by this project are implemented. CSS, painting and real accessibility trees are not tested.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const decode=s=>s.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(_,v)=>v[0]==='#'?String.fromCodePoint(v[1].toLowerCase()==='x'?parseInt(v.slice(2),16):Number(v.slice(1))):({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:'\u00a0'})[v.toLowerCase()]);
const encode=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const voidTags=new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
function splitSelector(s){
 const result=[];let token='',depth=0,quote='';
 for(const c of s.trim()){
  if(quote){token+=c;if(c===quote)quote='';continue;}
  if(c==='"'||c==="'"){quote=c;token+=c;continue;}
  if(c==='['||c==='(')depth++;
  if(c===']'||c===')')depth--;
  if(!depth&&(c==='>'||/\s/.test(c))){if(token){result.push(token);token='';}if(c==='>')result.push('>');}else token+=c;
 }
 if(token)result.push(token);return result;
}
function simpleMatch(el,s){
 if(!el||el.nodeType!==1)return false;
 let valid=true;
 s=s.replace(/:not\(([^)]+)\)/g,(_,inner)=>{if(simpleMatch(el,inner))valid=false;return '';});
 s=s.replace(/:(disabled|enabled)/g,(_,kind)=>{if(kind==='disabled'?!el.disabled:el.disabled)valid=false;return '';});
 s=s.replace(/\[([^\]=\s]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\]]*)))?\]/g,(_,name,a,b,c)=>{
  const value=a??b??c;if(!el.hasAttribute(name)||(value!==undefined&&el.getAttribute(name)!==value))valid=false;return '';
 });
 s=s.replace(/#([\w-]+)/g,(_,id)=>{if(el.id!==id)valid=false;return '';});
 s=s.replace(/\.([\w-]+)/g,(_,name)=>{if(!el.classList.contains(name))valid=false;return '';});
 return valid&&(!s||s==='*'||el.tagName.toLowerCase()===s.toLowerCase());
}
function matches(el,selector){
 return selector.split(',').some(part=>{
  const tokens=splitSelector(part);let i=tokens.length-1,node=el;
  if(!simpleMatch(node,tokens[i]))return false;
  while(--i>=0){
   if(tokens[i]==='>'){node=node.parentElement;i--;if(!simpleMatch(node,tokens[i]))return false;}
   else{node=node.parentElement;while(node&&!simpleMatch(node,tokens[i]))node=node.parentElement;if(!node)return false;}
  }
  return true;
 });
}
class TextNode{
 constructor(value,doc){this.nodeValue=value;this.nodeType=3;this.ownerDocument=doc;this.parentElement=null;}
 get textContent(){return this.nodeValue;}set textContent(value){this.nodeValue=String(value);}
 get isConnected(){return !!this.parentElement?.isConnected;}
}
class Element{
 constructor(tag,doc){
  this.nodeType=1;this.tagName=tag.toUpperCase();this.ownerDocument=doc;this.parentElement=null;this.childNodes=[];this.attributes=new Map();this.listeners=new Map();
  this.style={setProperty(k,v){this[k]=v;},removeProperty(k){const previous=this[k]||'';delete this[k];return previous;}};this.value='';this.scrollTop=0;this.inert=false;
  this.classList={
   contains:n=>this.className.split(/\s+/).includes(n),
   add:(...names)=>{this.className=[...new Set([...this.className.split(/\s+/).filter(Boolean),...names])].join(' ');},
   remove:(...names)=>{this.className=this.className.split(/\s+/).filter(n=>!names.includes(n)).join(' ');},
   toggle:(n,force)=>{const on=force===undefined?!this.classList.contains(n):force;this.classList[on?'add':'remove'](n);return on;}
  };
  const key=k=>'data-'+k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  this.dataset=new Proxy({}, {get:(_,k)=>this.getAttribute(key(k))??undefined,set:(_,k,v)=>{this.setAttribute(key(k),String(v));return true;}});
 }
 get id(){return this.getAttribute('id')||'';}set id(v){this.setAttribute('id',v);}
 get className(){return this.getAttribute('class')||'';}set className(v){this.setAttribute('class',v);}
 get children(){return this.childNodes.filter(n=>n.nodeType===1);}
 get isConnected(){return this===this.ownerDocument?.documentElement||!!this.parentElement?.isConnected;}
 get hidden(){return this.hasAttribute('hidden');}set hidden(v){v?this.setAttribute('hidden',''):this.removeAttribute('hidden');}
 get disabled(){return this.hasAttribute('disabled');}set disabled(v){v?this.setAttribute('disabled',''):this.removeAttribute('disabled');}
 get open(){return this.hasAttribute('open');}set open(v){v?this.setAttribute('open',''):this.removeAttribute('open');}
 setAttribute(k,v){this.attributes.set(k,String(v));}
 getAttribute(k){return this.attributes.get(k)??null;}
 hasAttribute(k){return this.attributes.has(k);}
 removeAttribute(k){this.attributes.delete(k);}
 append(...nodes){for(let node of nodes){if(typeof node==='string')node=new TextNode(node,this.ownerDocument);if(node.parentElement)node.parentElement.childNodes=node.parentElement.childNodes.filter(n=>n!==node);node.parentElement=this;this.childNodes.push(node);}}
 replaceChildren(...nodes){this.childNodes.forEach(n=>n.parentElement=null);this.childNodes=[];this.append(...nodes);}
 get textContent(){return this.childNodes.map(n=>n.textContent).join('');}
 set textContent(v){this.replaceChildren(new TextNode(String(v),this.ownerDocument));}
 get innerHTML(){return this.childNodes.map(serialize).join('');}
 set innerHTML(v){this.replaceChildren(...parse(String(v),this.ownerDocument));}
 querySelectorAll(selector){const found=[];const walk=el=>{for(const child of el.children){if(matches(child,selector))found.push(child);walk(child);}};walk(this);return found;}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
 closest(selector){for(let node=this;node;node=node.parentElement)if(matches(node,selector))return node;return null;}
 contains(node){for(let n=node;n;n=n.parentElement)if(n===this)return true;return false;}
 focus(){this.ownerDocument.activeElement=this;}
 getBoundingClientRect(){return {bottom:88};}
 getClientRects(){return this.hidden||this.inert||this.closest('[hidden]')?[]:[{}];}
 scrollIntoView(options){this.ownerDocument.scrolls.push({id:this.id,options});}
 addEventListener(type,fn){const listeners=this.listeners.get(type)||[];listeners.push(fn);this.listeners.set(type,listeners);}
 dispatchEvent(event){event.target??=this;for(const fn of this.listeners.get(event.type)||[])fn.call(this,event);return true;}
 click(){
  if(this.disabled)return;
  const event={target:this,type:'click',preventDefault(){this.defaultPrevented=true;}};
  if(this.onclick)this.onclick(event);
  else if(this.hasAttribute('onclick'))this.ownerDocument.runHandler(this.getAttribute('onclick'),event);
  this.dispatchEvent(event);
 }
}
function serialize(node){
 if(node.nodeType===3)return encode(node.nodeValue);
 const tag=node.tagName.toLowerCase(),attrs=[...node.attributes].map(([k,v])=>' '+k+'="'+encode(v)+'"').join('');
 return '<'+tag+attrs+'>'+node.innerHTML+(voidTags.has(tag)?'':'</'+tag+'>');
}
function parse(markup,doc){
 const root=new Element('fragment',doc),stack=[root];
 for(const [token] of markup.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>]*>|[^<]+/g)){
  if(token.startsWith('<!'))continue;
  if(token.startsWith('</')){const tag=token.slice(2,-1).trim().toUpperCase();if(stack.at(-1).tagName!==tag)throw Error('DOM double cannot parse closing tag '+tag);stack.pop();continue;}
  if(token.startsWith('<')){
   const tag=token.match(/^<([\w-]+)/)[1],el=new Element(tag,doc);
   for(const m of token.slice(tag.length+1,-1).matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))el.setAttribute(m[1],decode(m[2]??m[3]??m[4]??''));
   stack.at(-1).append(el);if(!voidTags.has(tag)&&!token.endsWith('/>'))stack.push(el);
  }else stack.at(-1).append(new TextNode(decode(token),doc));
 }
 if(stack.length!==1)throw Error('DOM double encountered unclosed markup');
 return [...root.childNodes];
}
function createHarness({language='en',saved={},blocked=false,bundle=true,endpoint='',fetchMock=null}={}){
 const backing=new Map(Object.entries(saved).map(([k,v])=>[k,JSON.stringify(v)]));backing.set('marevys.language.v1',JSON.stringify(language));
 const document={scrolls:[],listeners:new Map(),createElement:tag=>new Element(tag,document),createTextNode:text=>new TextNode(text,document),
  querySelectorAll:s=>[...(matches(document.documentElement,s)?[document.documentElement]:[]),...document.documentElement.querySelectorAll(s)],
  querySelector:s=>document.querySelectorAll(s)[0]||null,getElementById:id=>document.querySelector('#'+id),
  createTreeWalker(root){const nodes=[];const walk=n=>{for(const child of n.childNodes||[]){if(child.nodeType===3)nodes.push(child);else walk(child);}};walk(root);let i=0;return {nextNode:()=>nodes[i++]||null};},
  addEventListener(type,fn){this.listeners.set(type,[...(this.listeners.get(type)||[]),fn]);},
  dispatchEvent(event){for(const fn of this.listeners.get(event.type)||[])fn(event);}
 };
 document.documentElement=parse(fs.readFileSync(path.join(root,'src/template.html'),'utf8'),document).find(n=>n.tagName==='HTML');
 document.body=document.querySelector('body');document.head=document.querySelector('head');document.activeElement=document.body;
 const timers=new Map();let nextTimer=1,now=0;
 const window={document,scrollY:0,matchMedia:()=>({matches:false}),addEventListener(){},scrollTo:options=>document.scrolls.push({id:'window',options}),
  localStorage:{getItem(k){if(blocked)throw Error('Storage blocked');return backing.get(k)??null;},setItem(k,v){if(blocked)throw Error('Storage blocked');backing.set(k,v);}},
  location:{reload(){throw Error('Reload is not allowed during an interaction');}}
 };
 if(endpoint)window.MAREVYS_AI_ENDPOINT=endpoint;
 if(fetchMock)window.fetch=fetchMock;
 const context=Object.assign(window,{window,document,NodeFilter:{SHOW_TEXT:4},console,setTimeout(fn,ms=0){const id=nextTimer++;timers.set(id,{fn,at:now+ms});return id;},clearTimeout:id=>timers.delete(id)});
 vm.createContext(context);
 document.runHandler=(code,event)=>{context.__event=event;vm.runInContext('(function(event){'+code+'})(__event)',context);};
 const hooks='window.__test={state,layers,store,t,chooseLanguage,chooseMode,productDetails,imageForProduct,commercePath};';
 const injectAppHooks=source=>{
  const marker='  init();',index=source.lastIndexOf(marker);
  if(index<0)throw Error('Could not attach test-only hooks');
  return source.slice(0,index)+hooks+'\n'+source.slice(index);
 };
 if(bundle){
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)[1];
  vm.runInContext(injectAppHooks(script),context,{filename:'delivered-bundle.js'});
 }else{
  const assetKeys=['hero','logo','parfum','runes','tea','path','oracle','ritual','journal','object','yi','ichingReading','ritualObjects','ritualEveryday','aboutHouse','productStone24','productPulse01','productMedallion01','productEmber01','productCloth01','productArcana22','productCoin64','ritualGround','ritualOpen','ritualProsper','ritualClear','ritualMove','ritualRest','ritualProtect','ritualCreate',...Array.from({length:24},(_,number)=>'runeStoneBack'+(number+1)),'tarotBack','runeReadingSurface','tarotReadingSurface','ichingReadingSurface','readingRecordReturn01','matchEau01','matchVeil01','matchSpecimen01','matchReturn01','matchStone24','matchGround01','matchPulse01','matchMedallion01','matchEmber01','matchCloth01','matchArcana22','matchCoin64','bookmarkEau01','bookmarkVeil01','bookmarkSpecimen01','bookmarkReturn01','bookmarkStone24','bookmarkGround01','bookmarkPulse01','bookmarkMedallion01','bookmarkEmber01','bookmarkCloth01','bookmarkArcana22','bookmarkCoin64'];
  for(let number=0;number<=21;number++)assetKeys.push('tarot'+String(number).padStart(2,'0'));
  window.MAREVYS_ASSETS=Object.fromEntries(assetKeys.map(k=>[k,'data:image/mock,'+k]));
  for(const file of ['data.js','experience-data.js','oracle-data.js','i18n.js','i18n-runes.js','i18n-house.js','i18n-flow.js','i18n-experience.js','i18n-oracles.js','i18n-rc15.js','i18n-rc16-gate.js','i18n-rc16.js','i18n-rc17.js','i18n-rc18.js','i18n-rc19.js','core.js','oracle.js','app.js']){
   const source=fs.readFileSync(path.join(root,'src',file),'utf8');vm.runInContext(file==='app.js'?injectAppHooks(source):source,context,{filename:file});
  }
 }
 return {window,document,backing,context,get:selector=>document.querySelector(selector),all:selector=>document.querySelectorAll(selector),hooks:window.__test,
  advance(ms){now+=ms;for(const [id,timer] of [...timers])if(timer.at<=now){timers.delete(id);timer.fn();}},
  key(key,shiftKey=false){const event={type:'keydown',target:document.activeElement,key,shiftKey,preventDefault(){this.defaultPrevented=true;}};document.dispatchEvent(event);return event;}
 };
}
module.exports={createHarness};
