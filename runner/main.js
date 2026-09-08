import { courier, icon } from './art.js';
import { RULES, CLOAKS, UPGRADES, MISSIONS, BIOMES } from './content.js';
import { createRun, startRun, stepRun, command, finishRun, biomeAt, dailyKey, dailySeed } from './sim.js';
import { loadProfile, saveProfile, levelInfo, missionValue, completeRun, buyCloak, buyUpgrade } from './profile.js';
import { createView } from './render.js';
import { createSound } from './audio.js';
const $=id=>document.getElementById(id), fmt=n=>Math.floor(n).toLocaleString('en-US');
const params=new URLSearchParams(location.search);
// Old review links retain their meaning after the runner becomes the entry point.
if(params.has('fixture')) location.replace('./classic.html'+location.search);
let profile=loadProfile(),run=createRun(),reward=null,modalKind='',wardrobeTab='cloaks';
let toastUntil=0,last=performance.now(),accumulator=0,hudClock=0,installPrompt=null,savingWarning=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
if(reduced.matches)profile.settings.motion=false;
const sound=createSound();sound.setEnabled(profile.settings.sound);
let view;
try{view=createView($('world'));}catch(error){const notice=document.createElement('p');notice.className='fatal';notice.textContent=error.message;document.body.append(notice);throw error;}
const modal=$('modal');
function toast(message,seconds=2.4){$('toast').textContent=message;$('toast').hidden=false;toastUntil=performance.now()+seconds*1000;}
function persist(){const ok=saveProfile(profile);if(!ok&&!savingWarning){savingWarning=true;toast('Saving is unavailable in this browser. This session still works.',6);}return ok;}
function homeStats(){
  $('wallet').textContent=fmt(profile.coins);$('home-best').textContent=profile.best?fmt(profile.best):'—';
  const {level}=levelInfo(profile.xp);$('home-level').innerHTML=`${String(level).padStart(2,'0')} <small>${level<3?'First spark':level<6?'Trail keeper':'Flame bearer'}</small>`;
  $('mission-count').textContent=`${profile.claimed.length} / ${MISSIONS.length}`;$('cloak-count').textContent=`${profile.owned.length} / ${CLOAKS.length}`;
  $('sound').innerHTML=icon(profile.settings.sound?'sound':'mute');$('sound').setAttribute('aria-label',profile.settings.sound?'Mute sound':'Enable sound');$('sound').setAttribute('aria-pressed',String(profile.settings.sound));
}
function goHome(){
  if(run.phase==='running'||run.phase==='paused'){finishRun(run);settle(false);}
  if(modal.open)modal.close();modalKind='';run=createRun();reward=null;accumulator=0;
  $('home').hidden=false;$('topbar').hidden=false;$('run-hud').hidden=true;$('shade').classList.remove('playing');homeStats();$('play').focus();
}
function begin(mode='endless'){
  if(modal.open)modal.close();modalKind='';
  const day=dailyKey(), seed=mode==='daily'?dailySeed(day):params.has('seed')?Number(params.get('seed'))>>>0:crypto.getRandomValues(new Uint32Array(1))[0];
  run=createRun({seed,mode,day,id:crypto.randomUUID?.()||`${Date.now()}-${seed}`,upgrades:profile.upgrades});
  startRun(run);reward=null;accumulator=0;last=performance.now();sound.unlock();
  $('home').hidden=true;$('topbar').hidden=true;$('run-hud').hidden=false;$('shade').classList.add('playing');$('pause').focus({preventScroll:true});
  $('mode-label').textContent=mode==='daily'?'DAILY TRAIL · '+day:'ENDLESS RUN';hud();
}
function settle(show=true){
  const result=completeRun(profile,run);if(result){reward=result;persist();homeStats();}
  if(show)openModal('results');
}
function pause(){if(run.phase==='running'){run.phase='paused';accumulator=0;openModal('pause');}}
function resume(){if(modal.open)modal.close();modalKind='';if(run.phase==='paused'){run.phase='running';last=performance.now();accumulator=0;$('pause').focus();sound.unlock();}}
function dismiss(){if(modalKind==='pause')resume();else if(modalKind==='results')goHome();else {modal.close();modalKind='';}}
function drawPortraits(){
  for(const canvas of modal.querySelectorAll('[data-portrait]')){
    const cloak=CLOAKS.find(c=>c.id===canvas.dataset.portrait),ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,240,300);ctx.save();ctx.translate(112,271);ctx.scale(1.18,1.18);
    courier(ctx,{color:cloak.color,trim:cloak.trim});ctx.restore();
  }
}
function meter(value){return `<div class="meter"><i style="transform:scaleX(${Math.max(0,Math.min(1,value))})"></i></div>`;}
function dialogButton(action,text,style='primary'){return `<button class="${style}" data-do="${action}">${text}</button>`;}
function openModal(kind){
  modalKind=kind;let title='',kicker='THE ROAD AHEAD',body='';
  if(kind==='pause'){
    title='Take a breather';kicker='TRAIL STOP';
    body=`<p class="dialog-intro">Your lantern is safe here. Pick up exactly where you left off.</p><div class="stat-grid"><div><span>DISTANCE</span><strong>${fmt(run.distance)} m</strong></div><div><span>CINDERS</span><strong>${run.coins}</strong></div><div><span>LANTERN</span><strong>${Math.ceil(run.fuel)}%</strong></div></div><div class="dialog-actions">${dialogButton('resume','Keep running')}${dialogButton('bank','Finish & bank','secondary')}</div><p class="fine-print">Esc to resume. Finishing banks your cinders and journey progress.</p>`;
  }else if(kind==='results'){
    title=reward?.newBest?'A run for the journal':'Back at camp';kicker=reward?.newBest?'NEW PERSONAL BEST':'THE LANTERN RESTS';
    body=`<p class="score-caption">${run.mode==='daily'?'DAILY TRAIL':'RUN SCORE'}</p><div class="big-score">${fmt(run.score)}</div><div class="stat-grid"><div><span>DISTANCE</span><strong>${fmt(run.distance)} m</strong></div><div><span>CINDERS</span><strong>+${run.coins}</strong></div><div><span>BEST COMBO</span><strong>${run.bestCombo}</strong></div></div><div class="reward">+${reward?.xp||0} Warden XP${reward?.levelUp?' · Level up! You are now level '+levelInfo(profile.xp).level+'.':''}${reward?.reward?`<br>+${reward.reward} bonus cinders · ${reward.completed.length} journey milestones completed`:''}</div><div class="progress-row"><span>WARDEN LEVEL ${levelInfo(profile.xp).level}</span><span>${fmt(levelInfo(profile.xp).remaining)} XP to next level</span></div>${meter(levelInfo(profile.xp).progress)}<div class="dialog-actions">${dialogButton('again','Run again')}${dialogButton('home','Back to camp','secondary')}</div><button class="text-button" data-do="copy-score">Copy run summary</button><p class="fine-print">${run.hits?'Stones: change lanes. Roots: jump. Low gates: slide. ':''}Cinders feed your lantern a little; green oil restores much more. Your rewards are banked${savingWarning?' for this session':''}.</p>`;
  }else if(kind==='journey'){
    title='Trail journal';kicker='THE LANTERN POST';const l=levelInfo(profile.xp);
    body=`<div class="progress-row"><span>WARDEN LEVEL ${l.level}</span><span>${fmt(l.remaining)} XP to next level</span></div>${meter(l.progress)}<p class="dialog-intro" style="margin-top:18px">Every run moves you forward. Milestone rewards are banked automatically at the end of a run.</p>`;
    body+=MISSIONS.map(m=>{const value=missionValue(profile,m),done=profile.claimed.includes(m.id);return `<div class="mission ${done?'done':''}"><div><strong>${done?'✓ ':''}${m.name}</strong><p>${m.desc} · ${fmt(Math.min(value,m.target))} / ${fmt(m.target)}</p></div><small>${done?'Earned':'◆ '+m.reward}</small>${meter(value/m.target)}</div>`;}).join('');
  }else if(kind==='wardrobe'){
    title='Your travelling kit';kicker=`OUTFITTER · ${fmt(profile.coins)} CINDERS`;
    body=`<div class="tabs"><button data-tab="cloaks" class="${wardrobeTab==='cloaks'?'active':''}">Cloaks</button><button data-tab="upgrades" class="${wardrobeTab==='upgrades'?'active':''}">Lantern craft</button></div>`;
    if(wardrobeTab==='cloaks'){
      body+='<p class="dialog-intro">A good coat goes a long way. Every outfit is earned with cinders collected on the road.</p><div class="cloak-grid">';
      body+=CLOAKS.map(c=>{const owned=profile.owned.includes(c.id),selected=profile.selected===c.id,locked=levelInfo(profile.xp).level<c.level,afford=profile.coins>=c.price;return `<div class="cloak-card ${selected?'selected':''}"><canvas class="portrait" width="240" height="300" data-portrait="${c.id}" role="img" aria-label="Fox courier wearing ${c.name}"></canvas><strong>${c.name}</strong><p>${c.desc}</p><button data-cloak="${c.id}" ${!owned&&(locked||!afford)?'disabled':''} ${selected?'aria-pressed="true"':''}>${selected?'Equipped':owned?'Equip':locked?'Level '+c.level+' · ◆ '+c.price:'Unlock · ◆ '+c.price}</button></div>`;}).join('')+'</div>';
    }else {
      body+='<p class="dialog-intro">A little help for the long road. Upgrades apply to Endless runs; Daily trails always use base stats.</p>';
      body+=UPGRADES.map(u=>{const lv=profile.upgrades[u.id],price=u.prices[lv];return `<div class="upgrade"><div><strong>${u.name}</strong><p>${u.desc}</p><small>${'◆'.repeat(lv)}${'◇'.repeat(3-lv)} · Level ${lv} / 3</small></div><button data-upgrade="${u.id}" ${lv>=3||profile.coins<price?'disabled':''}>${lv>=3?'Mastered':'Craft · ◆ '+price}</button></div>`;}).join('');
    }
    body+='<p class="fine-print">The outfitter takes cinders, never real money. All coats are cosmetic.</p>';
  }else if(kind==='daily'){
    title='Today’s delivery';kicker='THE DAILY TRAIL';const day=dailyKey();
    body=`<p class="daily-date">${day} · UTC</p><p class="dialog-intro">A fresh seeded trail each day. Everyone gets the same obstacles and base lantern. Replay as often as you like, and try to beat your own best.</p><div class="stat-grid"><div><span>TODAY’S BEST</span><strong>${fmt(profile.daily[day]||0)}</strong></div><div><span>UPGRADES</span><strong>Base</strong></div><div><span>ATTEMPTS</span><strong>∞</strong></div></div>${dialogButton('daily-start','Take the daily trail')}<p class="fine-print">Daily records live on this device. No online leaderboard or account. Cinders and XP still count toward your journey. No missed-day penalties.</p>`;
  }else if(kind==='settings'){
    title='Camp preferences';kicker='MAKE YOURSELF AT HOME';
    const setting=(id,label,desc)=>`<div class="setting"><div><strong>${label}</strong><small>${desc}</small></div><button data-setting="${id}" role="switch" aria-checked="${profile.settings[id]}">${profile.settings[id]?'On':'Off'}</button></div>`;
    body=setting('sound','Sound & music','Plucked notes, cinder chimes, and soft footsteps.')+setting('motion','Atmospheric motion','Particles, menu drift, and impact flashes.')+setting('controls','On-screen controls','Tap buttons as an alternative to swiping.');
    body+=`<div class="setting"><div><strong>Visual quality</strong><small>Low uses fewer particles and a smaller canvas.</small></div><select id="quality" aria-label="Visual quality"><option value="high" ${profile.settings.quality==='high'?'selected':''}>High</option><option value="low" ${profile.settings.quality==='low'?'selected':''}>Low</option></select></div><div class="dialog-actions">${dialogButton('install','Install app','secondary')}${dialogButton('help','How to play','secondary')}</div><p class="fine-print">Progress is saved in this browser. Clearing site data removes it. No accounts, trackers, ads, or purchases. <a href="./classic.html">Play the original lantern-combat prototype ↗</a></p>`;
  }else if(kind==='help'){
    title='A courier’s field guide';kicker='YOUR FIRST DELIVERY';
    body='<p class="dialog-intro">You run automatically. Keep your lantern burning and follow the cinders into the forest.</p><div class="how-grid"><div><b>← →</b><strong>Change lanes</strong><p>Swipe left or right. Keyboard: <kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd>. Dodge tall stones.</p></div><div><b>↑</b><strong>Jump the roots</strong><p>Swipe up, <kbd>↑</kbd>, <kbd>W</kbd>, or <kbd>Space</kbd>. Time your jump as a low log approaches.</p></div><div><b>↓</b><strong>Slide under gates</strong><p>Swipe down, <kbd>↓</kbd>, or <kbd>S</kbd>. Slide beneath the hanging blue gates.</p></div><div><b>✦</b><strong>Keep the flame</strong><p>Green oil restores fuel. Violet magnets gather cinders. Blue wards block one hit.</p></div></div><div class="reward">Gather 24 cinders without a hit to trigger Ember Rush: 7 seconds of protection, automatic cinder collection, and double cinder points.</div><p class="fine-print">Your lantern is your life. Hits cost 32 fuel; green oil restores 24. Consecutive cinders build a score combo. Esc pauses. M toggles sound. Touch controls also work with a mouse.</p>';
    body+=dialogButton('start','Ready. Let’s run');
  }
  $('modal-title').textContent=title;$('modal-kicker').textContent=kicker;$('modal-content').innerHTML=body;
  if(!modal.open)modal.showModal();
  modal.scrollTop=0;
  drawPortraits();
}
function hud(){
  $('score').textContent=fmt(run.score);$('distance').textContent=fmt(run.distance);$('run-coins').textContent=run.coins;$('biome').textContent=biomeAt(run.distance).name;
  const fuel=Math.ceil(run.fuel);$('fuel-number').textContent=fuel;$('fuel-fill').style.transform=`scaleX(${run.fuel/100})`;$('fuel-meter').setAttribute('aria-valuenow',fuel);$('fuel-meter').parentElement.classList.toggle('low',fuel<28);
  $('combo').hidden=run.combo<5;$('combo-count').textContent=run.combo;$('rush-fill').style.transform=`scaleX(${run.fever>0?run.fever/RULES.feverDuration:run.charge/RULES.feverAt})`;
  $('rush-label').textContent=run.fever>0?`EMBER RUSH · ${Math.ceil(run.fever)}s`:`EMBER RUSH · ${run.charge}/${RULES.feverAt}`;
  $('powers').innerHTML=[run.magnet>0?`✧ MAGNET ${Math.ceil(run.magnet)}s`:'',run.shield?'◇ WARD READY':''].filter(Boolean).map(t=>`<span>${t}</span>`).join('');
  $('touch-controls').hidden=!profile.settings.controls;
  const hint=run.distance<65?'Follow the glowing cinders':run.distance<130?'← → Change lanes to dodge stones':run.distance<164?'↑ Jump over low roots':run.distance<215?'↓ Slide under blue gates':run.fuel<28?'Lantern low — look for green oil':'';
  $('run-hint').textContent=hint;$('run-hint').hidden=!hint;
  if(params.has('debug')){$('debug').hidden=false;$('debug').textContent=JSON.stringify({phase:run.phase,lane:run.lane,action:run.action,seed:run.seed,distance:Math.round(run.distance),fuel,coins:run.coins,entities:run.entities.length,next:run.entities.filter(e=>!e.done&&['rock','root','arch'].includes(e.type)).slice(0,2).map(e=>({type:e.type,lane:e.lane,in:Math.round(e.z-run.distance)}))});}
}
function frame(now){
  const dt=Math.min(.1,(now-last)/1000);last=now;
  if(run.phase==='running'){
    accumulator+=dt;const events=[];
    while(accumulator>=RULES.step&&run.phase==='running'){events.push(...stepRun(run));accumulator-=RULES.step;}
    view.events(events,run);sound.events(events,run.combo);sound.tick(true,run);
    for(const event of events){
      if(event.type==='fever')toast('EMBER RUSH · Your light is unstoppable',2);
      else if(event.type==='biome')toast(event.name,3);
      else if(event.type==='oil')toast('Lantern replenished',1.3);
      else if(event.type==='hit')toast(event.kind==='rock'?'Stone strike · Change lanes':event.kind==='root'?'Root strike · Jump over it':'Gate strike · Slide underneath',1.8);
      else if(event.type==='magnet')toast('Ember magnet',1.5);
      else if(event.type==='shield')toast('Ward ready · One hit protected',1.5);
    }
    if(run.phase==='ended')settle();
  }
  if(run.phase==='running'||run.phase==='ready')view.draw(run,profile,dt);
  else if(view.needsDraw)view.draw(run,profile,0);
  hudClock+=dt;if(hudClock>.1){hudClock=0;if(run.phase!=='ready')hud();}
  if(toastUntil&&now>toastUntil){$('toast').hidden=true;toastUntil=0;}
  requestAnimationFrame(frame);
}
$('play').addEventListener('click',()=>begin());
for(const kind of ['journey','wardrobe','daily','settings','help'])$(kind).addEventListener('click',()=>openModal(kind));
$('pause').addEventListener('click',pause);$('close-modal').addEventListener('click',dismiss);
modal.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
function toggleSound(){profile.settings.sound=!profile.settings.sound;sound.setEnabled(profile.settings.sound);sound.unlock();persist();homeStats();}
$('sound').addEventListener('click',toggleSound);
$('modal-content').addEventListener('click',async e=>{
  const button=e.target.closest('button');if(!button||button.disabled)return;
  if(button.dataset.cloak){if(buyCloak(profile,button.dataset.cloak)){persist();homeStats();openModal('wardrobe');view.draw(run,profile,0);}return;}
  if(button.dataset.upgrade){if(buyUpgrade(profile,button.dataset.upgrade)){persist();homeStats();openModal('wardrobe');}return;}
  if(button.dataset.tab){wardrobeTab=button.dataset.tab;openModal('wardrobe');return;}
  if(button.dataset.setting){const key=button.dataset.setting;profile.settings[key]=!profile.settings[key];sound.setEnabled(profile.settings.sound);persist();homeStats();openModal('settings');return;}
  switch(button.dataset.do){
    case 'resume':resume();break;
    case 'bank':finishRun(run);settle();break;
    case 'again':begin(run.mode);break;
    case 'home':goHome();break;
    case 'start':profile.tutorial=true;persist();begin();break;
    case 'daily-start':begin('daily');break;
    case 'help':openModal('help');break;
    case 'copy-score':{const summary=`I carried the light ${fmt(run.distance)} m in Cinderpath. ${fmt(run.score)} points · ${run.coins} cinders. ${run.mode==='daily'?'Daily trail '+run.day:''}`;try{await navigator.clipboard.writeText(summary);button.textContent='Copied!';}catch{button.textContent='Clipboard unavailable';}break;}
    case 'install':if(installPrompt){await installPrompt.prompt();installPrompt=null;}else{button.closest('.dialog-actions').insertAdjacentHTML('afterend','<p class="reward">On iPhone: use Share → Add to Home Screen. On Android or desktop: use your browser’s Install app option. Offline play is available after the first full load.</p>');button.disabled=true;}break;
  }
});
$('modal-content').addEventListener('change',e=>{if(e.target.id==='quality'){profile.settings.quality=e.target.value;persist();view.draw(run,profile,0);}});
function act(action){
  if(run.phase!=='running')return;
  command(run,action);sound.action(action);
}
const keyActions={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump',ArrowDown:'slide',KeyS:'slide'};
window.addEventListener('keydown',e=>{
  if(e.code==='Escape'){if(!modal.open){e.preventDefault();pause();}return;}
  if(modal.open)return;
  if(e.code==='KeyM'&&!e.repeat){e.preventDefault();toggleSound();return;}
  if(run.phase==='ready'){if(e.code==='Enter'&&e.target===document.body){e.preventDefault();begin();}return;}
  const action=keyActions[e.code];if(action){e.preventDefault();if(!e.repeat)act(action);}
});
let pointer=null;
$('world').addEventListener('pointerdown',e=>{if(run.phase!=='running')return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};$('world').setPointerCapture(e.pointerId);});
$('world').addEventListener('pointermove',e=>{
  if(!pointer||pointer.id!==e.pointerId)return;
  const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
  if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
  act(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'slide':'jump');pointer=null;
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('world').addEventListener(event,()=>pointer=null);
for(const button of document.querySelectorAll('[data-action]')){
  button.addEventListener('pointerdown',e=>{e.preventDefault();act(button.dataset.action);sound.unlock();});
  button.addEventListener('click',e=>{if(e.detail===0){act(button.dataset.action);sound.unlock();}});
}
window.addEventListener('blur',()=>{pointer=null;pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pointer=null;pause();}});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
window.addEventListener('storage',e=>{if(e.key==='cinderpath-runner-v1'){pause();profile=loadProfile();homeStats();toast('Progress updated from another tab.',3);}});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
for(const el of document.querySelectorAll('[data-icon]'))el.innerHTML=icon(el.dataset.icon);
for(const [id,name] of [['settings','gear'],['pause','pause'],['close-modal','close']])$(id).innerHTML=icon(name);
for(const button of document.querySelectorAll('[data-action]'))button.innerHTML=icon(button.dataset.action);
document.querySelector('.spark').innerHTML=icon('flame');
document.addEventListener('click',e=>{if(e.target.closest('button:not([data-action])'))sound.ui();});
homeStats();view.draw(run,profile,0);requestAnimationFrame(frame);
