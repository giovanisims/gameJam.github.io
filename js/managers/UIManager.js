// UIManager - handles all user interface elements and screen transitions
class UIManager {
    constructor(game = null) {
        this.game = game;
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.levelDisplay = document.getElementById('levelDisplay');
        this.livesDisplay = document.getElementById('livesDisplay');
        this.xpBar = document.getElementById('xpBar');
        this.xpBarContainer = document.getElementById('xpBarContainer');
        this.messageDisplay = document.getElementById('messageDisplay');
        this.finalScoreDisplay = document.getElementById('finalScore');
        this.highScoreDisplay = document.getElementById('highScoreDisplay');
        this.currentScoreDisplay = document.getElementById('currentScoreDisplay');

        this.mainMenu = document.getElementById('mainMenu');
        this.aboutScreen = document.getElementById('aboutScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.levelUpScreen = document.getElementById('levelUpScreen');
        this.pauseMenu = document.getElementById('pauseMenu');
        this.gameCanvas = document.getElementById('gameCanvas');
        this.gameUIElements = [this.scoreDisplay, this.levelDisplay, this.livesDisplay, this.xpBarContainer];
    }

    showMainMenu() {
        // Hide all sprites when showing menu
        if (this.game) {
            this.game.hideAllSprites();
        }
        
        this.mainMenu.style.display = 'flex';
        this.aboutScreen.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.levelUpScreen.style.display = 'none';
        this.pauseMenu.style.display = 'none';
        this.gameCanvas.style.display = 'none';
        this.hideGameUI();
        this.updateHighScore();
    }

    showAboutScreen() {
        // Hide all sprites when showing about screen
        if (this.game) {
            this.game.hideAllSprites();
        }
        
        this.mainMenu.style.display = 'none';
        this.aboutScreen.style.display = 'flex';
    }

    showGameScreen() {
        this.mainMenu.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.levelUpScreen.style.display = 'none';
        this.pauseMenu.style.display = 'none';
        this.gameCanvas.style.display = 'block';
        this.showGameUI();
        
        // Show sprites when game is active
        if (this.game) {
            this.game.showAllSprites();
        }
    }

    showGameOverScreen(score) {
        const highScore = this.getHighScore();
        const isNewHighScore = score > highScore;
        
        if (isNewHighScore) {
            this.setHighScore(score);
            this.finalScoreDisplay.textContent = `Nova Melhor Pontuação: ${score}!`;
        } else {
            this.finalScoreDisplay.textContent = `Sua Pontuação: ${score}`;
        }
        
        // Hide all sprites when showing game over screen
        if (this.game) {
            this.game.hideAllSprites();
        }
        
        this.mainMenu.style.display = 'none';
        this.aboutScreen.style.display = 'none';
        this.levelUpScreen.style.display = 'none';
        this.pauseMenu.style.display = 'none';
        
        this.gameOverScreen.style.display = 'flex';
        this.gameCanvas.style.display = 'none';
        this.hideGameUI();
    }

    showPauseMenu(currentScore) {
        // Hide all sprites when showing pause menu
        if (this.game) {
            this.game.hideAllSprites();
        }
        
        this.currentScoreDisplay.textContent = currentScore;
        this.pauseMenu.style.display = 'flex';
        this.gameCanvas.style.display = 'none';
        this.hideGameUI();
    }

    hidePauseMenu() {
        this.pauseMenu.style.display = 'none';
        this.gameCanvas.style.display = 'block';
        this.showGameUI();
        
        // Show sprites when resuming game
        if (this.game) {
            this.game.showAllSprites();
        }
    }

    showLevelUpScreen() {
        // Hide all sprites when showing level up screen
        if (this.game) {
            this.game.hideAllSprites();
        }
        
        // Add a brief delay for better transition experience
        setTimeout(() => {
            this.levelUpScreen.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
            
            // Apply focus to the first upgrade button after a slight delay
            setTimeout(() => {
                const firstButton = document.querySelector('#powerUpOptions .powerup-button');
                if (firstButton) firstButton.focus();
            }, 300);
        }, 200);
    }

    hideGameUI() {
        this.gameUIElements.forEach(el => el.style.display = 'none');
    }
    
    showGameUI() {
         this.gameUIElements.forEach(el => el.style.display = 'block'); 
    }

    updateScore(score) { 
        this.scoreDisplay.textContent = `Score: ${score}`;
    }
    
    updateLevel(level) { 
        this.levelDisplay.textContent = `Nível: ${level}`; 
    }
    
    updateLives(lives) { 
        this.livesDisplay.textContent = `Vidas: ${lives}`; 
    }
    
    updateXPBar(currentXP, xpToNextLevel) {
        const percentage = (currentXP / xpToNextLevel) * 100;
        this.xpBar.style.width = `${Math.min(100, percentage)}%`;
    }
    
    updatePlayerHealth() { 
        /* Player health bar is drawn on canvas */ 
    }

    showMessage(text, duration = 3) {
        this.messageDisplay.textContent = text;
        this.messageDisplay.style.display = 'block';
        setTimeout(() => {
            this.messageDisplay.style.display = 'none';
        }, duration * 1000);
    }

    // Highscore methods
    getHighScore() {
        return parseInt(localStorage.getItem('draculaSurvivorsHighScore') || '0');
    }

    setHighScore(score) {
        localStorage.setItem('draculaSurvivorsHighScore', score.toString());
        this.updateHighScore();
    }

    updateHighScore() {
        const highScore = this.getHighScore();
        this.highScoreDisplay.textContent = `Melhor Pontuação: ${highScore}`;
    }
}
