const R=["Рядовой","Ефрейтор","Младший сержант","Сержант","Старший сержант","Прапорщик","Младший лейтенант","Лейтенант","Старший лейтенант","Капитан","Майор","Подполковник","Полковник","Генерал-майор","Генерал-лейтенант","Генерал-полковник","Генерал армии"];
const NEED=[500,1000,2000,3000,5000,7000,10000,14000,18000,23000,30000,40000,55000,70000,90000,120000,150000];
const LOC=[["Казарма","Базовая локация",0],["Штаб подразделения","Первое командование",2],["Военный полигон","Тактическая зона",4],["Офицерская часть","Офицерская зона",5],["Командный центр","Оперативное управление",8],["Генеральный штаб","Высшее командование",12],["Кремлёвский кабинет","Финальная зона",16]];
const BUILDINGS=[["Казарма",2,0,1000],["Тренировочный центр",8,2,3000],["Командный центр",25,8,8000],["Военная академия",60,12,20000],["Генеральный штаб",150,16,50000]];
const MISSIONS=[
["patrol","Патруль территории","Охрана периметра и контроль сектора.",1,500,3,2,0,90000],
["training","Тактическая подготовка","Отработка действий отделения.",4,1200,8,5,1,180000],
["operation","Оперативная задача","Сложная задача в зоне ответственности.",7,3000,15,10,1,300000],
["command","Командная операция","Управление несколькими подразделениями.",10,7000,30,20,2,600000],
["strategy","Стратегическая операция","Задача уровня высшего командования.",14,18000,60,50,4,1200000]
];
const SHOP=[["energy","Резерв энергии","Восстанавливает 25 энергии.",800,"energy",25],["prestige","Знак отличия","Добавляет 25 престижа.",2500,"prestige",25],["medal","Памятная медаль","Добавляет 1 медаль.",6000,"medals",1],["uniform","Парадная форма","Коллекционный предмет офицера.",12000,"item","Парадная форма"],["office","Кабинет командира","Коллекционный предмет высшего штаба.",25000,"item","Кабинет командира"]];
const ACHIEVEMENTS=[
["first_training","Первый шаг","Провести первую тренировку.",s=>s.clicks>=1],
["hundred","Первая сотня","Набрать 100 тренировок.",s=>s.clicks>=100],
["thousand","Тысяча","Набрать 1 000 тренировок.",s=>s.clicks>=1000],
["mission_5","Оперативник","Завершить 5 миссий.",s=>s.missionsCompleted>=5],
["mission_25","Ветеран операций","Завершить 25 миссий.",s=>s.missionsCompleted>=25],
["collector","Коллекционер","Собрать 3 предмета.",s=>s.items.length>=3],
["prestige_100","Авторитет","Набрать 100 престижа.",s=>s.prestige>=100],
["medals_10","Награждённый","Получить 10 медалей.",s=>s.medals>=10],
["rich","Казначей","Накопить 100 000 кредитов.",s=>s.credits>=100000],
["general","Генерал армии","Достичь высшего звания.",s=>s.rank>=16]
];
const KEY="putOfitserGame_all_v3";
const DEFAULT={rank:0,clicks:0,energy:100,credits:12450,prestige:0,medals:0,missionsCompleted:0,missionDone:{},missionStats:{},buildings:[0,0,0,0,0],items:[],achievements:[],daily:{date:"",training:0,target:10,claimed:false},lastEnergyAt:Date.now(),lastIncomeAt:Date.now(),notice:"Добро пожаловать, офицер!"};
let S=load();

function load(){
 try{
  const raw=localStorage.getItem(KEY);
  if(!raw)return JSON.parse(JSON.stringify(DEFAULT));
  const x=JSON.parse(raw);
  return {...JSON.parse(JSON.stringify(DEFAULT)),...x,missionDone:x.missionDone||{},missionStats:x.missionStats||{},buildings:Array.isArray(x.buildings)?x.buildings:[0,0,0,0,0],items:Array.isArray(x.items)?x.items:[],achievements:Array.isArray(x.achievements)?x.achievements:[],daily:{...DEFAULT.daily,...(x.daily||{})}};
 }catch(e){return JSON.parse(JSON.stringify(DEFAULT))}
}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function dailyReset(){if(S.daily.date!==today()){S.daily={date:today(),training:0,target:10,claimed:false};save()}}
function rankFromClicks(){let r=0;for(let i=0;i<NEED.length;i++){if(S.clicks>=NEED[i])r=i;else break}return Math.min(r,16)}
function maxEnergy(){return Math.min(400,100+S.rank*15)}
function income(){return S.buildings.reduce((a,l,i)=>a+BUILDINGS[i][1]*l,0)}
function energyTick(){const now=Date.now(),gain=Math.floor(Math.max(0,now-(S.lastEnergyAt||now))/10000);if(gain){S.energy=Math.min(maxEnergy(),S.energy+gain);S.lastEnergyAt=now-((Math.max(0,now-(S.lastEnergyAt||now)))%10000)}}
function incomeTick(){const now=Date.now(),elapsed=Math.max(0,now-(S.lastIncomeAt||now)),mins=Math.floor(elapsed/60000);if(mins){const add=mins*income();if(add)S.credits+=add;S.lastIncomeAt=now-(elapsed%60000)}}
function f(n){return Math.floor(n).toLocaleString("ru-RU")}
function esc(v){return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function txt(id,v){const x=document.getElementById(id);if(x)x.textContent=v}
function msg(t){S.notice=t;const x=document.getElementById("notice");if(x){x.textContent=t;x.classList.remove("show");void x.offsetWidth;x.classList.add("show")}}
function syncRank(){
 const old=S.rank,newRank=rankFromClicks();
 if(newRank>old){S.rank=newRank;S.medals+=newRank-old;S.energy=Math.min(maxEnergy(),S.energy+(newRank-old)*10);msg(`Повышение! Новое звание: ${R[newRank]}.`)}
 else S.rank=newRank
}
function train(){
 energyTick();
 if(S.energy<1){msg("Недостаточно энергии. Подождите восстановления.");render();return}
 const before=S.rank;
 S.energy--;S.clicks++;S.credits+=120;S.prestige++;S.daily.training++;
 syncRank();save();achievements();
 msg(S.rank>before?`🎖️ Новое звание: ${R[S.rank]}!`:"Тренировка выполнена: +120 кредитов.");
 render()
}
function remaining(id){return Math.max(0,(S.missionDone[id]||0)-Date.now())}
function time(ms){const s=Math.ceil(ms/1000),m=Math.floor(s/60);return m?`${m} мин ${String(s%60).padStart(2,"0")} сек`:`${s} сек`}
function mission(id){
 energyTick();
 const m=MISSIONS.find(x=>x[0]===id);if(!m)return;
 if(S.rank<m[3]){msg(`Миссия откроется со звания «${R[m[3]]}».`);return}
 if(remaining(id)>0){msg(`Доступна через ${time(remaining(id))}.`);return}
 if(S.energy<m[5]){msg(`Нужно ${m[5]} энергии.`);return}
 S.energy-=m[5];S.credits+=m[4];S.prestige+=m[6];S.medals+=m[7];S.missionsCompleted++;S.missionDone[id]=Date.now()+m[8];S.missionStats[id]=(S.missionStats[id]||0)+1;
 save();achievements();msg(`${m[1]} выполнена: +${f(m[4])} кредитов.`);render()
}
function cost(i){return Math.floor(BUILDINGS[i][3]*Math.pow(1.65,S.buildings[i]||0))}
function upgrade(i){
 const b=BUILDINGS[i],c=cost(i);
 if(S.rank<b[2]){msg(`Здание откроется со звания «${R[b[2]]}».`);return}
 if(S.credits<c){msg(`Нужно ${f(c)} кредитов.`);return}
 S.credits-=c;S.buildings[i]++;save();achievements();msg(`${b[0]} улучшена до уровня ${S.buildings[i]}.`);render()
}
function buy(id){
 const x=SHOP.find(a=>a[0]===id);if(!x)return;
 if(S.credits<x[3]){msg(`Нужно ${f(x[3])} кредитов.`);return}
 if(x[4]==="item"&&S.items.includes(x[5])){msg("Этот предмет уже есть.");return}
 S.credits-=x[3];
 if(x[4]==="energy")S.energy=Math.min(maxEnergy(),S.energy+x[5]);
 if(x[4]==="prestige")S.prestige+=x[5];
 if(x[4]==="medals")S.medals+=x[5];
 if(x[4]==="item")S.items.push(x[5]);
 save();achievements();msg(`Покупка выполнена: ${x[1]}.`);render()
}
function achievements(){
 for(const a of ACHIEVEMENTS)if(!S.achievements.includes(a[0])&&a[3](S)){S.achievements.push(a[0]);msg(`🏅 Достижение: ${a[1]}!`)}
 save()
}
function dailyBonus(){
 dailyReset();
 if(S.daily.claimed){msg("Ежедневный бонус уже получен.");return}
 if(S.daily.training<S.daily.target){msg(`Нужно ещё ${S.daily.target-S.daily.training} тренировок.`);return}
 S.daily.claimed=true;S.credits+=3000;S.prestige+=10;S.medals++;save();achievements();msg("🎁 Бонус получен: +3 000 кредитов, +10 престижа, +1 медаль.");render()
}
function renderMissions(){
 const box=document.getElementById("missions");if(!box)return;
 box.innerHTML=MISSIONS.map(m=>{const locked=S.rank<m[3],rem=remaining(m[0]),disabled=locked||rem>0||S.energy<m[5];let st=`🎁 +${f(m[4])} · 💠 +${m[6]}${m[7]?` · 🏅 +${m[7]}`:""}`;if(locked)st=`🔒 ${R[m[3]]}`;else if(rem)st=`⏳ ${time(rem)}`;return `<div class="card mission-card"><div class="card-title">${esc(m[1])}</div><div class="muted">${esc(m[2])}</div><div class="small-row"><span>⚡ ${m[5]}</span><span>${esc(st)}</span></div><button class="gold-btn" data-mission="${m[0]}" ${disabled?"disabled":""}>${locked?"Заблокировано":rem?"На восстановлении":"Выполнить"}</button></div>`}).join("");
 box.querySelectorAll("[data-mission]").forEach(b=>b.onclick=()=>mission(b.dataset.mission))
}
function renderBuildings(){
 const box=document.getElementById("buildings");if(!box)return;
 box.innerHTML=BUILDINGS.map((b,i)=>{const l=S.buildings[i]||0,c=cost(i),locked=S.rank<b[2];return `<div class="card"><div class="card-title">${esc(b[0])}</div><div class="muted">Уровень ${l} · доход +${f(b[1]*l)}/мин</div><div class="small-row"><span>${locked?"🔒 "+esc(R[b[2]]):"💰 "+f(c)}</span><span>+${b[1]}/мин</span></div><button class="gold-btn" data-building="${i}" ${locked||S.credits<c?"disabled":""}>${locked?"Заблокировано":"Улучшить · "+f(c)}</button></div>`}).join("");
 box.querySelectorAll("[data-building]").forEach(b=>b.onclick=()=>upgrade(Number(b.dataset.building)))
}
function renderShop(){
 const box=document.getElementById("shop");if(!box)return;
 box.innerHTML=SHOP.map(x=>{const owned=x[4]==="item"&&S.items.includes(x[5]);return `<div class="card"><div class="card-title">${esc(x[1])}</div><div class="muted">${esc(x[2])}</div><div class="small-row"><span>💰 ${f(x[3])}</span><span>${owned?"✓ В коллекции":""}</span></div><button class="gold-btn" data-shop="${x[0]}" ${owned||S.credits<x[3]?"disabled":""}>${owned?"Получено":"Купить"}</button></div>`}).join("");
 box.querySelectorAll("[data-shop]").forEach(b=>b.onclick=()=>buy(b.dataset.shop))
}
function renderAchievements(){
 const box=document.getElementById("achievements");if(!box)return;
 box.innerHTML=ACHIEVEMENTS.map(a=>{const ok=S.achievements.includes(a[0]);return `<div class="card achievement-card ${ok?"unlocked":""}"><div class="card-title">${ok?"🏅":"🔒"} ${esc(a[1])}</div><div class="muted">${esc(a[2])}</div><div class="small-row"><span>${ok?"Получено":"В процессе"}</span></div></div>`}).join("")
}
function renderCollection(){
 const box=document.getElementById("collection");if(!box)return;
 box.innerHTML=SHOP.filter(x=>x[4]==="item").map(x=>`<div class="card"><div class="card-title">${S.items.includes(x[5])?"🎖️":"▣"} ${esc(x[5])}</div><div class="muted">${S.items.includes(x[5])?"Предмет в коллекции":"Предмет ещё не получен"}</div></div>`).join("")
}
function renderLocations(){
 const box=document.getElementById("locations");if(!box)return;
 box.innerHTML=LOC.map((x,i)=>{const ok=S.rank>=x[2];return `<div class="card"><div class="card-title">${ok?"📍":"🔒"} ${esc(x[0])}</div><div class="muted">${esc(x[1])}</div><div class="small-row"><span>${ok?"Доступна":"Требуется: "+esc(R[x[2]])}</span><span>Зона ${i+1}</span></div></div>`}).join("")
}
function render(){
 incomeTick();energyTick();syncRank();dailyReset();
 txt("rank",R[S.rank]);txt("level",`Уровень ${S.rank+1}`);txt("credits",f(S.credits));txt("prestige",f(S.prestige));txt("medals",f(S.medals));txt("energy",`${f(S.energy)}/${f(maxEnergy())}`);txt("clicks",f(S.clicks));
 const next=S.rank<16?NEED[S.rank+1]:NEED[16],prev=S.rank?NEED[S.rank]:0,p=S.rank>=16?100:Math.max(0,Math.min(100,((S.clicks-prev)/(next-prev))*100));const bar=document.getElementById("rankProgress");if(bar)bar.style.width=p+"%";txt("rankNext",S.rank>=16?"Максимальное звание":`До «${R[S.rank+1]}»: ${f(Math.max(0,next-S.clicks))}`);txt("incomePerMinute",`+${f(income())} / мин`);
 const db=document.getElementById("dailyBar");if(db)db.style.width=Math.min(100,S.daily.training/S.daily.target*100)+"%";txt("dailyProgress",`${S.daily.training}/${S.daily.target}`);const dc=document.getElementById("dailyClaim");if(dc){dc.disabled=S.daily.claimed||S.daily.training<S.daily.target;dc.textContent=S.daily.claimed?"Бонус получен":"Забрать бонус"}
 renderMissions();renderBuildings();renderShop();renderAchievements();renderCollection();renderLocations();save()
}
document.querySelectorAll("[data-screen]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-screen]").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll("[data-screen-panel]").forEach(x=>x.hidden=x.dataset.screenPanel!==b.dataset.screen)});
document.getElementById("trainBtn").onclick=train;
document.getElementById("dailyClaim").onclick=dailyBonus;
dailyReset();render();setInterval(render,1000);
