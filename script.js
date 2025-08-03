document.addEventListener('DOMContentLoaded', () => {
    const japaneseSentenceEl = document.getElementById('japanese-sentence');
    const answerZoneEl = document.getElementById('answer-zone');
    const wordBankEl = document.getElementById('word-bank');
    const checkButton = document.getElementById('check-button');
    const nextButton = document.getElementById('next-button');
    const feedbackEl = document.getElementById('feedback');
    const questionCounterEl = document.getElementById('question-counter');
    const accuracyRateEl = document.getElementById('accuracy-rate');
    const resultContainerEl = document.getElementById('result-container');
    const quizContainerEl = document.getElementById('quiz-container');
    const correctCountEl = document.getElementById('correct-count');
    const finalAccuracyEl = document.getElementById('final-accuracy');
    const finalMessageEl = document.getElementById('final-message');
    const restartButton = document.getElementById('restart-button');
    const accuracyImageEl = document.getElementById('accuracy-image');

    let allQuizData = [];
    let currentQuizSet = [];
    let currentQuestionIndex = 0;
    let correctInFirstTry = 0;
    let attempts = 0;

    // For touch events
    let currentDraggedEl = null;
    let initialX;
    let initialY;
    let offsetX;
    let offsetY;

    // JSONファイルからクイズデータを読み込む
    fetch('quiz_data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            allQuizData = data;
            if (allQuizData.length === 0) {
                throw new Error('Quiz data is empty or invalid.');
            }
            startQuiz();
        })
        .catch(error => {
            console.error('Error loading quiz data:', error);
            feedbackEl.textContent = 'クイズデータの読み込みに失敗しました。ファイルを確認してください。';
            feedbackEl.style.color = 'red';
        });

    function startQuiz() {
        // 全データからランダムに8問選ぶ
        allQuizData.sort(() => Math.random() - 0.5);
        currentQuizSet = allQuizData.slice(0, 8);
        
        currentQuestionIndex = 0;
        correctInFirstTry = 0;
        attempts = 0;
        
        quizContainerEl.style.display = 'block';
        resultContainerEl.style.display = 'none';
        
        displayQuestion();
    }

    function displayQuestion() {
        if (currentQuestionIndex >= currentQuizSet.length) {
            showResult();
            return;
        }

        attempts = 0;
        const currentQuiz = currentQuizSet[currentQuestionIndex];
        japaneseSentenceEl.textContent = currentQuiz.ja;
        
        const words = currentQuiz.en.split(/\s+/).filter(word => word.length > 0);
        words.sort(() => Math.random() - 0.5);

        wordBankEl.innerHTML = '';
        answerZoneEl.innerHTML = '';

        words.forEach(word => {
            const wordBlock = createWordBlock(word);
            wordBankEl.appendChild(wordBlock);
        });

        questionCounterEl.textContent = currentQuestionIndex + 1;
        feedbackEl.textContent = '';
        checkButton.style.display = 'block';
        nextButton.style.display = 'none';
        updateAccuracy();
    }

    function createWordBlock(word) {
        const wordBlock = document.createElement('div');
        wordBlock.textContent = word;
        console.log('Creating word block for:', `'${word}'`);
        wordBlock.className = 'word-block';
        wordBlock.draggable = true; // Keep for mouse drag
        wordBlock.addEventListener('dragstart', handleDragStart); // Keep for mouse drag
        wordBlock.addEventListener('touchstart', handleTouchStart); // Add for touch drag
        return wordBlock;
    }

    // Mouse Drag Handlers
    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.textContent);
        e.target.classList.add('dragging');
    }

    [answerZoneEl, wordBankEl].forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('drop', handleDrop);
        zone.addEventListener('dragenter', handleDragEnter);
        zone.addEventListener('dragleave', handleDragLeave);
    });

    function handleDragEnter(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const draggingEl = document.querySelector('.dragging');
        if (draggingEl) {
            e.currentTarget.appendChild(draggingEl);
            draggingEl.classList.remove('dragging');
        }
    }

    // Touch Drag Handlers
    function handleTouchStart(e) {
        e.preventDefault(); // Prevent scrolling and default browser behavior
        currentDraggedEl = e.target;
        currentDraggedEl.classList.add('dragging');

        const touch = e.touches[0];
        initialX = touch.clientX;
        initialY = touch.clientY;

        const rect = currentDraggedEl.getBoundingClientRect();
        offsetX = initialX - rect.left;
        offsetY = initialY - rect.top;

        // Make the element absolute for dragging
        currentDraggedEl.style.position = 'absolute';
        currentDraggedEl.style.zIndex = 1000;
        currentDraggedEl.style.left = `${initialX - offsetX}px`;
        currentDraggedEl.style.top = `${initialY - offsetY}px`;

        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    }

    function handleTouchMove(e) {
        e.preventDefault(); // Prevent scrolling
        if (!currentDraggedEl) return;

        const touch = e.touches[0];
        currentDraggedEl.style.left = `${touch.clientX - offsetX}px`;
        currentDraggedEl.style.top = `${touch.clientY - offsetY}px`;

        // Optional: Highlight drop zones during touchmove
        const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
        [answerZoneEl, wordBankEl].forEach(zone => {
            if (zone.contains(elementUnderTouch) || elementUnderTouch === zone) {
                zone.classList.add('drag-over');
            } else {
                zone.classList.remove('drag-over');
            }
        });
    }

    function handleTouchEnd(e) {
        if (!currentDraggedEl) return;

        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);

        currentDraggedEl.classList.remove('dragging');
        currentDraggedEl.style.position = ''; // Reset position
        currentDraggedEl.style.zIndex = '';
        currentDraggedEl.style.left = '';
        currentDraggedEl.style.top = '';

        const touch = e.changedTouches[0];
        const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);

        let targetZone = null;
        if (answerZoneEl.contains(elementUnderTouch) || elementUnderTouch === answerZoneEl) {
            targetZone = answerZoneEl;
        } else if (wordBankEl.contains(elementUnderTouch) || elementUnderTouch === wordBankEl) {
            targetZone = wordBankEl;
        }

        if (targetZone) {
            targetZone.appendChild(currentDraggedEl);
            targetZone.classList.remove('drag-over');
        } else {
            // If dropped outside valid zones, return to original parent (or word bank for simplicity)
            wordBankEl.appendChild(currentDraggedEl);
        }

        currentDraggedEl = null;
    }

    checkButton.addEventListener('click', () => {
        console.log('Check button clicked.');
        const answerWords = Array.from(answerZoneEl.children).map(el => el.textContent);
        console.log('Raw answer words from blocks:', answerWords);

        // 回答と正解の文字列を正規化（句読点除去、小文字化、余分なスペース削除）
        const normalizeString = (str) => {
            return str.replace(/[.,?!]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
        };

        const normalizedAnswer = normalizeString(answerWords.join(' '));
        const normalizedCorrect = normalizeString(currentQuizSet[currentQuestionIndex].en);

        console.log('Comparing:');
        console.log('  Normalized Answer:', `'${normalizedAnswer}'`);
        console.log('  Normalized Correct:', `'${normalizedCorrect}'`);

        attempts++;

        if (normalizedAnswer === normalizedCorrect) {
            console.log('Match found! Answer is correct.');
            feedbackEl.textContent = '正解！素晴らしい！';
            feedbackEl.style.color = 'green';
            Array.from(answerZoneEl.children).forEach(el => el.style.color = '');
            if (attempts === 1) {
                correctInFirstTry++;
                console.log('Correct on first try! correctInFirstTry:', correctInFirstTry);
            }
            checkButton.style.display = 'none';
            nextButton.style.display = 'block';
        } else {
            console.log('No match. Answer is incorrect.');
            feedbackEl.textContent = '残念、不正解！';
            feedbackEl.style.color = 'red';

            const correctWordsOriginal = currentQuizSet[currentQuestionIndex].en.split(/\s+/).filter(word => word.length > 0);
            const answerWordEls = Array.from(answerZoneEl.children);

            answerWordEls.forEach((el, index) => {
                if (index < correctWordsOriginal.length && el.textContent === correctWordsOriginal[index]) {
                    el.style.color = ''; // 正しい位置の単語はデフォルト色
                } else {
                    el.style.color = 'blue'; // 間違った位置の単語は青色
                }
            });

            checkButton.style.display = 'block';
            nextButton.style.display = 'none';
        }
        updateAccuracy();
    });

    nextButton.addEventListener('click', () => {
        currentQuestionIndex++;
        displayQuestion();
    });

    restartButton.addEventListener('click', startQuiz);

    function updateAccuracy() {
        const questionsAttempted = currentQuestionIndex + 1;
        const accuracy = questionsAttempted > 0 ? (correctInFirstTry / questionsAttempted) * 100 : 0;
        accuracyRateEl.textContent = `${accuracy.toFixed(0)}`;
    }

    function showResult() {
        quizContainerEl.style.display = 'none';
        resultContainerEl.style.display = 'block';
        const questionCount = currentQuizSet.length;
        correctCountEl.textContent = correctInFirstTry;
        const finalAccuracy = questionCount > 0 ? (correctInFirstTry / questionCount) * 100 : 0;
        finalAccuracyEl.textContent = finalAccuracy.toFixed(0);

        let imageName = '';
        if (finalAccuracy === 100) {
            imageName = '100.png';
        } else if (finalAccuracy >= 90) {
            imageName = '90.png';
        } else if (finalAccuracy >= 80) {
            imageName = '80.png';
        } else if (finalAccuracy >= 70) {
            imageName = '70.png';
        } else if (finalAccuracy >= 60) {
            imageName = '60.png';
        } else if (finalAccuracy >= 50) {
            imageName = '50.png';
        } else if (finalAccuracy >= 40) {
            imageName = '40.png';
        } else if (finalAccuracy >= 25) {
            imageName = '30.png';
        } else if (finalAccuracy > 0) {
            imageName = '20.png';
        } else {
            imageName = '00.png';
        }
        accuracyImageEl.src = imageName;

        let message = '';
        if (finalAccuracy === 100) {
            message = 'パーフェクト！素晴らしいです！';
        } else if (finalAccuracy >= 80) {
            message = '素晴らしい成績です！';
        } else if (finalAccuracy >= 50) {
            message = 'よく頑張りました！';
        } else {
            message = 'これからも頑張りましょう！';
        }
        finalMessageEl.textContent = message;
    }
});