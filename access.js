(() => {
  const API_BASE = window.PUT_OFITSERA_API || "https://put-ofitsera.tema-byckoff.workers.dev";
  const GAME_KEY = "putOfitserGame_all_v3";
  const tg = window.Telegram?.WebApp;
  const app = document.querySelector('.app');
  if (!tg) return;
  tg.ready(); tg.expand(); if (app) app.style.display = 'none';
  const gate = document.createElement('div');
  gate.id = 'accessGate';
  gate.innerHTML = '<div class="access-box"><div class="access-mark">🎖️</div><div class="eyebrow">ЗАКРЫТАЯ БЕТА</div><h2 id="accessTitle">Проверяем доступ</h2><p id="accessText">Подождите немного…</p><button id="accessRequest" class="gold-btn" hidden>🔑 Запросить доступ</button></div>';
  Object.assign(gate.style,{position:'fixed',inset:'0',zIndex:'99999',display:'grid',placeItems:'center',padding:'22px',background:'#070b11',color:'#f2f5f7'});
  document.body.appendChild(gate);
  const title=document.getElementById('accessTitle'),text=document.getElementById('accessText'),button=document.getElementById('accessRequest');
  function show(t,d,showButton=false){title.textContent=t;text.textContent=d;button.hidden=!showButton}
  function mergeServerState(payload){
    try{
      if(payload?.state&&typeof payload.state==='object'){localStorage.setItem(GAME_KEY,JSON.stringify(payload.state));return}
      if(payload?.stats&&typeof payload.stats==='object'){
        const local=JSON.parse(localStorage.getItem(GAME_KEY)||'{}');
        local.rank=payload.stats.rank??local.rank;local.clicks=payload.stats.clicks??local.clicks;local.credits=payload.stats.credits??local.credits;local.prestige=payload.stats.prestige??local.prestige;local.medals=payload.stats.medals??local.medals;local.energy=payload.stats.energy??local.energy;local.rating=payload.stats.rating??local.rating;local.wins=payload.stats.wins??local.wins;local.losses=payload.stats.losses??local.losses;localStorage.setItem(GAME_KEY,JSON.stringify(local));
      }
    }catch(e){console.warn('server state restore failed',e)}
  }
  async function loadGame(isAdmin){
    try{
      const r=await fetch(`${API_BASE}/api/player/load`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:tg.initData})});
      if(r.ok)mergeServerState(await r.json());
    }catch(e){console.warn('player load failed',e)}
    window.PUT_OFITSERA_ADMIN=!!isAdmin;
    const s=document.createElement('script');s.src='app.js';document.body.appendChild(s);
    const d=document.createElement('script');d.src='dev-mode.js';document.body.appendChild(d);
    gate.remove();if(app)app.style.display='';
  }
  async function check(){
    try{
      const r=await fetch(`${API_BASE}/api/auth`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:tg.initData})});
      const data=await r.json();
      if(data.status==='approved'){await loadGame(data.role==='admin');return}
      if(data.status==='pending'){show('Запрос отправлен','Мы получили твой запрос. Владелец игры должен разрешить доступ.');return}
      if(data.status==='denied'){show('Доступ отклонён','Пока доступ к закрытой бете не выдан.');return}
      show('Доступ не получен','Нажми кнопку ниже, чтобы отправить запрос.',true);
    }catch(e){show('Бета ещё настраивается','Сервер доступа пока не подключён. Для владельца игры это означает, что нужно завершить настройку сервера.',false);console.warn(e)}
  }
  button.onclick=check;check();
})();
