const STORE_EMAIL="rhinstrumental@gmail.com";
const grid=document.querySelector("#grid"),count=document.querySelector("#count"),search=document.querySelector("#search"),genre=document.querySelector("#genre"),mood=document.querySelector("#mood"),sort=document.querySelector("#sort"),bpmMin=document.querySelector("#bpm-min"),bpmMax=document.querySelector("#bpm-max"),clearFilters=document.querySelector("#clear-filters"),empty=document.querySelector("#empty"),beatSelect=document.querySelector("#beat");
let audio=null,playingId=null,progressTimer=null;

[...new Set(BEATS.map(b=>b.genre))].sort().forEach(g=>genre.insertAdjacentHTML("beforeend",`<option value="${g}">${g}</option>`));
BEATS.forEach(b=>beatSelect.insertAdjacentHTML("beforeend",`<option value="${b.id}">${b.name} — ${b.genre} · ${b.bpm} BPM</option>`));
function norm(s){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
function render(){
  const q=norm(search.value);
  const min=bpmMin.value===""?null:Number(bpmMin.value);
  const max=bpmMax.value===""?null:Number(bpmMax.value);
  let list=BEATS.filter(b=>(!q||norm(`${b.name} ${b.genre} ${b.mood} ${b.bpm}`).includes(q))&&(!genre.value||b.genre===genre.value)&&(!mood.value||b.mood===mood.value)&&(min===null||b.bpm>=min)&&(max===null||b.bpm<=max));
  if(sort.value==="low")list.sort((a,b)=>a.bpm-b.bpm);
  if(sort.value==="high")list.sort((a,b)=>b.bpm-a.bpm);
  if(sort.value==="az")list.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort.value==="new")list.sort((a,b)=>(a.index||0)-(b.index||0));
  count.textContent=`${list.length} ${list.length===1?"BEAT":"BEATS"}`;
  grid.innerHTML=list.map(b=>`<article class="card" data-beat="${b.id}">
    <div class="cover" style="background-image:url('covers/${b.id}.jpg');"><span class="id">${b.id}</span><span class="cover-tag">ORIGINAL</span><strong>${b.name}</strong></div>
    <div class="info">
      <div class="row"><span class="name">${b.name}</span><span class="meta bpm">${b.bpm} BPM</span></div>
      <div class="meta details">${b.genre} <i>·</i> ${b.mood}</div>
      <div class="player" id="player-${b.id}">
        <button class="play" data-id="${b.id}" aria-label="Play ${b.name}"><span class="play-icon">▶</span><span class="play-label">PLAY DEMO</span></button>
        <div class="track"><div class="track-bar"><span></span></div><div class="time"><span class="current">0:00</span><span class="duration">0:00</span></div></div>
      </div>
      <button class="request" data-id="${b.id}">REQUEST THIS BEAT <span>→</span></button>
    </div></article>`).join("");
  empty.hidden=list.length!==0;
  document.querySelectorAll(".play").forEach(btn=>btn.onclick=()=>play(btn));
  document.querySelectorAll(".request").forEach(btn=>btn.onclick=()=>{beatSelect.value=btn.dataset.id;document.querySelector("#contact").scrollIntoView({behavior:"smooth",block:"start"});setTimeout(()=>document.querySelector("#name")?.focus(),650)});
}
function resetPlayer(){
  clearInterval(progressTimer);progressTimer=null;
  document.querySelectorAll(".play").forEach(btn=>{btn.classList.remove("playing");btn.querySelector(".play-icon")&&(btn.querySelector(".play-icon").textContent="▶");btn.querySelector(".play-label")&&(btn.querySelector(".play-label").textContent="PLAY DEMO")});
  document.querySelectorAll(".track-bar span").forEach(x=>x.style.width="0%");
  document.querySelectorAll(".current").forEach(x=>x.textContent="0:00");
}
function fmt(sec){if(!isFinite(sec))return"0:00";return `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,"0")}`}
function play(btn){
  const b=BEATS.find(x=>x.id===btn.dataset.id);
  if(playingId===b.id&&audio){audio.paused?audio.play():audio.pause();updateButton(btn);return}
  if(audio){audio.pause();audio=null} resetPlayer();
  audio=new Audio(`audio/${b.id}.mp3`);playingId=b.id;btn.classList.add("playing");btn.querySelector(".play-icon").textContent="❚❚";btn.querySelector(".play-label").textContent="PLAYING";
  audio.addEventListener("loadedmetadata",()=>{document.querySelector(`#player-${b.id} .duration`).textContent=fmt(audio.duration)});
  audio.addEventListener("timeupdate",()=>{const pct=audio.duration?(audio.currentTime/audio.duration)*100:0;const p=document.querySelector(`#player-${b.id}`);if(p){p.querySelector(".track-bar span").style.width=`${pct}%`;p.querySelector(".current").textContent=fmt(audio.currentTime)}});
  audio.onended=()=>{audio=null;playingId=null;resetPlayer()};
  audio.play().catch(()=>{alert(`Add ${b.id}.mp3 to the audio folder to activate this demo.`);audio=null;playingId=null;resetPlayer()});
}
function updateButton(btn){if(!audio)return;const paused=audio.paused;btn.classList.toggle("playing",!paused);btn.querySelector(".play-icon").textContent=paused?"▶":"❚❚";btn.querySelector(".play-label").textContent=paused?"PLAY DEMO":"PLAYING"}
// Beat modal — installed once, outside render() so filtering/sorting never breaks it.
grid.addEventListener("click",e=>{
  const target=e.target.closest(".cover,.name");
  if(!target)return;
  const card=target.closest(".card");
  if(!card)return;
  const b=BEATS.find(x=>x.id===card.dataset.beat);
  if(!b)return;
  document.querySelector("#modal-cover").style.backgroundImage=`url("covers/${b.id}.jpg")`;
  document.querySelector("#modal-name").textContent=b.name;
  document.querySelector("#modal-genre").textContent=b.genre;
  document.querySelector("#modal-mood").textContent=b.mood;
  document.querySelector("#modal-bpm").textContent=`${b.bpm} BPM`;
  document.querySelector("#modal-description").textContent = b.description || `${b.genre} instrumental with a ${b.mood.toLowerCase()} atmosphere, built for artists looking for a clean, original production.`;
  document.querySelector("#modal-request").dataset.id=b.id;
  resetModalPlayer();
  modalBeatId=b.id;
  document.querySelector("#beat-modal").classList.add("open");
  document.querySelector("#beat-modal").setAttribute("aria-hidden","false");
});



// Modal audio player — independent from the catalog player.
let modalAudio=null;
let modalBeatId=null;
const modalPlay=document.querySelector("#modal-play");
const modalPlayIcon=document.querySelector("#modal-play-icon");
const modalPlayerLabel=document.querySelector("#modal-player-label");
const modalProgress=document.querySelector("#modal-progress");
const modalCurrent=document.querySelector("#modal-current");
const modalDuration=document.querySelector("#modal-duration");

function modalFmt(sec){if(!isFinite(sec))return"0:00";return `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,"0")}`}
function resetModalPlayer(){
  if(modalAudio){modalAudio.pause();modalAudio=null}
  modalBeatId=null;
  modalPlayIcon.textContent="▶";
  modalPlayerLabel.textContent="PLAY DEMO";
  modalProgress.style.width="0%";
  modalCurrent.textContent="0:00";
  modalDuration.textContent="0:00";
}
function startModalPlayer(id){
  const b=BEATS.find(x=>x.id===id);
  if(!b)return;
  if(modalBeatId===id && modalAudio){
    if(modalAudio.paused){modalAudio.play();modalPlayIcon.textContent="❚❚";modalPlayerLabel.textContent="PLAYING"}
    else{modalAudio.pause();modalPlayIcon.textContent="▶";modalPlayerLabel.textContent="PLAY DEMO"}
    return;
  }
  resetModalPlayer();
  modalBeatId=id;
  modalAudio=new Audio(`audio/${id}.mp3`);
  modalAudio.addEventListener("loadedmetadata",()=>{modalDuration.textContent=modalFmt(modalAudio.duration)});
  modalAudio.addEventListener("timeupdate",()=>{
    const pct=modalAudio.duration?(modalAudio.currentTime/modalAudio.duration)*100:0;
    modalProgress.style.width=`${pct}%`;
    modalCurrent.textContent=modalFmt(modalAudio.currentTime);
  });
  modalAudio.onended=()=>resetModalPlayer();
  modalAudio.play().then(()=>{modalPlayIcon.textContent="❚❚";modalPlayerLabel.textContent="PLAYING"}).catch(()=>{
    alert(`Add ${id}.mp3 to the audio folder to activate this demo.`);
    resetModalPlayer();
  });
}
modalPlay.onclick=()=>{if(modalBeatId)startModalPlayer(modalBeatId)};
document.querySelector(".modal-track").onclick=e=>{
  if(!modalAudio || !modalAudio.duration)return;
  const r=e.currentTarget.getBoundingClientRect();
  modalAudio.currentTime=((e.clientX-r.left)/r.width)*modalAudio.duration;
};

const beatModal=document.querySelector("#beat-modal");
const closeBeatModal=()=>{
  resetModalPlayer();
  beatModal.classList.remove("open");
  beatModal.setAttribute("aria-hidden","true");
};
document.querySelector(".beat-modal-close").onclick=closeBeatModal;
document.querySelector(".beat-modal-backdrop").onclick=closeBeatModal;
document.querySelector("#modal-request").onclick=()=>{
  const id=document.querySelector("#modal-request").dataset.id;
  beatSelect.value=id;
  closeBeatModal();
  document.querySelector("#contact").scrollIntoView({behavior:"smooth",block:"start"});
  setTimeout(()=>document.querySelector("#name")?.focus(),650);
};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&beatModal.classList.contains("open"))closeBeatModal()});

[search,bpmMin,bpmMax].forEach(x=>x.addEventListener("input",render));
[genre,mood,sort].forEach(x=>x.addEventListener("change",render));
clearFilters.onclick=()=>{search.value="";genre.value="";mood.value="";bpmMin.value="";bpmMax.value="";sort.value="new";render();};
document.querySelector("#form").onsubmit=e=>{e.preventDefault();const b=BEATS.find(x=>x.id===beatSelect.value),subject=encodeURIComponent(`Beat Request — ${b?b.name:beatSelect.value}`),body=encodeURIComponent(`Artist / Name: ${document.querySelector("#name").value}\nEmail: ${document.querySelector("#email").value}\nBeat: ${b?b.name+" ("+b.id+")":beatSelect.value}\n\nMessage:\n${document.querySelector("#message").value}`);location.href=`mailto:${STORE_EMAIL}?subject=${subject}&body=${body}`};
render();
