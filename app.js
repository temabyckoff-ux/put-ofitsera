if (!localStorage.getItem("gameVersion2")) {
  localStorage.removeItem("rank");
  localStorage.removeItem("xp");
  localStorage.removeItem("energy");
  localStorage.removeItem("credits");
  localStorage.setItem("gameVersion2", "1");
}

const ranks = [
  ["Рядовой", "Казарма · 1-е отделение", "Первые шаги к большой цели."],
  ["Ефрейтор", "Казарма · 2-е отделение", "Первые обязанности."],
  ["Младший сержант", "Штаб подразделения", "Первые командные задачи."],
  ["Сержант", "Штаб подразделения", "Уверенное продвижение по службе."],
  ["Старший сержант", "Командный пункт", "Опытный военнослужащий."],
  ["Прапорщик", "Офицерская часть", "Переход к новым задачам."],
  ["Младший лейтенант", "Офицерский корпус", "Начало офицерской карьеры."],
  ["Лейтенант", "Тактический центр", "Командование подразделением."],
  ["Старший лейтенант", "Командный центр", "Серьёзная ответственность."],
  ["Капитан", "Штаб соединения", "Командир среднего звена."],
  ["Майор", "Оперативный штаб", "Оперативное управление."],
  ["Подполковник", "Штаб округа", "Высокий уровень командования."],
  ["Полковник", "Главный штаб", "Командование крупными силами."],
  ["Генерал-майор", "Военное командование", "Высший командный уровень."],
  ["Генерал-лейтенант", "Генеральный штаб", "Стратегическое управление."],
  ["Генерал-полковник", "Высшее командование", "Высшая школа командования."],
  ["Генерал армии", "Кремлёвский кабинет", "Финальное звание."]
];

let rank = Number(localStorage.getItem("rank") || 0);
let xp = Number(localStorage.getItem("xp") || 0);
let energy = Number(localStorage.getItem("energy") || 100);
let credits = Number(localStorage.getItem("credits") || 12450);
let last = Number(localStorage.getItem("last") || Date.now());

let maxEnergy = Math.min(400, 100 + rank * 15);

function need() {
  return 100;
}

function save() {
  localStorage.setItem("rank", rank);
  localStorage.setItem("xp", xp);
  localStorage.setItem("energy", energy);
  localStorage.setItem("credits", credits);
  localStorage.setItem("last", last);
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function recoverEnergy() {
  const now = Date.now();
  const passed = Math.floor((now - last) / 10000);

  if (passed > 0) {
    energy = Math.min(maxEnergy, energy + passed);
    last += passed * 10000;
  }
}

function checkRank() {
  while (rank < ranks.length - 1 && xp >= need()) {
    xp -= need();
    rank++;

    maxEnergy = Math.min(400, 100 + rank * 15);
    energy = Math.min(maxEnergy, energy + 15);
  }
}

function renderRanks() {
  const list = document.getElementById("ranks");

  if (!list) {
    return;
  }

  list.innerHTML = "";

  ranks.forEach(function(item, index) {
    const element = document.createElement("div");

    element.className =
      "rank-item" + (index === rank ? " active" : "");

    element.innerHTML =
      "<b>" + item[0] + "</b>" +
      "<small>" +
      (index === ranks.length - 1
        ? "Финальное звание"
        : "100 XP") +
      "</small>";

    list.appendChild(element);
  });
}

function render() {
  recoverEnergy();
  checkRank();

  const currentRank = ranks[rank];

  setText("rank", currentRank[0]);
  setText("place", currentRank[1]);
  setText("description", currentRank[2]);
  setText("level", rank + 1);

  setText("energy", energy);
  setText("maxEnergy", maxEnergy);
  setText("credits", credits.toLocaleString("ru-RU"));

  setText("rankProgress", xp);
  setText("rankNeed", need());

  const energyBar = document.getElementById("energyBar");

  if (energyBar) {
    energyBar.style.width =
      (energy / maxEnergy * 100) + "%";
  }

  const rankBar = document.getElementById("rankBar");

  if (rankBar) {
    rankBar.style.width =
      (xp / need() * 100) + "%";
  }

  const button = document.getElementById("clickButton");

  if (button) {
    button.disabled =
      energy <= 0 ||
      rank >= ranks.length - 1;
  }

  renderRanks();
  save();
}

function training() {
  if (energy <= 0) {
    alert(
      "⚡ Энергия закончилась.\n\n" +
      "Восстановление: +1 каждые 10 секунд."
    );
    return;
  }

  if (rank >= ranks.length - 1) {
    return;
  }

  const oldRank = rank;

  energy -= 1;
  xp += 10;
  credits += 120;

  checkRank();
  save();
  render();

  if (rank > oldRank) {
    alert(
      "🎖 ПОВЫШЕНИЕ!\n\n" +
      "Новое звание:\n" +
      ranks[rank][0]
    );
  }
}

const trainingButton =
  document.getElementById("clickButton");

if (trainingButton) {
  trainingButton.addEventListener(
    "click",
    training
  );
}

setInterval(render, 1000);

render();