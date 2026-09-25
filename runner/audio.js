// Original synthesized pentatonic score and event cues. Starts only on a gesture.
export function createSound() {
  let ctx=null,master=null,enabled=true,nextNote=0,note=0,lastFoot=-1,lastAction='run';
  function unlock() {
    if(!enabled)return;
    try {
      if(!ctx){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;ctx=new Audio();master=ctx.createGain();master.gain.value=.23;master.connect(ctx.destination);}
      if(ctx.state==='suspended')ctx.resume().catch(()=>{});
    }catch{ctx=null;}
  }
  function tone(frequency,duration,volume=.15,delay=0,type='sine',end=frequency) {
    if(!enabled||!ctx||ctx.state!=='running')return;
    const time=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(frequency,time);osc.frequency.exponentialRampToValueAtTime(end,time+duration);
    gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(volume,time+.012);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
    osc.connect(gain);gain.connect(master);osc.start(time);osc.stop(time+duration+.02);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  return {
    unlock,
    setEnabled(value){enabled=value;if(master)master.gain.value=value?.23:0;},
    ui(){unlock();tone(340,.055,.075,0,'triangle',170);},
    action(action){unlock();if(action==='jump')tone(180,.13,.08,0,'sine',310);else if(action==='slide')tone(170,.12,.06,0,'triangle',90);},
    tick(running,run){
      if(run){const foot=Math.floor(run.distance/3);if(run.action==='run'&&foot!==lastFoot){tone(78,.035,.03,0,'triangle',42);lastFoot=foot;}if(lastAction==='jump'&&run.action==='run')tone(90,.065,.065,0,'triangle',44);lastAction=run.action;}
if(!enabled||!ctx||!running)return;if(ctx.currentTime>nextNote){const notes=[293.66,440,369.99,329.63,0,246.94,293.66,0,369.99,493.88,440,0,329.63,293.66,246.94,0];if(notes[note%16])tone(notes[note%16],.85,.055,0,'triangle');if(note%4===0)tone(note%8===0?146.83:123.47,2.2,.035);nextNote=ctx.currentTime+.54;note++;}},
    events(events,combo=0){for(const e of events){
      if(e.type==='cinder')tone([659.25,783.99,880,987.77,1174.66][combo%5],.13,.12);
      else if(e.type==='hit')tone(130,.23,.3,0,'triangle',45);
      else if(e.type==='clear')tone(440,.18,.1,0,'sine',880);
      else if(e.type==='end')tone(220,.9,.15,0,'sine',110);
      else if(['fever','oil','magnet','shield','blocked','biome'].includes(e.type)){[440,554.37,659.25].forEach((f,i)=>tone(f,.6,.12,i*.09));}
    }},
  };
}
