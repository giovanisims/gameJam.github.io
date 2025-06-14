// Base class for all game entities
class Entity {
    constructor(x, y, radius, color, spritePath = null) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(0, 0);
        this.radius = radius;
        this.color = color;
        this.active = true; // Para remoção de entidades
        
        // Sprite handling with HTML img elements
        this.spriteElement = null;
        this.spriteLoaded = false;
        this.spriteSize = radius * 2; // Default sprite size based on radius
        
        if (spritePath) {
            this.loadSprite(spritePath);
        }
    }

    loadSprite(spritePath) {
        // Clean up any existing sprite first to avoid duplicates
        if (this.spriteElement && this.spriteElement.parentNode) {
            this.spriteElement.parentNode.removeChild(this.spriteElement);
        }
        
        // Create HTML img element for animated sprites
        this.spriteElement = document.createElement('img');
        this.spriteElement.src = spritePath;
        this.spriteElement.style.position = 'absolute';
        this.spriteElement.style.width = this.spriteSize + 'px';
        this.spriteElement.style.height = this.spriteSize + 'px';
        this.spriteElement.style.pointerEvents = 'none'; // Don't interfere with game clicks
        this.spriteElement.style.zIndex = '10'; // Above canvas but below UI
        this.spriteElement.style.imageRendering = 'pixelated'; // For pixel art sprites
        this.spriteElement.style.display = 'none'; // Start hidden until properly positioned
        
        this.spriteElement.onload = () => {
            this.spriteLoaded = true;
        };
        
        this.spriteElement.onerror = () => {
            this.spriteLoaded = false;
        };
        
        // Add to DOM
        document.body.appendChild(this.spriteElement);
    }

    update(dt) {
        this.position = this.position.add(this.velocity.multiply(dt));
        
        // Update sprite position if it exists
        if (this.spriteElement && this.spriteLoaded) {
            // Get canvas offset to position sprite correctly
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) return; // Safety check
            
            const canvasRect = canvas.getBoundingClientRect();
            
            // Check if entity is within canvas boundaries (with small buffer for smooth transitions)
            const buffer = 10; // Small buffer to allow smooth entry/exit
            const isWithinCanvas = 
                this.position.x >= -buffer && 
                this.position.x <= canvas.width + buffer &&
                this.position.y >= -buffer && 
                this.position.y <= canvas.height + buffer;
                
            // Position sprite - calculate position only once
            const leftPos = (canvasRect.left + this.position.x - this.spriteSize / 2) + 'px';
            const topPos = (canvasRect.top + this.position.y - this.spriteSize / 2) + 'px';
            
            // Only update position if necessary
            if (this.spriteElement.style.left !== leftPos) {
                this.spriteElement.style.left = leftPos;
            }
            
            if (this.spriteElement.style.top !== topPos) {
                this.spriteElement.style.top = topPos;
            }
            
            // Handle visibility - check if we need to change the display value
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
        
        // Only draw fallback circle if sprite is not loaded
        // The HTML img element handles the actual sprite rendering
        if (!this.spriteElement || !this.spriteLoaded) {
            this.drawFallback(ctx);
        }
        // Note: Sprite is positioned by the update() method, not drawn here
    }
    
    drawFallback(ctx) {
        // Fallback to colored circle
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    destroy() {
        // Clean up HTML sprite element when entity is destroyed
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
