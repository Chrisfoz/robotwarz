/**
 * Shop System - Upgrade shop interface
 */

export class ShopSystem {
    constructor(canvas, upgradeSystem, progressionSystem) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.upgradeSystem = upgradeSystem;
        this.progressionSystem = progressionSystem;
        
        // Shop state
        this.isOpen = false;
        this.currentCategory = 'ALL';
        this.selectedUpgrade = null;
        this.selectedBot = 'TITAN';
        this.scrollOffset = 0;
        this.maxScroll = 0;
        
        // Visual settings
        this.colors = {
            background: 'rgba(15, 23, 42, 0.95)',
            panel: 'rgba(30, 41, 59, 0.9)',
            primary: '#56CCF2',
            secondary: '#3a4c67',
            accent: '#2F80ED',
            text: '#ffffff',
            textDim: '#9ca3af',
            success: '#4ade80',
            error: '#ef4444',
            warning: '#fbbf24',
            locked: '#6b7280',
            tier1: '#10b981',
            tier2: '#3b82f6',
            tier3: '#a855f7',
            equipped: '#fbbf24'
        };
        
        // Font settings
        this.fonts = {
            title: 'bold 32px Arial',
            subtitle: 'bold 24px Arial',
            normal: '18px Arial',
            small: '16px Arial',
            tiny: '14px Arial'
        };
        
        // Layout configuration
        this.layout = {
            padding: 30,
            panelWidth: 350,
            itemHeight: 120,
            itemsPerRow: 3,
            categoryHeight: 50,
            detailsWidth: 400
        };
        
        // Animation values
        this.animationTime = 0;
        this.transitions = {
            openProgress: 0,
            categoryChange: 0,
            purchaseEffect: []
        };
        
        // Filter and sort options
        this.filters = {
            category: 'ALL',
            affordable: false,
            owned: false,
            equipped: false
        };
        
        this.sortBy = 'TIER'; // TIER, COST, NAME, CATEGORY
        
        // Comparison mode
        this.comparisonMode = false;
        this.compareUpgrade = null;
        
        // Purchase history
        this.purchaseHistory = [];
        
        // Tooltips
        this.tooltips = new Map();
        
        this.setupInputHandlers();
    }
    
    setupInputHandlers() {
        this.boundHandlers = {
            keydown: this.handleKeyDown.bind(this),
            mousemove: this.handleMouseMove.bind(this),
            mousedown: this.handleMouseDown.bind(this),
            wheel: this.handleWheel.bind(this)
        };
    }
    
    open() {
        this.isOpen = true;
        this.transitions.openProgress = 0;
        this.refreshUpgradeList();
        
        // Add event listeners
        document.addEventListener('keydown', this.boundHandlers.keydown);
        this.canvas.addEventListener('mousemove', this.boundHandlers.mousemove);
        this.canvas.addEventListener('mousedown', this.boundHandlers.mousedown);
        this.canvas.addEventListener('wheel', this.boundHandlers.wheel);
    }
    
    close() {
        this.isOpen = false;
        
        // Remove event listeners
        document.removeEventListener('keydown', this.boundHandlers.keydown);
        this.canvas.removeEventListener('mousemove', this.boundHandlers.mousemove);
        this.canvas.removeEventListener('mousedown', this.boundHandlers.mousedown);
        this.canvas.removeEventListener('wheel', this.boundHandlers.wheel);
    }
    
    handleKeyDown(e) {
        if (!this.isOpen) return;
        
        switch(e.key) {
            case 'Escape':
                this.close();
                e.preventDefault();
                break;
                
            case 'Tab':
                this.cycleCategory();
                e.preventDefault();
                break;
                
            case 'c':
            case 'C':
                this.toggleComparisonMode();
                e.preventDefault();
                break;
                
            case 'r':
            case 'R':
                if (this.selectedUpgrade) {
                    this.refundUpgrade(this.selectedUpgrade);
                }
                e.preventDefault();
                break;
        }
    }
    
    handleMouseMove(e) {
        if (!this.isOpen) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        
        // Update hover states
        this.updateHoverStates();
    }
    
    handleMouseDown(e) {
        if (!this.isOpen) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check category tabs
        this.checkCategoryClick(x, y);
        
        // Check upgrade items
        this.checkUpgradeClick(x, y);
        
        // Check action buttons
        this.checkButtonClick(x, y);
    }
    
    handleWheel(e) {
        if (!this.isOpen) return;
        
        // Scroll upgrade list
        const scrollAmount = e.deltaY * 0.5;
        this.scrollOffset = Math.max(0, Math.min(this.maxScroll, this.scrollOffset + scrollAmount));
        e.preventDefault();
    }
    
    update(deltaTime) {
        if (!this.isOpen && this.transitions.openProgress <= 0) return;
        
        this.animationTime += deltaTime;
        
        // Update open transition
        if (this.isOpen && this.transitions.openProgress < 1) {
            this.transitions.openProgress += deltaTime * 0.005;
            this.transitions.openProgress = Math.min(1, this.transitions.openProgress);
        } else if (!this.isOpen && this.transitions.openProgress > 0) {
            this.transitions.openProgress -= deltaTime * 0.005;
            this.transitions.openProgress = Math.max(0, this.transitions.openProgress);
        }
        
        // Update category change animation
        if (this.transitions.categoryChange > 0) {
            this.transitions.categoryChange -= deltaTime * 0.003;
            this.transitions.categoryChange = Math.max(0, this.transitions.categoryChange);
        }
        
        // Update purchase effects
        this.transitions.purchaseEffect = this.transitions.purchaseEffect.filter(effect => {
            effect.lifetime -= deltaTime;
            return effect.lifetime > 0;
        });
    }
    
    render() {
        if (this.transitions.openProgress <= 0) return;
        
        const ctx = this.ctx;
        const alpha = this.easeInOutCubic(this.transitions.openProgress);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Render background overlay
        this.renderBackground();
        
        // Render main shop panel
        this.renderShopPanel();
        
        // Render category tabs
        this.renderCategoryTabs();
        
        // Render upgrade grid
        this.renderUpgradeGrid();
        
        // Render selected upgrade details
        if (this.selectedUpgrade) {
            this.renderUpgradeDetails();
        }
        
        // Render player info
        this.renderPlayerInfo();
        
        // Render comparison panel if active
        if (this.comparisonMode && this.compareUpgrade) {
            this.renderComparisonPanel();
        }
        
        // Render purchase effects
        this.renderPurchaseEffects();
        
        // Render tooltips
        this.renderTooltips();
        
        ctx.restore();
    }
    
    renderBackground() {
        const ctx = this.ctx;
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    renderShopPanel() {
        const ctx = this.ctx;
        const panelX = this.layout.padding;
        const panelY = this.layout.padding;
        const panelWidth = this.canvas.width - this.layout.padding * 2;
        const panelHeight = this.canvas.height - this.layout.padding * 2;
        
        // Panel background
        ctx.fillStyle = this.colors.panel;
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // Panel border
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Title
        ctx.font = this.fonts.title;
        ctx.fillStyle = this.colors.primary;
        ctx.textAlign = 'center';
        ctx.fillText('UPGRADE SHOP', this.canvas.width / 2, panelY + 40);
        
        // Close button
        ctx.font = this.fonts.subtitle;
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'right';
        ctx.fillText('✕', panelX + panelWidth - 20, panelY + 35);
    }
    
    renderCategoryTabs() {
        const ctx = this.ctx;
        const startX = this.layout.padding + 20;
        const y = this.layout.padding + 60;
        const categories = ['ALL', 'OFFENSE', 'DEFENSE', 'MOBILITY', 'SUSTAIN', 'UTILITY'];
        
        categories.forEach((category, index) => {
            const x = startX + index * 120;
            const isActive = this.currentCategory === category;
            
            // Tab background
            if (isActive) {
                ctx.fillStyle = this.colors.primary;
                ctx.fillRect(x, y, 110, this.layout.categoryHeight);
            } else {
                ctx.strokeStyle = this.colors.secondary;
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, 110, this.layout.categoryHeight);
            }
            
            // Tab text
            ctx.font = this.fonts.small;
            ctx.fillStyle = isActive ? this.colors.background : this.colors.text;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Category icon
            const categoryData = this.upgradeSystem.categories[category];
            const icon = categoryData?.icon || '📦';
            const text = categoryData?.name || category;
            
            ctx.fillText(icon + ' ' + text, x + 55, y + this.layout.categoryHeight / 2);
        });
    }
    
    renderUpgradeGrid() {
        const ctx = this.ctx;
        const startX = this.layout.padding + 20;
        const startY = this.layout.padding + 130;
        const gridWidth = this.canvas.width - this.layout.padding * 2 - this.layout.detailsWidth - 40;
        const gridHeight = this.canvas.height - startY - this.layout.padding - 100;
        
        // Grid background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
        ctx.fillRect(startX, startY, gridWidth, gridHeight);
        
        // Get filtered upgrades
        const upgrades = this.getFilteredUpgrades();
        
        // Calculate grid layout
        const itemWidth = (gridWidth - 20) / this.layout.itemsPerRow - 10;
        const itemHeight = this.layout.itemHeight;
        
        // Render upgrade items
        ctx.save();
        ctx.beginPath();
        ctx.rect(startX, startY, gridWidth, gridHeight);
        ctx.clip();
        
        upgrades.forEach((upgrade, index) => {
            const row = Math.floor(index / this.layout.itemsPerRow);
            const col = index % this.layout.itemsPerRow;
            const x = startX + 10 + col * (itemWidth + 10);
            const y = startY + 10 + row * (itemHeight + 10) - this.scrollOffset;
            
            // Skip if outside visible area
            if (y + itemHeight < startY || y > startY + gridHeight) return;
            
            this.renderUpgradeItem(upgrade, x, y, itemWidth, itemHeight);
        });
        
        ctx.restore();
        
        // Calculate max scroll
        const totalRows = Math.ceil(upgrades.length / this.layout.itemsPerRow);
        const contentHeight = totalRows * (itemHeight + 10);
        this.maxScroll = Math.max(0, contentHeight - gridHeight);
        
        // Render scrollbar if needed
        if (this.maxScroll > 0) {
            this.renderScrollbar(startX + gridWidth - 10, startY, 8, gridHeight);
        }
    }
    
    renderUpgradeItem(upgrade, x, y, width, height) {
        const ctx = this.ctx;
        const isSelected = this.selectedUpgrade?.id === upgrade.id;
        const isPurchased = upgrade.purchased;
        const isEquipped = upgrade.equipped;
        const canAfford = this.progressionSystem.playerData.credits >= upgrade.cost;
        
        // Item background
        let bgColor = this.colors.panel;
        if (isSelected) bgColor = this.colors.secondary;
        if (isPurchased) bgColor = 'rgba(16, 185, 129, 0.2)';
        if (isEquipped) bgColor = 'rgba(251, 191, 36, 0.2)';
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, width, height);
        
        // Item border
        let borderColor = this.colors.secondary;
        if (isSelected) borderColor = this.colors.primary;
        if (isPurchased) borderColor = this.colors.success;
        if (isEquipped) borderColor = this.colors.equipped;
        if (!canAfford && !isPurchased) borderColor = this.colors.locked;
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(x, y, width, height);
        
        // Tier indicator
        const tierColor = [this.colors.tier1, this.colors.tier2, this.colors.tier3][upgrade.tier - 1] || this.colors.tier1;
        ctx.fillStyle = tierColor;
        ctx.fillRect(x, y, 4, height);
        
        // Upgrade name
        ctx.font = this.fonts.small;
        ctx.fillStyle = canAfford || isPurchased ? this.colors.text : this.colors.locked;
        ctx.textAlign = 'left';
        ctx.fillText(upgrade.name, x + 10, y + 20);
        
        // Category
        ctx.font = this.fonts.tiny;
        ctx.fillStyle = this.colors.textDim;
        ctx.fillText(upgrade.category, x + 10, y + 38);
        
        // Cost
        if (!isPurchased) {
            ctx.font = this.fonts.small;
            ctx.fillStyle = canAfford ? this.colors.success : this.colors.error;
            ctx.textAlign = 'right';
            ctx.fillText(`💰 ${upgrade.cost}`, x + width - 10, y + 20);
        } else {
            // Owned indicator
            ctx.font = this.fonts.small;
            ctx.fillStyle = this.colors.success;
            ctx.textAlign = 'right';
            ctx.fillText('✓ Owned', x + width - 10, y + 20);
            
            if (isEquipped) {
                ctx.fillStyle = this.colors.equipped;
                ctx.fillText('⚡ Equipped', x + width - 10, y + 38);
            }
        }
        
        // Stack indicator if applicable
        if (upgrade.stacks > 0 && upgrade.maxStacks > 1) {
            ctx.font = this.fonts.tiny;
            ctx.fillStyle = this.colors.text;
            ctx.textAlign = 'center';
            ctx.fillText(`${upgrade.stacks}/${upgrade.maxStacks}`, x + width / 2, y + height - 10);
        }
        
        // Lock indicator if requirements not met
        if (!upgrade.canPurchase && !isPurchased) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x, y, width, height);
            
            ctx.font = this.fonts.small;
            ctx.fillStyle = this.colors.locked;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔒', x + width / 2, y + height / 2);
            
            if (upgrade.requirements?.level) {
                ctx.font = this.fonts.tiny;
                ctx.fillText(`Lvl ${upgrade.requirements.level}`, x + width / 2, y + height / 2 + 20);
            }
        }
    }
    
    renderUpgradeDetails() {
        const ctx = this.ctx;
        const upgrade = this.selectedUpgrade;
        const x = this.canvas.width - this.layout.detailsWidth - this.layout.padding;
        const y = this.layout.padding + 130;
        const width = this.layout.detailsWidth - 20;
        const height = this.canvas.height - y - this.layout.padding - 100;
        
        // Details panel background
        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.fillRect(x, y, width, height);
        
        // Details panel border
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        
        // Upgrade name
        ctx.font = this.fonts.subtitle;
        ctx.fillStyle = this.colors.primary;
        ctx.textAlign = 'left';
        ctx.fillText(upgrade.name, x + 15, y + 30);
        
        // Tier and category
        const tierColor = [this.colors.tier1, this.colors.tier2, this.colors.tier3][upgrade.tier - 1] || this.colors.tier1;
        ctx.font = this.fonts.small;
        ctx.fillStyle = tierColor;
        ctx.fillText(`Tier ${upgrade.tier} • ${upgrade.category}`, x + 15, y + 55);
        
        // Description
        ctx.font = this.fonts.small;
        ctx.fillStyle = this.colors.text;
        const descLines = this.wrapText(upgrade.description, width - 30);
        descLines.forEach((line, index) => {
            ctx.fillText(line, x + 15, y + 85 + index * 20);
        });
        
        // Effects
        ctx.font = this.fonts.small;
        ctx.fillStyle = this.colors.success;
        ctx.fillText('Effects:', x + 15, y + 140);
        
        let effectY = y + 165;
        for (const [effect, value] of Object.entries(upgrade.effects)) {
            const effectText = this.formatEffect(effect, value);
            ctx.fillStyle = this.colors.text;
            ctx.fillText('• ' + effectText, x + 25, effectY);
            effectY += 22;
        }
        
        // Requirements
        if (upgrade.requirements) {
            ctx.font = this.fonts.small;
            ctx.fillStyle = this.colors.warning;
            ctx.fillText('Requirements:', x + 15, effectY + 20);
            
            effectY += 45;
            if (upgrade.requirements.level) {
                const hasLevel = this.progressionSystem.playerData.level >= upgrade.requirements.level;
                ctx.fillStyle = hasLevel ? this.colors.success : this.colors.error;
                ctx.fillText(`• Level ${upgrade.requirements.level}`, x + 25, effectY);
                effectY += 22;
            }
            
            if (upgrade.requirements.prerequisite) {
                const hasPrereq = this.upgradeSystem.purchasedUpgrades.has(upgrade.requirements.prerequisite);
                ctx.fillStyle = hasPrereq ? this.colors.success : this.colors.error;
                ctx.fillText(`• Requires: ${upgrade.requirements.prerequisite}`, x + 25, effectY);
                effectY += 22;
            }
        }
        
        // Action buttons
        const buttonY = y + height - 60;
        const buttonWidth = (width - 45) / 2;
        
        if (!upgrade.purchased) {
            // Purchase button
            const canAfford = this.progressionSystem.playerData.credits >= upgrade.cost;
            ctx.fillStyle = canAfford ? this.colors.success : this.colors.locked;
            ctx.fillRect(x + 15, buttonY, buttonWidth, 40);
            
            ctx.font = this.fonts.normal;
            ctx.fillStyle = this.colors.background;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Purchase', x + 15 + buttonWidth / 2, buttonY + 20);
        } else {
            // Equip/Unequip button
            const isEquipped = upgrade.equipped;
            ctx.fillStyle = isEquipped ? this.colors.warning : this.colors.primary;
            ctx.fillRect(x + 15, buttonY, buttonWidth, 40);
            
            ctx.font = this.fonts.normal;
            ctx.fillStyle = this.colors.background;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(isEquipped ? 'Unequip' : 'Equip', x + 15 + buttonWidth / 2, buttonY + 20);
            
            // Refund button
            ctx.fillStyle = this.colors.error;
            ctx.fillRect(x + 25 + buttonWidth, buttonY, buttonWidth, 40);
            
            ctx.fillStyle = this.colors.background;
            ctx.fillText('Refund (70%)', x + 25 + buttonWidth + buttonWidth / 2, buttonY + 20);
        }
    }
    
    renderPlayerInfo() {
        const ctx = this.ctx;
        const x = this.layout.padding + 20;
        const y = this.canvas.height - 80;
        
        // Player stats background
        ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.fillRect(x, y, 400, 60);
        
        // Credits
        ctx.font = this.fonts.normal;
        ctx.fillStyle = this.colors.success;
        ctx.textAlign = 'left';
        ctx.fillText(`💰 Credits: ${this.progressionSystem.playerData.credits}`, x + 15, y + 25);
        
        // Level
        ctx.fillStyle = this.colors.primary;
        ctx.fillText(`⭐ Level: ${this.progressionSystem.playerData.level}`, x + 15, y + 45);
        
        // Total upgrades owned
        const totalOwned = this.upgradeSystem.getPurchasedUpgrades().length;
        ctx.fillStyle = this.colors.text;
        ctx.fillText(`📦 Upgrades Owned: ${totalOwned}`, x + 200, y + 25);
        
        // Total value
        const totalValue = this.upgradeSystem.getTotalUpgradeValue();
        ctx.fillStyle = this.colors.textDim;
        ctx.fillText(`💎 Total Value: ${totalValue}`, x + 200, y + 45);
    }
    
    renderComparisonPanel() {
        // Implementation for comparison panel
        const ctx = this.ctx;
        const x = this.canvas.width / 2 - 200;
        const y = 200;
        
        ctx.fillStyle = this.colors.panel;
        ctx.fillRect(x, y, 400, 300);
        
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 400, 300);
        
        ctx.font = this.fonts.subtitle;
        ctx.fillStyle = this.colors.primary;
        ctx.textAlign = 'center';
        ctx.fillText('COMPARISON', x + 200, y + 30);
        
        // Compare selected vs compare upgrade
        // ... comparison details ...
    }
    
    renderPurchaseEffects() {
        const ctx = this.ctx;
        
        this.transitions.purchaseEffect.forEach(effect => {
            const alpha = effect.lifetime / 1000;
            ctx.save();
            ctx.globalAlpha = alpha;
            
            ctx.font = this.fonts.subtitle;
            ctx.fillStyle = effect.success ? this.colors.success : this.colors.error;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const y = effect.y - (1 - alpha) * 50;
            ctx.fillText(effect.text, effect.x, y);
            
            ctx.restore();
        });
    }
    
    renderScrollbar(x, y, width, height) {
        const ctx = this.ctx;
        
        // Scrollbar track
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.fillRect(x, y, width, height);
        
        // Scrollbar thumb
        if (this.maxScroll > 0) {
            const thumbHeight = Math.max(20, (height / (this.maxScroll + height)) * height);
            const thumbY = y + (this.scrollOffset / this.maxScroll) * (height - thumbHeight);
            
            ctx.fillStyle = this.colors.primary;
            ctx.fillRect(x, thumbY, width, thumbHeight);
        }
    }
    
    renderTooltips() {
        // Render any active tooltips
        if (this.mouseX && this.mouseY) {
            // Check if hovering over something that needs a tooltip
            // ... tooltip rendering ...
        }
    }
    
    // Helper methods
    getFilteredUpgrades() {
        let upgrades = this.upgradeSystem.getAvailableUpgrades(this.progressionSystem);
        
        // Filter by category
        if (this.currentCategory !== 'ALL') {
            upgrades = upgrades.filter(u => u.category === this.currentCategory);
        }
        
        // Apply other filters
        if (this.filters.affordable) {
            upgrades = upgrades.filter(u => u.cost <= this.progressionSystem.playerData.credits);
        }
        
        if (this.filters.owned) {
            upgrades = upgrades.filter(u => u.purchased);
        }
        
        if (this.filters.equipped) {
            upgrades = upgrades.filter(u => u.equipped);
        }
        
        // Sort
        upgrades.sort((a, b) => {
            switch(this.sortBy) {
                case 'COST':
                    return a.cost - b.cost;
                case 'NAME':
                    return a.name.localeCompare(b.name);
                case 'CATEGORY':
                    return a.category.localeCompare(b.category);
                case 'TIER':
                default:
                    return a.tier - b.tier;
            }
        });
        
        return upgrades;
    }
    
    formatEffect(effect, value) {
        const formatMap = {
            damageMultiplier: `+${Math.round(value * 100)}% Damage`,
            speedMultiplier: `+${Math.round(value * 100)}% Speed`,
            healthMultiplier: `+${Math.round(value * 100)}% Health`,
            damageReduction: `${Math.round(value * 100)}% Damage Reduction`,
            fireRateMultiplier: `${Math.round(value * 100)}% Faster Fire Rate`,
            critChance: `+${Math.round(value * 100)}% Critical Chance`,
            lifesteal: `${Math.round(value * 100)}% Lifesteal`,
            shieldCapacity: `${Math.round(value * 100)}% Shield Capacity`,
            healthRegen: `${value} HP/sec Regeneration`
        };
        
        return formatMap[effect] || `${effect}: ${value}`;
    }
    
    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        const ctx = this.ctx;
        ctx.font = this.fonts.small;
        
        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }
    
    cycleCategory() {
        const categories = ['ALL', 'OFFENSE', 'DEFENSE', 'MOBILITY', 'SUSTAIN', 'UTILITY'];
        const currentIndex = categories.indexOf(this.currentCategory);
        this.currentCategory = categories[(currentIndex + 1) % categories.length];
        this.transitions.categoryChange = 1;
        this.scrollOffset = 0;
        this.refreshUpgradeList();
    }
    
    toggleComparisonMode() {
        this.comparisonMode = !this.comparisonMode;
        if (!this.comparisonMode) {
            this.compareUpgrade = null;
        }
    }
    
    purchaseUpgrade(upgrade) {
        const result = this.upgradeSystem.purchaseUpgrade(upgrade.id, this.progressionSystem);
        
        if (result.success) {
            this.transitions.purchaseEffect.push({
                text: '✓ Purchased!',
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                lifetime: 1500,
                success: true
            });
            
            this.purchaseHistory.push({
                upgrade: upgrade,
                timestamp: Date.now(),
                cost: upgrade.cost
            });
            
            this.refreshUpgradeList();
        } else {
            this.transitions.purchaseEffect.push({
                text: '✗ ' + result.error,
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                lifetime: 1500,
                success: false
            });
        }
    }
    
    refundUpgrade(upgrade) {
        const result = this.upgradeSystem.refundUpgrade(upgrade.id, this.progressionSystem);
        
        if (result.success) {
            this.transitions.purchaseEffect.push({
                text: `✓ Refunded ${result.refundAmount} credits!`,
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                lifetime: 1500,
                success: true
            });
            
            this.refreshUpgradeList();
        }
    }
    
    equipUpgrade(upgrade) {
        const result = this.upgradeSystem.equipUpgrade(this.selectedBot, upgrade.id);
        
        if (result.success) {
            this.refreshUpgradeList();
        }
    }
    
    unequipUpgrade(upgrade) {
        const result = this.upgradeSystem.unequipUpgrade(this.selectedBot, upgrade.id);
        
        if (result.success) {
            this.refreshUpgradeList();
        }
    }
    
    checkCategoryClick(x, y) {
        const startX = this.layout.padding + 20;
        const tabY = this.layout.padding + 60;
        const categories = ['ALL', 'OFFENSE', 'DEFENSE', 'MOBILITY', 'SUSTAIN', 'UTILITY'];
        
        categories.forEach((category, index) => {
            const tabX = startX + index * 120;
            
            if (x >= tabX && x <= tabX + 110 &&
                y >= tabY && y <= tabY + this.layout.categoryHeight) {
                this.currentCategory = category;
                this.transitions.categoryChange = 1;
                this.scrollOffset = 0;
                this.refreshUpgradeList();
            }
        });
    }
    
    checkUpgradeClick(x, y) {
        const startX = this.layout.padding + 20;
        const startY = this.layout.padding + 130;
        const gridWidth = this.canvas.width - this.layout.padding * 2 - this.layout.detailsWidth - 40;
        const itemWidth = (gridWidth - 20) / this.layout.itemsPerRow - 10;
        const itemHeight = this.layout.itemHeight;
        
        const upgrades = this.getFilteredUpgrades();
        
        upgrades.forEach((upgrade, index) => {
            const row = Math.floor(index / this.layout.itemsPerRow);
            const col = index % this.layout.itemsPerRow;
            const itemX = startX + 10 + col * (itemWidth + 10);
            const itemY = startY + 10 + row * (itemHeight + 10) - this.scrollOffset;
            
            if (x >= itemX && x <= itemX + itemWidth &&
                y >= itemY && y <= itemY + itemHeight) {
                this.selectedUpgrade = upgrade;
                
                if (this.comparisonMode && this.selectedUpgrade !== this.compareUpgrade) {
                    this.compareUpgrade = this.selectedUpgrade;
                }
            }
        });
    }
    
    checkButtonClick(x, y) {
        if (!this.selectedUpgrade) return;
        
        const detailsX = this.canvas.width - this.layout.detailsWidth - this.layout.padding;
        const buttonY = this.canvas.height - this.layout.padding - 160;
        const buttonWidth = (this.layout.detailsWidth - 65) / 2;
        
        // Purchase button
        if (!this.selectedUpgrade.purchased) {
            if (x >= detailsX + 15 && x <= detailsX + 15 + buttonWidth &&
                y >= buttonY && y <= buttonY + 40) {
                this.purchaseUpgrade(this.selectedUpgrade);
            }
        } else {
            // Equip/Unequip button
            if (x >= detailsX + 15 && x <= detailsX + 15 + buttonWidth &&
                y >= buttonY && y <= buttonY + 40) {
                if (this.selectedUpgrade.equipped) {
                    this.unequipUpgrade(this.selectedUpgrade);
                } else {
                    this.equipUpgrade(this.selectedUpgrade);
                }
            }
            
            // Refund button
            if (x >= detailsX + 25 + buttonWidth && x <= detailsX + 25 + buttonWidth * 2 &&
                y >= buttonY && y <= buttonY + 40) {
                this.refundUpgrade(this.selectedUpgrade);
            }
        }
    }
    
    updateHoverStates() {
        // Update hover effects based on mouse position
        // This would update visual feedback for hovering
    }
    
    refreshUpgradeList() {
        // Force refresh of upgrade list from systems
        this.selectedUpgrade = null;
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}

// Export default
export default ShopSystem;