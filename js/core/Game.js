// Game - main game class that controls the game loop and state
class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = 800;
        this.height = 600;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.gameState = 'mainMenu';
        this.player = null;
        this.enemies = [];
        this.enemyProjectiles = [];
        this.xpOrbs = [];
        this.healthOrbs = [];

        this.score = 0;
        this.gameTime = 0;
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 3;
        this.difficultyMultiplier = 1;

        this.uiManager = new UIManager(this);
        this.powerUpManager = new PowerUpManager();
        this.lastTime = 0;
        this.isPaused = false;

        this.initControls();
        this.uiManager.showMainMenu();
        this.uiManager.updateHighScore();
    }

    // Utility method to hide/show all sprite elements
    hideAllSprites() {
        const allSprites = document.querySelectorAll('img[src*="sprites/"]');
        allSprites.forEach(sprite => {
            sprite.style.display = 'none';
        });
    }

    showAllSprites() {
        const allSprites = document.querySelectorAll('img[src*="sprites/"]');
        allSprites.forEach(sprite => {
            sprite.style.display = 'block';
        });
    }

    initControls() {
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
        document.getElementById('aboutBtn').addEventListener('click', () => this.uiManager.showAboutScreen());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.uiManager.showMainMenu());
        document.getElementById('restartGameBtn').addEventListener('click', () => this.startGame());
        document.getElementById('gameOverToMenuBtn').addEventListener('click', () => this.uiManager.showMainMenu());
        
        // Pause menu buttons
        document.getElementById('resumeGameBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('endRunBtn').addEventListener('click', () => this.endRun());
        document.getElementById('pauseToMenuBtn').addEventListener('click', () => this.endRunToMenu());

        window.addEventListener('keydown', (e) => {
            if (this.player) this.player.keys[e.key] = true;
            if (e.key === 'Escape' && this.gameState === 'playing') {
                this.pauseGame();
            } else if (e.key === 'Escape' && this.gameState === 'paused') {
                this.resumeGame();
            }
        });
        window.addEventListener('keyup', (e) => {
            if (this.player) this.player.keys[e.key] = false;
        });
    }

    resetGame() {
        // Clean up existing entities before creating new ones
        if (this.player) {
            this.player.destroy();
        }
        this.enemies.forEach(enemy => enemy.destroy());
        this.enemyProjectiles.forEach(proj => proj.destroy());
        this.xpOrbs.forEach(orb => orb.destroy());
        this.healthOrbs.forEach(orb => orb.destroy());
        
        this.player = new Player(this.width / 2, this.height / 2);
        this.enemies = [];
        this.enemyProjectiles = [];
        this.xpOrbs = [];
        this.healthOrbs = [];
        this.score = 0;
        this.gameTime = 0;
        this.enemySpawnTimer = 0;
        this.difficultyMultiplier = 1;
        this.isPaused = false;

        this.player.level = 1;
        this.player.xp = 0;
        this.player.xpToNextLevel = 100;
        this.player.lives = 3;
        this.player.maxHealth = 100;
        this.player.health = this.player.maxHealth;
        this.player.speed = 250;
        this.player.shootCooldown = 0.5;
        this.player.projectileDamage = 10;
        this.player.numProjectiles = 1;
        this.player.projectilePierce = 0;
        
        ExperienceOrb.prototype.collectionRadius = 80;
        this.powerUpManager.chosenPowerUps = [];

        this.uiManager.updateScore(this.score);
        this.uiManager.updateLevel(this.player.level);
        this.uiManager.updateLives(this.player.lives);
        this.uiManager.updateXPBar(this.player.xp, this.player.xpToNextLevel);
        this.uiManager.updatePlayerHealth();
    }

    startGame() {
        this.resetGame();
        this.gameState = 'playing';
        this.uiManager.showGameScreen();
        this.lastTime = performance.now();
        this.gameLoop(performance.now());
    }

    pauseGame(isLevelUp = false) {
        if (this.gameState === 'playing') {
            this.isPaused = true;
            if (!isLevelUp) {
                this.gameState = 'paused';
                this.uiManager.showPauseMenu(this.score);
            } else {
                this.gameState = 'levelUp';
            }
        }
    }

    resumeGame() {
        if (this.gameState === 'paused' || this.gameState === 'levelUp') {
            const wasPaused = this.gameState === 'paused';
            this.isPaused = false;
            this.gameState = 'playing';
            this.uiManager.messageDisplay.style.display = 'none';
            if (wasPaused) {
                this.uiManager.hidePauseMenu();
            }
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    endRun() {
        this.gameState = 'gameOver';
        this.uiManager.pauseMenu.style.display = 'none';
        this.uiManager.showGameOverScreen(this.score);
    }

    endRunToMenu() {
        this.gameState = 'gameOver';
        this.uiManager.pauseMenu.style.display = 'none';
        this.uiManager.showMainMenu();
    }

    gameOver() {
        this.gameState = 'gameOver';
        this.uiManager.showGameOverScreen(this.score);
    }

    spawnEnemy() {
        const edge = Math.floor(Math.random() * 4);
        let x, y;
        switch (edge) {
            case 0: x = Math.random() * this.width; y = -30; break;
            case 1: x = this.width + 30; y = Math.random() * this.height; break;
            case 2: x = Math.random() * this.width; y = this.height + 30; break;
            case 3: x = -30; y = Math.random() * this.height; break;
        }

        const enemyType = Math.random();
        let newEnemy;
        if (enemyType < 0.6) {
            newEnemy = new ChaserEnemy(x, y);
        } else {
            newEnemy = new ShooterEnemy(x, y);
        }

        newEnemy.health = Math.floor(newEnemy.health * this.difficultyMultiplier);
        newEnemy.maxHealth = newEnemy.health;

        if (newEnemy instanceof ShooterEnemy) {
            newEnemy.damage = Math.floor(newEnemy.damage * this.difficultyMultiplier);
            newEnemy.projectileDamage = Math.floor(newEnemy.projectileDamage * this.difficultyMultiplier);
        } else {
            newEnemy.damage = Math.floor(newEnemy.damage * this.difficultyMultiplier * 1.2);
        }

        newEnemy.xpValue = Math.floor(newEnemy.xpValue * this.difficultyMultiplier);
        this.enemies.push(newEnemy);
    }

    spawnExperienceOrb(x, y, value) {
        this.xpOrbs.push(new ExperienceOrb(x, y, value));
    }
    
    spawnHealthOrb(x, y) {
        this.healthOrbs.push(new HealthOrb(x, y));
    }

    spawnBoss() {
        const minDistanceFromPlayer = 200;
        let x, y;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
            const edge = Math.floor(Math.random() * 4);
            switch (edge) {
                case 0: x = Math.random() * this.width; y = -50; break;
                case 1: x = this.width + 50; y = Math.random() * this.height; break;
                case 2: x = Math.random() * this.width; y = this.height + 50; break;
                case 3: x = -50; y = Math.random() * this.height; break;
            }
            attempts++;
        } while (
            attempts < maxAttempts && 
            this.player && 
            Math.sqrt((x - this.player.position.x) ** 2 + (y - this.player.position.y) ** 2) < minDistanceFromPlayer
        );
        
        const boss = new BossEnemy(x, y, this.player.level);
        
        boss.health = Math.floor(boss.health * this.difficultyMultiplier);
        boss.maxHealth = boss.health;
        boss.damage = Math.floor(boss.damage * this.difficultyMultiplier);
        boss.projectileDamage = Math.floor(boss.projectileDamage * this.difficultyMultiplier);
        boss.xpValue = Math.floor(boss.xpValue * this.difficultyMultiplier);
        
        this.enemies.push(boss);
        this.uiManager.showMessage(`BOSS NÍVEL ${this.player.level} APARECEU!`, 4);
    }

    update(dt) {
        if (this.isPaused || this.gameState !== 'playing') return;

        this.gameTime += dt;
        this.enemySpawnTimer += dt;

        if (Math.floor(this.gameTime) % 30 === 0 && Math.floor(this.gameTime) > 0 && Math.floor(this.gameTime) !== Math.floor(this.gameTime - dt)) {
            this.difficultyMultiplier += 0.2;
            this.enemySpawnInterval = Math.max(0.5, this.enemySpawnInterval * 0.92);
        }

        if (this.enemySpawnTimer >= this.enemySpawnInterval) {
            const numToSpawn = 1 + Math.floor(this.gameTime / 25);
            for(let i = 0; i < numToSpawn; i++) {
                this.spawnEnemy();
            }
            this.enemySpawnTimer = 0;
        }

        this.player.update(dt, this.width, this.height, this.enemies);

        this.enemies.forEach(enemy => enemy.update(dt, this.player, this.width, this.height));
        this.enemyProjectiles.forEach(ep => ep.update(dt, this.width, this.height));
        this.xpOrbs.forEach(orb => orb.update(dt, this.player));
        this.healthOrbs.forEach(orb => orb.update(dt, this.player));

        // Collisions
        this.player.projectiles.forEach(proj => {
            if (!proj.active) return;
            this.enemies.forEach(enemy => {
                if (!enemy.active) return;
                if (proj.checkCollision(enemy)) {
                    if (proj.onHitEnemy(enemy)) {
                        enemy.takeDamage(proj.damage);
                        if (!enemy.active) {
                            this.spawnExperienceOrb(enemy.position.x, enemy.position.y, enemy.xpValue);
                        }
                    }
                }
            });
        });

        this.enemyProjectiles.forEach(ep => {
            if (!ep.active) return;
            if (ep.checkCollision(this.player)) {
                if(this.player.takeDamage(ep.damage)) {
                    ep.active = false;
                }
            }
        });

        this.enemies.forEach(enemy => {
            if (!enemy.active) return;
            if (enemy.checkCollision(this.player)) {
                this.player.takeDamage(enemy.damage);
            }
        });

        this.enemies = this.enemies.filter(e => e.active);
        this.player.projectiles = this.player.projectiles.filter(p => p.active);
        this.enemyProjectiles = this.enemyProjectiles.filter(ep => ep.active);
        this.xpOrbs = this.xpOrbs.filter(orb => orb.active);
        this.healthOrbs = this.healthOrbs.filter(orb => orb.active);

        if (this.player.lives <= 0 && this.gameState === 'playing') {
            this.gameOver();
        }
    }

    draw() {
        if (this.gameState !== 'playing' && this.gameState !== 'paused' && this.gameState !== 'levelUp') return;

        this.ctx.clearRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#080818';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.player.draw(this.ctx);
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.enemyProjectiles.forEach(ep => ep.draw(this.ctx));
        this.xpOrbs.forEach(orb => orb.draw(this.ctx));
        this.healthOrbs.forEach(orb => orb.draw(this.ctx));
    }

    gameLoop(timestamp) {
        if (this.gameState === 'gameOver') return;
        
        if (this.isPaused || (this.gameState !== 'playing' && this.gameState !== 'levelUp')) {
             requestAnimationFrame((t) => this.gameLoop(t));
             return;
        }

        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        
        const maxDeltaTime = 0.1;
        const effectiveDt = Math.min(dt, maxDeltaTime);

        if (effectiveDt > 0) {
            this.update(effectiveDt);
        }
        this.draw();
        
        if (this.gameState === 'playing' || this.gameState === 'paused' || this.gameState === 'levelUp') {
             requestAnimationFrame((t) => this.gameLoop(t));
        }
    }
}
