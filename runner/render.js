import { BIOMES, CLOAKS, RULES } from './content.js';
import { biomeAt, jumpHeight } from './sim.js';
const TAU=Math.PI*2;
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const blend=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
export function createView(canvas) {
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx) throw new Error('This browser could not create a canvas. Try another browser.');
  let w=1,h=1,dpr=1,quality='high',focal=600,hy=220,center=0,travel=0,clock=0,current=BIOMES[0];
  let particles=[],hit=0,settings={},home=false,dirty=true;
  function resize() {
    dirty=true;
    w=canvas.clientWidth;h=canvas.clientHeight;
    dpr=Math.min(window.devicePixelRatio||1,quality==='low'?1:1.75);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    focal=Math.min(h*.88,w*1.16);hy=h*(w<600?.32:.36);
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  function curve(z) { return settings.motion===false?0:Math.sin(travel*.0009+z*.007)*Math.min(4.5,z*.027); }
  function project(x,y,z) {
    const scale=focal/(z+14);
    return {x:center+(x+curve(z))*scale,y:hy+(h*.51*14)/(z+14)-y*scale,s:scale};
  }
  function poly(points,color,stroke) {
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.65;ctx.stroke();}
  }
  const face=(points,color)=>poly(points.map(p=>project(...p)),color);
  function glow(x,y,r,color,alpha=.35) {
    if(r<=0)return;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,color+'00');
    ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.globalAlpha=1;
  }
  function box(x,y,z,sx,sy,sz,color) {
    const x0=x-sx/2,x1=x+sx/2,z0=z-sz/2,z1=z+sz/2,y1=y+sy;
    face([[x0,y,z0],[x1,y,z0],[x1,y1,z0],[x0,y1,z0]],color);
    face([[x1,y,z0],[x1,y,z1],[x1,y1,z1],[x1,y1,z0]],blend(color,'#061a20',.28));
    face([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],blend(color,'#eee0ad',.2));
  }
  function tree(x,z,n) {
    const height=4+hash(n)*5, radius=1.3+hash(n+1)*1.3;
    box(x,0,z,.22,height*.62,.22,blend(current.ground,'#a28566',.25));
    for(let tier=0;tier<3;tier++) {
      const bottom=height*(.14+tier*.21),top=height*(.65+tier*.17),r=radius*(1-tier*.24);
      face([[x-r,bottom,z],[x,top,z],[x+.04,bottom,z-.12]],current.trees[1]);
      face([[x,top,z],[x+r,bottom,z],[x+.04,bottom,z-.12]],current.trees[0]);
      face([[x-r,bottom,z],[x,top,z],[x-r*.12,bottom+.1,z]],current.trees[2]+'bb');
    }
  }
  function lantern(x,z) {
    box(x,0,z,.12,2.6,.12,'#6b7261');
    box(x,2.35,z,.48,.12,.42,'#b79565');
    box(x,2.48,z,.34,.57,.28,'#f8c477');
    box(x,3.04,z,.5,.12,.42,'#576b62');
    const p=project(x,2.72,z);glow(p.x,p.y,p.s*1.55,'#ffb352',.42);
    const g=project(x,0,z);glow(g.x,g.y,p.s*2.2,'#edab5c',.12);
  }
  function gate(z) {
    for(const x of [-4.2,4.2]) {
      box(x,0,z,1.05,5.6,1.2,blend(current.road[0],'#a5bba2',.25));
      box(x,5.35,z,1.4,.35,1.6,current.edge);
      const p=project(x,4.4,z);glow(p.x,p.y,p.s*1.6,current.accent,.2);
      face([[x-.11,3.6,z-.62],[x+.11,3.6,z-.62],[x+.11,4.6,z-.62],[x-.11,4.6,z-.62]],current.accent);
    }
    box(0,5.6,z,9.8,.55,1.2,current.edge);
    box(0,6.15,z,7.5,.22,1.1,blend(current.edge,'#efdcac',.18));
    face([[-1,6.36,z],[0,7.5,z],[1,6.36,z]],current.edge);
  }
  function crystal(x,z,color,large=false) {
    const bob=Math.sin(clock*3+z)*.07, y=large?1:.65,r=large?.4:.18;
    face([[x,y+r*1.8+bob,z],[x-r,y+bob,z],[x,y-r*1.5+bob,z]],color);
    face([[x,y+r*1.8+bob,z],[x+r,y+bob,z],[x,y-r*1.5+bob,z]],blend(color,'#ffffff',.42));
    const p=project(x,y,z);if(quality==='high')glow(p.x,p.y,p.s*(large?1.2:.65),color,.34);
  }
  function obstacle(e) {
    const z=e.z-travel,x=e.lane*2.25;
    if(e.type==='cinder'){crystal(x,z,'#ffc878');return;}
    if(['oil','magnet','shield'].includes(e.type)) {
      const color={oil:'#9fdfac',magnet:'#d5b3ff',shield:'#9adcec'}[e.type];
      crystal(x,z,color,true);
      const p=project(x,1.95,z);ctx.font=`600 ${Math.max(8,p.s*.27)}px system-ui`;ctx.textAlign='center';ctx.fillStyle=color;
      if(z<58)ctx.fillText({oil:'OIL',magnet:'MAGNET',shield:'WARD'}[e.type],p.x,p.y);return;
    }
    if(e.type==='rock') {
      const points=[[-.82,0,-.6],[.83,0,-.6],[.73,1.18,-.22],[.17,1.8,.02],[-.6,1.3,-.26]];
      face(points.map(([a,b,c])=>[x+a,b,z+c]),'#677471');
      face([[x+.17,1.8,z+.02],[x+.73,1.18,z-.22],[x+.83,0,z-.6],[x+1,0,z+.5],[x+.56,1.26,z+.4]],'#3c5152');
      face([[x-.6,1.3,z-.26],[x+.17,1.8,z+.02],[x+.56,1.26,z+.4],[x-.65,1.05,z+.45]],'#869180');
      const p=project(x,.8,z-.62);ctx.fillStyle='#f4b878';ctx.font=`700 ${p.s*.42}px system-ui`;ctx.textAlign='center';ctx.fillText('×',p.x,p.y);
    } else if(e.type==='root') {
      box(x,0,z,1.9,.62,.75,'#a77953');box(x,0,z-.4,1.92,.15,.08,'#ffd292');
      const p=project(x,.95,z);ctx.fillStyle='#ffdfa7';ctx.font=`700 ${p.s*.42}px system-ui`;ctx.textAlign='center';ctx.fillText('↑',p.x,p.y);
    } else {
      box(x-.87,0,z,.2,2.5,.3,'#697f7c');box(x+.87,0,z,.2,2.5,.3,'#697f7c');
      box(x,1.15,z,1.96,1.1,.5,'#668b8e');
      face([[x-.85,1.15,z-.26],[x-.65,1.4,z-.26],[x-.46,1.15,z-.26]],'#b0d5d6');
      face([[x+.85,1.15,z-.26],[x+.65,1.4,z-.26],[x+.46,1.15,z-.26]],'#b0d5d6');
      const p=project(x,1.6,z-.27);ctx.fillStyle='#e3ffff';ctx.font=`700 ${p.s*.4}px system-ui`;ctx.textAlign='center';ctx.fillText('↓',p.x,p.y);
    }
  }
  function sky() {
    const g=ctx.createLinearGradient(0,0,0,h*.7);g.addColorStop(0,current.sky[0]);g.addColorStop(.8,current.sky[1]);g.addColorStop(1,current.fog);
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    const moonX=center+w*.13,moonY=h*.19,moonR=Math.min(w,h)*.047;
    glow(moonX,moonY,moonR*4.5,'#e1e5c9',.11);
    ctx.fillStyle='#d4ddc3';ctx.beginPath();ctx.arc(moonX,moonY,moonR,0,TAU);ctx.fill();
    ctx.fillStyle='#a9bbaa33';ctx.beginPath();ctx.arc(moonX+moonR*.3,moonY-moonR*.25,moonR*.4,0,TAU);ctx.fill();
    if(quality==='high')for(let i=0;i<45;i++) {
      ctx.globalAlpha=.15+hash(i+77)*.4;ctx.fillStyle='#ebf2e4';ctx.fillRect(hash(i+2)*w,hash(i+82)*hy*.7,1.3,1.3);
    }
    ctx.globalAlpha=1;
    for(let layer=0;layer<3;layer++) {
      const pts=[{x:0,y:h*.62}];
      for(let i=0;i<=14;i++)pts.push({x:i*w/14,y:h*(.26+layer*.052)+hash(i+layer*55)*h*.14});
      pts.push({x:w,y:h*.62});poly(pts,blend(current.sky[1],current.ground,.2+layer*.2));
    }
    ctx.fillStyle=current.ground;ctx.fillRect(0,hy+h*.12,w,h);
  }
  function road() {
    const offset=travel%6;
    for(let z=192-offset;z>-9;z-=6) {
      const z0=Math.max(-9,z-6),n=Math.floor((travel+z)/6);
      face([[-4.15,0,z0],[4.15,0,z0],[4.15,0,z],[-4.15,0,z]],n%2?current.road[0]:current.road[1]);
      for(const side of [-1,1]) {
        face([[side*3.55,.035,z0],[side*3.78,.035,z0],[side*3.78,.035,z],[side*3.55,.035,z]],current.edge);
        if(n%3===0)face([[side*3.61,.05,z0+1],[side*3.7,.05,z0+1],[side*3.7,.05,z0+3],[side*3.61,.05,z0+3]],'#deb574');
      }
      for(const x of [-1.125,1.125])face([[x-.013,.022,z0],[x+.013,.022,z0],[x+.013,.022,z],[x-.013,.022,z]],blend(current.road[0],current.edge,.35));
      if(n%2===0) {
        const x=(hash(n)-.5)*5;
        face([[x,0.025,z],[x+.8,0.025,z-.1],[x+.95,0.025,z-.17],[x+.2,0.025,z-.08]],blend(current.road[0],'#142225',.25));
      }
    }
  }
  function runner(s,cloak) {
    const p=project(s.lane*2.25,0,home&&w<600?7:0),scale=p.s*(home&&w<600?1.25:1),jump=jumpHeight(s)*scale,slide=s.action==='slide';
    const running=s.phase==='running'&&settings.motion!==false;
    const stride=running?Math.sin(s.time*15):Math.sin(clock*2)*.08;
    const lean=(s.targetLane-s.lane)*.14;
    glow(p.x+scale*.55,p.y-scale*.8,scale*3.4,cloak.trim,.16);
    ctx.fillStyle='#091c2580';ctx.beginPath();ctx.ellipse(p.x,p.y+3,scale*.66,scale*.2,0,0,TAU);ctx.fill();
    ctx.save();ctx.translate(p.x,p.y-jump);ctx.scale(scale,scale);ctx.rotate(lean);
    if(s.invincible>0&&Math.floor(clock*14)%2===0)ctx.globalAlpha=.55;
    if(slide){ctx.translate(0,.04);ctx.scale(1.25,.48);}
    const bob=running?Math.abs(stride)*.06:0;
    ctx.translate(0,-bob);
    ctx.strokeStyle='#182c32';ctx.lineCap='round';ctx.lineWidth=.23;
    for(const side of [-1,1]){
      ctx.beginPath();ctx.moveTo(side*.18,-.85);ctx.lineTo(side*.23,-.4);ctx.lineTo(side*.25+stride*side*.16,-.06-Math.max(0,stride*side)*.16);ctx.stroke();
    }
    const flutter=running?Math.sin(clock*13)*.08:Math.sin(clock*2)*.035;
    const shape=[[-.27,-1.8],[.27,-1.8],[.53+flutter,-.57],[.17,-.68],[-.08,-.51],[-.56+flutter,-.61]];
    poly(shape.map(([x,y])=>({x,y})),cloak.color);
    poly([{x:0,y:-1.73},{x:.27,y:-1.8},{x:.53+flutter,y:-.57},{x:.17,y:-.68}],blend(cloak.color,'#142d32',.24));
    ctx.strokeStyle=cloak.trim;ctx.lineWidth=.035;ctx.beginPath();ctx.moveTo(-.5+flutter,-.62);ctx.lineTo(-.08,-.52);ctx.lineTo(.17,-.69);ctx.lineTo(.5+flutter,-.59);ctx.stroke();
    poly([{x:-.34,y:-1.72},{x:-.28,y:-2.16},{x:0,y:-2.33},{x:.3,y:-2.16},{x:.35,y:-1.72}],blend(cloak.color,'#fee0ab',.12));
    poly([{x:0,y:-2.33},{x:.3,y:-2.16},{x:.35,y:-1.72},{x:0,y:-1.8}],blend(cloak.color,'#142d32',.12));
    ctx.strokeStyle=cloak.trim;ctx.lineWidth=.045;ctx.beginPath();ctx.moveTo(-.27,-1.68);ctx.lineTo(.25,-1.68);ctx.stroke();
    ctx.strokeStyle=blend(cloak.color,'#132b32',.16);ctx.lineWidth=.18;ctx.beginPath();ctx.moveTo(.26,-1.61);ctx.lineTo(.52,-1.15);ctx.lineTo(.73,-1.2);ctx.stroke();
    // The lantern swings with the runner, but only simulation events grant fuel.
    const lx=.81+stride*.06,ly=-.99;
    ctx.strokeStyle='#ecc18b';ctx.lineWidth=.025;ctx.beginPath();ctx.arc(lx,ly-.23,.085,Math.PI,0);ctx.stroke();
    ctx.fillStyle='#302f29';ctx.fillRect(lx-.15,ly-.2,.3,.42);
    ctx.fillStyle=cloak.trim;ctx.fillRect(lx-.1,ly-.14,.2,.29);
    ctx.fillStyle='#fff1b8';ctx.fillRect(lx-.026,ly-.1,.052,.2);
    ctx.fillStyle='#f5d9a5';ctx.fillRect(lx-.18,ly-.23,.36,.06);ctx.fillRect(lx-.17,ly+.21,.34,.04);
    ctx.restore();
    const lp={x:p.x+scale*.81,y:p.y-jump-scale};glow(lp.x,lp.y,scale*1.2,cloak.trim,.4);
    if(s.shield||s.fever>0){ctx.strokeStyle=s.fever>0?'#ffcc85aa':'#a6e5ef99';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y-scale*1.1-jump,scale*.85,scale*1.4,0,0,TAU);ctx.stroke();}
  }
  return {
    get needsDraw(){return dirty;},
    draw(s,profile,dt=.016) {
      settings=profile.settings;home=s.phase==='ready';
      if(quality!==settings.quality){quality=settings.quality;resize();}
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const animate=settings.motion!==false;clock+=animate?dt:0;
      travel=home?44+(animate?clock*3:0):s.distance;
      center=w*(home&&w>800?.68:.5);
      const biome=home?BIOMES[0]:biomeAt(s.distance);
      const transition=Math.min(1,(s.distance%600)/100);
      const prev=BIOMES[(Math.floor(s.distance/600)+BIOMES.length-1)%BIOMES.length];
      current=s.distance>600&&!home?{...biome,sky:biome.sky.map((c,i)=>blend(prev.sky[i],c,transition)),ground:blend(prev.ground,biome.ground,transition),fog:blend(prev.fog,biome.fog,transition)}:biome;
      sky();road();
      // Painter's order, bounded scenery and entity count; no growing geometry cache.
      const objects=[];
      const chunk=Math.floor(travel/12);
      for(let i=chunk;i<chunk+17;i++) {
        const z=i*12-travel;
        if(z<0)continue;
        for(const side of [-1,1]){
          objects.push({z,draw:()=>tree(side*(5+hash(i+side)*5),z,i+side*300)});
          if(quality==='high')objects.push({z:z+4,draw:()=>tree(side*(10+hash(i)*12),z+4,i+side*600)});
        }
        if(i%3===0)for(const side of [-1,1])objects.push({z,draw:()=>lantern(side*4.05,z)});
        if(current.id==='ruins'&&i%3===1)objects.push({z,draw:()=>box((i%2?1:-1)*6,0,z,1.4,3+hash(i)*3,1.4,current.edge)});
      }
      const gateZ=home?48:Math.ceil((travel+15)/300)*300-travel;
      if(gateZ<190)objects.push({z:gateZ,draw:()=>gate(gateZ)});
      const shown=home?Array.from({length:17},(_,i)=>({type:'cinder',lane:0,z:travel+10+i*5,done:false})):s.entities;
      for(const e of shown)if(!e.done&&e.z-travel>-2&&e.z-travel<180)objects.push({z:e.z-travel,draw:()=>obstacle(e)});
      objects.push({z:0,draw:()=>runner(s,CLOAKS.find(c=>c.id===profile.selected)||CLOAKS[0])});
      objects.sort((a,b)=>b.z-a.z);objects.forEach(o=>o.draw());
      const mist=ctx.createLinearGradient(0,hy-20,0,hy+h*.16);mist.addColorStop(0,current.fog+'00');mist.addColorStop(.35,current.fog+'55');mist.addColorStop(1,current.fog+'00');ctx.fillStyle=mist;ctx.fillRect(0,hy-20,w,h*.2);
      if(quality==='high'&&animate)for(let i=0;i<35;i++) {
        const x=(hash(i+55)*w+Math.sin(clock*.25+i)*35+w)%w,y=(hash(i+200)*h-clock*(6+hash(i)*12)+h*100)%h;
        ctx.fillStyle=i%3?'#ffc47480':'#d3e4db55';ctx.fillRect(x,y,i%3?2:1.3,i%3?2:1.3);
      }
      for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=40*dt;ctx.globalAlpha=Math.max(0,p.life/.65);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}
      particles=particles.filter(p=>p.life>0);ctx.globalAlpha=1;
      if(hit>0){hit=Math.max(0,hit-dt*1.7);ctx.fillStyle=`rgba(255,98,65,${hit*.14})`;ctx.fillRect(0,0,w,h);}
      const vignette=ctx.createRadialGradient(w*.5,h*.48,h*.2,w*.5,h*.48,Math.max(w,h)*.75);vignette.addColorStop(0,'#06192100');vignette.addColorStop(1,'#031016a0');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
      dirty=false;
    },
    events(events,s) {
      for(const e of events){
        if(e.type==='hit')hit=settings.motion===false?0:1;
        if(!['cinder','oil','clear','fever','shatter','blocked'].includes(e.type)||settings.motion===false)continue;
        const p=project((e.lane??s.lane)*2.25,.8,0);
        for(let i=0;i<(e.type==='fever'?28:8)&&particles.length<140;i++)particles.push({x:p.x,y:p.y,vx:(hash(i+s.time)-.5)*200,vy:-hash(i+7+s.time)*180,life:.65,size:2+hash(i)*3,color:e.type==='oil'?'#bce9b2':'#ffd494'});
      }
    },
    dispose(){observer.disconnect();particles=[];},
  };
}
