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
      const local=JSON.parse(localStorage.getItem(GAME_KEY)||'{}');
      const server=payload?.state&&typeof payload.state==='object'?payload.state:{};
      const stats=payload?.stats&&typeof payload.stats==='object'?payload.stats:{};
      const merged={...local,...server};
      const progressFields=['clicks','credits','prestige','medals','energy','rating','cups','wins','losses'];
      for(const field of progressFields){
        const values=[local[field],server[field],stats[field]].map(Number).filter(Number.isFinite);
        if(values.length)merged[field]=Math.max(...values);
      }
      const need=[500,1000,2000,3000,4000,5000,6000,7000,10000,14000,18000,23000,30000,40000,55000,70000,90000,150000,180000];
      let rank=0;for(let i=0;i<need.length;i++){if((Number(merged.clicks)||0)>=need[i])rank=i+1;else break}
      merged.rank=Math.min(rank,19);
      localStorage.setItem(GAME_KEY,JSON.stringify(merged));
    }catch(e){console.warn('server state restore failed',e)}
  }
  async function loadGame(isAdmin){
    let restored=false;
    try{
      const r=await fetch(`${API_BASE}/api/player/load`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:tg.initData})});
      if(r.ok){mergeServerState(await r.json());restored=true}
    }catch(e){console.warn('player load failed',e)}
    if(!restored){console.warn('server restore unavailable; starting with protected local progress')}
    window.PUT_OFITSERA_ADMIN=!!isAdmin;
    show('Загружаем игру','Восстанавливаем интерфейс и прогресс…');
    const s=document.createElement('script');
    s.src='app.js?v=20260930e';
    s.onload=()=>{
      let waits=0;
      const finish=()=>{
        if(window.PUT_OFITSERA_GAME_READY!==true&&waits++<100){setTimeout(finish,50);return}
        if(isAdmin){
          const d=document.createElement('script');
          d.src='dev-mode.js?v=20260930e';
          d.onload=()=>{gate.remove();if(app)app.style.display=''};
          d.onerror=()=>{gate.remove();if(app)app.style.display=''};
          document.body.appendChild(d);
        }else{
          gate.remove();if(app)app.style.display='';
        }
      };
      finish();
    };
    s.onerror=()=>show('Ошибка загрузки','Не удалось загрузить игру. Закройте и откройте её снова.');
    document.body.appendChild(s);
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
