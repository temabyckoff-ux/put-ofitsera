(() => {
  // Closed beta gate. Telegram users authenticate through signed initData.
  // The backend Worker is deployed at this URL.
  const API_BASE = window.PUT_OFITSERA_API || "https://put-ofitsera.tema-byckoff.workers.dev";
  const tg = window.Telegram?.WebApp;
  const app = document.querySelector('.app');
  if (!tg) return; // Keep desktop/browser development usable.

  tg.ready();
  tg.expand();
  if (app) app.style.display = 'none';

  const gate = document.createElement('div');
  gate.id = 'accessGate';
  gate.innerHTML = '<div class="access-box"><div class="access-mark">🎖️</div><div class="eyebrow">ЗАКРЫТАЯ БЕТА</div><h2 id="accessTitle">Проверяем доступ</h2><p id="accessText">Подождите немного…</p><button id="accessRequest" class="gold-btn" hidden>🔑 Запросить доступ</button></div>';
  Object.assign(gate.style,{position:'fixed',inset:'0',zIndex:'99999',display:'grid',placeItems:'center',padding:'22px',background:'#070b11',color:'#f2f5f7'});
  document.body.appendChild(gate);

  const title = document.getElementById('accessTitle');
  const text = document.getElementById('accessText');
  const button = document.getElementById('accessRequest');

  function show(t,d,showButton=false){ title.textContent=t;text.textContent=d;button.hidden=!showButton; }
  function loadGame(){
    window.PUT_OFITSERA_ADMIN = false;
    const s=document.createElement('script');s.src='app.js';document.body.appendChild(s);
    const d=document.createElement('script');d.src='dev-mode.js';document.body.appendChild(d);
    gate.remove();if(app)app.style.display='';
  }
  async function check(){
    try{
      const r=await fetch(`${API_BASE}/api/auth`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:tg.initData})});
      const data=await r.json();
      if(data.status==='approved'){
        window.PUT_OFITSERA_ADMIN=data.role==='admin';
        loadGame();
        return;
      }
      if(data.status==='pending'){show('Запрос отправлен','Мы получили твой запрос. Владелец игры должен разрешить доступ.');return;}
      if(data.status==='denied'){show('Доступ отклонён','Пока доступ к закрытой бете не выдан.');return;}
      show('Доступ не получен','Нажми кнопку ниже, чтобы отправить запрос.',true);
    }catch(e){show('Бета ещё настраивается','Сервер доступа пока не подключён. Для владельца игры это означает, что нужно завершить настройку сервера.',false);console.warn(e);}
  }
  button.onclick=check;
  check();
})();
