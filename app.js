const DEV_MODE = true;

const ranks = [
  ["Рядовой","Казарма · 1-е отделение","Первые шаги к большой цели."],
  ["Ефрейтор","Казарма · 2-е отделение","Первые обязанности."],
  ["Младший сержант","Штаб подразделения","Первые командные задачи."],
  ["Сержант","Штаб подразделения","Уверенное продвижение по службе."],
  ["Старший сержант","Командный пункт","Опытный военнослужащий."],
  ["Прапорщик","Офицерская часть","Переход к новым задачам."],
  ["Младший лейтенант","Офицерский корпус","Начало офицерской карьеры."],
  ["Лейтенант","Тактический центр","Командование подразделением."],
  ["Старший лейтенант","Командный центр","Серьёзная ответственность."],
  ["Капитан","Штаб соединения","Командир среднего звена."],
  ["Майор","Оперативный штаб","Оперативное управление."],
  ["Подполковник","Штаб округа","Высокий уровень командования."],
  ["Полковник","Главный штаб","Командование крупными силами."],
  ["Генерал-майор","Военное командование","Высший командный уровень."],
  ["Генерал-лейтенант","Генеральный штаб","Стратегическое управление."],
  ["Генерал-полковник","Высшее командование","Высшая школа командования."],
  ["Генерал армии","Кремлёвский кабинет","Финальное звание."]
];

let rank = Number(localStorage.rank || 0);
let clicks = Number(localStorage.clicks || 0);
let energy = Number(localStorage.energy || 100);
let last = Number(localStorage.last || Date.now());

let maxEnergy = Math.min(400, 100 + rank * 15);

let credits = Number(localStorage.credits || 12450);

function need(i) {
  if (DEV_MODE) return 10;
  return 100 * (i + 1);
}

function save() {
  localStorage.rank = rank;
  localStorage.clicks = clicks;
  localStorage.energy = energy;
  localStorage.last = Date.now();
  localStorage.credits = credits;
}

function recover() {
  const now = Date.now();
  const passed = Math.floor((now - last) / 10000);

  if (passed > 0) {
    energy = Math.min(maxEnergy, energy + passed);
    last += passed * 10000;
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function render() {
  recover();

  const data = ranks[rank];
  if (!data) return;

  const name = data[0];
  const place = data[1];
  const desc = data[2];

  setText("rank", name);
  setText("place", place);
  setText("description", desc);
  setText("level", rank + 1);

  if (DEV_MODE) {
    energy = maxEnergy;
  }

  setText("energy", energy);
  setText("maxEnergy", maxEnergy);
  setText("maxEnergy2", maxEnergy);
  setText("totalClicks", clicks);
  setText("credits", credits.toLocaleString("ru-RU"));

  const base = rank * 100;
  const current = Math.max(0, clicks - base);
  const n = need(rank);

  setText("rankProgress", Math.min(current, n));
  setText("rankNeed", n);

  const energyBar = document.getElementById("energyBar");
  if (energyBar) {
    energyBar.style.width =
      DEV_MODE ? "100%" : (energy / maxEnergy * 100) + "%";
  }

  const rankBar = document.getElementById("rankBar");
  if (rankBar) {
    rankBar.style.width =
      Math.min(current, n) / n * 100 + "%";
  }

  const button = document.getElementById("clickButton");

  if (button) {
    button.disabled =
      !DEV_MODE &&
      (energy <= 0 || rank === ranks.length - 1);
  }

  const next = document.getElementById("nextMini");
  if (next) {
    next.style.opacity =
      rank === ranks.length - 1 ? ".2" : "1";
  }

  renderRanks();
}

function renderRanks() {
  const el = document.getElementById("ranks");
  if (!el) return;

  el.innerHTML = "";

  ranks.forEach(function(r, i) {
    const d = document.createElement("div");

    d.className =
      "rank-item" + (i === rank ? " active" : "");

    d.innerHTML =
      '<div class="tiny"></div>' +
      '<b>' + r[0] + '</b>' +
      '<small>' +
      (i === ranks.length - 1
        ? "Финал"
        : need(i) + " кликов") +
      '</small>';

    el.appendChild(d);
  });
}

const clickButton =
  document.getElementById("clickButton");

if (clickButton) {
  clickButton.addEventListener("click", function() {

    if (!DEV_MODE && energy <= 0) {
      return;
    }

    if (!DEV_MODE) {
      energy--;
    } else {
      energy = maxEnergy;
    }

    if (DEV_MODE) {
      clicks += 10;
      credits += 1000;
    } else {
      clicks++;
      credits += 120;
    }

    if (
      rank < ranks.length - 1 &&
      clicks >= need(rank)
    ) {
      rank++;

      maxEnergy =
        Math.min(400, 100 + rank * 15);

      energy = maxEnergy;
    }

    save();
    render();
  });
}

setInterval(render, 1000);

render();