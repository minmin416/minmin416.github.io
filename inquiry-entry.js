// Explicit form submission is the acknowledgement action in the requested UI.
// Endpoint stays unset in the preview until factual notice review is complete.
class InquirySender {
 constructor(form,{endpoint=null,fetcher=(...args)=>fetch(...args),minDuration=3000}={}) {
  this.form=form; this.button=form.querySelector('button[type=submit]');
  this.status=form.querySelector('[role=status]'); this.endpoint=endpoint;
  this.fetcher=fetcher; this.minDuration=minDuration; this.pending=false;
  this.id=null; this.fingerprint=null; this.retryAt=0; this.processingFor=null;
  form.addEventListener('input',()=>{if(!this.pending){this.processingFor=null;this.button.textContent='Send Messages';this.button.setAttribute('aria-label','문의 수집·이용에 동의하고 국외이전 확인으로 계속');this.form.querySelector('.step-notice')?.setAttribute('hidden','');}});
  form.addEventListener('submit',e=>{e.preventDefault();this.send();});
 }
 async send() {
  if(this.pending||!this.form.reportValidity())return;
  if(Date.now()<this.retryAt){this.status.textContent='Please wait before retrying. Your message is preserved.';return;}
  const message=this.form.elements.message.value,reply=this.form.elements.reply.value;
  const fingerprint=JSON.stringify([message,reply]);
  if(this.processingFor!==fingerprint){
   this.processingFor=fingerprint;
   this.button.textContent='국외이전 동의 · 전송';this.button.setAttribute('aria-label','국외이전에 별도로 동의하고 실제 문의 전송');
   const notice=this.form.querySelector('.step-notice'); if(notice)notice.hidden=false;
   this.status.textContent='수집·이용 동의를 확인했습니다. 국외이전 안내를 확인한 후 같은 버튼을 한 번 더 누르면 별도로 동의하고 전송합니다. 취소하면 전송되지 않습니다.';
   return;
  }
  if(!this.endpoint){this.status.textContent='Inquiry service is not enabled. Please email minseokang@riverplo.com.';return;}
  if(fingerprint!==this.fingerprint){this.id=crypto.randomUUID();this.fingerprint=fingerprint;}
  this.id??=crypto.randomUUID(); this.pending=true;
  const controls=[...this.form.elements].map(e=>[e,e.disabled]);
  controls.forEach(([e])=>e.disabled=true);
  this.form.setAttribute('aria-busy','true'); this.button.classList.add('sending');
  this.button.textContent='Sending…'; this.status.textContent='Waiting for storage confirmation…';
  const w=this.form.closest('.window'),h=w?.querySelector('h1'),transfer=w?.querySelector('.transfer');
  if(w&&h&&transfer){const a=w.getBoundingClientRect(),b=h.getBoundingClientRect();transfer.style.top=(b.top-a.top+(b.height-35)/2)+'px';transfer.style.left=(b.left-a.left+(b.width-100)/2)+'px';}
  w?.classList.add('transferring'); const start=performance.now();
  try {
   const payload={id:this.id,message,reply,noticeVersion:'riverplo-inquiries-2026-10-21-v2',collectionConsent:true,overseasConsent:true,submissionIntent:'send_after_notice'};
   const r=await this.fetcher(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000),credentials:'omit'});
   if(!r.ok){const seconds=Number(r.headers.get('Retry-After'));if(Number.isFinite(seconds)&&seconds>0)this.retryAt=Date.now()+Math.min(seconds,86400)*1000;throw Error('No storage acknowledgement');}
   if(!r.headers.get('content-type')?.includes('application/json'))throw Error('Invalid response');
   const result=await r.json(); if(result.ok!==true||result.id!==this.id)throw Error('Invalid acknowledgement');
   await new Promise(resolve=>setTimeout(resolve,Math.max(0,this.minDuration-(performance.now()-start))));
   this.button.textContent='Success'; this.status.textContent='Your inquiry was saved. Keep submission ID: '+this.id;
   this.form.reset(); this.id=null; this.fingerprint=null; this.processingFor=null; this.form.querySelector('.step-notice')?.setAttribute('hidden','');
  } catch {
   this.button.textContent='Try again';
   this.status.textContent=this.retryAt>Date.now()?'Service is busy. Please wait before retrying; your message is preserved.':'Unable to confirm delivery. Your message is preserved; retry uses the same submission ID.';
  } finally {
   this.pending=false; controls.forEach(([e,disabled])=>e.disabled=disabled);
   this.form.removeAttribute('aria-busy'); this.button.classList.remove('sending'); w?.classList.remove('transferring');
  }
 }
}

const f=document.querySelector('.inquiry'),w=document.querySelector('.window'),open=document.querySelector('.open-inquiry');open.addEventListener('click',()=>{f.hidden=false;open.hidden=true;w.classList.add('form-open');open.setAttribute('aria-expanded','true');f.elements.message.focus();});f.querySelector('.cancel-inquiry').addEventListener('click',()=>{f.hidden=true;open.hidden=false;w.classList.remove('form-open');open.setAttribute('aria-expanded','false');open.focus();});window.sender=new InquirySender(f,{endpoint:'https://riverplo-inquiry-api.river-personal-work.workers.dev/v1/inquiries'});

f.querySelector('.cancel-inquiry').addEventListener('click',()=>{sender.processingFor=null;sender.button.textContent='Send Messages';f.querySelector('.step-notice').hidden=true;});
