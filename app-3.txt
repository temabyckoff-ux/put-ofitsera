const R=[
["Рядовой","Казарма · 1-е отделение","Первые шаги к большой цели."],["Ефрейтор","Казарма · 2-е отделение","Первые обязанности."],["Младший сержант","Штаб подразделения","Первые командные задачи."],["Сержант","Штаб подразделения","Уверенное продвижение по службе."],["Старший сержант","Командный пункт","Опытный военнослужащий."],["Прапорщик","Офицерская часть","Переход к новым задачам."],["Младший лейтенант","Офицерский корпус","Начало офицерской карьеры."],["Лейтенант","Тактический центр","Командование подразделением."],["Старший лейтенант","Командный центр","Серьёзная ответственность."],["Капитан","Штаб соединения","Командир среднего звена."],["Майор","Оперативный штаб","Оперативное управление."],["Подполковник","Штаб округа","Высокий уровень командования."],["Полковник","Главный штаб","Командование крупными силами."],["Генерал-майор","Военное командование","Высший командный уровень."],["Генерал-лейтенант","Генеральный штаб","Стратегическое управление."],["Генерал-полковник","Высшее командование","Высшая школа командования."],["Генерал армии","Кремлёвский кабинет","Финальное звание."]];
const LOC=[["🪖","Казарма",0],["🏢","Штаб подразделения",1],["🎯","Военный полигон",2],["🏛️","Офицерская часть",5],["🛰️","Командный центр",8],["🏛️","Генеральный штаб",12]];
const B=[["🏚️","Казарма",2,0,"hq"],["🏋️","Тренировочный центр",8,2,"training"],["🎯","Полигон",15,5,"range"],["🛰️","Командный центр",25,8,"command"]];
const KEY="putOfitsera_v5";
const XP_TO_RANK=[100,300,600,900,1200,1500,1800,2200,2600,3000,3500,4000,4500,5000,6000,7000];
const D={rank:0,xp:0,energy:100,credits:12450,prestige:0,medals:0,training:0,bonus:false,buildings:{hq:1,training:0,range:0,command:0}};
let S=load();
function load(){try{return Object.assign({},D,JSON.parse(localStorage.getItem(KEY)||"null")||{})}catch(e){return {...D}}}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
function maxE(){return Math.min(400,100+S.rank*15)}
function set(id,v){const e=document.getElementById(id);if(e)e.textContent=v}
function note(t){const e=document.getElementById("toast");e.textContent=t;e.classList.add("show");clearTimeout(note.t);note.t=setTimeout(()=>e.classList.remove("show"),2200)}
function rankStart(i){return i<=0?0:XP_TO_RANK[i-1]}
function promote(){
 let p=false;
 while(S.rank<R.length-1&&S.xp>=XP_TO_RANK[S.rank]){
   S.rank++;
   S.energy=Math.min(maxE(),S.energy+15);
   S.prestige+=10;
   p=true;
 }
 return p;
}
function render(){
 const m=maxE(),r=R[S.rank];S.energy=Math.min(m,Math.max(0,S.energy));
 const target=S.rank===R.length-1?0:XP_TO_RANK[S.rank];
 const start=rankStart(S.rank);
 const progress=S.rank===R.length-1?target:S.xp-start;
 const need=S.rank===R.length-1?target:target-start;
 set("rank",r[0]);set("place",r[1]);set("description",r[2]);set("level",S.rank+1);
 set("energy",S.energy);set("maxEnergy",m);set("credits",S.credits.toLocaleString("ru-RU"));set("prestige",S.prestige);set("medals",S.medals);set("rankProgress",progress);set("rankNeed",need);set("dailyCount",Math.min(5,S.training)+"/5");
 const eb=document.getElementById("energyBar");if(eb)eb.style.width=(S.energy/m*100)+"%";
 const rb=document.getElementById("rankBar");if(rb)rb.style.width=(S.rank===R.length-1?100:Math.max(0,Math.min(100,progress/need*100)))+"%";
 const bt=document.getElementById("clickButton");if(bt)bt.disabled=S.energy<=0||S.rank===R.length-1;
 const bb=document.getElementById("bonusBtn");if(bb){bb.disabled=S.bonus;bb.textContent=S.bonus?"ПОЛУЧЕН":"ЗАБРАТЬ"}
 renderMap();renderHQ();renderRanks();renderAch();save()
}
function train(){
 if(S.energy<=0)return note("⚡ Энергия закончилась. +1 каждые 10 секунд.");
 if(S.rank===R.length-1)return note("🎖️ Достигнуто максимальное звание.");
 const old=S.rank;
 S.energy--;
 S.xp+=10;
 S.credits+=120;
 S.training++;
 const p=promote();
 render();
 note(p&&S.rank>old?"🎖️ Повышение! "+R[S.rank][0]:"🏅 +10 XP · +120 кредитов");
}
function bonus(){if(S.bonus)return note("🎁 Бонус уже получен.");S.credits+=500;S.medals++;S.bonus=true;render();note("🎁 +500 кредитов · +1 медаль")}
function renderMap(){const e=document.getElementById("mapList");if(!e)return;e.innerHTML="";LOC.forEach(x=>{const ok=S.rank>=x[2],d=document.createElement("div");d.className="location"+(ok?"":" locked");d.innerHTML='<div class="emoji">'+x[0]+'</div><div class="copy"><b>'+x[1]+'</b><small>'+(ok?"Локация доступна":"Требуется "+R[x[2]][0])+'</small></div><span class="pill">'+(ok?"ОТКРЫТО":"ЗАКРЫТО")+"</span>";e.appendChild(d)})}
function income(){let n=0;B.forEach(x=>{if(S.buildings[x[4]]>0)n+=x[2]});return n}
function renderHQ(){const e=document.getElementById("hqList");if(!e)return;e.innerHTML="";B.forEach(x=>{const ok=S.rank>=x[3],lv=S.buildings[x[4]]||0,d=document.createElement("div");d.className="building"+(ok?"":" locked");d.innerHTML='<div class="copy"><b>'+x[0]+' '+x[1]+'</b><small>Доход +'+x[2]+'/мин · Уровень '+lv+'</small></div><span class="pill">'+(ok?"УЛУЧШИТЬ":"С "+R[x[3]][0])+"</span>";if(ok)d.onclick=()=>upgrade(x[4],x[1]);e.appendChild(d)});set("hqIncome","+"+income()+"/мин")}
function upgrade(k,name){const lv=S.buildings[k]||0,cost=1000*(lv+1);if(S.credits<cost)return note("💰 Нужно "+cost.toLocaleString("ru-RU")+" кредитов.");S.credits-=cost;S.buildings[k]=lv+1;if(lv===0)S.medals++;render();note("🏢 "+name+" улучшен до уровня "+(lv+1))}
function renderRanks(){const e=document.getElementById("ranks");if(!e)return;e.innerHTML="";R.forEach((x,i)=>{const d=document.createElement("div");d.className="rank-item"+(i===S.rank?" active":"");d.innerHTML='<div><b>'+x[0]+'</b><small>'+x[1]+'</small></div><span class="pill">'+(i<S.rank?"ПРОЙДЕНО":i===S.rank?"ТЕКУЩЕЕ":"ЗАКРЫТО")+"</span>";e.appendChild(d)})}
function renderAch(){const e=document.getElementById("achievements");if(!e)return;const a=[["🎖️","Первое повышение","Новое звание",S.rank>=1],["⚡","Дисциплина","10 тренировок",S.training>=10],["💰","Капитал","20 000 кредитов",S.credits>=20000],["🏢","Строитель","Улучшить объект",Object.values(S.buildings).some(v=>v>1)],["⭐","Престиж","50 престижа",S.prestige>=50]];e.innerHTML="";a.forEach(x=>{const d=document.createElement("div");d.className="achievement"+(x[3]?" done":"");d.innerHTML='<div class="badge">'+x[0]+'</div><div class="copy"><b>'+x[1]+'</b><small>'+x[2]+'</small></div><span class="pill">'+(x[3]?"ПОЛУЧЕНО":"В ПРОЦЕССЕ")+"</span>";e.appendChild(d)})}
function nav(){document.querySelectorAll(".nav-btn").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("active",s.dataset.screen===b.dataset.target));document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x===b));window.scrollTo(0,0)}))}
document.addEventListener("DOMContentLoaded",()=>{document.getElementById("clickButton").addEventListener("click",train);document.getElementById("bonusBtn").addEventListener("click",bonus);nav();render();setInterval(()=>{if(S.energy<maxE()){S.energy++;render()}},10000)})
