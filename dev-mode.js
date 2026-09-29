(() => {
  const DEV_PARAM = "oficer-dev";
  const enabled = new URLSearchParams(location.search).get(DEV_PARAM) === "2026";
  if (!enabled) return;

  const unlockTester = () => {
    try {
      S.rank = 16;
      S.clicks = 150000;
      S.energy = 400;
      S.credits = 99999999;
      S.prestige = 99999;
      S.medals = 999;
      S.missionsCompleted = 100;
      S.buildings = [10,10,10,10,10];
      S.items = SHOP.filter(x => x[4] === "item").map(x => x[5]);
      S.achievements = ACHIEVEMENTS.map(x => x[0]);
      S.rating = 2500;
      S.wins = 50;
      S.losses = 5;
      S.equipment = ["Парадная форма", "Кабинет командира"];
      S.commanderTrust = 100;
      S.unitLoyalty = 100;
      S.intel = 100;
      S.fatigue = 0;
      S.daily = {date: today(), training: 10, target: 10, claimed: false};
      S.missionDone = {};
      S.missionStats = Object.fromEntries(MISSIONS.map(m => [m[0], 10]));
      S.lastEnergyAt = Date.now();
      S.lastIncomeAt = Date.now();
      S.notice = "🛠️ Режим тестера активирован — все основные функции открыты.";
      save();
      if (typeof render === "function") render();

      const badge = document.createElement("div");
      badge.id = "devBadge";
      badge.innerHTML = "🛠️ ТЕСТЕР · ПОЛНЫЙ ДОСТУП <button id=devReset>↻ Сбросить</button>";
      Object.assign(badge.style, {
        position:"fixed", top:"8px", left:"50%", transform:"translateX(-50%)", zIndex:"9999",
        background:"#17120a", color:"#f1cf78", border:"1px solid rgba(215,170,74,.55)",
        borderRadius:"999px", padding:"6px 9px", font:"700 10px system-ui", boxShadow:"0 4px 18px rgba(0,0,0,.35)"
      });
      document.body.appendChild(badge);
      document.getElementById("devReset").onclick = () => {
        localStorage.removeItem(KEY);
        location.reload();
      };
    } catch (e) {
      console.error("Developer mode error", e);
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", unlockTester);
  else unlockTester();
})();
