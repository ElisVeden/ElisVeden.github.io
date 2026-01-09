document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const chaptersContainer = document.getElementById('chaptersContainer');
    const favoritesContainer = document.getElementById('favoritesContainer');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const toggleFavoritesBtn = document.getElementById('toggleFavorites');
    const shareBtn = document.getElementById('shareBtn');
    const feedbackBtn = document.getElementById('feedbackBtn');
    const favCountElement = document.getElementById('favCount');
    const favCountStat = document.getElementById('favCountStat');
    const totalWordsElement = document.getElementById('totalWords');
    const chapterCountElement = document.getElementById('chapterCount');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    // Модальные окна
    const feedbackModal = document.getElementById('feedbackModal');
    const shareModal = document.getElementById('shareModal');
    const wordShareModal = document.getElementById('wordShareModal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    // Данные
    let dictionary = [];
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let currentTab = 'dictionary';
    let currentWordForShare = null;
    
    // Загрузка данных
    async function loadDictionary() {
        try {
            const response = await fetch('dictionary.json');
            if (!response.ok) throw new Error('Ошибка загрузки словаря');
            
            const data = await response.json();
            dictionary = data.words || [];
            
            updateStats();
            renderChapters();
            updateFavoritesCount();
        } catch (error) {
            console.error('Ошибка загрузки словаря:', error);
            chaptersContainer.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px; color: #ff6b6b;"></i>
                    <h3>Ошибка загрузки словаря</h3>
                    <p>Пожалуйста, проверьте файл dictionary.json</p>
                </div>
            `;
        }
    }
    
    // Обновление статистики
    function updateStats() {
        totalWordsElement.textContent = dictionary.length;
        favCountStat.textContent = favorites.length;
        
        // Подсчет уникальных глав
        const chapters = new Set(dictionary.map(word => word.chapter));
        chapterCountElement.textContent = chapters.size;
    }
    
    // Рендер глав
    function renderChapters(filter = '') {
        chaptersContainer.innerHTML = '';
        
        if (dictionary.length === 0) return;
        
        // Группировка по главам
        const chaptersMap = {};
        let wordsToShow = dictionary;
        
        // Фильтрация
        if (filter.trim()) {
            const searchTerm = filter.toLowerCase();
            wordsToShow = dictionary.filter(word => 
                word.english.toLowerCase().includes(searchTerm) ||
                word.russian.toLowerCase().includes(searchTerm) ||
                (word.examples && word.examples.some(ex => ex.toLowerCase().includes(searchTerm)))
            );
        }
        
        // Если нет слов после фильтрации
        if (wordsToShow.length === 0) {
            chaptersContainer.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <h3>Слова не найдены</h3>
                    <p>Попробуйте другой поисковый запрос</p>
                </div>
            `;
            return;
        }
        
        // Группировка
        wordsToShow.forEach(word => {
            if (!chaptersMap[word.chapter]) {
                chaptersMap[word.chapter] = [];
            }
            chaptersMap[word.chapter].push(word);
        });
        
        // Сортировка глав
        const sortedChapters = Object.keys(chaptersMap).sort((a, b) => {
            const aParts = a.split('.').map(Number);
            const bParts = b.split('.').map(Number);
            
            for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                const aVal = aParts[i] || 0;
                const bVal = bParts[i] || 0;
                if (aVal !== bVal) return aVal - bVal;
            }
            return 0;
        });
        
        // Рендер каждой главы
        sortedChapters.forEach((chapterName, index) => {
            const chapterElement = document.createElement('div');
            chapterElement.className = 'chapter';
            chapterElement.dataset.chapter = chapterName;
            
            const words = chaptersMap[chapterName];
            
            chapterElement.innerHTML = `
                <div class="chapter-header">
                    <h3>
                        <i class="fas fa-bookmark"></i>
                        Глава ${chapterName}
                        <span class="chapter-word-count">(${words.length} слов)</span>
                    </h3>
                    <span class="chapter-arrow"><i class="fas fa-chevron-down"></i></span>
                </div>
                <div class="chapter-content">
                    <div class="words-grid">
                        ${words.map(word => createWordCard(word)).join('')}
                    </div>
                </div>
            `;
            
            // Сворачивание/разворачивание
            const header = chapterElement.querySelector('.chapter-header');
            header.addEventListener('click', () => {
                chapterElement.classList.toggle('collapsed');
            });
            
            chaptersContainer.appendChild(chapterElement);
            
            // Анимация появления
            setTimeout(() => {
                chapterElement.style.opacity = '1';
                chapterElement.style.transform = 'translateY(0)';
            }, index * 50);
        });
        
        // Добавление обработчиков для кнопок избранного и шаринга
        addWordActionHandlers();
    }
    
    // Создание карточки слова
    function createWordCard(word) {
        const isFavorite = favorites.includes(word.id);
        const example = word.examples && word.examples.length > 0 ? word.examples[0] : '';
        
        return `
            <div class="word-card ${isFavorite ? 'favorite' : ''}" data-id="${word.id}">
                <div class="word-header">
                    <h3 class="word-english">${word.english}</h3>
                    <button class="fav-btn ${isFavorite ? 'favorited' : ''}" data-id="${word.id}">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-star"></i>
                    </button>
                </div>
                <p class="transcription">${word.transcription || ''}</p>
                <p class="russian">${word.russian}</p>
                ${word.examples && word.examples.length > 0 ? `
                    <div class="examples">
                        <h4>Примеры:</h4>
                        <ul>
                            ${word.examples.map(example => `<li>${example}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                <div class="word-actions">
                    <button class="share-word-btn" data-id="${word.id}">
                        <i class="fas fa-share-alt"></i> Поделиться словом
                    </button>
                </div>
            </div>
        `;
    }
    
    // Рендер избранного
    function renderFavorites() {
        favoritesContainer.innerHTML = '';
        
        if (favorites.length === 0) {
            favoritesContainer.innerHTML = `
                <div class="empty-message">
                    <i class="far fa-star" style="font-size: 3rem; margin-bottom: 20px; color: #ffd700;"></i>
                    <h3>В избранном пусто</h3>
                    <p>Добавляйте слова, нажимая на звёздочку ☆</p>
                </div>
            `;
            return;
        }
        
        // Группировка избранного по главам
        const favoriteWords = dictionary.filter(word => favorites.includes(word.id));
        const chaptersMap = {};
        
        favoriteWords.forEach(word => {
            if (!chaptersMap[word.chapter]) {
                chaptersMap[word.chapter] = [];
            }
            chaptersMap[word.chapter].push(word);
        });
        
        // Рендер
        Object.keys(chaptersMap).forEach(chapterName => {
            const words = chaptersMap[chapterName];
            
            const chapterElement = document.createElement('div');
            chapterElement.className = 'chapter';
            chapterElement.dataset.chapter = chapterName;
            
            chapterElement.innerHTML = `
                <div class="chapter-header">
                    <h3>
                        <i class="fas fa-bookmark"></i>
                        Глава ${chapterName}
                        <span class="chapter-word-count">(${words.length} слов)</span>
                    </h3>
                    <span class="chapter-arrow"><i class="fas fa-chevron-down"></i></span>
                </div>
                <div class="chapter-content">
                    <div class="words-grid">
                        ${words.map(word => createWordCard(word)).join('')}
                    </div>
                </div>
            `;
            
            const header = chapterElement.querySelector('.chapter-header');
            header.addEventListener('click', () => {
                chapterElement.classList.toggle('collapsed');
            });
            
            favoritesContainer.appendChild(chapterElement);
        });
        
        addWordActionHandlers();
    }
    
    // Добавление обработчиков для кнопок
    function addWordActionHandlers() {
        // Кнопки избранного
        document.querySelectorAll('.fav-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const wordId = parseInt(this.dataset.id);
                toggleFavorite(wordId);
            });
        });
        
        // Кнопки поделиться словом
        document.querySelectorAll('.share-word-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const wordId = parseInt(this.dataset.id);
                openWordShareModal(wordId);
            });
        });
    }
    
    // Открытие модального окна для шаринга слова
    function openWordShareModal(wordId) {
        const word = dictionary.find(w => w.id === wordId);
        if (!word) return;
        
        currentWordForShare = word;
        
        // Обновляем содержимое модального окна
        const modalContent = document.querySelector('#wordShareModal .share-content');
        const example = word.examples && word.examples.length > 0 ? word.examples[0] : 'Нет примера';
        
        modalContent.innerHTML = `
            <div class="share-preview">
                <h4>${word.english}</h4>
                <p><strong>Транскрипция:</strong> ${word.transcription || '—'}</p>
                <p><strong>Перевод:</strong> ${word.russian}</p>
                <p><strong>Пример:</strong> ${example}</p>
                <p><strong>Глава:</strong> ${word.chapter}</p>
            </div>
            <h3>Поделиться в:</h3>
            <div class="share-platforms">
                <button class="share-platform" data-platform="telegram-word">
                    <i class="fab fa-telegram"></i> Telegram
                </button>
                <button class="share-platform" data-platform="whatsapp-word">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="share-platform" data-platform="vk-word">
                    <i class="fab fa-vk"></i> ВКонтакте
                </button>
                <button class="share-platform" data-platform="twitter-word">
                    <i class="fab fa-twitter"></i> Twitter
                </button>
                <button class="share-platform" data-platform="email-word">
                    <i class="fas fa-envelope"></i> Email
                </button>
                <button class="share-platform" data-platform="copy-word">
                    <i class="fas fa-link"></i> Копировать
                </button>
            </div>
        `;
        
        // Добавляем обработчики для кнопок шаринга
        modalContent.querySelectorAll('.share-platform').forEach(btn => {
            btn.addEventListener('click', function() {
                const platform = this.dataset.platform;
                shareWord(platform, word);
            });
        });
        
        wordShareModal.style.display = 'block';
    }
    
    // Функция шаринга слова
    function shareWord(platform, word) {
        const currentUrl = window.location.href;
        const example = word.examples && word.examples.length > 0 ? word.examples[0] : '';
        
        // Формируем текст для шаринга
        const shareText = `📚 Английское слово из словаря:

🔤 ${word.english}
📝 ${word.transcription || ''}
🇷🇺 ${word.russian}
💬 ${example}
📖 Глава: ${word.chapter}

Изучай английский с нами! ${currentUrl}`;
        
        const shareTitle = `Английское слово: ${word.english}`;
        
        let shareUrl = '';
        
        switch(platform) {
            case 'telegram-word':
                shareUrl = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
                break;
            case 'whatsapp-word':
                shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
                break;
            case 'vk-word':
                shareUrl = `https://vk.com/share.php?url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(shareTitle)}&description=${encodeURIComponent(shareText)}`;
                break;
            case 'twitter-word':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
                break;
            case 'email-word':
                shareUrl = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText)}`;
                break;
            case 'copy-word':
                navigator.clipboard.writeText(shareText)
                    .then(() => showNotification('Текст слова скопирован!', 'success'))
                    .catch(() => {
                        // Fallback для старых браузеров
                        const textArea = document.createElement('textarea');
                        textArea.value = shareText;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        showNotification('Текст слова скопирован!', 'success');
                    });
                return;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
            showNotification('Открываем окно для отправки...', 'info');
        }
        
        wordShareModal.style.display = 'none';
    }
    
    // Всплывающее уведомление
    function showNotification(message, type = 'info') {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Стили для уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : '#0c5460'};
            padding: 15px 20px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            border-left: 4px solid ${type === 'success' ? '#28a745' : '#17a2b8'};
        `;
        
        // Анимация
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Автоматическое скрытие через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Переключение избранного
    function toggleFavorite(wordId) {
        const index = favorites.indexOf(wordId);
        
        if (index === -1) {
            favorites.push(wordId);
            showNotification('Слово добавлено в избранное!', 'success');
        } else {
            favorites.splice(index, 1);
            showNotification('Слово удалено из избранного', 'info');
        }
        
        // Сохранение в localStorage
        localStorage.setItem('favorites', JSON.stringify(favorites));
        
        // Обновление UI
        updateFavoritesCount();
        
        // Обновление отображения в зависимости от текущей вкладки
        if (currentTab === 'dictionary') {
            renderChapters(searchInput.value);
        } else {
            renderFavorites();
        }
    }
    
    // Обновление счетчика избранного
    function updateFavoritesCount() {
        const count = favorites.length;
        favCountElement.textContent = count;
        toggleFavoritesBtn.innerHTML = `
            <i class="far fa-star"></i> Избранное (${count})
        `;
    }
    
    // Переключение вкладок
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            
            // Обновление активной вкладки
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            document.getElementById(`${tab}Tab`).classList.add('active');
            
            currentTab = tab;
            
            // Перерендер
            if (tab === 'favorites') {
                renderFavorites();
            } else {
                renderChapters(searchInput.value);
            }
        });
    });
    
    // Поиск
    searchInput.addEventListener('input', function() {
        renderChapters(this.value);
    });
    
    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        renderChapters('');
        searchInput.focus();
    });
    
    // Модальные окна
    feedbackBtn.addEventListener('click', () => {
        feedbackModal.style.display = 'block';
        document.getElementById('feedbackText').focus();
    });
    
    shareBtn.addEventListener('click', () => {
        shareModal.style.display = 'block';
    });
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            feedbackModal.style.display = 'none';
            shareModal.style.display = 'none';
            if (wordShareModal) wordShareModal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === feedbackModal || e.target === shareModal || 
            (wordShareModal && e.target === wordShareModal)) {
            feedbackModal.style.display = 'none';
            shareModal.style.display = 'none';
            if (wordShareModal) wordShareModal.style.display = 'none';
        }
    });
    
    // Отправка фидбека
    document.getElementById('sendFeedback').addEventListener('click', async function() {
        const feedbackText = document.getElementById('feedbackText').value.trim();
        
        if (!feedbackText) {
            showNotification('Пожалуйста, введите сообщение', 'info');
            return;
        }
        
        try {
            // Формируем данные
            const feedbackData = {
                text: feedbackText,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                favoritesCount: favorites.length
            };
            
            // Создаем и скачиваем файл
            const feedbackMessage = `Текст: ${feedbackData.text}\nВремя: ${feedbackData.timestamp}\n\n---\n\n`;
            const blob = new Blob([feedbackMessage], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'feedback.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('Спасибо! Файл с сообщением скачан.', 'success');
            document.getElementById('feedbackText').value = '';
            feedbackModal.style.display = 'none';
            
        } catch (error) {
            console.error('Ошибка при отправке фидбека:', error);
            showNotification('Произошла ошибка. Попробуйте еще раз.', 'info');
        }
    });
    
    document.getElementById('cancelFeedback').addEventListener('click', () => {
        feedbackModal.style.display = 'none';
    });
    
    // Шаринг всего словаря
    document.querySelectorAll('.share-option').forEach(btn => {
        btn.addEventListener('click', function() {
            const platform = this.dataset.platform;
            const url = window.location.href;
            const title = 'English Story Dictionary - Словарь к главам';
            const text = 'Посмотрите этот полезный словарь для изучения английского языка!';
            
            let shareUrl = '';
            
            switch(platform) {
                case 'telegram':
                    shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
                    break;
                case 'whatsapp':
                    shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
                    break;
                case 'vk':
                    shareUrl = `https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
                    break;
                case 'email':
                    shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`;
                    break;
                case 'copy':
                    navigator.clipboard.writeText(url)
                        .then(() => showNotification('Ссылка скопирована!', 'success'))
                        .catch(() => {
                            // Fallback для старых браузеров
                            const textArea = document.createElement('textarea');
                            textArea.value = url;
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                            showNotification('Ссылка скопирована!', 'success');
                        });
                    return;
            }
            
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=400');
            }
            
            shareModal.style.display = 'none';
        });
    });
    
    // Горячие клавиши
    document.addEventListener('keydown', (e) => {
        // Ctrl+F для поиска
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchInput.focus();
        }
        
        // Escape для закрытия модальных окон
        if (e.key === 'Escape') {
            feedbackModal.style.display = 'none';
            shareModal.style.display = 'none';
            if (wordShareModal) wordShareModal.style.display = 'none';
        }
        
        // Ctrl+S для переключения в избранное
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            document.querySelector('[data-tab="favorites"]').click();
        }
    });
    
    // Инициализация
    loadDictionary();
});
