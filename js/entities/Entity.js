// Base class for all game entities
class Entity {
    constructor(x, y, radius, color, spritePath = null) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(0, 0);
        this.radius = radius;
        this.color = color;
        this.active = true;
        
        this.spriteElement = null;
        this.spriteLoaded = false;
        this.spriteSize = radius * 2;
        
        if (spritePath) {
            this.loadSprite(spritePath);
        }
    }

    loadSprite(spritePath) {
        if (this.spriteElement && this.spriteElement.parentNode) {
            this.spriteElement.parentNode.removeChild(this.spriteElement);
        }
        
        this.spriteElement = document.createElement('img');
        this.spriteElement.src = spritePath;
        this.spriteElement.style.position = 'absolute';
        this.spriteElement.style.width = this.spriteSize + 'px';
        this.spriteElement.style.height = this.spriteSize + 'px';
        this.spriteElement.style.pointerEvents = 'none';
        this.spriteElement.style.zIndex = '10';
        this.spriteElement.style.imageRendering = 'pixelated';
        this.spriteElement.style.display = 'none';
        
        this.spriteElement.onload = () => {
            this.spriteLoaded = true;
        };
        
        this.spriteElement.onerror = () => {
            this.spriteLoaded = false;
        };
        
        document.body.appendChild(this.spriteElement);
    }

    update(dt) {
        this.position = this.position.add(this.velocity.multiply(dt));
        
        if (this.spriteElement && this.spriteLoaded) {
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) return;
            
            const canvasRect = canvas.getBoundingClientRect();
            
            const buffer = 10;
            const isWithinCanvas = 
                this.position.x >= -buffer && 
                this.position.x <= canvas.width + buffer &&
                this.position.y >= -buffer && 
                this.position.y <= canvas.height + buffer;
                
            const leftPos = (canvasRect.left + this.position.x - this.spriteSize / 2) + 'px';
            const topPos = (canvasRect.top + this.position.y - this.spriteSize / 2) + 'px';
            
            if (this.spriteElement.style.left !== leftPos) {
                this.spriteElement.style.left = leftPos;
            }
            
            if (this.spriteElement.style.top !== topPos) {
                this.spriteElement.style.top = topPos;
            }
            
            if (!this.active || !isWithinCanvas) {
                if (this.spriteElement.style.display !== 'none') {
                    this.spriteElement.style.display = 'none';
                }
            } else if (this.spriteElement.style.display !== 'block') {
                this.spriteElement.style.display = 'block';
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        if (!this.spriteElement || !this.spriteLoaded) {
            this.drawFallback(ctx);
        }
    }
    
    drawFallback(ctx) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    destroy() {
        if (this.spriteElement && this.spriteElement.parentNode) {
            this.spriteElement.parentNode.removeChild(this.spriteElement);
        }
        this.active = false;
    }

    checkCollision(otherEntity) {
        const distance = this.position.distance(otherEntity.position);
        return distance < this.radius + otherEntity.radius;
    }
}
