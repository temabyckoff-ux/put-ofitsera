(() => {
  const API = window.PUT_OFITSERA_API || "https://put-ofitsera.tema-byckoff.workers.dev";
  const KEY = "putOfitserGame_all_v3";
  let lastSnapshot = "";
  let lastAdminLoad = 0;
  const tg = () => window.Telegram?.WebApp;
  const esc = (v) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const n = (v) => Math.floor(Number(v) || 0).toLocaleString("ru-RU");
  const rankNames = ["Рядовой","Ефрейтор","Младший сержант","Сержант","Старший сержант","Прапорщик","Младший лейтенант","Лейтенант","Старший лейтенант","Капитан","Майор","Подполковник","Полковник","Генерал-майор","Генерал-лейтенант","Генерал-полковник","Генерал армии"];
  function state(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}}
  function snapshot(){
    const s=state();
    const attack=Number(document.getElementById("attack")?.textContent||10)||10;
    const defense=Number(document.getElementById("defense")?.textContent||10)||10;
    const power=Number(document.getElementById("power")?.textContent||(attack+defense))||(attack+defense);
    return {rank:Number(s.rank)||0,clicks:Number(s.clicks)||0,credits:Number(s.credits)||0,prestige:Number(s.prestige)||0,medals:Number(s.medals)||0,missionsCompleted:Number(s.missionsCompleted)||0,achievements:Array.isArray(s.achievements)?s.achievements.length:0,items:Array.isArray(s.items)?s.items.length:0,energy:Number(s.energy)||0,rating:Number(s.rating)||1000,wins:Number(s.wins)||0,losses:Number(s.losses)||0,attack,defense,power};
  }
  async function sync(force=false){
    const webApp=tg();if(!webApp?.initData)return;
    const data=snapshot(),key=JSON.stringify(data);if(!force&&key===lastSnapshot)return;
    try{const r=await fetch(`${API}/api/player/sync`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({initData:webApp.initData,stats:data})});if(r.ok)lastSnapshot=key}catch(_){ }
  }
  function ensureStyles(){
    if(document.getElementById("socialStyles"))return;
    const style=document.createElement("style");style.id="socialStyles";style.textContent=`
      .social-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}.social-stat{padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.025)}.social-stat b{display:block;font-size:20px;margin-top:4px}.social-stat small{color:#9ba6b2}.social-table{overflow:auto;border-radius:14px;border:1px solid rgba(255,255,255,.08)}.social-row{display:grid;grid-template-columns:42px minmax(150px,1.5fr) 1fr 1fr 1fr 1fr;gap:8px;align-items:center;padding:11px 12px;border-bottom:1px solid rgba(255,255,255,.06);min-width:620px}.social-row:last-child{border-bottom:0}.social-row.head{font-size:11px;text-transform:uppercase;color:#8994a1}.social-name{font-weight:700}.social-muted{color:#9ba6b2;font-size:12px}.social-admin{margin-top:18px}.social-btn{border:1px solid rgba(216,182,90,.35);background:#17140d;color:#e8c96d;border-radius:10px;padding:9px 12px;cursor:pointer}.social-btn.active{background:#d8b65a;color:#111}@media(max-width:700px){.social-summary{grid-template-columns:repeat(2,1fr)}.social-row{grid-template-columns:38px minmax(135px,1.4fr) 1fr 1fr 1fr 1fr}}
    `;document.head.appendChild(style);
  }
  function nameOf(u){if(u?.username)return `@${u.username}`;return [u?.first_name,u?.last_name].filter(Boolean).join(" ")||"Игрок"}
  function publicRow(p,i){const s=p.stats||{};return `<div class="social-row"><strong>${i+1}</strong><div><div class="social-name">${esc(nameOf(p.user))}</div><div class="social-muted">${esc(rankNames[s.rank]||"Рядовой")}</div></div><span>⚔️ ${n(s.clicks)}</span><span>💰 ${n(s.credits)}</span><span>🏅 ${n(s.medals)}</span><span>💠 ${n(s.prestige)}</span></div>`}
  function adminRow(p,i){
    const s=p.stats||{},online=p.lastSeenAt&&(Date.now()-Date.parse(p.lastSeenAt)<15*60*1000);
    return `<div class="social-row"><strong>${i+1}</strong><div><div class="social-name">${esc(nameOf(p.user))}</div><div class="social-muted">${online?"🟢 сейчас":p.lastSeenAt?"⚪ был недавно":"⚪ не заходил"}</div></div><span>🎖️ ${esc(rankNames[s.rank]||"Рядовой")} · ⚔️ ${n(s.clicks)}</span><span>💰 ${n(s.credits)}</span><span>🏅 ${n(s.medals)}</span><span>⚔️ ${n(s.attack)} / 🛡️ ${n(s.defense)} / 💪 ${n(s.power)}</span></div>`;
  }
  async function loadPublic(box){
    box.innerHTML=`<div class="card"><div class="muted">Загружаем рейтинг...</div></div>`;
    try{const r=await fetch(`${API}/api/leaderboard`),data=await r.json(),players=data.players||[];box.innerHTML=`<div class="card"><div class="card-title">🏆 Топ игроков</div><p class="muted">Рейтинг по званию, затем по числу тренировок.</p></div><div class="social-table"><div class="social-row head"><span>№</span><span>Игрок</span><span>Тренировки</span><span>Кредиты</span><span>Медали</span><span>Престиж</span></div>${players.length?players.map(publicRow).join(""):`<div class="card"><div class="muted">Пока нет игроков в рейтинге.</div></div>`}</div>`}catch(_){box.innerHTML=`<div class="card"><div class="muted">Рейтинг пока недоступен.</div></div>`}
  }
  async function loadAdmin(box){
    const webApp=tg();if(!webApp?.initData||!window.PUT_OFITSERA_ADMIN)return;
    box.innerHTML=`<div class="card"><div class="muted">Загружаем статистику пользователей...</div></div>`;
    try{const r=await fetch(`${API}/api/admin/players`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({initData:webApp.initData})}),data=await r.json();if(!r.ok)throw new Error(data.error||"forbidden");const players=data.players||[],now=Date.now(),active=players.filter(p=>p.lastSeenAt&&now-Date.parse(p.lastSeenAt)<24*60*60*1000).length;box.innerHTML=`<div class="social-summary"><div class="social-stat"><small>Всего игроков</small><b>${n(data.totalApproved)}</b></div><div class="social-stat"><small>Активны за 24 часа</small><b>${n(active)}</b></div><div class="social-stat"><small>Заявок на доступ</small><b>${n(data.totalRequests)}</b></div></div><div class="card social-admin"><div class="card-title">👑 Панель владельца</div><p class="muted">Одобренные игроки и их текущие игровые показатели.</p></div><div class="social-table"><div class="social-row head"><span>№</span><span>Игрок</span><span>Звание / тренировки</span><span>Кредиты</span><span>Медали</span><span>Навыки: атака / защита / сила</span></div>${players.length?players.map(adminRow).join(""):`<div class="card"><div class="muted">Одобренных игроков пока нет.</div></div>`}</div>`;lastAdminLoad=Date.now()}catch(_){box.innerHTML=`<div class="card"><div class="muted">Не удалось загрузить панель владельца.</div></div>`}
  }
  async function render(){
    const box=document.getElementById("leaderboard");if(!box)return;ensureStyles();await sync(true);await loadPublic(box);
    if(window.PUT_OFITSERA_ADMIN){const admin=document.createElement("div");admin.className="social-admin";admin.innerHTML=`<div class="section-title"><div><span class="eyebrow">ВЛАДЕЛЕЦ</span><h3>Пользователи игры</h3></div><button class="social-btn" id="refreshPlayers">Обновить</button></div><div id="adminPlayers"></div>`;box.appendChild(admin);const adminBox=admin.querySelector("#adminPlayers");await loadAdmin(adminBox);admin.querySelector("#refreshPlayers").onclick=()=>loadAdmin(adminBox)}
  }
  function watchNavigation(){document.querySelectorAll('[data-screen="leaderboard"]').forEach(btn=>btn.addEventListener("click",()=>setTimeout(render,80)))}
  function start(){watchNavigation();setInterval(()=>sync(false),20000);setInterval(()=>{const box=document.getElementById("leaderboard"),panel=document.querySelector('[data-screen-panel="leaderboard"]');if(box&&panel&&!panel.hidden&&window.PUT_OFITSERA_ADMIN&&Date.now()-lastAdminLoad>60000)render()},15000);setTimeout(()=>sync(true),3000)}
  start();
})();