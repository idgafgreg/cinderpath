import { BIOMES, CLOAKS, RULES } from './content.js';
import { biomeAt, jumpHeight } from './sim.js';
import { INK, TAU, mix, hash, shape, ellipse, courier, lantern, treeArt, fern } from './art.js';

export function createView(canvas) {
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)throw new Error('This browser could not create a canvas. Try another browser.');
  let w=1,h=1,dpr=1,quality='high',focal=600,hy=220,center=0,travel=0,clock=0;
  let current=BIOMES[0],settings={},home=false,dirty=true,particles=[],hit=0,land=0,lastAction='run',lastStep=-1;
  const trees=new Map();
  const paper=document.createElement('canvas');paper.width=192;paper.height=192;
  const pc=paper.getContext('2d');
  for(let i=0;i<4200;i++){pc.fillStyle=i%2?'#e9d8ad10':'#163f3010';pc.fillRect(hash(i)*192,hash(i+6000)*192,1,1+hash(i+1300));}
  const grain=ctx.createPattern(paper,'repeat');
  function resize(){
    dirty=true;w=canvas.clientWidth;h=canvas.clientHeight;
    dpr=Math.min(window.devicePixelRatio||1,quality==='low'?1:1.75);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    focal=Math.min(h*.94,w*1.32);hy=h*.31;
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  const project=(x,y,z)=>{const s=focal/(z+14);return {x:center+(x+Math.sin(z*.013)*Math.min(2.2,z*.017))*s,y:hy+h*.51*14/(z+14)-y*s,s};};
  function poly(points,color,stroke){
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
  }
  const face=(points,color,stroke)=>poly(points.map(p=>project(...p)),color,stroke);
  function glow(x,y,r,color,alpha=.25){
    if(r<=0)return;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,color+'00');
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();
  }
  function spriteTree(x,y,height,variant=0,palette=current.trees){
    variant=((variant%4)+4)%4;
    const key=palette.join('')+variant;
    if(!trees.has(key)){
      const sprite=document.createElement('canvas');sprite.width=220;sprite.height=424;
      treeArt(sprite.getContext('2d'),variant%4,palette);trees.set(key,sprite);
    }
    const width=height*220/420;ctx.drawImage(trees.get(key),x-width/2,y-height,width,height);
  }
  function sky(){
    const g=ctx.createLinearGradient(0,0,0,h*.7);g.addColorStop(0,current.sky[0]);g.addColorStop(.75,current.sky[1]);g.addColorStop(1,current.fog);
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    // A single off-centre crescent, with uninterrupted negative space for the title.
    const mx=w*.77,my=h*.17,mr=Math.min(w,h)*.05;
    glow(mx,my,mr*4,'#f7dfa0',.11);ellipse(ctx,mx,my,mr,mr,'#f3ddb0');
    ellipse(ctx,mx+mr*.48,my-mr*.24,mr*.89,mr*.91,current.sky[0]);
    for(let i=0;i<24;i++){
      const x=hash(i+33)*w,y=hash(i+82)*h*.32;
      ctx.globalAlpha=.2+hash(i)*.35;ctx.strokeStyle='#ede7c5';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x-2,y);ctx.lineTo(x+2,y);ctx.moveTo(x,y-2);ctx.lineTo(x,y+2);ctx.stroke();
    }ctx.globalAlpha=1;
    // Long uneven silhouettes keep the action plane separate from the backdrop.
    for(let layer=0;layer<3;layer++){
      ctx.beginPath();ctx.moveTo(0,h*.65);
      for(let i=0;i<=12;i++){
        const x=i*w/10-w*.1,y=h*(.36+layer*.075)+Math.sin(i*1.8+layer)*h*.035;
        ctx.quadraticCurveTo(x-w/20,y-h*.09,x,y);
      }
      ctx.lineTo(w,h*.75);ctx.closePath();ctx.fillStyle=mix(current.sky[1],current.ground,.28+layer*.21);ctx.fill();
    }
    // The distant lamplighter tower is a landmark, separate from collision geometry.
    const tx=w*.25,ty=h*.43,ts=Math.min(w,h)/700;
    ctx.save();ctx.translate(tx,ty);ctx.scale(ts,ts);ctx.globalAlpha=.55;
    shape(ctx,'M-20 30 L-17 -55 L-24 -55 L0 -83 L26 -53 L18 -53 L22 30 Z',mix(current.sky[1],current.ground,.62),null);
    shape(ctx,'M-5 -46 L5 -46 L5 -30 L-5 -30 Z',current.accent,null);ctx.restore();
    ctx.fillStyle=current.ground;ctx.fillRect(0,h*.57,w,h*.5);
  }
  function cottage(x,y,size){
    ctx.save();ctx.translate(x,y);ctx.scale(size,size);
    shape(ctx,'M-64 6 L-62 -108 L44 -130 L67 -104 L64 6 Z','#586457');
    shape(ctx,'M-74 -96 L-54 -146 L-20 -185 Q10 -162 29 -160 L77 -114 L69 -100 Q29 -125 -14 -116 Z','#394e46',INK,3);
    shape(ctx,'M-59 -137 Q-5 -158 47 -125 M-42 -156 L-23 -178',null,'#7c896a',3);
    shape(ctx,'M37 -151 L36 -187 L53 -188 L55 -141 Z','#687665');
    shape(ctx,'M-18 5 L-18 -54 Q0 -76 18 -54 L18 6 Z','#273d37');
    shape(ctx,'M-11 -48 Q0 -62 10 -48 L10 -28 L-11 -28 Z','#e6bd76');
    shape(ctx,'M-49 -77 Q-39 -91 -29 -77 L-29 -54 L-49 -54 Z','#f0cb81');
    shape(ctx,'M-39 -83 L-39 -55 M-48 -67 L-30 -67 M-2 -55 L-2 -29',null,'#8b774b',2);
    shape(ctx,'M-57 3 L62 3 L71 13 L-65 13 Z','#888a6d');
    for(let i=0;i<4;i++){ctx.globalAlpha=.12-i*.02;ellipse(ctx,45+Math.sin(clock+i)*8,-204-i*18,11+i*4,7+i*3,'#d2d3b1');}ctx.restore();
  }
  function camp(s,profile){
    // The camp is a composed place. Nothing scrolls while the player is choosing a trail.
    const ground=h*.72;
    ctx.fillStyle='#344d42';ctx.beginPath();ctx.ellipse(w*.51,h*.83,w*.49,h*.29,0,0,TAU);ctx.fill();
    ctx.beginPath();
    for(let i=0;i<=40;i++){const a=i/40*TAU,r=1+Math.sin(i*1.6)*.028;const x=w*.5+Math.cos(a)*w*.23*r,y=ground+22+Math.sin(a)*h*.12*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.closePath();ctx.fillStyle='#72805b';ctx.fill();
    for(let i=0;i<24;i++){const x=w*(.3+hash(i+50)*.4),y=ground+h*(hash(i+32)*.16-.07);ctx.strokeStyle='#bbc09533';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+4+hash(i)*10,y-2);ctx.stroke();}
    const cs=Math.min(w/950,h/720);
    cottage(w*.76,h*.65,cs*.8);
    for(let i=0;i<11;i++){
      const side=i%2?1:-1,x=w*.5+side*w*(.24+hash(i+7)*.3),y=h*(.56+hash(i)*.21);
      spriteTree(x,y,h*(.35+hash(i+33)*.45),i,current.trees);
    }
    // Worn stepping stones lead the eye from camp to the far trail.
    for(let i=0;i<8;i++){
      const q=i/8,x=w*.5+Math.sin(i*.85)*w*.016,y=h*.48+q*h*.4;
      ellipse(ctx,x,y,6+q*w*.043,2+q*11,i%2?'#93957a':'#a4a185','#596751');
      if(i>3){ctx.strokeStyle='#c1b998';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-8,y-2);ctx.lineTo(x+5,y-4);ctx.stroke();}
    }
    // Lantern cord and timber post, with small signs of a place someone inhabits.
    if(w>620){
      ctx.save();ctx.translate(w*.27,ground);ctx.scale(cs,cs);
      shape(ctx,'M-5 0 L-8 -155 L1 -158 L8 0 Z','#635f40');
      shape(ctx,'M-20 -150 L-22 -173 L66 -170 L83 -160 L65 -147 Z','#af8f59');
      shape(ctx,'M-16 -162 L63 -157 M-12 -154 L24 -153',null,'#786844',1.5);
      ctx.fillStyle='#334b3c';ctx.font='15px Bree';ctx.textAlign='center';ctx.fillText('EMBERWOOD',25,-154);
      lantern(ctx,-15,-98,.7,clock,100);ctx.restore();
    }
    const px=w*.5,py=h*(w<620?.64:.68),scale=Math.min(h*(w<620?.26:.32)/204,w*.49/170);
    glow(px+scale*54,py-scale*66,scale*140,'#e8be6e',.2);
    ellipse(ctx,px,py+5,scale*62,scale*14,'#344a3b70');
    const cloak=CLOAKS.find(c=>c.id===profile.selected)||CLOAKS[0];
    ctx.save();ctx.translate(px,py);ctx.scale(scale,scale);courier(ctx,{time:clock,color:cloak.color,trim:cloak.trim});ctx.restore();
    // Illustrated foliage frames the camp, leaving controls and the courier uncovered.
    for(let i=0;i<16;i++){
      const side=i%2?1:-1,x=w*.5+side*w*(.30+hash(i+11)*.22),y=h*(.77+hash(i+80)*.2);
      fern(ctx,x,y,.65+hash(i)*1.1,i%3?'#668062':'#a2a46b');
      if(i%4===0){ctx.fillStyle='#d5c69c';ctx.fillRect(x+9,y-14,3,14);ellipse(ctx,x+10,y-14,9,4,'#af6448');ellipse(ctx,x+8,y-16,2,1,'#e8c795');}
    }
    // Foreground boughs frame rather than fill the title area.
    for(const side of [-1,1]){
      ctx.save();ctx.translate(side<0?0:w,0);ctx.scale(side<0?1:-1,1);
      shape(ctx,`M0 0 L${w*.16} 0 Q${w*.13} 30 ${w*.035} ${h*.2} Q${w*.065} ${h*.55} ${w*.025} ${h} L0 ${h} Z`,'#203d36',null);
      shape(ctx,`M${w*.02} ${h*.22} Q${w*.15} ${h*.08} ${w*.26} ${h*.035} Q${w*.14} ${h*.11} ${w*.045} ${h*.29} Z`,'#203d36',null);
      ctx.restore();
    }
  }
  function road(){
    for(let z=192-travel%8;z>-9;z-=8){
      const z0=Math.max(-9,z-8),n=Math.floor((travel+z)/8);
      face([[-3.7,0,z0],[3.7,0,z0],[3.7,0,z],[-3.7,0,z]],current.road[0]);
      for(const side of [-1,1])face([[side*3.6,.02,z0],[side*(3.9+hash(n)*.3),.02,z0],[side*3.8,.02,z],[side*3.6,.02,z]],current.edge);
      // Three shallow wheel ruts imply lanes, without turning the forest into a highway.
      for(const lane of [-1,0,1]){
        const x=lane*2.25+(.5-hash(n+lane))*.45;
        face([[x-.7,.03,z0+.4],[x+.6,.03,z0+.6],[x+.8,.03,z-1],[x-.6,.03,z-.5]],mix(current.road[0],current.road[1],.16));
        if(hash(n+lane*113)>.42)face([[x-.38,.04,z0+2],[x+.25,.04,z0+2.1],[x+.46,.04,z0+3.5],[x-.43,.04,z0+3.8],[x-.56,.04,z0+3]],current.road[1]);
      }
    }
  }
  function tree(x,z,n){const p=project(x,0,z);ctx.save();ctx.globalAlpha=Math.min(1,Math.max(.15,(180-z)/80));spriteTree(p.x,p.y,p.s*(6+hash(n)*5),n);ctx.restore();}
  function verge(x,z,n){
    const p=project(x,0,z),u=p.s/30;ctx.save();ctx.translate(p.x,p.y);ctx.scale(u,u);
    ellipse(ctx,0,2,34,8,'#243e3355');
    if(n%3===0){shape(ctx,'M-28 0L-25 -18L-7 -27L17 -22L28 -9L22 4Z','#657a5b',null);shape(ctx,'M-25 -18L-7 -27L17 -22L4 -7Z','#8e9670',null);}
    for(let i=0;i<4;i++)fern(ctx,(i-1.5)*15,0,.52+hash(i+n)*.3,i%2?'#6d8858':'#90a167');
    if(n%4===0){ctx.fillStyle='#d6c9a1';ctx.fillRect(25,-15,3,17);ellipse(ctx,26,-15,11,5,'#b46f47');ellipse(ctx,24,-17,2,1,'#edd2a0');}
    ctx.restore();
  }
  function trailLantern(x,z){
    const p=project(x,0,z);ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.s/32,p.s/32);
    shape(ctx,'M-4 0 L-5 -99 L3 -113 L9 -110 L3 0 Z','#626649');
    shape(ctx,'M-2 -103 Q21 -121 28 -99',null,'#868256',4);lantern(ctx,26,-77,.6,clock);ctx.restore();
  }
  function gate(z){
    const p=project(0,0,z);ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.s,p.s);
    shape(ctx,'M-4 0 L-4.3 -4 Q-4.4 -6 -2.4 -6.7 Q0 -7.7 2.7 -6.8 Q4.1 -6.3 4.1 -4 L4 0 L3.3 0 L3.4 -4.5 Q3 -6 0 -6 Q-3 -6 -3.5 -4.5 L-3.3 0 Z',current.edge,INK,.06);
    shape(ctx,'M-4 -4.9 L-3.5 -4.8 M-3.9 -3.3 L-3.4 -3.2 M3.5 -4.6 L4 -4.8 M-1.9 -6.8 L-1.7 -6.1 M1.7 -6.2 L2 -6.8',null,INK,.04);
    shape(ctx,'M-4.2 -3 Q-4.7 -6 -2 -6.9 M3.7 -4 Q4.3 -6.6 2 -6.7',null,current.trees[2],.18);
    ctx.restore();
  }
  function obstacle(e){
    const z=e.z-travel,p=project(e.lane*2.25,0,z),u=p.s;
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(u/40,u/40);
    if(e.type==='cinder'){
      ctx.translate(0,-26-Math.sin(clock*4+e.z)*2);ellipse(ctx,0,23,6,2,'#36493655');
      shape(ctx,'M0 -13 Q-13 -2 -9 7 Q-5 15 4 10 Q14 5 5 -6 L3 0 Q4 -8 0 -13 Z','#f4bf61','#9e6537',1.5);
      shape(ctx,'M0 -4 Q-6 6 0 8 Q7 7 3 0 L1 4 Z','#fff0bc',null);
    }else if(e.type==='oil'){
      ctx.translate(0,-29-Math.sin(clock*3)*2);
      shape(ctx,'M-8 -17 L8 -17 L8 -9 Q22 -3 18 13 Q0 22 -18 13 Q-22 -3 -8 -9 Z','#7fb889',INK,2.5);
      shape(ctx,'M-9 -23 L9 -23 L9 -16 L-9 -16 Z','#ac824d');
      shape(ctx,'M-8 -4 Q-13 6 -8 10',null,'#d3edb0',3);shape(ctx,'M-4 0L4 0L4 5L9 5L9 11L4 11L4 16L-4 16L-4 11L-9 11L-9 5L-4 5Z','#e8efbc',null);
    }else if(e.type==='magnet'){
      ctx.translate(0,-29);shape(ctx,'M-18 -15 L-6 -15 L-6 3 Q0 15 7 3 L7 -15 L19 -15 L19 7 Q0 35 -18 7 Z','#a58dc4',INK,2.5);
      shape(ctx,'M-18 -15 L-6 -15 L-6 -5 L-18 -5 Z','#e5d6e3');shape(ctx,'M7 -15 L19 -15 L19 -5 L7 -5 Z','#e5d6e3');
    }else if(e.type==='shield'){
      ctx.translate(0,-30);shape(ctx,'M0 -23 L21 -14 L16 12 L0 25 L-17 12 L-22 -14 Z','#80b5bd',INK,2.5);
      shape(ctx,'M0 -15 L13 -9 L10 8 L0 16 L-10 8 L-14 -9 Z',null,'#d6e4cb',2);shape(ctx,'M0 -9 L0 10 M-5 0L5 0',null,'#e5eccf',2);
    }else if(e.type==='rock'){
      shape(ctx,'M-38 0 L-39 -32 L-23 -61 L2 -74 L30 -55 L37 -25 L33 1 Z','#7d897a',INK,2);
      shape(ctx,'M2 -74 L30 -55 L37 -25 L33 1 L7 -5 L10 -37 Z','#586f65',null);
      shape(ctx,'M-23 -61 L2 -74 L10 -37 L-20 -38 L-39 -32 Z','#a4a98b',null);
      shape(ctx,'M-29 -16 L-11 -29 L-17 -40 M18 -43L27 -32',null,'#425e54',2);
      shape(ctx,'M-38 -6 Q-20 -16 -4 -7 L3 1 L-39 3 Z',current.trees[2],null);
    }else if(e.type==='root'){
      shape(ctx,'M-39 -2 Q-48 -10 -38 -27 L33 -29 Q47 -16 37 -2 Z','#9b6b42',INK,2.3);
      ellipse(ctx,-37,-15,10,14,'#d0ae74',INK);ellipse(ctx,-37,-15,5,8,'#b78b57');
      shape(ctx,'M-19 -21 L24 -24 M-23 -13 Q1 -17 31 -12 M-12 -7 L24 -8 M0 -28 L-3 -39 L3 -42 L10 -29',null,'#624f37',2);
      shape(ctx,'M-24 -29 Q-12 -35 -3 -27 L6 -27 Q16 -36 26 -29',null,current.trees[2],4);
    }else{
      shape(ctx,'M-36 0 L-39 -108 L-30 -110 L-27 0 M29 0L28 -107L37 -110L39 0','#68725a',INK,2);
      shape(ctx,'M-43 -96 Q0 -110 44 -98 L42 -85 Q0 -91 -43 -82 Z','#8e8159');
      shape(ctx,'M-31 -87 L31 -90 L32 -47 L21 -52 L10 -45 L0 -50 L-10 -45 L-20 -50 L-30 -45 Z','#69969c',INK,2);
      shape(ctx,'M-22 -80 L-21 -59 M23 -82 L23 -60 M-8 -70 L0 -60 L8 -70',null,'#d6dfc8',2.2);
    }
    ctx.restore();
  }
  function runner(s,profile,dt){
    const p=project(s.lane*2.25,0,0),scale=Math.min(h*.19/204,w*.25/136),jump=jumpHeight(s)*p.s*1.45;
    const cloak=CLOAKS.find(c=>c.id===profile.selected)||CLOAKS[0];
    const phase=s.distance/6, step=Math.floor(phase*2);
    if(lastAction==='jump'&&s.action==='run')land=1;
    land=Math.max(0,land-dt*5);lastAction=s.action;
    if(s.phase==='running'&&s.action==='run'&&step!==lastStep&&settings.motion!==false){
      particles.push({x:p.x+(step%2?1:-1)*scale*14,y:p.y,life:.3,total:.3,vx:0,vy:10,size:9,color:'#c9b889',dust:true});
    }lastStep=step;
    ellipse(ctx,p.x,p.y+4,scale*(jump?42:58),scale*10,'#243c3955');
    glow(p.x+scale*55,p.y-jump-scale*58,scale*115,'#f1c677',.12+s.fuel/700);
    ctx.save();ctx.translate(p.x,p.y-jump);ctx.scale(scale,scale);
    if(s.invincible>0&&settings.motion!==false&&Math.floor(clock*12)%2)ctx.globalAlpha=.5;
    courier(ctx,{time:clock,phase,run:s.phase!=='ready',back:true,action:s.action,actionTime:s.actionTime,color:cloak.color,trim:cloak.trim,lean:s.targetLane-s.lane,land,fuel:s.fuel});ctx.restore();
    if(s.shield||s.fever>0){ctx.strokeStyle=s.fever>0?'#ffdf97':'#bfdfdf';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y-jump-scale*86,scale*71,scale*112,0,Math.PI*.15,Math.PI*1.85);ctx.stroke();}
  }
  return {
    get needsDraw(){return dirty;},
    draw(s,profile,dt=.016){
      settings=profile.settings;home=s.phase==='ready';
      if(quality!==settings.quality){quality=settings.quality;resize();}
      ctx.setTransform(dpr,0,0,dpr,0,0);clock+=settings.motion!==false?dt:0;travel=s.distance;center=w*.5;
      const biome=home?BIOMES[0]:biomeAt(s.distance),t=Math.min(1,s.distance%600/100),prev=BIOMES[(Math.floor(s.distance/600)+2)%3];
      current=s.distance>600&&!home?{...biome,sky:biome.sky.map((c,i)=>mix(prev.sky[i],c,t)),ground:mix(prev.ground,biome.ground,t),fog:mix(prev.fog,biome.fog,t)}:biome;
      sky();
      if(home)camp(s,profile);
      else{
        road();const objects=[],chunk=Math.floor(travel/14);
        for(let i=chunk;i<chunk+14;i++){
          const z=i*14-travel;if(z<1)continue;
          for(const side of [-1,1]){
            objects.push({z,draw:()=>tree(side*(5.6+hash(i+side)*5),z,i+side*300)});
            if(quality==='high')objects.push({z:z+5,draw:()=>tree(side*(11+hash(i)*9),z+5,i+side*600)});
            if(i%3===0)objects.push({z:z+2,draw:()=>trailLantern(side*4.1,z+2)});
            if(z<90){objects.push({z:z+1,draw:()=>verge(side*(4.25+hash(i)*.3),z+1,i)});objects.push({z:z+6,draw:()=>verge(side*(7+hash(i)*3),z+6,i+7)});}
          }
        }
        const gz=Math.ceil((travel+15)/300)*300-travel;if(gz<185)objects.push({z:gz,draw:()=>gate(gz)});
        for(const e of s.entities)if(!e.done&&e.z-travel>-2&&e.z-travel<180)objects.push({z:e.z-travel,draw:()=>obstacle(e)});
        objects.sort((a,b)=>b.z-a.z);objects.forEach(o=>o.draw());
        const mist=ctx.createLinearGradient(0,hy-10,0,hy+h*.16);mist.addColorStop(0,current.fog+'00');mist.addColorStop(.2,current.fog+'90');mist.addColorStop(1,current.fog+'00');ctx.fillStyle=mist;ctx.fillRect(0,hy-10,w,h*.18);
        runner(s,profile,dt);
      }
      if(quality==='high'&&settings.motion!==false)for(let i=0;i<18;i++){
        const x=(hash(i+55)*w+Math.sin(clock*.6+i)*18+w)%w,y=(hash(i+200)*h-clock*(3+hash(i)*5)+h*100)%h;
        ctx.globalAlpha=.3+Math.sin(clock*2+i)*.2;ellipse(ctx,x,y,1.5,1.5,'#f4d283');
      }ctx.globalAlpha=1;
      for(const p of particles){
        p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
        ctx.globalAlpha=Math.max(0,p.life/p.total);ellipse(ctx,p.x,p.y,p.size*(p.dust?1.5-p.life/p.total:1),p.dust?p.size*.3:p.size,p.color);
      }particles=particles.filter(p=>p.life>0);ctx.globalAlpha=1;
      if(hit>0){hit=Math.max(0,hit-dt*2);ctx.fillStyle=`rgba(184,67,38,${hit*.13})`;ctx.fillRect(0,0,w,h);}
      if(quality==='high'){ctx.fillStyle=grain;ctx.fillRect(0,0,w,h);}
      dirty=false;
    },
    events(events,s){
      for(const e of events){
        if(e.type==='hit')hit=settings.motion===false?0:1;
        if(!['cinder','oil','clear','fever','shatter','blocked'].includes(e.type)||settings.motion===false)continue;
        const p=project((e.lane??s.lane)*2.25,.8,0);
        for(let i=0;i<(e.type==='fever'?20:5)&&particles.length<120;i++)particles.push({x:p.x,y:p.y,vx:(hash(i+s.time)-.5)*130,vy:-hash(i+7+s.time)*120,life:.5,total:.5,size:1.5+hash(i)*2,color:e.type==='oil'?'#c2dfa4':'#ffe3a0'});
      }
    },
    dispose(){observer.disconnect();particles=[];trees.clear();},
  };
}
