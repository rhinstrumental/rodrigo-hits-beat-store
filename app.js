const STORE_EMAIL="rhinstrumental@gmail.com";
const grid=document.querySelector("#grid"),count=document.querySelector("#count"),search=document.querySelector("#search"),genre=document.querySelector("#genre"),mood=document.querySelector("#mood"),sort=document.querySelector("#sort"),bpmMin=document.querySelector("#bpm-min"),bpmMax=document.querySelector("#bpm-max"),clearFilters=document.querySelector("#clear-filters"),empty=document.querySelector("#empty"),beatSelect=document.querySelector("#beat"),pagination=document.querySelector("#pagination"),pagePrev=document.querySelector("#page-prev"),pageNext=document.querySelector("#page-next"),pageNumbers=document.querySelector("#page-numbers");
const savedToggle=document.querySelector("#saved-toggle"),viewGrid=document.querySelector("#view-grid"),viewList=document.querySelector("#view-list"),resultsSummary=document.querySelector("#results-summary"),backTop=document.querySelector("#back-top");
let audio=null,playingId=null,progressTimer=null,currentPage=1,viewMode=localStorage.getItem("rh-view")||"grid";
const BEATS_PER_PAGE=12;
let favorites=new Set(JSON.parse(localStorage.getItem("rh-favorites")||"[]"));

[...new Set(BEATS.map(b=>b.genre))].sort().forEach(g=>genre.insertAdjacentHTML("beforeend",`<option value="${g}">${g}</option>`));
BEATS.forEach(b=>beatSelect.insertAdjacentHTML("beforeend",`<option value="${b.id}">${b.name} — ${b.genre} · ${b.bpm} BPM</option>`));
function norm(s){return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
function fmt(sec){if(!isFinite(sec))return"0:00";return `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,"0")}`}
function getFiltered(){
  const q=norm(search.value),min=bpmMin.value===""?null:Number(bpmMin.value),max=bpmMax.value===""?null:Number(bpmMax.value);
  let list=BEATS.filter(b=>(!q||norm(`${b.name} ${b.genre} ${b.mood} ${b.bpm}`).includes(q))&&(!genre.value||b.genre===genre.value)&&(!mood.value||b.mood===mood.value)&&(min===null||b.bpm>=min)&&(max===null||b.bpm<=max));
  if(savedToggle?.classList.contains("active"))list=list.filter(b=>favorites.has(b.id));
  if(sort.value==="low")list.sort((a,b)=>a.bpm-b.bpm);
  if(sort.value==="high")list.sort((a,b)=>b.bpm-a.bpm);
  if(sort.value==="az")list.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort.value==="new")list.sort((a,b)=>(a.index||0)-(b.index||0));
  return list;
}
function favoriteButton(b){return `<button class="favorite-btn${favorites.has(b.id)?" active":""}" data-favorite="${b.id}" aria-label="${favorites.has(b.id)?"Remove":"Save"} ${b.name} from favorites" aria-pressed="${favorites.has(b.id)}">${favorites.has(b.id)?"♥":"♡"}</button>`}
function render(){
  const list=getFiltered(),total=list.length,totalPages=Math.max(1,Math.ceil(total/BEATS_PER_PAGE));
  if(currentPage>totalPages)currentPage=totalPages;
  const start=(currentPage-1)*BEATS_PER_PAGE,pageList=list.slice(start,start+BEATS_PER_PAGE);
  count.textContent=`${total} ${total===1?"BEAT":"BEATS"}`;
  if(resultsSummary)resultsSummary.textContent=total?`Showing ${start+1}–${Math.min(start+BEATS_PER_PAGE,total)} of ${total}`:"No matching beats";
  grid.classList.toggle("list-view",viewMode==="list");
  grid.innerHTML=pageList.map(b=>`<article class="card" data-beat="${b.id}">
    <div class="cover" style="background-image:url('covers/${b.id}.jpg');"><span class="id">${b.id}</span><span class="cover-tag">ORIGINAL</span>${favoriteButton(b)}<strong>${b.name}</strong></div>
    <div class="info"><div class="row"><span class="name">${b.name}</span><span class="meta bpm">${b.bpm} BPM</span></div><div class="meta details">${b.genre} <i>·</i> ${b.mood}</div>
      <div class="player" id="player-${b.id}"><button class="play" data-id="${b.id}" aria-label="Play ${b.name}"><span class="play-icon">▶</span><span class="play-label">PLAY DEMO</span></button><div class="track"><div class="track-bar"><span></span></div><div class="time"><span class="current">0:00</span><span class="duration">0:00</span></div></div></div>
      <button class="request" data-id="${b.id}">REQUEST THIS BEAT <span>→</span></button>
    </div></article>`).join("");
  empty.hidden=total!==0;
  renderPagination(totalPages,total);
  document.querySelectorAll(".play").forEach(btn=>btn.onclick=e=>{e.stopPropagation();play(btn)});
  document.querySelectorAll(".request").forEach(btn=>btn.onclick=e=>{e.stopPropagation();requestBeat(btn.dataset.id)});
  document.querySelectorAll(".favorite-btn").forEach(btn=>btn.onclick=e=>{e.stopPropagation();toggleFavorite(btn.dataset.favorite)});
}
function renderPagination(totalPages,total){
  pagination.hidden=total<=BEATS_PER_PAGE;
  pagePrev.disabled=currentPage<=1;pageNext.disabled=currentPage>=totalPages;pageNumbers.innerHTML="";
  const pages=[];if(totalPages<=5){for(let i=1;i<=totalPages;i++)pages.push(i)}else{pages.push(1);if(currentPage>3)pages.push("...");for(let i=Math.max(2,currentPage-1);i<=Math.min(totalPages-1,currentPage+1);i++)pages.push(i);if(currentPage<totalPages-2)pages.push("...");pages.push(totalPages)}
  pages.forEach(p=>{if(p==="..."){pageNumbers.insertAdjacentHTML("beforeend",`<span class="page-dots">…</span>`);return}const b=document.createElement("button");b.type="button";b.className=`page-number${p===currentPage?" active":""}`;b.textContent=p;b.setAttribute("aria-label",`Page ${p}`);if(p===currentPage)b.setAttribute("aria-current","page");b.onclick=()=>{currentPage=p;render();scrollToStore()};pageNumbers.appendChild(b)});
}
function scrollToStore(){document.querySelector("#store").scrollIntoView({behavior:"smooth",block:"start"})}
function resetPlayer(){clearInterval(progressTimer);progressTimer=null;document.querySelectorAll(".play").forEach(btn=>{btn.classList.remove("playing");btn.querySelector(".play-icon")?.replaceChildren(document.createTextNode("▶"));btn.querySelector(".play-label")?.replaceChildren(document.createTextNode("PLAY DEMO"))});document.querySelectorAll(".track-bar span").forEach(x=>x.style.width="0%");document.querySelectorAll(".current").forEach(x=>x.textContent="0:00")}
function play(btn){const b=BEATS.find(x=>x.id===btn.dataset.id);if(!b)return;if(playingId===b.id&&audio){audio.paused?audio.play():audio.pause();updateButton(btn);return}if(audio){audio.pause();audio=null}resetPlayer();audio=new Audio(`audio/${b.id}.mp3`);playingId=b.id;btn.classList.add("playing");btn.querySelector(".play-icon").textContent="❚❚";btn.querySelector(".play-label").textContent="PLAYING";audio.addEventListener("loadedmetadata",()=>{const d=document.querySelector(`#player-${b.id} .duration`);if(d)d.textContent=fmt(audio.duration)});audio.addEventListener("timeupdate",()=>{const p=document.querySelector(`#player-${b.id}`);if(p){p.querySelector(".track-bar span").style.width=`${(audio.currentTime/audio.duration)*100}%`;p.querySelector(".current").textContent=fmt(audio.currentTime)}});audio.onended=()=>{audio=null;playingId=null;resetPlayer()};audio.play().catch(()=>{alert(`Add ${b.id}.mp3 to the audio folder to activate this demo.`);audio=null;playingId=null;resetPlayer()})}
function updateButton(btn){if(!audio)return;const paused=audio.paused;btn.classList.toggle("playing",!paused);btn.querySelector(".play-icon").textContent=paused?"▶":"❚❚";btn.querySelector(".play-label").textContent=paused?"PLAY DEMO":"PLAYING"}
document.querySelectorAll(".track-bar").forEach(()=>{});
grid.addEventListener("click",e=>{const fav=e.target.closest(".favorite-btn");if(fav)return;const target=e.target.closest(".cover,.name");if(!target)return;const card=target.closest(".card");if(card)openModal(card.dataset.beat)});
document.addEventListener("click",e=>{const bar=e.target.closest(".track-bar");if(!bar||!audio||!audio.duration)return;const r=bar.getBoundingClientRect();audio.currentTime=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*audio.duration});
function toggleFavorite(id){if(favorites.has(id))favorites.delete(id);else favorites.add(id);localStorage.setItem("rh-favorites",JSON.stringify([...favorites]));updateFavoriteCount();render()}
function updateFavoriteCount(){if(savedToggle)savedToggle.innerHTML=`♡ SAVED <span>${favorites.size}</span>`}
function requestBeat(id){beatSelect.value=id;document.querySelector("#contact").scrollIntoView({behavior:"smooth",block:"start"});setTimeout(()=>document.querySelector("#name")?.focus(),650)}
// Modal
const beatModal=document.querySelector("#beat-modal"),modalCover=document.querySelector("#modal-cover"),modalName=document.querySelector("#modal-name"),modalGenre=document.querySelector("#modal-genre"),modalMood=document.querySelector("#modal-mood"),modalBpm=document.querySelector("#modal-bpm"),modalRequest=document.querySelector("#modal-request"),modalPlay=document.querySelector("#modal-play"),modalPlayIcon=document.querySelector("#modal-play-icon"),modalLabel=document.querySelector("#modal-player-label"),modalProgress=document.querySelector("#modal-progress"),modalCurrent=document.querySelector("#modal-current"),modalDuration=document.querySelector("#modal-duration"),modalPrev=document.querySelector("#modal-prev"),modalNext=document.querySelector("#modal-next");
let modalAudio=null,modalBeatId=null;
function modalFmt(sec){return fmt(sec)}
function resetModalPlayer(){if(modalAudio){modalAudio.pause();modalAudio=null}modalPlayIcon.textContent="▶";modalLabel.textContent="PLAY DEMO";modalProgress.style.width="0%";modalCurrent.textContent="0:00";modalDuration.textContent="0:00"}
function startModalPlayer(id){if(modalBeatId!==id)return;if(modalAudio){modalAudio.paused?modalAudio.play():modalAudio.pause();updateModalButton();return}modalAudio=new Audio(`audio/${id}.mp3`);modalAudio.addEventListener("loadedmetadata",()=>modalDuration.textContent=modalFmt(modalAudio.duration));modalAudio.addEventListener("timeupdate",()=>{modalProgress.style.width=`${(modalAudio.currentTime/modalAudio.duration)*100}%`;modalCurrent.textContent=modalFmt(modalAudio.currentTime)});modalAudio.onended=()=>resetModalPlayer();modalAudio.play().then(updateModalButton).catch(()=>{alert(`Add ${id}.mp3 to the audio folder to activate this demo.`);resetModalPlayer()})}
function updateModalButton(){const paused=modalAudio?.paused;modalPlayIcon.textContent=paused?"▶":"❚❚";modalLabel.textContent=paused?"PLAY DEMO":"PLAYING"}
function getModalList(){return getFiltered()}
function updateModalNavigation(){const list=getModalList(),i=list.findIndex(b=>b.id===modalBeatId);modalPrev.disabled=i<=0;modalNext.disabled=i<0||i>=list.length-1}
function showBeatInModal(id){const b=BEATS.find(x=>x.id===id);if(!b)return;resetModalPlayer();modalBeatId=id;modalCover.style.backgroundImage=`url("covers/${b.id}.jpg")`;modalName.textContent=b.name;modalGenre.textContent=b.genre;modalMood.textContent=b.mood;modalBpm.textContent=`${b.bpm} BPM`;modalRequest.dataset.id=b.id;updateModalNavigation()}
function openModal(id){showBeatInModal(id);beatModal.classList.add("open");beatModal.setAttribute("aria-hidden","false");document.body.classList.add("modal-open")}
function closeModal(){resetModalPlayer();modalBeatId=null;beatModal.classList.remove("open");beatModal.setAttribute("aria-hidden","true");document.body.classList.remove("modal-open")}
modalPlay.onclick=()=>startModalPlayer(modalBeatId);document.querySelector(".modal-track").onclick=e=>{if(!modalAudio?.duration)return;const r=e.currentTarget.getBoundingClientRect();modalAudio.currentTime=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*modalAudio.duration};
modalPrev.onclick=()=>{const l=getModalList(),i=l.findIndex(b=>b.id===modalBeatId);if(i>0){showBeatInModal(l[i-1].id)}};modalNext.onclick=()=>{const l=getModalList(),i=l.findIndex(b=>b.id===modalBeatId);if(i>=0&&i<l.length-1)showBeatInModal(l[i+1].id)};
document.querySelector(".beat-modal-close").onclick=closeModal;document.querySelector(".beat-modal-backdrop").onclick=closeModal;modalRequest.onclick=()=>{const id=modalRequest.dataset.id;closeModal();requestBeat(id)};document.addEventListener("keydown",e=>{if(e.key==="Escape"&&beatModal.classList.contains("open"))closeModal();if(beatModal.classList.contains("open")&&e.key==="ArrowLeft"&&!modalPrev.disabled)modalPrev.click();if(beatModal.classList.contains("open")&&e.key==="ArrowRight"&&!modalNext.disabled)modalNext.click()});
// Controls
[search,bpmMin,bpmMax].forEach(x=>x.addEventListener("input",()=>{currentPage=1;render()}));[genre,mood,sort].forEach(x=>x.addEventListener("change",()=>{currentPage=1;render()}));clearFilters.onclick=()=>{search.value="";genre.value="";mood.value="";bpmMin.value="";bpmMax.value="";sort.value="new";savedToggle?.classList.remove("active");currentPage=1;render()};savedToggle?.addEventListener("click",()=>{savedToggle.classList.toggle("active");currentPage=1;render()});
viewGrid?.addEventListener("click",()=>{viewMode="grid";localStorage.setItem("rh-view",viewMode);viewGrid.classList.add("active");viewList.classList.remove("active");render()});viewList?.addEventListener("click",()=>{viewMode="list";localStorage.setItem("rh-view",viewMode);viewList.classList.add("active");viewGrid.classList.remove("active");render()});
pagePrev.onclick=()=>{if(currentPage>1){currentPage--;render();scrollToStore()}};pageNext.onclick=()=>{const t=Math.ceil(getFiltered().length/BEATS_PER_PAGE);if(currentPage<t){currentPage++;render();scrollToStore()}};backTop?.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
document.querySelector("#form").onsubmit=e=>{e.preventDefault();const b=BEATS.find(x=>x.id===beatSelect.value),subject=encodeURIComponent(`Beat Request — ${b?b.name:beatSelect.value}`),body=encodeURIComponent(`Artist / Name: ${document.querySelector("#name").value}\nEmail: ${document.querySelector("#email").value}\nBeat: ${b?b.name+" ("+b.id+")":beatSelect.value}\n\nMessage:\n${document.querySelector("#message").value}`);location.href=`mailto:${STORE_EMAIL}?subject=${subject}&body=${body}`};
if(viewMode==="list"){viewList?.classList.add("active");viewGrid?.classList.remove("active")}else{viewGrid?.classList.add("active");viewList?.classList.remove("active")}
updateFavoriteCount();render();
