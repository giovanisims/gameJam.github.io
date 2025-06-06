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
            this.destroy(); // Clean up sprite element
        }
    }

    onHitEnemy(enemy) {
        if (this.hitEnemies.has(enemy)) return false;

        this.hitEnemies.add(enemy);
        if (this.pierceCount <= 0) {
            this.destroy(); // Clean up sprite element
        } else {
            this.pierceCount--;
        }
        return true;
    }
}
