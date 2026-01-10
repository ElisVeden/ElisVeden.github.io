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
    const testContainer = document.getElementById('testContainer');
    const startTestBtn = document.getElementById('startTest');
    const includeExamplesCheckbox = document.getElementById('includeExamples');
    const onlyFavoritesCheckbox = document.getElementById('onlyFavorites');
    const chapterSelect = document.getElementById('chapterSelect');
    const questionsCountInput = document.getElementById('questionsCount');
    
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

    // Данные для теста
    let testQuestions = [];
    let currentQuestionIndex = 0;
    let testScore = 0;
    let userAnswers = [];

    // Функция для заполнения селектора глав
    function populateChapterSelect() {
        const chapters = new Set(dictionary.map(word => word.chapter));
        const sortedChapters = Array.from(chapters).sort((a, b) => {
            const aParts = a.split('.').map(Number);
            const bParts = b.split('.').map(Number);
            for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                const aVal = aParts[i] || 0;
                const bVal = bParts[i] || 0;
                if (aVal !== bVal) return aVal - bVal;
            }
            return 0;
        });
        
        sortedChapters.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter;
            option.textContent = `Глава ${chapter}`;
            chapterSelect.appendChild(option);
        });
    }

    // Генерация случайных неправильных вариантов ответа
    function generateWrongOptions(correctWord, count = 3) {
        const wrongOptions = [];
        const allWords = dictionary.filter(word => word.id !== correctWord.id);
        
        // Берем случайные слова из словаря
        for (let i = 0; i < count; i++) {
            if (allWords.length > 0) {
                const randomIndex = Math.floor(Math.random() * allWords.length);
                wrongOptions.push(allWords[randomIndex].russian);
                // Удаляем выбранное слово, чтобы избежать повторов
                allWords.splice(randomIndex, 1);
            } else {
                // Если слов не хватает, добавляем заглушки
                wrongOptions.push(`Вариант ${i + 1}`);
            }
        }
        
        return wrongOptions;
    }

    // Создание вопроса
    function createQuestion(word, includeExamples) {
        const questionType = Math.random() > 0.5 ? 'english' : 'russian';
        let questionText = '';
        let correctAnswer = '';
        
        if (questionType === 'english') {
            questionText = word.english;
            if (includeExamples && word.examples && word.examples.length > 0) {
                // С шансом 30% используем пример вместо слова
                if (Math.random() < 0.3) {
                    const randomExample = word.examples[Math.floor(Math.random() * word.examples.length)];
                    questionText = randomExample;
                }
            }
            correctAnswer = word.russian;
        } else {
            questionText = word.russian;
            correctAnswer = word.english;
        }
        
        const wrongOptions = generateWrongOptions(word, 3);
        const allOptions = [correctAnswer, ...wrongOptions];
        
        // Перемешиваем варианты
        for (let i = allOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
        }
        
        return {
            question: questionText,
            correctAnswer,
            options: allOptions,
            type: questionType,
            word: word
        };
    }

    // Создание теста
    function createTest() {
        testQuestions = [];
        currentQuestionIndex = 0;
        testScore = 0;
        userAnswers = [];
        
        let wordsPool = dictionary;
        
        // Фильтрация по избранному
        if (onlyFavoritesCheckbox.checked) {
            wordsPool = wordsPool.filter(word => favorites.includes(word.id));
        }
        
        // Фильтрация по главе
        const selectedChapter = chapterSelect.value;
        if (selectedChapter) {
            wordsPool = wordsPool.filter(word => word.chapter === selectedChapter);
        }
        
        if (wordsPool.length === 0) {
            alert('Нет слов для теста. Проверьте фильтры.');
            return false;
        }
        
        const questionsCount = Math.min(parseInt(questionsCountInput.value), wordsPool.length);
        const includeExamples = includeExamplesCheckbox.checked;
        
        // Выбираем случайные слова для теста
        const selectedWords = [];
        const usedIndices = new Set();
        
        while (selectedWords.length < questionsCount && selectedWords.length < wordsPool.length) {
            const randomIndex = Math.floor(Math.random() * wordsPool.length);
            if (!usedIndices.has(randomIndex)) {
                selectedWords.push(wordsPool[randomIndex]);
                usedIndices.add(randomIndex);
            }
        }
        
        // Создаем вопросы
        selectedWords.forEach(word => {
            testQuestions.push(createQuestion(word, includeExamples));
        });
        
        return true;
    }

    // Отображение вопроса
    function displayQuestion() {
        if (currentQuestionIndex >= testQuestions.length) {
            showResults();
            return;
        }
        
        const question = testQuestions[currentQuestionIndex];
        const questionNumber = currentQuestionIndex + 1;
        const totalQuestions = testQuestions.length;
        
        testContainer.innerHTML = `
            <div class="test-container active">
                <div class="test-question">
                    <div class="question-type">
                        ${question.type === 'english' ? '🇺🇸 Переведите с английского' : '🇷🇺 Переведите с русского'}
                    </div>
                    <div class="question-text">${question.question}</div>
                    
                    <div class="test-options-grid">
                        ${question.options.map((option, index) => `
                            <button class="option-btn" data-index="${index}">
                                ${option}
                            </button>
                        `).join('')}
                    </div>
                    
                    <div class="test-navigation">
                        <div>
                            <div class="test-progress">
                                Вопрос ${questionNumber} из ${totalQuestions}
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(questionNumber / totalQuestions) * 100}%"></div>
                            </div>
                        </div>
                        
                        <button id="nextQuestion" class="btn-test" ${userAnswers[currentQuestionIndex] === undefined ? 'disabled' : ''}>
                            ${questionNumber === totalQuestions ? 'Завершить тест' : 'Следующий вопрос'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем обработчики для вариантов ответа
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const selectedIndex = parseInt(this.dataset.index);
                const isCorrect = question.options[selectedIndex] === question.correctAnswer;
                
                // Убираем выделение у всех кнопок
                document.querySelectorAll('.option-btn').forEach(b => {
                    b.classList.remove('selected');
                    b.disabled = true;
                });
                
                // Выделяем выбранную
                this.classList.add('selected');
                if (!isCorrect) {
                    this.classList.add('incorrect');
                }
                
                // Находим правильный ответ и выделяем его
                const correctIndex = question.options.indexOf(question.correctAnswer);
                document.querySelector(`.option-btn[data-index="${correctIndex}"]`).classList.add('correct');
                
                // Сохраняем ответ
                userAnswers[currentQuestionIndex] = {
                    selected: selectedIndex,
                    correct: correctIndex,
                    isCorrect: isCorrect
                };
                
                // Обновляем счет
                if (isCorrect) {
                    testScore++;
                }
                
                // Активируем кнопку "Далее"
                document.getElementById('nextQuestion').disabled = false;
            });
        });
        
        // Обработчик кнопки "Далее"
        document.getElementById('nextQuestion').addEventListener('click', function() {
            currentQuestionIndex++;
            displayQuestion();
        });
    }

    // Показать результаты
    function showResults() {
        const percentage = Math.round((testScore / testQuestions.length) * 100);
        let message = '';
        
        if (percentage >= 90) message = 'Отлично! Вы знаете эти слова на отлично! 🎉';
        else if (percentage >= 70) message = 'Хорошо! Но есть что повторить 👍';
        else if (percentage >= 50) message = 'Неплохо, но нужно больше практики 💪';
        else message = 'Повторите слова и попробуйте еще раз 📚';
        
        testContainer.innerHTML = `
            <div class="test-results active">
                <i class="fas fa-trophy" style="font-size: 4rem; color: #ffd700; margin-bottom: 20px;"></i>
                <h2>Тест завершен!</h2>
                
                <div class="result-score">${percentage}%</div>
                <div class="result-message">${message}</div>
                
                <div class="result-details">
                    <div>
                        <strong>Правильных ответов:</strong> ${testScore} из ${testQuestions.length}
                    </div>
                    <div>
                        <strong>Время:</strong> ${Math.round(testQuestions.length * 0.5)} мин (примерно)
                    </div>
                    <div>
                        <strong>Точность:</strong> ${percentage}%
                    </div>
                </div>
                
                <h3 style="margin-top: 30px; margin-bottom: 15px;">Разбор ответов:</h3>
                <div class="answers-review">
                    ${testQuestions.map((q, index) => {
                        const answer = userAnswers[index];
                        const isCorrect = answer?.isCorrect;
                        
                        return `
                            <div class="result-item ${isCorrect ? 'correct' : 'incorrect'}">
                                <strong>${index + 1}. ${q.question}</strong>
                                <div>Ваш ответ: ${q.options[answer?.selected] || 'Нет ответа'}</div>
                                <div>Правильный ответ: ${q.correctAnswer}</div>
                                ${q.type === 'english' ? 
                                    `<div class="answer-review">Слово: ${q.word.english} → ${q.word.russian}</div>` :
                                    `<div class="answer-review">Перевод: ${q.word.russian} → ${q.word.english}</div>`
                                }
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: center;">
                    <button id="restartTest" class="btn-test">
                        <i class="fas fa-redo"></i> Пройти еще раз
                    </button>
                    <button id="backToDictionary" class="btn-secondary">
                        <i class="fas fa-book"></i> К словарю
                    </button>
                </div>
            </div>
        `;
        
        // Обработчики кнопок в результатах
        document.getElementById('restartTest').addEventListener('click', startTest);
        document.getElementById('backToDictionary').addEventListener('click', () => {
            document.querySelector('[data-tab="dictionary"]').click();
        });
    }

    // Запуск теста
    function startTest() {
        if (createTest()) {
            displayQuestion();
        }
    }

    // Инициализация теста при переключении на вкладку
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            
            // При переключении на тест, показываем стартовый экран
            if (tab === 'test') {
                testContainer.innerHTML = `
                    <div class="test-start-screen">
                        <i class="fas fa-brain" style="font-size: 4rem; color: #4361ee; margin-bottom: 20px;"></i>
                        <h2>Проверьте свои знания</h2>
                        <p>Выберите настройки и начните тест. Вам будут предложены слова или фразы, и нужно выбрать правильный перевод из 4 вариантов.</p>
                        <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: center;">
                            <button id="startTestFromScreen" class="btn-test" style="font-size: 1.1rem; padding: 15px 30px;">
                                <i class="fas fa-play-circle"></i> Начать тест
                            </button>
                        </div>
                    </div>
                `;
                
                document.getElementById('startTestFromScreen').addEventListener('click', startTest);
            }
        });
    });

    // Обработчик кнопки старта теста
    startTestBtn.addEventListener('click', startTest);

    // В функции loadDictionary добавляем вызов заполнения глав
    async function loadDictionary() {
        try {
            const response = await fetch('dictionary.json');
            if (!response.ok) throw new Error('Ошибка загрузки словаря');
            
            const data = await response.json();
            dictionary = data.words || [];
            
            updateStats();
            renderChapters();
            updateFavoritesCount();
            populateChapterSelect(); // Добавляем эту строку
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
});
