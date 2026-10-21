class InquirySender {
 constructor(form,{endpoint,fetcher=(...args)=>fetch(...args),player=new window.RiverploGifPlayer()}={}){
  this.form=form;this.button=form.querySelector('button[type=submit]');this.status=form.querySelector('[role=status]');this.endpoint=endpoint;this.fetcher=fetcher;this.player=player;this.pending=false;this.id=null;this.fingerprint=null;this.retryAt=0;
  form.addEventListener('submit',e=>{e.preventDefault();this.send();});
 }
 phase(name,detail={}){this.form.dataset.phase=name;this.form.dispatchEvent(new CustomEvent('riverplo:send-phase',{bubbles:true,detail:{phase:name,time:performance.now(),...detail}}));}
 async send(){
  if(this.pending||!this.form.reportValidity())return;
  if(Date.now()<this.retryAt){this.status.textContent='Please wait before retrying. Your message is preserved.';return;}
  const message=this.form.elements.message.value,reply=this.form.elements.reply.value,fingerprint=JSON.stringify([message,reply]);
  if(fingerprint!==this.fingerprint){this.id=crypto.randomUUID();this.fingerprint=fingerprint;}this.id??=crypto.randomUUID();this.pending=true;
  const controls=[...this.form.elements].map(e=>[e,e.disabled]);controls.forEach(([e])=>e.disabled=true);
  this.form.setAttribute('aria-busy','true');this.button.classList.add('sending');this.button.textContent='Sending…';this.status.textContent='Preparing message…';this.phase('progress');
  const w=this.form.closest('.window'),h=w.querySelector('h1'),transfer=w.querySelector('.transfer');
  try{
   this.phase('dissolve-start');await window.RiverploDissolve(h,350);this.phase('dissolve-end');
   await this.player.ready;
   const a=w.getBoundingClientRect(),b=h.getBoundingClientRect(),width=Math.min(272,a.width-40);Object.assign(transfer.style,{width:width+'px',height:'60px',top:(b.top-a.top+(b.height-60)/2)+'px',left:(b.left-a.left+(b.width-width)/2)+'px'});
   w.classList.add('gif-playing');await this.player.play(transfer,(name,detail)=>this.phase(name,detail));
   this.status.textContent='Waiting for storage confirmation…';this.phase('post-start');
   const payload={id:this.id,message,reply,noticeVersion:'riverplo-inquiries-2026-10-21-v3',submissionIntent:'send_message'};
   const r=await this.fetcher(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000),credentials:'omit'});
   if(!r.ok){const seconds=Number(r.headers.get('Retry-After'));if(Number.isFinite(seconds)&&seconds>0)this.retryAt=Date.now()+Math.min(seconds,86400)*1000;throw Error('No storage acknowledgement');}
   if(!r.headers.get('content-type')?.includes('application/json'))throw Error('Invalid response');const receipt=await r.json();if(receipt.ok!==true||receipt.id!==this.id)throw Error('Invalid receipt');
   this.button.textContent='Success';this.status.textContent='Your inquiry was saved. Keep submission ID: '+this.id;this.phase('success');this.form.reset();this.id=null;this.fingerprint=null;
  }catch{this.button.textContent='Try again';this.status.textContent=this.retryAt>Date.now()?'Service is busy. Please wait before retrying; your message is preserved.':'Unable to confirm delivery. Your message is preserved; retry uses the same submission ID.';this.phase('failure');}
  finally{this.pending=false;controls.forEach(([e,d])=>e.disabled=d);this.form.removeAttribute('aria-busy');this.button.classList.remove('sending');w.classList.remove('gif-playing');h.style.removeProperty('opacity');h.style.removeProperty('mask-image');h.style.removeProperty('-webkit-mask-image');h.style.removeProperty('mask-size');h.style.removeProperty('-webkit-mask-size');}
 }
}
const f=document.querySelector('.inquiry'),w=document.querySelector('.window'),open=document.querySelector('.open-inquiry');open.addEventListener('click',()=>{f.hidden=false;open.hidden=true;w.classList.add('form-open');open.setAttribute('aria-expanded','true');f.elements.message.focus();});f.querySelector('.cancel-inquiry').addEventListener('click',()=>{f.hidden=true;open.hidden=false;w.classList.remove('form-open');open.setAttribute('aria-expanded','false');open.focus();});window.sender=new InquirySender(f,{endpoint:'https://riverplo-inquiry-api.river-personal-work.workers.dev/v1/inquiries'});
