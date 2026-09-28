const STORE_EMAIL="rhinstrumental@gmail.com";
const grid=document.querySelector("#grid"),count=document.querySelector("#count"),search=document.querySelector("#search"),genre=document.querySelector("#genre"),mood=document.querySelector("#mood"),sort=document.querySelector("#sort"),empty=document.querySelector("#empty"),beatSelect=document.querySelector("#beat");
let audio=null,playingId=null,progressTimer=null;

[...new Set(BEATS.map(b=>b.genre))].sort().forEach(g=>genre.insertAdjacentHTML("beforeend",`<option value="${g}">${g}</option>`));
BEATS.forEach(b=>beatSelect.insertAdjacentHTML("beforeend",`<option value="${b.id}">${b.name} — ${b.genre} · ${b.bpm} BPM</option>`));
function norm(s){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
function render(){
  const q=norm(search.value);
  let list=BEATS.filter(b=>(!q||norm(`${b.name} ${b.genre} ${b.mood} ${b.bpm}`).includes(q))&&(!genre.value||b.genre===genre.value)&&(!mood.value||b.mood===mood.value));
  if(sort.value==="low")list.sort((a,b)=>a.bpm-b.bpm);
  if(sort.value==="high")list.sort((a,b)=>b.bpm-a.bpm);
  if(sort.value==="az")list.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort.value==="new")list.sort((a,b)=>(a.index||0)-(b.index||0));
  count.textContent=`${list.length} ${list.length===1?"BEAT":"BEATS"}`;
  grid.innerHTML=list.map(b=>`<article class="card" data-beat="${b.id}">
    <div class="cover" style="--a:${b.colors[0]};--b:${b.colors[1]}"><span class="id">${b.id}</span><span class="cover-tag">ORIGINAL</span><strong>${b.name}</strong></div>
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
[search,genre,mood,sort].forEach(x=>x.addEventListener(x.tagName==="INPUT"?"input":"change",render));
document.querySelector("#form").onsubmit=e=>{e.preventDefault();const b=BEATS.find(x=>x.id===beatSelect.value),subject=encodeURIComponent(`Beat Request — ${b?b.name:beatSelect.value}`),body=encodeURIComponent(`Artist / Name: ${document.querySelector("#name").value}\nEmail: ${document.querySelector("#email").value}\nBeat: ${b?b.name+" ("+b.id+")":beatSelect.value}\n\nMessage:\n${document.querySelector("#message").value}`);location.href=`mailto:${STORE_EMAIL}?subject=${subject}&body=${body}`};
render();
