const ranks=[
["Рядовой","Казарма · 1-е отделение","Первые шаги к большой цели."],
["Ефрейтор","Казарма · учебный корпус","Первое повышение."],
["Младший сержант","Учебный полигон","Начинается командная подготовка."],
["Сержант","Штаб подразделения","Первые командные задачи."],
["Старший сержант","Командный пункт","Опытный младший командир."],
["Прапорщик","Офицерская часть","Переход к офицерской службе."],
["Младший лейтенант","Кабинет командира","Первое офицерское звание."],
["Лейтенант","Штаб части","Ответственность растёт."],
["Старший лейтенант","Штаб соединения","Новые задачи и полномочия."],
["Капитан","Командный кабинет","Командование подразделением."],
["Майор","Офицерский штаб","Штабная работа."],
["Подполковник","Офицерский штаб","Большая зона ответственности."],
["Полковник","Генеральский штаб","Высший уровень полевого командования."],
["Генерал-майор","Элитный кабинет","Генеральское звание."],
["Генерал-лейтенант","Высший командный кабинет","Высшее командование."],
["Генерал-полковник","Генеральский кабинет","Предельный уровень перед финалом."],
["Генерал армии","Кремлёвский кабинет","Финальное звание."]
];

let rank=Number(localStorage.rank||0), clicks=Number(localStorage.clicks||0);
let energy=Number(localStorage.energy||100), last=Number(localStorage.last||Date.now());
let maxEnergy=Math.min(400,100+rank*15);

function need(i){return 100*(i+1)}
function save(){localStorage.rank=rank;localStorage.clicks=clicks;localStorage.energy=energy;localStorage.last=Date.now()}
function recover(){
  const elapsed=Math.floor((Date.now()-last)/10000);
  if(elapsed>0){energy=Math.min(maxEnergy,energy+elapsed);last=Date.now();save()}
}
function render(){
  recover();
  const [name,place,desc]=ranks[rank];
  document.getElementById("rank").textContent=name;
  document.getElementById("place").textContent=place;
  document.getElementById("description").textContent=desc;
  document.getElementById("level").textContent=rank+1;
  document.getElementById("energy").textContent=energy;
  document.getElementById("maxEnergy").textContent=maxEnergy;
  document.getElementById("maxEnergy2").textContent=maxEnergy;
  document.getElementById("totalClicks").textContent=clicks;
  const base=rank*100, current=Math.max(0,clicks-base), n=need(rank);
  document.getElementById("rankProgress").textContent=Math.min(current,n);
  document.getElementById("rankNeed").textContent=n;
  document.getElementById("energyBar").style.width=(energy/maxEnergy*100)+"%";
  document.getElementById("rankBar").style.width=(Math.min(current,n)/n*100)+"%";
  document.getElementById("clickButton").disabled=energy<=0 || rank===ranks.length-1;
  document.getElementById("nextMini").style.opacity=rank===ranks.length-1?".2":"1";
  renderRanks();
}
function renderRanks(){
 const el=document.getElementById("ranks"); el.innerHTML="";
 ranks.forEach((r,i)=>{
  const d=document.createElement("div");d.className="rank-item"+(i===rank?" active":"");
  d.innerHTML=`<div class="tiny"></div><b>${r[0]}</b><small>${i===ranks.length-1?"Финал":need(i)+" кликов"}</small>`;
  el.appendChild(d);
 });
}
document.getElementById("clickButton").addEventListener("click",()=>{
 if(energy<=0)return;
 energy--;clicks++;
 if(rank<ranks.length-1 && clicks>=need(rank)){
   rank++;maxEnergy=Math.min(400,100+rank*15);energy=Math.min(maxEnergy,energy+15);
 }
 save();render();
});
setInterval(render,1000);render();
