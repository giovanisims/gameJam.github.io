// Base class for all game entities
class Entity {
    constructor(x, y, radius, color, spritePath = null) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(0, 0);
        this.radius = radius;
        this.color = color;
        this.active = true; // Para remoção de entidades
        
        // Sprite handling
        this.sprite = null;
        this.spriteLoaded = false;
        this.spriteSize = radius * 2; // Default sprite size based on radius
        
        if (spritePath) {
            this.loadSprite(spritePath);
        }
    }

    loadSprite(spritePath) {
        this.sprite = new Image();
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };
        this.sprite.src = spritePath;
    }

    update(dt) {
        this.position = this.position.add(this.velocity.multiply(dt));
    }

    draw(ctx) {
        if (!this.active) return;
        
        // Draw sprite if loaded, otherwise fall back to colored circle
        if (this.sprite && this.spriteLoaded) {
            const drawSize = this.spriteSize;
            ctx.drawImage(
                this.sprite,
                this.position.x - drawSize / 2,
                this.position.y - drawSize / 2,
                drawSize,
                drawSize
            );
        } else {
            // Fallback to colored circle
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }
    }

    checkCollision(otherEntity) {
        const distance = this.position.distance(otherEntity.position);
        return distance < this.radius + otherEntity.radius;
    }
}
