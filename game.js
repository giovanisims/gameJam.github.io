// Polyfill para requestAnimationFrame para compatibilidade
window.requestAnimationFrame = window.requestAnimationFrame ||
                             window.webkitRequestAnimationFrame ||
                             window.mozRequestAnimationFrame ||
                             window.oRequestAnimationFrame ||
                             window.msRequestAnimationFrame ||
                             function(callback) {
                                 window.setTimeout(callback, 1000 / 60);
                             };

// Classe Vector2D para manipulação de vetores
class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Vector2D(this.x + other.x, this.y + other.y);
    }

    subtract(other) {
        return new Vector2D(this.x - other.x, this.y - other.y);
    }

    multiply(scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    divide(scalar) {
        if (scalar === 0) return new Vector2D(0, 0); // Evitar divisão por zero
        return new Vector2D(this.x / scalar, this.y / scalar);
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vector2D(0, 0);
        return this.divide(mag);
    }

    distance(other) {
        return this.subtract(other).magnitude();
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }

    static fromAngle(angle, magnitude = 1) {
        return new Vector2D(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
    }
}

// Classe base para entidades do jogo
class Entity {
    constructor(x, y, radius, color) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(0, 0);
        this.radius = radius;
        this.color = color;
        this.active = true; // Para remoção de entidades
    }

    update(dt) {
        this.position = this.position.add(this.velocity.multiply(dt));
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    checkCollision(otherEntity) {
        const distance = this.position.distance(otherEntity.position);
        return distance < this.radius + otherEntity.radius;
    }
}

// Classe Jogador
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 15, '#00FFFF'); // Ciano
        this.speed = 250; // pixels por segundo
        this.keys = {}; // Para armazenar o estado das teclas pressionadas
        this.health = 100;
        this.maxHealth = 100;
        this.lives = 3;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        this.shootCooldown = 0.5; // segundos
        this.shootTimer = 0;
        this.projectiles = [];
        this.projectileSpeed = 400;
        this.projectileDamage = 10;
        this.projectileSize = 5;
        this.projectilePierce = 0; 
        this.numProjectiles = 1; 
        this.projectileSpread = 0.1; 
        this.invulnerableTime = 1.5; 
        this.invulnerableTimer = 0;
    }

    handleInput(dt) {
        let moveX = 0;
        let moveY = 0;
        if (this.keys['w'] || this.keys['ArrowUp']) moveY -= 1;
        if (this.keys['s'] || this.keys['ArrowDown']) moveY += 1;
        if (this.keys['a'] || this.keys['ArrowLeft']) moveX -= 1;
        if (this.keys['d'] || this.keys['ArrowRight']) moveX += 1;

        if (moveX !== 0 || moveY !== 0) {
            const moveVector = new Vector2D(moveX, moveY).normalize();
            this.velocity = moveVector.multiply(this.speed);
        } else {
            this.velocity = new Vector2D(0, 0);
        }
    }

    shoot(targetPosition) {
        if (this.shootTimer <= 0) {
            // game.playSound('shoot'); // Removed
            const baseAngle = targetPosition.subtract(this.position).angle();

            for (let i = 0; i < this.numProjectiles; i++) {
                let currentAngle = baseAngle;
                if (this.numProjectiles > 1) {
                    currentAngle += (i - (this.numProjectiles - 1) / 2) * this.projectileSpread;
                }
                const velocity = Vector2D.fromAngle(currentAngle, this.projectileSpeed);
                const projectile = new Projectile(
                    this.position.x,
                    this.position.y,
                    this.projectileSize,
                    '#FFFF00', 
                    velocity,
                    this.projectileDamage,
                    this.projectilePierce
                );
                this.projectiles.push(projectile);
            }
            this.shootTimer = this.shootCooldown;
        }
    }

    update(dt, gameWidth, gameHeight, enemies) {
        this.handleInput(dt);
        super.update(dt);

        this.position.x = Math.max(this.radius, Math.min(this.position.x, gameWidth - this.radius));
        this.position.y = Math.max(this.radius, Math.min(this.position.y, gameHeight - this.radius));

        if (this.shootTimer > 0) {
            this.shootTimer -= dt;
        }

        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
        }

        this.projectiles = this.projectiles.filter(p => p.active);
        this.projectiles.forEach(p => p.update(dt, gameWidth, gameHeight));

        if (enemies && enemies.length > 0) {
            let closestEnemy = null;
            let minDistance = Infinity;
            enemies.forEach(enemy => {
                if(enemy.active) {
                    const distance = this.position.distance(enemy.position);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestEnemy = enemy;
                    }
                }
            });
            if (closestEnemy) {
                this.shoot(closestEnemy.position);
            }
        }
    }

    draw(ctx) {
        if (this.invulnerableTimer > 0) {
            if (Math.floor(this.invulnerableTimer * 10) % 2 === 0) {
                return; 
            }
        }
        super.draw(ctx);
        this.projectiles.forEach(p => p.draw(ctx));

        ctx.fillStyle = 'grey';
        ctx.fillRect(this.position.x - this.radius, this.position.y - this.radius - 10, this.radius * 2, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.position.x - this.radius, this.position.y - this.radius - 10, this.radius * 2 * (this.health / this.maxHealth), 5);
    }

    takeDamage(amount) {
        if (this.invulnerableTimer > 0) return false; 

        this.health -= amount;
        // game.playSound('playerHit'); // Removed
        this.invulnerableTimer = this.invulnerableTime;
        if (this.health <= 0) {
            this.lives--;
            if (this.lives <= 0) {
                game.gameOver();
            } else {
                this.health = this.maxHealth; 
                game.uiManager.updateLives(this.lives);
                game.uiManager.showMessage(`Vida perdida! ${this.lives} restantes.`, 2);
            }
        }
        game.uiManager.updatePlayerHealth(); 
        return true;
    }

    addXP(amount) {
        this.xp += amount;
        // game.playSound('xpGain'); // Removed
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
        game.uiManager.updateXPBar(this.xp, this.xpToNextLevel);
    }

    levelUp() {
        this.level++;
        this.xp = 0; 
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5); 
        // game.playSound('levelUp'); // Removed
        game.uiManager.updateLevel(this.level);
        game.uiManager.updateXPBar(this.xp, this.xpToNextLevel);
        
        // Check if this is a boss level (every 10 levels)
        if (this.level % 10 === 0) {
            game.spawnBoss();
            game.uiManager.showMessage(`Nível ${this.level}! Boss apareceu!`, 4);
        }
        
        game.pauseGame(true); 
        game.powerUpManager.offerPowerUps();
    }

    applyPowerUp(powerUp) {
        powerUp.apply(this);
        game.uiManager.showMessage(`${powerUp.name} adquirido!`, 2);
    }
}

// Classe Projétil
class Projectile extends Entity {
    constructor(x, y, radius, color, velocity, damage, pierce = 0) {
        super(x, y, radius, color);
        this.velocity = velocity;
        this.damage = damage;
        this.pierceCount = pierce;
        this.hitEnemies = new Set(); 
    }

    update(dt, gameWidth, gameHeight) {
        super.update(dt);
        if (this.position.x < 0 || this.position.x > gameWidth ||
            this.position.y < 0 || this.position.y > gameHeight) {
            this.active = false;
        }
    }

    onHitEnemy(enemy) {
        if (this.hitEnemies.has(enemy)) return false; 

        this.hitEnemies.add(enemy);
        if (this.pierceCount <= 0) {
            this.active = false;
        } else {
            this.pierceCount--;
        }
        return true;
    }
}

// Classe Inimigo
class Enemy extends Entity {
    constructor(x, y, radius, color, speed, health, damage, xpValue) {
        super(x, y, radius, color);
        this.speed = speed;
        this.health = health;
        this.maxHealth = health;
        this.damage = damage; 
        this.xpValue = xpValue;
        this.shootCooldown = 0; 
        this.shootTimer = Math.random() * this.shootCooldown; 
        this.projectileSpeed = 0;
        this.projectileColor = '#FF00FF'; 
        this.projectileSize = 4;
    }

    update(dt, player, gameWidth, gameHeight) {
        if (!this.active) return;

        const directionToPlayer = player.position.subtract(this.position).normalize();
        this.velocity = directionToPlayer.multiply(this.speed);
        super.update(dt);

        if (this.shootCooldown > 0 && this.shootTimer <= 0) {
            this.shoot(player.position);
            this.shootTimer = this.shootCooldown;
        } else if (this.shootCooldown > 0) {
            this.shootTimer -= dt;
        }
    }

    shoot(targetPosition) {
        const direction = targetPosition.subtract(this.position).normalize();
        const velocity = direction.multiply(this.projectileSpeed);
        const projectile = new Projectile(
            this.position.x,
            this.position.y,
            this.projectileSize,
            this.projectileColor,
            velocity,
            this.damage // Dano do projétil do inimigo é o mesmo que o dano de colisão base
        );
        game.enemyProjectiles.push(projectile);
        // game.playSound('enemyShoot'); // Removed
    }

    takeDamage(amount) {
        this.health -= amount;
        // game.playSound('enemyHit'); // Removed
        if (this.health <= 0) {
            this.active = false;
            game.player.addXP(this.xpValue);
            game.score += this.xpValue * 10; 
            game.uiManager.updateScore(game.score);
            if (Math.random() < 0.05) { 
                game.spawnHealthOrb(this.position.x, this.position.y);
            }
        }
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.fillStyle = 'grey';
        ctx.fillRect(this.position.x - this.radius, this.position.y - this.radius - 7, this.radius * 2, 4);
        ctx.fillStyle = 'red';
        ctx.fillRect(this.position.x - this.radius, this.position.y - this.radius - 7, this.radius * 2 * (this.health / this.maxHealth), 4);
    }
}

class ChaserEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 12, '#FF6347', 100, 50, 10, 20); 
    }
}

class ShooterEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 15, '#9370DB', 60, 80, 8, 30); 
        this.shootCooldown = 2.5; 
        this.projectileSpeed = 200;
        this.projectileDamage = 10; 
    }
    
    shoot(targetPosition) {
        const numProjectiles = 3;
        const spreadAngle = Math.PI / 8; 
        const baseAngle = targetPosition.subtract(this.position).angle();

        for (let i = 0; i < numProjectiles; i++) {
            const angleOffset = (i - (numProjectiles - 1) / 2) * spreadAngle / (numProjectiles -1);
            const currentAngle = baseAngle + angleOffset;
            const velocity = Vector2D.fromAngle(currentAngle, this.projectileSpeed);
            const projectile = new Projectile(
                this.position.x,
                this.position.y,
                this.projectileSize,
                this.projectileColor,
                velocity,
                Math.floor(this.projectileDamage * game.difficultyMultiplier) 
            );
            game.enemyProjectiles.push(projectile);
        }
    }
}

// Boss Enemy Class
class BossEnemy extends Enemy {
    constructor(x, y, level) {
        // Boss is bigger, stronger, and more valuable
        const bossSize = 30 + Math.floor(level / 10) * 5; // Grows with boss level
        const bossHealth = 500 + level * 50; // Scales with player level
        const bossDamage = 25 + Math.floor(level / 5) * 5;
        const bossXP = 200 + level * 20;
        
        super(x, y, bossSize, '#FF0000', 80, bossHealth, bossDamage, bossXP);
        
        this.level = level;
        this.shootCooldown = 1.0; // Shoots faster than regular enemies
        this.projectileSpeed = 250;
        this.projectileDamage = 20 + Math.floor(level / 5) * 5;
        this.projectileSize = 8;
        this.projectileColor = '#FF4444';
        
        // Boss special abilities
        this.chargeSpeed = this.speed * 2.5; // Can charge at player
        this.chargeTimer = 0;
        this.chargeCooldown = 5.0; // Charge every 5 seconds
        this.isCharging = false;
        this.chargeDirection = new Vector2D(0, 0);
        this.chargeDuration = 1.5;
        this.chargeTimeLeft = 0;
        
        // Multi-phase behavior
        this.phase = 1;
        this.maxPhases = Math.min(3, Math.floor(level / 10) + 1);
        this.phaseHealth = this.health / this.maxPhases;
    }
    
    update(dt, player, gameWidth, gameHeight) {
        if (!this.active) return;

        // Update charge timer
        this.chargeTimer += dt;
        
        // Check for phase transitions
        const currentPhase = Math.ceil(this.health / this.phaseHealth);
        if (currentPhase !== this.phase && currentPhase > 0) {
            this.phase = currentPhase;
            this.onPhaseChange();
        }
        
        // Charging behavior
        if (this.isCharging) {
            this.chargeTimeLeft -= dt;
            this.velocity = this.chargeDirection.multiply(this.chargeSpeed);
            
            if (this.chargeTimeLeft <= 0) {
                this.isCharging = false;
                this.chargeTimer = 0;
            }
        } else if (this.chargeTimer >= this.chargeCooldown) {
            // Start charging at player
            this.startCharge(player);
        } else {
            // Normal movement (slower approach)
            const directionToPlayer = player.position.subtract(this.position).normalize();
            this.velocity = directionToPlayer.multiply(this.speed * 0.7); // Slower than normal enemies
        }
        
        // Call Entity's update method directly since we handle our own movement logic
        Entity.prototype.update.call(this, dt);
        
        // Shooting behavior (more frequent in later phases)
        const adjustedShootCooldown = this.shootCooldown / this.phase;
        if (this.shootTimer <= 0) {
            this.shoot(player.position);
            this.shootTimer = adjustedShootCooldown;
        } else {
            this.shootTimer -= dt;
        }
    }
    
    startCharge(player) {
        this.isCharging = true;
        this.chargeTimeLeft = this.chargeDuration;
        this.chargeDirection = player.position.subtract(this.position).normalize();
        game.uiManager.showMessage('Boss está atacando!', 1.5);
    }
    
    onPhaseChange() {
        // Boss gets more aggressive in later phases
        this.shootCooldown *= 0.8;
        this.chargeCooldown *= 0.9;
        game.uiManager.showMessage(`Boss Fase ${this.maxPhases - this.phase + 1}!`, 2);
    }
    
    shoot(targetPosition) {
        // Boss shoots more projectiles based on phase
        const numProjectiles = 3 + this.phase;
        const spreadAngle = Math.PI / 6; 
        const baseAngle = targetPosition.subtract(this.position).angle();

        for (let i = 0; i < numProjectiles; i++) {
            const angleOffset = (i - (numProjectiles - 1) / 2) * spreadAngle / (numProjectiles - 1);
            const currentAngle = baseAngle + angleOffset;
            const velocity = Vector2D.fromAngle(currentAngle, this.projectileSpeed);
            const projectile = new Projectile(
                this.position.x,
                this.position.y,
                this.projectileSize,
                this.projectileColor,
                velocity,
                Math.floor(this.projectileDamage * game.difficultyMultiplier)
            );
            game.enemyProjectiles.push(projectile);
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.active = false;
            game.player.addXP(this.xpValue);
            game.score += this.xpValue * 10; 
            game.uiManager.updateScore(game.score);
            game.uiManager.showMessage(`Boss Derrotado! +${this.xpValue} XP`, 3);
            
            // Boss drops multiple health orbs
            for (let i = 0; i < 3; i++) {
                const offsetX = (Math.random() - 0.5) * 60;
                const offsetY = (Math.random() - 0.5) * 60;
                game.spawnHealthOrb(this.position.x + offsetX, this.position.y + offsetY);
            }
        }
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw boss health bar (larger)
        const barWidth = this.radius * 3;
        const barHeight = 8;
        ctx.fillStyle = 'grey';
        ctx.fillRect(this.position.x - barWidth/2, this.position.y - this.radius - 15, barWidth, barHeight);
        ctx.fillStyle = 'red';
        ctx.fillRect(this.position.x - barWidth/2, this.position.y - this.radius - 15, barWidth * (this.health / this.maxHealth), barHeight);
        
        // Draw boss indicator
        ctx.fillStyle = '#FFD700';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', this.position.x, this.position.y - this.radius - 20);
        
        // Draw charge indicator
        if (this.isCharging) {
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// Classe Orbe de XP
class ExperienceOrb extends Entity {
    constructor(x, y, value) {
        super(x, y, 5, '#00FF00'); 
        this.value = value;
        this.collectionSpeed = 300; 
        this.collectionRadius = 80; 
    }

    update(dt, player) {
        if (!this.active) return;

        const distanceToPlayer = this.position.distance(player.position);
        if (distanceToPlayer < player.radius + this.radius) {
            player.addXP(this.value);
            this.active = false;
        } else if (distanceToPlayer < this.collectionRadius) {
            const direction = player.position.subtract(this.position).normalize();
            this.velocity = direction.multiply(this.collectionSpeed);
        } else {
            this.velocity = new Vector2D(0,0); 
        }
        super.update(dt);
    }
}

// Classe Orbe de Vida
class HealthOrb extends Entity {
    constructor(x, y) {
        super(x, y, 8, '#FFC0CB'); 
        this.healAmount = 25;
    }

    update(dt, player) {
        if (!this.active) return;
        if (this.checkCollision(player)) {
            player.health = Math.min(player.maxHealth, player.health + this.healAmount);
            game.uiManager.updatePlayerHealth();
            // game.playSound('powerUp'); // Removed
            this.active = false;
        }
    }
}

// Gerenciador de Power-ups
class PowerUpManager {
    constructor() {
        this.availablePowerUps = [
            { name: "Velocidade de Tiro +", description: "Aumenta a cadência de tiro.", apply: (player) => { player.shootCooldown = Math.max(0.1, player.shootCooldown * 0.85); } },
            { name: "Dano do Projétil +", description: "Aumenta o dano dos seus projéteis.", apply: (player) => { player.projectileDamage += 5; } },
            { name: "Velocidade de Movimento +", description: "Aumenta sua velocidade de movimento.", apply: (player) => { player.speed += 30; } },
            // Modificado: Não cura mais ao aumentar a vida máxima
            { name: "Vida Máxima +", description: "Aumenta sua vida máxima.", apply: (player) => { player.maxHealth += 20; game.uiManager.updatePlayerHealth(); } },
            { name: "Mais Projéteis", description: "Dispara um projétil adicional.", apply: (player) => { player.numProjectiles +=1; } },
            { name: "Penetração de Projétil +", description: "Projéteis atravessam mais um inimigo.", apply: (player) => { player.projectilePierce +=1; } },
            { name: "Recuperar Vida", description: "Recupera 50% da vida máxima.", apply: (player) => { player.health = Math.min(player.maxHealth, player.health + player.maxHealth * 0.5); game.uiManager.updatePlayerHealth(); } },
            { name: "Raio de Coleta XP +", description: "Aumenta o raio de coleta de orbes de XP.", apply: (player) => { game.xpOrbs.forEach(orb => orb.collectionRadius *= 1.2); ExperienceOrb.prototype.collectionRadius *=1.2; } } 
        ];
        this.chosenPowerUps = [];
    }

    getRandomPowerUps(count) {
        const shuffled = [...this.availablePowerUps].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    offerPowerUps() {
        const options = this.getRandomPowerUps(3); 
        const optionsContainer = document.getElementById('powerUpOptions');
        optionsContainer.innerHTML = ''; 

        options.forEach(powerUp => {
            const button = document.createElement('button');
            button.classList.add('powerup-button');
            button.innerHTML = `<strong>${powerUp.name}</strong><br><small>${powerUp.description}</small>`;
            button.onclick = () => {
                game.player.applyPowerUp(powerUp);
                this.chosenPowerUps.push(powerUp.name);
                document.getElementById('levelUpScreen').style.display = 'none';
                game.resumeGame();
            };
            optionsContainer.appendChild(button);
        });
        document.getElementById('levelUpScreen').style.display = 'flex';
    }
}

// Gerenciador de UI
class UIManager {
    constructor() {
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
        
        // Ensure all other screens are hidden
        this.mainMenu.style.display = 'none';
        this.aboutScreen.style.display = 'none';
        this.levelUpScreen.style.display = 'none';
        this.pauseMenu.style.display = 'none';
        
        this.gameOverScreen.style.display = 'flex';
        this.gameCanvas.style.display = 'none';
        this.hideGameUI();
    }

    showPauseMenu(currentScore) {
        this.currentScoreDisplay.textContent = currentScore;
        this.pauseMenu.style.display = 'flex';
        this.gameCanvas.style.display = 'none';
        this.hideGameUI();
    }

    hidePauseMenu() {
        this.pauseMenu.style.display = 'none';
        this.gameCanvas.style.display = 'block';
        this.showGameUI();
    }

    showLevelUpScreen() {
        this.levelUpScreen.style.display = 'flex';
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
    updateLevel(level) { this.levelDisplay.textContent = `Nível: ${level}`; }
    updateLives(lives) { this.livesDisplay.textContent = `Vidas: ${lives}`; }
    updateXPBar(currentXP, xpToNextLevel) {
        const percentage = (currentXP / xpToNextLevel) * 100;
        this.xpBar.style.width = `${Math.min(100, percentage)}%`;
    }
    updatePlayerHealth() { /* Player health bar is drawn on canvas */ }

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

// Classe principal do Jogo
class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = 800;
        this.height = 600;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.gameState = ' mainMenu'; 
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

        this.uiManager = new UIManager();
        this.powerUpManager = new PowerUpManager();
        this.lastTime = 0;
        this.isPaused = false;

        this.initControls();
        this.uiManager.showMainMenu();
        this.uiManager.updateHighScore(); // Initialize highscore display
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
        // End the current run and show game over screen
        this.gameState = 'gameOver';
        this.uiManager.pauseMenu.style.display = 'none'; // Hide pause menu first
        this.uiManager.showGameOverScreen(this.score);
    }

    endRunToMenu() {
        // End the current run and go straight to main menu
        this.gameState = 'gameOver';
        this.uiManager.pauseMenu.style.display = 'none'; // Hide pause menu first
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
            newEnemy = new ChaserEnemy(x,y);
        } else { 
            newEnemy = new ShooterEnemy(x,y);
        }
                        
        newEnemy.health = Math.floor(newEnemy.health * this.difficultyMultiplier);
        newEnemy.maxHealth = newEnemy.health; 
        // Ajuste no scaling do dano do inimigo
        // O dano base do inimigo (seja colisão ou projétil) será multiplicado pelo difficultyMultiplier
        // Para um scaling mais acentuado, podemos usar uma potência ou um multiplicador maior.
        // Exemplo: this.difficultyMultiplier^1.2 ou this.difficultyMultiplier * 1.5
        // Vamos usar um multiplicador direto para o dano base.
        // O dano de colisão do Enemy base é usado, e o ShooterEnemy tem seu próprio projectileDamage.
        if (newEnemy instanceof ShooterEnemy) {
            // ShooterEnemy tem dano de colisão e dano de projétil separados.
            // O dano de colisão já está no construtor do Enemy.
            // O dano do projétil é tratado no método shoot do ShooterEnemy.
            newEnemy.damage = Math.floor(newEnemy.damage * this.difficultyMultiplier); // Dano de colisão
            newEnemy.projectileDamage = Math.floor(newEnemy.projectileDamage * this.difficultyMultiplier); // Dano do projétil
        } else {
             newEnemy.damage = Math.floor(newEnemy.damage * this.difficultyMultiplier * 1.2); // Dano de colisão para Chaser e base Enemy, com um extra
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
        // Find a spawn position that's not too close to the player
        const minDistanceFromPlayer = 200;
        let x, y;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
            // Try to spawn boss on one of the four edges of the screen
            const edge = Math.floor(Math.random() * 4);
            switch (edge) {
                case 0: // Top
                    x = Math.random() * this.width;
                    y = -50;
                    break;
                case 1: // Right
                    x = this.width + 50;
                    y = Math.random() * this.height;
                    break;
                case 2: // Bottom
                    x = Math.random() * this.width;
                    y = this.height + 50;
                    break;
                case 3: // Left
                    x = -50;
                    y = Math.random() * this.height;
                    break;
            }
            attempts++;
        } while (
            attempts < maxAttempts && 
            this.player && 
            Math.sqrt((x - this.player.position.x) ** 2 + (y - this.player.position.y) ** 2) < minDistanceFromPlayer
        );
        
        // Create the boss with the current player level
        const boss = new BossEnemy(x, y, this.player.level);
        
        // Apply difficulty scaling to boss
        boss.health = Math.floor(boss.health * this.difficultyMultiplier);
        boss.maxHealth = boss.health;
        boss.damage = Math.floor(boss.damage * this.difficultyMultiplier);
        boss.projectileDamage = Math.floor(boss.projectileDamage * this.difficultyMultiplier);
        boss.xpValue = Math.floor(boss.xpValue * this.difficultyMultiplier);
        
        // Add boss to enemies array
        this.enemies.push(boss);
        
        // Show boss spawn message
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

        // Colisões
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
                // O dano do projétil inimigo já foi escalado quando o projétil foi criado
                if(this.player.takeDamage(ep.damage)) { 
                    ep.active = false; 
                }
            }
        });

        this.enemies.forEach(enemy => {
            if (!enemy.active) return;
            if (enemy.checkCollision(this.player)) {
                // O dano de colisão do inimigo já foi escalado quando o inimigo foi criado
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

// Inicialização do jogo
const game = new Game('gameCanvas');
