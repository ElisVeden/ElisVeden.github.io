// script.js
// Проверяем, авторизован ли пользователь
if (typeof checkAuth === 'function' && checkAuth()) {
    // Если пользователь уже авторизован, перенаправляем в игру
    window.location.href = '/game/game.html';
}

document.addEventListener('DOMContentLoaded', function () {
    const loginBtn = document.getElementById('loginBtn');
    const authModal = document.getElementById('authModal');
    const closeModal = document.querySelector('.close-modal');

    // Открытие модального окна авторизации
    loginBtn.addEventListener('click', openAuthModal);

    // Закрытие модального окна
    closeModal.addEventListener('click', closeAuthModal);
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) closeAuthModal();
    });

    // Инициализация Telegram Widget
    initTelegramWidget();

    function openAuthModal() {
        authModal.classList.remove('hidden');
    }

    function closeAuthModal() {
        authModal.classList.add('hidden');
    }

    function initTelegramWidget() {
        const container = document.getElementById('telegram-login-container');
        if (!container) return;

        // Очищаем контейнер
        container.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', 'code_weaver_gamebot'); // Убедитесь что имя бота правильное
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-auth-url', 'https://elisveden.github.io/auth/telegram-callback.html'); // Полный URL
        script.setAttribute('data-request-access', 'write');
        script.async = true;

        container.appendChild(script);

        console.log('Telegram Widget инициализирован для бота: code_weaver_gamebot');
    }

    // В script.js обновите функцию handleTelegramAuth
    window.handleTelegramAuth = function (userData) {
        console.log('Telegram user authenticated:', userData);

        const user = {
            id: userData.id,
            firstName: userData.first_name,
            lastName: userData.last_name || '',
            username: userData.username,
            authDate: userData.auth_date,
            hash: userData.hash,
            registeredAt: new Date().toISOString()
        };

        // Сохраняем в localStorage
        saveUserToStorage(user);

        // Отправляем уведомление боту (опционально)
        notifyBotAboutLogin(user);

        showWelcomeMessage(user.firstName);
        closeAuthModal();
    };

    function notifyBotAboutLogin(user) {
        // Можно отправить запрос на ваш сервер чтобы бот отправил приветствие
        console.log('Пользователь авторизовался:', user);
        // В будущем можно добавить запрос к вашему API
    }

    function registerUserInFirebase(user) {
        // Отправляем данные пользователя на наш сервер/бот
        fetch('https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: user.id, // Отправляем сообщение пользователю
                text: `🎮 Добро пожаловать в Рунный Следопыт, ${user.firstName}!\n\nВаш прогресс будет сохранен. Начинаем игру!`,
                parse_mode: 'HTML'
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Сообщение отправлено:', data);
                // Здесь можно добавить логику сохранения в Firebase
                saveUserToFirebase(user);
            })
            .catch(error => {
                console.error('Ошибка отправки сообщения:', error);
                // Все равно продолжаем игру
                saveUserToFirebase(user);
            });
    }

    function saveUserToFirebase(user) {
        // Временное сохранение в localStorage
        // В реальном приложении здесь будет запрос к вашему серверу
        const users = JSON.parse(localStorage.getItem('gameUsers') || '{}');
        users[user.id] = {
            ...user,
            registeredAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            progress: {
                level: 1,
                completedPuzzles: [],
                timePatience: 100
            }
        };
        localStorage.setItem('gameUsers', JSON.stringify(users));
        console.log('Пользователь сохранен:', user);
    }

    function startGame() {
        console.log('Игра началась!');
        // Здесь будет переход к основной игре
         window.location.href = '/game.html';
    }
});

// Функция для сворачивания/разворачивания
function toggleCollapse(id, forceOpen = false) {
    const content = document.getElementById(id);
    const header = content.previousElementSibling;
    const icon = header.querySelector('i');

    if (forceOpen || !content.classList.contains('open')) {
        content.classList.add('open');
        header.classList.add('active');
        icon.style.transform = 'rotate(180deg)';
    } else {
        content.classList.remove('open');
        header.classList.remove('active');
        icon.style.transform = 'rotate(0deg)';
    }
}

/* // Автоматически открываем жанры и требования при загрузке
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        toggleCollapse('genres', true);
        toggleCollapse('requirements', true);
    }, 1000);
}); */