// Проверка авторизации при загрузке игры
function checkAuthentication() {
    const telegramUser = localStorage.getItem('telegramUser');
    const firebaseUser = localStorage.getItem('firebaseUser');
    
    if (!telegramUser || !firebaseUser) {
        console.log('User not authenticated, redirecting to home...');
        window.location.href = '/';
        return false;
    }
    
    console.log('User authenticated:', JSON.parse(telegramUser).first_name);
    return true;
}

// Получение данных пользователя
function getCurrentUser() {
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
        console.error('Error getting user data:', error);
        return null;
    }
}

// Функция для выхода
function logout() {
    localStorage.removeItem('telegramUser');
    localStorage.removeItem('firebaseUser');
    localStorage.removeItem('firebaseAuth');
    window.location.href = '/';
}

// Функция для удаления аккаунта
function deleteAccount() {
    if (confirm('Вы уверены, что хотите удалить свой аккаунт? Это действие нельзя отменить.')) {
        if (typeof deleteCurrentUser === 'function') {
            deleteCurrentUser();
        } else {
            // Fallback если функция недоступна
            localStorage.removeItem('telegramUser');
            localStorage.removeItem('firebaseUser');
            localStorage.removeItem('firebaseAuth');
            alert('Аккаунт удален из localStorage');
            window.location.href = '/';
        }
    }
}

// Добавление элементов управления аккаунтом
function addAccountControls() {
    const user = getCurrentUser();
    if (!user) return;
    
    const controlsContainer = document.createElement('div');
    controlsContainer.style.position = 'fixed';
    controlsContainer.style.top = '10px';
    controlsContainer.style.right = '10px';
    controlsContainer.style.zIndex = '1000';
    controlsContainer.style.fontFamily = 'Arial, sans-serif';
    
    controlsContainer.innerHTML = `
        <div style="background: rgba(0,0,0,0.8); padding: 15px; border-radius: 8px; color: white; font-size: 14px; min-width: 200px;">
            <div style="margin-bottom: 10px; border-bottom: 1px solid #555; padding-bottom: 8px;">
                <strong>${user.telegram.first_name || 'User'}</strong>
                ${user.telegram.username ? `<br>@${user.telegram.username}` : ''}
                ${user.firebase ? `<br><small>ID: ${user.firebase.telegramId}</small>` : ''}
            </div>
            <button onclick="logout()" style="margin: 2px; padding: 8px 12px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">Выйти</button>
            <button onclick="deleteAccount()" style="margin: 2px; padding: 8px 12px; background: #ff4444; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">Удалить аккаунт</button>
        </div>
    `;
    
    document.body.appendChild(controlsContainer);
}

// Сохранение игрового прогресса в Firebase
function saveGameProgress(progressData) {
    const user = getCurrentUser();
    if (!user || !user.firebase) return;
    
    try {
        if (typeof firebase !== 'undefined') {
            firebase.database().ref('gameProgress/' + user.firebase.telegramId).set({
                ...progressData,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log('Game progress saved to Firebase');
        }
    } catch (error) {
        console.error('Error saving game progress:', error);
    }
}

// Загрузка игрового прогресса из Firebase
async function loadGameProgress() {
    const user = getCurrentUser();
    if (!user || !user.firebase) return null;
    
    try {
        if (typeof firebase !== 'undefined') {
            const snapshot = await firebase.database().ref('gameProgress/' + user.firebase.telegramId).once('value');
            return snapshot.exists() ? snapshot.val() : null;
        }
    } catch (error) {
        console.error('Error loading game progress:', error);
    }
    
    return null;
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async function() {
    // Проверяем авторизацию
    if (!checkAuthentication()) {
        return;
    }
    
    // Добавляем элементы управления
    addAccountControls();
    
    // Загружаем игровой прогресс
    const savedProgress = await loadGameProgress();
    if (savedProgress) {
        console.log('Loaded game progress:', savedProgress);
        // Восстанавливаем прогресс игры
    }
    
    // Ваш существующий код игры здесь...
    console.log('Game initialized for user:', getCurrentUser().telegram.first_name);
    
    // Пример сохранения прогресса
    // saveGameProgress({ level: 1, score: 1000 });
});

// Делаем функции глобальными для использования в HTML
window.logout = logout;
window.deleteAccount = deleteAccount;

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