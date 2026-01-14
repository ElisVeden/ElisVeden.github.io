// Полный исправленный файл app.js
document.addEventListener('DOMContentLoaded', function () {
    // Элементы DOM
    const chaptersContainer = document.getElementById('chaptersContainer');
    const favoritesContainer = document.getElementById('favoritesContainer');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const toggleFavoritesBtn = document.getElementById('toggleFavorites');
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
    const donationBtn = document.getElementById('donationBtn');
    const donationModal = document.getElementById('donationModal');
    const donateLink = document.getElementById('donateLink');
    const goToDictionaryBtn = document.querySelector('.go-to-dictionary');
    const goToFavoritesBtn = document.querySelector('.go-to-favorites');
    const goToTestBtn = document.querySelector('.go-to-test');
    const testsCountElement = document.getElementById('testsCount');

    // Модальные окна
    const feedbackModal = document.getElementById('feedbackModal');
    const closeModalBtns = document.querySelectorAll('.close-modal');

    // Данные
    let dictionary = [];
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let currentTab = 'home';

    // Данные для теста
    let testQuestions = [];
    let currentQuestionIndex = 0;
    let testScore = 0;
    let userAnswers = [];
    let wordFeedbackModal = null;

    // История тестов
    let testHistory = JSON.parse(localStorage.getItem('testHistory') || '[]');
    let wordStats = JSON.parse(localStorage.getItem('wordStats') || '{}');

    // TELEGRAM
    const TELEGRAM_BOT_TOKEN = '8454578430:AAF4j7DCIeZFnzVKcSHqFXSnfz6APaHrpKo';
    const TELEGRAM_CHAT_ID = '640508615';

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
            populateChapterSelect();

            // Инициализация вкладок
            initializeTabs();

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
        testsCountElement.textContent = testHistory.length;

        // Подсчет уникальных глав
        const chapters = new Set(dictionary.map(word => word.chapter));
        chapterCountElement.textContent = chapters.size;
    }

    // Инициализация вкладок
    function initializeTabs() {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const tab = this.dataset.tab;

                // Обновление активной вкладки
                tabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });

                document.getElementById(`${tab}Tab`).classList.add('active');

                currentTab = tab;

                // Перерендер в зависимости от вкладки
                if (tab === 'home') {
                    // Главная статична
                } else if (tab === 'favorites') {
                    renderFavorites();
                } else if (tab === 'dictionary') {
                    renderChapters(searchInput.value);
                } else if (tab === 'test') {
                    showTestStartScreen();
                }
            });
        });
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

        // Добавление обработчиков
        addWordCardHandlers();
    }

    // Создание карточки слова
    function createWordCard(word) {
        const isFavorite = favorites.includes(word.id);
        const wordStats = getWordStats(word.id);
        const statsText = wordStats ?
            `(правильно: ${wordStats.correct}/${wordStats.total}, ${wordStats.accuracy}%)` :
            '';

        return `
    <div class="word-card ${isFavorite ? 'favorite' : ''}" data-id="${word.id}">
        <div class="word-header">
            <div>
                <h3 class="word-english">${word.english}</h3>
                ${statsText ? `<div class="word-stats-badge">${statsText}</div>` : ''}
            </div>
            <div class="word-header-buttons">
                <button class="fav-btn ${isFavorite ? 'favorited' : ''}" data-id="${word.id}" title="${isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}">
                    <i class="${isFavorite ? 'fas' : 'far'} fa-star"></i>
                </button>
                <button class="word-feedback-btn" data-word-id="${word.id}" title="Сообщить об ошибке">
                    <i class="fas fa-bug"></i>
                </button>
            </div>
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
        <div class="word-footer">
            <div class="word-footer-left">
                <span class="word-chapter">Глава ${word.chapter}</span>
            </div>
            <div class="word-footer-buttons">
                <button class="word-share-btn" data-word-id="${word.id}" title="Поделиться словом">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
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

        addWordCardHandlers();
    }

    // Добавление обработчиков для карточек слов
    function addWordCardHandlers() {
        // Удаляем старые обработчики (опционально, для предотвращения дублирования)
        document.querySelectorAll('.fav-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });

        document.querySelectorAll('.word-feedback-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });

        document.querySelectorAll('.word-share-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });

        // Обработчики для кнопок избранного
        document.querySelectorAll('.fav-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const wordId = parseInt(this.dataset.id);
                toggleFavorite(wordId);
            });
        });

        // Обработчики для кнопок фидбека слов
        document.querySelectorAll('.word-feedback-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const wordId = parseInt(this.dataset.wordId);
                const word = dictionary.find(w => w.id === wordId);
                if (word) {
                    showWordFeedbackModal(word);
                }
            });
        });

        // Обработчики для кнопок поделиться
        document.querySelectorAll('.word-share-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const wordId = parseInt(this.dataset.wordId);
                const word = dictionary.find(w => w.id === wordId);
                if (word) {
                    shareWord(word);
                }
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

        // Обновление отображения
        if (currentTab === 'dictionary') {
            renderChapters(searchInput.value);
        } else if (currentTab === 'favorites') {
            renderFavorites();
        }
    }

    // Обновление счетчика избранного
    function updateFavoritesCount() {
        const count = favorites.length;
        favCountElement.textContent = count;
        if (toggleFavoritesBtn) {
            toggleFavoritesBtn.innerHTML = `
                <i class="far fa-star"></i> Избранное (${count})
            `;
        }
        favCountStat.textContent = count;
    }

    // Поиск
    searchInput?.addEventListener('input', function () {
        renderChapters(this.value);
    });

    clearSearchBtn?.addEventListener('click', function () {
        searchInput.value = '';
        renderChapters('');
        searchInput.focus();
    });

    // Модальные окна
    feedbackBtn?.addEventListener('click', () => {
        feedbackModal.style.display = 'block';
        document.getElementById('feedbackText')?.focus();
    });

    // Кнопка благодарности
    donationBtn?.addEventListener('click', () => {
        donationModal.style.display = 'block';
    });

    donateLink?.addEventListener('click', (e) => {
        e.preventDefault();
        donationModal.style.display = 'block';
    });

    // Закрытие модальных окон
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            feedbackModal.style.display = 'none';
            donationModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === feedbackModal || e.target === donationModal) {
            feedbackModal.style.display = 'none';
            donationModal.style.display = 'none';
        }
    });

    // Обработчики быстрого доступа
    goToDictionaryBtn?.addEventListener('click', () => {
        document.querySelector('[data-tab="dictionary"]').click();
    });

    goToFavoritesBtn?.addEventListener('click', () => {
        document.querySelector('[data-tab="favorites"]').click();
    });

    goToTestBtn?.addEventListener('click', () => {
        document.querySelector('[data-tab="test"]').click();
        showTestStartScreen();
    });

    // Запуск теста
    startTestBtn?.addEventListener('click', startTest);

    // Инициализация
    loadDictionary();

    // Функции для теста (остаются без изменений, копируем из оригинального кода)
    // ... [вставьте сюда все функции для теста из оригинального кода] ...
    // Для экономии места оставляем только сигнатуры, в реальном коде нужно скопировать полностью

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

    // Генерация случайных неправильных вариантов ответа (в нужном языке)
    function generateWrongOptions(correctWord, count = 3, questionType) {
        const wrongOptions = [];
        const allWords = dictionary.filter(word => word.id !== correctWord.id);

        // Определяем, какие варианты нужны: английские или русские
        const isEnglishQuestion = questionType === 'english';

        for (let i = 0; i < count; i++) {
            if (allWords.length > 0) {
                const randomIndex = Math.floor(Math.random() * allWords.length);
                // Выбираем вариант на нужном языке
                const wrongOption = isEnglishQuestion
                    ? allWords[randomIndex].russian  // для вопроса на английском нужны русские варианты
                    : allWords[randomIndex].english; // для вопроса на русском нужны английские варианты
                wrongOptions.push(wrongOption);
                allWords.splice(randomIndex, 1);
            } else {
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

        // Генерация неправильных вариантов В НУЖНОМ ЯЗЫКЕ
        const wrongOptions = generateWrongOptions(word, 3, questionType);
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
            btn.addEventListener('click', function () {
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
        document.getElementById('nextQuestion').addEventListener('click', function () {
            currentQuestionIndex++;
            displayQuestion();
        });
    }

    // Сохранение результатов теста
    function saveTestResults(score, totalQuestions, questions) {
        const testResult = {
            date: new Date().toISOString(),
            score: score,
            total: totalQuestions,
            percentage: Math.round((score / totalQuestions) * 100),
            questions: questions.map((q, index) => ({
                wordId: q.word.id,
                wordEnglish: q.word.english,
                wordRussian: q.word.russian,
                wasCorrect: userAnswers[index]?.isCorrect || false,
                questionType: q.type
            })),
            // Сохраняем использованные настройки
            settings: {
                includeExamples: includeExamplesCheckbox.checked,
                onlyFavorites: onlyFavoritesCheckbox.checked,
                chapter: chapterSelect.value,
                questionsCount: questionsCountInput.value
            }
        };

        testHistory.unshift(testResult); // Добавляем в начало
        if (testHistory.length > 20) testHistory = testHistory.slice(0, 20); // Ограничиваем историю

        localStorage.setItem('testHistory', JSON.stringify(testHistory));

        // Обновляем статистику для слов
        updateWordStatistics(testResult.questions);
    }

    // Обновление статистики для слов
    function updateWordStatistics(questionResults) {
        wordStats = JSON.parse(localStorage.getItem('wordStats') || '{}');

        questionResults.forEach(result => {
            const wordId = result.wordId.toString();

            if (!wordStats[wordId]) {
                wordStats[wordId] = {
                    correct: 0,
                    total: 0,
                    lastSeen: new Date().toISOString()
                };
            }

            wordStats[wordId].total += 1;
            if (result.wasCorrect) {
                wordStats[wordId].correct += 1;
            }
            wordStats[wordId].lastSeen = new Date().toISOString();
            wordStats[wordId].accuracy = Math.round((wordStats[wordId].correct / wordStats[wordId].total) * 100);
        });

        localStorage.setItem('wordStats', JSON.stringify(wordStats));
    }

    // Получение статистики для слова
    function getWordStats(wordId) {
        return wordStats[wordId.toString()] || null;
    }

    // Отметить слово как изученное
    function markWordAsLearned(wordId) {
        let learnedWords = JSON.parse(localStorage.getItem('learnedWords') || '[]');
        if (!learnedWords.includes(wordId)) {
            learnedWords.push(wordId);
            localStorage.setItem('learnedWords', JSON.stringify(learnedWords));
        }
    }

    // Показать результаты
    function showResults() {
        const percentage = Math.round((testScore / testQuestions.length) * 100);

        // Сохраняем результаты теста
        saveTestResults(testScore, testQuestions.length, testQuestions);

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
                    <div>
                        <strong>Всего тестов:</strong> ${testHistory.length}
                    </div>
                </div>
                
                <div style="margin-top: 30px; display: flex; gap: 10px; justify-content: center;">
                    <button id="viewHistory" class="btn-secondary" style="padding: 10px 15px;">
                        <i class="fas fa-history"></i> История тестов
                    </button>
                    <button id="viewStats" class="btn-secondary" style="padding: 10px 15px;">
                        <i class="fas fa-chart-bar"></i> Статистика
                    </button>
                </div>
                
                <h3 style="margin-top: 30px; margin-bottom: 15px;">Разбор ответов:</h3>
                <div class="answers-review">
                    ${testQuestions.map((q, index) => {
            const answer = userAnswers[index];
            const isCorrect = answer?.isCorrect;
            const wordStats = getWordStats(q.word.id);
            const statsText = wordStats ?
                `(правильно: ${wordStats.correct}/${wordStats.total}, ${wordStats.accuracy}%)` :
                '(первый раз)';

            return `
                            <div class="result-item ${isCorrect ? 'correct' : 'incorrect'}">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <strong>${index + 1}. ${q.question}</strong>
                                    <span class="word-stats-badge">${statsText}</span>
                                </div>
                                <div>Ваш ответ: ${q.options[answer?.selected] || 'Нет ответа'}</div>
                                <div>Правильный ответ: ${q.correctAnswer}</div>
                                <div class="answer-review">
                                    ${q.type === 'english' ?
                    `Слово: ${q.word.english} → ${q.word.russian}` :
                    `Перевод: ${q.word.russian} → ${q.word.english}`
                }
                                </div>
                                <div class="word-actions" style="margin-top: 10px; display: flex; gap: 10px;">
                                    ${!isCorrect ? `
                                        <button class="mark-learned-btn" data-word-id="${q.word.id}" style="padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                            <i class="fas fa-check"></i> Запомнил
                                        </button>
                                    ` : ''}
                                    <button class="add-to-fav-btn" data-word-id="${q.word.id}" style="padding: 5px 10px; background: #ffd700; color: #856404; border: none; border-radius: 4px; cursor: pointer;">
                                        ${favorites.includes(q.word.id) ? '<i class="fas fa-star"></i> В избранном' : '<i class="far fa-star"></i> В избранное'}
                                    </button>
                                </div>
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

        addWordCardHandlers();

        // Добавляем обработчики для кнопок в карточках слов
        document.querySelectorAll('.mark-learned-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const wordId = parseInt(this.dataset.wordId);
                markWordAsLearned(wordId);
                this.innerHTML = '<i class="fas fa-check"></i> Запомнено!';
                this.style.background = '#6c757d';
                this.disabled = true;
            });
        });

        document.querySelectorAll('.add-to-fav-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const wordId = parseInt(this.dataset.wordId);
                toggleFavorite(wordId);
                this.innerHTML = favorites.includes(wordId) ?
                    '<i class="fas fa-star"></i> В избранном' :
                    '<i class="far fa-star"></i> В избранное';
            });
        });

        // Обработчики кнопок истории и статистики
        document.getElementById('viewHistory').addEventListener('click', showTestHistory);
        document.getElementById('viewStats').addEventListener('click', showTestStatistics);

        // Обработчики кнопок в результатах
        document.getElementById('restartTest').addEventListener('click', startTest);
        document.getElementById('backToDictionary').addEventListener('click', () => {
            document.querySelector('[data-tab="dictionary"]').click();
        });
    }

    // Показать историю тестов
    function showTestHistory() {
        testContainer.innerHTML = `
            <div class="test-history active">
                <h2><i class="fas fa-history"></i> История тестов</h2>
                ${testHistory.length === 0 ? `
                    <div class="empty-message" style="margin: 30px 0;">
                        <i class="fas fa-clock" style="font-size: 3rem; margin-bottom: 20px; color: #6c757d;"></i>
                        <h3>История тестов пуста</h3>
                        <p>Пройдите тест, чтобы увидеть здесь статистику</p>
                    </div>
                ` : `
                    <div class="history-list">
                        ${testHistory.map((test, index) => `
                            <div class="history-item ${test.percentage >= 70 ? 'good' : test.percentage >= 50 ? 'average' : 'bad'}">
                                <div class="history-header">
                                    <div class="history-date">${new Date(test.date).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}</div>
                                    <div class="history-score">${test.percentage}%</div>
                                </div>
                                <div class="history-details">
                                    <div>Правильно: ${test.score}/${test.total}</div>
                                    <div>${test.settings.onlyFavorites ? 'Только избранное' : 'Все слова'}</div>
                                    <div>${test.settings.chapter ? `Глава ${test.settings.chapter}` : 'Все главы'}</div>
                                </div>
                                <button class="view-test-details" data-index="${index}" style="margin-top: 10px; padding: 5px 10px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    <i class="fas fa-eye"></i> Подробнее
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `}
                <div style="margin-top: 30px; text-align: center;">
                    <button id="backToResults" class="btn-secondary">
                        <i class="fas fa-arrow-left"></i> Назад к результатам
                    </button>
                </div>
            </div>
        `;

        // Обработчики для кнопок просмотра деталей
        document.querySelectorAll('.view-test-details').forEach(btn => {
            btn.addEventListener('click', function () {
                const index = parseInt(this.dataset.index);
                showTestDetails(index);
            });
        });

        document.getElementById('backToResults').addEventListener('click', showResults);
    }

    // Показать детали конкретного теста
    function showTestDetails(index) {
        const test = testHistory[index];

        testContainer.innerHTML = `
            <div class="test-details active">
                <h2><i class="fas fa-search"></i> Детали теста</h2>
                <div class="test-info">
                    <div><strong>Дата:</strong> ${new Date(test.date).toLocaleString('ru-RU')}</div>
                    <div><strong>Результат:</strong> ${test.score}/${test.total} (${test.percentage}%)</div>
                    <div><strong>Настройки:</strong> ${test.settings.onlyFavorites ? 'Только избранное' : 'Все слова'}, 
                    ${test.settings.chapter ? `Глава ${test.settings.chapter}` : 'Все главы'}</div>
                </div>
                
                <h3 style="margin-top: 30px;">Вопросы:</h3>
                <div class="questions-list">
                    ${test.questions.map((q, qIndex) => `
                        <div class="question-item ${q.wasCorrect ? 'correct' : 'incorrect'}">
                            <div><strong>${qIndex + 1}. ${q.questionType === 'english' ? q.wordEnglish : q.wordRussian}</strong></div>
                            <div>${q.wasCorrect ? '✅ Правильно' : '❌ Ошибка'}</div>
                            <div class="question-words">${q.wordEnglish} — ${q.wordRussian}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-top: 30px; text-align: center;">
                    <button id="backToHistory" class="btn-secondary">
                        <i class="fas fa-arrow-left"></i> Назад к истории
                    </button>
                </div>
            </div>
        `;

        document.getElementById('backToHistory').addEventListener('click', showTestHistory);
    }

    // Показать общую статистику
    function showTestStatistics(initialView = false) {
        const totalTests = testHistory.length;
        const totalQuestions = testHistory.reduce((sum, test) => sum + test.total, 0);
        const totalCorrect = testHistory.reduce((sum, test) => sum + test.score, 0);
        const avgPercentage = totalTests > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

        // Считаем лучший результат
        const bestTest = testHistory.length > 0 ?
            testHistory.reduce((best, test) => test.percentage > best.percentage ? test : best) :
            null;

        // Собираем статистику слов
        const wordStats = JSON.parse(localStorage.getItem('wordStats') || '{}');
        const wordStatsArray = Object.entries(wordStats).map(([wordId, stats]) => {
            const word = dictionary.find(w => w.id == wordId);
            return {
                wordId: parseInt(wordId),
                word: word,
                stats: stats
            };
        }).filter(item => item.word); // Фильтруем только слова, которые есть в словаре

        // Сортируем по точности (от худшей к лучшей)
        wordStatsArray.sort((a, b) => a.stats.accuracy - b.stats.accuracy);

        testContainer.innerHTML = `
        <div class="test-statistics active">
            <h2><i class="fas fa-chart-bar"></i> Статистика обучения</h2>
            
            ${totalTests === 0 ? `
                <div class="empty-message" style="margin: 30px 0;">
                    <i class="fas fa-chart-line" style="font-size: 3rem; margin-bottom: 20px; color: #6c757d;"></i>
                    <h3>Нет данных</h3>
                    <p>Пройдите тест, чтобы увидеть статистику</p>
                </div>
            ` : `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${totalTests}</div>
                        <div class="stat-label">Всего тестов</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${totalQuestions}</div>
                        <div class="stat-label">Всего вопросов</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${avgPercentage}%</div>
                        <div class="stat-label">Средняя точность</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${bestTest ? bestTest.percentage + '%' : '—'}</div>
                        <div class="stat-label">Лучший результат</div>
                    </div>
                </div>
                
                <div style="margin-top: 30px;">
                    <h3>Прогресс по дням</h3>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: var(--border-radius); margin-bottom: 30px;">
                        <canvas id="progressChart" height="150"></canvas>
                    </div>
                </div>
                
                <div style="margin-top: 30px;">
                    <h3>Статистика по словам</h3>
                    <div style="margin-bottom: 15px; color: #6c757d; font-size: 0.9rem;">
                        Всего отслеживается слов: ${wordStatsArray.length}
                    </div>
                    <div class="words-stats-list" style="max-height: 400px; overflow-y: auto; background: #f8f9fa; padding: 20px; border-radius: var(--border-radius);">
                        ${wordStatsArray.length === 0 ? `
                            <div class="empty-message" style="padding: 20px;">
                                <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 10px; color: #6c757d;"></i>
                                <p>Еще нет статистики по словам. Пройдите тест!</p>
                            </div>
                        ` : `
                            <div class="words-stats-container">
                                ${wordStatsArray.map(item => {
            const accuracyColor = item.stats.accuracy >= 70 ? '#28a745' :
                item.stats.accuracy >= 50 ? '#ffc107' : '#dc3545';

            return `
                                        <div class="word-stat-item" data-word-id="${item.wordId}">
                                            <div class="word-stat-main">
                                                <div class="word-stat-info">
                                                    <strong>${item.word.english}</strong>
                                                    <div class="word-stat-russian">${item.word.russian}</div>
                                                </div>
                                                <div class="word-stat-numbers" style="color: ${accuracyColor}">
                                                    <div class="word-stat-accuracy">${item.stats.accuracy}%</div>
                                                    <div class="word-stat-count">${item.stats.correct}/${item.stats.total}</div>
                                                </div>
                                            </div>
                                            <div class="word-stat-progress">
                                                <div class="word-stat-progress-bar" style="width: ${item.stats.accuracy}%; background-color: ${accuracyColor};"></div>
                                            </div>
                                            <div class="word-stat-actions">
                                                <button class="word-stat-add-fav" data-word-id="${item.wordId}" style="padding: 3px 8px; font-size: 0.8rem; background: ${favorites.includes(item.wordId) ? '#ffd700' : '#6c757d'}; color: ${favorites.includes(item.wordId) ? '#856404' : 'white'}; border: none; border-radius: 3px; cursor: pointer;">
                                                    ${favorites.includes(item.wordId) ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>'}
                                                </button>
                                                <button class="word-stat-reset" data-word-id="${item.wordId}" style="padding: 3px 8px; font-size: 0.8rem; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">
                                                    <i class="fas fa-redo"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `;
        }).join('')}
                            </div>
                        `}
                    </div>
                </div>
                
                <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: center;">
                    <button id="clearHistory" class="btn-secondary" style="background: #dc3545;">
                        <i class="fas fa-trash"></i> Очистить историю
                    </button>
                </div>
            `}
            
            <div style="margin-top: 30px; text-align: center;">
                <button id="backToResultsFromStats" class="btn-secondary">
                    <i class="fas fa-arrow-left"></i> ${initialView ? 'К тесту' : 'Назад к результатам'}
                </button>
            </div>
        </div>
    `;

        if (totalTests > 0) {
            // Инициализация графика
            drawProgressChart();

            // Обработчики для кнопок статистики слов
            document.querySelectorAll('.word-stat-add-fav').forEach(btn => {
                btn.addEventListener('click', function () {
                    const wordId = parseInt(this.dataset.wordId);
                    toggleFavorite(wordId);
                    this.style.background = favorites.includes(wordId) ? '#ffd700' : '#6c757d';
                    this.style.color = favorites.includes(wordId) ? '#856404' : 'white';
                    this.innerHTML = favorites.includes(wordId) ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
                });
            });

            document.querySelectorAll('.word-stat-reset').forEach(btn => {
                btn.addEventListener('click', function () {
                    const wordId = this.dataset.wordId;
                    if (confirm('Сбросить статистику для этого слова?')) {
                        delete wordStats[wordId];
                        localStorage.setItem('wordStats', JSON.stringify(wordStats));
                        showTestStatistics(initialView);
                    }
                });
            });

            document.getElementById('clearHistory').addEventListener('click', () => {
                if (confirm('Очистить всю историю тестов и статистику? Это действие нельзя отменить.')) {
                    testHistory = [];
                    localStorage.removeItem('testHistory');
                    localStorage.removeItem('wordStats');
                    localStorage.removeItem('learnedWords');
                    showTestStatistics(initialView);
                }
            });
        }

        const backButton = document.getElementById('backToResultsFromStats');
        if (backButton) {
            backButton.addEventListener('click', () => {
                if (initialView) {
                    // Возвращаемся к стартовому экрану теста
                    showTestStartScreen();
                } else {
                    // Возвращаемся к результатам теста
                    showResults();
                }
            });
        }
    }

    // Функция для отображения стартового экрана теста с кнопками истории и статистики
    function showTestStartScreen() {
        testContainer.innerHTML = `
        <div class="test-start-screen">
            <i class="fas fa-brain" style="font-size: 4rem; color: #4361ee; margin-bottom: 20px;"></i>
            <h2>Проверьте свои знания</h2>
            <p>Выберите настройки и начните тест. Вам будут предложены слова или фразы, и нужно выбрать правильный перевод из 4 вариантов.</p>
            
            <div style="margin-top: 40px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button id="startTestFromScreen" class="btn-test" style="font-size: 1.1rem; padding: 15px 30px;">
                    <i class="fas fa-play-circle"></i> Начать тест
                </button>
                <button id="showHistoryFromStart" class="btn-secondary" style="padding: 15px 25px;">
                    <i class="fas fa-history"></i> История тестов
                </button>
                <button id="showStatsFromStart" class="btn-secondary" style="padding: 15px 25px;">
                    <i class="fas fa-chart-bar"></i> Статистика
                </button>
            </div>
        </div>
    `;

        document.getElementById('startTestFromScreen').addEventListener('click', startTest);
        document.getElementById('showHistoryFromStart').addEventListener('click', () => showTestHistory(true));
        document.getElementById('showStatsFromStart').addEventListener('click', () => showTestStatistics(true));
    }

    // Обновим функцию showTestHistory для поддержки initialView
    function showTestHistory(initialView = false) {
        testContainer.innerHTML = `
        <div class="test-history active">
            <h2><i class="fas fa-history"></i> История тестов</h2>
            ${testHistory.length === 0 ? `
                <div class="empty-message" style="margin: 30px 0;">
                    <i class="fas fa-clock" style="font-size: 3rem; margin-bottom: 20px; color: #6c757d;"></i>
                    <h3>История тестов пуста</h3>
                    <p>Пройдите тест, чтобы увидеть здесь статистику</p>
                </div>
            ` : `
                <div class="history-list">
                    ${testHistory.map((test, index) => `
                        <div class="history-item ${test.percentage >= 70 ? 'good' : test.percentage >= 50 ? 'average' : 'bad'}">
                            <div class="history-header">
                                <div class="history-date">${new Date(test.date).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}</div>
                                <div class="history-score">${test.percentage}%</div>
                            </div>
                            <div class="history-details">
                                <div>Правильно: ${test.score}/${test.total}</div>
                                <div>${test.settings.onlyFavorites ? 'Только избранное' : 'Все слова'}</div>
                                <div>${test.settings.chapter ? `Глава ${test.settings.chapter}` : 'Все главы'}</div>
                            </div>
                            <button class="view-test-details" data-index="${index}" style="margin-top: 10px; padding: 5px 10px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-eye"></i> Подробнее
                            </button>
                        </div>
                    `).join('')}
                </div>
            `}
            <div style="margin-top: 30px; text-align: center;">
                <button id="backToStart" class="btn-secondary">
                    <i class="fas fa-arrow-left"></i> ${initialView ? 'К тесту' : 'Назад к результатам'}
                </button>
            </div>
        </div>
    `;

        // Обработчики для кнопок просмотра деталей
        document.querySelectorAll('.view-test-details').forEach(btn => {
            btn.addEventListener('click', function () {
                const index = parseInt(this.dataset.index);
                showTestDetails(index);
            });
        });

        const backButton = document.getElementById('backToStart');
        if (backButton) {
            backButton.addEventListener('click', () => {
                if (initialView) {
                    showTestStartScreen();
                } else {
                    showResults();
                }
            });
        }
    }

    // Обновим обработчик переключения вкладок для теста
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
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
            } else if (tab === 'dictionary') {
                renderChapters(searchInput.value);
            } else if (tab === 'test') {
                // При переключении на тест, показываем стартовый экран
                showTestStartScreen();
            }
        });
    });

    // Рисуем график прогресса
    function drawProgressChart() {
        const canvas = document.getElementById('progressChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Группируем тесты по дням
        const dailyData = {};
        testHistory.forEach(test => {
            const date = new Date(test.date).toLocaleDateString('ru-RU');
            if (!dailyData[date]) {
                dailyData[date] = { total: 0, correct: 0, count: 0 };
            }
            dailyData[date].total += test.total;
            dailyData[date].correct += test.score;
            dailyData[date].count += 1;
        });

        const dates = Object.keys(dailyData).reverse().slice(0, 7); // Последние 7 дней
        const percentages = dates.map(date => {
            const data = dailyData[date];
            return Math.round((data.correct / data.total) * 100);
        });

        // Упрощенная отрисовка (без Chart.js)
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Очистка
        ctx.clearRect(0, 0, width, height);

        // Оси
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.strokeStyle = '#6c757d';
        ctx.stroke();

        // Горизонтальные линии
        for (let i = 0; i <= 100; i += 25) {
            const y = padding + chartHeight * (1 - i / 100);
            ctx.beginPath();
            ctx.moveTo(padding - 5, y);
            ctx.lineTo(width - padding, y);
            ctx.strokeStyle = '#e0e0e0';
            ctx.stroke();

            // Подписи
            ctx.fillStyle = '#6c757d';
            ctx.font = '12px Arial';
            ctx.fillText(i + '%', padding - 30, y + 4);
        }

        // Данные
        if (dates.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#4361ee';
            ctx.lineWidth = 3;

            dates.forEach((date, index) => {
                const x = padding + (chartWidth * index) / (dates.length - 1);
                const y = padding + chartHeight * (1 - percentages[index] / 100);

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                // Точки
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#4361ee';
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.stroke();
        } else {
            ctx.fillStyle = '#6c757d';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Недостаточно данных для графика', width / 2, height / 2);
        }
    }

    // Запуск теста
    function startTest() {
        if (createTest()) {
            displayQuestion();
        }
    }

    // Добавление стилей для уведомлений
    function addNotificationStyles() {
        const style = document.createElement('style');
        style.textContent = `
        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(100%); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(100%); }
        }
        `;
        document.head.appendChild(style);
    }
    addNotificationStyles();

    // Добавить в конец app.js в DOMContentLoaded после инициализации donationBtn
    // Обработчик для ссылки "Открыть СБП онлайн"
    document.querySelectorAll('.donation-button').forEach(btn => {
        if (btn.textContent.includes('СБП онлайн')) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                window.open('https://www.sberbank.ru/ru/person', '_blank');
            });
        }
    });
    // Показать модальное окно для фидбека по слову
    function showWordFeedbackModal(word) {
        if (wordFeedbackModal) {
            wordFeedbackModal.remove();
        }

        wordFeedbackModal = document.createElement('div');
        wordFeedbackModal.className = 'modal word-feedback-modal';
        wordFeedbackModal.style.display = 'block';

        wordFeedbackModal.innerHTML = `
        <div class="modal-content">
            <span class="close-word-feedback">&times;</span>
            <h2><i class="fas fa-bug"></i> Сообщить об ошибке</h2>
            <p style="margin-bottom: 15px; color: #6c757d;">
                Укажите ошибку для слова или предложите улучшение
            </p>
            
            <div class="word-info">
                <div><strong>Слово:</strong> ${word.english}</div>
                <div><strong>Транскрипция:</strong> ${word.transcription || 'нет'}</div>
                <div><strong>Перевод:</strong> ${word.russian}</div>
                <div><strong>Глава:</strong> ${word.chapter}</div>
            </div>
            
            <div style="margin: 20px 0;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">
                    Тип ошибки/предложения:
                </label>
                <select id="feedbackType" style="width: 100%; padding: 10px; border-radius: var(--border-radius); border: 2px solid #e0e0e0;">
                    <option value="translation">Неправильный перевод</option>
                    <option value="transcription">Ошибка в транскрипции</option>
                    <option value="example">Ошибка в примере</option>
                    <option value="spelling">Опечатка/орфография</option>
                    <option value="suggestion">Предложение по улучшению</option>
                    <option value="other">Другое</option>
                </select>
            </div>
            
            <textarea id="wordFeedbackText" placeholder="Опишите ошибку или предложение подробнее..." style="width: 100%; height: 120px; padding: 15px; border: 2px solid #e0e0e0; border-radius: var(--border-radius); font-family: inherit; margin-bottom: 20px;"></textarea>
            
            <div class="modal-buttons">
                <button id="sendWordFeedback" class="btn-primary">Отправить</button>
                <button id="cancelWordFeedback" class="btn-secondary">Отмена</button>
            </div>
        </div>
    `;

        document.body.appendChild(wordFeedbackModal);

        // Обработчики для модального окна фидбека слова
        wordFeedbackModal.querySelector('.close-word-feedback').addEventListener('click', () => {
            wordFeedbackModal.style.display = 'none';
        });

        wordFeedbackModal.querySelector('#cancelWordFeedback').addEventListener('click', () => {
            wordFeedbackModal.style.display = 'none';
        });

        wordFeedbackModal.querySelector('#sendWordFeedback').addEventListener('click', () => {
            sendWordFeedback(word);
        });

        // Закрытие при клике вне окна
        wordFeedbackModal.addEventListener('click', (e) => {
            if (e.target === wordFeedbackModal) {
                wordFeedbackModal.style.display = 'none';
            }
        });
    }

    // Отправить фидбек по слову
    function sendWordFeedback(word) {
        const feedbackType = document.getElementById('feedbackType').value;
        const feedbackText = document.getElementById('wordFeedbackText').value.trim();

        if (!feedbackText) {
            alert('Пожалуйста, опишите ошибку или предложение');
            return;
        }

        // Формируем сообщение для Telegram
        const message = `📝 Фидбек по слову\n\n` +
            `📍 Слово: ${word.english}\n` +
            `📖 Перевод: ${word.russian}\n` +
            `🔢 ID: ${word.id}\n` +
            `📚 Глава: ${word.chapter}\n` +
            `🏷️ Тип: ${feedbackType}\n` +
            `📄 Текст: ${feedbackText}\n` +
            `🕐 ${new Date().toLocaleString('ru-RU')}`;

        // Отправляем в Telegram
        sendToTelegram(message);

        // Показываем уведомление
        showNotification('Спасибо! Ваше сообщение отправлено', 'success');

        // Закрываем модальное окно
        wordFeedbackModal.style.display = 'none';
    }

    // Поделиться словом
    function shareWord(word) {
        // Создаем модальное окно для шаринга
        const shareModal = document.createElement('div');
        shareModal.className = 'modal';
        shareModal.style.display = 'block';

        const shareText = `📚 Изучаю английский с Barklation Stories!\n\n` +
            `🇺🇸 ${word.english} ${word.transcription || ''}\n` +
            `🇷🇺 ${word.russian}\n\n` +
            `📖 Пример: ${word.examples && word.examples.length > 0 ? word.examples[0] : '—'}\n\n` +
            `🔗 Присоединяйся: https://t.me/barklation_stories`;

        shareModal.innerHTML = `
        <div class="modal-content share-modal">
            <span class="close-share-modal">&times;</span>
            <h2><i class="fas fa-share-alt"></i> Поделиться словом</h2>
            <p style="margin-bottom: 15px; color: #6c757d;">
                Поделитесь этим словом с друзьями или сохраните для себя
            </p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: var(--border-radius); margin-bottom: 20px;">
                <strong>${word.english}</strong> ${word.transcription ? `<small>${word.transcription}</small>` : ''}<br>
                <em>${word.russian}</em>
            </div>
            
            <textarea id="shareText" readonly style="width: 100%; height: 100px; padding: 15px; border: 2px solid #e0e0e0; border-radius: var(--border-radius); font-family: inherit; margin-bottom: 20px; resize: vertical;">${shareText}</textarea>
            
            <div class="share-buttons">
                <button class="share-option" data-platform="copy">
                    <i class="fas fa-copy"></i>
                    <span>Скопировать</span>
                </button>
                <button class="share-option" data-platform="telegram">
                    <i class="fab fa-telegram"></i>
                    <span>Telegram</span>
                </button>
                <button class="share-option" data-platform="whatsapp">
                    <i class="fab fa-whatsapp"></i>
                    <span>WhatsApp</span>
                </button>
                <button class="share-option" data-platform="email">
                    <i class="fas fa-envelope"></i>
                    <span>Email</span>
                </button>
            </div>
            
            <div class="modal-buttons" style="margin-top: 25px;">
                <button id="closeShareModal" class="btn-secondary">Закрыть</button>
            </div>
        </div>
    `;

        document.body.appendChild(shareModal);

        // Обработчики для шаринга
        const closeBtn = shareModal.querySelector('.close-share-modal');
        const closeShareBtn = shareModal.querySelector('#closeShareModal');

        const closeShareModal = () => {
            shareModal.style.display = 'none';
            setTimeout(() => shareModal.remove(), 300);
        };

        closeBtn.addEventListener('click', closeShareModal);
        closeShareBtn.addEventListener('click', closeShareModal);

        // Закрытие при клике вне окна
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) {
                closeShareModal();
            }
        });

        // Обработчики для кнопок шаринга
        shareModal.querySelectorAll('.share-option').forEach(btn => {
            btn.addEventListener('click', function () {
                const platform = this.dataset.platform;
                const text = document.getElementById('shareText').value;

                switch (platform) {
                    case 'copy':
                        navigator.clipboard.writeText(text).then(() => {
                            showNotification('Текст скопирован в буфер обмена', 'success');
                        });
                        break;

                    case 'telegram':
                        window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`, '_blank');
                        break;

                    case 'whatsapp':
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                        break;

                    case 'email':
                        window.open(`mailto:?subject=${encodeURIComponent('Слово из Barklation Stories')}&body=${encodeURIComponent(text)}`);
                        break;
                }
            });
        });
    }

    // Функция для показа уведомлений
    function showNotification(message, type = 'info') {
        // Удаляем предыдущие уведомления
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : '#0c5460'};
        padding: 15px 20px;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        border-left: 4px solid ${type === 'success' ? '#28a745' : '#17a2b8'};
    `;

        notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

        document.body.appendChild(notification);

        // Автоматическое скрытие через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Отправка сообщения в Telegram
    function sendToTelegram(message) {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        const payload = {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        };

        // Отправляем асинхронно, не блокируя интерфейс
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        }).catch(error => {
            console.error('Ошибка отправки в Telegram:', error);
        });
    }
});
