// PowerUpManager - handles player upgrades and power-ups
class PowerUpManager {
    constructor() {
        this.availablePowerUps = [
            { name: "Velocidade de Tiro", description: "Aumenta a cadência de tiro.", apply: (player) => { player.shootCooldown = Math.max(0.1, player.shootCooldown * 0.85); } },
            { name: "Dano do Projétil", description: "Aumenta o dano dos seus projéteis.", apply: (player) => { player.projectileDamage += 5; } },
            { name: "Velocidade de Movimento", description: "Aumenta sua velocidade de movimento.", apply: (player) => { player.speed += 30; } },
            { name: "Vida Máxima", description: "Aumenta sua vida máxima.", apply: (player) => { player.maxHealth += 20; game.uiManager.updatePlayerHealth(); } },
            { name: "Mais Projéteis", description: "Dispara um projétil adicional.", apply: (player) => { player.numProjectiles +=1; } },
            { name: "Penetração de Projétil", description: "Projéteis atravessam mais um inimigo.", apply: (player) => { player.projectilePierce +=1; } },
            { name: "Recuperar Vida", description: "Recupera 50% da vida máxima.", apply: (player) => { player.health = Math.min(player.maxHealth, player.health + player.maxHealth * 0.5); game.uiManager.updatePlayerHealth(); } },
            { name: "Raio de Coleta XP", description: "Aumenta o raio de coleta de orbes de XP.", apply: (player) => { game.xpOrbs.forEach(orb => orb.collectionRadius *= 1.2); ExperienceOrb.prototype.collectionRadius *=1.2; } } 
        ];
        
        this.legendaryPowerUps = [
            { 
                name: "Tiro Explosivo", 
                description: "Seus projéteis explodem causando dano em área!", 
                apply: (player) => { 
                    player.hasExplosiveShots = true;
                    player.explosionRadius = 80;
                    player.explosionDamage = player.projectileDamage * 0.7;
                } 
            },
            { 
                name: "Vampirismo", 
                description: "Cure-se com base no dano causado aos inimigos!", 
                apply: (player) => { 
                    player.hasVampirism = true;
                    player.vampirismRate = 0.15; // 15% do dano vira vida
                } 
            },
            {
                name: "Inferno Andante",
                description: "Deixa um rastro de fogo que queima inimigos!",
                apply: (player) => {
                    player.hasFireTrail = true;
                    player.fireTrailDamage = 25;
                    player.fireTrailTimer = 0;
                    player.fireTrailInterval = 0.1;
                    game.fireTrails = [];
                }
            },
            {
                name: "Carnificina Ciclônica",
                description: "Você gira 4 raios laser em torno de si! causando dano a inimigos proximos!",
                apply: (player) => {
                    player.hasCycloneAxe = true;
                    player.cycloneRadius = 100;
                    player.cycloneDamage = 45;
                    player.cycloneAngle = 0;
                    player.cycloneSpeed = 4;
                }
            },
            {
                name: "Overload Neural",
                description: "Duplica todos os tiros por 6s a cada 20s!",
                apply: (player) => {
                    player.hasNeuralOverload = true;
                    player.overloadTimer = 0;
                    player.overloadCooldown = 20;
                    player.overloadDuration = 6;
                    player.isOverloadActive = false;
                }
            }
        ];
        
        this.chosenPowerUps = [];
        this.chosenLegendaryPowerUps = []; // Rastreia lendários já escolhidos
        this.activeLegendaryPowerUps = []; // Novos: power-ups lendários ativos
        this.maxLegendaryPowerUps = 2; // Limite de power-ups lendários
    }

    getRandomPowerUps(count) {
        const options = [];
        
        const availableLegendary = this.legendaryPowerUps.filter(
            legendary => !this.chosenLegendaryPowerUps.includes(legendary.name)
        );
        
        if (availableLegendary.length > 0 && Math.random() < 0.05) { 
            const randomLegendary = availableLegendary[Math.floor(Math.random() * availableLegendary.length)];
            options.push(randomLegendary);
        }
        
        const shuffledNormal = [...this.availablePowerUps].sort(() => 0.5 - Math.random());
        const remainingSlots = count - options.length;
        
        for (let i = 0; i < remainingSlots && i < shuffledNormal.length; i++) {
            options.push(shuffledNormal[i]);
        }
        
        return options;
    }

    offerPowerUps() {
        const options = this.getRandomPowerUps(3);
        const optionsContainer = document.getElementById('powerUpOptions');
        optionsContainer.innerHTML = '';
        
        // Reset the grid layout
        optionsContainer.style.display = 'grid';
        optionsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
        optionsContainer.style.gap = '32px';
        optionsContainer.style.justifyItems = 'center';

        options.forEach((powerUp, index) => {
            const button = document.createElement('button');
            const isLegendary = this.legendaryPowerUps.some(legendary => legendary.name === powerUp.name);
            
            button.classList.add('powerup-button');
            if (isLegendary) {
                button.classList.add('legendary-powerup');
            }
            button.setAttribute('id', `powerup-${index}`);
            
            // Create structure for the button content
            const strongElement = document.createElement('strong');
            strongElement.textContent = powerUp.name;
            
            const smallElement = document.createElement('small');
            smallElement.textContent = powerUp.description;
            
            button.appendChild(strongElement);
            button.appendChild(document.createElement('br'));
            button.appendChild(smallElement);
            
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handlePowerUpSelection(powerUp);
                }
            });
            
            button.onclick = () => {
                this.handlePowerUpSelection(powerUp);
            };
            
            optionsContainer.appendChild(button);
        });
        
        document.getElementById('levelUpScreen').style.display = 'flex';
    }

    handlePowerUpSelection(powerUp) {
        const isLegendary = this.legendaryPowerUps.some(legendary => legendary.name === powerUp.name);
        
        if (isLegendary && this.activeLegendaryPowerUps.length >= this.maxLegendaryPowerUps) {
            this.showLegendaryReplaceInterface(powerUp);
        } else {
            this.selectPowerUp(powerUp);
        }
    }

    showLegendaryReplaceInterface(newLegendary) {
        const optionsContainer = document.getElementById('powerUpOptions');
        optionsContainer.innerHTML = '';
        
        // Reset the grid layout before adding new content
        optionsContainer.style.display = 'grid';
        optionsContainer.style.gridTemplateColumns = '1fr';

        // Create a wrapper for the title and subtitle to ensure proper layout
        const headerWrapper = document.createElement('div');
        headerWrapper.style.gridColumn = '1 / -1';
        headerWrapper.style.width = '100%';
        headerWrapper.style.textAlign = 'center';
        headerWrapper.style.marginBottom = '20px';
        
        // Add title
        const title = document.createElement('h3');
        title.style.margin = '0';
        title.style.color = '#FFD700';
        title.textContent = 'Limite de Power-ups Lendários Atingido!';
        headerWrapper.appendChild(title);
        
        // Add subtitle
        const subtitle = document.createElement('p');
        subtitle.style.margin = '10px 0';
        subtitle.style.color = '#FFF';
        subtitle.textContent = `Você escolheu "${newLegendary.name}". Substitua um power-up lendário ativo:`;
        headerWrapper.appendChild(subtitle);
        
        optionsContainer.appendChild(headerWrapper);
        
        // Create container for the legendary buttons to ensure proper layout
        const legendaryButtonsContainer = document.createElement('div');
        legendaryButtonsContainer.style.display = 'grid';
        legendaryButtonsContainer.style.gridTemplateColumns = this.activeLegendaryPowerUps.length === 2 ? '1fr 1fr' : '1fr';
        legendaryButtonsContainer.style.gap = '32px';
        legendaryButtonsContainer.style.width = '100%';
        legendaryButtonsContainer.style.justifyItems = 'center';
        
        // Add the legendary power-up buttons
        this.activeLegendaryPowerUps.forEach((legendaryName, index) => {
            const button = document.createElement('button');
            button.classList.add('powerup-button', 'legendary-powerup', 'replace-button');
            button.setAttribute('id', `replace-${index}`);
            
            const legendary = this.legendaryPowerUps.find(p => p.name === legendaryName);
            
            // Create structure for the button content
            const strongElement = document.createElement('strong');
            strongElement.textContent = `Substituir: ${legendary.name}`;
            
            const smallElement = document.createElement('small');
            smallElement.textContent = legendary.description;
            
            button.appendChild(strongElement);
            button.appendChild(document.createElement('br'));
            button.appendChild(smallElement);
            
            button.onclick = () => {
                this.replaceLegendaryPowerUp(legendaryName, newLegendary);
            };
            
            legendaryButtonsContainer.appendChild(button);
        });
        
        optionsContainer.appendChild(legendaryButtonsContainer);
        
        // Create a wrapper for the cancel button
        const cancelWrapper = document.createElement('div');
        cancelWrapper.style.gridColumn = '1 / -1';
        cancelWrapper.style.width = '100%';
        cancelWrapper.style.marginTop = '20px';
        cancelWrapper.style.display = 'flex';
        cancelWrapper.style.justifyContent = 'center';
        
        // Add cancel button
        const cancelButton = document.createElement('button');
        cancelButton.classList.add('powerup-button');
        cancelButton.style.background = '#444444';
        cancelButton.style.borderColor = '#666666';
        cancelButton.style.minWidth = '300px';
        cancelButton.style.minHeight = 'auto';
        cancelButton.style.padding = '15px 20px';
        
        const cancelStrongElement = document.createElement('strong');
        cancelStrongElement.textContent = 'Cancelar';
        cancelStrongElement.style.display = 'block';
        cancelStrongElement.style.height = 'auto';
        
        const cancelSmallElement = document.createElement('small');
        cancelSmallElement.textContent = 'Não pegar este power-up lendário';
        
        cancelButton.appendChild(cancelStrongElement);
        cancelButton.appendChild(document.createElement('br'));
        cancelButton.appendChild(cancelSmallElement);
        
        cancelButton.onclick = () => {
            this.showCanceledPowerUpOptions();
        };
        
        cancelWrapper.appendChild(cancelButton);
        optionsContainer.appendChild(cancelWrapper);
        
        document.getElementById('levelUpScreen').style.display = 'flex';
    }

    showCanceledPowerUpOptions() {
        const normalOptions = this.availablePowerUps.slice(0, 3);
        const optionsContainer = document.getElementById('powerUpOptions');
        optionsContainer.innerHTML = '';
        
        // Reset the grid layout
        optionsContainer.style.display = 'grid';
        optionsContainer.style.gridTemplateColumns = '1fr';
        
        // Create a wrapper for the title
        const headerWrapper = document.createElement('div');
        headerWrapper.style.gridColumn = '1 / -1';
        headerWrapper.style.width = '100%';
        headerWrapper.style.textAlign = 'center';
        headerWrapper.style.marginBottom = '20px';
        
        // Add title
        const title = document.createElement('h3');
        title.style.margin = '0';
        title.style.color = '#00FFFF';
        title.textContent = 'Escolha um power-up alternativo:';
        headerWrapper.appendChild(title);
        
        optionsContainer.appendChild(headerWrapper);
        
        // Create container for power-up buttons to ensure proper layout
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'grid';
        buttonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
        buttonsContainer.style.gap = '32px';
        buttonsContainer.style.width = '100%';
        buttonsContainer.style.justifyItems = 'center';
        
        // Add power-up buttons
        normalOptions.forEach((powerUp, index) => {
            const button = document.createElement('button');
            button.classList.add('powerup-button');
            button.setAttribute('id', `powerup-${index}`);
            
            // Create structure for the button content
            const strongElement = document.createElement('strong');
            strongElement.textContent = powerUp.name;
            
            const smallElement = document.createElement('small');
            smallElement.textContent = powerUp.description;
            
            button.appendChild(strongElement);
            button.appendChild(document.createElement('br'));
            button.appendChild(smallElement);
            
            button.onclick = () => {
                this.selectPowerUp(powerUp);
            };
            
            buttonsContainer.appendChild(button);
        });
        
        optionsContainer.appendChild(buttonsContainer);
    }

    replaceLegendaryPowerUp(oldLegendaryName, newLegendary) {
        this.removeLegendaryPowerUp(oldLegendaryName);
        
        this.selectPowerUp(newLegendary);
        
        game.uiManager.showMessage(`${oldLegendaryName} foi substituído por ${newLegendary.name}!`, 3);
    }

    removeLegendaryPowerUp(legendaryName) {
        const index = this.activeLegendaryPowerUps.indexOf(legendaryName);
        if (index > -1) {
            this.activeLegendaryPowerUps.splice(index, 1);
        }

        const chosenIndex = this.chosenLegendaryPowerUps.indexOf(legendaryName);
        if (chosenIndex > -1) {
            this.chosenLegendaryPowerUps.splice(chosenIndex, 1);
        }

        this.removeLegendaryEffects(legendaryName);
    }

    removeLegendaryEffects(legendaryName) {
        const player = game.player;
        
        switch(legendaryName) {
            case "Tiro Explosivo":
                player.hasExplosiveShots = false;
                delete player.explosionRadius;
                delete player.explosionDamage;
                break;
                
            case "Vampirismo":
                player.hasVampirism = false;
                delete player.vampirismRate;
                break;
                
            case "Tempestade de Raio":
                player.hasLightningStorm = false;
                delete player.lightningKillCount;
                delete player.lightningThreshold;
                delete player.lightningDamage;
                delete player.lightningChainRange;
                break;
                
            case "Inferno Andante":
                player.hasFireTrail = false;
                delete player.fireTrailDamage;
                delete player.fireTrailTimer;
                delete player.fireTrailInterval;
                break;
                
            case "Carnificina Ciclônica":
                player.hasCycloneAxe = false;
                delete player.cycloneRadius;
                delete player.cycloneDamage;
                delete player.cycloneAngle;
                delete player.cycloneSpeed;
                break;
                
            case "Overload Neural":
                player.hasNeuralOverload = false;
                player.isOverloadActive = false;
                delete player.overloadTimer;
                delete player.overloadCooldown;
                delete player.overloadDuration;
                break;
        }
    }
    
    selectPowerUp(powerUp) {
        const buttons = document.querySelectorAll('.powerup-button');
        buttons.forEach(btn => btn.disabled = true);
        
        if (event && event.currentTarget) {
            event.currentTarget.style.transform = 'scale(1.1)';
            event.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.8)';
        }
        
        setTimeout(() => {
            game.player.applyPowerUp(powerUp);
            this.chosenPowerUps.push(powerUp.name);
            
            const isLegendary = this.legendaryPowerUps.some(legendary => legendary.name === powerUp.name);
            if (isLegendary) {
                this.chosenLegendaryPowerUps.push(powerUp.name);
                this.activeLegendaryPowerUps.push(powerUp.name);
            }
            
            document.getElementById('levelUpScreen').style.display = 'none';
            document.body.style.overflow = '';
            
            game.resumeGame();
        }, 400);
    }
}
