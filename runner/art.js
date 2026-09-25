// Cinderpath's drawing vocabulary: ink contours, cut-paper shapes, brass, and cloth.
// All paths are original. Coordinates are shared by the camp, runner, and wardrobe.
export const INK = '#243c39';
export const TAU = Math.PI * 2;
export const mix = (a,b,t) => '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
export const hash = n => { const x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); };
const paths = new Map();
export function shape(c, path, fill, stroke=INK, width=2) {
  let p=paths.get(path);
  if(!p){p=new Path2D(path);if(paths.size<160)paths.set(path,p);}
  if(fill){c.fillStyle=fill;c.fill(p);}
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke(p);}
}
export function ellipse(c,x,y,rx,ry,color,stroke) {
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=color;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}
}
export function lantern(c,x,y,size=1,time=0,fuel=100) {
  c.save();c.translate(x,y);c.scale(size,size);
  shape(c,'M-7 -23 C-10 -40 11 -40 8 -23',null,'#bc8544',3);
  shape(c,'M-15 -19 L-12 19 Q0 25 13 19 L16 -19 Z','#d3923d',INK,3);
  shape(c,'M-9 -14 L-7 15 Q0 19 8 15 L10 -14 Z',mix('#674a38','#ffeeb0',Math.max(.1,fuel/100)),null);
  shape(c,'M0 12 Q-10 5 0 -10 Q-1 0 5 -2 Q12 10 0 12','#fff9cf',null);
  shape(c,'M-18 -18 L-11 -25 L11 -25 L19 -18 Z','#9d703d');
  shape(c,'M-15 21 L15 21 L12 26 L-12 26 Z','#775a3c');
  shape(c,'M0 -17 L0 18 M-12 -17 L-10 18 M13 -17 L11 18',null,'#785d37',2);
  c.globalAlpha=.15+Math.sin(time*11)*.025;
  ellipse(c,0,0,28,35,'#ffd88c');c.restore();
}
// Deliberately posed phases: contact, down, passing, up. The opposite leg is offset.
const gait = [
  {x:9,y:0,k:4},{x:6,y:0,k:7},{x:-1,y:-2,k:11},{x:-8,y:-9,k:9},
  {x:-10,y:-14,k:3},{x:-5,y:-18,k:-4},{x:3,y:-14,k:-8},{x:9,y:-5,k:-3}
];
export function gaitPose(phase) {
  const p=((phase%1)+1)%1*8,i=Math.floor(p),t=p-i,a=gait[i],b=gait[(i+1)%8];
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,k:a.k+(b.k-a.k)*t};
}
export function courier(c,{time=0,phase=0,run=false,back=false,action='run',actionTime=0,color='#bd6544',trim='#ecd3a0',lean=0,land=0,fuel=100}={}) {
  const cycle=phase*TAU, left=gaitPose(phase),right=gaitPose(phase+.5);
  const jump=action==='jump',slide=action==='slide';
  const breathe=run?Math.cos(cycle*2)*1.8:Math.sin(time*1.7)*1.4;
  const flutter=run?Math.sin(cycle-.8)*5:Math.sin(time*1.8)*2;
  const blink=!run&&time%5.7>5.5;
  c.save();c.rotate(lean*.12);c.translate(0,breathe+land*7);
  if(slide){const tuck=Math.sin(Math.min(1,actionTime/.12,Math.max(0,.86-actionTime)/.12)*Math.PI/2);c.translate(0,-12*tuck);c.rotate(-.58*tuck);c.scale(1+.08*tuck,1-.39*tuck);}
  if(jump){c.scale(1.02,1-Math.sin(actionTime/.86*Math.PI)*.035);}
  // A large white-tipped tail makes the courier readable from behind at phone size.
  c.save();c.translate(-16,-39);c.rotate((run?Math.sin(cycle-.7)*.15:Math.sin(time)*.06)+(slide?-.5:0));
  shape(c,'M4 -8 C-38 -12 -69 -8 -64 -48 C-60 -68 -80 -68 -73 -83 C-42 -83 -31 -56 -31 -43 Q-25 -25 4 -24 Z','#b56a43');
  shape(c,'M-64 -48 C-60 -68 -80 -68 -73 -83 Q-47 -81 -38 -59 L-48 -62 L-45 -51 L-55 -56 L-54 -45 Z','#eedab0');c.restore();
  // Boots retain a planted phase; knee bend changes silhouette instead of stretching.
  for(const side of [-1,1]){
    const g=side<0?left:right,dx=slide?(side<0?-17:12):run?g.x:0,dy=jump?-21:slide?(side<0?-3:-17):run?g.y:0;
    c.save();c.translate(side*14,0);
    shape(c,`M-8 -53 Q${-6+(run?g.k:0)} -27 ${-9+dx} ${-13+dy} L${8+dx} ${-10+dy} Q${13+(run?g.k:0)} -32 8 -53 Z`,'#544d39');
    shape(c,`M${-10+dx} ${-16+dy} L${9+dx} ${-14+dy} L${10+dx} ${-5+dy} Q${22+dx} ${-5+dy} ${21+dx} ${2+dy} Q${4+dx} ${6+dy} ${-12+dx} ${1+dy} Z`,'#38453b');
    c.strokeStyle='#a6a17b';c.lineWidth=2;c.beginPath();c.moveTo(-9+dx,-10+dy);c.lineTo(7+dx,-9+dy);c.stroke();c.restore();
  }
  // Scarf, coat, seam, patched pocket, and cross-body satchel.
  shape(c,`M-19 -118 Q-49 -111 ${-56-flutter} -91 L${-76-flutter} -101 L${-69-flutter} -83 Q-42 -77 -7 -100 Z`,trim);
  shape(c,'M-24 -116 Q-41 -90 -38 -43 Q-23 -34 -6 -41 Q15 -34 35 -46 Q34 -91 20 -116 Z',color,INK,2.8);
  shape(c,'M13 -109 Q31 -76 26 -48 L35 -46 Q34 -91 20 -116 Z',mix(color,INK,.25),null);
  shape(c,'M-29 -46 Q-9 -40 3 -45 Q20 -39 28 -48 M-5 -103 L-4 -47',null,trim,2);
  shape(c,'M-26 -72 L-12 -72 L-12 -57 L-26 -58 Z',mix(color,'#e6cda6',.28),INK,1.5);
  shape(c,'M-24 -69 L-24 -60 M-15 -69 L-15 -60',null,trim,1);
  shape(c,'M-27 -112 Q-6 -92 27 -65 L31 -73 Q1 -98 -20 -119 Z','#786041',INK,1.5);
  if(back){
    shape(c,'M-22 -90 Q-4 -98 15 -89 L15 -64 Q-1 -56 -20 -65 Z','#977749');
    shape(c,'M-23 -88 Q-2 -78 17 -88 L15 -76 Q-4 -70 -22 -80 Z','#b59661');
    shape(c,'M-5 -83 L1 -83 L1 -71 L-5 -71 Z','#e3bb65');
  }else{
    shape(c,'M22 -76 L43 -72 L43 -49 Q33 -43 19 -49 Z','#ac824d');
    shape(c,'M22 -75 L44 -72 L43 -61 L23 -62 Z','#c19c61');
    ellipse(c,32,-61,2,2,'#ead293');
  }
  // Swinging arms and a lantern with delayed follow-through.
  const arm=run?Math.sin(cycle)*9:Math.sin(time*1.7)*2;
  shape(c,`M-27 -104 Q-45 -93 -41 ${-75-arm} Q-39 ${-68-arm} -30 ${-72-arm} L-19 -98 Z`,mix(color,INK,.07));
  ellipse(c,-36,-73-arm,7,7,'#be7549',INK);
  shape(c,`M23 -103 Q36 -99 37 ${-84+arm*.4} L53 ${-86+arm*.4} L56 ${-76+arm*.4} Q29 -66 23 -86 Z`,color);
  ellipse(c,54,-82+arm*.4,7,7,'#c97d4b',INK);
  c.save();c.translate(57,-77+arm*.4);c.rotate(run?Math.sin(cycle-.8)*.21:Math.sin(time*1.5)*.08);lantern(c,0,28,.77,time,fuel);c.restore();
  // Head and offset ears. One nicked ear, cream muzzle, and two brow shapes.
  c.save();c.translate(0,-120);c.rotate(run?Math.sin(cycle-.4)*.025:Math.sin(time*.8)*.035);
  shape(c,'M-26 -25 Q-43 -69 -37 -79 L-22 -61 L-20 -64 L-5 -31 Z','#b96b42',INK,2.8);
  shape(c,'M-28 -34 L-34 -66 L-13 -36 Z','#4a483b',null);
  shape(c,'M8 -31 Q18 -77 29 -80 Q40 -51 32 -23 Z','#cf8651',INK,2.8);
  shape(c,'M17 -34 L27 -64 L29 -33 Z','#6d5140',null);
  shape(c,'M-29 -38 Q-9 -54 19 -40 Q33 -32 33 -12 L41 -9 L31 -4 L37 1 L24 3 Q10 18 -7 14 Q-25 15 -38 -2 L-31 -6 L-40 -12 L-32 -15 Z','#d58b51',INK,2.8);
  if(back){
    shape(c,'M-26 -32 Q-6 -43 15 -33 M-17 -28 L-10 -32 M-5 -30 L1 -33',null,'#efa963',2);
    shape(c,'M25 -11 L36 -8 L29 -4','#f2dcb1',null);
  }else{
    shape(c,'M-31 -13 Q-18 -6 -8 -10 Q-2 -1 4 -11 Q22 -8 32 -17 Q34 2 12 11 Q-16 22 -31 -13 Z','#f5dfb4',null);
    if(blink){shape(c,'M-19 -15 Q-14 -12 -9 -15 M10 -17 Q15 -14 20 -18',null,INK,2.3);}
    else{ellipse(c,-14,-15,3.2,4.6,INK);ellipse(c,15,-17,3.2,4.6,INK);ellipse(c,-13,-16,1,1,'#fff3cb');ellipse(c,16,-18,1,1,'#fff3cb');}
    shape(c,'M-3 -5 Q2 -9 7 -5 L2 0 Z',INK,null);
    shape(c,'M2 0 Q4 7 12 3 M-21 -25 L-10 -26 M10 -28 L19 -27',null,INK,1.7);
    shape(c,'M-27 -1 L-36 -3 M-24 3 L-32 5 M22 -1 L32 -4',null,'#99744b',1);
  }
  c.restore();
  shape(c,'M-27 -120 Q0 -109 24 -123 L27 -113 Q1 -100 -27 -110 Z',trim);
  shape(c,'M15 -114 L22 -99 L32 -106 L26 -117 Z',trim);
  c.restore();
}
export function treeArt(c,variant,palette) {
  // 220 x 420, ground at (110,420). Asymmetric branches, knots and etched bark.
  const [dark,mid,light]=palette;
  const bend=[-12,18,-5,10][variant%4];
  shape(c,`M97 420 Q${101+bend} 291 96 195 L112 45 L130 42 Q111 247 126 420 Z`,dark,null);
  shape(c,'M104 270 L44 212 L20 157 L34 166 L56 207 L110 244 M114 208 L177 147 L196 109 L192 144 L155 192 L116 231',dark,null);
  const profiles=[
    'M109 2 Q72 57 61 79 L77 74 Q44 111 34 137 L59 129 Q26 172 12 207 Q61 209 93 188 Q105 215 113 230 Q146 204 202 217 Q186 176 159 147 L184 153 Q164 114 139 93 L156 95 Q138 50 109 2 Z',
    'M119 0 Q74 51 63 89 L84 78 Q57 135 31 160 L58 150 Q40 191 2 220 Q62 233 95 209 Q117 246 138 250 Q157 229 212 229 Q202 187 172 158 L184 165 Q169 112 142 93 L153 91 Q140 38 119 0 Z',
    'M100 1 Q89 40 41 95 L67 95 Q34 139 15 174 L39 170 Q21 204 4 233 Q55 238 86 226 L114 257 Q148 232 211 241 Q190 200 155 174 L178 178 Q166 132 139 112 L153 113 Q137 59 100 1 Z'
  ];
  shape(c,profiles[variant%3],mid,null);
  shape(c,'M110 35 Q105 93 79 121 L100 117 Q78 164 43 182 L76 181 Q70 203 51 216 Q101 210 112 229 Q130 205 146 202 Q111 155 119 104 Z',light,null);
  shape(c,'M114 99 L114 198 M82 153 L103 140 M135 174 L116 164 M61 199 L85 190 M118 282 L121 374 M106 298 L103 324',null,dark,2);
  ellipse(c,112,333,6,14,dark);ellipse(c,113,329,2,7,mid);
  for(let i=0;i<9;i++){c.strokeStyle=light;c.globalAlpha=.22;c.lineWidth=2;c.beginPath();c.moveTo(42+i*13,175+hash(i+variant)*42);c.lineTo(46+i*13,168+hash(i+variant)*42);c.stroke();}c.globalAlpha=1;
}
export function fern(c,x,y,size,color) {
  c.save();c.translate(x,y);c.scale(size,size);
  for(const side of [-1,1]){
    shape(c,`M0 0 Q${side*12} -30 ${side*35} -41`,null,color,2);
    for(let i=0;i<5;i++){const px=side*(4+i*5),py=-8-i*6;shape(c,`M${px} ${py} Q${px-side*4} ${py-13} ${px+side*5} ${py-15} Q${px+side*9} ${py-9} ${px} ${py}`,color,null);}
  }c.restore();
}
export const ICONS={
 book:'M5 5Q11 3 16 7Q21 3 27 5V26Q21 24 16 28Q11 24 5 26ZM16 7V28M8 10L12 11M8 15L12 16M20 11L24 10M20 16L24 15',
 cloak:'M12 6Q16 2 20 6L23 13L28 27Q22 30 16 26Q10 30 4 27L9 13ZM10 13Q16 17 22 13M13 6L12 11L20 11L19 6',
 sun:'M16 8A8 8 0 1 0 16 24A8 8 0 1 0 16 8M16 2V5M16 27V30M2 16H5M27 16H30M6 6L8 8M24 24L26 26M6 26L8 24M24 8L26 6',
 gear:'M12 4L20 4L21 9L26 11L29 17L25 21L24 27L17 29L12 25L6 24L3 17L7 12L7 7ZM16 11A6 6 0 1 0 16 23A6 6 0 1 0 16 11',
 sound:'M5 12H10L18 5V27L10 20H5ZM23 11Q28 16 23 21',
 mute:'M5 12H10L18 5V27L10 20H5ZM23 12L29 21M29 12L23 21',
 flame:'M16 2Q5 14 8 23Q11 31 20 28Q29 22 23 13L20 18Q21 8 16 2ZM15 18Q11 24 17 26Q23 25 19 20L17 23Z',
 pause:'M10 7V25M22 7V25',close:'M8 8L24 24M24 8L8 24',
 left:'M22 6L10 16L22 26M10 16H29',right:'M10 6L22 16L10 26M22 16H3',
 jump:'M6 20L16 8L26 20M16 8V29',slide:'M6 12L16 24L26 12M16 24V3',
};
export const icon=(name)=>`<svg viewBox="0 0 32 32" aria-hidden="true" class="glyph"><path d="${ICONS[name]||ICONS.flame}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
