// Browser checks use fixture APIs and mocked push subscriptions; no family data or real pushes.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const origin = process.env.HABIT_QA_URL || 'http://127.0.0.1:3100';
const output = path.resolve(__dirname, '../../docs/qa');
const pause = ms => new Promise(r => setTimeout(r, ms));
const user = { id:'11111111-1111-4111-8111-111111111111', family_id:'22222222-2222-4222-8222-222222222222', name:'Nadia Pratama', email:'qa@example.test', role:'admin', color:'#007f5b' };
const today = new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});
const result = { checks:[], errors:[], audits:[], mutations:[] };
let mode='normal', failSave=false, failPush=false, key='BA', subscribed=false;
let meals=[{id:'meal-1',date:today+'T00:00:00Z',meal_type:'breakfast',name:'Nasi goreng',notes:'4 porsi',recipe_url:'https://example.test/resep'}, {id:'meal-2',date:today,meal_type:'breakfast',name:'Telur dadar',notes:'',recipe_url:''}];
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'habit-meals-chrome-'));
 const chrome=spawn('/usr/bin/google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
 let ws;
 try {
  for(let i=0;i<100&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));i++)await pause(100);
  const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
  const target=await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
  let sequence=0;const pending=new Map(),events={};
  ws.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(new Error(m.error.message));else p.resolve(m.result);}else for(const cb of events[m.method]||[])cb(m.params)};
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const on=(method,cb)=>(events[method]??=[]).push(cb);
  const ev=async(expression)=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text+': '+r.exceptionDetails.exception?.description);return r.result.value;};
  const wait=async(expression)=>{for(let i=0;i<100;i++){if(await ev(expression))return;await pause(100)}throw Error('Timed out: '+expression)};
  const find=selector=>`[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.getClientRects().length)`;
  const click=async(selector)=>{const rect=await ev(`(()=>{const e=${find(selector)};if(!e)throw Error('missing '+${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...rect});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...rect});await pause(150)};
  const textClick=async(text)=>{await ev(`(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.getClientRects().length&&e.textContent.trim()===${JSON.stringify(text)});if(!e)throw Error('missing button '+${JSON.stringify(text)});e.click()})()`);await pause(150)};
  const input=async(selector,value)=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});const setter=Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set;setter.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  const check=(name)=>result.checks.push(name);
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setBypassServiceWorker',{bypass:true});await send('Emulation.setTimezoneOverride',{timezoneId:'Asia/Jakarta'});
  on('Runtime.exceptionThrown',p=>result.errors.push(p.exceptionDetails.exception?.description||p.exceptionDetails.text));
  on('Page.javascriptDialogOpening',()=>void send('Page.handleJavaScriptDialog',{accept:true}));
  on('Fetch.requestPaused',async p=>{
   try{
    const u=new URL(p.request.url),route=u.pathname.split('/api/v1')[1],method=p.request.method;
    if(method==='OPTIONS'){await send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:204,responseHeaders:[{name:'Access-Control-Allow-Origin',value:'*'},{name:'Access-Control-Allow-Headers',value:'*'},{name:'Access-Control-Allow-Methods',value:'*'}],body:''});return;}
    let status=200,body={data:[],message:'success'};
    const data=p.request.postData?JSON.parse(p.request.postData):{};
    if(route==='/auth/refresh')body={data:{access_token:'qa-token'}};
    else if(route==='/auth/me')body={data:user};
    else if(route==='/family')body={data:{id:user.family_id,name:'Keluarga Pratama',invite_code:'QA123'}};
    else if(route==='/family/members')body={data:[user]};
    else if(route==='/push/subscription')body={subscribed};
    else if(route==='/push/vapid-key')body={public_key:key};
    else if(route==='/push/subscribe'){
     if(failPush){status=500;body={message:'Pendaftaran notifikasi gagal'}}else{subscribed=method!=='DELETE';body={message:'success'}}
    }
    else if(route==='/meal-plans'&&method==='GET'){
     if(mode==='error'){status=500;body={message:'Fixture unavailable'}}else body={data:mode==='empty'?[]:meals.filter(m=>m.date.slice(0,10)>=u.searchParams.get('from')&&m.date.slice(0,10)<=u.searchParams.get('to'))};
    }else if(route?.startsWith('/meal-plans')){
     result.mutations.push({route,method,data});
     if(failSave){status=400;body={message:'Gagal menyimpan fixture'}}
     else if(method==='POST'){const m={...data,id:'new-'+Date.now()};meals.push(m);body={data:m}}
     else if(method==='PUT'){const m=meals.find(m=>m.id===route.split('/')[2]);Object.assign(m,data);body={data:m}}
     else if(method==='DELETE'){meals=meals.filter(m=>m.id!==route.split('/')[2]);body={message:'success'}}
    }
    await send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:method==='OPTIONS'?204:status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'*'},{name:'Access-Control-Allow-Headers',value:'*'},{name:'Access-Control-Allow-Methods',value:'*'}],body:Buffer.from(method==='OPTIONS'?'':JSON.stringify(body)).toString('base64')});
   }catch(e){result.errors.push(e.message)}
  });
  await send('Fetch.enable',{patterns:[{urlPattern:'*/api/v1/*'}]});
  await send('Network.setCookie',{name:'access_token',value:'qa-token',url:origin});
  const source=`localStorage.setItem('keluarga-auth',JSON.stringify({state:{user:${JSON.stringify(user)},accessToken:'qa-token',isAuthenticated:true},version:0}));localStorage.setItem('access_token','qa-token');localStorage.setItem('pwa-prompt-dismissed',String(Date.now()));window.__subscription={endpoint:'https://fcm.googleapis.com/fixture',toJSON:()=>({keys:{p256dh:'key',auth:'secret'}}),unsubscribe:async()=>true};Object.defineProperty(navigator.serviceWorker,'getRegistration',{value:async()=>({active:true,pushManager:{getSubscription:async()=>window.__subscription,subscribe:async()=>window.__subscription}})});Object.defineProperty(Notification,'requestPermission',{value:async()=>'granted'});`;
  await send('Page.addScriptToEvaluateOnNewDocument',{source});
  const go=async(width=390,route='/meals')=>{await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:origin+route});await wait(`document.querySelector('h1') && !document.querySelector('nextjs-portal')`);await pause(500);if(route==='/meals')await wait(`!document.body.innerText.includes('Memeriksa notifikasi')`)};
  const screenshot=async(name)=>{const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,name),Buffer.from(shot.data,'base64'))};
  const auditDialog=async(name)=>{
   await ev(fs.readFileSync(path.resolve(__dirname,'../node_modules/axe-core/axe.min.js'),'utf8'));
   const violations=await ev(`axe.run(document.querySelector('[role="dialog"]'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}}).then(r=>r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})))`);
   result.audits.push({dialog:name,violations});
  };
  fs.mkdirSync(output,{recursive:true});
  await go();await wait(`document.body.innerText.includes('Nasi goreng')`);
  assert.equal(await ev(`document.querySelectorAll('[aria-label="Buka menu Nasi goreng"]').length`),2);check('multiple meals per slot, desktop and mobile render paths');
  await textClick('Aktifkan Notifikasi');await wait(`document.body.innerText.includes('Nonaktifkan Notifikasi')`);assert.ok(subscribed);check('notification activation waits for server persistence');
  await go();await wait(`document.body.innerText.includes('Nonaktifkan Notifikasi')`);check('notification status restored after reload');
  await textClick('Nonaktifkan Notifikasi');await wait(`document.body.innerText.includes('Aktifkan Notifikasi')`);assert.equal(subscribed,false);check('unsubscribe');
  key='';await textClick('Aktifkan Notifikasi');await wait(`document.body.innerText.includes('belum dikonfigurasi')`);assert.equal(subscribed,false);check('missing VAPID config produces error');
  key='BA';failPush=true;await textClick('Aktifkan Notifikasi');await wait(`document.body.innerText.includes('Pendaftaran notifikasi gagal')`);assert.equal(subscribed,false);check('server push registration failure produces error');failPush=false;
  await go();await click('button[aria-label="Buka menu Nasi goreng"]');await wait(`!!document.querySelector('[role="dialog"]')`);
  assert.equal(await ev(`document.querySelector('[role="dialog"]').getAttribute('aria-label')`),'Nasi goreng');check('detail dialog accessible name');await auditDialog('detail-light');
  await textClick('Edit');await wait(`!!document.querySelector('#meal-date')`);assert.equal(await ev(`document.querySelector('#meal-date').value`),today);check('timestamp date normalized for edit');await screenshot('meals-modal-mobile.png');await auditDialog('form-light');assert.ok(await ev(`document.querySelector('[role=dialog] > div').getBoundingClientRect().width<=360`));check('compact modal width');
  await input('#field-page-dashboardmeals-1','');await input('#field-page-dashboardmeals-2','');await input('#meal-type','dinner');
  const tomorrow=new Date(new Date(today+'T00:00:00Z').getTime()+86400000).toISOString().slice(0,10);
  await input('#meal-date',tomorrow);await textClick('Simpan');await wait(`!document.querySelector('[role="dialog"]')`);
  assert.equal(meals[0].date,tomorrow);assert.equal(meals[0].meal_type,'dinner');assert.equal(meals[0].notes,'');assert.equal(meals[0].recipe_url,'');check('edit moves date and slot and clears optional fields');
  await textClick('Tambah menu');await wait(`!!document.querySelector('#meal-form')`);assert.equal(await ev(`document.querySelector('#field-page-dashboardmeals-0').value`),'');
  await input('#field-page-dashboardmeals-0','Test menu');await textClick('Batal');await textClick('Tambah menu');assert.equal(await ev(`document.querySelector('#field-page-dashboardmeals-0').value`),'');check('add form resets on reopen');
  await input('#field-page-dashboardmeals-0','Test menu');await input('#field-page-dashboardmeals-2','javascript:alert(1)');const before=result.mutations.length;await textClick('Simpan');await wait(`document.querySelector('[role="alert"]')?.textContent.includes('http')`);assert.equal(result.mutations.length,before);check('unsafe recipe scheme blocked before API');
  await input('#field-page-dashboardmeals-2','');failSave=true;await textClick('Simpan');await wait(`document.body.innerText.includes('Gagal menyimpan fixture')`);assert.ok(await ev(`!!document.querySelector('#meal-form')`));check('failed save retains form');failSave=false;
  await textClick('Simpan');await wait(`!document.querySelector('[role="dialog"]')`);check('create menu');
  await click('button[aria-label="Buka menu Test menu"]');await textClick('Hapus');await wait(`!document.querySelector('[role="dialog"]')`);assert.equal(meals.some(m=>m.name==='Test menu'),false);check('delete menu with confirmation');
  await ev(`document.querySelector('button[aria-pressed="false"]').click()`);await textClick('Hari Ini');assert.equal(await ev(`Number(document.querySelector('button[aria-pressed="true"] span:last-child').textContent)`),Number(today.slice(-2)));check('today resets selected day');
  for(const width of [375,390,1024,1440]){
   await go(width);assert.equal(await ev(`document.documentElement.scrollWidth>innerWidth`),false);await screenshot(`meals-modern-${width}.png`);check(`layout without overflow ${width}`);
   await ev(fs.readFileSync(path.resolve(__dirname,'../node_modules/axe-core/axe.min.js'),'utf8'));
   const audit=await ev(`axe.run(document.querySelector('.app-main'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}}).then(r=>r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})))`);
   result.audits.push({width,theme:'light',violations:audit});
  }
  await click('[aria-label="Gunakan tema gelap"]');await pause(400);await screenshot('meals-modern-dark.png');
  result.audits.push({width:1440,theme:'dark',violations:await ev(`axe.run(document.querySelector('.app-main'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}}).then(r=>r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})))`)});
  await click('button[aria-label="Buka menu Telur dadar"]');await auditDialog('detail-dark');await textClick('Edit');await auditDialog('form-dark');await textClick('Batal');
  mode='empty';await go();await wait(`document.body.innerText.includes('Mau masak apa hari ini?')`);check('empty state');mode='error';await go();await pause(2500);await wait(`document.body.innerText.includes('Coba lagi')`);check('error state with retry');mode='normal';
  await go(1440,'/login');await wait(`!!document.querySelector('svg[aria-label="Habit"]')`);await screenshot('habit-wordmark-login.png');check('reference wordmark on login');
  assert.deepEqual(result.errors,[]);assert.ok(result.audits.every(a=>a.violations.length===0),JSON.stringify(result.audits));
 }finally{fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'meals-modern-results.json'),JSON.stringify(result,null,2));ws?.close();chrome.kill();}
 console.log(JSON.stringify({checks:result.checks.length,audits:result.audits.length,errors:result.errors}));
})().catch(e=>{console.error(e);process.exitCode=1});
