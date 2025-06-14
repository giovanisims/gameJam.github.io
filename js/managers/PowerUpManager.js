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
        
        // Power-ups lendários - não stackáveis
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
        
        // 15% de chance para um power-up lendário aparecer (se disponível)
        const availableLegendary = this.legendaryPowerUps.filter(
            legendary => !this.chosenLegendaryPowerUps.includes(legendary.name)
        );
        
        if (availableLegendary.length > 0 && Math.random() < 0.05) { 
            // Adiciona um power-up lendário aleatório
            const randomLegendary = availableLegendary[Math.floor(Math.random() * availableLegendary.length)];
            options.push(randomLegendary);
        }
        
        // Preenche o resto com power-ups normais
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

        // Interface normal de power-ups (sem verificação prévia)
        options.forEach((powerUp, index) => {
            const button = document.createElement('button');
            const isLegendary = this.legendaryPowerUps.some(legendary => legendary.name === powerUp.name);
            
            button.classList.add('powerup-button');
            if (isLegendary) {
                button.classList.add('legendary-powerup');
            }
            button.setAttribute('id', `powerup-${index}`);
            button.innerHTML = `<strong>${powerUp.name}</strong><br><small>${powerUp.description}</small>`;
            
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

    // Nova função para lidar com a seleção de power-ups
    handlePowerUpSelection(powerUp) {
        const isLegendary = this.legendaryPowerUps.some(legendary => legendary.name === powerUp.name);
        
        // Se for lendário e já tiver 2 ativos, mostrar modal de substituição
        if (isLegendary && this.activeLegendaryPowerUps.length >= this.maxLegendaryPowerUps) {
            this.showLegendaryReplaceInterface(powerUp);
        } else {
            // Aplicar normalmente
            this.selectPowerUp(powerUp);
        }
    }

    showLegendaryReplaceInterface(newLegendary) {
        const optionsContainer = document.getElementById('powerUpOptions');
        optionsContainer.innerHTML = '';

        // Título explicativo
        const title = document.createElement('div');
        title.innerHTML = '<h3 style="grid-column: 1 / -1; margin: 0; color: #FFD700;">Limite de Power-ups Lendários Atingido!</h3>';
        title.style.textAlign = 'center';
        optionsContainer.appendChild(title);

        const subtitle = document.createElement('div');
        subtitle.innerHTML = `<p style="grid-column: 1 / -1; margin: 10px 0; color: #FFF;">Você escolheu "${newLegendary.name}". Substitua um power-up lendário ativo:</p>`;
        subtitle.style.textAlign = 'center';
        optionsContainer.appendChild(subtitle);

        // Botões dos power-ups lendários ativos (para remover)
        this.activeLegendaryPowerUps.forEach((legendaryName, index) => {
            const button = document.createElement('button');
            button.classList.add('powerup-button', 'legendary-powerup', 'replace-button');
            button.setAttribute('id', `replace-${index}`);
            
            const legendary = this.legendaryPowerUps.find(p => p.name === legendaryName);
            button.innerHTML = `<strong>Substituir: ${legendary.name}</strong><br><small>${legendary.description}</small>`;
            
            button.onclick = () => {
                this.replaceLegendaryPowerUp(legendaryName, newLegendary);
            };
            
            optionsContainer.appendChild(button);
        });

        // Botão para cancelar e não pegar o power-up lendário
        const cancelButton = document.createElement('button');
        cancelButton.classList.add('powerup-button');
        cancelButton.innerHTML = '<strong>Cancelar</strong><br><small>Não pegar este power-up lendário</small>';
        cancelButton.style.gridColumn = '1 / -1';
        cancelButton.style.background = '#444444';
        cancelButton.style.borderColor = '#666666';
        
        cancelButton.onclick = () => {
            // Volta para as opções normais, mas sem o power-up lendário rejeitado
            this.showCanceledPowerUpOptions();
        };
        
        optionsContainer.appendChild(cancelButton);
        
        document.getElementById('levelUpScreen').style.display = 'flex';
    }

    showCanceledPowerUpOptions() {
        // Mostra apenas power-ups normais como alternativa
        const normalOptions = this.availablePowerUps.slice(0, 3);
        const optionsContainer = document.getElementById('powerUpOptions');
        optionsContainer.innerHTML = '';

        const title = document.createElement('div');
        title.innerHTML = '<h3 style="grid-column: 1 / -1; margin: 0; color: #00FFFF;">Escolha um power-up alternativo:</h3>';
        title.style.textAlign = 'center';
        optionsContainer.appendChild(title);

        normalOptions.forEach((powerUp, index) => {
            const button = document.createElement('button');
            button.classList.add('powerup-button');
            button.setAttribute('id', `powerup-${index}`);
            button.innerHTML = `<strong>${powerUp.name}</strong><br><small>${powerUp.description}</small>`;
            
            button.onclick = () => {
                this.selectPowerUp(powerUp);
            };
            
            optionsContainer.appendChild(button);
        });
    }

    replaceLegendaryPowerUp(oldLegendaryName, newLegendary) {
        // Remove o power-up antigo
        this.removeLegendaryPowerUp(oldLegendaryName);
        
        // Adiciona o novo
        this.selectPowerUp(newLegendary);
        
        game.uiManager.showMessage(`${oldLegendaryName} foi substituído por ${newLegendary.name}!`, 3);
    }

    removeLegendaryPowerUp(legendaryName) {
        // Remove da lista de ativos
        const index = this.activeLegendaryPowerUps.indexOf(legendaryName);
        if (index > -1) {
            this.activeLegendaryPowerUps.splice(index, 1);
        }

        // Remove da lista de escolhidos
        const chosenIndex = this.chosenLegendaryPowerUps.indexOf(legendaryName);
        if (chosenIndex > -1) {
            this.chosenLegendaryPowerUps.splice(chosenIndex, 1);
        }

        // Remove os efeitos do jogador
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
        // Add selection effect before applying
        const buttons = document.querySelectorAll('.powerup-button');
        buttons.forEach(btn => btn.disabled = true);
        
        // Add visual feedback for selection
        if (event && event.currentTarget) {
            event.currentTarget.style.transform = 'scale(1.1)';
            event.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.8)';
        }
        
        // Apply the power-up after a brief delay for visual feedback
        setTimeout(() => {
            game.player.applyPowerUp(powerUp);
            this.chosenPowerUps.push(powerUp.name);
            
            // Se for lendário, adiciona à lista de lendários escolhidos e ativos
            const isLegendary = this.legendaryPowerUps.some(legendary => legendary.name === powerUp.name);
            if (isLegendary) {
                this.chosenLegendaryPowerUps.push(powerUp.name);
                this.activeLegendaryPowerUps.push(powerUp.name);
            }
            
            // Hide screen and restore body scroll
            document.getElementById('levelUpScreen').style.display = 'none';
            document.body.style.overflow = '';
            
            game.resumeGame();
        }, 400);
    }
}
