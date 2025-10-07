// game.js
// Проверка авторизации
if (typeof checkAuth === 'function' && !checkAuth()) {
    window.location.href = '/';
    throw new Error('User not authenticated');
}

// Получение данных пользователя
let currentUser = null;
if (typeof getCurrentUser === 'function') {
    currentUser = getCurrentUser();
    
    if (currentUser && currentUser.telegram) {
        console.log('Authenticated user:', currentUser.telegram.username);
        // Здесь можно отобразить информацию о пользователе в интерфейсе
    }
}

// Функция для выхода
function logout() {
    localStorage.removeItem('telegramUser');
    localStorage.removeItem('firebaseUser');
    window.location.href = '/';
}

// Функция для удаления аккаунта
function deleteAccount() {
    if (typeof deleteCurrentUser === 'function') {
        deleteCurrentUser();
    } else {
        alert('Функция удаления недоступна');
    }
}

// Добавьте кнопки управления аккаунтом в ваш интерфейс
function addAccountControls() {
    // Найдем подходящее место в вашем интерфейсе для добавления кнопок
    const controlsContainer = document.createElement('div');
    controlsContainer.style.position = 'fixed';
    controlsContainer.style.top = '10px';
    controlsContainer.style.right = '10px';
    controlsContainer.style.zIndex = '1000';
    
    controlsContainer.innerHTML = `
        <div style="background: rgba(0,0,0,0.8); padding: 10px; border-radius: 5px; color: white;">
            <div>User: ${currentUser?.telegram?.first_name || 'Unknown'}</div>
            <button onclick="logout()" style="margin: 5px; padding: 5px 10px;">Logout</button>
            <button onclick="deleteAccount()" style="margin: 5px; padding: 5px 10px; background: #ff4444; color: white; border: none;">Delete Account</button>
        </div>
    `;
    
    document.body.appendChild(controlsContainer);
}

// Добавляем элементы управления после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    if (currentUser) {
        addAccountControls();
    }
});

class Game {
    constructor() {
        this.timePatience = 100;
        this.codeFragments = 3;
        this.timeShards = 0;
        this.currentLocation = "Деревня Бесконечного Утра";
        this.init();
    }

    init() {
        this.loadGameState();
        this.updateUI();
        this.startTimeLoop();
    }

    loadGameState() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            console.log('Загружен пользователь:', user);
        }

        const gameState = localStorage.getItem('gameState');
        if (gameState) {
            const state = JSON.parse(gameState);
            this.timePatience = state.timePatience || 100;
            this.codeFragments = state.codeFragments || 3;
            this.timeShards = state.timeShards || 0;
        }
    }

    saveGameState() {
        const gameState = {
            timePatience: this.timePatience,
            codeFragments: this.codeFragments,
            timeShards: this.timeShards,
            currentLocation: this.currentLocation,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem('gameState', JSON.stringify(gameState));
    }

    updateUI() {
        document.getElementById('timePatience').textContent = this.timePatience;
        document.getElementById('codeFragments').textContent = this.codeFragments;
        document.getElementById('timeShards').textContent = this.timeShards;
        document.getElementById('inventoryFragments').textContent = this.codeFragments;
        document.getElementById('inventoryShards').textContent = this.timeShards;
    }

    startTimeLoop() {
        // Анимация частиц времени
        setInterval(() => {
            const particles = document.querySelector('.time-particles');
            particles.style.animation = 'particleFloat 20s infinite linear';
        }, 20000);
    }

    changeTimePatience(amount) {
        this.timePatience = Math.max(0, Math.min(100, this.timePatience + amount));
        this.updateUI();
        this.saveGameState();

        if (this.timePatience <= 0) {
            this.gameOver();
        }
    }

    useCodeFragment() {
        if (this.codeFragments > 0) {
            this.codeFragments--;
            this.changeTimePatience(10);
            this.showMessage('💎 Использован фрагмент кода! +10 к терпению времени');
            this.updateUI();
            this.saveGameState();
        } else {
            this.showMessage('❌ Нет фрагментов кода!');
        }
    }

    gameOver() {
        this.showMessage('💀 Терпение времени иссякло! Мир поглощен хаосом...', true);
        setTimeout(() => {
            if (confirm('Начать заново?')) {
                this.resetGame();
            }
        }, 2000);
    }

    resetGame() {
        this.timePatience = 100;
        this.codeFragments = 3;
        this.timeShards = 0;
        this.updateUI();
        this.saveGameState();
        this.showMessage('🌀 Время перезапущено!');
    }

    showMessage(text, isError = false) {
        // Создаем временное уведомление
        const message = document.createElement('div');
        message.className = `message ${isError ? 'error' : 'success'}`;
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(26, 26, 58, 0.95);
            padding: 1rem 2rem;
            border-radius: 10px;
            border: 2px solid ${isError ? 'var(--error)' : 'var(--success)'};
            z-index: 1001;
            font-size: 1.1rem;
            animation: fadeInOut 3s ease-in-out;
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }
}

// Инициализация игры
const game = new Game();

// Функции для взаимодействия с UI
function showPuzzle() {
    document.getElementById('actionButtons').classList.add('hidden');
    document.getElementById('puzzleSection').classList.remove('hidden');
}

function hidePuzzle() {
    document.getElementById('actionButtons').classList.remove('hidden');
    document.getElementById('puzzleSection').classList.add('hidden');
}

function checkAnswer(answer) {
    const correctAnswer = '!anvilIsHot';
    
    if (answer === correctAnswer) {
        game.showMessage('✅ Верно! Время начинает двигаться!');
        game.changeTimePatience(20);
        game.timeShards += 1;
        game.updateUI();
        game.saveGameState();
        
        // Обновляем диалог
        document.getElementById('dialogueText').textContent = 
            'Отлично! Код исправлен. Кузнец наконец-то ударил по наковальне. ' +
            'Время в деревне медленно начинает двигаться вперед. ' +
            'Ты получаешь Осколок Времени!';
        
        setTimeout(hidePuzzle, 3000);
    } else {
        game.showMessage('❌ Неверно! Терпение времени уменьшается.', true);
        game.changeTimePatience(-10);
        hidePuzzle();
    }
}

function talkToCharacter() {
    game.showMessage('🗣️ Кузнец: "Я... я не могу двигаться... код... сломан..."');
}

function useCodeFragment() {
    game.useCodeFragment();
}

function toggleInventory() {
    document.getElementById('inventoryModal').classList.toggle('hidden');
}

function showMap() {
    document.getElementById('mapModal').classList.toggle('hidden');
}

function showHint() {
    game.showMessage('💡 Подсказка: Используй логическое "НЕ" для инвертирования значения false');
}

function showMenu() {
    if (confirm('Вернуться на главный экран?')) {
        window.location.href = 'index.html';
    }
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

// CSS для анимации сообщений
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -40%); }
        20% { opacity: 1; transform: translate(-50%, -50%); }
        80% { opacity: 1; transform: translate(-50%, -50%); }
        100% { opacity: 0; transform: translate(-50%, -60%); }
    }
`;
document.head.appendChild(style);

// Закрытие модалок по клику вне контента
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModals();
    }
});