// Инициализация Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getDatabase, ref, set, remove, get } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js';

const firebaseConfig = {
    // Ваша конфигурация Firebase
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Функция для создания пользователя в Firebase
async function createFirebaseUser(telegramUser) {
    try {
        // Создаем уникальный email на основе Telegram ID
        const email = `telegram_${telegramUser.id}@telegram.com`;
        const password = generateRandomPassword(); // Генерируем случайный пароль
        
        // Создаем пользователя в Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        // Сохраняем данные пользователя в Realtime Database
        await set(ref(database, 'users/' + telegramUser.id), {
            telegramId: telegramUser.id,
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name || '',
            username: telegramUser.username || '',
            firebaseUid: firebaseUser.uid,
            createdAt: new Date().toISOString()
        });
        
        return firebaseUser;
    } catch (error) {
        console.error('Error creating Firebase user:', error);
        throw error;
    }
}

// Функция для поиска пользователя по Telegram ID
async function findUserByTelegramId(telegramId) {
    try {
        const userRef = ref(database, 'users/' + telegramId);
        const snapshot = await get(userRef);
        return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
        console.error('Error finding user:', error);
        return null;
    }
}

// Функция для удаления пользователя
async function deleteUserAccount(telegramId) {
    try {
        // Находим пользователя в базе данных
        const userData = await findUserByTelegramId(telegramId);
        
        if (!userData) {
            throw new Error('User not found');
        }
        
        // Удаляем из Firebase Auth
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === userData.firebaseUid) {
            await deleteUser(currentUser);
        }
        
        // Удаляем из базы данных
        await remove(ref(database, 'users/' + telegramId));
        
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

// Генерация случайного пароля
function generateRandomPassword() {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
}

// Обработка данных от Telegram
window.handleTelegramAuth = async function(user) {
    try {
        // Проверяем, существует ли пользователь
        let userData = await findUserByTelegramId(user.id);
        
        if (!userData) {
            // Создаем нового пользователя
            await createFirebaseUser(user);
            userData = await findUserByTelegramId(user.id);
        }
        
        // Сохраняем данные пользователя в localStorage
        localStorage.setItem('telegramUser', JSON.stringify(user));
        localStorage.setItem('firebaseUser', JSON.stringify(userData));
        
        // Перенаправляем на игровую страницу
        window.location.href = '/game/game.html';
        
    } catch (error) {
        console.error('Authentication error:', error);
        alert('Ошибка авторизации. Попробуйте снова.');
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
        
        return {
            telegram: telegramUser,
            firebase: firebaseUser
        };
    } catch (error) {
        return null;
    }
};