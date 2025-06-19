// Projectile class - bullets fired by player and enemies
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
            this.destroy();
        }
    }

    onHitEnemy(enemy) {
        if (this.hitEnemies.has(enemy)) return false;

        this.hitEnemies.add(enemy);
        
        if (game.player.hasExplosiveShots) {
            this.createExplosion();
        }
        
        if (this.pierceCount <= 0) {
            this.destroy();
        } else {
            this.pierceCount--;
        }
        return true;
    }
    
    createExplosion() {
        game.createExplosionEffect(this.position.x, this.position.y, game.player.explosionRadius);
        
        game.enemies.forEach(enemy => {
            if (!enemy.active) return;
            const distance = this.position.distance(enemy.position);
            if (distance <= game.player.explosionRadius) {
                enemy.takeDamage(game.player.explosionDamage);
                if (!enemy.active) {
                    game.spawnExperienceOrb(enemy.position.x, enemy.position.y, enemy.xpValue);
                }
            }
        });
    }
}
