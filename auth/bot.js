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
        const password = generateDeterministicPassword(telegramUser.id);
        
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
            email: email,
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
        const password = generateDeterministicPassword(telegramId);
        
        console.log('Signing in with email:', email);
        
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        console.log('User signed in successfully');
        return userCredential.user;
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
}

// Функция для обработки пользователя (основная логика)
async function processUserAuthentication(telegramUser) {
    try {
        // Сначала пытаемся найти пользователя в базе данных
        let userData = await findUserByTelegramId(telegramUser.id);
        let firebaseUser;

        if (!userData) {
            console.log('User not found in database, creating new user...');
            // Пользователя нет в базе - создаем нового
            firebaseUser = await createFirebaseUser(telegramUser);
            userData = await findUserByTelegramId(telegramUser.id);
        } else {
            console.log('User found in database, signing in...');
            // Пользователь есть в базе - пытаемся войти
            try {
                firebaseUser = await signInFirebaseUser(telegramUser.id);
            } catch (signInError) {
                if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/wrong-password') {
                    console.log('Sign in failed, user might be deleted from Auth but exists in DB. Recreating...');
                    // Пользователь есть в DB но нет в Auth - пересоздаем
                    firebaseUser = await createFirebaseUser(telegramUser);
                } else {
                    throw signInError;
                }
            }
        }

        return { firebaseUser, userData };
    } catch (error) {
        console.error('Error in user authentication process:', error);
        throw error;
    }
}

// Функция для удаления пользователя
async function deleteUserAccount(telegramId) {
    try {
        if (!initializeFirebase()) {
            throw new Error('Firebase not available');
        }
        
        console.log('Deleting user account for Telegram ID:', telegramId);
        
        // Удаляем из базы данных
        await firebase.database().ref('users/' + telegramId).remove();
        console.log('User data deleted from database');
        
        // Также пытаемся удалить из Auth (если можем войти)
        try {
            const email = `telegram_${telegramId}@telegram.com`;
            const password = generateDeterministicPassword(telegramId);
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            await userCredential.user.delete();
            console.log('User deleted from Firebase Auth');
        } catch (authError) {
            console.log('Could not delete from Auth (might not exist):', authError.message);
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

// Детерминированная генерация пароля (всегда одинаковый для одного Telegram ID)
function generateDeterministicPassword(telegramId) {
    // Простой детерминированный пароль на основе ID
    return `tg${telegramId}pass${telegramId % 10000}`;
}

// Обработка данных от Telegram
window.handleTelegramAuth = async function(user) {
    try {
        console.log('Processing Telegram auth for user:', user);
        
        const { firebaseUser, userData } = await processUserAuthentication(user);
        
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
        
        // Обновляем статус
        document.getElementById('auth-steps').innerHTML = `
            <p>✓ Данные из Telegram получены</p>
            <p>✓ Пользователь проверен в Firebase</p>
            <p>✓ Перенаправление в игру...</p>
        `;
        
        // Перенаправляем на игровую страницу
        setTimeout(function() {
            window.location.href = '/game/game.html';
        }, 2000);
        
    } catch (error) {
        console.error('Authentication error:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        
        let errorMessage = 'Ошибка авторизации: ' + error.message;
        
        // Более понятные сообщения об ошибках
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Аккаунт уже существует. Пожалуйста, используйте кнопку "Удалить аккаунт" и попробуйте снова.';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = 'Пользователь не найден. Попробуйте авторизоваться снова.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Ошибка входа. Попробуйте удалить аккаунт и создать заново.';
        }
        
        document.getElementById('error-message').textContent = errorMessage;
    }
};

// Функция для удаления аккаунта (для отладки)
window.deleteCurrentUser = async function() {
    try {
        // Получаем Telegram user из URL параметров если есть
        let telegramUser;
        try {
            const searchParams = new URLSearchParams(window.location.search);
            if (searchParams.get('id')) {
                telegramUser = {
                    id: parseInt(searchParams.get('id')),
                    first_name: decodeURIComponent(searchParams.get('first_name') || ''),
                    last_name: decodeURIComponent(searchParams.get('last_name') || ''),
                    username: searchParams.get('username') || ''
                };
            }
        } catch (e) {
            console.log('Could not get user from URL');
        }
        
        // Если нет в URL, пробуем из localStorage
        if (!telegramUser) {
            telegramUser = JSON.parse(localStorage.getItem('telegramUser'));
        }
        
        if (!telegramUser || !telegramUser.id) {
            alert('Пользователь не найден. Сначала авторизуйтесь через Telegram.');
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