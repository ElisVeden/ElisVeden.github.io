// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyByYAiN67kGW9K1X6LDVBlyDS99OziZ1n8",
  authDomain: "endless-food-6a3d9.firebaseapp.com",
  databaseURL: "https://endless-food-6a3d9-default-rtdb.firebaseio.com",
  projectId: "endless-food-6a3d9",
  storageBucket: "endless-food-6a3d9.firebasestorage.app",
  messagingSenderId: "90845090114",
  appId: "1:90845090114:web:9963538d2a7033706d38db",
  measurementId: "G-CYJEX9EVKR"
};

// Глобальные переменные для Firebase
let app, auth, database;

// Функция для инициализации Firebase
function initializeFirebase() {
    if (typeof firebase !== 'undefined' && !app) {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        database = firebase.database();
        console.log('Firebase initialized successfully');
        return true;
    }
    return !!app;
}

// Функция для создания пользователя в Firebase
async function createFirebaseUser(telegramUser) {
    try {
        // Инициализируем Firebase если еще не инициализирован
        if (!initializeFirebase()) {
            throw new Error('Firebase not available');
        }
        
        // Создаем уникальный email на основе Telegram ID
        const email = `telegram_${telegramUser.id}@telegram.com`;
        const password = generateRandomPassword();
        
        console.log('Creating Firebase user with email:', email);
        
        // Создаем пользователя в Firebase Auth
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        
        console.log('Firebase user created:', firebaseUser.uid);
        
        // Сохраняем данные пользователя в Realtime Database
        await firebase.database().ref('users/' + telegramUser.id).set({
            telegramId: telegramUser.id,
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name || '',
            username: telegramUser.username || '',
            firebaseUid: firebaseUser.uid,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        
        console.log('User data saved to database');
        return firebaseUser;
    } catch (error) {
        console.error('Error creating Firebase user:', error);
        throw error;
    }
}

// Функция для поиска пользователя по Telegram ID
async function findUserByTelegramId(telegramId) {
    try {
        if (!initializeFirebase()) {
            throw new Error('Firebase not available');
        }
        
        const snapshot = await firebase.database().ref('users/' + telegramId).once('value');
        return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
        console.error('Error finding user:', error);
        return null;
    }
}

// Функция для входа пользователя
async function signInFirebaseUser(telegramId) {
    try {
        if (!initializeFirebase()) {
            throw new Error('Firebase not available');
        }
        
        const email = `telegram_${telegramId}@telegram.com`;
        // Для демонстрации используем фиксированный пароль
        // В реальном приложении вам нужно хранить пароль безопасно
        const password = `telegram_${telegramId}_password`;
        
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
}

// Функция для удаления пользователя
async function deleteUserAccount(telegramId) {
    try {
        if (!initializeFirebase()) {
            throw new Error('Firebase not available');
        }
        
        // Находим пользователя в базе данных
        const userData = await findUserByTelegramId(telegramId);
        
        if (!userData) {
            throw new Error('User not found in database');
        }
        
        // Входим как пользователь чтобы удалить аккаунт
        await signInFirebaseUser(telegramId);
        
        // Удаляем из Firebase Auth
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
            await currentUser.delete();
            console.log('User deleted from Firebase Auth');
        }
        
        // Удаляем из базы данных
        await firebase.database().ref('users/' + telegramId).remove();
        console.log('User data deleted from database');
        
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

// Генерация случайного пароля
function generateRandomPassword() {
    return `telegram_${Date.now()}_password`;
}

// Обработка данных от Telegram
window.handleTelegramAuth = async function(user) {
    try {
        console.log('Processing Telegram auth for user:', user);
        
        // Проверяем, существует ли пользователь
        let userData = await findUserByTelegramId(user.id);
        let firebaseUser;
        
        if (!userData) {
            console.log('Creating new user...');
            // Создаем нового пользователя
            firebaseUser = await createFirebaseUser(user);
            userData = await findUserByTelegramId(user.id);
        } else {
            console.log('User exists, signing in...');
            // Входим под существующим пользователем
            firebaseUser = await signInFirebaseUser(user.id);
        }
        
        // Сохраняем данные пользователя в localStorage
        localStorage.setItem('telegramUser', JSON.stringify(user));
        localStorage.setItem('firebaseUser', JSON.stringify(userData));
        localStorage.setItem('firebaseAuth', JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email
        }));
        
        console.log('Auth successful, redirecting to game...');
        
        // Перенаправляем на игровую страницу
        setTimeout(function() {
            window.location.href = '/game/game.html';
        }, 1000);
        
    } catch (error) {
        console.error('Authentication error:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('error-message').textContent = 'Ошибка авторизации: ' + error.message;
    }
};

// Функция для удаления аккаунта (для отладки)
window.deleteCurrentUser = async function() {
    try {
        const telegramUser = JSON.parse(localStorage.getItem('telegramUser'));
        
        if (!telegramUser || !telegramUser.id) {
            alert('Пользователь не найден в localStorage');
            return;
        }
        
        if (confirm('Вы уверены, что хотите удалить свой аккаунт? Это действие нельзя отменить.')) {
            await deleteUserAccount(telegramUser.id);
            
            // Очищаем localStorage
            localStorage.removeItem('telegramUser');
            localStorage.removeItem('firebaseUser');
            localStorage.removeItem('firebaseAuth');
            
            alert('Аккаунт успешно удален');
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        alert('Ошибка при удалении аккаунта: ' + error.message);
    }
};

// Проверка авторизации при загрузке страницы
window.checkAuth = function() {
    const telegramUser = localStorage.getItem('telegramUser');
    const firebaseUser = localStorage.getItem('firebaseUser');
    
    return !!(telegramUser && firebaseUser);
};

// Получение данных текущего пользователя
window.getCurrentUser = function() {
    try {
        const telegramUser = JSON.parse(localStorage.getItem('telegramUser'));
        const firebaseUser = JSON.parse(localStorage.getItem('firebaseUser'));
        const firebaseAuth = JSON.parse(localStorage.getItem('firebaseAuth'));
        
        return {
            telegram: telegramUser,
            firebase: firebaseUser,
            auth: firebaseAuth
        };
    } catch (error) {
        return null;
    }
};

// Инициализация Firebase при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Firebase...');
    initializeFirebase();
});

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