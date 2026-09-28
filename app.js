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
let last = Number(localStorage.last || Date.now());
let credits = Number(localStorage.credits || 0);

let maxEnergy = Math.min(
  400,
  100 + rank * 15
);


/* =========================
   МИССИИ
========================= */

const missions = {

  training: {
    name: "Служебная тренировка",
    xp: 10,
    credits: 120,
    energy: 1,
    minRank: 0
  },

  commander: {
    name: "Приказ командира",
    xp: 25,
    credits: 300,
    energy: 2,
    minRank: 1
  },

  tactical: {
    name: "Тактическая подготовка",
    xp: 50,
    credits: 700,
    energy: 3,
    minRank: 2
  }

};


/* =========================
   ОПЫТ ДО СЛЕДУЮЩЕГО ЗВАНИЯ
========================= */

function need(rankIndex) {
  return 100 * (rankIndex + 1);
}


/* =========================
   СОХРАНЕНИЕ
========================= */

function save() {

  localStorage.rank = rank;
  localStorage.xp = xp;
  localStorage.energy = energy;
  localStorage.last = Date.now();
  localStorage.credits = credits;
}


/* =========================
   ВОССТАНОВЛЕНИЕ ЭНЕРГИИ
   +1 каждые 10 секунд
========================= */

function recover() {

  const now = Date.now();

  const passed =
    Math.floor(
      (now - last) / 10000
    );

  if (passed > 0) {

    energy =
      Math.min(
        maxEnergy,
        energy + passed
      );

    last +=
      passed * 10000;
  }
}


/* =========================
   ВЫВОД ТЕКСТА
========================= */

function setText(id, value) {

  const el =
    document.getElementById(id);

  if (el) {
    el.textContent = value;
  }
}


/* =========================
   ПОВЫШЕНИЕ ЗВАНИЯ
========================= */

function checkRank() {

  while (
    rank < ranks.length - 1 &&
    xp >= need(rank)
  ) {

    rank++;

    maxEnergy =
      Math.min(
        400,
        100 + rank * 15
      );

    energy =
      Math.min(
        maxEnergy,
        energy + 15
      );
  }
}


/* =========================
   ОТОБРАЖЕНИЕ
========================= */

function render() {

  recover();

  checkRank();

  const data =
    ranks[rank];

  if (!data) {
    return;
  }

  setText("rank", data[0]);
  setText("place", data[1]);
  setText("description", data[2]);
  setText("level", rank + 1);

  setText("energy", energy);
  setText("maxEnergy", maxEnergy);

  setText(
    "credits",
    credits.toLocaleString("ru-RU")
  );


  /* XP */

  const previous =
    rank === 0
      ? 0
      : need(rank - 1);

  const required =
    need(rank);

  const current =
    Math.max(
      0,
      xp - previous
    );

  const progress =
    Math.min(
      current,
      required - previous
    );

  setText(
    "rankProgress",
    progress
  );

  setText(
    "rankNeed",
    required - previous
  );


  /* Полоса энергии */

  const energyBar =
    document.getElementById(
      "energyBar"
    );

  if (energyBar) {

    energyBar.style.width =
      (
        energy /
        maxEnergy *
        100
      ) + "%";
  }


  /* Полоса опыта */

  const rankBar =
    document.getElementById(
      "rankBar"
    );

  if (rankBar) {

    rankBar.style.width =
      (
        progress /
        (required - previous) *
        100
      ) + "%";
  }


  /* Кнопка тренировки */

  const button =
    document.getElementById(
      "clickButton"
    );

  if (button) {

    button.disabled =
      energy <= 0 ||
      rank >= ranks.length - 1;
  }


  renderRanks();

  save();
}


/* =========================
   СПИСОК ЗВАНИЙ
========================= */

function renderRanks() {

  const el =
    document.getElementById(
      "ranks"
    );

  if (!el) {
    return;
  }

  el.innerHTML = "";

  ranks.forEach(
    function(r, i) {

      const d =
        document.createElement(
          "div"
        );

      d.className =
        "rank-item" +
        (
          i === rank
            ? " active"
            : ""
        );

      d.innerHTML =
        "<b>" +
        r[0] +
        "</b>" +

        "<small>" +

        (
          i === ranks.length - 1
            ? "Ф