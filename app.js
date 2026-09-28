// ========================================
// ПУТЬ ОФИЦЕРА — ОСНОВНОЙ ИГРОВОЙ КОД
// ========================================

// Однократный сброс старых DEV-данных
if (!localStorage.getItem("gameVersion2")) {
  localStorage.removeItem("rank");
  localStorage.removeItem("xp");
  localStorage.removeItem("energy");
  localStorage.removeItem("credits");

  localStorage.setItem("gameVersion2", "1");
}


// ========================================
// ЗВАНИЯ
// ========================================

const ranks = [
  [
    "Рядовой",
    "Казарма · 1-е отделение",
    "Первые шаги к большой цели."
  ],
  [
    "Ефрейтор",
    "Казарма · 2-е отделение",
    "Первые обязанности."
  ],
  [
    "Младший сержант",
    "Штаб подразделения",
    "Первые командные задачи."
  ],
  [
    "Сержант",
    "Штаб подразделения",
    "Уверенное продвижение по службе."
  ],
  [
    "Старший сержант",
    "Командный пункт",
    "Опытный военнослужащий."
  ],
  [
    "Прапорщик",
    "Офицерская часть",
    "Переход к новым задачам."
  ],
  [
    "Младший лейтенант",
    "Офицерский корпус",
    "Начало офицерской карьеры."
  ],
  [
    "Лейтенант",
    "Тактический центр",
    "Командование подразделением."
  ],
  [
    "Старший лейтенант",
    "Командный центр",
    "Серьёзная ответственность."
  ],
  [
    "Капитан",
    "Штаб соединения",
    "Командир среднего звена."
  ],
  [
    "Майор",
    "Оперативный штаб",
    "Оперативное управление."
  ],
  [
    "Подполковник",
    "Штаб округа",
    "Высокий уровень командования."
  ],
  [
    "Полковник",
    "Главный штаб",
    "Командование крупными силами."
  ],
  [
    "Генерал-майор",
    "Военное командование",
    "Высший командный уровень."
  ],
  [
    "Генерал-лейтенант",
    "Генеральный штаб",
    "Стратегическое управление."
  ],
  [
    "Генерал-полковник",
    "Высшее командование",
    "Высшая школа командования."
  ],
  [
    "Генерал армии",
    "Кремлёвский кабинет",
    "Финальное звание."
  ]
];


// ========================================
// СОСТОЯНИЕ ИГРОКА
// ========================================

let rank = Number(
  localStorage.getItem("rank") || 0
);

let xp = Number(
  localStorage.getItem("xp") || 0
);

let energy = Number(
  localStorage.getItem("energy") || 100
);

let credits = Number(
  localStorage.getItem("credits") || 12450
);

let lastEnergyTime = Number(
  localStorage.getItem("lastEnergyTime") || Date.now()
);


// Максимальная энергия
let maxEnergy = Math.min(
  400,
  100 + rank * 15
);


// ========================================
// НАСТРОЙКИ
// ========================================

const XP_PER_TRAINING = 10;
const CREDITS_PER_TRAINING = 120;
const XP_FOR_RANK = 100;
const ENERGY_RECOVERY_TIME = 10000;


// ========================================
// СОХРАНЕНИЕ
// ========================================

function saveGame() {
  localStorage.setItem(
    "rank",
    String(rank)
  );

  localStorage.setItem(
    "xp",
    String(xp)
  );

  localStorage.setItem(
    "energy",
    String(energy)
  );

  localStorage.setItem(
    "credits",
    String(credits)
  );

  localStorage.setItem(
    "lastEnergyTime",
    String(lastEnergyTime)
  );
}


// ========================================
// БЕЗОПАСНОЕ ИЗМЕНЕНИЕ ТЕКСТА
// ========================================

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}


// ========================================
// ВОССТАНОВЛЕНИЕ ЭНЕРГИИ
// ========================================

function recoverEnergy() {
  const now = Date.now();

  const passed = Math.floor(
    (now - lastEnergyTime) /
    ENERGY_RECOVERY_TIME
  );

  if (passed <= 0) {
    return;
  }

  energy = Math.min(
    maxEnergy,
    energy + passed
  );

  lastEnergyTime +=
    passed * ENERGY_RECOVERY_TIME;
}


// ========================================
// ПРОВЕРКА ПОВЫШЕНИЯ
// ========================================

function checkRank() {

  while (
    rank < ranks.length - 1 &&
    xp >= XP_FOR_RANK
  ) {

    xp -= XP_FOR_RANK;

    rank++;

    maxEnergy = Math.min(
      400,
      100 + rank * 15
    );

    energy = Math.min(
      maxEnergy,
      energy + 15
    );
  }
}


// ========================================
// СПИСОК ЗВАНИЙ
// ========================================

function renderRanks() {

  const container =
    document.getElementById("ranks");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  ranks.forEach(function(item, index) {

    const element =
      document.createElement("div");

    element.className =
      "rank-item" +
      (index === rank ? " active" : "");

    const title =
      document.createElement("b");

    title.textContent =
      item[0];

    const info =
      document.createElement("small");

    if (index === ranks.length - 1) {
      info.textContent =
        "Финальное звание";
    } else {
      info.textContent =
        "100 XP";
    }

    element.appendChild(title);
    element.appendChild(info);

    container.appendChild(element);
  });
}


// ========================================
// ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
// ========================================

function render() {

  recoverEnergy();

  checkRank();

  const currentRank =
    ranks[rank];

  setText(
    "rank",
    currentRank[0]
  );

  setText(
    "place",
    currentRank[1]
  );

  setText(
    "description",
    currentRank[2]
  );

  setText(
    "level",
    rank + 1
  );

  setText(
    "energy",
    energy
  );

  setText(
    "maxEnergy",
    maxEnergy
  );

  setText(
    "credits",
    credits.toLocaleString("ru-RU")
  );

  setText(
    "rankProgress",
    xp
  );

  setText(
    "rankNeed",
    XP_FOR_RANK
  );


  // Полоса энергии

  const energyBar =
    document.getElementById("energyBar");

  if (energyBar) {

    const energyPercent =
      (energy / maxEnergy) * 100;

    energyBar.style.width =
      energyPercent + "%";
  }


  // Полоса опыта

  const rankBar =
    document.getElementById("rankBar");

  if (rankBar) {

    const xpPercent =
      (xp / XP_FOR_RANK) * 100;

    rankBar.style.width =
      xpPercent + "%";
  }


  // Кнопка тренировки

  const button =
    document.getElementById("clickButton");

  if (button) {

    button.disabled =
      energy <= 0 ||
      rank >= ranks.length - 1;
  }


  renderRanks();

  saveGame();
}


// ========================================
// ТРЕНИРОВКА
// ========================================

function training() {

  if (energy <= 0) {

    alert(
      "⚡ Энергия закончилась.\n\n" +
      "Восстановление: +1 энергия каждые 10 секунд."
    );

    return;
  }


  if (rank >= ranks.length - 1) {

    alert(
      "🎖 Ты достиг финального звания."
    );

    return;
  }


  const oldRank =
    rank;


  // Расход энергии
  energy -= 1;


  // Получение опыта
  xp += XP_PER_TRAINING;


  // Получение кредитов
  credits += CREDITS_PER_TRAINING;


  // Проверяем повышение
  checkRank();


  // Сохраняем
  saveGame();


  // Обновляем экран
  render();


  // Сообщение
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


// ========================================
// ПОДКЛЮЧЕНИЕ КНОПКИ
// ========================================

const trainingButton =
  document.getElementById(
    "clickButton"
  );

if (trainingButton) {

  trainingButton.disabled =
    false;

  trainingButton.addEventListener(
    "click",
    training
  );
}


// ========================================
// АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ
// ========================================

setInterval(
  render,
  1000
);


// ========================================
// ПЕРВЫЙ ЗАПУСК
// ========================================

render();