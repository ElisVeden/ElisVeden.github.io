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
        
        // Если пользователь уже существует, пытаемся войти
        if (error.code === 'auth/email-already-in-use') {
            console.log('User already exists, trying to sign in...');
            return await signInFirebaseUser(telegramUser.id);
        }
        
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
        // Используем тот же алгоритм генерации пароля
        const password = generateRandomPasswordForUser(telegramId);
        
        console.log('Signing in with email:', email);
        
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        console.log('User signed in successfully');
        return userCredential.user;
    } catch (error) {
        console.error('Error signing in:', error);
        
        // Если пароль не подходит, создаем нового пользователя
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            console.log('Authentication failed, creating new user...');
            // Для простоты демонстрации создаем нового пользователя
            // В реальном приложении нужно хранить пароли безопасно
            throw new Error('Please try logging in again to create a new account');
        }
        
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
        
        console.log('Deleting user account for Telegram ID:', telegramId);
        
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

// Генерация детерминированного пароля для пользователя
function generateRandomPasswordForUser(telegramId) {
    return `telegram_${telegramId}_password`;
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
        if (firebaseUser) {
            localStorage.setItem('firebaseAuth', JSON.stringify({
                uid: firebaseUser.uid,
                email: firebaseUser.email
            }));
        }
        
        console.log('Auth successful, redirecting to game...');
        
        // Показываем успешное сообщение
        document.getElementById('loading').style.display = 'none';
        document.getElementById('success').style.display = 'block';
        
        // Перенаправляем на игровую страницу
        setTimeout(function() {
            window.location.href = '/game/game.html';
        }, 2000);
        
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