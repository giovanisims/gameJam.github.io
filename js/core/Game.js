// Game - main game class that controls the game loop and state
class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Set larger base canvas size and make it responsive
        this.baseWidth = 1200;
        this.baseHeight = 800;
        this.updateCanvasSize();
        
        // Add resize listener for responsiveness
        window.addEventListener('resize', () => this.updateCanvasSize());

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

    // Method to update canvas size responsively
    updateCanvasSize() {
        const maxWidth = Math.min(window.innerWidth * 0.95, this.baseWidth);
        const maxHeight = Math.min(window.innerHeight * 0.85, this.baseHeight);
        
        // Maintain aspect ratio
        const aspectRatio = this.baseWidth / this.baseHeight;
        let newWidth, newHeight;
        
        if (maxWidth / maxHeight > aspectRatio) {
            newHeight = maxHeight;
            newWidth = newHeight * aspectRatio;
        } else {
            newWidth = maxWidth;
            newHeight = newWidth / aspectRatio;
        }
        
        this.width = newWidth;
        this.height = newHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Update canvas CSS size for proper display
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
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
        this.fireTrails = []; // Initialize fire trails
        this.lightningEffects = []; // Initialize lightning effects
        this.overloadEffects = []; // Initialize overload effects
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
        this.powerUpManager.chosenLegendaryPowerUps = []; // Reset legendary power-ups
        this.powerUpManager.activeLegendaryPowerUps = []; // Reset active legendary power-ups

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

    // Novo método para criar efeito visual de explosão
    createExplosionEffect(x, y, radius) {
        // Cria um efeito visual temporário de explosão
        const explosionEffect = {
            x: x,
            y: y,
            radius: radius,
            maxRadius: radius,
            alpha: 1.0,
            duration: 0.3,
            timeLeft: 0.3
        };
        
        // Adiciona à lista de efeitos (crie se não existir)
        if (!this.explosionEffects) {
            this.explosionEffects = [];
        }
        this.explosionEffects.push(explosionEffect);
    }

    // Lightning Storm system
    triggerLightningStorm() {
        const activeEnemies = this.enemies.filter(e => e.active);
        if (activeEnemies.length === 0) return;
        
        const targetEnemy = activeEnemies[Math.floor(Math.random() * activeEnemies.length)];
        this.createLightningEffect(targetEnemy.position.x, targetEnemy.position.y);
        
        // Primary lightning damage
        targetEnemy.takeDamage(this.player.lightningDamage);
        
        // Chain lightning to nearby enemies
        activeEnemies.forEach(enemy => {
            if (enemy === targetEnemy) return;
            const distance = targetEnemy.position.distance(enemy.position);
            if (distance <= this.player.lightningChainRange) {
                this.createLightningChain(targetEnemy.position, enemy.position);
                enemy.takeDamage(this.player.lightningDamage * 0.7);
            }
        });
        
        this.uiManager.showMessage("⚡ TEMPESTADE DE RAIO! ⚡", 2);
    }

    createLightningEffect(x, y) {
        const effect = {
            x, y,
            duration: 0.3,
            timeLeft: 0.3,
            alpha: 1.0
        };
        this.lightningEffects.push(effect);
    }

    createLightningChain(fromPos, toPos) {
        const effect = {
            from: fromPos,
            to: toPos,
            duration: 0.2,
            timeLeft: 0.2,
            alpha: 1.0
        };
        this.lightningEffects.push(effect);
    }

    // Fire Trail system
    addFireTrail(x, y) {
        const trail = {
            x, y,
            radius: 25,
            damage: this.player.fireTrailDamage,
            duration: 2.0,
            timeLeft: 2.0,
            alpha: 1.0
        };
        this.fireTrails.push(trail);
    }

    // Neural Overload effect
    createOverloadEffect() {
        const effect = {
            duration: this.player.overloadDuration,
            timeLeft: this.player.overloadDuration,
            intensity: 1.0
        };
        this.overloadEffects.push(effect);
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

        // Atualiza efeitos de explosão
        if (this.explosionEffects) {
            this.explosionEffects.forEach(effect => {
                effect.timeLeft -= dt;
                effect.alpha = effect.timeLeft / effect.duration;
                effect.radius = effect.maxRadius * (1 - effect.alpha) * 0.5 + effect.maxRadius * 0.5;
            });
            this.explosionEffects = this.explosionEffects.filter(effect => effect.timeLeft > 0);
        }

        // Update fire trails
        if (this.fireTrails) {
            this.fireTrails.forEach(trail => {
                trail.timeLeft -= dt;
                trail.alpha = trail.timeLeft / trail.duration;
                
                // Damage enemies in fire trail
                this.enemies.forEach(enemy => {
                    if (!enemy.active) return;
                    const distance = Math.sqrt((enemy.position.x - trail.x) ** 2 + (enemy.position.y - trail.y) ** 2);
                    if (distance <= trail.radius) {
                        enemy.takeDamage(trail.damage * dt);
                    }
                });
            });
            this.fireTrails = this.fireTrails.filter(trail => trail.timeLeft > 0);
        }

        // Update lightning effects
        if (this.lightningEffects) {
            this.lightningEffects.forEach(effect => {
                effect.timeLeft -= dt;
                effect.alpha = effect.timeLeft / effect.duration;
            });
            this.lightningEffects = this.lightningEffects.filter(effect => effect.timeLeft > 0);
        }

        // Update overload effects
        if (this.overloadEffects) {
            this.overloadEffects.forEach(effect => {
                effect.timeLeft -= dt;
                effect.intensity = effect.timeLeft / effect.duration;
            });
            this.overloadEffects = this.overloadEffects.filter(effect => effect.timeLeft > 0);
        }

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

        // Draw fire trails
        if (this.fireTrails) {
            this.fireTrails.forEach(trail => {
                this.ctx.save();
                this.ctx.globalAlpha = trail.alpha;
                
                // Outer fire
                this.ctx.fillStyle = '#FF4500';
                this.ctx.beginPath();
                this.ctx.arc(trail.x, trail.y, trail.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Inner fire
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(trail.x, trail.y, trail.radius * 0.6, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            });
        }

        this.player.draw(this.ctx);
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.enemyProjectiles.forEach(ep => ep.draw(this.ctx));
        this.xpOrbs.forEach(orb => orb.draw(this.ctx));
        this.healthOrbs.forEach(orb => orb.draw(this.ctx));
        
        // Draw lightning effects
        if (this.lightningEffects) {
            this.lightningEffects.forEach(effect => {
                this.ctx.save();
                this.ctx.globalAlpha = effect.alpha;
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 4;
                this.ctx.shadowColor = '#00FFFF';
                this.ctx.shadowBlur = 15;
                
                if (effect.from && effect.to) {
                    // Chain lightning
                    this.ctx.beginPath();
                    this.ctx.moveTo(effect.from.x, effect.from.y);
                    this.ctx.lineTo(effect.to.x, effect.to.y);
                    this.ctx.stroke();
                } else {
                    // Main lightning bolt
                    this.ctx.beginPath();
                    this.ctx.moveTo(effect.x, 0);
                    this.ctx.lineTo(effect.x, effect.y);
                    this.ctx.stroke();
                    
                    // Lightning circle
                    this.ctx.strokeStyle = '#00FFFF';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(effect.x, effect.y, 40, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
                this.ctx.restore();
            });
        }
        
        // Neural Overload screen effect
        if (this.overloadEffects && this.overloadEffects.length > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.1 + 0.05 * Math.sin(Date.now() * 0.02);
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.restore();
        }
        
        // Desenha efeitos de explosão
        if (this.explosionEffects) {
            this.explosionEffects.forEach(effect => {
                this.ctx.save();
                this.ctx.globalAlpha = effect.alpha;
                this.ctx.strokeStyle = '#FF4500';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                this.ctx.stroke();
                
                this.ctx.strokeStyle = '#FFD700';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.radius * 0.7, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.restore();
            });
        }
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
