// Original synthesized pentatonic score and event cues. Starts only on a gesture.
export function createSound() {
  let ctx=null,master=null,enabled=true,nextNote=0,note=0;
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
    tick(running){if(!enabled||!ctx||!running)return;if(ctx.currentTime>nextNote){const notes=[220,329.63,440,493.88,392,329.63,293.66,329.63];tone(notes[note%8],1.8,.06);if(note%4===0)tone(110,2.9,.055);nextNote=ctx.currentTime+.43;note++;}},
    events(events,combo=0){for(const e of events){
      if(e.type==='cinder')tone([659.25,783.99,880,987.77,1174.66][combo%5],.13,.12);
      else if(e.type==='hit')tone(130,.23,.3,0,'triangle',45);
      else if(e.type==='clear')tone(440,.18,.1,0,'sine',880);
      else if(e.type==='end')tone(220,.9,.15,0,'sine',110);
      else if(['fever','oil','magnet','shield','blocked','biome'].includes(e.type)){[440,554.37,659.25].forEach((f,i)=>tone(f,.6,.12,i*.09));}
    }},
  };
}
