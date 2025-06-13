// PowerUpManager - handles player upgrades and power-ups
class PowerUpManager {
    constructor() {
        this.availablePowerUps = [
            { name: "Velocidade de Tiro +", description: "Aumenta a cadência de tiro.", apply: (player) => { player.shootCooldown = Math.max(0.1, player.shootCooldown * 0.85); } },
            { name: "Dano do Projétil +", description: "Aumenta o dano dos seus projéteis.", apply: (player) => { player.projectileDamage += 5; } },
            { name: "Velocidade de Movimento +", description: "Aumenta sua velocidade de movimento.", apply: (player) => { player.speed += 30; } },
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

        options.forEach((powerUp, index) => {
            const button = document.createElement('button');
            button.classList.add('powerup-button');
            button.setAttribute('id', `powerup-${index}`);
            button.innerHTML = `<strong>${powerUp.name}</strong><br><small>${powerUp.description}</small>`;
            
            // Add keyboard handlers for improved accessibility
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectPowerUp(powerUp);
                }
            });
            
            button.onclick = () => {
                this.selectPowerUp(powerUp);
            };
            
            optionsContainer.appendChild(button);
        });
        
        document.getElementById('levelUpScreen').style.display = 'flex';
    }
    
    selectPowerUp(powerUp) {
        // Add selection effect before applying
        const buttons = document.querySelectorAll('.powerup-button');
        buttons.forEach(btn => btn.disabled = true);
        
        // Add visual feedback for selection
        event.currentTarget.style.transform = 'scale(1.1)';
        event.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.8)';
        
        // Apply the power-up after a brief delay for visual feedback
        setTimeout(() => {
            game.player.applyPowerUp(powerUp);
            this.chosenPowerUps.push(powerUp.name);
            
            // Hide screen and restore body scroll
            document.getElementById('levelUpScreen').style.display = 'none';
            document.body.style.overflow = '';
            
            game.resumeGame();
        }, 400);
    }
}
