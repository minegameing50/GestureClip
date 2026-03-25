'use strict';
// ══════════════════════════════════════════════════
// ELEMENTS
// ══════════════════════════════════════════════════
const camvid  = document.getElementById('camvid');
const hcvs    = document.getElementById('hcvs');
const hctx    = hcvs.getContext('2d');
const permov  = document.getElementById('permov');
const loadov  = document.getElementById('loadov');
const denyov  = document.getElementById('denyov');
const gpill   = document.getElementById('gpill');
const cwrap   = document.getElementById('cwrap');
const cfill   = document.getElementById('cfill');
const camfl   = document.getElementById('camflash');
const dcam    = document.getElementById('dcam');
const dhand   = document.getElementById('dhand');
const dsync   = document.getElementById('dsync');
const scam    = document.getElementById('scam');
const shand   = document.getElementById('shand');
const ssync   = document.getElementById('ssync');
const ed      = document.getElementById('ed');
const edWrap  = document.getElementById('ed-wrap');
const cardsEl = document.getElementById('cards');
const emptyEl = document.getElementById('empty');
const icount  = document.getElementById('icount');
const toasts  = document.getElementById('toasts');
const rcodeEl = document.getElementById('rcode');
const gc      = document.getElementById('gc');
const ghost   = document.getElementById('ghost');

// HUD rows
const grEls = {
  two:   document.getElementById('gr-two'),
  three: document.getElementById('gr-three'),
  drop:  document.getElementById('gr-drop'),
  pinch: document.getElementById('gr-pinch'),
  fist:  document.getElementById('gr-fist'),
  palm:  document.getElementById('gr-palm'),
};
const GRC = {two:'on-g',three:'on-p',drop:'on-y',pinch:'on-g',fist:'on-r',palm:'on-p'};
function setHud(k){
  Object.entries(grEls).forEach(([n,el])=>{ if(el) el.className='gr'+(n===k?' '+GRC[n]:''); });
}

// ══════════════════════════════════════════════════
// GUN / ROOM
// ══════════════════════════════════════════════════
let roomCode='', deviceId='', roomRef=null, items={};
let camStream=null, camRunning=false;
const MAX = 25;
const gun = GUN(['https://gun-manhattan.herokuapp.com/gun','https://gun-us.herokuapp.com/gun']);

const rand  = n => Math.random().toString(36).substring(2,2+n).toUpperCase();
const esc   = s => { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; };
const tstr  = ts => { const d=new Date(ts); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); };
const toast = (msg,cls='tg2') => {
  const el=document.createElement('div'); el.className='toast '+cls; el.textContent=msg;
  toasts.appendChild(el); setTimeout(()=>el.remove(),2700);
};

function setupRoom(code){
  if(roomRef) roomRef.off();
  roomCode=code; deviceId=rand(8);
  rcodeEl.textContent=code;
  ssync.textContent=code; dsync.className='dot dy syncing';
  items={}; cardsEl.querySelectorAll('.card').forEach(c=>c.remove()); renderEmpty();
  roomRef = gun.get('gestureclip_v3_'+code).get('items');
  roomRef.map().on(function(data,key){
    if(!data) return;
    if(data._del){ if(items[key]){ delete items[key]; renderCards(); } return; }
    if(!data.text||!data.ts) return;
    const isNew=!items[key], isRemote=data.device&&data.device!==deviceId;
    items[key]=data;
    renderCards(isNew?key:null, isNew&&isRemote);
  });
  setTimeout(()=>dsync.className='dot dy',1500);
}
function newRoom(){ if(Object.keys(items).length>0&&!confirm('Create new room?')) return; setupRoom(rand(6)); toast('🔑 New room','ty2'); }
function joinRoom(){
  const v=document.getElementById('jinp').value.trim().toUpperCase();
  if(v.length<4){ toast('Enter a valid code','tpu'); return; }
  document.getElementById('jinp').value=''; setupRoom(v); toast('🔗 Joined '+v,'ty2');
}
function copyCode(){ navigator.clipboard?.writeText(roomCode).catch(()=>{}); toast('Copied: '+roomCode,'ty2'); }

function sendItem(text){
  if(!text||!text.trim()) return;
  const key='i'+Date.now()+rand(4);
  roomRef.get(key).put({id:key,text:text.trim(),ts:Date.now(),device:deviceId,_del:false});
  dsync.className='dot dy syncing'; setTimeout(()=>dsync.className='dot dy',800);
}
function sendTyped(){
  const v=document.getElementById('sendinp').value.trim();
  if(!v){ toast('Type something first','tpu'); return; }
  sendItem(v); document.getElementById('sendinp').value=''; toast('⬆ Sent','tg2');
}

// ══════════════════════════════════════════════════
// CARDS
// ══════════════════════════════════════════════════
function renderEmpty(){
  const list=Object.values(items).filter(i=>i.text&&!i._del);
  emptyEl.style.display=list.length?'none':'flex';
  icount.textContent=list.length+' item'+(list.length===1?'':'s');
}
function renderCards(newKey, isRemoteNew){
  const list=Object.values(items).filter(i=>i.text&&!i._del).sort((a,b)=>b.ts-a.ts).slice(0,MAX);
  emptyEl.style.display=list.length?'none':'flex';
  icount.textContent=list.length+' item'+(list.length===1?'':'s');
  if(newKey&&!cardsEl.querySelector('[data-id="'+newKey+'"]')){
    const item=items[newKey]; if(!item||!item.text) return;
    const card=makeCard(item); card.classList.add('fresh');
    const first=cardsEl.querySelector('.card');
    if(first) cardsEl.insertBefore(card,first); else cardsEl.appendChild(card);
    if(isRemoteNew) toast('📥 New item from another device','ty2');
  }
  cardsEl.querySelectorAll('.card').forEach(el=>{
    const id=el.dataset.id;
    if(!items[id]||items[id]._del||!items[id].text) el.remove();
  });
}
function makeCard(item){
  const card=document.createElement('div');
  const isMe=item.device===deviceId;
  card.className='card'; card.dataset.id=item.id; card.draggable=true;
  card.innerHTML=
    '<div class="dh">⠿ drag</div>'+
    '<div class="ctxt">'+esc(item.text)+'</div>'+
    '<div class="cmeta"><span class="cdev'+(isMe?'':' remote')+'">'+(isMe?'💻 this device':'📡 remote')+'</span>'+
    '<span class="ctime">'+tstr(item.ts)+'</span></div>'+
    '<div class="cacts">'+
    '<button class="ca cag" onclick="pasteItem(\''+item.id+'\')">↓ Paste</button>'+
    '<button class="ca car" onclick="deleteItem(\''+item.id+'\')">✕</button></div>';
  card.addEventListener('dragstart', e=>{
    e.dataTransfer.setData('text/plain',item.text);
    e.dataTransfer.effectAllowed='copy';
    const dg=document.createElement('div');
    dg.style.cssText='position:fixed;top:-999px;left:-999px;background:rgba(10,16,32,.97);'+
      'border:1.5px solid #a855f7;border-radius:9px;padding:7px 13px;'+
      'font-family:DM Sans,sans-serif;font-size:.8rem;color:#cce4f5;'+
      'max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'+
      'box-shadow:0 6px 24px rgba(0,0,0,.5)';
    dg.textContent=item.text.slice(0,32)+(item.text.length>32?'…':'');
    document.body.appendChild(dg);
    e.dataTransfer.setDragImage(dg,60,20);
    setTimeout(()=>dg.remove(),100);
    card.classList.add('dragging');
  });
  card.addEventListener('dragend',()=>card.classList.remove('dragging'));
  return card;
}
function pasteItem(id){ const item=items[id]; if(item) insertIntoEditor(item.text); }
function deleteItem(id){
  const item=items[id]; if(!item) return;
  roomRef.get(id).put({id,text:'',ts:Date.now(),device:deviceId,_del:true});
  delete items[id]; cardsEl.querySelector('[data-id="'+id+'"]')?.remove(); renderEmpty();
}
function clearAll(){
  if(!Object.keys(items).length) return;
  if(!confirm('Clear all items in room '+roomCode+'?')) return;
  Object.keys(items).forEach(k=>roomRef.get(k).put({id:k,text:'',ts:Date.now(),device:deviceId,_del:true}));
  items={}; cardsEl.querySelectorAll('.card').forEach(c=>c.remove()); renderEmpty();
}

// ══════════════════════════════════════════════════
// EDITOR HELPERS
// ══════════════════════════════════════════════════

// Mouse drag-drop into editor
edWrap.addEventListener('dragover', e=>{
  e.preventDefault(); e.dataTransfer.dropEffect='copy';
  edWrap.classList.add('drag-over');
  const pos=caretPosAt(e.clientX,e.clientY);
  if(pos>=0){ ed.focus(); ed.setSelectionRange(pos,pos); }
});
edWrap.addEventListener('dragleave',()=>edWrap.classList.remove('drag-over'));
edWrap.addEventListener('drop', e=>{
  e.preventDefault(); edWrap.classList.remove('drag-over');
  const text=e.dataTransfer.getData('text/plain');
  if(text) insertAtScreenPos(e.clientX, e.clientY, text);
});

// Get char offset from pixel position
function caretPosAt(x,y){
  const r=ed.getBoundingClientRect();
  const cs=getComputedStyle(ed);
  const fs=parseFloat(cs.fontSize)||14;
  const lh=parseFloat(cs.lineHeight)||fs*1.82;
  const pt=parseFloat(cs.paddingTop)||16;
  const pl=parseFloat(cs.paddingLeft)||18;
  const cw=fs*0.54;
  const lines=ed.value.split('\n');
  const ry=Math.max(0,y-r.top-pt);
  const rx=Math.max(0,x-r.left-pl);
  const li=Math.max(0,Math.min(lines.length-1,Math.floor(ry/lh)));
  const ci=Math.max(0,Math.min(lines[li].length,Math.round(rx/cw)));
  let pos=0; for(let i=0;i<li;i++) pos+=lines[i].length+1;
  return pos+ci;
}

// Insert text at screen pixel position
function insertAtScreenPos(x, y, text){
  const pos=caretPosAt(x,y);
  const safe=(pos>=0&&pos<=ed.value.length)?pos:ed.value.length;
  ed.value=ed.value.substring(0,safe)+text+ed.value.substring(safe);
  ed.selectionStart=ed.selectionEnd=safe+text.length;
  ed.focus();
  flashEditor();
  toast('📌 Dropped!','tpu');
}

// Insert text at current caret (for gesture paste / button paste)
function insertIntoEditor(text){
  const s=ed.selectionStart??ed.value.length, e2=ed.selectionEnd??s;
  ed.value=ed.value.substring(0,s)+text+ed.value.substring(e2);
  ed.selectionStart=ed.selectionEnd=s+text.length;
  ed.focus(); flashEditor(); toast('✋ Pasted!','tpu');
}

function flashEditor(col='rgba(168,85,247,.5)'){
  edWrap.style.outline='2px solid '+col;
  setTimeout(()=>edWrap.style.outline='',400);
}

// ══════════════════════════════════════════════════
// GESTURE ENGINE
// ══════════════════════════════════════════════════

// State
let gCur     = 'NONE';
let gBuf     = [];
let gT0      = 0;
let gCarPos  = 0;
let gSelAnc  = -1;
let gDragId  = null;
let gDragging= false;
let gHovId   = null;
let gPillT   = null;
let gLastAct = 0;   // timestamp of last action (copy/paste/grab)

const GBUF   = 6;    // frames needed to confirm gesture (higher = more stable)
const ACT_CD = 1800; // ms cooldown between action gestures

const dist=(a,b)=>Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2);

// ── Classify gesture ──
function classify(lm){
  const sc=dist(lm[0],lm[9])||0.1;
  // Pinch
  if(dist(lm[4],lm[8])/sc<0.35) return {name:'PINCH',tip:lm[8]};
  // Finger up: tip strictly above pip joint
  const up=[
    lm[8].y <lm[6].y,   // index
    lm[12].y<lm[10].y,  // middle
    lm[16].y<lm[14].y,  // ring
    lm[20].y<lm[18].y,  // pinky
  ];
  if( up[0]&&!up[1]&&!up[2]&&!up[3]) return {name:'POINT', tip:lm[8]};
  if( up[0]&& up[1]&&!up[2]&&!up[3]) return {name:'TWO',   tip:lm[8]};
  if( up[0]&& up[1]&& up[2]&&!up[3]) return {name:'THREE', tip:lm[12]};
  if( up[0]&& up[1]&& up[2]&& up[3]) return {name:'PALM',  tip:lm[9]};
  if(!up[0]&&!up[1]&&!up[2]&&!up[3]) return {name:'FIST',  tip:lm[9]};
  return {name:'NONE',tip:lm[9]};
}

// ── Convert normalised tip → FULL SCREEN px ──
// Camera CSS is scaleX(-1) so flip X.
function tipToPage(tip){
  return {
    x: (1-tip.x)*window.innerWidth,
    y:    tip.y *window.innerHeight,
  };
}

// ── Move the global cursor dot ──
function movGc(x,y,cls){
  gc.style.left=x+'px'; gc.style.top=y+'px';
  gc.className='on '+(cls||'');
}
function hideGc(){ gc.className=''; }

// ── Ripple animation ──
function ripple(){
  const r=document.createElement('div'); r.className='gcring';
  gc.appendChild(r); setTimeout(()=>r.remove(),550);
}

// ── Pill message ──
function pill(msg,pu=false){
  gpill.textContent=msg; gpill.className='on'+(pu?' pu':'');
  clearTimeout(gPillT); gPillT=setTimeout(()=>{ gpill.className=''; gPillT=null; },2200);
}
function doFlash(c){ camfl.className=c; setTimeout(()=>camfl.className='',550); }

// ── Card hover ──
function setHov(id){
  if(gHovId===id) return;
  if(gHovId){ const el=cardsEl.querySelector('[data-id="'+gHovId+'"]'); if(el) el.classList.remove('ghover'); }
  gHovId=id;
  if(id){ const el=cardsEl.querySelector('[data-id="'+id+'"]'); if(el) el.classList.add('ghover'); }
}

// ── Start / move / drop ghost drag ──
function startGhostDrag(id,x,y){
  if(gDragging) return; // already dragging, don't double-start
  const item=items[id]; if(!item) return;
  gDragId=id; gDragging=true;
  setHov(null);
  ghost.textContent=item.text.slice(0,36)+(item.text.length>36?'…':'');
  ghost.classList.add('on');
  ghost.style.left=x+'px'; ghost.style.top=y+'px';
  ripple();
  pill('🤟 GRABBED — curl ring finger to drop',false);
  toast('🤟 Grabbed! Move to editor, curl ring to drop','ty2');
}
function moveGhost(x,y){
  ghost.style.left=x+'px'; ghost.style.top=y+'px';
}
function dropGhost(x,y){
  if(!gDragging) return; // nothing to drop
  const item=gDragId?items[gDragId]:null;
  ghost.classList.remove('on');
  setHov(null);
  gDragId=null; gDragging=false;
  if(item){
    const r=ed.getBoundingClientRect();
    if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom){
      insertAtScreenPos(x,y,item.text);
      toast('✌️ Dropped into editor!','ty2'); ripple();
    } else {
      toast('Drop over the editor to paste','ty2');
    }
  }
}

// ── Place textarea caret at screen coords ──
function placeCaretAt(x,y){
  const r=ed.getBoundingClientRect();
  if(x<r.left||x>r.right||y<r.top||y>r.bottom) return;
  const pos=caretPosAt(x,y);
  ed.focus(); ed.setSelectionRange(pos,pos); gCarPos=pos;
}

// ── Extend selection from anchor to screen coords ──
function extendSel(x,y){
  if(gSelAnc<0) return;
  const r=ed.getBoundingClientRect();
  const cx=Math.max(r.left+1,Math.min(r.right-1,x));
  const cy=Math.max(r.top+1, Math.min(r.bottom-1,y));
  const end=caretPosAt(cx,cy);
  const s=Math.min(gSelAnc,end), e=Math.max(gSelAnc,end);
  ed.focus(); ed.setSelectionRange(s,e);
}

// ── Copy ──
function gestCopy(){
  const now=Date.now();
  if(now-gLastAct<ACT_CD){ pill('⏳ Wait before copying again',false); return; }
  const s=ed.selectionStart, e2=ed.selectionEnd;
  if(s===e2){ toast('⚠ Use ☝️ to select text first','tpu'); return; }
  gLastAct=now;
  sendItem(ed.value.substring(s,e2));
  doFlash('fg'); pill('✊ COPIED + SENT!',false);
  toast('✊ Copied & sent to room','tg2'); ripple();
}

// ── Paste ──
function gestPaste(){
  const now=Date.now();
  if(now-gLastAct<ACT_CD){ pill('⏳ Wait before pasting again',false); return; }
  const latest=Object.values(items).filter(i=>i.text&&!i._del).sort((a,b)=>b.ts-a.ts)[0];
  if(!latest){ toast('⚠ Nothing in clipboard yet','tpu'); return; }
  gLastAct=now;
  ed.focus(); ed.setSelectionRange(gCarPos,gCarPos);
  insertIntoEditor(latest.text);
  doFlash('fp'); pill('✋ PASTED!',true); ripple();
}

// ══════════════════════════════════════════════════
// onResults
// ══════════════════════════════════════════════════
function onResults(res){
  hcvs.width =camvid.videoWidth ||hcvs.offsetWidth;
  hcvs.height=camvid.videoHeight||hcvs.offsetHeight;
  hctx.clearRect(0,0,hcvs.width,hcvs.height);

  if(!res.multiHandLandmarks?.length){
    dhand.className='dot'; shand.textContent='HAND';
    cwrap.className=''; if(!gPillT) gpill.className='';
    hideGc();
    if(gDragging)       dropGhost(-9999,-9999);
    if(gCur==='POINT')  ed.classList.remove('sel-mode');
    setHov(null);
    gCur='NONE'; gBuf=[]; setHud(null);
    return;
  }

  dhand.className='dot dp'; shand.textContent='DETECTED';
  const lm=res.multiHandLandmarks[0];
  drawConnectors(hctx,lm,HAND_CONNECTIONS,{color:'rgba(0,229,176,.25)',lineWidth:1.5});
  drawLandmarks(hctx,lm,{color:'rgba(0,229,176,.8)',fillColor:'rgba(0,0,0,.4)',
    lineWidth:1,radius:d=>(d.index===4||d.index===8)?6:3});

  const cl=classify(lm);
  const raw=cl.name;
  const tip=cl.tip;

  // ── Immediate per-frame updates (no debounce) ──
  const {x:px,y:py}=tipToPage(tip);
  // Always show cursor with raw gesture class
  const rawCls={TWO:'two',THREE:'three',PINCH:'pinch',POINT:'point',FIST:'fist',PALM:'palm'}[raw]||'two';
  if(raw!=='NONE') movGc(px,py,rawCls); else hideGc();

  // Card hover: live every frame for TWO
  if(raw==='TWO'&&!gDragging){
    const hovCard=document.elementsFromPoint(px,py)
      .map(el=>el.closest?.('.card')).find(Boolean);
    setHov(hovCard?.dataset?.id||null);
  }
  // Ghost follows hand for THREE while dragging
  if(raw==='THREE'&&gDragging) moveGhost(px,py);

  // Confidence bar
  cwrap.className=raw!=='NONE'?'on':'';
  cfill.style.width=raw!=='NONE'?'90%':'0';
  cfill.style.background={TWO:'var(--g)',THREE:'var(--pu)',PINCH:'var(--g)',
    POINT:'var(--y)',FIST:'var(--r)',PALM:'var(--pu)'}[raw]||'var(--g)';

  // ── Debounce: wait GBUF identical frames before committing ──
  gBuf.push(raw);
  if(gBuf.length>GBUF) gBuf.shift();
  if(!gBuf.every(g=>g===gBuf[0])) return; // still transitioning

  const newG=gBuf[0];
  if(newG===gCur){
    // ── HELD — continuous updates ──
    switch(gCur){
      case 'TWO':
        setHud('two');
        if(gHovId) pill('✌️ HOVER — raise ring finger to grab',false);
        else       pill('✌️ POINT AT A CLIPBOARD CARD',false);
        break;
      case 'THREE':
        setHud(gDragging?'three':'three');
        break;
      case 'PINCH':
        placeCaretAt(px,py); setHud('pinch');
        break;
      case 'POINT':
        extendSel(px,py); setHud('pinch');
        const n=Math.abs((ed.selectionEnd||0)-(ed.selectionStart||0));
        if(n>0) pill('☝️ '+n+' chars',false);
        break;
    }
    return;
  }

  // ── GESTURE CHANGED ──
  const prev=gCur; gCur=newG; gT0=Date.now();

  // Exit previous
  switch(prev){
    case 'POINT':
      ed.classList.remove('sel-mode'); gSelAnc=-1; break;
    case 'THREE':
      // Ring finger curled back (to TWO or anything lower) = DROP
      if(gDragging) dropGhost(px,py);
      break;
    case 'TWO':
      // Only clear hover when not transitioning into a drag grab
      if(!gDragging && newG!=='THREE') setHov(null); break;
  }

  // Enter new
  switch(newG){
    case 'TWO':
      setHud('two'); pill('✌️ HOVER OVER A CLIPBOARD CARD',false); break;

    case 'THREE': {
      const now3=Date.now();
      if(gHovId && now3-gLastAct>=ACT_CD){
        gLastAct=now3;
        startGhostDrag(gHovId,px,py); setHud('three');
      } else if(gDragging){
        setHud('three'); // already dragging, keep moving
      } else {
        // No card hovered or on cooldown — go back to TWO silently
        gCur='TWO';
        if(now3-gLastAct>=ACT_CD){
          pill('🤟 HOVER A CARD WITH ✌️ FIRST',false);
        }
      }
      break;
    }

    case 'PINCH':
      placeCaretAt(px,py); ripple();
      setHud('pinch'); pill('🤏 CURSOR PLACED',false); break;

    case 'POINT':
      gSelAnc=gCarPos; ed.classList.add('sel-mode');
      setHud('pinch'); pill('☝️ MOVE FINGER TO SELECT',false); break;

    case 'FIST':
      gestCopy(); setHud('fist'); break;

    case 'PALM':
      gestPaste(); setHud('palm'); break;

    default:
      setHud(null); if(!gPillT) gpill.className='';
  }
}

// ══════════════════════════════════════════════════
// CAMERA
// ══════════════════════════════════════════════════
async function startCam(){
  const btn=document.getElementById('cbtn');
  btn.disabled=true; btn.textContent='Requesting…';
  permov.style.display='none'; loadov.style.display='flex';
  try{
    const stream=await navigator.mediaDevices.getUserMedia(
      {video:{width:{ideal:1280},height:{ideal:720},facingMode:'user'}});
    camStream=stream; camvid.srcObject=stream; await camvid.play();
    camRunning=true; dcam.className='dot dg'; scam.textContent='ON';
    document.getElementById('camtoggle').classList.remove('camoff');

    const hands=new Hands({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
    hands.setOptions({maxNumHands:1,modelComplexity:1,
      minDetectionConfidence:.7,minTrackingConfidence:.6});
    hands.onResults(onResults);

    const cam=new Camera(camvid,{
      onFrame:async()=>await hands.send({image:camvid}),width:1280,height:720});
    cam.start();
    loadov.style.display='none';
    toast('📷 Camera active — gestures enabled','tg2');
  } catch(err){
    loadov.style.display='none'; denyov.style.display='flex';
    const ua=navigator.userAgent;
    let fix='';
    if(err.name==='NotAllowedError'||err.name==='PermissionDeniedError'){
      if(/Chrome/.test(ua)&&!/Edg/.test(ua)) fix='<b>Chrome:</b> Click 🔒 in address bar → Camera → <b>Allow</b> → reload';
      else if(/Firefox/.test(ua)) fix='<b>Firefox:</b> Click camera icon → <b>Allow</b>';
      else if(/Safari/.test(ua)) fix='<b>Safari:</b> Safari menu → Settings → Camera → <b>Allow</b>';
      else fix='Click 🔒 in address bar → Camera → <b>Allow</b>';
    } else { fix='Camera unavailable: '+err.name; }
    document.getElementById('fixbox').innerHTML=fix;
    toast('Camera denied — type to send instead','ty2');
  }
}
function retryCam(){
  denyov.style.display='none'; permov.style.display='flex';
  const btn=document.getElementById('cbtn');
  btn.disabled=false; btn.textContent='Enable';
}
function toggleCam(){
  if(camRunning){
    if(camStream){ camStream.getTracks().forEach(t=>t.stop()); camStream=null; }
    camvid.srcObject=null; camRunning=false;
    dcam.className='dot'; scam.textContent='CAM';
    dhand.className='dot'; shand.textContent='HAND';
    cwrap.className=''; gpill.className=''; hideGc();
    hctx.clearRect(0,0,hcvs.width,hcvs.height);
    permov.style.display='flex';
    document.getElementById('camtoggle').classList.add('camoff');
    toast('📷 Camera off','ty2');
  } else {
    document.getElementById('camtoggle').classList.remove('camoff');
    startCam();
  }
}
function togglePip(){
  const pip=document.getElementById('cam-pip');
  const btn=document.getElementById('cpcol');
  const c=pip.classList.toggle('col');
  btn.textContent=c?'+':'−';
}

// ══════════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════════
const urlEl=document.getElementById('mb-url');
if(urlEl) urlEl.textContent=location.href.length>55?location.href.slice(0,55)+'…':location.href;
setupRoom(rand(6));
