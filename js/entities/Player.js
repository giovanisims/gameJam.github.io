// Player class - main character controlled by the user
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 18, '#00FFFF', 'sprites/player.webp'); // Ciano with player sprite - 20% bigger
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
        this.projectileSize = 6; // 20% bigger projectiles
        this.projectilePierce = 0;
        this.numProjectiles = 1;
        this.projectileSpread = 0.1;
        this.invulnerableTime = 1.5;
        this.invulnerableTimer = 0;
        
        // Player sprite should be a bit larger
        this.spriteSize = 36; // 20% bigger sprite

        // Neural Overload variables
        this.hasNeuralOverload = false;
        this.isOverloadActive = false;
        this.overloadTimer = 0;
        this.overloadCooldown = 5; // Cooldown for neural overload
        this.overloadDuration = 3; // Duration of neural overload

        // Fire Trail variables
        this.hasFireTrail = false;
        this.fireTrailTimer = 0;
        this.fireTrailInterval = 0.1; // Interval between fire trail effects

        // Cyclone Axe variables
        this.hasCycloneAxe = false;
        this.cycloneAngle = 0;
        this.cycloneSpeed = 2 * Math.PI; // Full rotation in 1 second
        this.cycloneRadius = 30;
        this.cycloneDamage = 5;
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
            const baseAngle = targetPosition.subtract(this.position).angle();
            let shotsToFire = this.numProjectiles;
            
            // Neural Overload duplica os tiros
            if (this.isOverloadActive) {
                shotsToFire *= 2;
            }

            for (let i = 0; i < shotsToFire; i++) {
                let currentAngle = baseAngle;
                if (shotsToFire > 1) {
                    currentAngle += (i - (shotsToFire - 1) / 2) * this.projectileSpread;
                }
                const velocity = Vector2D.fromAngle(currentAngle, this.projectileSpeed);
                const projectile = new Projectile(
                    this.position.x,
                    this.position.y,
                    this.projectileSize,
                    this.isOverloadActive ? '#00FFFF' : '#FFFF00', // Cor diferente durante overload
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

        // Neural Overload logic
        if (this.hasNeuralOverload) {
            this.overloadTimer += dt;
            if (!this.isOverloadActive && this.overloadTimer >= this.overloadCooldown) {
                this.isOverloadActive = true;
                this.overloadTimer = 0;
                game.uiManager.showMessage("OVERLOAD NEURAL ATIVO!", 2);
                game.createOverloadEffect();
            } else if (this.isOverloadActive && this.overloadTimer >= this.overloadDuration) {
                this.isOverloadActive = false;
                this.overloadTimer = 0;
            }
        }

        // Fire Trail logic
        if (this.hasFireTrail) {
            this.fireTrailTimer += dt;
            if (this.fireTrailTimer >= this.fireTrailInterval) {
                game.addFireTrail(this.position.x, this.position.y);
                this.fireTrailTimer = 0;
            }
        }

        // Cyclone Axe logic
        if (this.hasCycloneAxe) {
            this.cycloneAngle += this.cycloneSpeed * dt;
            if (this.cycloneAngle >= Math.PI * 2) {
                this.cycloneAngle = 0;
            }
            
            // Check cyclone damage to enemies
            enemies.forEach(enemy => {
                if (!enemy.active) return;
                const distance = this.position.distance(enemy.position);
                if (distance <= this.cycloneRadius) {
                    enemy.takeDamage(this.cycloneDamage * dt); // Damage over time
                }
            });
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
        
        // Draw cyclone axe
        if (this.hasCycloneAxe) {
            ctx.save();
            ctx.translate(this.position.x, this.position.y);
            ctx.rotate(this.cycloneAngle);
            
            // Draw spinning axe effect
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.moveTo(-this.cycloneRadius, 0);
            ctx.lineTo(this.cycloneRadius, 0);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, -this.cycloneRadius);
            ctx.lineTo(0, this.cycloneRadius);
            ctx.stroke();
            
            ctx.restore();
        }
        
        super.draw(ctx);
        this.projectiles.forEach(p => p.draw(ctx));

        // Health bar - 20% bigger
        ctx.fillStyle = 'grey';
        ctx.fillRect(this.position.x - this.radius, this.position.y - this.radius - 12, this.radius * 2, 6);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.position.x - this.radius, this.position.y - this.radius - 12, this.radius * 2 * (this.health / this.maxHealth), 6);
        
        // Neural Overload screen effect
        if (this.isOverloadActive) {
            ctx.save();
            ctx.globalAlpha = 0.1 + 0.1 * Math.sin(Date.now() * 0.01);
            ctx.fillStyle = '#00FFFF';
            ctx.fillRect(this.position.x - 50, this.position.y - 50, 100, 100);
            ctx.restore();
        }
    }

    takeDamage(amount) {
        if (this.invulnerableTimer > 0) return false;

        this.health -= amount;
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
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
        game.uiManager.updateXPBar(this.xp, this.xpToNextLevel);
    }

    levelUp() {
        this.level++;
        this.xp = 0;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
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

    destroy() {
        // Clean up player projectiles
        this.projectiles.forEach(proj => proj.destroy());
        // Call parent destroy method to clean up sprite element
        super.destroy();
    }
}
