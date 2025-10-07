// bot.js
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Токен вашего бота от @BotFather
const BOT_TOKEN = '8375839041:AAHMcQN6JrM96Ulq7QhzMUogPOL8w6L3DwY';

// Создаем бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Файл для хранения пользователей (вместо Firebase)
const USERS_FILE = path.join(__dirname, 'users.json');

// Функция для загрузки пользователей
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error);
  }
  return {};
}

// Функция для сохранения пользователей
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log('Пользователи сохранены');
  } catch (error) {
    console.error('Ошибка сохранения пользователей:', error);
  }
}

// Обработчик команды /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;

  console.log('Новый пользователь:', user);

  // Загружаем текущих пользователей
  const users = loadUsers();

  if (users[user.id]) {
    // Пользователь уже существует
    await bot.sendMessage(chatId,
      `🎮 С возвращением, ${user.first_name}!\n\n` +
      `Ваш ID: ${user.id}\n` +
      `Прогресс сохранен. Продолжайте игру на сайте.\n\n` +
      `Используйте /progress для просмотра прогресса`
    );

    // Обновляем время последнего входа
    users[user.id].lastLogin = new Date().toISOString();
  } else {
    // Новый пользователь
    users[user.id] = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name || '',
      username: user.username,
      registeredAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      progress: {
        level: 1,
        completedPuzzles: [],
        timePatience: 100,
        currentLocation: 'start_village'
      },
      inventory: {
        codeFragments: 3,
        timeShards: 0
      }
    };

    await bot.sendMessage(chatId,
      `🎮 Добро пожаловать в Рунный Следопыт, ${user.first_name}!\n\n` +
      `Вы стали Следопытом Рунного Кода!\n` +
      `Ваш ID: ${user.id}\n\n` +
      `Теперь вы можете авторизоваться на сайте через Telegram Widget.\n\n` +
      `Используйте /progress для просмотра прогресса`
    );
  }

  // Сохраняем пользователей
  saveUsers(users);
});

// Обработчик команды /progress
bot.onText(/\/progress/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const users = loadUsers();
  const user = users[userId];

  if (user) {
    const progress = user.progress;
    const inventory = user.inventory;

    await bot.sendMessage(chatId,
      `📊 Ваш прогресс, ${user.firstName}:\n\n` +
      `🏆 Уровень: ${progress.level}\n` +
      `✅ Завершено головоломок: ${progress.completedPuzzles.length}\n` +
      `💎 Фрагменты кода: ${inventory.codeFragments}\n` +
      `⏳ Терпение времени: ${progress.timePatience}\n` +
      `📍 Текущая локация: ${progress.currentLocation}\n\n` +
      `🕐 Зарегистрирован: ${new Date(user.registeredAt).toLocaleDateString('ru-RU')}`
    );
  } else {
    await bot.sendMessage(chatId,
      'Вы еще не зарегистрированы! Используйте /start для начала.'
    );
  }
});

// Обработчик команды /stats (только для администраторов)
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;

  // Замените на ваш ID телеграм
  const ADMIN_ID = '@code_weaver_gamebot';

  if (msg.from.id.toString() !== ADMIN_ID) {
    await bot.sendMessage(chatId, 'Эта команда только для администраторов.');
    return;
  }

  const users = loadUsers();
  const totalUsers = Object.keys(users).length;

  await bot.sendMessage(chatId,
    `📈 Статистика бота:\n\n` +
    `👥 Всего пользователей: ${totalUsers}\n` +
    `🆕 Новые за сегодня: ${getNewUsersToday(users)}\n` +
    `🎮 Активные игроки: ${getActiveUsers(users)}`
  );
});

// Вспомогательные функции
function getNewUsersToday(users) {
  const today = new Date().toDateString();
  return Object.values(users).filter(user =>
    new Date(user.registeredAt).toDateString() === today
  ).length;
}

function getActiveUsers(users) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return Object.values(users).filter(user =>
    new Date(user.lastLogin) > yesterday
  ).length;
}

// Обработчик ошибок
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('webhook_error', (error) => {
  console.error('Webhook error:', error);
});

console.log('🤖 Бот Рунный Следопыт запущен...');
console.log('Ожидание сообщений...');