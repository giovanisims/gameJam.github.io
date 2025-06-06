// Orb classes - collectible items that provide benefits to the player

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
            this.destroy(); // Clean up sprite element
        } else if (distanceToPlayer < this.collectionRadius) {
            const direction = player.position.subtract(this.position).normalize();
            this.velocity = direction.multiply(this.collectionSpeed);
        } else {
            this.velocity = new Vector2D(0, 0);
        }
        super.update(dt);
    }
}

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
            this.destroy(); // Clean up sprite element
        }
    }
}
