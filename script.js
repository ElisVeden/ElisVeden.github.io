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
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    // Данные
    let dictionary = [];
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let currentTab = 'dictionary';
    
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
        
        // Добавление обработчиков для кнопок избранного
        addFavoriteHandlers();
    }
    
    // Создание карточки слова
    function createWordCard(word) {
        const isFavorite = favorites.includes(word.id);
        
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
        
        addFavoriteHandlers();
    }
    
    // Добавление обработчиков для кнопок избранного
    function addFavoriteHandlers() {
        document.querySelectorAll('.fav-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const wordId = parseInt(this.dataset.id);
                toggleFavorite(wordId);
            });
        });
    }
    
    // Переключение избранного
    function toggleFavorite(wordId) {
        const index = favorites.indexOf(wordId);
        
        if (index === -1) {
            favorites.push(wordId);
        } else {
            favorites.splice(index, 1);
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
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === feedbackModal || e.target === shareModal) {
            feedbackModal.style.display = 'none';
            shareModal.style.display = 'none';
        }
    });
    
    // Отправка фидбека
    document.getElementById('sendFeedback').addEventListener('click', async function() {
        const feedbackText = document.getElementById('feedbackText').value.trim();
        
        if (!feedbackText) {
            alert('Пожалуйста, введите сообщение');
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
            
            // В реальном проекте здесь был бы AJAX-запрос на сервер
            // Для GitHub Pages просто показываем сообщение
            const feedbackMessage = `Текст: ${feedbackData.text}\nВремя: ${feedbackData.timestamp}\n\n---\n\n`;
            
            // Создаем и скачиваем файл
            const blob = new Blob([feedbackMessage], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'feedback.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('Спасибо за обратную связь! Файл с вашим сообщением скачан.');
            document.getElementById('feedbackText').value = '';
            feedbackModal.style.display = 'none';
            
        } catch (error) {
            console.error('Ошибка при отправке фидбека:', error);
            alert('Произошла ошибка. Попробуйте еще раз.');
        }
    });
    
    document.getElementById('cancelFeedback').addEventListener('click', () => {
        feedbackModal.style.display = 'none';
    });
    
    // Шаринг
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
                        .then(() => alert('Ссылка скопирована в буфер обмена!'))
                        .catch(() => {
                            // Fallback для старых браузеров
                            const textArea = document.createElement('textarea');
                            textArea.value = url;
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                            alert('Ссылка скопирована в буфер обмена!');
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
