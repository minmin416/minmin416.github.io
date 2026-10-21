// Decode the unchanged original GIF once. Every Send starts at decoded frame zero.
// Browser paint/timer scheduling is not a hardware clock; late/background frames
// extend playback rather than allowing the request to start early.
class RiverploGifPlayer {
 constructor(url='/assets/xp-file-copy.gif') { this.ready=this.load(url);this.ready.catch(()=>{}); }
 async load(url) {
  const r=await fetch(url,{credentials:'omit',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Animation unavailable');
  const bytes=await r.arrayBuffer();if(bytes.byteLength>65536)throw Error('Unexpected animation');
  const parsed=window.RiverploGIFDecoder.parseGIF(bytes),frames=window.RiverploGIFDecoder.decompressFrames(parsed,true);
  if(parsed.lsd.width!==272||parsed.lsd.height!==60||frames.length!==20)throw Error('Unexpected animation');
  for(const f of frames)if(f.dims.width!==272||f.dims.height!==60||f.dims.left||f.dims.top||![100,400].includes(f.delay))throw Error('Unexpected animation frame');
  this.frames=frames.map(f=>({image:new ImageData(f.patch,272,60),delay:f.delay}));
  this.cycleMs=frames.reduce((n,f)=>n+f.delay,0);if(this.cycleMs!==2300)throw Error('Unexpected animation duration');
 }
 async play(container,phase) {
  await this.ready;
  let canvas=container.querySelector('canvas');if(!canvas){canvas=document.createElement('canvas');canvas.width=272;canvas.height=60;canvas.setAttribute('aria-hidden','true');container.append(canvas);}
  container.classList.add('controlled-gif');const context=canvas.getContext('2d');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  phase('gif-start',{cycleMs:this.cycleMs,cycles:2});
  const clock=new VisibleClock();let deadline=0;
  for(let loop=0;loop<2;loop++){
   for(let index=0;index<this.frames.length;index++){
    const frame=this.frames[index];canvas.dataset.frame=String(index);canvas.dataset.loop=String(loop);
    if(!reduced||index===0)context.putImageData(frame.image,0,0);
    // A late frame receives its full hold: never fast-forward an unseen cycle.
    deadline+=frame.delay;if(clock.time>=deadline)deadline=clock.time+frame.delay;
    await clock.until(deadline);
   }
   phase('gif-cycle-end',{cycle:loop+1,visibleMs:clock.time});
  }
  phase('gif-end',{visibleMs:clock.time});clock.close();
 }
}
class VisibleClock {
 constructor(){this.time=0;this.last=performance.now();this.visibility=()=>{this.last=performance.now()};document.addEventListener('visibilitychange',this.visibility);}
 close(){document.removeEventListener('visibilitychange',this.visibility);}
 until(target){return new Promise(resolve=>{const tick=now=>{if(!document.hidden)this.time+=Math.max(0,now-this.last);this.last=now;if(this.time>=target)resolve();else requestAnimationFrame(tick);};requestAnimationFrame(tick);});}
}
window.RiverploGifPlayer=RiverploGifPlayer;
window.RiverploDissolve=async function(heading,duration=350){
 const bayer=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];const masks=[];
 for(let level=0;level<=16;level++){let rects='';for(let y=0;y<4;y++)for(let x=0;x<4;x++)if(bayer[y][x]>=level)rects+=`<rect x="${x*4}" y="${y*4}" width="4" height="4" fill="white"/>`;masks.push(`url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">'+rects+'</svg>')}")`);}
 if(matchMedia('(prefers-reduced-motion:reduce)').matches){heading.style.opacity='0';return;}
 const clock=new VisibleClock();let index=-1;await new Promise(resolve=>{const tick=now=>{if(!document.hidden)clock.time+=Math.max(0,now-clock.last);clock.last=now;const n=Math.min(16,Math.floor(clock.time/duration*16));if(n!==index){heading.style.maskImage=masks[n];heading.style.webkitMaskImage=masks[n];heading.style.maskSize='16px 16px';heading.style.webkitMaskSize='16px 16px';index=n;}if(n===16)resolve();else requestAnimationFrame(tick);};requestAnimationFrame(tick);});heading.style.opacity='0';clock.close();
};
