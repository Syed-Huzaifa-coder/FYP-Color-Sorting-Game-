document.addEventListener('DOMContentLoaded', function() {
    // Game configuration
    const LEVEL_THRESHOLDS = {
        easy: 20,  // seconds to complete to suggest medium
        medium: 30 // seconds to complete to suggest hard
    };

    // Game state
    const gameState = {
        difficulty: 'easy',
        score: 0,
        totalObjects: 6,
        gameActive: false,
        startTime: null,
        timerInterval: null,
        soundEnabled: true,
        musicEnabled: true,
        autoLevelUp: true,
        draggedItem: null,
        gamesPlayed: 0,
        bestTime: null,
        highScore: 0,
        totalAttempts: 0,
        correctAttempts: 0
    };

    // DOM elements
    const elements = {
        gameArea: document.getElementById('game-area'),
        objectsContainer: document.getElementById('objects-container'),
        easyBtn: document.getElementById('easy-btn'),
        mediumBtn: document.getElementById('medium-btn'),
        hardBtn: document.getElementById('hard-btn'),
        newGameBtn: document.getElementById('new-game-btn'),
        settingsBtn: document.getElementById('settings-btn'),
        progressBtn: document.getElementById('progress-btn'),
        progressBar: document.getElementById('progress-bar'),
        timeDisplay: document.getElementById('time-display'),
        scoreDisplay: document.getElementById('score-display'),
        victoryScreen: document.getElementById('victory-screen'),
        finalTimeDisplay: document.getElementById('final-time'),
        finalScoreDisplay: document.getElementById('final-score'),
        playAgainBtn: document.getElementById('play-again-btn'),
        levelUpScreen: document.getElementById('level-up-screen'),
        levelUpMessage: document.getElementById('level-up-message'),
        acceptLevelUp: document.getElementById('accept-level-up'),
        declineLevelUp: document.getElementById('decline-level-up'),
        settingsPanel: document.getElementById('settings-panel'),
        soundToggle: document.getElementById('sound-toggle'),
        musicToggle: document.getElementById('music-toggle'),
        autoLevelUp: document.getElementById('auto-level-up'),
        saveSettingsBtn: document.getElementById('save-settings'),
        progressPanel: document.getElementById('progress-panel'),
        gamesPlayedDisplay: document.getElementById('games-played'),
        bestTimeDisplay: document.getElementById('best-time'),
        highScoreDisplay: document.getElementById('high-score'),
        accuracyDisplay: document.getElementById('accuracy'),
        currentLevelDisplay: document.getElementById('current-level'),
        closeProgressBtn: document.getElementById('close-progress'),
        soundToggleBtn: document.getElementById('sound-toggle-btn'),
        soundIcon: document.querySelector('#sound-toggle-btn i')
    };

    // Audio elements
    const sounds = {
        correct: document.getElementById('correct-sound'),
        wrong: document.getElementById('wrong-sound'),
        victory: document.getElementById('victory-sound'),
        background: document.getElementById('background-music')
    };

    // Color data
    const colors = {
        red: ['#ff6b6b', '#ff5252', '#ff3838', '#ff1f1f', '#ff0000'],
        blue: ['#4ecdc4', '#3dbeb6', '#2dafa8', '#1da09a', '#0d918c'],
        yellow: ['#ffbe76', '#ffb45e', '#ffaa46', '#ffa02e', '#ff9616']
    };

    // Initialize game
    initGame();

    // Event listeners
    elements.easyBtn.addEventListener('click', () => setDifficulty('easy'));
    elements.mediumBtn.addEventListener('click', () => setDifficulty('medium'));
    elements.hardBtn.addEventListener('click', () => setDifficulty('hard'));
    elements.newGameBtn.addEventListener('click', initGame);
    elements.playAgainBtn.addEventListener('click', initGame);
    elements.settingsBtn.addEventListener('click', toggleSettingsPanel);
    elements.progressBtn.addEventListener('click', showProgressPanel);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    elements.closeProgressBtn.addEventListener('click', hideProgressPanel);
    elements.soundToggleBtn.addEventListener('click', toggleSound);
    elements.acceptLevelUp.addEventListener('click', acceptLevelUp);
    elements.declineLevelUp.addEventListener('click', declineLevelUp);

    // Set up drag and drop
    setupDragAndDrop();

    function initGame() {
        // Reset game state
        elements.objectsContainer.innerHTML = '';
        gameState.score = 0;
        gameState.gameActive = true;
        updateScoreDisplay();
        clearInterval(gameState.timerInterval);
        gameState.startTime = new Date();
        gameState.timerInterval = setInterval(updateTimer, 1000);

        // Set total objects based on difficulty
        switch(gameState.difficulty) {
            case 'easy':
                gameState.totalObjects = 6;
                break;
            case 'medium':
                gameState.totalObjects = 12;
                break;
            case 'hard':
                gameState.totalObjects = 18;
                break;
        }

        // Clear target areas
        document.querySelectorAll('.target-area').forEach(area => {
            area.innerHTML = '';
        });

        // Generate color objects
        generateColorObjects();

        // Hide panels
        elements.victoryScreen.classList.remove('show');
        elements.levelUpScreen.classList.remove('show');
        elements.settingsPanel.style.display = 'none';
        elements.progressPanel.style.display = 'none';

        // Update timer immediately
        updateTimer();

        // Play background music if enabled
        if (gameState.musicEnabled) {
            sounds.background.play().catch(e => console.log('Autoplay prevented'));
        }
    }

    function setDifficulty(difficulty) {
        gameState.difficulty = difficulty;
        elements.currentLevelDisplay.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

        // Update button states
        elements.easyBtn.classList.remove('selected');
        elements.mediumBtn.classList.remove('selected');
        elements.hardBtn.classList.remove('selected');

        if (difficulty === 'easy') {
            elements.easyBtn.classList.add('selected');
        } else if (difficulty === 'medium') {
            elements.mediumBtn.classList.add('selected');
        } else {
            elements.hardBtn.classList.add('selected');
        }
    }

    function generateColorObjects() {
        const colorKeys = Object.keys(colors);
        const objectsPerColor = gameState.totalObjects / colorKeys.length;
        
        const objects = [];
        
        colorKeys.forEach(color => {
            const colorShades = colors[color];
            
            for (let i = 0; i < objectsPerColor; i++) {
                const shadeIndex = i % colorShades.length;
                objects.push(createColorObject(colorShades[shadeIndex], color));
            }
        });

        // Shuffle objects
        shuffleArray(objects);

        // Add to DOM
        objects.forEach(obj => {
            elements.objectsContainer.appendChild(obj);
        });
    }

    function createColorObject(color, category) {
        const object = document.createElement('div');
        object.className = 'color-object';
        object.dataset.category = category;
        object.draggable = true;
        object.style.backgroundColor = color;
        object.setAttribute('aria-grabbed', 'false');
        return object;
    }

    function setupDragAndDrop() {
        // Drag start
        document.addEventListener('dragstart', function(e) {
            if (e.target.classList.contains('color-object')) {
                gameState.draggedItem = e.target;
                e.target.style.opacity = '0.5';
                e.dataTransfer.setData('text/plain', '');
            }
        });

        // Drag end
        document.addEventListener('dragend', function(e) {
            if (e.target.classList.contains('color-object')) {
                e.target.style.opacity = '1';
            }
        });

        // Drag over
        document.addEventListener('dragover', function(e) {
            if (e.target.classList.contains('target-area')) {
                e.preventDefault();
            }
        });

        // Drop
        document.addEventListener('drop', function(e) {
            if (e.target.classList.contains('target-area') && gameState.draggedItem) {
                e.preventDefault();
                handleDrop(gameState.draggedItem, e.target);
            }
        });

        // Touch support for mobile devices
        document.addEventListener('touchstart', function(e) {
            if (e.target.classList.contains('color-object')) {
                gameState.draggedItem = e.target;
                e.target.style.opacity = '0.7';
            }
        }, {passive: true});

        document.addEventListener('touchend', function(e) {
            if (!gameState.draggedItem) return;
            
            const touch = e.changedTouches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            
            if (element && element.classList.contains('target-area')) {
                handleDrop(gameState.draggedItem, element);
            }
            
            if (gameState.draggedItem) {
                gameState.draggedItem.style.opacity = '1';
                gameState.draggedItem = null;
            }
        }, {passive: true});

        document.addEventListener('touchmove', function(e) {
            if (gameState.draggedItem) {
                e.preventDefault();
                const touch = e.touches[0];
                gameState.draggedItem.style.position = 'absolute';
                gameState.draggedItem.style.left = (touch.clientX - gameState.draggedItem.offsetWidth / 2) + 'px';
                gameState.draggedItem.style.top = (touch.clientY - gameState.draggedItem.offsetHeight / 2) + 'px';
                gameState.draggedItem.style.zIndex = '100';
            }
        }, {passive: false});
    }

    function handleDrop(object, targetArea) {
        if (!gameState.gameActive) return;
        
        gameState.totalAttempts++;
        const targetCategory = targetArea.dataset.category;
        const objectCategory = object.dataset.category;
        
        if (objectCategory === targetCategory) {
            handleCorrectDrop(object, targetArea);
        } else {
            handleIncorrectDrop(object);
        }
    }

    function handleCorrectDrop(object, targetArea) {
        gameState.correctAttempts++;
        gameState.score += 10;
        
        if (gameState.soundEnabled) {
            sounds.correct.currentTime = 0;
            sounds.correct.play();
        }
        
        object.style.position = 'static';
        object.style.left = '';
        object.style.top = '';
        object.style.zIndex = '';
        object.style.opacity = '1';
        object.draggable = false;
        targetArea.appendChild(object);
        
        updateScoreDisplay();
        
        if (document.querySelectorAll('.target-area .color-object').length === gameState.totalObjects) {
            endGame();
        }
    }

    function handleIncorrectDrop(object) {
        if (gameState.soundEnabled) {
            sounds.wrong.currentTime = 0;
            sounds.wrong.play();
        }
        
        object.style.position = 'static';
        object.style.left = '';
        object.style.top = '';
        object.style.zIndex = '';
        object.style.opacity = '1';
        elements.objectsContainer.appendChild(object);
    }

    function updateScoreDisplay() {
        elements.scoreDisplay.textContent = gameState.score;
        const percent = (document.querySelectorAll('.target-area .color-object').length / gameState.totalObjects) * 100;
        elements.progressBar.style.width = percent + '%';
    }

    function updateTimer() {
        if (!gameState.startTime) return;
        
        const now = new Date();
        const elapsed = Math.floor((now - gameState.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        
        elements.timeDisplay.textContent = `${minutes}:${seconds}`;
    }

    function endGame() {
        gameState.gameActive = false;
        clearInterval(gameState.timerInterval);
        gameState.gamesPlayed++;
        
        const now = new Date();
        const elapsed = Math.floor((now - gameState.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        const finalTime = `${minutes}:${seconds}`;
        
        if (!gameState.bestTime || elapsed < gameState.bestTime) {
            gameState.bestTime = elapsed;
        }
        
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
        }
        
        if (gameState.soundEnabled) {
            sounds.victory.currentTime = 0;
            sounds.victory.play();
        }
        
        elements.finalTimeDisplay.textContent = finalTime;
        elements.finalScoreDisplay.textContent = gameState.score;
        
        if (gameState.autoLevelUp && gameState.gamesPlayed > 1) {
            checkLevelUpRecommendation(elapsed);
        } else {
            elements.victoryScreen.classList.add('show');
        }
    }

    function checkLevelUpRecommendation(elapsedSeconds) {
        let recommendedLevel = null;
        let message = '';
        
        if (gameState.difficulty === 'easy' && elapsedSeconds <= LEVEL_THRESHOLDS.easy) {
            recommendedLevel = 'medium';
            message = `You completed Easy mode in ${elapsedSeconds} seconds! Try Medium difficulty for more challenge?`;
        } 
        else if (gameState.difficulty === 'medium' && elapsedSeconds <= LEVEL_THRESHOLDS.medium) {
            recommendedLevel = 'hard';
            message = `You completed Medium mode in ${elapsedSeconds} seconds! Ready for Hard difficulty?`;
        }
        
        if (recommendedLevel) {
            showLevelUpScreen(message, recommendedLevel);
        } else {
            elements.victoryScreen.classList.add('show');
        }
    }

    function showLevelUpScreen(message, recommendedLevel) {
        elements.levelUpMessage.textContent = message;
        elements.levelUpScreen.classList.add('show');
        elements.acceptLevelUp.onclick = function() {
            setDifficulty(recommendedLevel);
            elements.levelUpScreen.classList.remove('show');
            initGame();
        };
    }

    function acceptLevelUp() {
        elements.levelUpScreen.classList.remove('show');
    }

    function declineLevelUp() {
        elements.levelUpScreen.classList.remove('show');
        elements.victoryScreen.classList.add('show');
    }

    function toggleSettingsPanel() {
        elements.settingsPanel.style.display = 
            elements.settingsPanel.style.display === 'block' ? 'none' : 'block';
    }

    function showProgressPanel() {
        elements.gamesPlayedDisplay.textContent = gameState.gamesPlayed;
        
        if (gameState.bestTime !== null) {
            const minutes = Math.floor(gameState.bestTime / 60).toString().padStart(2, '0');
            const seconds = (gameState.bestTime % 60).toString().padStart(2, '0');
            elements.bestTimeDisplay.textContent = `${minutes}:${seconds}`;
        }
        
        elements.highScoreDisplay.textContent = gameState.highScore;
        
        const accuracy = gameState.totalAttempts > 0 ? 
            Math.round((gameState.correctAttempts / gameState.totalAttempts) * 100) : 0;
        elements.accuracyDisplay.textContent = `${accuracy}%`;
        
        elements.progressPanel.style.display = 'block';
    }

    function hideProgressPanel() {
        elements.progressPanel.style.display = 'none';
    }

    function saveSettings() {
        gameState.soundEnabled = elements.soundToggle.checked;
        gameState.musicEnabled = elements.musicToggle.checked;
        gameState.autoLevelUp = elements.autoLevelUp.checked;
        
        if (gameState.musicEnabled) {
            sounds.background.play().catch(e => console.log('Autoplay prevented'));
        } else {
            sounds.background.pause();
        }
        
        elements.settingsPanel.style.display = 'none';
    }

    function toggleSound() {
        gameState.soundEnabled = !gameState.soundEnabled;
        
        if (gameState.soundEnabled) {
            elements.soundIcon.className = 'fas fa-volume-up';
        } else {
            elements.soundIcon.className = 'fas fa-volume-mute';
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Initialize settings panel
    elements.soundToggle.checked = gameState.soundEnabled;
    elements.musicToggle.checked = gameState.musicEnabled;
    elements.autoLevelUp.checked = gameState.autoLevelUp;
    elements.currentLevelDisplay.textContent = 'Easy';

    // Try to start background music on first interaction
    document.addEventListener('click', function initAudio() {
        if (gameState.musicEnabled) {
            sounds.background.play().catch(e => console.log('Autoplay prevented'));
        }
        document.removeEventListener('click', initAudio);
    }, { once: true });
});