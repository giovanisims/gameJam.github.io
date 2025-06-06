// Base class for all game entities
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
