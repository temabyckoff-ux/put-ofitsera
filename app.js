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
let xp = Number(localStorage.xp || 0);
let energy = Number(localStorage.energy || 100);
let credits = Number(localStorage.credits || 12450);
let last = Number(localStorage.last || Date.now());

let maxEnergy = Math.min(400, 100 + rank * 15);

function need() {
  return 100;
}

function save() {
  localStorage.rank = rank;
  localStorage.xp = xp;
  localStorage.energy = energy;
  localStorage.credits = credits;
  localStorage.last = Date.now();
}

function recoverEnergy() {
  const now = Date.now();
  const passed = Math.floor((now - last) / 10000);

  if (passed > 0) {
    energy = Math.min(maxEnergy, energy + passed);
    last += passed * 10000;
  }
}

function text(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function checkRank() {

  while (
    rank < ranks.length - 1 &&
    xp >= need()
  ) {
    xp -= need();
    rank++;

    maxEnergy =
      Math.min(400, 100 + rank * 15);

    energy =
      Math.min(maxEnergy, energy + 15);
  }
}

function render() {

  recoverEnergy();
  checkRank();

  const data = ranks[rank];

  text("rank", data[0]);
  text("place", data[1]);
  text("description", data[2]);
  text("level", rank + 1);

  text("energy", energy);
  text("maxEnergy", maxEnergy);

  text(
    "credits",
    credits.toLocaleString("ru-RU")
  );

  const progress = Math.min(xp, need());

  text("rankProgress", progress);
  text("rankNeed", need());

  const energyBar =
    document.getElementById("energyBar");

  if (energyBar) {
    energyBar.style.width =
      (energy / maxEnergy * 100) + "%";
  }

  const rankBar =
    document.getElementById("rankBar");

  if (rankBar) {
    rankBar.style.width =
      (progress / need() * 100) + "%";
  }

  const button =
    document.getElementById("clickButton");

  if (button) {
    button.disabled =
      energy <= 0 ||
      rank >= ranks.length - 1;
  }

  renderRanks();
  save();
}

function renderRanks() {

  const element =
    document.getElementById("ranks");

  if (!element) {
    return;
  }

  element.innerHTML = "";

  ranks.forEach(function(r, i) {

    const item =
      document.createElement("div");

    item.className =
      "rank-item" +
      (i === rank ? " active" : "");

    item.innerHTML =
      "<b>" + r[0] + "</b>" +
      "<small>" +
      (
        i === ranks.length - 1
          ? "Финальное звание"
          : need() + " XP"
      ) +
      "</small>";

    element.appendChild(item);
  });
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

  energy -= 1;
  xp += 10;
  credits += 120;

  const oldRank = rank;

  checkRank();
  save();
  render();

  if (rank > oldRank) {

    alert(
      "🎖 ПОВЫШЕНИЕ!\n\n" +
      "Новое звание:\n" +
      ranks[rank][0]
    );

  } else {

    alert(
      "🏅 Тренировка завершена!\n\n" +
      "⭐ +10 XP\n" +
      "💰 +120 кредитов\n" +
      "⚡ -1 энергия"
    );
  }
}

const trainingButton =
  document.getElementById("clickButton");

if (trainingButton) {

  trainingButton.disabled = false;

  trainingButton.addEventListener(
    "click",
    training
  );
}

setInterval(render, 1000);

render();